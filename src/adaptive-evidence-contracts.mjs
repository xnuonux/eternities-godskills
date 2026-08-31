import { sha256 } from "./io.mjs";

const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const SHA256_PATTERN = "^[a-f0-9]{64}$";
const SHA256_RE = /^[a-f0-9]{64}$/;

const POLICY_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "runtimeModes",
  "trialVariants",
  "taskClasses",
  "reasoningTiers",
  "consequenceClasses",
  "profileKeyFields",
  "evidenceLevels",
  "promotableEvidenceLevels",
  "methodPromotion",
  "reviewPromotion",
  "activationFallbacks",
  "lifecycleGrants",
  "fixtureEvidenceCanPromote",
  "historicalEvidenceCanPromote",
  "selfReviewAllowed",
  "selfPromotionAllowed",
  "authorityExpanded",
]);

export const PROFILE_IDENTITY_FIELDS = Object.freeze([
  "capabilityId",
  "taskClass",
  "modelFamily",
  "reasoningTier",
  "consequenceClass",
  "capabilityVersion",
  "environmentId",
]);

export const TRIAL_VARIANTS = Object.freeze([
  "raw",
  "guardrail",
  "method",
  "reviewer",
  "combined",
]);

export const EVIDENCE_LEVELS = Object.freeze([
  "structural",
  "fixture",
  "artifact",
  "model",
  "cross-model",
  "field",
  "universal",
]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

export function canonicalFile(value) {
  return JSON.stringify(stable(value), null, 2) + "\n";
}

export function canonicalDigest(value) {
  return sha256(canonicalJson(value));
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys are not closed`);
  }
  return value;
}

export function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

export function digestString(value, label) {
  if (!SHA256_RE.test(value ?? "")) {
    throw new TypeError(`${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function exactStringArray(value, expected, label) {
  if (!Array.isArray(value) || JSON.stringify(value) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the required ordered values`);
  }
}

function uniqueStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0
      || value.some((item) => typeof item !== "string" || item.trim() === "")
      || new Set(value).size !== value.length) {
    throw new TypeError(`${label} must contain unique non-empty strings`);
  }
}

function validateThreshold(value, label) {
  exactKeys(value, [
    "minimumMatchedComparisons",
    "minimumWins",
    "minimumWinRate",
    "maximumCriticalRegressions",
    "maximumOverheadRatio",
  ], label);
  for (const key of ["minimumMatchedComparisons", "minimumWins", "maximumCriticalRegressions"]) {
    if (!Number.isInteger(value[key]) || value[key] < 0) {
      throw new TypeError(`${label}.${key} must be a non-negative integer`);
    }
  }
  if (typeof value.minimumWinRate !== "number" || value.minimumWinRate < 0
      || value.minimumWinRate > 1) {
    throw new TypeError(`${label}.minimumWinRate must be between zero and one`);
  }
  if (typeof value.maximumOverheadRatio !== "number"
      || !Number.isFinite(value.maximumOverheadRatio)
      || value.maximumOverheadRatio <= 0) {
    throw new TypeError(`${label}.maximumOverheadRatio must be positive`);
  }
}

export function validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest } = {}) {
  exactKeys(policy, POLICY_KEYS, "adaptive evidence policy");
  if (policy.schemaVersion !== 2 || policy.id !== "adaptive-evidence-policy-v2") {
    throw new Error("adaptive evidence policy identity is invalid");
  }
  digestString(expectedPolicyDigest, "expectedPolicyDigest");
  if (canonicalDigest(policy) !== expectedPolicyDigest) {
    throw new Error("adaptive evidence policy does not match the trusted policy digest");
  }
  exactStringArray(policy.runtimeModes, ["native", "guardrail", "method", "review"], "runtime modes");
  exactStringArray(policy.trialVariants, TRIAL_VARIANTS, "trial variants");
  exactStringArray(policy.profileKeyFields, PROFILE_IDENTITY_FIELDS, "profile key fields");
  exactStringArray(policy.evidenceLevels, EVIDENCE_LEVELS, "evidence levels");
  exactStringArray(
    policy.promotableEvidenceLevels,
    ["model", "cross-model", "field", "universal"],
    "promotable evidence levels",
  );
  uniqueStringArray(policy.taskClasses, "task classes");
  uniqueStringArray(policy.reasoningTiers, "reasoning tiers");
  exactStringArray(
    policy.consequenceClasses,
    ["low", "consequential", "critical"],
    "consequence classes",
  );
  validateThreshold(policy.methodPromotion, "method promotion threshold");
  validateThreshold(policy.reviewPromotion, "review promotion threshold");
  exactKeys(policy.activationFallbacks, [
    "staleCritical",
    "staleConsequential",
    "staleLow",
    "reviewUnavailableConsequential",
    "noQualifiedEvidence",
  ], "activation fallbacks");
  for (const mode of Object.values(policy.activationFallbacks)) {
    if (!policy.runtimeModes.includes(mode)) throw new Error("activation fallback mode is invalid");
  }
  exactKeys(policy.lifecycleGrants, ["promote", "demote", "quarantine", "invalidate"], "lifecycle grants");
  for (const grant of Object.values(policy.lifecycleGrants)) nonEmptyString(grant, "lifecycle grant");
  for (const flag of [
    "fixtureEvidenceCanPromote",
    "historicalEvidenceCanPromote",
    "selfReviewAllowed",
    "selfPromotionAllowed",
    "authorityExpanded",
  ]) {
    if (policy[flag] !== false) throw new Error(`${flag} must remain false`);
  }
  return deepFreeze(structuredClone(policy));
}

export function compileProfileIdentity(input) {
  exactKeys(input, PROFILE_IDENTITY_FIELDS, "profile identity");
  const identity = {};
  for (const field of PROFILE_IDENTITY_FIELDS) {
    identity[field] = nonEmptyString(input[field], `profile identity.${field}`);
  }
  digestString(identity.capabilityVersion, "profile identity.capabilityVersion");
  digestString(identity.environmentId, "profile identity.environmentId");
  return deepFreeze(identity);
}

export function profileKey(identity) {
  return canonicalDigest(compileProfileIdentity(identity));
}

export function sameProfileIdentity(left, right) {
  try {
    return canonicalJson(compileProfileIdentity(left)) === canonicalJson(compileProfileIdentity(right));
  } catch {
    return false;
  }
}

const digestSchema = () => ({ type: "string", pattern: SHA256_PATTERN });
const stringSchema = () => ({ type: "string", minLength: 1 });
const nullableDigestSchema = () => ({ anyOf: [digestSchema(), { type: "null" }] });
const profileIdentitySchema = () => ({
  type: "object",
  additionalProperties: false,
  required: [...PROFILE_IDENTITY_FIELDS],
  properties: Object.fromEntries(PROFILE_IDENTITY_FIELDS.map((field) => [
    field,
    ["capabilityVersion", "environmentId"].includes(field) ? digestSchema() : stringSchema(),
  ])),
});

function baseSchema(id, title, required, properties) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `urn:eternities:adaptive-evidence:v2:${id}`,
    title,
    type: "object",
    additionalProperties: false,
    required,
    properties,
  };
}

export function buildAdaptiveEvidenceSchemas() {
  const shadow = baseSchema("shadow-decision", "Adaptive evidence v2 shadow decision", [
    "schemaVersion", "id", "profileIdentity", "profileKey", "predictedMode",
    "predictedDecisionDigest", "disclosedLayerBodies", "nativeAttemptRequired",
    "artifactDigest", "policyDigest", "shadowDigest",
  ], {
    schemaVersion: { const: 2 },
    id: stringSchema(),
    profileIdentity: profileIdentitySchema(),
    profileKey: digestSchema(),
    predictedMode: { enum: ["native", "guardrail", "method", "review"] },
    predictedDecisionDigest: digestSchema(),
    disclosedLayerBodies: { type: "array", maxItems: 0 },
    nativeAttemptRequired: { const: true },
    artifactDigest: nullableDigestSchema(),
    policyDigest: digestSchema(),
    shadowDigest: digestSchema(),
  });
  const trial = baseSchema("trial-envelope", "Adaptive evidence v2 trial envelope", [
    "schemaVersion", "trialId", "status", "profileIdentity", "profileKey",
    "capabilityManifestDigest", "policyDigest", "taskDefinition",
    "comparisonPolicy", "artifactBoundary", "evaluator", "variants",
    "registeredAt", "trialDigest",
  ], {
    schemaVersion: { const: 2 },
    trialId: stringSchema(),
    status: { const: "preregistered" },
    profileIdentity: profileIdentitySchema(),
    profileKey: digestSchema(),
    capabilityManifestDigest: digestSchema(),
    policyDigest: digestSchema(),
    taskDefinition: {
      type: "object", additionalProperties: false,
      required: ["id", "version", "digest"],
      properties: { id: stringSchema(), version: stringSchema(), digest: digestSchema() },
    },
    comparisonPolicy: {
      type: "object", additionalProperties: false,
      required: ["id", "version", "digest", "baseline", "variants", "metrics", "stopConditions"],
      properties: {
        id: stringSchema(), version: stringSchema(), digest: digestSchema(),
        baseline: { const: "raw" },
        variants: { type: "array", items: { enum: [...TRIAL_VARIANTS] }, uniqueItems: true },
        metrics: { type: "array", items: stringSchema(), uniqueItems: true },
        stopConditions: { type: "array", items: stringSchema(), uniqueItems: true },
      },
    },
    artifactBoundary: {
      type: "object", additionalProperties: false,
      required: ["mediaType", "required"],
      properties: { mediaType: stringSchema(), required: { const: true } },
    },
    evaluator: {
      type: "object", additionalProperties: false,
      required: ["kind", "id", "digest"],
      properties: {
        kind: { enum: ["reviewer", "deterministic-verifier"] },
        id: stringSchema(), digest: digestSchema(),
      },
    },
    variants: { type: "array", items: { enum: [...TRIAL_VARIANTS] }, uniqueItems: true },
    registeredAt: stringSchema(),
    trialDigest: digestSchema(),
  });
  const evidenceRow = baseSchema("evidence-row", "Adaptive evidence v2 ledger row", [
    "schemaVersion", "sequence", "previousRowDigest", "proposalDigest", "trialDigest",
    "profileKey", "variant", "artifactDigest", "observationDigest",
    "outcomeAgainstRaw", "criticalRegression", "cost", "proofLevel",
    "producerId", "evaluatorId", "rowDigest",
  ], {
    schemaVersion: { const: 2 }, sequence: { type: "integer", minimum: 0 },
    previousRowDigest: nullableDigestSchema(), proposalDigest: digestSchema(),
    trialDigest: digestSchema(), profileKey: digestSchema(),
    variant: { enum: [...TRIAL_VARIANTS] }, artifactDigest: digestSchema(),
    observationDigest: digestSchema(), outcomeAgainstRaw: { enum: ["win", "loss", "tie", "baseline"] },
    criticalRegression: { type: "boolean" },
    cost: {
      type: "object", additionalProperties: false,
      required: ["bytes", "tokens", "latencyMs", "monetaryCost"],
      properties: {
        bytes: { type: "integer", minimum: 0 },
        tokens: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
        latencyMs: { anyOf: [{ type: "number", minimum: 0 }, { type: "null" }] },
        monetaryCost: { anyOf: [{ type: "number", minimum: 0 }, { type: "null" }] },
      },
    },
    proofLevel: { enum: [...EVIDENCE_LEVELS] }, producerId: stringSchema(),
    evaluatorId: stringSchema(), rowDigest: digestSchema(),
  });
  const profile = baseSchema("profile", "Adaptive evidence v2 derived profile", [
    "schemaVersion", "profileIdentity", "profileKey", "lifecycleState",
    "recommendedMode", "variantMetrics", "evidenceRowDigests",
    "promotableEvidenceRows", "failedGates", "boundDigests", "profileDigest",
  ], {
    schemaVersion: { const: 2 }, profileIdentity: profileIdentitySchema(),
    profileKey: digestSchema(), lifecycleState: { enum: ["ineligible", "eligible", "promoted", "demoted", "quarantined", "invalidated"] },
    recommendedMode: { enum: ["native", "guardrail", "method", "review"] },
    variantMetrics: { type: "array", items: stringSchema() },
    evidenceRowDigests: { type: "array", items: digestSchema(), uniqueItems: true },
    promotableEvidenceRows: { type: "integer", minimum: 0 },
    failedGates: { type: "array", items: stringSchema(), uniqueItems: true },
    boundDigests: {
      type: "object", additionalProperties: false,
      required: ["policyDigest", "taskDefinitionDigest", "comparisonPolicyDigest", "trialDigest", "ledgerDigest"],
      properties: {
        policyDigest: digestSchema(), taskDefinitionDigest: digestSchema(),
        comparisonPolicyDigest: digestSchema(), trialDigest: digestSchema(), ledgerDigest: digestSchema(),
      },
    },
    profileDigest: digestSchema(),
  });
  const lifecycle = baseSchema("lifecycle-decision", "Adaptive evidence v2 lifecycle decision", [
    "schemaVersion", "action", "status", "actorId", "authorizationDigest",
    "profileDigest", "evidenceDigest", "priorMode", "nextMode", "reasonCodes",
    "authorityExpanded", "decisionDigest",
  ], {
    schemaVersion: { const: 2 }, action: { enum: ["promote", "demote", "quarantine", "invalidate"] },
    status: { enum: ["applied", "rejected", "no-change"] }, actorId: stringSchema(),
    authorizationDigest: digestSchema(), profileDigest: digestSchema(), evidenceDigest: digestSchema(),
    priorMode: { enum: ["native", "guardrail", "method", "review"] },
    nextMode: { enum: ["native", "guardrail", "method", "review"] },
    reasonCodes: { type: "array", items: stringSchema(), uniqueItems: true },
    authorityExpanded: { const: false }, decisionDigest: digestSchema(),
  });
  return deepFreeze({
    "evidence-row.schema.json": evidenceRow,
    "lifecycle-decision.schema.json": lifecycle,
    "profile.schema.json": profile,
    "shadow-decision.schema.json": shadow,
    "trial-envelope.schema.json": trial,
  });
}
