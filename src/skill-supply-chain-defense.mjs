import { createHash } from "node:crypto";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import path from "node:path";

const DEFAULTS = Object.freeze({
  maxFiles: 256,
  maxTotalBytes: 4_194_304,
  maxFileBytes: 524_288,
});

const SEVERITY_ORDER = Object.freeze({ critical: 0, high: 1, medium: 2, low: 3 });

function lexicalCompare(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export function stableSkillScanDigest(scanWithoutDigest) {
  const { root: _root, scanDigest: _scanDigest, ...portable } = scanWithoutDigest;
  return sha256(JSON.stringify(canonical(portable)));
}

function optionsWithDefaults(options) {
  const values = {
    maxFiles: options.maxFiles ?? DEFAULTS.maxFiles,
    maxTotalBytes: options.maxTotalBytes ?? DEFAULTS.maxTotalBytes,
    maxFileBytes: options.maxFileBytes ?? DEFAULTS.maxFileBytes,
  };
  for (const name of ["maxFiles", "maxTotalBytes", "maxFileBytes"]) {
    if (!Number.isInteger(values[name]) || values[name] < 1) {
      throw new Error(`${name} must be a positive integer`);
    }
  }
  return values;
}

function relativePath(root, target) {
  const relative = path.relative(root, target);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`path escapes canonical skill root: ${target}`);
  }
  return relative.split(path.sep).join("/");
}

function assertCanonicalChild(root, target) {
  const relative = path.relative(root, target);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`resolved path escapes canonical skill root: ${target}`);
  }
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size &&
    left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

export function verifyStableFileSet(initialRows, finalRows) {
  const initial = [...initialRows].sort((left, right) => lexicalCompare(left.path, right.path));
  const final = [...finalRows].sort((left, right) => lexicalCompare(left.path, right.path));
  if (initial.length !== final.length) throw new Error("file set changed during scan");
  for (let index = 0; index < initial.length; index += 1) {
    if (initial[index].path !== final[index].path ||
        initial[index].absolute !== final[index].absolute ||
        !sameIdentity(initial[index].identity, final[index].identity)) {
      throw new Error(`file set changed during scan: ${initial[index].path}`);
    }
  }
}

async function collectFiles(root, limits) {
  const files = [];
  let totalBytes = 0;

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => lexicalCompare(left.name, right.name));
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name === ".git") continue;
      const target = path.join(directory, entry.name);
      const relative = relativePath(root, target);
      const metadata = await lstat(target);
      if (entry.isSymbolicLink() || metadata.isSymbolicLink()) throw new Error(`symbolic links are prohibited: ${relative}`);
      const canonicalTarget = await realpath(target);
      assertCanonicalChild(root, canonicalTarget);
      const confirmed = await lstat(target);
      if (!sameIdentity(metadata, confirmed)) throw new Error(`path changed during scan: ${relative}`);
      if (entry.isDirectory() && metadata.isDirectory()) {
        await visit(canonicalTarget);
        continue;
      }
      if (!entry.isFile() || !metadata.isFile()) throw new Error(`special files are prohibited: ${relative}`);
      if (metadata.size > limits.maxFileBytes) {
        throw new Error(`file byte budget exceeded: ${relative}`);
      }
      totalBytes += metadata.size;
      if (totalBytes > limits.maxTotalBytes) throw new Error("total byte budget exceeded");
      files.push({
        absolute: canonicalTarget,
        lexicalAbsolute: target,
        path: relative,
        bytes: metadata.size,
        identity: metadata,
      });
      if (files.length > limits.maxFiles) throw new Error("file count budget exceeded");
    }
  }

  await visit(root);
  return { files, totalBytes };
}

function linesFor(text) {
  return text.split(/\r\n|\n|\r/);
}

function lineEvidence(text, pattern, fallback) {
  const lines = linesFor(text);
  const index = lines.findIndex((line) => pattern.test(line));
  pattern.lastIndex = 0;
  if (index < 0) return { line: null, evidence: fallback };
  return { line: index + 1, evidence: fallback };
}

function finding(ruleId, severity, file, detail, evidencePattern) {
  const { line, evidence } = lineEvidence(file.text, evidencePattern, detail);
  return { ruleId, severity, path: file.path, line, evidence };
}

function has(text, pattern) {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

function inspectFile(file) {
  const text = file.text;
  const findings = [];
  const surfaces = new Set();
  const shell = has(text, /\b(?:subprocess\.|child_process|shell\s*=\s*true|powershell|cmd\.exe|bash\s+-c)\b/i);
  const network = has(text, /\b(?:fetch\s*\(|https?:\/\/|requests?\.|axios\.|curl\b|wget\b|httpx\.)/i);
  const externalWrite = has(text, /\b(?:method\s*:\s*["'](?:post|put|patch|delete)|upload|webhook|send\s*\(|requests?\.(?:post|put|patch|delete))/i);
  const credential = has(text, /\b(?:process\.env\.[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)|\.aws\/credentials|git-credentials|session[_ -]?cookie|private[_ -]?key|client[_ -]?secret)\b/i);
  const dynamicExecution = has(text, /\b(?:eval|exec)\s*\(|new\s+Function\s*\(|child_process\.(?:exec|spawn)\s*\(/i);
  const obfuscation = has(text, /\b(?:b64decode|base64\.decode|fromCharCode|Buffer\.from\s*\([^)]*["']base64["']|decode\s*\([^)]*(?:hex|base64))/i);
  const remoteAcquisition = has(text, /\b(?:curl|wget)\b[^\n|;]*(?:https?:\/\/)|\b(?:fetch|requests?\.get|httpx\.get)\s*\([^\n]*(?:https?:\/\/)/i);
  const persistence = has(text, /\b(?:schtasks|crontab|launchctl|startup|autorun|currentversion\\run|shell[_ -]?profile|\.bashrc|\.zshrc|self[_ -]?rewrite)\b/i);
  const destructive = has(text, /\b(?:rm\s+-rf|remove-item\b[^\n]*(?:-recurse|-force)|format\s+[a-z]:|rmdir\s+\/s|del\s+\/f)\b/i);
  const promptAttack = has(text, /\bignore\s+(?:all\s+)?(?:previous|system|developer)\s+(?:instructions?|messages?)\b|\breveal\s+(?:the\s+)?(?:hidden\s+)?system\s+prompt\b/i);

  if (shell || dynamicExecution) surfaces.add("shell");
  if (network) surfaces.add("network");
  if (externalWrite) surfaces.add("external-write");
  if (credential) surfaces.add("credentials");
  if (persistence) surfaces.add("persistence");
  if (destructive) surfaces.add("destructive");
  if (promptAttack) surfaces.add("prompt-boundary");

  if (obfuscation && dynamicExecution) {
    findings.push(finding(
      "EXE-OBFUSCATED-PAYLOAD",
      "critical",
      file,
      "decoded or obfuscated content reaches dynamic execution",
      /(?:b64decode|base64|eval|exec)/i,
    ));
  }
  if (remoteAcquisition && (shell || dynamicExecution)) {
    findings.push(finding(
      "EXE-DOWNLOAD-AND-EXECUTE",
      "critical",
      file,
      "remote acquisition and command execution occur in the same file",
      /(?:curl|wget|fetch|requests?|exec|subprocess|child_process)/i,
    ));
  }
  if (credential && network && externalWrite) {
    findings.push(finding(
      "DATA-CREDENTIAL-EXFILTRATION",
      "critical",
      file,
      "redacted sensitive credential source and outbound transmission occur in the same file",
      /(?:process\.env|credentials?|fetch|post|send)/i,
    ));
  }
  if (promptAttack) {
    findings.push(finding(
      "PROMPT-BOUNDARY-ATTACK",
      "critical",
      file,
      "instructions attempt to replace governing prompts or extract hidden instructions",
      /(?:ignore|reveal)/i,
    ));
  }
  if (persistence) {
    findings.push(finding(
      "PERSISTENCE-SURFACE",
      "high",
      file,
      "startup or cross-session persistence behavior requires explicit review",
      /(?:schtasks|crontab|launchctl|startup|autorun|profile|bashrc|zshrc)/i,
    ));
  }
  if (destructive) {
    findings.push(finding(
      "DESTRUCTIVE-SURFACE",
      "high",
      file,
      "broad destructive command behavior requires explicit review",
      /(?:rm|remove-item|format|rmdir|del)/i,
    ));
  }
  if ((shell || network || externalWrite || credential) && findings.length === 0) {
    findings.push(finding(
      "SENSITIVE-CAPABILITY",
      "medium",
      file,
      "sensitive execution, network, external-write, or credential behavior requires semantic review",
      /(?:subprocess|child_process|fetch|https?|requests?|credential|process\.env)/i,
    ));
  }
  return { findings, surfaces: [...surfaces] };
}

function declaredText(files) {
  const skill = files.find((file) => file.path.toLowerCase() === "skill.md");
  return skill?.text?.toLowerCase() ?? "";
}

function purposeMismatch(declared, surfaces) {
  const undeclared = [];
  const vocabulary = {
    shell: /\b(?:shell|command|terminal|deploy|script|subprocess)\b/,
    network: /\b(?:network|internet|web|http|api|remote|download|upload|deploy)\b/,
    "external-write": /\b(?:post|publish|send|upload|deploy|external|webhook)\b/,
    credentials: /\b(?:credential|secret|token|password|key|login|auth)\b/,
    persistence: /\b(?:persist|startup|schedule|profile|session)\b/,
    destructive: /\b(?:delete|remove|destroy|format|cleanup)\b/,
  };
  for (const surface of surfaces) {
    if (vocabulary[surface] && !vocabulary[surface].test(declared)) undeclared.push(surface);
  }
  return undeclared.sort();
}

export function classifySkillEvidence({ findings }) {
  if (findings.some(({ severity }) => severity === "critical")) {
    return { disposition: "reject-before-indexing", requiredReview: "reject" };
  }
  if (findings.some(({ severity }) => severity === "high" || severity === "medium")) {
    return { disposition: "manual-review-required", requiredReview: "semantic" };
  }
  return { disposition: "clear-for-semantic-review", requiredReview: "semantic" };
}

const REVIEW_VOCABULARY = Object.freeze({
  purposeFit: ["matches", "mismatch", "uncertain"],
  permissionFit: ["bounded", "excessive", "undeclared", "uncertain"],
  externalTransmission: ["none", "documented-bounded", "unexplained", "uncertain"],
  execution: ["none", "documented-local", "hidden", "uncertain"],
  persistence: ["none", "documented-bounded", "hidden", "uncertain"],
  promptBehavior: ["bounded", "hostile", "uncertain"],
  triggerScope: ["bounded", "broad", "uncertain"],
  dependencies: ["reviewed", "unreviewed", "uncertain"],
  userControl: ["explicit", "partial", "absent", "uncertain"],
});

function validateSemanticReview(review) {
  if (!review || review.schemaVersion !== 1) throw new Error("review.schemaVersion must be 1");
  if (!/^[a-f0-9]{64}$/.test(review.scanDigest ?? "")) {
    throw new Error("review.scanDigest must be a lowercase SHA-256 digest");
  }
  if (!Array.isArray(review.bodyDigests)) throw new Error("review.bodyDigests must be an array");
  for (const [field, allowed] of Object.entries(REVIEW_VOCABULARY)) {
    if (!allowed.includes(review[field])) {
      throw new Error(`review.${field} must be one of: ${allowed.join(", ")}`);
    }
  }
  if (!Array.isArray(review.unresolved) || review.unresolved.some((value) => typeof value !== "string" || value.trim() === "")) {
    throw new Error("review.unresolved must be an array of non-empty strings");
  }
  return review;
}

function normalizedBodyDigests(rows) {
  return rows
    .map((row) => ({ path: row.path, sha256: row.sha256 }))
    .sort((left, right) => lexicalCompare(left.path, right.path));
}

function reconcileVerifiedSkillReview(scan, reviewValue) {
  if (!scan || scan.schemaVersion !== 1) throw new Error("scan.schemaVersion must be 1");
  if (stableSkillScanDigest(scan) !== scan.scanDigest) throw new Error("scan digest does not reconcile");
  const review = validateSemanticReview(reviewValue);
  if (review.scanDigest !== scan.scanDigest) throw new Error("stale semantic review scan digest");
  const expectedBodies = normalizedBodyDigests(scan.manifest);
  const reviewedBodies = normalizedBodyDigests(review.bodyDigests);
  if (JSON.stringify(expectedBodies) !== JSON.stringify(reviewedBodies)) {
    throw new Error("stale semantic review body digest");
  }

  const reasons = [];
  const blocking = [];
  if (scan.disposition === "reject-before-indexing") blocking.push("static scan rejected source");
  if (review.purposeFit === "mismatch") blocking.push("declared purpose does not match behavior");
  if (review.permissionFit === "excessive") blocking.push("requested permissions exceed declared purpose");
  if (review.externalTransmission === "unexplained") blocking.push("external transmission is unexplained");
  if (review.execution === "hidden") blocking.push("execution behavior is hidden");
  if (review.persistence === "hidden") blocking.push("persistence behavior is hidden");
  if (review.promptBehavior === "hostile") blocking.push("prompt behavior is hostile");
  if (review.userControl === "absent") blocking.push("sensitive behavior lacks user control");

  const uncertainFields = Object.keys(REVIEW_VOCABULARY)
    .filter((field) => ["uncertain", "unreviewed", "undeclared", "broad", "partial"].includes(review[field]));
  const unresolved = [...new Set([...review.unresolved, ...uncertainFields.map((field) => `review:${field}`)])].sort();
  let verdict;
  let promotionEligible;
  if (blocking.length > 0) {
    verdict = "REJECT";
    promotionEligible = false;
    reasons.push(...blocking);
  } else if (scan.disposition === "manual-review-required" || unresolved.length > 0) {
    verdict = "CAUTION";
    promotionEligible = unresolved.length === 0;
    reasons.push(scan.disposition === "manual-review-required"
      ? "documented sensitive behavior remains explicitly bounded"
      : "semantic review retains unresolved boundaries");
  } else {
    verdict = "APPROVE";
    promotionEligible = true;
    reasons.push("static evidence and exact semantic review are bounded");
  }

  const decision = {
    schemaVersion: 1,
    scanDigest: scan.scanDigest,
    bodyDigests: expectedBodies,
    verdict,
    promotionEligible,
    unresolved,
    reasons: [...new Set(reasons)].sort(),
  };
  return decision;
}

export function buildSkillLedgerRow(record, scan) {
  if (!record?.id || !record.repository || !record.head || !record.sourcePath || !record.bodySha256) {
    throw new Error("complete source record identity is required");
  }
  return {
    schemaVersion: 1,
    id: record.id,
    repository: record.repository,
    head: record.head,
    sourcePath: record.sourcePath,
    bodySha256: record.bodySha256,
    scanDigest: scan.scanDigest,
    disposition: scan.disposition,
    requiredReview: scan.requiredReview,
    surfaces: [...scan.surfaces].sort(lexicalCompare),
    findings: [...scan.findings].sort((left, right) =>
      lexicalCompare(left.ruleId, right.ruleId) ||
      lexicalCompare(left.path, right.path) ||
      (left.line ?? 0) - (right.line ?? 0)),
    ...(scan.scanError ? { scanError: scan.scanError } : {}),
  };
}

export async function reconcileSkillSource({ record, ledgerRow, review, scanOptions } = {}) {
  if (!record?.sourceAbsolutePath || record.inert !== true) throw new Error("an inert exact source record is required");
  const scan = await scanSkill(path.dirname(path.resolve(record.sourceAbsolutePath)), scanOptions);
  const sourceName = path.basename(record.sourceAbsolutePath).toLowerCase();
  const sourceBody = scan.manifest.find(({ path: filePath }) => filePath.toLowerCase() === sourceName);
  if (!sourceBody || sourceBody.bytes !== record.bodyBytes || sourceBody.sha256 !== record.bodySha256) {
    throw new Error("source record body does not reconcile with current bytes");
  }
  const expectedLedgerRow = buildSkillLedgerRow(record, scan);
  if (JSON.stringify(canonical(expectedLedgerRow)) !== JSON.stringify(canonical(ledgerRow))) {
    throw new Error("ledger row does not reconcile with current source scan");
  }
  const core = reconcileVerifiedSkillReview(scan, review);
  const decision = {
    ...core,
    sourceBinding: {
      id: record.id,
      repository: record.repository,
      head: record.head,
      sourcePath: record.sourcePath,
      bodySha256: record.bodySha256,
    },
    ledgerRowDigest: sha256(JSON.stringify(canonical(expectedLedgerRow))),
  };
  return { ...decision, decisionDigest: sha256(JSON.stringify(canonical(decision))) };
}

export async function gateSkillAdvancement({ record, ledgerRow, review, scanOptions } = {}) {
  if (!review) return { status: "blocked", reasons: ["semantic review is absent"] };
  try {
    const decision = await reconcileSkillSource({ record, ledgerRow, review, scanOptions });
    if (!decision.promotionEligible || decision.verdict === "REJECT") {
      return { status: "blocked", reasons: decision.reasons, decision };
    }
    return { status: "eligible", reasons: [], decision };
  } catch (error) {
    return { status: "blocked", reasons: [String(error?.message ?? error)] };
  }
}

export async function scanSkill(root, options = {}) {
  const limits = optionsWithDefaults(options);
  const canonicalRoot = await realpath(path.resolve(root));
  const { files: discovered, totalBytes } = await collectFiles(canonicalRoot, limits);
  const files = [];
  for (const row of discovered) {
    const currentLexical = await lstat(row.lexicalAbsolute);
    if (currentLexical.isSymbolicLink()) throw new Error(`symbolic links are prohibited: ${row.path}`);
    const currentCanonical = await realpath(row.lexicalAbsolute);
    assertCanonicalChild(canonicalRoot, currentCanonical);
    if (currentCanonical !== row.absolute || !sameIdentity(row.identity, currentLexical)) {
      throw new Error(`file changed during scan: ${row.path}`);
    }
    const handle = await open(row.absolute, "r");
    let bytes;
    try {
      const before = await handle.stat();
      if (!sameIdentity(row.identity, before)) throw new Error(`file changed during scan: ${row.path}`);
      bytes = await handle.readFile();
      const after = await handle.stat();
      if (!sameIdentity(before, after) || bytes.byteLength !== after.size) {
        throw new Error(`file changed during scan: ${row.path}`);
      }
    } finally {
      await handle.close();
    }
    const binary = bytes.includes(0);
    files.push({
      ...row,
      sha256: sha256(bytes),
      binary,
      text: binary ? "" : bytes.toString("utf8"),
    });
  }
  const finalDiscovery = await collectFiles(canonicalRoot, limits);
  verifyStableFileSet(discovered, finalDiscovery.files);
  if (finalDiscovery.totalBytes !== totalBytes) throw new Error("file set changed during scan");

  const findings = [];
  const surfaces = new Set();
  for (const file of files) {
    if (file.binary) {
      findings.push({
        ruleId: "STRUCT-BINARY-FILE",
        severity: "medium",
        path: file.path,
        line: null,
        evidence: "binary content requires manual review",
      });
      continue;
    }
    const inspected = inspectFile(file);
    inspected.findings.forEach((value) => findings.push(value));
    inspected.surfaces.forEach((value) => surfaces.add(value));
  }

  const sortedSurfaces = [...surfaces].sort();
  const undeclared = purposeMismatch(declaredText(files), sortedSurfaces);
  if (undeclared.length > 0) {
    findings.push({
      ruleId: "DECL-PURPOSE-MISMATCH",
      severity: "medium",
      path: "SKILL.md",
      line: null,
      evidence: `observed capabilities are not declared: ${undeclared.join(", ")}`,
    });
  }
  findings.sort((left, right) =>
    SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
    lexicalCompare(left.ruleId, right.ruleId) ||
    lexicalCompare(left.path, right.path) ||
    (left.line ?? 0) - (right.line ?? 0));
  const { disposition, requiredReview } = classifySkillEvidence({ findings });
  const manifest = files
    .map(({ path: filePath, bytes, sha256: digest, binary }) => ({
      path: filePath,
      bytes,
      sha256: digest,
      type: binary ? "binary" : "text",
    }))
    .sort((left, right) => lexicalCompare(left.path, right.path));
  const result = {
    schemaVersion: 1,
    root: canonicalRoot,
    manifest,
    findings,
    surfaces: sortedSurfaces,
    disposition,
    requiredReview,
    summary: {
      files: manifest.length,
      totalBytes,
      critical: findings.filter(({ severity }) => severity === "critical").length,
      high: findings.filter(({ severity }) => severity === "high").length,
      medium: findings.filter(({ severity }) => severity === "medium").length,
      low: findings.filter(({ severity }) => severity === "low").length,
    },
  };
  return { ...result, scanDigest: stableSkillScanDigest(result) };
}
