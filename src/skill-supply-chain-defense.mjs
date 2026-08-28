import { createHash } from "node:crypto";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
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
  const values = { ...DEFAULTS, ...options };
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

async function collectFiles(root, limits) {
  const files = [];
  let totalBytes = 0;

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => lexicalCompare(left.name, right.name));
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      const relative = relativePath(root, target);
      if (entry.isSymbolicLink()) throw new Error(`symbolic links are prohibited: ${relative}`);
      if (entry.isDirectory()) {
        await visit(target);
        continue;
      }
      if (!entry.isFile()) throw new Error(`special files are prohibited: ${relative}`);
      const metadata = await stat(target);
      if (metadata.size > limits.maxFileBytes) {
        throw new Error(`file byte budget exceeded: ${relative}`);
      }
      totalBytes += metadata.size;
      if (totalBytes > limits.maxTotalBytes) throw new Error("total byte budget exceeded");
      files.push({ absolute: target, path: relative, bytes: metadata.size });
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

export function reconcileSkillReview(scan, reviewValue) {
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
  return { ...decision, decisionDigest: sha256(JSON.stringify(canonical(decision))) };
}

export async function scanSkill(root, options = {}) {
  const limits = optionsWithDefaults(options);
  const canonicalRoot = await realpath(path.resolve(root));
  const { files: discovered, totalBytes } = await collectFiles(canonicalRoot, limits);
  const files = [];
  for (const row of discovered) {
    const bytes = await readFile(row.absolute);
    const binary = bytes.includes(0);
    files.push({
      ...row,
      sha256: sha256(bytes),
      binary,
      text: binary ? "" : bytes.toString("utf8"),
    });
  }

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
