import {
  canonicalDigest,
  exactKeys,
  nonEmptyString,
} from "./adaptive-evidence-contracts.mjs";
import {
  validateEvaluatorPackageReceipt,
  validateEvaluatorRequest,
  validateEvaluatorResult,
} from "./adaptive-evaluator-package.mjs";

export const AEGIS_EVALUATOR_V2_ID = "aegis-deterministic-verifier-v2";

const TOP_LEVEL_KEYS = Object.freeze(["schemaVersion", "findings", "summary"]);
const FINDING_KEYS = Object.freeze([
  "id",
  "title",
  "severity",
  "location",
  "evidence",
  "repair",
  "confidence",
]);
const ORACLE_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "taskDefinitionPath",
  "taskDefinitionSha256",
  "taskSourceSha256",
  "normalization",
  "scoring",
  "cases",
]);
const NORMALIZATION_KEYS = Object.freeze([
  "unicodeForm",
  "caseFold",
  "punctuation",
  "whitespace",
]);
const SCORING_KEYS = Object.freeze([
  "schemaPoints",
  "unsupportedFindingPenalty",
  "checks",
]);
const SCORE_CHECK_KEYS = Object.freeze(["id", "points"]);
const ORACLE_CASE_KEYS = Object.freeze([
  "id",
  "severity",
  "critical",
  "identityAliases",
  "locationLines",
  "sourceAnchors",
  "sourceAliases",
  "sinkAnchors",
  "sinkAliases",
  "flowTerms",
  "repairGroups",
]);
const SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NEGATED_FLOW = /\b(?:does not|do not|did not|never|cannot|can not|is not|isn t|not)\s+(?:directly\s+)?(?:embed\w*|execute\w*|flow\w*|interpolat\w*|pass\w*|reach\w*)\b/i;
const EXPECTED_REVIEW_PARENTS = Object.freeze({ reviewer: "raw", combined: "method" });
const EXPECTED_PACKAGE = Object.freeze({
  id: "adaptive-evaluator-aegis-v2",
  evaluatorId: AEGIS_EVALUATOR_V2_ID,
  evaluatorKind: "deterministic-verifier",
  taskClass: "security-review",
  artifactMediaType: "application/json",
  entrypointPath: "src/aegis-evaluator-v2.mjs",
});

const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;

export function normalizeEvaluatorText(value) {
  return value.normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function uniqueNonEmptyStrings(value, label) {
  if (!Array.isArray(value) || value.length === 0
      || value.some((item) => typeof item !== "string" || item.trim() === "")
      || new Set(value).size !== value.length) {
    throw new TypeError(`${label} must contain unique non-empty strings`);
  }
}

function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) throw new TypeError(`${label} must be positive`);
}

function validateOracle(oracle) {
  exactKeys(oracle, ORACLE_KEYS, "Aegis evaluator oracle");
  if (oracle.schemaVersion !== 1 || oracle.id !== "aegis-terra-security-review-oracle-v2") {
    throw new Error("Aegis evaluator oracle identity is invalid");
  }
  nonEmptyString(oracle.taskDefinitionPath, "oracle task definition path");
  if (!/^[a-f0-9]{64}$/.test(oracle.taskDefinitionSha256)
      || !/^[a-f0-9]{64}$/.test(oracle.taskSourceSha256)) {
    throw new Error("Aegis evaluator oracle digest is invalid");
  }
  exactKeys(oracle.normalization, NORMALIZATION_KEYS, "Aegis normalization policy");
  if (JSON.stringify(oracle.normalization) !== JSON.stringify({
    unicodeForm: "NFKC",
    caseFold: "lowercase",
    punctuation: "separator",
    whitespace: "collapse",
  })) {
    throw new Error("Aegis normalization policy is invalid");
  }
  exactKeys(oracle.scoring, SCORING_KEYS, "Aegis scoring policy");
  positiveInteger(oracle.scoring.schemaPoints, "schema points");
  positiveInteger(oracle.scoring.unsupportedFindingPenalty, "unsupported finding penalty");
  if (!Array.isArray(oracle.scoring.checks) || oracle.scoring.checks.length === 0) {
    throw new TypeError("Aegis scoring checks are required");
  }
  const checkIds = new Set();
  for (const check of oracle.scoring.checks) {
    exactKeys(check, SCORE_CHECK_KEYS, "Aegis scoring check");
    nonEmptyString(check.id, "Aegis scoring check id");
    positiveInteger(check.points, `Aegis scoring check ${check.id} points`);
    if (checkIds.has(check.id)) throw new Error("Aegis scoring contains a duplicate check");
    checkIds.add(check.id);
  }
  const requiredChecks = [
    "detected",
    "severity-correct",
    "location-specific",
    "source-grounded",
    "sink-grounded",
    "flow-grounded",
    "repair-specific",
  ];
  if (JSON.stringify([...checkIds]) !== JSON.stringify(requiredChecks)) {
    throw new Error("Aegis scoring checks do not match the closed v2 contract");
  }
  if (!Array.isArray(oracle.cases) || oracle.cases.length === 0) {
    throw new TypeError("Aegis oracle cases are required");
  }
  const caseIds = new Set();
  for (const entry of oracle.cases) {
    exactKeys(entry, ORACLE_CASE_KEYS, "Aegis oracle case");
    nonEmptyString(entry.id, "Aegis oracle case id");
    if (caseIds.has(entry.id)) throw new Error("Aegis oracle contains a duplicate case");
    caseIds.add(entry.id);
    if (!SEVERITIES.has(entry.severity) || typeof entry.critical !== "boolean") {
      throw new Error(`Aegis oracle case ${entry.id} severity is invalid`);
    }
    if (entry.critical !== (entry.severity === "critical")) {
      throw new Error(`Aegis oracle case ${entry.id} critical flag is contradictory`);
    }
    for (const field of [
      "identityAliases",
      "sourceAnchors",
      "sourceAliases",
      "sinkAnchors",
      "sinkAliases",
      "flowTerms",
    ]) uniqueNonEmptyStrings(entry[field], `Aegis oracle case ${entry.id}.${field}`);
    if (!Array.isArray(entry.locationLines) || entry.locationLines.length === 0
        || entry.locationLines.some((line) => !Number.isInteger(line) || line <= 0)
        || new Set(entry.locationLines).size !== entry.locationLines.length) {
      throw new TypeError(`Aegis oracle case ${entry.id}.locationLines is invalid`);
    }
    if (!Array.isArray(entry.repairGroups) || entry.repairGroups.length === 0) {
      throw new TypeError(`Aegis oracle case ${entry.id}.repairGroups is invalid`);
    }
    for (const group of entry.repairGroups) {
      uniqueNonEmptyStrings(group, `Aegis oracle case ${entry.id} repair group`);
    }
  }
  if (JSON.stringify(oracle.cases.map(({ id }) => id))
      !== JSON.stringify([...oracle.cases.map(({ id }) => id)].sort(lexical))) {
    throw new Error("Aegis oracle cases are not in canonical id order");
  }
  return oracle;
}

function hasDuplicateObjectKeys(jsonText) {
  let cursor = 0;
  function skipWhitespace() {
    while (/\s/.test(jsonText[cursor] ?? "")) cursor += 1;
  }
  function readString() {
    const start = cursor;
    cursor += 1;
    while (cursor < jsonText.length) {
      if (jsonText[cursor] === "\\") cursor += 2;
      else if (jsonText[cursor] === "\"") {
        cursor += 1;
        return JSON.parse(jsonText.slice(start, cursor));
      } else cursor += 1;
    }
    throw new Error("unterminated JSON string");
  }
  function scanValue() {
    skipWhitespace();
    if (jsonText[cursor] === "{") return scanObject();
    if (jsonText[cursor] === "[") return scanArray();
    if (jsonText[cursor] === "\"") {
      readString();
      return false;
    }
    while (cursor < jsonText.length && !/[\s,\]}]/.test(jsonText[cursor])) cursor += 1;
    return false;
  }
  function scanObject() {
    cursor += 1;
    skipWhitespace();
    const keys = new Set();
    if (jsonText[cursor] === "}") {
      cursor += 1;
      return false;
    }
    while (cursor < jsonText.length) {
      skipWhitespace();
      const key = readString();
      if (keys.has(key)) return true;
      keys.add(key);
      skipWhitespace();
      if (jsonText[cursor] !== ":") return false;
      cursor += 1;
      if (scanValue()) return true;
      skipWhitespace();
      if (jsonText[cursor] === "}") {
        cursor += 1;
        return false;
      }
      if (jsonText[cursor] !== ",") return false;
      cursor += 1;
    }
    return false;
  }
  function scanArray() {
    cursor += 1;
    skipWhitespace();
    if (jsonText[cursor] === "]") {
      cursor += 1;
      return false;
    }
    while (cursor < jsonText.length) {
      if (scanValue()) return true;
      skipWhitespace();
      if (jsonText[cursor] === "]") {
        cursor += 1;
        return false;
      }
      if (jsonText[cursor] !== ",") return false;
      cursor += 1;
    }
    return false;
  }
  return scanValue();
}

function parseArtifact(artifactText) {
  if (typeof artifactText !== "string" || artifactText.trim() === "") {
    return { valid: false, findings: [], reason: "artifact-text-invalid" };
  }
  let value;
  try {
    value = JSON.parse(artifactText);
  } catch {
    return { valid: false, findings: [], reason: "artifact-json-invalid" };
  }
  try {
    if (hasDuplicateObjectKeys(artifactText)) {
      return { valid: false, findings: [], reason: "artifact-json-duplicate-key" };
    }
  } catch {
    return { valid: false, findings: [], reason: "artifact-json-invalid" };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)
      || JSON.stringify(Object.keys(value).sort(lexical))
        !== JSON.stringify([...TOP_LEVEL_KEYS].sort(lexical))
      || value.schemaVersion !== 1 || !Array.isArray(value.findings)
      || value.findings.length > 10 || typeof value.summary !== "string"
      || value.summary.trim() === "" || value.summary.length > 500) {
    return { valid: false, findings: [], reason: "artifact-schema-invalid" };
  }
  const ids = new Set();
  for (const finding of value.findings) {
    if (!finding || typeof finding !== "object" || Array.isArray(finding)
        || JSON.stringify(Object.keys(finding).sort(lexical))
          !== JSON.stringify([...FINDING_KEYS].sort(lexical))
        || FINDING_KEYS.some((key) => typeof finding[key] !== "string" || finding[key].trim() === "")
        || !ID_PATTERN.test(finding.id) || !SEVERITIES.has(finding.severity)
        || !CONFIDENCE.has(finding.confidence) || ids.has(finding.id)) {
      return { valid: false, findings: [], reason: "artifact-finding-schema-invalid" };
    }
    ids.add(finding.id);
  }
  return { valid: true, findings: value.findings, reason: "artifact-schema-valid" };
}

function includesAny(text, values) {
  return values.some((value) => text.includes(normalizeEvaluatorText(value)));
}

function findingIdentity(finding) {
  return normalizeEvaluatorText([finding.id, finding.title, finding.evidence].join(" "));
}

function findingCheckValues(oracleCase, finding) {
  const identity = findingIdentity(finding);
  if (!includesAny(identity, oracleCase.identityAliases)) return null;
  const location = normalizeEvaluatorText(finding.location);
  const evidence = normalizeEvaluatorText(finding.evidence);
  const repair = normalizeEvaluatorText(finding.repair);
  const locationNumbers = new Set((location.match(/\b\d+\b/g) ?? []).map(Number));
  const sourceGrounded = includesAny(evidence, oracleCase.sourceAliases);
  const sinkGrounded = includesAny(evidence, oracleCase.sinkAliases);
  const flowGrounded = sourceGrounded && sinkGrounded
    && includesAny(evidence, oracleCase.flowTerms) && !NEGATED_FLOW.test(evidence);
  return {
    detected: true,
    "severity-correct": finding.severity === oracleCase.severity,
    "location-specific": oracleCase.locationLines.some((line) => locationNumbers.has(line)),
    "source-grounded": sourceGrounded,
    "sink-grounded": sinkGrounded,
    "flow-grounded": flowGrounded,
    "repair-specific": oracleCase.repairGroups.every((group) => includesAny(repair, group)),
  };
}

function caseResult(oracle, oracleCase, finding) {
  const values = finding ? findingCheckValues(oracleCase, finding) : null;
  const checks = oracle.scoring.checks.map(({ id, points }) => ({
    id,
    passed: values?.[id] === true,
    reasonCode: values?.[id] === true ? `${id}-passed` : `${id}-failed`,
    points,
  }));
  const score = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
  return {
    id: oracleCase.id,
    matchedArtifactId: finding?.id ?? null,
    critical: oracleCase.critical,
    score,
    maximumScore: checks.reduce((sum, check) => sum + check.points, 0),
    checks: checks.map(({ id, passed, reasonCode }) => ({ id, passed, reasonCode })),
  };
}

function bestAssignment(oracle, findings) {
  const stableFindings = findings.map((finding, originalIndex) => ({
    finding,
    originalIndex,
    signature: canonicalDigest(finding),
  })).sort((left, right) => lexical(left.signature, right.signature));
  let best = null;

  function visit(caseIndex, used, results, score) {
    if (caseIndex === oracle.cases.length) {
      const key = results.map(({ matchedArtifactId }) => matchedArtifactId ?? "~").join("\u0000");
      if (!best || score > best.score || (score === best.score && lexical(key, best.key) < 0)) {
        best = { score, key, results: [...results], used: new Set(used) };
      }
      return;
    }
    const oracleCase = oracle.cases[caseIndex];
    const empty = caseResult(oracle, oracleCase, null);
    visit(caseIndex + 1, used, [...results, empty], score);
    for (const candidate of stableFindings) {
      if (used.has(candidate.originalIndex)
          || findingCheckValues(oracleCase, candidate.finding) === null) continue;
      const result = caseResult(oracle, oracleCase, candidate.finding);
      used.add(candidate.originalIndex);
      visit(caseIndex + 1, used, [...results, result], score + result.score);
      used.delete(candidate.originalIndex);
    }
  }
  visit(0, new Set(), [], 0);
  return best;
}

function scoreArtifact(oracle, artifactText) {
  const parsed = parseArtifact(artifactText);
  const maximumCaseScore = oracle.scoring.checks.reduce((sum, check) => sum + check.points, 0);
  const maximumScore = oracle.scoring.schemaPoints + maximumCaseScore * oracle.cases.length;
  if (!parsed.valid) {
    return {
      schemaValid: false,
      score: 0,
      maximumScore,
      detectedCases: 0,
      unsupportedFindings: 0,
      unsupportedCritical: false,
      caseResults: oracle.cases.map((entry) => caseResult(oracle, entry, null)),
      reason: parsed.reason,
    };
  }
  const assignment = bestAssignment(oracle, parsed.findings);
  const unsupported = parsed.findings.filter((_, index) => !assignment.used.has(index));
  return {
    schemaValid: true,
    score: Math.max(
      0,
      oracle.scoring.schemaPoints + assignment.score
        - unsupported.length * oracle.scoring.unsupportedFindingPenalty,
    ),
    maximumScore,
    detectedCases: assignment.results.filter(({ matchedArtifactId }) => matchedArtifactId !== null).length,
    unsupportedFindings: unsupported.length,
    unsupportedCritical: unsupported.some(({ severity }) => severity === "critical"),
    caseResults: assignment.results,
    reason: parsed.reason,
  };
}

function validatePackageBindings(packageReceipt, oracle, request) {
  validateEvaluatorPackageReceipt(packageReceipt);
  for (const [field, expected] of Object.entries({
    id: EXPECTED_PACKAGE.id,
    evaluatorId: EXPECTED_PACKAGE.evaluatorId,
    evaluatorKind: EXPECTED_PACKAGE.evaluatorKind,
    taskClass: EXPECTED_PACKAGE.taskClass,
    artifactMediaType: EXPECTED_PACKAGE.artifactMediaType,
  })) {
    if (packageReceipt[field] !== expected) throw new Error(`Aegis evaluator package ${field} is invalid`);
  }
  if (packageReceipt.receiptDigest !== request.packageReceiptDigest) {
    throw new Error("Aegis evaluator request package receipt is stale");
  }
  const entrypoint = packageReceipt.artifacts.find(({ role }) => role === "entrypoint");
  const oracleArtifact = packageReceipt.artifacts.find(({ role }) => role === "oracle");
  const taskArtifact = packageReceipt.artifacts.find(({ role }) => role === "task-definition");
  if (entrypoint?.path !== EXPECTED_PACKAGE.entrypointPath
      || oracleArtifact?.path !== "artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json"
      || taskArtifact?.path !== oracle.taskDefinitionPath) {
    throw new Error("Aegis evaluator package resources are incomplete or substituted");
  }
  if (oracleArtifact.logicalDigest !== canonicalDigest(oracle)) {
    throw new Error("Aegis evaluator oracle does not match the package receipt");
  }
  if (taskArtifact.sha256 !== oracle.taskDefinitionSha256
      || taskArtifact.logicalDigest !== request.taskDefinitionDigest) {
    throw new Error("Aegis evaluator task definition does not match the package receipt");
  }
  if (request.taskSourceDigest !== oracle.taskSourceSha256) {
    throw new Error("Aegis evaluator task source does not match the oracle");
  }
  const normalizedSource = normalizeEvaluatorText(request.taskSourceText);
  for (const oracleCase of oracle.cases) {
    if (!includesAny(normalizedSource, oracleCase.sourceAnchors)
        || !includesAny(normalizedSource, oracleCase.sinkAnchors)) {
      throw new Error(`Aegis evaluator oracle anchors are absent for ${oracleCase.id}`);
    }
  }
}

function boundResult(bound) {
  return JSON.parse(bound.resultText);
}

function validateBoundResultForOracle({
  bound,
  packageReceipt,
  oracle,
  request,
  expectedVariant,
  label,
}) {
  const result = boundResult(bound);
  const expectedBindings = {
    packageId: packageReceipt.id,
    packageReceiptDigest: packageReceipt.receiptDigest,
    evaluatorId: AEGIS_EVALUATOR_V2_ID,
    evaluatorKind: "deterministic-verifier",
    taskClass: "security-review",
    variant: expectedVariant,
    taskDefinitionDigest: request.taskDefinitionDigest,
    taskSourceDigest: request.taskSourceDigest,
    oracleDigest: canonicalDigest(oracle),
    normalizationDigest: canonicalDigest(oracle.normalization),
    artifactDigest: bound.artifactDigest,
  };
  for (const [field, expected] of Object.entries(expectedBindings)) {
    if (result[field] !== expected) {
      throw new Error(`${label} evaluator result ${field} is substituted`);
    }
  }
  if (result.artifactBytes !== Buffer.byteLength(bound.artifactText)) {
    throw new Error(`${label} evaluator result artifact bytes are invalid`);
  }
  const rescored = scoreArtifact(oracle, bound.artifactText);
  for (const field of [
    "schemaValid",
    "score",
    "maximumScore",
    "detectedCases",
    "unsupportedFindings",
  ]) {
    if (result[field] !== rescored[field]) {
      throw new Error(`${label} deterministic ${field} does not match its artifact`);
    }
  }
  if (canonicalDigest(result.caseResults) !== canonicalDigest(rescored.caseResults)) {
    throw new Error(`${label} deterministic case scores do not match its artifact`);
  }
  const criticalIncomplete = rescored.caseResults.some((entry) =>
    entry.critical && entry.checks.some(({ passed }) => !passed));
  const expectedCriticalRegression = !rescored.schemaValid || criticalIncomplete
    || rescored.unsupportedCritical;
  if (result.criticalRegression !== expectedCriticalRegression) {
    throw new Error(`${label} deterministic critical regression does not match its artifact`);
  }
  return result;
}

function comparison(candidate, baseline, variant) {
  if (variant === "raw") {
    return {
      baselineArtifactDigest: null,
      baselineResultDigest: null,
      outcomeAgainstRaw: "baseline",
      counts: { matched: 0, wins: 0, losses: 0, ties: 0 },
    };
  }
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const candidateCase of candidate.caseResults) {
    const baselineCase = baseline.caseResults.find(({ id }) => id === candidateCase.id);
    if (candidateCase.score > baselineCase.score) wins += 1;
    else if (candidateCase.score < baselineCase.score) losses += 1;
    else ties += 1;
  }
  return {
    baselineArtifactDigest: baseline.artifactDigest,
    baselineResultDigest: baseline.resultDigest,
    outcomeAgainstRaw: candidate.score > baseline.score
      ? "win" : candidate.score < baseline.score ? "loss" : "tie",
    counts: { matched: candidate.caseResults.length, wins, losses, ties },
  };
}

export function evaluateAegisArtifactV2({ request, packageReceipt, oracle } = {}) {
  const trustedRequest = validateEvaluatorRequest(request);
  validateOracle(oracle);
  validatePackageBindings(packageReceipt, oracle, trustedRequest);
  const scored = scoreArtifact(oracle, trustedRequest.artifactText);
  const baseline = trustedRequest.baseline ? validateBoundResultForOracle({
    bound: trustedRequest.baseline,
    packageReceipt,
    oracle,
    request: trustedRequest,
    expectedVariant: "raw",
    label: "baseline",
  }) : null;
  const expectedParent = EXPECTED_REVIEW_PARENTS[trustedRequest.variant];
  const parentResult = trustedRequest.parent ? validateBoundResultForOracle({
    bound: trustedRequest.parent,
    packageReceipt,
    oracle,
    request: trustedRequest,
    expectedVariant: expectedParent,
    label: "review parent",
  }) : null;
  const parentRemoved = parentResult ? parentResult.caseResults.some((parentCase) =>
    parentCase.matchedArtifactId !== null
      && scored.caseResults.find(({ id }) => id === parentCase.id)?.matchedArtifactId === null) : false;
  const parentDegraded = parentResult ? parentResult.caseResults.some((parentCase) =>
    parentCase.matchedArtifactId !== null
      && scored.caseResults.find(({ id }) => id === parentCase.id)?.score < parentCase.score) : false;
  const criticalIncomplete = scored.caseResults.some((entry) =>
    entry.critical && entry.checks.some(({ passed }) => !passed));
  const criticalRegression = !scored.schemaValid || criticalIncomplete
    || scored.unsupportedCritical || parentDegraded;
  const compared = comparison(scored, baseline, trustedRequest.variant);
  const parent = expectedParent ? {
    variant: expectedParent,
    artifactDigest: parentResult.artifactDigest,
    resultDigest: parentResult.resultDigest,
  } : null;
  const reasonCodes = [
    scored.reason,
    `expected-coverage-${scored.detectedCases}-of-${oracle.cases.length}`,
    `unsupported-findings-${scored.unsupportedFindings}`,
    ...(parentRemoved ? ["parent-grounded-case-removed"] : []),
    ...(parentDegraded ? ["parent-grounded-case-degraded"] : []),
    ...(criticalIncomplete ? ["critical-case-quality-incomplete"] : []),
    ...(scored.unsupportedCritical ? ["unsupported-critical-finding"] : []),
    ...(trustedRequest.variant === "raw" ? [] : ["raw-baseline-result-bound"]),
    ...(expectedParent ? ["review-parent-result-bound"] : []),
    criticalRegression ? "critical-regression" : "no-critical-regression",
  ];
  const unsigned = {
    schemaVersion: 1,
    packageId: packageReceipt.id,
    packageReceiptDigest: packageReceipt.receiptDigest,
    evaluatorId: AEGIS_EVALUATOR_V2_ID,
    evaluatorKind: "deterministic-verifier",
    taskClass: "security-review",
    variant: trustedRequest.variant,
    taskDefinitionDigest: trustedRequest.taskDefinitionDigest,
    taskSourceDigest: trustedRequest.taskSourceDigest,
    oracleDigest: canonicalDigest(oracle),
    normalizationDigest: canonicalDigest(oracle.normalization),
    artifactDigest: trustedRequest.artifactDigest,
    artifactBytes: Buffer.byteLength(trustedRequest.artifactText),
    schemaValid: scored.schemaValid,
    score: scored.score,
    maximumScore: scored.maximumScore,
    detectedCases: scored.detectedCases,
    unsupportedFindings: scored.unsupportedFindings,
    caseResults: scored.caseResults,
    comparison: compared,
    parent,
    criticalRegression,
    reasonCodes,
    authorityExpanded: false,
    evaluatedAt: trustedRequest.evaluatedAt,
  };
  return validateEvaluatorResult({ ...unsigned, resultDigest: canonicalDigest(unsigned) });
}
