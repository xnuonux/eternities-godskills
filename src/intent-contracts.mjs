import {
  EVIDENCE_LEVELS,
  RISK_LEVELS,
  ROUTING_EFFECTS,
  validateRequestEnvelope,
  validateRoutingCard,
} from "./routing-contracts.mjs";

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function exactFields(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
}

function versionOne(value, label) {
  object(value, label);
  if (value.schemaVersion !== 1) throw new Error(`${label}.schemaVersion must be 1`);
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (value !== value.trim()) throw new Error(`${label} must not contain outer whitespace`);
}

function lexicalCompare(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function uniqueStrings(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  if (nonEmpty && value.length === 0) throw new Error(`${label} must not be empty`);
  for (const entry of value) nonEmptyString(entry, `${label} entry`);
  if (new Set(value).size !== value.length) throw new Error(`${label} must not contain duplicates`);
  const ordered = [...value].sort(lexicalCompare);
  if (value.some((entry, index) => entry !== ordered[index])) {
    throw new Error(`${label} must be lexically sorted`);
  }
  return value;
}

function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) throw new Error(`${label} contains unknown value: ${value}`);
}

function enumArray(value, allowed, label, options = {}) {
  uniqueStrings(value, label, options);
  for (const entry of value) enumValue(entry, allowed, label);
}

function boundedInteger(value, label, minimum, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
}

function digest(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a 64-character lowercase hex digest`);
  }
}

export function validateNaturalRequest(value) {
  versionOne(value, "naturalRequest");
  exactFields(value, ["schemaVersion", "requestId", "text", "context", "proposal"], "naturalRequest");
  nonEmptyString(value.requestId, "naturalRequest.requestId");
  nonEmptyString(value.text, "naturalRequest.text");
  const context = object(value.context, "naturalRequest.context");
  exactFields(context, [
    "permittedEffects",
    "availableAuthority",
    "availablePreconditions",
    "forbiddenCapabilities",
    "maximumRisk",
    "minimumEvidenceConfidence",
    "contextBudget",
    "maxCompositionSize",
  ], "naturalRequest.context");
  enumArray(context.permittedEffects, ROUTING_EFFECTS, "naturalRequest.context.permittedEffects", { nonEmpty: true });
  uniqueStrings(context.availableAuthority, "naturalRequest.context.availableAuthority");
  uniqueStrings(context.availablePreconditions, "naturalRequest.context.availablePreconditions");
  uniqueStrings(context.forbiddenCapabilities, "naturalRequest.context.forbiddenCapabilities");
  enumValue(context.maximumRisk, RISK_LEVELS, "naturalRequest.context.maximumRisk");
  enumValue(
    context.minimumEvidenceConfidence,
    EVIDENCE_LEVELS,
    "naturalRequest.context.minimumEvidenceConfidence",
  );
  boundedInteger(context.contextBudget, "naturalRequest.context.contextBudget", 1);
  boundedInteger(context.maxCompositionSize, "naturalRequest.context.maxCompositionSize", 1, 3);
  return value;
}

export function validateSemanticProposal(value, cards) {
  versionOne(value, "semanticProposal");
  exactFields(value, [
    "schemaVersion",
    "candidateIds",
    "requiredCapabilities",
    "requestedEffects",
    "unresolvedDecisions",
  ], "semanticProposal");
  if (!Array.isArray(cards)) throw new TypeError("cards must be an array");
  const validatedCards = cards.map(validateRoutingCard);
  const knownIds = new Set(validatedCards.map(({ id }) => id));
  const knownCapabilities = new Set(validatedCards.flatMap(({ provides }) => provides));
  uniqueStrings(value.candidateIds, "semanticProposal.candidateIds", { nonEmpty: true });
  uniqueStrings(value.requiredCapabilities, "semanticProposal.requiredCapabilities", { nonEmpty: true });
  enumArray(value.requestedEffects, ROUTING_EFFECTS, "semanticProposal.requestedEffects", { nonEmpty: true });
  uniqueStrings(value.unresolvedDecisions, "semanticProposal.unresolvedDecisions");
  for (const id of value.candidateIds) {
    if (!knownIds.has(id)) throw new Error(`unknown candidate id: ${id}`);
  }
  for (const capability of value.requiredCapabilities) {
    if (!knownCapabilities.has(capability)) throw new Error(`unknown capability: ${capability}`);
  }
  return value;
}

function validateCandidateScore(value, index) {
  const label = `compilerReceipt.candidateScores[${index}]`;
  object(value, label);
  exactFields(value, ["id", "score", "evidence"], label);
  nonEmptyString(value.id, `${label}.id`);
  if (!Number.isInteger(value.score)) throw new Error(`${label}.score must be an integer`);
  uniqueStrings(value.evidence, `${label}.evidence`, { nonEmpty: true });
}

export function validateCompilerReceipt(value) {
  versionOne(value, "compilerReceipt");
  exactFields(value, [
    "schemaVersion",
    "requestId",
    "requestDigest",
    "textDigest",
    "mode",
    "candidateScores",
    "acceptedProposalIds",
    "rejectedProposalIds",
    "requestedEffects",
    "suppliedAuthority",
    "unresolvedDecisions",
    "confidence",
    "envelope",
    "proofLimits",
  ], "compilerReceipt");
  nonEmptyString(value.requestId, "compilerReceipt.requestId");
  digest(value.requestDigest, "compilerReceipt.requestDigest");
  digest(value.textDigest, "compilerReceipt.textDigest");
  enumValue(value.mode, ["deterministic", "proposal-assisted"], "compilerReceipt.mode");
  if (!Array.isArray(value.candidateScores)) {
    throw new Error("compilerReceipt.candidateScores must be an array");
  }
  value.candidateScores.forEach(validateCandidateScore);
  const candidateIds = value.candidateScores.map(({ id }) => id);
  if (new Set(candidateIds).size !== candidateIds.length) {
    throw new Error("compilerReceipt.candidateScores must contain unique ids");
  }
  uniqueStrings(value.acceptedProposalIds, "compilerReceipt.acceptedProposalIds");
  uniqueStrings(value.rejectedProposalIds, "compilerReceipt.rejectedProposalIds");
  enumArray(value.requestedEffects, ROUTING_EFFECTS, "compilerReceipt.requestedEffects", { nonEmpty: true });
  uniqueStrings(value.suppliedAuthority, "compilerReceipt.suppliedAuthority");
  uniqueStrings(value.unresolvedDecisions, "compilerReceipt.unresolvedDecisions");
  enumValue(value.confidence, EVIDENCE_LEVELS, "compilerReceipt.confidence");
  validateRequestEnvelope(value.envelope);
  uniqueStrings(value.proofLimits, "compilerReceipt.proofLimits", { nonEmpty: true });
  if (value.requestId !== value.envelope.requestId) {
    throw new Error("compilerReceipt request id does not match envelope");
  }
  const supplied = new Set(value.suppliedAuthority);
  if (value.envelope.availableAuthority.some((authority) => !supplied.has(authority))) {
    throw new Error("compilerReceipt envelope authority exceeds supplied authority");
  }
  return value;
}
