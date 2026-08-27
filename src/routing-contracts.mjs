export const ROUTING_EFFECTS = Object.freeze([
  "none",
  "local-read",
  "external-read",
  "local-write",
  "external-write",
]);

export const EFFECT_COSTS = Object.freeze({
  none: 0,
  "local-read": 1,
  "external-read": 2,
  "local-write": 3,
  "external-write": 5,
});

export const RISK_LEVELS = Object.freeze(["low", "moderate", "high", "critical"]);
export const EVIDENCE_LEVELS = Object.freeze(["verified", "high", "medium", "low"]);
export const ROUTE_STATUSES = Object.freeze([
  "selected",
  "needs-decision",
  "no-qualified-route",
]);
export const DECISION_POLICY =
  "coverage>card-count>extra-capabilities>effects>context>dependencies>evidence>id";

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
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
  if (new Set(value).size !== value.length) {
    throw new Error(`${label} must not contain duplicates`);
  }
  const sorted = [...value].sort(lexicalCompare);
  if (value.some((entry, index) => entry !== sorted[index])) {
    throw new Error(`${label} must be lexically sorted`);
  }
  return value;
}

function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) throw new Error(`${label} contains unknown value: ${value}`);
  return value;
}

function enumArray(value, allowed, label, options = {}) {
  uniqueStrings(value, label, options);
  for (const entry of value) enumValue(entry, allowed, label);
  return value;
}

function boundedInteger(value, label, minimum, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    const suffix = maximum === Number.MAX_SAFE_INTEGER
      ? `${minimum}`
      : `${minimum} to ${maximum}`;
    throw new Error(`${label} must be an integer from ${suffix}`);
  }
  return value;
}

function relativeSkillEntrypoint(value, label = "entrypoint") {
  nonEmptyString(value, label);
  if (/^[a-z]:[\\/]/i.test(value) || value.startsWith("/") || value.startsWith("\\")) {
    throw new Error(`${label} must be a normalized relative path`);
  }
  if (value.includes("\\")) throw new Error(`${label} must use forward slashes`);
  const segments = value.split("/");
  if (segments.includes("..")) throw new Error(`${label} must not contain parent traversal`);
  if (segments.some((segment) => segment === "" || segment === ".")) {
    throw new Error(`${label} must be a normalized relative path`);
  }
  if (segments.at(-1) !== "SKILL.md") throw new Error(`${label} must end in SKILL.md`);
  return value;
}

function validateRequestFeatures(value, label = "routeReceipt.requestFeatures") {
  object(value, label);
  uniqueStrings(value.candidateFamilies, `${label}.candidateFamilies`);
  uniqueStrings(value.requiredCapabilities, `${label}.requiredCapabilities`, {
    nonEmpty: true,
  });
  enumArray(value.permittedEffects, ROUTING_EFFECTS, `${label}.permittedEffects`, {
    nonEmpty: true,
  });
  enumValue(value.maximumRisk, RISK_LEVELS, `${label}.maximumRisk`);
  enumValue(
    value.minimumEvidenceConfidence,
    EVIDENCE_LEVELS,
    `${label}.minimumEvidenceConfidence`,
  );
  boundedInteger(value.contextBudget, `${label}.contextBudget`, 1);
  return value;
}

export function validateRequestEnvelope(value) {
  versionOne(value, "requestEnvelope");
  nonEmptyString(value.requestId, "requestEnvelope.requestId");
  nonEmptyString(value.outcome, "requestEnvelope.outcome");
  uniqueStrings(value.candidateFamilies, "requestEnvelope.candidateFamilies");
  uniqueStrings(value.requiredCapabilities, "requestEnvelope.requiredCapabilities", {
    nonEmpty: true,
  });
  uniqueStrings(value.forbiddenCapabilities, "requestEnvelope.forbiddenCapabilities");
  enumArray(
    value.permittedEffects,
    ROUTING_EFFECTS,
    "requestEnvelope.permittedEffects",
    { nonEmpty: true },
  );
  uniqueStrings(value.availableAuthority, "requestEnvelope.availableAuthority");
  uniqueStrings(value.availablePreconditions, "requestEnvelope.availablePreconditions");
  enumValue(value.maximumRisk, RISK_LEVELS, "requestEnvelope.maximumRisk");
  enumValue(
    value.minimumEvidenceConfidence,
    EVIDENCE_LEVELS,
    "requestEnvelope.minimumEvidenceConfidence",
  );
  boundedInteger(value.contextBudget, "requestEnvelope.contextBudget", 1);
  boundedInteger(value.maxCompositionSize, "requestEnvelope.maxCompositionSize", 1, 3);
  uniqueStrings(value.unresolvedDecisions, "requestEnvelope.unresolvedDecisions");
  return value;
}

export function validateRoutingCard(value) {
  versionOne(value, "routingCard");
  for (const field of ["id", "family", "intent", "successCondition"]) {
    nonEmptyString(value[field], `routingCard.${field}`);
  }
  uniqueStrings(value.provides, "routingCard.provides", { nonEmpty: true });
  uniqueStrings(value.requires, "routingCard.requires");
  object(value.intentExamples, "routingCard.intentExamples");
  for (const field of ["direct", "paraphrased", "contextual"]) {
    uniqueStrings(
      value.intentExamples[field],
      `routingCard.intentExamples.${field}`,
      { nonEmpty: true },
    );
  }
  uniqueStrings(value.negativeIntents, "routingCard.negativeIntents", {
    nonEmpty: true,
  });
  enumArray(value.effects, ROUTING_EFFECTS, "routingCard.effects", { nonEmpty: true });
  if (value.effects.includes("none") && value.effects.length > 1) {
    throw new Error("routingCard.effects cannot combine none with other effects");
  }
  enumValue(value.riskClass, RISK_LEVELS, "routingCard.riskClass");
  uniqueStrings(value.authorityRequirements, "routingCard.authorityRequirements");
  uniqueStrings(value.preconditions, "routingCard.preconditions");
  uniqueStrings(value.compatibleWith, "routingCard.compatibleWith");
  uniqueStrings(value.conflictsWith, "routingCard.conflictsWith");
  boundedInteger(value.contextCost, "routingCard.contextCost", 1);
  boundedInteger(value.dependencyCost, "routingCard.dependencyCost", 0);
  enumValue(
    value.evidenceConfidence,
    EVIDENCE_LEVELS,
    "routingCard.evidenceConfidence",
  );
  relativeSkillEntrypoint(value.entrypoint, "routingCard.entrypoint");
  uniqueStrings(value.legacyAliases, "routingCard.legacyAliases");
  return value;
}

export function validateRouteReceipt(value) {
  versionOne(value, "routeReceipt");
  nonEmptyString(value.requestId, "routeReceipt.requestId");
  if (!/^[0-9a-f]{64}$/.test(value.requestDigest)) {
    throw new Error("routeReceipt.requestDigest must be a 64-character lowercase hex digest");
  }
  enumValue(value.status, ROUTE_STATUSES, "routeReceipt.status");
  enumValue(value.selectionKind, ["single", "composition", "none"], "routeReceipt.selectionKind");
  validateRequestFeatures(value.requestFeatures);
  uniqueStrings(value.candidateIds, "routeReceipt.candidateIds");
  uniqueStrings(value.selectedIds, "routeReceipt.selectedIds");
  uniqueStrings(value.selectedEntrypoints, "routeReceipt.selectedEntrypoints");
  if (value.selectedIds.length !== value.selectedEntrypoints.length) {
    throw new Error("routeReceipt selectedIds and selectedEntrypoints must have equal length");
  }
  for (const [index, id] of value.selectedIds.entries()) {
    const expected = `skills/${id}/SKILL.md`;
    if (value.selectedEntrypoints[index] !== expected) {
      throw new Error(`routeReceipt selected entrypoint does not match id: ${id}`);
    }
    if (!value.candidateIds.includes(id)) {
      throw new Error(`routeReceipt selected id is not a candidate: ${id}`);
    }
  }
  if (!Array.isArray(value.rejected)) throw new Error("routeReceipt.rejected must be an array");
  let previousRejectedId = null;
  for (const [index, rejection] of value.rejected.entries()) {
    object(rejection, `routeReceipt.rejected[${index}]`);
    nonEmptyString(rejection.id, `routeReceipt.rejected[${index}].id`);
    uniqueStrings(rejection.reasons, `routeReceipt.rejected[${index}].reasons`, {
      nonEmpty: true,
    });
    if (previousRejectedId !== null && lexicalCompare(previousRejectedId, rejection.id) >= 0) {
      throw new Error("routeReceipt.rejected must be sorted by unique id");
    }
    previousRejectedId = rejection.id;
  }
  uniqueStrings(value.unresolvedDecisions, "routeReceipt.unresolvedDecisions");
  if (value.decisionPolicy !== DECISION_POLICY) {
    throw new Error(`routeReceipt.decisionPolicy must be ${DECISION_POLICY}`);
  }

  if (value.status === "selected") {
    if (value.selectionKind === "none" || value.selectedIds.length === 0) {
      throw new Error("selected receipt must contain a selection");
    }
    if (value.selectionKind === "single" && value.selectedIds.length !== 1) {
      throw new Error("single selection must contain exactly one id");
    }
    if (value.selectionKind === "composition" && value.selectedIds.length < 2) {
      throw new Error("composition selection must contain at least two ids");
    }
    enumValue(
      value.selectionConfidence,
      EVIDENCE_LEVELS,
      "routeReceipt.selectionConfidence",
    );
  } else {
    if (
      value.selectionKind !== "none" ||
      value.selectedIds.length !== 0 ||
      value.selectedEntrypoints.length !== 0 ||
      value.selectionConfidence !== null
    ) {
      throw new Error(`${value.status} receipt must not contain a selection`);
    }
  }
  if (value.status === "needs-decision" && value.unresolvedDecisions.length === 0) {
    throw new Error("needs-decision receipt must contain unresolved decisions");
  }
  return value;
}

export function effectCost(effects) {
  enumArray([...new Set(effects)].sort(lexicalCompare), ROUTING_EFFECTS, "effects");
  return [...new Set(effects)].reduce((total, effect) => total + EFFECT_COSTS[effect], 0);
}

export function riskAtMost(actual, maximum) {
  enumValue(actual, RISK_LEVELS, "risk");
  enumValue(maximum, RISK_LEVELS, "maximumRisk");
  return RISK_LEVELS.indexOf(actual) <= RISK_LEVELS.indexOf(maximum);
}

export function evidenceAtLeast(actual, minimum) {
  enumValue(actual, EVIDENCE_LEVELS, "evidenceConfidence");
  enumValue(minimum, EVIDENCE_LEVELS, "minimumEvidenceConfidence");
  return EVIDENCE_LEVELS.indexOf(actual) <= EVIDENCE_LEVELS.indexOf(minimum);
}
