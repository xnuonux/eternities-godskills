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

async function ledgerModule() {
  return import("../src/adaptive-evidence-ledger.mjs").catch((error) =>
    assert.fail(`adaptive evidence ledger is unavailable: ${error.message}`));
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
      participantIds: {
        producers: ["terra-subject-method"],
        evaluators: ["aegis-matrix-verifier-v1"],
      },
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
      producedAt: "2026-08-31T06:04:00.000Z",
    },
    observation: {
      score: 12,
      outcomeAgainstRaw: "baseline",
      criticalRegression: false,
      baselineArtifactDigest: null,
      comparisons: { matched: 0, wins: 0, losses: 0, ties: 0 },
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
  assert.deepEqual(proposal.comparisons, { matched: 0, wins: 0, losses: 0, ties: 0 });
  assert.deepEqual(proposal.cost, { bytes: 0, tokens: null, latencyMs: null, monetaryCost: null });
  assert.match(proposal.observationDigest, /^[a-f0-9]{64}$/);
  assert.match(proposal.proposalDigest, /^[a-f0-9]{64}$/);

  assert.throws(() => trialModule.createObservationProposal({
    ...proposal,
    trial,
    expectedTrialDigest: trial.trialDigest,
    artifact: {
      sha256: "2".repeat(64),
      bytes: 4096,
      mediaType: "text/plain",
      producedAt: "2026-08-31T06:04:00.000Z",
    },
    observation: {
      score: 12,
      outcomeAgainstRaw: "baseline",
      criticalRegression: false,
      baselineArtifactDigest: null,
      comparisons: { matched: 0, wins: 0, losses: 0, ties: 0 },
      reasonCodes: [],
    },
    cost: proposal.cost,
    producerId: "terra-subject-raw",
    evaluatorId: "aegis-matrix-verifier-v1",
    observedAt: "2026-08-31T06:05:00.000Z",
    policy: trusted.policy,
    expectedPolicyDigest: trusted.expectedPolicyDigest,
  }), /media type|keys/i);

  assert.throws(() => trialModule.createObservationProposal({
    trial,
    expectedTrialDigest: trial.trialDigest,
    variant: "raw",
    artifact: {
      sha256: "2".repeat(64),
      bytes: 4096,
      mediaType: "application/json",
      producedAt: "2026-08-31T06:06:00.000Z",
    },
    observation: {
      score: 12,
      outcomeAgainstRaw: "baseline",
      criticalRegression: false,
      baselineArtifactDigest: null,
      comparisons: { matched: 0, wins: 0, losses: 0, ties: 0 },
      reasonCodes: [],
    },
    cost: proposal.cost,
    proofLevel: "model",
    producerId: "terra-subject-raw",
    evaluatorId: "aegis-matrix-verifier-v1",
    observedAt: "2026-08-31T06:05:00.000Z",
    ...trusted,
  }), /artifact.*before|observation.*after/i);
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

async function observationFor({
  trial,
  variant,
  proofLevel = "fixture",
  score = 10,
  outcomeAgainstRaw = variant === "raw" ? "baseline" : "tie",
  comparisons = variant === "raw"
    ? { matched: 0, wins: 0, losses: 0, ties: 0 }
    : { matched: 3, wins: 0, losses: 0, ties: 3 },
  criticalRegression = false,
  contextBytes = 1000,
  artifactSuffix = "0",
  baselineArtifactDigest,
} = {}) {
  const [trialApi, trusted] = await Promise.all([trials(), trustedPolicy()]);
  const artifactDigest = digestText(`${trial.trialDigest}:${variant}:${artifactSuffix}`);
  return trialApi.createObservationProposal({
    trial,
    expectedTrialDigest: trial.trialDigest,
    variant,
    artifact: {
      sha256: artifactDigest,
      bytes: 2048 + score,
      mediaType: "application/json",
      producedAt: `2026-08-31T06:0${TRIAL_VARIANT_MINUTE[variant] - 1}:30.000Z`,
    },
    observation: {
      score,
      outcomeAgainstRaw,
      criticalRegression,
      baselineArtifactDigest: variant === "raw"
        ? null
        : baselineArtifactDigest ?? digestText(`${trial.trialDigest}:raw:0`),
      comparisons,
      reasonCodes: [`${variant}-evaluated`],
    },
    cost: { bytes: contextBytes, tokens: null, latencyMs: null, monetaryCost: null },
    proofLevel,
    producerId: `terra-subject-${variant}`,
    evaluatorId: "aegis-matrix-verifier-v1",
    observedAt: `2026-08-31T06:0${TRIAL_VARIANT_MINUTE[variant]}:00.000Z`,
    ...trusted,
  });
}

const TRIAL_VARIANT_MINUTE = Object.freeze({
  raw: 1,
  guardrail: 2,
  method: 3,
  reviewer: 4,
  combined: 5,
});

async function fixtureLedger({ proofLevels = {}, observationOverrides = {}, contextBytes = {} } = {}) {
  const [ledgerApi, trusted, trial] = await Promise.all([
    ledgerModule(),
    trustedPolicy(),
    registeredTrial(),
  ]);
  let ledger = ledgerApi.createEvidenceLedger({
    trial,
    createdAt: "2026-08-31T06:00:30.000Z",
    ...trusted,
  });
  const definitions = [
    ["raw", "baseline", { matched: 0, wins: 0, losses: 0, ties: 0 }, 10, 1000],
    ["guardrail", "win", { matched: 3, wins: 2, losses: 1, ties: 0 }, 12, 1100],
    ["method", "loss", { matched: 3, wins: 1, losses: 2, ties: 0 }, 9, 1300],
    ["reviewer", "win", { matched: 3, wins: 3, losses: 0, ties: 0 }, 15, 1200],
    ["combined", "tie", { matched: 3, wins: 1, losses: 1, ties: 1 }, 10, 1400],
  ];
  for (const [variant, outcomeAgainstRaw, comparisons, score, defaultContextBytes] of definitions) {
    const proposal = await observationFor({
      trial,
      variant,
      outcomeAgainstRaw,
      comparisons,
      score,
      proofLevel: proofLevels[variant] ?? "fixture",
      contextBytes: contextBytes[variant] ?? defaultContextBytes,
      ...observationOverrides[variant],
    });
    ledger = ledgerApi.appendEvidenceRow({ ledger, trial, proposal, ...trusted });
  }
  return { ledgerApi, trusted, trial, ledger };
}

test("append-only evidence rejects duplicate, cross-trial, and mutated rows", async () => {
  const [ledgerApi, trusted, trial] = await Promise.all([
    ledgerModule(),
    trustedPolicy(),
    registeredTrial(),
  ]);
  const empty = ledgerApi.createEvidenceLedger({
    trial,
    createdAt: "2026-08-31T06:00:30.000Z",
    ...trusted,
  });
  const raw = await observationFor({ trial, variant: "raw" });
  const interventionBeforeRaw = await observationFor({ trial, variant: "guardrail" });
  assert.throws(
    () => ledgerApi.appendEvidenceRow({
      ledger: empty,
      trial,
      proposal: interventionBeforeRaw,
      ...trusted,
    }),
    /raw baseline|baseline.*first/i,
  );
  const one = ledgerApi.appendEvidenceRow({ ledger: empty, trial, proposal: raw, ...trusted });

  assert.equal(one.rows.length, 1);
  assert.equal(one.rows[0].sequence, 0);
  assert.equal(one.rows[0].previousRowDigest, null);
  assert.equal(ledgerApi.verifyEvidenceLedger({ ledger: one, trial, ...trusted }).valid, true);
  assert.throws(
    () => ledgerApi.appendEvidenceRow({ ledger: one, trial, proposal: raw, ...trusted }),
    /duplicate/i,
  );
  const wrongBaseline = await observationFor({
    trial,
    variant: "guardrail",
    artifactSuffix: "wrong-baseline",
    baselineArtifactDigest: "9".repeat(64),
  });
  assert.throws(
    () => ledgerApi.appendEvidenceRow({ ledger: one, trial, proposal: wrongBaseline, ...trusted }),
    /baseline.*digest|raw artifact/i,
  );

  const mutated = structuredClone(one);
  mutated.rows[0].criticalRegression = true;
  assert.throws(
    () => ledgerApi.verifyEvidenceLedger({ ledger: mutated, trial, ...trusted }),
    /row digest|ledger digest/i,
  );

  const otherTrial = await registeredTrial({ trialId: "aegis-terra-high-matrix-002" });
  const otherProposal = await observationFor({ trial: otherTrial, variant: "guardrail" });
  assert.throws(
    () => ledgerApi.appendEvidenceRow({ ledger: one, trial: otherTrial, proposal: otherProposal, ...trusted }),
    /trial|lineage/i,
  );
});

test("causal profile keeps all five effects separate and forbids fixture promotion", async () => {
  const { ledgerApi, trusted, trial, ledger } = await fixtureLedger();
  const profile = ledgerApi.deriveActivationProfile({ ledger, trial, ...trusted });

  assert.equal(profile.lifecycleState, "ineligible");
  assert.equal(profile.recommendedMode, "native");
  assert.equal(profile.promotableEvidenceRows, 0);
  assert.deepEqual(profile.failedGates, ["promotable-evidence-level"]);
  assert.equal(profile.evidenceRowDigests.length, 5);
  assert.deepEqual(profile.participantIds.evaluators, ["aegis-matrix-verifier-v1"]);
  assert.deepEqual(profile.participantIds.producers, [
    "terra-subject-combined",
    "terra-subject-guardrail",
    "terra-subject-method",
    "terra-subject-raw",
    "terra-subject-reviewer",
  ]);

  const byVariant = Object.fromEntries(profile.variantMetrics.map((metric) => [metric.variant, metric]));
  assert.deepEqual(
    [byVariant.guardrail.wins, byVariant.method.wins, byVariant.reviewer.wins, byVariant.combined.wins],
    [2, 1, 3, 1],
  );
  assert.deepEqual(
    [byVariant.guardrail.maximumOverheadRatio, byVariant.method.maximumOverheadRatio,
      byVariant.reviewer.maximumOverheadRatio, byVariant.combined.maximumOverheadRatio],
    [1.1, 1.3, 1.2, 1.4],
  );
  assert.match(profile.profileDigest, /^[a-f0-9]{64}$/);
});

test("profiles require complete promotable condition coverage and fail closed on global critical regressions", async () => {
  const partial = await fixtureLedger({
    proofLevels: { raw: "model", method: "model" },
    observationOverrides: {
      method: {
        outcomeAgainstRaw: "win",
        comparisons: { matched: 3, wins: 3, losses: 0, ties: 0 },
        contextBytes: 1200,
      },
    },
  });
  const partialProfile = partial.ledgerApi.deriveActivationProfile({
    ledger: partial.ledger,
    trial: partial.trial,
    ...partial.trusted,
  });
  assert.equal(partialProfile.lifecycleState, "ineligible");
  assert.equal(partialProfile.recommendedMode, "native");
  assert.ok(partialProfile.failedGates.includes("promotable-variant-coverage"));

  const allModel = Object.fromEntries(
    ["raw", "guardrail", "method", "reviewer", "combined"].map((variant) => [variant, "model"]),
  );
  const critical = await fixtureLedger({
    proofLevels: allModel,
    observationOverrides: {
      method: {
        outcomeAgainstRaw: "win",
        comparisons: { matched: 3, wins: 3, losses: 0, ties: 0 },
        contextBytes: 1200,
      },
      combined: { criticalRegression: true },
    },
  });
  const criticalProfile = critical.ledgerApi.deriveActivationProfile({
    ledger: critical.ledger,
    trial: critical.trial,
    ...critical.trusted,
  });
  assert.equal(criticalProfile.lifecycleState, "ineligible");
  assert.equal(criticalProfile.recommendedMode, "guardrail");
  assert.ok(criticalProfile.failedGates.includes("criticalRegressions"));
});

test("unknown overhead stays null instead of becoming a synthetic finite metric", async () => {
  const fixture = await fixtureLedger({
    contextBytes: { raw: 0, guardrail: 100 },
  });
  const profile = fixture.ledgerApi.deriveActivationProfile({
    ledger: fixture.ledger,
    trial: fixture.trial,
    ...fixture.trusted,
  });
  const guardrail = profile.variantMetrics.find((metric) => metric.variant === "guardrail");
  assert.equal(guardrail.maximumOverheadRatio, null);
});

test("profile freshness invalidates every identity or bound digest mismatch without rewriting evidence", async () => {
  const { ledgerApi, trusted, trial, ledger } = await fixtureLedger();
  const profile = ledgerApi.deriveActivationProfile({ ledger, trial, ...trusted });
  const exactBindings = structuredClone(profile.boundDigests);
  assert.deepEqual(
    ledgerApi.evaluateProfileFreshness({
      profile,
      currentIdentity: profile.profileIdentity,
      currentBindings: exactBindings,
      ...trusted,
    }),
    { current: true, mismatches: [] },
  );

  for (const field of Object.keys(profile.profileIdentity)) {
    const changed = structuredClone(profile.profileIdentity);
    changed[field] = ["capabilityVersion", "environmentId"].includes(field)
      ? "9".repeat(64)
      : `${changed[field]}-changed`;
    const result = ledgerApi.evaluateProfileFreshness({
      profile,
      currentIdentity: changed,
      currentBindings: exactBindings,
      ...trusted,
    });
    assert.equal(result.current, false, field);
    assert.deepEqual(result.mismatches, [`profileIdentity.${field}`]);
  }

  for (const field of Object.keys(exactBindings)) {
    const changed = { ...exactBindings, [field]: "8".repeat(64) };
    const result = ledgerApi.evaluateProfileFreshness({
      profile,
      currentIdentity: profile.profileIdentity,
      currentBindings: changed,
      ...trusted,
    });
    assert.equal(result.current, false, field);
    assert.deepEqual(result.mismatches, [`boundDigests.${field}`]);
  }
  assert.equal(profile.evidenceRowDigests.length, 5);
});

function authorization({ actorId, grant, scopeDigest }) {
  return {
    actorId,
    grants: [grant],
    scopeDigest,
    issuedAt: "2026-08-31T06:10:00.000Z",
  };
}

function lifecycleContext(profile) {
  return {
    currentIdentity: structuredClone(profile.profileIdentity),
    currentBindings: structuredClone(profile.boundDigests),
  };
}

test("lifecycle receipts require external authority, reject self-promotion, and preserve failed gates", async () => {
  const { ledgerApi, trusted, trial, ledger } = await fixtureLedger();
  const fixtureProfile = ledgerApi.deriveActivationProfile({ ledger, trial, ...trusted });
  const fixtureAuthorization = authorization({
    actorId: "dom-maintainer",
    grant: trusted.policy.lifecycleGrants.promote,
    scopeDigest: fixtureProfile.profileDigest,
  });
  const rejected = ledgerApi.compileLifecycleDecision({
    profile: fixtureProfile,
    expectedProfileDigest: fixtureProfile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: "dom-maintainer",
    authorization: fixtureAuthorization,
    expectedAuthorizationDigest: profileKeyForTest(fixtureAuthorization),
    ...lifecycleContext(fixtureProfile),
    ...trusted,
  });
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.nextMode, "native");
  assert.ok(rejected.reasonCodes.includes("promotable-evidence-level"));

  const contractApi = await contracts();
  const eligibleUnsigned = {
    ...fixtureProfile,
    lifecycleState: "eligible",
    recommendedMode: "method",
    promotableEvidenceRows: 3,
    failedGates: [],
    variantMetrics: fixtureProfile.variantMetrics.map((metric) =>
      metric.variant === "method"
        ? {
            ...metric,
            matchedComparisons: 3,
            wins: 3,
            losses: 0,
            ties: 0,
            criticalRegressions: 0,
            maximumOverheadRatio: 1.2,
            evidenceLevels: ["model"],
          }
        : metric),
  };
  delete eligibleUnsigned.profileDigest;
  const eligibleProfile = {
    ...eligibleUnsigned,
    profileDigest: contractApi.canonicalDigest(eligibleUnsigned),
  };
  const promotionAuthorization = authorization({
    actorId: "dom-maintainer",
    grant: trusted.policy.lifecycleGrants.promote,
    scopeDigest: eligibleProfile.profileDigest,
  });
  const promoted = ledgerApi.compileLifecycleDecision({
    profile: eligibleProfile,
    expectedProfileDigest: eligibleProfile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: "dom-maintainer",
    authorization: promotionAuthorization,
    expectedAuthorizationDigest: profileKeyForTest(promotionAuthorization),
    ...lifecycleContext(eligibleProfile),
    ...trusted,
  });
  assert.equal(promoted.status, "applied");
  assert.equal(promoted.nextMode, "method");
  assert.equal(promoted.authorityExpanded, false);

  assert.throws(() => ledgerApi.compileLifecycleDecision({
    profile: eligibleProfile,
    expectedProfileDigest: eligibleProfile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: "dom-maintainer",
    authorization: promotionAuthorization,
    expectedAuthorizationDigest: profileKeyForTest(promotionAuthorization),
    currentIdentity: { ...eligibleProfile.profileIdentity, reasoningTier: "xhigh" },
    currentBindings: structuredClone(eligibleProfile.boundDigests),
    ...trusted,
  }), /current|fresh|identity/i);

  const promotedUnsigned = {
    ...eligibleProfile,
    lifecycleState: "promoted",
  };
  delete promotedUnsigned.profileDigest;
  const promotedProfile = {
    ...promotedUnsigned,
    profileDigest: contractApi.canonicalDigest(promotedUnsigned),
  };
  const demotionAuthorization = authorization({
    actorId: "dom-maintainer",
    grant: trusted.policy.lifecycleGrants.demote,
    scopeDigest: promotedProfile.profileDigest,
  });
  const demoted = ledgerApi.compileLifecycleDecision({
    profile: promotedProfile,
    expectedProfileDigest: promotedProfile.profileDigest,
    action: "demote",
    requestedMode: "native",
    currentMode: "method",
    actorId: "dom-maintainer",
    authorization: demotionAuthorization,
    expectedAuthorizationDigest: profileKeyForTest(demotionAuthorization),
    ...lifecycleContext(promotedProfile),
    ...trusted,
  });
  assert.equal(demoted.status, "applied");
  assert.equal(demoted.priorMode, "method");
  assert.equal(demoted.nextMode, "native");

  const criticalUnsigned = {
    ...eligibleProfile,
    lifecycleState: "ineligible",
    failedGates: ["criticalRegressions"],
    variantMetrics: eligibleProfile.variantMetrics.map((metric) =>
      metric.variant === "method" ? { ...metric, criticalRegressions: 1 } : metric),
  };
  delete criticalUnsigned.profileDigest;
  const criticalProfile = {
    ...criticalUnsigned,
    profileDigest: contractApi.canonicalDigest(criticalUnsigned),
  };
  const criticalAuthorization = authorization({
    actorId: "dom-maintainer",
    grant: trusted.policy.lifecycleGrants.promote,
    scopeDigest: criticalProfile.profileDigest,
  });
  const criticalRejected = ledgerApi.compileLifecycleDecision({
    profile: criticalProfile,
    expectedProfileDigest: criticalProfile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: "dom-maintainer",
    authorization: criticalAuthorization,
    expectedAuthorizationDigest: profileKeyForTest(criticalAuthorization),
    ...lifecycleContext(criticalProfile),
    ...trusted,
  });
  assert.equal(criticalRejected.status, "rejected");
  assert.ok(criticalRejected.reasonCodes.includes("criticalRegressions"));

  const selfActor = eligibleProfile.participantIds.producers[0];
  const selfAuthorization = authorization({
    actorId: selfActor,
    grant: trusted.policy.lifecycleGrants.promote,
    scopeDigest: eligibleProfile.profileDigest,
  });
  assert.throws(() => ledgerApi.compileLifecycleDecision({
    profile: eligibleProfile,
    expectedProfileDigest: eligibleProfile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: selfActor,
    authorization: selfAuthorization,
    expectedAuthorizationDigest: profileKeyForTest(selfAuthorization),
    ...lifecycleContext(eligibleProfile),
    ...trusted,
  }), /self-promot|independent/i);

  const wrongGrant = authorization({
    actorId: "dom-maintainer",
    grant: trusted.policy.lifecycleGrants.demote,
    scopeDigest: eligibleProfile.profileDigest,
  });
  assert.throws(() => ledgerApi.compileLifecycleDecision({
    profile: eligibleProfile,
    expectedProfileDigest: eligibleProfile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: "dom-maintainer",
    authorization: wrongGrant,
    expectedAuthorizationDigest: profileKeyForTest(wrongGrant),
    ...lifecycleContext(eligibleProfile),
    ...trusted,
  }), /grant|authority/i);
});
