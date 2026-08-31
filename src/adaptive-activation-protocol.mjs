import { sha256 } from "./io.mjs";

const PROTOCOL_ID = "eternities-godskills-activation-v1";
const DIGEST = /^[a-f0-9]{64}$/;
const CAPABILITY_ID = /^[a-z0-9][a-z0-9-]*$/;
const TASK_CLASSES = new Set([
  "creative-generation", "debugging-recovery", "implementation", "research", "continuity", "verification", "general",
]);
const CONSEQUENCE_CLASSES = new Set(["low", "consequential", "critical"]);
const MODES = new Set(["native", "guardrail", "method", "review"]);
const RISK_CLASSES = new Set(["low", "moderate", "high"]);
const EVIDENCE_CLASSES = new Set(["unverified", "inferred", "verified"]);
const DISCLOSURE = Object.freeze({
  native: "none",
  guardrail: "guardrails-only",
  method: "entrypoint-and-contract",
  review: "none",
});

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]));
  }
  return value;
}

const digest = (value) => sha256(JSON.stringify(stable(value)));

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function exactKeys(value, keys, label) {
  object(value, label);
  const actual = Object.keys(value).sort(lexical);
  const expected = [...keys].sort(lexical);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label} fields are invalid`);
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0 || /[\0\r\n]/.test(value)) {
    throw new TypeError(`${label} must be a non-empty single-line string`);
  }
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 digest`);
}

function nonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
}

function stringArray(value, label, { sorted = false } = {}) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw new TypeError(`${label} must be a string array`);
  }
  if (new Set(value).size !== value.length) throw new Error(`${label} must contain unique values`);
  if (sorted && value.some((entry, index) => index > 0 && lexical(value[index - 1], entry) > 0)) {
    throw new Error(`${label} must be sorted`);
  }
  return value;
}

function validateClassification(value) {
  exactKeys(value, ["taskClass", "consequenceClass", "reviewAvailable"], "activation classification");
  if (!TASK_CLASSES.has(value.taskClass) || !CONSEQUENCE_CLASSES.has(value.consequenceClass)
      || typeof value.reviewAvailable !== "boolean") {
    throw new Error("activation classification is invalid");
  }
  return value;
}

function validateAuthority(value) {
  exactKeys(value, [
    "availableAuthority", "permittedEffects", "availablePreconditions",
    "maximumRisk", "minimumEvidenceConfidence", "contextBudget",
  ], "activation authority projection");
  stringArray(value.availableAuthority, "activation available authority", { sorted: true });
  stringArray(value.permittedEffects, "activation permitted effects", { sorted: true });
  stringArray(value.availablePreconditions, "activation available preconditions", { sorted: true });
  if (!RISK_CLASSES.has(value.maximumRisk)) throw new Error("activation maximum risk is invalid");
  if (!EVIDENCE_CLASSES.has(value.minimumEvidenceConfidence)) {
    throw new Error("activation minimum evidence confidence is invalid");
  }
  nonNegativeInteger(value.contextBudget, "activation context budget");
  return value;
}

function validateSelected(value) {
  exactKeys(value, ["selectedId", "explicitMethodRequest"], "activation selected");
  if (typeof value.selectedId !== "string" || !CAPABILITY_ID.test(value.selectedId)) {
    throw new TypeError("activation selected identity is invalid");
  }
  if (typeof value.explicitMethodRequest !== "boolean") {
    throw new TypeError("activation explicit method request must be boolean");
  }
  return value;
}

function validateMethodEvidence(value) {
  exactKeys(value, [
    "eligible", "matchedEvaluations", "wins", "losses", "ties", "winRate",
    "criticalRegressions", "overheadRatio", "failedGates",
  ], "activation method evidence");
  if (typeof value.eligible !== "boolean") throw new TypeError("activation method evidence eligibility must be boolean");
  for (const field of ["matchedEvaluations", "wins", "losses", "ties", "criticalRegressions"]) {
    nonNegativeInteger(value[field], `activation method evidence ${field}`);
  }
  if (value.wins + value.losses + value.ties !== value.matchedEvaluations) {
    throw new Error("activation method evidence totals are contradictory");
  }
  const expectedRate = value.matchedEvaluations === 0 ? 0 : value.wins / value.matchedEvaluations;
  if (typeof value.winRate !== "number" || !Number.isFinite(value.winRate) || value.winRate !== expectedRate) {
    throw new Error("activation method evidence win rate is contradictory");
  }
  if (value.overheadRatio !== null
      && (typeof value.overheadRatio !== "number" || !Number.isFinite(value.overheadRatio) || value.overheadRatio <= 0)) {
    throw new TypeError("activation method evidence overhead ratio is invalid");
  }
  stringArray(value.failedGates, "activation method evidence failed gates");
  if (value.eligible !== (value.failedGates.length === 0)) {
    throw new Error("activation method evidence eligibility is contradictory");
  }
  return value;
}

function validateDecision(value) {
  exactKeys(value, [
    "schemaVersion", "selectedId", "taskClass", "consequenceClass", "mode", "reasonCodes",
    "preInferenceDisclosure", "deferredReview", "methodEvidence", "policyDigest", "evidenceDigest",
    "authorityProjection", "authorityExpanded", "decisionDigest",
  ], "activation decision");
  if (value.schemaVersion !== 1) throw new Error("activation decision schema version is invalid");
  if (typeof value.selectedId !== "string" || !CAPABILITY_ID.test(value.selectedId)) {
    throw new TypeError("activation decision selected identity is invalid");
  }
  if (!TASK_CLASSES.has(value.taskClass) || !CONSEQUENCE_CLASSES.has(value.consequenceClass)) {
    throw new Error("activation decision classification is invalid");
  }
  if (!MODES.has(value.mode)) throw new Error("activation decision mode is invalid");
  stringArray(value.reasonCodes, "activation decision reason codes");
  if (value.reasonCodes.length === 0) throw new Error("activation decision reason codes are required");
  if (value.preInferenceDisclosure !== DISCLOSURE[value.mode]
      || value.deferredReview !== (value.mode === "review")) {
    throw new Error("activation decision disclosure is incoherent");
  }
  validateMethodEvidence(value.methodEvidence);
  requireDigest(value.policyDigest, "activation decision policy digest");
  requireDigest(value.evidenceDigest, "activation decision evidence digest");
  validateAuthority(value.authorityProjection);
  if (value.authorityExpanded !== false) throw new Error("activation decision expanded authority");
  requireDigest(value.decisionDigest, "activation decision digest");
  const unsigned = structuredClone(value);
  delete unsigned.decisionDigest;
  if (digest(unsigned) !== value.decisionDigest) throw new Error("activation decision digest mismatch");
  return value;
}

export function validateActivationRequest(value) {
  exactKeys(value, [
    "schemaVersion", "protocolId", "requestId", "trustRootDigest",
    "classification", "selected", "authorityProjection",
  ], "activation request");
  if (value.schemaVersion !== 1) throw new Error("activation request schema version is invalid");
  if (value.protocolId !== PROTOCOL_ID) throw new Error("activation request protocol is unsupported");
  nonEmptyString(value.requestId, "activation request id");
  if (value.requestId.length > 512) throw new Error("activation request id is too long");
  requireDigest(value.trustRootDigest, "activation request trust root");
  validateClassification(value.classification);
  if (!Array.isArray(value.selected) || value.selected.length < 1 || value.selected.length > 3) {
    throw new Error("activation request requires one to three selected capabilities");
  }
  value.selected.forEach(validateSelected);
  if (new Set(value.selected.map(({ selectedId }) => selectedId)).size !== value.selected.length) {
    throw new Error("activation selected identities must be unique");
  }
  validateAuthority(value.authorityProjection);
  return deepFreeze(structuredClone(value));
}

export function validateActivationResult(value) {
  exactKeys(value, [
    "schemaVersion", "protocolId", "requestId", "requestDigest", "trustRootDigest",
    "policyDigest", "evidenceDigest", "classification", "decisions", "resultDigest",
  ], "activation result");
  if (value.schemaVersion !== 1) throw new Error("activation result schema version is invalid");
  if (value.protocolId !== PROTOCOL_ID) throw new Error("activation result protocol is unsupported");
  nonEmptyString(value.requestId, "activation result request id");
  requireDigest(value.requestDigest, "activation result request digest");
  requireDigest(value.trustRootDigest, "activation result trust root");
  requireDigest(value.policyDigest, "activation result policy digest");
  requireDigest(value.evidenceDigest, "activation result evidence digest");
  validateClassification(value.classification);
  if (!Array.isArray(value.decisions) || value.decisions.length < 1 || value.decisions.length > 3) {
    throw new Error("activation result requires one to three decisions");
  }
  value.decisions.forEach(validateDecision);
  if (new Set(value.decisions.map(({ selectedId }) => selectedId)).size !== value.decisions.length) {
    throw new Error("activation decision identities must be unique");
  }
  for (const decision of value.decisions) {
    if (decision.taskClass !== value.classification.taskClass
        || decision.consequenceClass !== value.classification.consequenceClass) {
      throw new Error("activation result classification does not match its decisions");
    }
    if (decision.policyDigest !== value.policyDigest || decision.evidenceDigest !== value.evidenceDigest) {
      throw new Error("activation result policy or evidence does not match its decisions");
    }
  }
  requireDigest(value.resultDigest, "activation result digest");
  const unsigned = structuredClone(value);
  delete unsigned.resultDigest;
  if (digest(unsigned) !== value.resultDigest) throw new Error("activation result digest mismatch");
  return deepFreeze(structuredClone(value));
}

export function buildActivationResult({ request, decisions, policyDigest, evidenceDigest } = {}) {
  const validatedRequest = validateActivationRequest(request);
  requireDigest(policyDigest, "activation result policy digest");
  requireDigest(evidenceDigest, "activation result evidence digest");
  if (!Array.isArray(decisions) || decisions.length !== validatedRequest.selected.length) {
    throw new Error("activation decision count does not match selected capabilities");
  }
  decisions.forEach(validateDecision);
  for (let index = 0; index < decisions.length; index += 1) {
    const decision = decisions[index];
    if (decision.selectedId !== validatedRequest.selected[index].selectedId) {
      throw new Error("activation decision selected order does not match request");
    }
    if (decision.taskClass !== validatedRequest.classification.taskClass
        || decision.consequenceClass !== validatedRequest.classification.consequenceClass) {
      throw new Error("activation decision classification does not match request");
    }
    if (JSON.stringify(stable(decision.authorityProjection))
        !== JSON.stringify(stable(validatedRequest.authorityProjection))) {
      throw new Error("activation decision authority does not match request");
    }
    if (decision.policyDigest !== policyDigest || decision.evidenceDigest !== evidenceDigest) {
      throw new Error("activation decision policy or evidence digest mismatch");
    }
  }
  const unsigned = {
    schemaVersion: 1,
    protocolId: PROTOCOL_ID,
    requestId: validatedRequest.requestId,
    requestDigest: digest(validatedRequest),
    trustRootDigest: validatedRequest.trustRootDigest,
    policyDigest,
    evidenceDigest,
    classification: structuredClone(validatedRequest.classification),
    decisions: structuredClone(decisions),
  };
  return validateActivationResult({ ...unsigned, resultDigest: digest(unsigned) });
}
