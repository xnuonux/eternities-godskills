import {
  TRIAL_VARIANTS,
  canonicalDigest,
  deepFreeze,
  digestString,
  exactKeys,
  nonEmptyString,
} from "./adaptive-evidence-contracts.mjs";
import { sha256 } from "./io.mjs";

const POLICY_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "protocolId",
  "evaluatorKinds",
  "taskClasses",
  "artifactMediaTypes",
  "maximumArtifactBytes",
  "maximumDeclaredResources",
  "dynamicLoadingAllowed",
  "receiptPathExecutionAllowed",
  "authorityExpanded",
]);
const RECEIPT_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "status",
  "protocolId",
  "evaluatorId",
  "evaluatorKind",
  "taskClass",
  "artifactMediaType",
  "authorityExpanded",
  "dependencyClosure",
  "artifacts",
  "proofLimits",
  "receiptDigest",
]);
const REQUEST_KEYS = Object.freeze([
  "schemaVersion",
  "packageReceiptDigest",
  "taskDefinitionDigest",
  "taskSourceText",
  "taskSourceDigest",
  "variant",
  "artifactText",
  "artifactDigest",
  "baseline",
  "parent",
  "evaluatedAt",
]);
const RESULT_KEYS = Object.freeze([
  "schemaVersion",
  "packageId",
  "packageReceiptDigest",
  "evaluatorId",
  "evaluatorKind",
  "taskClass",
  "variant",
  "taskDefinitionDigest",
  "taskSourceDigest",
  "oracleDigest",
  "normalizationDigest",
  "artifactDigest",
  "artifactBytes",
  "schemaValid",
  "score",
  "maximumScore",
  "detectedCases",
  "unsupportedFindings",
  "caseResults",
  "comparison",
  "parent",
  "criticalRegression",
  "reasonCodes",
  "authorityExpanded",
  "evaluatedAt",
  "resultDigest",
]);
const BOUND_ARTIFACT_KEYS = Object.freeze([
  "artifactText",
  "artifactDigest",
  "resultText",
  "resultDigest",
]);
const RESULT_PARENT_KEYS = Object.freeze(["variant", "artifactDigest", "resultDigest"]);
const CASE_KEYS = Object.freeze([
  "id",
  "matchedArtifactId",
  "critical",
  "score",
  "maximumScore",
  "checks",
]);
const CHECK_KEYS = Object.freeze(["id", "passed", "reasonCode"]);
const COMPARISON_KEYS = Object.freeze([
  "baselineArtifactDigest",
  "baselineResultDigest",
  "outcomeAgainstRaw",
  "counts",
]);
const COUNT_KEYS = Object.freeze(["matched", "wins", "losses", "ties"]);
const EXPECTED_KINDS = Object.freeze(["deterministic-verifier", "reviewer"]);
const EXPECTED_TASK_CLASSES = Object.freeze([
  "continuity",
  "creative-generation",
  "debugging-recovery",
  "general",
  "implementation",
  "research",
  "security-review",
  "verification",
]);
const EXPECTED_MEDIA_TYPES = Object.freeze(["application/json", "text/markdown", "text/plain"]);
const MAXIMUM_ARTIFACT_BYTES = 262144;
const MAXIMUM_DECLARED_RESOURCES = 16;
const EXPECTED_REVIEW_PARENTS = Object.freeze({ reviewer: "raw", combined: "method" });

function sameArray(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the required ordered values`);
  }
}

function boolean(value, label) {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
}

function nonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
}

function finiteNonNegative(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite non-negative number`);
  }
}

function exactIso(value, label) {
  nonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new TypeError(`${label} must be an exact ISO timestamp`);
  }
}

function uniqueStrings(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)
      || value.some((entry) => typeof entry !== "string" || entry.trim() === "")
      || new Set(value).size !== value.length) {
    throw new TypeError(`${label} must contain unique non-empty strings`);
  }
}

function relativePath(value, label) {
  nonEmptyString(value, label);
  if (value.includes("\\") || value.startsWith("/") || /^[a-z]:/i.test(value)
      || value.split("/").includes("..") || /[?#]/.test(value)) {
    throw new Error(`${label} must be repository-relative`);
  }
}

function validateBoundArtifact(value, label) {
  exactKeys(value, BOUND_ARTIFACT_KEYS, label);
  nonEmptyString(value.artifactText, `${label}.artifactText`);
  digestString(value.artifactDigest, `${label}.artifactDigest`);
  if (sha256(value.artifactText) !== value.artifactDigest) {
    throw new Error(`${label} artifact digest does not match its bytes`);
  }
  nonEmptyString(value.resultText, `${label}.resultText`);
  digestString(value.resultDigest, `${label}.resultDigest`);
  let result;
  try {
    result = JSON.parse(value.resultText);
  } catch (error) {
    throw new Error(`${label} result text is invalid JSON`, { cause: error });
  }
  validateEvaluatorResult(result);
  if (result.resultDigest !== value.resultDigest) {
    throw new Error(`${label} result digest does not match its result text`);
  }
  if (result.artifactDigest !== value.artifactDigest
      || result.artifactBytes !== Buffer.byteLength(value.artifactText)) {
    throw new Error(`${label} result does not bind the artifact bytes`);
  }
  return result;
}

function validateBoundContext(result, request, label) {
  for (const field of [
    "packageReceiptDigest",
    "taskDefinitionDigest",
    "taskSourceDigest",
  ]) {
    if (result[field] !== request[field]) throw new Error(`${label} ${field} is stale`);
  }
  if (new Date(result.evaluatedAt) >= new Date(request.evaluatedAt)) {
    throw new Error(`${label} result must predate the current evaluation`);
  }
}

function validateResultParent(value, label) {
  exactKeys(value, RESULT_PARENT_KEYS, label);
  nonEmptyString(value.variant, `${label}.variant`);
  digestString(value.artifactDigest, `${label}.artifactDigest`);
  digestString(value.resultDigest, `${label}.resultDigest`);
}

function validateCounts(counts) {
  exactKeys(counts, COUNT_KEYS, "evaluator result comparison counts");
  for (const [name, value] of Object.entries(counts)) {
    nonNegativeInteger(value, `evaluator result comparison counts.${name}`);
  }
  if (counts.wins + counts.losses + counts.ties !== counts.matched) {
    throw new Error("evaluator result comparison totals are contradictory");
  }
}

function validateComparison(comparison, variant) {
  exactKeys(comparison, COMPARISON_KEYS, "evaluator result comparison");
  validateCounts(comparison.counts);
  if (variant === "raw") {
    if (comparison.baselineArtifactDigest !== null || comparison.baselineResultDigest !== null
        || comparison.outcomeAgainstRaw !== "baseline" || comparison.counts.matched !== 0) {
      throw new Error("raw evaluator result comparison is invalid");
    }
  } else {
    digestString(comparison.baselineArtifactDigest, "comparison baseline artifact digest");
    digestString(comparison.baselineResultDigest, "comparison baseline result digest");
    if (!new Set(["win", "loss", "tie"]).has(comparison.outcomeAgainstRaw)) {
      throw new Error("evaluator result outcome against raw is invalid");
    }
  }
}

export function validateAdaptiveEvaluatorPackagePolicy({ policy, expectedPolicyDigest } = {}) {
  exactKeys(policy, POLICY_KEYS, "adaptive evaluator package policy");
  if (policy.schemaVersion !== 1 || policy.id !== "adaptive-evaluator-packages-policy-v1"
      || policy.protocolId !== "eternities-godskills-evaluator-package-v1") {
    throw new Error("adaptive evaluator package policy identity is invalid");
  }
  digestString(expectedPolicyDigest, "expected policy digest");
  if (canonicalDigest(policy) !== expectedPolicyDigest) {
    throw new Error("adaptive evaluator package policy does not match the trusted policy digest");
  }
  sameArray(policy.evaluatorKinds, EXPECTED_KINDS, "evaluator kinds");
  sameArray(policy.taskClasses, EXPECTED_TASK_CLASSES, "evaluator task classes");
  sameArray(policy.artifactMediaTypes, EXPECTED_MEDIA_TYPES, "evaluator artifact media types");
  if (policy.maximumArtifactBytes !== MAXIMUM_ARTIFACT_BYTES) {
    throw new Error("maximum artifact bytes is invalid");
  }
  if (policy.maximumDeclaredResources !== MAXIMUM_DECLARED_RESOURCES) {
    throw new Error("maximum declared resources is invalid");
  }
  for (const field of [
    "dynamicLoadingAllowed",
    "receiptPathExecutionAllowed",
    "authorityExpanded",
  ]) {
    if (policy[field] !== false) throw new Error(`${field} must remain false`);
  }
  return deepFreeze(structuredClone(policy));
}

export function validateEvaluatorRequest(request) {
  exactKeys(request, REQUEST_KEYS, "adaptive evaluator request");
  if (request.schemaVersion !== 1) throw new Error("adaptive evaluator request version is invalid");
  for (const [name, value] of [
    ["package receipt digest", request.packageReceiptDigest],
    ["task definition digest", request.taskDefinitionDigest],
    ["task source digest", request.taskSourceDigest],
    ["artifact digest", request.artifactDigest],
  ]) digestString(value, name);
  nonEmptyString(request.taskSourceText, "task source text");
  if (sha256(request.taskSourceText) !== request.taskSourceDigest) {
    throw new Error("task source digest does not match its bytes");
  }
  nonEmptyString(request.artifactText, "artifact text");
  if (Buffer.byteLength(request.artifactText) > MAXIMUM_ARTIFACT_BYTES) {
    throw new Error("artifact exceeds the evaluator package size limit");
  }
  if (sha256(request.artifactText) !== request.artifactDigest) {
    throw new Error("artifact digest does not match its bytes");
  }
  if (!TRIAL_VARIANTS.includes(request.variant)) throw new Error("evaluator request variant is invalid");
  if (request.variant === "raw") {
    if (request.baseline !== null) throw new Error("raw evaluator request cannot carry a baseline");
  } else {
    if (request.baseline === null) throw new Error("non-raw evaluator request requires a baseline");
    const baselineResult = validateBoundArtifact(request.baseline, "evaluator request baseline");
    validateBoundContext(baselineResult, request, "evaluator request baseline");
    if (baselineResult.variant !== "raw") {
      throw new Error("evaluator request baseline result variant must be raw");
    }
  }
  const expectedParent = EXPECTED_REVIEW_PARENTS[request.variant];
  if (expectedParent) {
    if (request.parent === null) throw new Error(`${request.variant} evaluator request requires a parent`);
    const parentResult = validateBoundArtifact(request.parent, "evaluator request parent");
    validateBoundContext(parentResult, request, "evaluator request parent");
    if (parentResult.variant !== expectedParent) {
      throw new Error("evaluator request parent result variant is invalid");
    }
  } else if (request.parent !== null) {
    throw new Error(`${request.variant} evaluator request cannot carry a review parent`);
  }
  exactIso(request.evaluatedAt, "evaluator request evaluatedAt");
  return deepFreeze(structuredClone(request));
}

export function validateEvaluatorResult(result) {
  exactKeys(result, RESULT_KEYS, "adaptive evaluator result");
  const { resultDigest, ...unsigned } = result;
  digestString(resultDigest, "result digest");
  if (canonicalDigest(unsigned) !== resultDigest) {
    throw new Error("evaluator result digest does not match its body");
  }
  if (result.schemaVersion !== 1) throw new Error("adaptive evaluator result version is invalid");
  for (const field of ["packageId", "evaluatorId", "taskClass"]) {
    nonEmptyString(result[field], `evaluator result.${field}`);
  }
  if (!EXPECTED_KINDS.includes(result.evaluatorKind)) throw new Error("evaluator result kind is invalid");
  if (!EXPECTED_TASK_CLASSES.includes(result.taskClass)) throw new Error("evaluator result task class is invalid");
  if (!TRIAL_VARIANTS.includes(result.variant)) throw new Error("evaluator result variant is invalid");
  for (const field of [
    "packageReceiptDigest",
    "taskDefinitionDigest",
    "taskSourceDigest",
    "oracleDigest",
    "normalizationDigest",
    "artifactDigest",
  ]) digestString(result[field], `evaluator result.${field}`);
  nonNegativeInteger(result.artifactBytes, "evaluator result.artifactBytes");
  boolean(result.schemaValid, "evaluator result.schemaValid");
  finiteNonNegative(result.score, "evaluator result.score");
  finiteNonNegative(result.maximumScore, "evaluator result.maximumScore");
  if (result.score > result.maximumScore) throw new Error("evaluator result score exceeds maximum");
  nonNegativeInteger(result.detectedCases, "evaluator result.detectedCases");
  nonNegativeInteger(result.unsupportedFindings, "evaluator result.unsupportedFindings");
  if (!Array.isArray(result.caseResults) || result.caseResults.length === 0) {
    throw new TypeError("evaluator result caseResults must be non-empty");
  }
  const caseIds = new Set();
  for (const entry of result.caseResults) {
    exactKeys(entry, CASE_KEYS, "evaluator result case");
    nonEmptyString(entry.id, "evaluator result case.id");
    if (caseIds.has(entry.id)) throw new Error("evaluator result contains a duplicate case");
    caseIds.add(entry.id);
    if (entry.matchedArtifactId !== null) {
      nonEmptyString(entry.matchedArtifactId, "evaluator result case.matchedArtifactId");
    }
    boolean(entry.critical, "evaluator result case.critical");
    finiteNonNegative(entry.score, "evaluator result case.score");
    finiteNonNegative(entry.maximumScore, "evaluator result case.maximumScore");
    if (entry.score > entry.maximumScore) throw new Error("evaluator case score exceeds maximum");
    if (!Array.isArray(entry.checks) || entry.checks.length === 0) {
      throw new TypeError("evaluator result case checks must be non-empty");
    }
    const checkIds = new Set();
    for (const check of entry.checks) {
      exactKeys(check, CHECK_KEYS, "evaluator result case check");
      nonEmptyString(check.id, "evaluator result case check.id");
      if (checkIds.has(check.id)) throw new Error("evaluator result contains a duplicate case check");
      checkIds.add(check.id);
      boolean(check.passed, "evaluator result case check.passed");
      nonEmptyString(check.reasonCode, "evaluator result case check.reasonCode");
    }
  }
  if (result.detectedCases > result.caseResults.length) {
    throw new Error("evaluator result detected case count is invalid");
  }
  validateComparison(result.comparison, result.variant);
  const expectedParent = EXPECTED_REVIEW_PARENTS[result.variant];
  if (expectedParent) {
    if (result.parent === null) throw new Error("review evaluator result requires a parent");
    validateResultParent(result.parent, "evaluator result parent");
    if (result.parent.variant !== expectedParent) throw new Error("evaluator result parent variant is invalid");
  } else if (result.parent !== null) {
    throw new Error("non-review evaluator result cannot carry a parent");
  }
  boolean(result.criticalRegression, "evaluator result.criticalRegression");
  uniqueStrings(result.reasonCodes, "evaluator result reasonCodes");
  if (result.authorityExpanded !== false) throw new Error("evaluator result cannot expand authority");
  exactIso(result.evaluatedAt, "evaluator result.evaluatedAt");
  return deepFreeze(structuredClone(result));
}

export function validateEvaluatorPackageReceipt(receipt) {
  exactKeys(receipt, RECEIPT_KEYS, "adaptive evaluator package receipt");
  const { receiptDigest, ...unsigned } = receipt;
  digestString(receiptDigest, "evaluator package receipt digest");
  if (canonicalDigest(unsigned) !== receiptDigest) {
    throw new Error("evaluator package receipt digest does not match its body");
  }
  if (receipt.schemaVersion !== 1 || receipt.status !== "verified-build"
      || receipt.protocolId !== "eternities-godskills-evaluator-package-v1") {
    throw new Error("evaluator package receipt identity is invalid");
  }
  for (const field of ["id", "evaluatorId"]) nonEmptyString(receipt[field], `receipt.${field}`);
  if (!EXPECTED_KINDS.includes(receipt.evaluatorKind)) throw new Error("receipt evaluator kind is invalid");
  if (!EXPECTED_TASK_CLASSES.includes(receipt.taskClass)) throw new Error("receipt task class is invalid");
  if (!EXPECTED_MEDIA_TYPES.includes(receipt.artifactMediaType)) {
    throw new Error("receipt artifact media type is invalid");
  }
  if (receipt.authorityExpanded !== false) throw new Error("receipt cannot expand authority");
  exactKeys(receipt.dependencyClosure, ["roots", "localModules", "complete"], "receipt dependency closure");
  uniqueStrings(receipt.dependencyClosure.roots, "receipt dependency roots");
  uniqueStrings(receipt.dependencyClosure.localModules, "receipt local modules");
  if (receipt.dependencyClosure.complete !== true) throw new Error("receipt dependency closure is incomplete");
  if (!Array.isArray(receipt.artifacts) || receipt.artifacts.length === 0) {
    throw new TypeError("receipt artifacts must be non-empty");
  }
  const paths = new Set();
  for (const artifact of receipt.artifacts) {
    const keys = Object.keys(artifact).sort();
    const withoutLogical = ["bytes", "path", "role", "sha256"];
    const withLogical = [...withoutLogical, "logicalDigest"].sort();
    if (JSON.stringify(keys) !== JSON.stringify(withoutLogical.sort())
        && JSON.stringify(keys) !== JSON.stringify(withLogical)) {
      throw new Error("receipt artifact keys are not closed");
    }
    nonEmptyString(artifact.role, "receipt artifact role");
    relativePath(artifact.path, "receipt artifact path");
    if (paths.has(artifact.path)) throw new Error("receipt contains a duplicate artifact path");
    paths.add(artifact.path);
    digestString(artifact.sha256, "receipt artifact SHA-256");
    nonNegativeInteger(artifact.bytes, "receipt artifact bytes");
    if (artifact.logicalDigest !== undefined) {
      digestString(artifact.logicalDigest, "receipt artifact logical digest");
    }
  }
  uniqueStrings(receipt.proofLimits, "receipt proof limits");
  return deepFreeze(structuredClone(receipt));
}

const digestSchema = Object.freeze({ type: "string", pattern: "^[a-f0-9]{64}$" });
const nonEmptyStringSchema = Object.freeze({ type: "string", minLength: 1 });
const nonNegativeIntegerSchema = Object.freeze({ type: "integer", minimum: 0 });
const nonNegativeNumberSchema = Object.freeze({ type: "number", minimum: 0 });

function objectSchema(required, properties) {
  return { type: "object", additionalProperties: false, required, properties };
}

function nullable(schema) {
  return { anyOf: [{ type: "null" }, schema] };
}

export function buildAdaptiveEvaluatorSchemas() {
  const boundArtifact = objectSchema([...BOUND_ARTIFACT_KEYS], {
    artifactText: nonEmptyStringSchema,
    artifactDigest: digestSchema,
    resultText: nonEmptyStringSchema,
    resultDigest: digestSchema,
  });
  const resultParent = objectSchema([...RESULT_PARENT_KEYS], {
    variant: { enum: [...TRIAL_VARIANTS] },
    artifactDigest: digestSchema,
    resultDigest: digestSchema,
  });
  const counts = objectSchema([...COUNT_KEYS], Object.fromEntries(
    COUNT_KEYS.map((key) => [key, nonNegativeIntegerSchema]),
  ));
  const comparison = objectSchema([...COMPARISON_KEYS], {
    baselineArtifactDigest: nullable(digestSchema),
    baselineResultDigest: nullable(digestSchema),
    outcomeAgainstRaw: { enum: ["baseline", "win", "loss", "tie"] },
    counts,
  });
  const check = objectSchema([...CHECK_KEYS], {
    id: nonEmptyStringSchema,
    passed: { type: "boolean" },
    reasonCode: nonEmptyStringSchema,
  });
  const caseResult = objectSchema([...CASE_KEYS], {
    id: nonEmptyStringSchema,
    matchedArtifactId: nullable(nonEmptyStringSchema),
    critical: { type: "boolean" },
    score: nonNegativeNumberSchema,
    maximumScore: nonNegativeNumberSchema,
    checks: { type: "array", minItems: 1, items: check },
  });
  const artifact = objectSchema(
    ["role", "path", "sha256", "bytes"],
    {
      role: nonEmptyStringSchema,
      path: nonEmptyStringSchema,
      sha256: digestSchema,
      bytes: nonNegativeIntegerSchema,
      logicalDigest: digestSchema,
    },
  );
  const packageSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Adaptive evaluator package receipt v1",
    ...objectSchema([...RECEIPT_KEYS], {
      schemaVersion: { const: 1 },
      id: nonEmptyStringSchema,
      status: { const: "verified-build" },
      protocolId: { const: "eternities-godskills-evaluator-package-v1" },
      evaluatorId: nonEmptyStringSchema,
      evaluatorKind: { enum: [...EXPECTED_KINDS] },
      taskClass: { enum: [...EXPECTED_TASK_CLASSES] },
      artifactMediaType: { enum: [...EXPECTED_MEDIA_TYPES] },
      authorityExpanded: { const: false },
      dependencyClosure: objectSchema(["roots", "localModules", "complete"], {
        roots: { type: "array", minItems: 1, uniqueItems: true, items: nonEmptyStringSchema },
        localModules: { type: "array", minItems: 1, uniqueItems: true, items: nonEmptyStringSchema },
        complete: { const: true },
      }),
      artifacts: { type: "array", minItems: 1, items: artifact },
      proofLimits: { type: "array", minItems: 1, uniqueItems: true, items: nonEmptyStringSchema },
      receiptDigest: digestSchema,
    }),
  };
  const requestSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Adaptive evaluator request v1",
    ...objectSchema([...REQUEST_KEYS], {
      schemaVersion: { const: 1 },
      packageReceiptDigest: digestSchema,
      taskDefinitionDigest: digestSchema,
      taskSourceText: nonEmptyStringSchema,
      taskSourceDigest: digestSchema,
      variant: { enum: [...TRIAL_VARIANTS] },
      artifactText: nonEmptyStringSchema,
      artifactDigest: digestSchema,
      baseline: nullable(boundArtifact),
      parent: nullable(boundArtifact),
      evaluatedAt: { type: "string", format: "date-time" },
    }),
  };
  const resultSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Adaptive evaluator result v1",
    ...objectSchema([...RESULT_KEYS], {
      schemaVersion: { const: 1 },
      packageId: nonEmptyStringSchema,
      packageReceiptDigest: digestSchema,
      evaluatorId: nonEmptyStringSchema,
      evaluatorKind: { enum: [...EXPECTED_KINDS] },
      taskClass: { enum: [...EXPECTED_TASK_CLASSES] },
      variant: { enum: [...TRIAL_VARIANTS] },
      taskDefinitionDigest: digestSchema,
      taskSourceDigest: digestSchema,
      oracleDigest: digestSchema,
      normalizationDigest: digestSchema,
      artifactDigest: digestSchema,
      artifactBytes: nonNegativeIntegerSchema,
      schemaValid: { type: "boolean" },
      score: nonNegativeNumberSchema,
      maximumScore: nonNegativeNumberSchema,
      detectedCases: nonNegativeIntegerSchema,
      unsupportedFindings: nonNegativeIntegerSchema,
      caseResults: { type: "array", minItems: 1, items: caseResult },
      comparison,
      parent: nullable(resultParent),
      criticalRegression: { type: "boolean" },
      reasonCodes: { type: "array", minItems: 1, uniqueItems: true, items: nonEmptyStringSchema },
      authorityExpanded: { const: false },
      evaluatedAt: { type: "string", format: "date-time" },
      resultDigest: digestSchema,
    }),
  };
  return deepFreeze({
    "adaptive-evaluator-package-v1.schema.json": packageSchema,
    "adaptive-evaluator-request-v1.schema.json": requestSchema,
    "adaptive-evaluator-result-v1.schema.json": resultSchema,
  });
}
