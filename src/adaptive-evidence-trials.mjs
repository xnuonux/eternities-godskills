import {
  EVIDENCE_LEVELS,
  TRIAL_VARIANTS,
  canonicalDigest,
  compileProfileIdentity,
  deepFreeze,
  digestString,
  exactKeys,
  nonEmptyString,
  profileKey,
  sameProfileIdentity,
  validateAdaptiveEvidencePolicy,
} from "./adaptive-evidence-contracts.mjs";
import { createAdaptiveEvidenceAuthority } from "./adaptive-evidence-authority.mjs";

const PROFILE_KEYS = Object.freeze([
  "schemaVersion",
  "profileIdentity",
  "profileKey",
  "lifecycleState",
  "recommendedMode",
  "variantMetrics",
  "evidenceRowDigests",
  "participantIds",
  "promotableEvidenceRows",
  "failedGates",
  "boundDigests",
  "profileDigest",
]);
const PROFILE_STATES = new Set([
  "ineligible",
  "eligible",
  "promoted",
  "demoted",
  "quarantined",
  "invalidated",
]);
const DISCLOSURE = Object.freeze({
  native: "none",
  guardrail: "guardrails-only",
  method: "entrypoint-and-contract",
  review: "none",
});

function boolean(value, label) {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
  return value;
}

function uniqueStrings(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)
      || value.some((item) => typeof item !== "string" || item.trim() === "")
      || new Set(value).size !== value.length) {
    throw new TypeError(`${label} must contain unique non-empty strings`);
  }
  return value;
}

function closedInput(value, allowed, required, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key));
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0 || missing.length > 0) {
    throw new Error(`${label} keys are not closed`);
  }
  return value;
}

function exactIso(value, label) {
  nonEmptyString(value, label);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new TypeError(`${label} must be an exact ISO timestamp`);
  }
  return value;
}

function finiteNonNegative(value, label, { nullable = false, integer = false } = {}) {
  if (nullable && value === null) return value;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0
      || (integer && !Number.isInteger(value))) {
    throw new TypeError(`${label} must be ${nullable ? "null or " : ""}a non-negative${integer ? " integer" : " number"}`);
  }
  return value;
}

function validateAuthorityProjection(authorityProjection) {
  exactKeys(
    authorityProjection,
    ["availableAuthority", "permittedEffects"],
    "authority projection",
  );
  uniqueStrings(authorityProjection.availableAuthority, "available authority", { allowEmpty: true });
  uniqueStrings(authorityProjection.permittedEffects, "permitted effects", { allowEmpty: true });
  return structuredClone(authorityProjection);
}

function validateProfile(profile) {
  exactKeys(profile, PROFILE_KEYS, "activation profile");
  if (profile.schemaVersion !== 2 || !PROFILE_STATES.has(profile.lifecycleState)
      || !DISCLOSURE[profile.recommendedMode]) {
    throw new Error("activation profile identity or state is invalid");
  }
  const identity = compileProfileIdentity(profile.profileIdentity);
  if (profile.profileKey !== profileKey(identity)) {
    throw new Error("activation profile key does not match its identity");
  }
  uniqueStrings(profile.evidenceRowDigests, "profile evidence row digests", { allowEmpty: true });
  for (const value of profile.evidenceRowDigests) digestString(value, "profile evidence row digest");
  if (!Array.isArray(profile.variantMetrics)) throw new TypeError("profile variant metrics must be an array");
  exactKeys(profile.participantIds, ["producers", "evaluators"], "profile participant identities");
  uniqueStrings(profile.participantIds.producers, "profile producers", { allowEmpty: true });
  uniqueStrings(profile.participantIds.evaluators, "profile evaluators", { allowEmpty: true });
  if (!Number.isInteger(profile.promotableEvidenceRows) || profile.promotableEvidenceRows < 0) {
    throw new TypeError("profile promotable evidence rows must be a non-negative integer");
  }
  uniqueStrings(profile.failedGates, "profile failed gates", { allowEmpty: true });
  exactKeys(profile.boundDigests, [
    "policyDigest",
    "taskDefinitionDigest",
    "comparisonPolicyDigest",
    "trialDigest",
    "ledgerDigest",
  ], "profile bound digests");
  for (const [name, value] of Object.entries(profile.boundDigests)) {
    digestString(value, `profile bound digest.${name}`);
  }
  const { profileDigest, ...unsigned } = profile;
  digestString(profileDigest, "profile digest");
  if (canonicalDigest(unsigned) !== profileDigest) {
    throw new Error("profile digest does not match its body");
  }
  return profile;
}

function fallbackMode(consequenceClass, policy) {
  if (consequenceClass === "critical") return policy.activationFallbacks.staleCritical;
  if (consequenceClass === "consequential") return policy.activationFallbacks.staleConsequential;
  return policy.activationFallbacks.staleLow;
}

function validateActivationBindings(bindings) {
  exactKeys(bindings, [
    "policyDigest",
    "taskDefinitionDigest",
    "comparisonPolicyDigest",
    "trialDigest",
    "ledgerDigest",
  ], "activation current bindings");
  for (const [name, digest] of Object.entries(bindings)) {
    digestString(digest, `activation current binding.${name}`);
  }
  return bindings;
}

function validateLifecycleDecision(decision) {
  exactKeys(decision, [
    "schemaVersion",
    "action",
    "status",
    "actorId",
    "authorityKeyId",
    "authorityTrustRootDigest",
    "authorizationDigest",
    "profileDigest",
    "bindingsDigest",
    "evidenceDigest",
    "priorMode",
    "nextMode",
    "decidedAt",
    "reasonCodes",
    "authorityExpanded",
    "decisionDigest",
  ], "activation lifecycle decision");
  const { decisionDigest, ...body } = decision;
  digestString(decisionDigest, "activation lifecycle decision digest");
  if (canonicalDigest(body) !== decisionDigest || decision.schemaVersion !== 2
      || decision.authorityExpanded !== false) {
    throw new Error("activation lifecycle decision digest or boundary is invalid");
  }
  for (const field of [
    "authorityTrustRootDigest", "authorizationDigest", "profileDigest", "bindingsDigest",
    "evidenceDigest",
  ]) digestString(decision[field], `activation lifecycle decision.${field}`);
  for (const field of ["actorId", "authorityKeyId", "action", "status", "priorMode", "nextMode"]) {
    nonEmptyString(decision[field], `activation lifecycle decision.${field}`);
  }
  exactIso(decision.decidedAt, "activation lifecycle decision.decidedAt");
  uniqueStrings(decision.reasonCodes, "activation lifecycle decision reason codes", {
    allowEmpty: true,
  });
  return decision;
}

function compileActivationDecisionV2Internal(options, trust) {
  const commonKeys = [
    "selectedId",
    "task",
    "profileIdentity",
    "explicitMethodRequest",
    "reviewAvailable",
    "profile",
    "policy",
  ];
  const activationKeys = trust === null
    ? [...commonKeys, "expectedPolicyDigest"]
    : [...commonKeys, "currentBindings", "lifecycleDecision", "lifecycleDecisionAttestation"];
  closedInput(
    options,
    activationKeys,
    trust === null
      ? ["selectedId", "task", "profileIdentity", "policy", "expectedPolicyDigest"]
      : [
          "selectedId", "task", "profileIdentity", "profile", "currentBindings",
          "lifecycleDecision", "lifecycleDecisionAttestation", "policy",
        ],
    "activation v2 input",
  );
  const {
    selectedId,
    task,
    profileIdentity: identityInput,
    explicitMethodRequest = false,
    reviewAvailable = false,
    profile = null,
    policy,
  } = options;
  const expectedPolicyDigest = trust?.expectedPolicyDigest ?? options.expectedPolicyDigest;
  nonEmptyString(selectedId, "selectedId");
  const trustedPolicy = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  boolean(explicitMethodRequest, "explicitMethodRequest");
  boolean(reviewAvailable, "reviewAvailable");
  exactKeys(task, ["taskClass", "consequenceClass", "authorityProjection"], "activation v2 task");
  if (!trustedPolicy.taskClasses.includes(task.taskClass)) {
    throw new Error("activation v2 task class is not allowed by policy");
  }
  if (!trustedPolicy.consequenceClasses.includes(task.consequenceClass)) {
    throw new Error("activation v2 consequence class is not allowed by policy");
  }
  const identity = compileProfileIdentity(identityInput);
  if (identity.capabilityId !== selectedId || identity.taskClass !== task.taskClass
      || identity.consequenceClass !== task.consequenceClass) {
    throw new Error("activation v2 task does not match the complete profile identity");
  }
  if (!trustedPolicy.reasoningTiers.includes(identity.reasoningTier)) {
    throw new Error("activation v2 reasoning tier is not allowed by policy");
  }
  const authorityProjection = validateAuthorityProjection(task.authorityProjection);

  let profileFresh = false;
  let profileDigest = null;
  let lifecycleDecisionDigest = null;
  let authorityTrustRootDigest = null;
  let authorizationDigest = null;
  if (profile !== null) {
    validateProfile(profile);
    profileDigest = profile.profileDigest;
    if (trust !== null) {
      const currentBindings = validateActivationBindings(options.currentBindings);
      const lifecycle = validateLifecycleDecision(options.lifecycleDecision);
      const bindingsDigest = canonicalDigest(currentBindings);
      const lifecycleAttestation = trust.authority.verifyLifecycleDecisionAttestation({
        attestation: options.lifecycleDecisionAttestation,
        expectedDecisionDigest: lifecycle.decisionDigest,
      });
      if (lifecycle.action !== "promote" || lifecycle.status !== "applied"
          || lifecycle.profileDigest !== profile.profileDigest
          || lifecycle.bindingsDigest !== bindingsDigest
          || lifecycle.nextMode !== profile.recommendedMode
          || lifecycle.authorityTrustRootDigest !== trust.authority.trustRootDigest
          || lifecycle.authorityTrustRootDigest !== lifecycleAttestation.authorityTrustRootDigest
          || lifecycle.authorityKeyId !== lifecycleAttestation.authorityKeyId) {
        throw new Error("activation lifecycle decision is not bound to trusted promotion authority");
      }
      profileFresh = sameProfileIdentity(profile.profileIdentity, identity)
        && Object.entries(currentBindings).every(([field, digest]) =>
          profile.boundDigests[field] === digest);
      lifecycleDecisionDigest = lifecycle.decisionDigest;
      authorityTrustRootDigest = lifecycleAttestation.authorityTrustRootDigest;
      authorizationDigest = lifecycle.authorizationDigest;
    }
  }

  let mode;
  const reasonCodes = [];
  if (explicitMethodRequest) {
    mode = "method";
    reasonCodes.push("explicit-method-request");
  } else if (profileFresh && profile.lifecycleState === "eligible"
      && profile.recommendedMode === "method") {
    mode = "method";
    reasonCodes.push("trusted-authorized-method-profile");
  } else if (profileFresh && profile.lifecycleState === "eligible"
      && profile.recommendedMode === "review" && reviewAvailable) {
    mode = "review";
    reasonCodes.push("trusted-authorized-review-profile", "review-phase-available");
  } else {
    mode = fallbackMode(task.consequenceClass, trustedPolicy);
    if (profile !== null && trust === null) reasonCodes.push("profile-untrusted");
    else if (profile !== null && !profileFresh) reasonCodes.push("stale-profile");
    else if (profile !== null && profile.lifecycleState !== "eligible") reasonCodes.push("profile-not-eligible");
    else if (profile?.recommendedMode === "review" && !reviewAvailable) reasonCodes.push("review-unavailable");
    else reasonCodes.push("no-qualified-evidence");
    reasonCodes.push(mode === "guardrail" ? "consequence-guardrails" : "native-floor-preserved");
  }

  const unsigned = {
    schemaVersion: 2,
    selectedId,
    taskClass: task.taskClass,
    consequenceClass: task.consequenceClass,
    mode,
    reasonCodes,
    preInferenceDisclosure: DISCLOSURE[mode],
    deferredReview: mode === "review",
    profileIdentity: structuredClone(identity),
    profileKey: profileKey(identity),
    profileDigest,
    profileFresh,
    lifecycleDecisionDigest,
    authorityTrustRootDigest,
    authorizationDigest,
    policyDigest: expectedPolicyDigest,
    authorityProjection,
    authorityExpanded: false,
  };
  return deepFreeze({ ...unsigned, decisionDigest: canonicalDigest(unsigned) });
}

export function compileActivationDecisionV2(options = {}) {
  return compileActivationDecisionV2Internal(options, null);
}

export function createActivationCompilerV2(options = {}) {
  exactKeys(
    options,
    ["trustRootId", "trustedKeys", "expectedPolicyDigest"],
    "trusted activation compiler input",
  );
  digestString(options.expectedPolicyDigest, "trusted activation policy digest");
  const authority = createAdaptiveEvidenceAuthority({
    trustRootId: options.trustRootId,
    trustedKeys: options.trustedKeys,
  });
  const trust = Object.freeze({ authority, expectedPolicyDigest: options.expectedPolicyDigest });
  return Object.freeze({
    trustRoot: authority.trustRoot,
    trustRootDigest: authority.trustRootDigest,
    compileActivationDecisionV2: (input) => compileActivationDecisionV2Internal(input, trust),
  });
}

function validateActivationDecision(decision, policyDigest) {
  exactKeys(decision, [
    "schemaVersion",
    "selectedId",
    "taskClass",
    "consequenceClass",
    "mode",
    "reasonCodes",
    "preInferenceDisclosure",
    "deferredReview",
    "profileIdentity",
    "profileKey",
    "profileDigest",
    "profileFresh",
    "lifecycleDecisionDigest",
    "authorityTrustRootDigest",
    "authorizationDigest",
    "policyDigest",
    "authorityProjection",
    "authorityExpanded",
    "decisionDigest",
  ], "activation v2 decision");
  const { decisionDigest, ...unsigned } = decision;
  if (canonicalDigest(unsigned) !== decisionDigest) {
    throw new Error("activation decision digest does not match its body");
  }
  if (decision.schemaVersion !== 2 || decision.policyDigest !== policyDigest
      || decision.authorityExpanded !== false || !DISCLOSURE[decision.mode]
      || decision.preInferenceDisclosure !== DISCLOSURE[decision.mode]
      || decision.deferredReview !== (decision.mode === "review")) {
    throw new Error("activation decision boundary is invalid");
  }
  for (const field of [
    "profileDigest", "lifecycleDecisionDigest", "authorityTrustRootDigest", "authorizationDigest",
  ]) {
    if (decision[field] !== null) digestString(decision[field], `activation decision.${field}`);
  }
  if (decision.profileFresh && [
    decision.profileDigest,
    decision.lifecycleDecisionDigest,
    decision.authorityTrustRootDigest,
    decision.authorizationDigest,
  ].some((value) => value === null)) {
    throw new Error("fresh activation profile lacks trusted lifecycle provenance");
  }
  if (decision.profileKey !== profileKey(decision.profileIdentity)) {
    throw new Error("activation decision profile key is invalid");
  }
  return decision;
}

export function compileShadowDecision(options = {}) {
  exactKeys(
    options,
    ["activationDecision", "policy", "expectedPolicyDigest"],
    "shadow decision input",
  );
  const { activationDecision, policy, expectedPolicyDigest } = options;
  validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  validateActivationDecision(activationDecision, expectedPolicyDigest);
  const unsigned = {
    schemaVersion: 2,
    id: `shadow-${activationDecision.decisionDigest.slice(0, 16)}`,
    profileIdentity: structuredClone(activationDecision.profileIdentity),
    profileKey: activationDecision.profileKey,
    predictedMode: activationDecision.mode,
    predictedDecisionDigest: activationDecision.decisionDigest,
    disclosedLayerBodies: [],
    nativeAttemptRequired: true,
    artifactDigest: null,
    policyDigest: expectedPolicyDigest,
  };
  return deepFreeze({ ...unsigned, shadowDigest: canonicalDigest(unsigned) });
}

function validateTaskDefinition(taskDefinition) {
  exactKeys(
    taskDefinition,
    ["id", "version", "mission", "artifactContract"],
    "trial task definition",
  );
  for (const [key, value] of Object.entries(taskDefinition)) {
    nonEmptyString(value, `trial task definition.${key}`);
  }
  return taskDefinition;
}

function validateComparisonPolicy(comparisonPolicy, trustedPolicy) {
  exactKeys(comparisonPolicy, [
    "id",
    "version",
    "baseline",
    "variants",
    "metrics",
    "stopConditions",
  ], "trial comparison policy");
  nonEmptyString(comparisonPolicy.id, "comparison policy.id");
  nonEmptyString(comparisonPolicy.version, "comparison policy.version");
  if (comparisonPolicy.baseline !== "raw") throw new Error("comparison baseline must be raw");
  if (JSON.stringify(comparisonPolicy.variants) !== JSON.stringify(trustedPolicy.trialVariants)) {
    throw new Error("comparison policy trial variants do not match the trusted policy");
  }
  uniqueStrings(comparisonPolicy.metrics, "comparison metrics");
  uniqueStrings(comparisonPolicy.stopConditions, "comparison stop conditions");
  return comparisonPolicy;
}

function validateArtifactBoundary(boundary) {
  exactKeys(boundary, ["mediaType", "required"], "artifact boundary");
  nonEmptyString(boundary.mediaType, "artifact boundary.mediaType");
  if (boundary.required !== true) throw new Error("artifact boundary must be required");
  return boundary;
}

function validateEvaluator(evaluator, producerId, capabilityId) {
  exactKeys(evaluator, ["kind", "id", "digest"], "trial evaluator");
  if (!new Set(["reviewer", "deterministic-verifier"]).has(evaluator.kind)) {
    throw new Error("trial evaluator kind is invalid");
  }
  nonEmptyString(evaluator.id, "trial evaluator.id");
  digestString(evaluator.digest, "trial evaluator.digest");
  if (evaluator.id === producerId || evaluator.id === capabilityId) {
    throw new Error("trial evaluator must remain independent from producer and capability");
  }
  return evaluator;
}

export function preregisterTrial(options = {}) {
  exactKeys(options, [
    "trialId",
    "profileIdentity",
    "capabilityManifestDigest",
    "taskDefinition",
    "comparisonPolicy",
    "artifactBoundary",
    "evaluator",
    "producerId",
    "registeredAt",
    "policy",
    "expectedPolicyDigest",
  ], "trial preregistration input");
  const trustedPolicy = validateAdaptiveEvidencePolicy(options);
  nonEmptyString(options.trialId, "trialId");
  nonEmptyString(options.producerId, "trial producerId");
  const identity = compileProfileIdentity(options.profileIdentity);
  digestString(options.capabilityManifestDigest, "capability manifest digest");
  if (options.capabilityManifestDigest !== identity.capabilityVersion) {
    throw new Error("capability manifest digest does not match the profile identity");
  }
  const taskDefinition = validateTaskDefinition(options.taskDefinition);
  const comparisonPolicy = validateComparisonPolicy(options.comparisonPolicy, trustedPolicy);
  const boundary = validateArtifactBoundary(options.artifactBoundary);
  const evaluator = validateEvaluator(options.evaluator, options.producerId, identity.capabilityId);
  exactIso(options.registeredAt, "registeredAt");

  const unsigned = {
    schemaVersion: 2,
    trialId: options.trialId,
    status: "preregistered",
    profileIdentity: structuredClone(identity),
    profileKey: profileKey(identity),
    capabilityManifestDigest: options.capabilityManifestDigest,
    policyDigest: options.expectedPolicyDigest,
    taskDefinition: {
      id: taskDefinition.id,
      version: taskDefinition.version,
      digest: canonicalDigest(taskDefinition),
    },
    comparisonPolicy: {
      id: comparisonPolicy.id,
      version: comparisonPolicy.version,
      digest: canonicalDigest(comparisonPolicy),
      baseline: comparisonPolicy.baseline,
      variants: [...comparisonPolicy.variants],
      metrics: [...comparisonPolicy.metrics],
      stopConditions: [...comparisonPolicy.stopConditions],
    },
    artifactBoundary: structuredClone(boundary),
    evaluator: structuredClone(evaluator),
    variants: [...TRIAL_VARIANTS],
    producerId: options.producerId,
    registeredAt: options.registeredAt,
  };
  return deepFreeze({ ...unsigned, trialDigest: canonicalDigest(unsigned) });
}

export function verifyTrialEnvelope({ trial, policy, expectedPolicyDigest } = {}) {
  const trustedPolicy = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  exactKeys(trial, [
    "schemaVersion",
    "trialId",
    "status",
    "profileIdentity",
    "profileKey",
    "capabilityManifestDigest",
    "policyDigest",
    "taskDefinition",
    "comparisonPolicy",
    "artifactBoundary",
    "evaluator",
    "variants",
    "producerId",
    "registeredAt",
    "trialDigest",
  ], "trial envelope");
  const { trialDigest, ...unsigned } = trial;
  digestString(trialDigest, "trial digest");
  if (canonicalDigest(unsigned) !== trialDigest) {
    throw new Error("trial digest does not match its body");
  }
  if (trial.schemaVersion !== 2 || trial.status !== "preregistered"
      || trial.policyDigest !== expectedPolicyDigest) {
    throw new Error("trial envelope identity or policy is invalid");
  }
  const identity = compileProfileIdentity(trial.profileIdentity);
  if (trial.profileKey !== profileKey(identity)
      || trial.capabilityManifestDigest !== identity.capabilityVersion) {
    throw new Error("trial profile or capability identity is invalid");
  }
  exactKeys(trial.taskDefinition, ["id", "version", "digest"], "trial task reference");
  nonEmptyString(trial.taskDefinition.id, "trial task reference.id");
  nonEmptyString(trial.taskDefinition.version, "trial task reference.version");
  digestString(trial.taskDefinition.digest, "trial task reference.digest");
  exactKeys(trial.comparisonPolicy, [
    "id", "version", "digest", "baseline", "variants", "metrics", "stopConditions",
  ], "trial comparison reference");
  nonEmptyString(trial.comparisonPolicy.id, "trial comparison reference.id");
  nonEmptyString(trial.comparisonPolicy.version, "trial comparison reference.version");
  digestString(trial.comparisonPolicy.digest, "trial comparison reference.digest");
  validateComparisonPolicy({
    id: trial.comparisonPolicy.id,
    version: trial.comparisonPolicy.version,
    baseline: trial.comparisonPolicy.baseline,
    variants: trial.comparisonPolicy.variants,
    metrics: trial.comparisonPolicy.metrics,
    stopConditions: trial.comparisonPolicy.stopConditions,
  }, trustedPolicy);
  validateArtifactBoundary(trial.artifactBoundary);
  nonEmptyString(trial.producerId, "trial producerId");
  validateEvaluator(trial.evaluator, trial.producerId, identity.capabilityId);
  if (JSON.stringify(trial.variants) !== JSON.stringify(trustedPolicy.trialVariants)) {
    throw new Error("trial variants are invalid");
  }
  exactIso(trial.registeredAt, "trial registeredAt");
  return deepFreeze({ valid: true, trialDigest, profileKey: trial.profileKey });
}

function validateCost(cost) {
  exactKeys(cost, ["bytes", "tokens", "latencyMs", "monetaryCost"], "observation cost");
  finiteNonNegative(cost.bytes, "observation cost.bytes", { integer: true });
  finiteNonNegative(cost.tokens, "observation cost.tokens", { nullable: true, integer: true });
  finiteNonNegative(cost.latencyMs, "observation cost.latencyMs", { nullable: true });
  finiteNonNegative(cost.monetaryCost, "observation cost.monetaryCost", { nullable: true });
  return cost;
}

export function createObservationProposal(options = {}) {
  exactKeys(options, [
    "trial",
    "expectedTrialDigest",
    "variant",
    "artifact",
    "observation",
    "cost",
    "proofLevel",
    "producerId",
    "evaluatorId",
    "observedAt",
    "policy",
    "expectedPolicyDigest",
  ], "observation proposal input");
  const { trial, policy, expectedPolicyDigest } = options;
  verifyTrialEnvelope({ trial, policy, expectedPolicyDigest });
  digestString(options.expectedTrialDigest, "expected trial digest");
  if (trial.trialDigest !== options.expectedTrialDigest) {
    throw new Error("observation does not match the expected trial digest");
  }
  if (!trial.variants.includes(options.variant)) throw new Error("observation variant is not preregistered");
  exactKeys(options.artifact, ["sha256", "bytes", "mediaType", "producedAt"], "observation artifact");
  digestString(options.artifact.sha256, "observation artifact.sha256");
  finiteNonNegative(options.artifact.bytes, "observation artifact.bytes", { integer: true });
  if (options.artifact.mediaType !== trial.artifactBoundary.mediaType) {
    throw new Error("observation artifact media type does not match the required boundary");
  }
  exactIso(options.artifact.producedAt, "observation artifact.producedAt");
  if (new Date(options.artifact.producedAt) <= new Date(trial.registeredAt)) {
    throw new Error("observation artifact must be produced after trial preregistration");
  }
  exactKeys(options.observation, [
    "score", "outcomeAgainstRaw", "criticalRegression", "baselineArtifactDigest",
    "comparisons", "reasonCodes",
  ], "evaluator observation");
  finiteNonNegative(options.observation.score, "evaluator observation.score");
  const expectedOutcomes = options.variant === "raw"
    ? new Set(["baseline"])
    : new Set(["win", "loss", "tie"]);
  if (!expectedOutcomes.has(options.observation.outcomeAgainstRaw)) {
    throw new Error("observation outcome does not match its variant");
  }
  boolean(options.observation.criticalRegression, "observation criticalRegression");
  exactKeys(
    options.observation.comparisons,
    ["matched", "wins", "losses", "ties"],
    "observation comparisons",
  );
  for (const [name, value] of Object.entries(options.observation.comparisons)) {
    finiteNonNegative(value, `observation comparisons.${name}`, { integer: true });
  }
  const comparisonTotal = options.observation.comparisons.wins
    + options.observation.comparisons.losses + options.observation.comparisons.ties;
  if (comparisonTotal !== options.observation.comparisons.matched) {
    throw new Error("observation comparison totals are contradictory");
  }
  if (options.variant === "raw" && options.observation.comparisons.matched !== 0) {
    throw new Error("raw observation cannot claim intervention comparisons");
  }
  if (options.variant === "raw") {
    if (options.observation.baselineArtifactDigest !== null) {
      throw new Error("raw observation cannot reference a baseline artifact");
    }
  } else {
    digestString(options.observation.baselineArtifactDigest, "observation baseline artifact digest");
  }
  uniqueStrings(options.observation.reasonCodes, "observation reason codes", { allowEmpty: true });
  validateCost(options.cost);
  if (!EVIDENCE_LEVELS.includes(options.proofLevel)) throw new Error("observation proof level is invalid");
  nonEmptyString(options.producerId, "observation producerId");
  nonEmptyString(options.evaluatorId, "observation evaluatorId");
  if (options.evaluatorId !== trial.evaluator.id
      || options.producerId === options.evaluatorId
      || options.producerId === trial.profileIdentity.capabilityId) {
    throw new Error("observation evaluator is not independent or does not match the trial");
  }
  exactIso(options.observedAt, "observedAt");
  if (new Date(options.observedAt) <= new Date(options.artifact.producedAt)) {
    throw new Error("observation must occur after the artifact is produced");
  }
  const observationDigest = canonicalDigest(options.observation);
  const unsigned = {
    schemaVersion: 2,
    proposalId: `${trial.trialId}:${options.variant}`,
    trialDigest: trial.trialDigest,
    profileKey: trial.profileKey,
    variant: options.variant,
    artifactDigest: options.artifact.sha256,
    artifactBytes: options.artifact.bytes,
    artifactMediaType: options.artifact.mediaType,
    artifactProducedAt: options.artifact.producedAt,
    observationDigest,
    score: options.observation.score,
    outcomeAgainstRaw: options.observation.outcomeAgainstRaw,
    criticalRegression: options.observation.criticalRegression,
    baselineArtifactDigest: options.observation.baselineArtifactDigest,
    comparisons: structuredClone(options.observation.comparisons),
    reasonCodes: [...options.observation.reasonCodes],
    cost: structuredClone(options.cost),
    proofLevel: options.proofLevel,
    producerId: options.producerId,
    evaluatorId: options.evaluatorId,
    observedAt: options.observedAt,
  };
  return deepFreeze({ ...unsigned, proposalDigest: canonicalDigest(unsigned) });
}

export function importHistoricalEvidence(options = {}) {
  exactKeys(
    options,
    ["evidence", "sourceDigest", "policy", "expectedPolicyDigest"],
    "historical evidence import",
  );
  validateAdaptiveEvidencePolicy(options);
  digestString(options.sourceDigest, "historical source digest");
  if (canonicalDigest(options.evidence) !== options.sourceDigest) {
    throw new Error("historical source digest does not match the evidence body");
  }
  const evidence = options.evidence;
  exactKeys(evidence, [
    "schemaVersion",
    "id",
    "partition",
    "reviewed",
    "reviewer",
    "sources",
    "profiles",
    "rawTranscriptsIncluded",
    "active",
  ], "historical adaptive evidence");
  if (evidence.schemaVersion !== 1 || evidence.reviewed !== true
      || evidence.rawTranscriptsIncluded !== false || evidence.active !== false
      || !Array.isArray(evidence.sources) || evidence.sources.length !== 1
      || !Array.isArray(evidence.profiles) || evidence.profiles.length !== 1) {
    throw new Error("historical adaptive evidence boundary is invalid");
  }
  const source = evidence.sources[0];
  exactKeys(source, ["repository", "commit", "artifacts"], "historical source");
  nonEmptyString(source.repository, "historical source.repository");
  if (!/^[a-f0-9]{40}$/.test(source.commit ?? "")) {
    throw new Error("historical source commit is invalid");
  }
  if (!Array.isArray(source.artifacts) || source.artifacts.length === 0) {
    throw new Error("historical source artifacts are absent");
  }
  const sourceArtifacts = source.artifacts.map((artifact) => {
    exactKeys(artifact, ["path", "sha256"], "historical source artifact");
    nonEmptyString(artifact.path, "historical source artifact.path");
    digestString(artifact.sha256, "historical source artifact.sha256");
    return structuredClone(artifact);
  });
  const profile = evidence.profiles[0];
  for (const key of ["matchedEvaluations", "wins", "losses", "ties"]) {
    if (!Number.isInteger(profile[key]) || profile[key] < 0) {
      throw new Error(`historical evidence profile.${key} is invalid`);
    }
  }
  if (profile.wins + profile.losses + profile.ties !== profile.matchedEvaluations) {
    throw new Error("historical evidence outcome totals are contradictory");
  }
  const unsigned = {
    schemaVersion: 2,
    id: "historical-muse-adaptive-evidence-v1",
    status: "historical-ineligible",
    promotable: false,
    sourceDigest: options.sourceDigest,
    sourceCommit: source.commit,
    sourceArtifacts,
    observedComparisons: profile.matchedEvaluations,
    rawWins: profile.losses,
    candidateWins: profile.wins,
    ties: profile.ties,
    reasonCodes: [
      "v2-preregistration-absent",
      "exact-environment-identity-absent",
      "isolated-five-variant-coverage-absent",
    ],
    proofLimits: [...profile.proofLimits],
  };
  return deepFreeze({ ...unsigned, importDigest: canonicalDigest(unsigned) });
}
