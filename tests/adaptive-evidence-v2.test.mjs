import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readJson(relative) {
  const text = await readFile(new URL(relative, root), "utf8").catch((error) =>
    assert.fail(`required adaptive evidence artifact is unavailable: ${relative}: ${error.message}`));
  return JSON.parse(text);
}

async function contracts() {
  return import("../src/adaptive-evidence-contracts.mjs").catch((error) =>
    assert.fail(`adaptive evidence contracts are unavailable: ${error.message}`));
}

async function trials() {
  return import("../src/adaptive-evidence-trials.mjs").catch((error) =>
    assert.fail(`adaptive evidence trials are unavailable: ${error.message}`));
}

function digestText(text) {
  return createHash("sha256").update(text).digest("hex");
}

const profileIdentity = Object.freeze({
  capabilityId: "eternities-aegis",
  taskClass: "security-review",
  modelFamily: "gpt-5.6-terra",
  reasoningTier: "high",
  consequenceClass: "consequential",
  capabilityVersion: "06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9",
  environmentId: "2db8aaf5083d257f8492363933eadaf0786998158f81dcf1a11c775b75c3979b",
});

test("trusted v2 policy closes evidence levels, trial variants, and lifecycle authority", async () => {
  const [{ canonicalJson, validateAdaptiveEvidencePolicy }, policy] = await Promise.all([
    contracts(),
    readJson("policies/adaptive-evidence.v2.json"),
  ]);
  const expectedKeys = [
    "activationFallbacks",
    "authorityExpanded",
    "consequenceClasses",
    "evidenceLevels",
    "fixtureEvidenceCanPromote",
    "historicalEvidenceCanPromote",
    "id",
    "lifecycleGrants",
    "methodPromotion",
    "profileKeyFields",
    "promotableEvidenceLevels",
    "reasoningTiers",
    "reviewPromotion",
    "runtimeModes",
    "schemaVersion",
    "selfPromotionAllowed",
    "selfReviewAllowed",
    "taskClasses",
    "trialVariants",
  ];

  assert.deepEqual(Object.keys(policy).sort(), expectedKeys);
  assert.deepEqual(policy.runtimeModes, ["native", "guardrail", "method", "review"]);
  assert.deepEqual(policy.trialVariants, ["raw", "guardrail", "method", "reviewer", "combined"]);
  assert.deepEqual(policy.profileKeyFields, [
    "capabilityId",
    "taskClass",
    "modelFamily",
    "reasoningTier",
    "consequenceClass",
    "capabilityVersion",
    "environmentId",
  ]);
  assert.deepEqual(policy.evidenceLevels, [
    "structural",
    "fixture",
    "artifact",
    "model",
    "cross-model",
    "field",
    "universal",
  ]);
  assert.deepEqual(policy.promotableEvidenceLevels, ["model", "cross-model", "field", "universal"]);
  assert.deepEqual(policy.lifecycleGrants, {
    promote: "adaptive-evidence:promote",
    demote: "adaptive-evidence:demote",
    quarantine: "adaptive-evidence:quarantine",
    invalidate: "adaptive-evidence:invalidate",
  });
  assert.equal(policy.fixtureEvidenceCanPromote, false);
  assert.equal(policy.historicalEvidenceCanPromote, false);
  assert.equal(policy.selfReviewAllowed, false);
  assert.equal(policy.selfPromotionAllowed, false);
  assert.equal(policy.authorityExpanded, false);

  const policyDigest = digestText(canonicalJson(policy));
  const validated = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest: policyDigest });
  assert.equal(Object.isFrozen(validated), true);

  const forged = structuredClone(policy);
  forged.methodPromotion.minimumWins = 1;
  assert.throws(
    () => validateAdaptiveEvidencePolicy({ policy: forged, expectedPolicyDigest: policyDigest }),
    /trusted policy digest/i,
  );
});

test("profile identity is exact, closed, and sensitive to every qualified field", async () => {
  const { compileProfileIdentity, profileKey, sameProfileIdentity } = await contracts();
  const compiled = compileProfileIdentity(profileIdentity);
  const expectedCanonical = "{\"capabilityId\":\"eternities-aegis\",\"capabilityVersion\":\"06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9\",\"consequenceClass\":\"consequential\",\"environmentId\":\"2db8aaf5083d257f8492363933eadaf0786998158f81dcf1a11c775b75c3979b\",\"modelFamily\":\"gpt-5.6-terra\",\"reasoningTier\":\"high\",\"taskClass\":\"security-review\"}";

  assert.deepEqual(compiled, profileIdentity);
  assert.equal(Object.isFrozen(compiled), true);
  assert.equal(profileKey(compiled), digestText(expectedCanonical));
  assert.equal(sameProfileIdentity(compiled, structuredClone(profileIdentity)), true);

  for (const field of Object.keys(profileIdentity)) {
    const changedValue = ["capabilityVersion", "environmentId"].includes(field)
      ? "f".repeat(64)
      : `${profileIdentity[field]}-changed`;
    const changed = { ...profileIdentity, [field]: changedValue };
    assert.notEqual(profileKey(compileProfileIdentity(changed)), profileKey(compiled), field);
    assert.equal(sameProfileIdentity(compiled, changed), false, field);
  }

  const missing = structuredClone(profileIdentity);
  delete missing.environmentId;
  assert.throws(() => compileProfileIdentity(missing), /profile identity keys/i);
  assert.throws(
    () => compileProfileIdentity({ ...profileIdentity, providerAccount: "private" }),
    /profile identity keys/i,
  );
});

test("adaptive evidence schemas are closed at every object boundary", async () => {
  const { buildAdaptiveEvidenceSchemas } = await contracts();
  const schemas = buildAdaptiveEvidenceSchemas();
  assert.deepEqual(Object.keys(schemas), [
    "evidence-row.schema.json",
    "lifecycle-decision.schema.json",
    "profile.schema.json",
    "shadow-decision.schema.json",
    "trial-envelope.schema.json",
  ]);

  function assertClosedObjects(value, path = "schema") {
    if (!value || typeof value !== "object") return;
    if (value.type === "object") {
      assert.equal(value.additionalProperties, false, `${path} is not closed`);
      assert.ok(Array.isArray(value.required), `${path} has no required list`);
    }
    for (const [key, child] of Object.entries(value)) {
      assertClosedObjects(child, `${path}.${key}`);
    }
  }

  for (const [name, schema] of Object.entries(schemas)) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /^urn:eternities:adaptive-evidence:v2:/);
    assertClosedObjects(schema, name);
  }
});

async function trustedPolicy() {
  const [{ canonicalDigest }, policy] = await Promise.all([
    contracts(),
    readJson("policies/adaptive-evidence.v2.json"),
  ]);
  return { policy, expectedPolicyDigest: canonicalDigest(policy) };
}

function authorityProjection() {
  return {
    availableAuthority: ["local-read"],
    permittedEffects: ["local-read"],
  };
}

function signedProfile({
  identity = profileIdentity,
  state = "promoted",
  mode = "method",
  policyDigest = "b".repeat(64),
} = {}) {
  return contracts().then(({ canonicalDigest, profileKey }) => {
    const unsigned = {
      schemaVersion: 2,
      profileIdentity: identity,
      profileKey: profileKey(identity),
      lifecycleState: state,
      recommendedMode: mode,
      variantMetrics: [],
      evidenceRowDigests: ["a".repeat(64)],
      promotableEvidenceRows: 3,
      failedGates: [],
      boundDigests: {
        policyDigest,
        taskDefinitionDigest: "c".repeat(64),
        comparisonPolicyDigest: "d".repeat(64),
        trialDigest: "e".repeat(64),
        ledgerDigest: "f".repeat(64),
      },
    };
    return { ...unsigned, profileDigest: canonicalDigest(unsigned) };
  });
}

test("activation v2 admits method only from explicit intent or a fresh promoted profile", async () => {
  const [trialModule, trusted] = await Promise.all([
    trials(),
    trustedPolicy(),
  ]);
  const freshMethod = await signedProfile({ policyDigest: trusted.expectedPolicyDigest });
  const task = {
    taskClass: "security-review",
    consequenceClass: "consequential",
    authorityProjection: authorityProjection(),
  };
  const common = {
    selectedId: "eternities-aegis",
    task,
    profileIdentity,
    ...trusted,
  };

  const explicit = trialModule.compileActivationDecisionV2({
    ...common,
    explicitMethodRequest: true,
    profile: null,
    reviewAvailable: false,
  });
  assert.equal(explicit.mode, "method");
  assert.deepEqual(explicit.reasonCodes, ["explicit-method-request"]);

  const qualified = trialModule.compileActivationDecisionV2({
    ...common,
    profile: freshMethod,
    reviewAvailable: false,
  });
  assert.equal(qualified.mode, "method");
  assert.deepEqual(qualified.reasonCodes, ["fresh-promoted-method-profile"]);

  const freshReview = await signedProfile({
    mode: "review",
    policyDigest: trusted.expectedPolicyDigest,
  });
  const review = trialModule.compileActivationDecisionV2({
    ...common,
    profile: freshReview,
    reviewAvailable: true,
  });
  assert.equal(review.mode, "review");
  assert.equal(review.deferredReview, true);
  assert.deepEqual(review.reasonCodes, ["fresh-promoted-review-profile", "review-phase-available"]);

  const staleIdentity = { ...profileIdentity, environmentId: "0".repeat(64) };
  const stale = await signedProfile({
    identity: staleIdentity,
    policyDigest: trusted.expectedPolicyDigest,
  });
  const lowIdentity = { ...profileIdentity, consequenceClass: "low" };
  const lowStale = await signedProfile({
    identity: { ...lowIdentity, environmentId: "0".repeat(64) },
    policyDigest: trusted.expectedPolicyDigest,
  });
  const consequentialFallback = trialModule.compileActivationDecisionV2({
    ...common,
    profile: stale,
    reviewAvailable: true,
  });
  const lowFallback = trialModule.compileActivationDecisionV2({
    ...common,
    task: { ...task, consequenceClass: "low" },
    profileIdentity: lowIdentity,
    profile: lowStale,
    reviewAvailable: true,
  });
  assert.equal(consequentialFallback.mode, "guardrail");
  assert.ok(consequentialFallback.reasonCodes.includes("stale-profile"));
  assert.equal(lowFallback.mode, "native");
  assert.ok(lowFallback.reasonCodes.includes("stale-profile"));

  for (const decision of [explicit, qualified, review, consequentialFallback]) {
    assert.deepEqual(decision.authorityProjection, authorityProjection());
    assert.equal(decision.authorityExpanded, false);
    assert.equal(decision.profileKey, profileKeyForTest(profileIdentity));
    assert.match(decision.decisionDigest, /^[a-f0-9]{64}$/);
  }
  assert.equal(lowFallback.profileKey, profileKeyForTest(lowIdentity));
  assert.deepEqual(lowFallback.authorityProjection, authorityProjection());
  assert.equal(lowFallback.authorityExpanded, false);
  assert.match(lowFallback.decisionDigest, /^[a-f0-9]{64}$/);
});

function profileKeyForTest(identity) {
  const canonical = JSON.stringify(Object.fromEntries(Object.entries(identity).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0)));
  return digestText(canonical);
}

test("shadow activation records a prediction without disclosing a selected body", async () => {
  const [trialModule, trusted] = await Promise.all([trials(), trustedPolicy()]);
  const activation = trialModule.compileActivationDecisionV2({
    selectedId: "eternities-aegis",
    task: {
      taskClass: "security-review",
      consequenceClass: "consequential",
      authorityProjection: authorityProjection(),
    },
    profileIdentity,
    explicitMethodRequest: true,
    reviewAvailable: false,
    profile: null,
    ...trusted,
  });
  const shadow = trialModule.compileShadowDecision({
    activationDecision: activation,
    ...trusted,
  });

  assert.deepEqual(shadow.disclosedLayerBodies, []);
  assert.equal(shadow.nativeAttemptRequired, true);
  assert.equal(shadow.predictedDecisionDigest, activation.decisionDigest);
  assert.equal(shadow.artifactDigest, null);
  assert.equal(shadow.predictedMode, "method");
  assert.match(shadow.shadowDigest, /^[a-f0-9]{64}$/);

  const forged = structuredClone(activation);
  forged.mode = "native";
  assert.throws(
    () => trialModule.compileShadowDecision({ activationDecision: forged, ...trusted }),
    /decision digest/i,
  );
});

function taskDefinition() {
  return {
    id: "aegis-canary-security-review",
    version: "1",
    mission: "review the supplied inert JavaScript subject and return the required JSON artifact",
    artifactContract: "closed security finding list",
  };
}

function comparisonPolicy() {
  return {
    id: "aegis-five-condition-comparison",
    version: "1",
    baseline: "raw",
    variants: ["raw", "guardrail", "method", "reviewer", "combined"],
    metrics: ["validity", "coverage", "severity", "repair-specificity", "unsupported-claims"],
    stopConditions: ["five-artifacts-recorded", "critical-regression"],
  };
}

async function registeredTrial(overrides = {}) {
  const [trialModule, trusted] = await Promise.all([trials(), trustedPolicy()]);
  return trialModule.preregisterTrial({
    trialId: "aegis-terra-high-matrix-001",
    profileIdentity,
    capabilityManifestDigest: profileIdentity.capabilityVersion,
    taskDefinition: taskDefinition(),
    comparisonPolicy: comparisonPolicy(),
    artifactBoundary: { mediaType: "application/json", required: true },
    evaluator: {
      kind: "deterministic-verifier",
      id: "aegis-matrix-verifier-v1",
      digest: "1".repeat(64),
    },
    producerId: "codex-trial-host",
    registeredAt: "2026-08-31T06:00:00.000Z",
    ...trusted,
    ...overrides,
  });
}

test("trial preregistration binds the complete comparison before dispatch and rejects retrospective edits", async () => {
  const [trialModule, trusted, trial] = await Promise.all([
    trials(),
    trustedPolicy(),
    registeredTrial(),
  ]);
  assert.equal(trial.status, "preregistered");
  assert.equal(trial.producerId, "codex-trial-host");
  assert.deepEqual(trial.variants, ["raw", "guardrail", "method", "reviewer", "combined"]);
  assert.equal(trial.comparisonPolicy.baseline, "raw");
  assert.match(trial.taskDefinition.digest, /^[a-f0-9]{64}$/);
  assert.match(trial.comparisonPolicy.digest, /^[a-f0-9]{64}$/);
  assert.equal(trialModule.verifyTrialEnvelope({ trial, ...trusted }).valid, true);

  const changed = structuredClone(trial);
  changed.comparisonPolicy.metrics.push("post-hoc-score");
  assert.throws(() => trialModule.verifyTrialEnvelope({ trial: changed, ...trusted }), /trial digest/i);

  await assert.rejects(
    registeredTrial({ dispatchStartedAt: "2026-08-31T06:00:01.000Z" }),
    /keys|dispatch|preregister/i,
  );
  await assert.rejects(
    registeredTrial({ artifactBoundary: { mediaType: "application/json", required: false } }),
    /artifact boundary/i,
  );
  await assert.rejects(
    registeredTrial({
      evaluator: { kind: "reviewer", id: "codex-trial-host", digest: "1".repeat(64) },
    }),
    /independent/i,
  );
  await assert.rejects(
    registeredTrial({
      comparisonPolicy: { ...comparisonPolicy(), variants: ["raw", "method"] },
    }),
    /trial variants/i,
  );
});

test("observation proposals preserve artifact order, evaluator identity, costs, and proof level", async () => {
  const [trialModule, trusted, trial] = await Promise.all([
    trials(),
    trustedPolicy(),
    registeredTrial(),
  ]);
  const proposal = trialModule.createObservationProposal({
    trial,
    expectedTrialDigest: trial.trialDigest,
    variant: "raw",
    artifact: {
      sha256: "2".repeat(64),
      bytes: 4096,
      mediaType: "application/json",
    },
    observation: {
      score: 12,
      outcomeAgainstRaw: "baseline",
      criticalRegression: false,
      reasonCodes: ["baseline-recorded"],
    },
    cost: { bytes: 0, tokens: null, latencyMs: null, monetaryCost: null },
    proofLevel: "model",
    producerId: "terra-subject-raw",
    evaluatorId: "aegis-matrix-verifier-v1",
    observedAt: "2026-08-31T06:05:00.000Z",
    ...trusted,
  });
  assert.equal(proposal.variant, "raw");
  assert.equal(proposal.artifactDigest, "2".repeat(64));
  assert.equal(proposal.outcomeAgainstRaw, "baseline");
  assert.equal(proposal.proofLevel, "model");
  assert.deepEqual(proposal.cost, { bytes: 0, tokens: null, latencyMs: null, monetaryCost: null });
  assert.match(proposal.observationDigest, /^[a-f0-9]{64}$/);
  assert.match(proposal.proposalDigest, /^[a-f0-9]{64}$/);

  assert.throws(() => trialModule.createObservationProposal({
    ...proposal,
    trial,
    expectedTrialDigest: trial.trialDigest,
    artifact: { sha256: "2".repeat(64), bytes: 4096, mediaType: "text/plain" },
    observation: { score: 12, outcomeAgainstRaw: "baseline", criticalRegression: false, reasonCodes: [] },
    cost: proposal.cost,
    producerId: "terra-subject-raw",
    evaluatorId: "aegis-matrix-verifier-v1",
    observedAt: "2026-08-31T06:05:00.000Z",
    policy: trusted.policy,
    expectedPolicyDigest: trusted.expectedPolicyDigest,
  }), /media type|keys/i);
});

test("historical Muse evidence remains visible but cannot become retroactively preregistered", async () => {
  const [trialModule, trusted, evidence, contractModule] = await Promise.all([
    trials(),
    trustedPolicy(),
    readJson("artifacts/adaptive-activation/evidence.v1.json"),
    contracts(),
  ]);
  const imported = trialModule.importHistoricalEvidence({
    evidence,
    sourceDigest: contractModule.canonicalDigest(evidence),
    ...trusted,
  });
  assert.equal(imported.status, "historical-ineligible");
  assert.equal(imported.promotable, false);
  assert.deepEqual(imported.reasonCodes, [
    "v2-preregistration-absent",
    "exact-environment-identity-absent",
    "isolated-five-variant-coverage-absent",
  ]);
  assert.equal(imported.sourceCommit, "265d40d121463de5f3b6215bf513db851ccb8f3b");
  assert.equal(imported.observedComparisons, 4);
  assert.equal(imported.rawWins, 3);
  assert.equal(imported.candidateWins, 1);
  assert.match(imported.importDigest, /^[a-f0-9]{64}$/);
});
