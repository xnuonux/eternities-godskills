import { validateCompilerReceipt, validateNaturalRequest } from "./intent-contracts.mjs";
import { sha256 } from "./io.mjs";
import {
  DECISION_POLICY,
  validateRequestEnvelope,
  validateRouteReceipt,
} from "./routing-contracts.mjs";

export const PREFERENCE_PROTOCOL_ID =
  "eternities-godskills-specialist-preference-v1";
export const PREFERENCE_DECISION_POLICY =
  "coverage>card-count>extra-capabilities>effects>context>dependencies>evidence>preference>id";

const PREFERENCE_REASONS = Object.freeze([
  "equal-quality-tie-break",
  "selected-without-effect",
  "stronger-nonpreferred-selection",
  "preference-not-route-capable",
  "preference-not-semantic-candidate",
  "no-qualified-preference",
  "no-selection",
  "unresolved-decision",
]);

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function equalArrays(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function exactFields(value, expected, label) {
  const actual = Object.keys(value).sort(lexical);
  const orderedExpected = [...expected].sort(lexical);
  if (!equalArrays(actual, orderedExpected)) throw new Error(`${label} must contain exact fields`);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function preferenceDigest(value) {
  return sha256(JSON.stringify(stable(value)));
}

export function validatePreferredCapabilities(value, label = "preferredCapabilities") {
  if (!Array.isArray(value) || value.length === 0 || value.length > 32
      || value.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new Error(`${label} must be a non-empty array of at most 32 strings`);
  }
  if (value.some((entry) => entry !== entry.trim())) {
    throw new Error(`${label} entries must not contain outer whitespace`);
  }
  if (new Set(value).size !== value.length) throw new Error(`${label} must not contain duplicates`);
  if (!equalArrays(value, [...value].sort(lexical))) {
    throw new Error(`${label} must be in lexical order`);
  }
  return value;
}

export function splitPreferenceRequest(request) {
  object(request, "preference natural request");
  object(request.context, "preference natural request context");
  if (request.context.preferredCapabilities === undefined) {
    return Object.freeze({
      baseRequest: validateNaturalRequest(request),
      preferredCapabilities: undefined,
    });
  }
  const preferredCapabilities = [
    ...validatePreferredCapabilities(
      request.context.preferredCapabilities,
      "naturalRequest.context.preferredCapabilities",
    ),
  ];
  const baseRequest = structuredClone(request);
  delete baseRequest.context.preferredCapabilities;
  validateNaturalRequest(baseRequest);
  return Object.freeze({ baseRequest, preferredCapabilities: Object.freeze(preferredCapabilities) });
}

export function splitPreferenceEnvelope(envelope) {
  object(envelope, "preference request envelope");
  if (envelope.preferredCapabilities === undefined) {
    return Object.freeze({
      baseEnvelope: validateRequestEnvelope(envelope),
      preferredCapabilities: undefined,
    });
  }
  exactFields(envelope, [
    "schemaVersion",
    "requestId",
    "outcome",
    "candidateFamilies",
    "requiredCapabilities",
    "forbiddenCapabilities",
    "permittedEffects",
    "availableAuthority",
    "availablePreconditions",
    "maximumRisk",
    "minimumEvidenceConfidence",
    "contextBudget",
    "maxCompositionSize",
    "unresolvedDecisions",
    "preferredCapabilities",
  ], "preference request envelope");
  const preferredCapabilities = [
    ...validatePreferredCapabilities(
      envelope.preferredCapabilities,
      "requestEnvelope.preferredCapabilities",
    ),
  ];
  const baseEnvelope = structuredClone(envelope);
  delete baseEnvelope.preferredCapabilities;
  validateRequestEnvelope(baseEnvelope);
  for (const id of preferredCapabilities) {
    if (baseEnvelope.forbiddenCapabilities.includes(id)) {
      throw new Error(`preferred capability id is explicitly forbidden: ${id}`);
    }
  }
  return Object.freeze({ baseEnvelope, preferredCapabilities: Object.freeze(preferredCapabilities) });
}

export function validatePreferenceEnvelope(envelope) {
  splitPreferenceEnvelope(envelope);
  return envelope;
}

export function extendCompilerReceipt({ baseReceipt, request, preferredCapabilities }) {
  validateCompilerReceipt(baseReceipt);
  validatePreferredCapabilities(preferredCapabilities);
  const split = splitPreferenceRequest(request);
  if (split.preferredCapabilities === undefined
      || !equalArrays(split.preferredCapabilities, preferredCapabilities)) {
    throw new Error("compiler request preference mismatch");
  }
  if (baseReceipt.requestId !== split.baseRequest.requestId
      || baseReceipt.requestDigest !== preferenceDigest(split.baseRequest)) {
    throw new Error("compiler base receipt does not match the preference-free request");
  }
  const envelope = {
    ...baseReceipt.envelope,
    preferredCapabilities: [...preferredCapabilities],
  };
  splitPreferenceEnvelope(envelope);
  const receipt = {
    ...baseReceipt,
    requestDigest: preferenceDigest(request),
    envelope,
  };
  validateCompilerReceipt(receipt);
  if (!equalArrays(receipt.envelope.preferredCapabilities, preferredCapabilities)) {
    throw new Error("compiler receipt preference echo mismatch");
  }
  return receipt;
}

function validateStringSet(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  if (nonEmpty && value.length === 0) throw new Error(`${label} must not be empty`);
  if (new Set(value).size !== value.length) throw new Error(`${label} must not contain duplicates`);
  if (!equalArrays(value, [...value].sort(lexical))) throw new Error(`${label} must be sorted`);
}

function validatePreferenceRecord(value, receipt) {
  object(value, "routeReceipt.preference");
  exactFields(value, [
    "protocolId",
    "suppliedIds",
    "qualifiedIds",
    "selectedIds",
    "baselineSelectedIds",
    "semanticCandidateIds",
    "applied",
    "reason",
  ], "routeReceipt.preference");
  if (value.protocolId !== PREFERENCE_PROTOCOL_ID) {
    throw new Error(`routeReceipt.preference.protocolId must be ${PREFERENCE_PROTOCOL_ID}`);
  }
  validatePreferredCapabilities(value.suppliedIds, "routeReceipt.preference.suppliedIds");
  for (const field of [
    "qualifiedIds",
    "selectedIds",
    "baselineSelectedIds",
    "semanticCandidateIds",
  ]) {
    validateStringSet(value[field], `routeReceipt.preference.${field}`);
  }
  if (!equalArrays(value.suppliedIds, receipt.requestFeatures.preferredCapabilities)) {
    throw new Error("routeReceipt preference supplied ids do not match request features");
  }
  const candidateIds = new Set(receipt.candidateIds);
  const suppliedIds = new Set(value.suppliedIds);
  const qualifiedIds = new Set(value.qualifiedIds);
  const semanticCandidateIds = new Set(value.semanticCandidateIds);
  for (const id of value.suppliedIds) {
    if (!candidateIds.has(id)) throw new Error("routeReceipt supplied preference is not a candidate");
  }
  for (const id of [...value.qualifiedIds, ...value.baselineSelectedIds]) {
    if (!candidateIds.has(id)) throw new Error("routeReceipt preference references a noncandidate id");
  }
  for (const id of value.semanticCandidateIds) {
    if (!candidateIds.has(id)) throw new Error("routeReceipt semantic preference id is not a candidate");
  }
  for (const id of [...value.selectedIds, ...value.baselineSelectedIds]) {
    if (!semanticCandidateIds.has(id)) {
      throw new Error("routeReceipt preference selection escaped semantic candidates");
    }
  }
  for (const id of value.qualifiedIds) {
    if (!suppliedIds.has(id)) throw new Error("routeReceipt qualified preference was not supplied");
  }
  if (!equalArrays(value.selectedIds, receipt.selectedIds)) {
    throw new Error("routeReceipt preference selected ids do not match the route selection");
  }
  for (const id of value.selectedIds) {
    if (suppliedIds.has(id) && !qualifiedIds.has(id)) {
      throw new Error("routeReceipt selected preference is not recorded as qualified");
    }
  }
  if (typeof value.applied !== "boolean") {
    throw new Error("routeReceipt.preference.applied must be boolean");
  }
  if (!PREFERENCE_REASONS.includes(value.reason)) {
    throw new Error("routeReceipt.preference.reason is invalid");
  }
  const changed = !equalArrays(value.selectedIds, value.baselineSelectedIds);
  if (value.applied !== (value.reason === "equal-quality-tie-break")
      || value.applied !== changed) {
    throw new Error("routeReceipt preference applied claim does not match its selections");
  }
  if (receipt.status === "needs-decision") {
    if (value.reason !== "unresolved-decision" || value.selectedIds.length > 0
        || value.baselineSelectedIds.length > 0) {
      throw new Error("routeReceipt unresolved preference record is inconsistent");
    }
  } else if (receipt.status === "no-qualified-route") {
    if (value.reason !== "no-selection" || value.selectedIds.length > 0
        || value.baselineSelectedIds.length > 0) {
      throw new Error("routeReceipt no-selection preference record is inconsistent");
    }
  } else if (value.reason === "equal-quality-tie-break") {
    const selectedPreferred = value.selectedIds.filter((id) => suppliedIds.has(id)).length;
    const baselinePreferred = value.baselineSelectedIds.filter((id) => suppliedIds.has(id)).length;
    if (selectedPreferred <= baselinePreferred) {
      throw new Error("routeReceipt preference tie-break moved selection in the wrong direction");
    }
  } else if (value.reason === "selected-without-effect") {
    if (!equalArrays(value.selectedIds, value.baselineSelectedIds)
        || !value.selectedIds.some((id) => suppliedIds.has(id))) {
      throw new Error("routeReceipt selected-without-effect preference record is inconsistent");
    }
  } else if (value.reason === "stronger-nonpreferred-selection") {
    if (!equalArrays(value.selectedIds, value.baselineSelectedIds)
        || !value.qualifiedIds.some((id) => semanticCandidateIds.has(id))
        || value.selectedIds.some((id) => suppliedIds.has(id))) {
      throw new Error("routeReceipt stronger nonpreferred preference record is inconsistent");
    }
  } else if (value.reason === "preference-not-route-capable") {
    if (!equalArrays(value.selectedIds, value.baselineSelectedIds)
        || !value.qualifiedIds.some((id) => semanticCandidateIds.has(id))
        || value.selectedIds.some((id) => suppliedIds.has(id))) {
      throw new Error("routeReceipt non-route-capable preference record is inconsistent");
    }
  } else if (value.reason === "preference-not-semantic-candidate") {
    if (!equalArrays(value.selectedIds, value.baselineSelectedIds)
        || value.qualifiedIds.length === 0
        || value.qualifiedIds.some((id) => semanticCandidateIds.has(id))
        || value.selectedIds.some((id) => suppliedIds.has(id))) {
      throw new Error("routeReceipt non-semantic preference record is inconsistent");
    }
  } else if (value.reason === "no-qualified-preference") {
    if (value.qualifiedIds.length !== 0 || !equalArrays(value.selectedIds, value.baselineSelectedIds)) {
      throw new Error("routeReceipt no-qualified-preference record is inconsistent");
    }
  }
}

export function validatePreferenceRouteReceipt(value) {
  object(value, "preference route receipt");
  const preferredCapabilities = value.requestFeatures?.preferredCapabilities;
  if (preferredCapabilities === undefined) {
    if (value.preference !== undefined) {
      throw new Error("routeReceipt cannot contain preference metadata without a preference request");
    }
    return validateRouteReceipt(value);
  }
  validatePreferredCapabilities(
    preferredCapabilities,
    "routeReceipt.requestFeatures.preferredCapabilities",
  );
  if (value.decisionPolicy !== PREFERENCE_DECISION_POLICY) {
    throw new Error(`routeReceipt.decisionPolicy must be ${PREFERENCE_DECISION_POLICY}`);
  }
  const baseReceipt = structuredClone(value);
  delete baseReceipt.requestFeatures.preferredCapabilities;
  delete baseReceipt.preference;
  baseReceipt.decisionPolicy = DECISION_POLICY;
  validateRouteReceipt(baseReceipt);
  validatePreferenceRecord(value.preference, value);
  return value;
}
