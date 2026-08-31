import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildPortfolioSchemas,
  createCompletedTrialReceipt,
  preregisterPortfolioPlan,
  reduceTrialPortfolio,
  validatePortfolioPolicy,
  verifyCompletedTrialReceipt,
  verifyPortfolioPlan,
  verifyPortfolioReport,
} from "../src/adaptive-evidence-portfolio.mjs";
import {
  canonicalDigest,
  canonicalJson,
  profileKey,
} from "../src/adaptive-evidence-contracts.mjs";
import {
  appendEvidenceRow,
  createEvidenceLedger,
  deriveActivationProfile,
} from "../src/adaptive-evidence-ledger.mjs";
import {
  createObservationProposal,
  preregisterTrial,
} from "../src/adaptive-evidence-trials.mjs";
import {
  createPortfolioWitnessAuthority,
  portfolioWitnessAttestationMessage,
  portfolioWitnessRecordDigest,
} from "../src/adaptive-evidence-portfolio-witness.mjs";

const portfolioPolicyUrl = new URL(
  "../policies/adaptive-evidence-portfolio.v1.json",
  import.meta.url,
);
const evidencePolicyUrl = new URL("../policies/adaptive-evidence.v2.json", import.meta.url);

const identity = Object.freeze({
  capabilityId: "eternities-aegis",
  taskClass: "security-review",
  modelFamily: "gpt-5.6-terra",
  reasoningTier: "high",
  consequenceClass: "consequential",
  capabilityVersion: "a".repeat(64),
  environmentId: "b".repeat(64),
});

const tasks = Object.freeze([
  Object.freeze({
    slotId: "slot-filesystem-alias",
    trialId: "aegis-filesystem-alias-001",
    taskDefinition: Object.freeze({
      id: "aegis-filesystem-boundary",
      version: "1",
      mission: "review an inert filesystem boundary for alias escapes",
      artifactContract: "closed security finding list",
    }),
    diversityValues: Object.freeze([
      Object.freeze({ axis: "surface", value: "filesystem-boundary" }),
      Object.freeze({ axis: "failure-mode", value: "path-alias" }),
    ]),
  }),
  Object.freeze({
    slotId: "slot-provider-confusion",
    trialId: "aegis-provider-confusion-001",
    taskDefinition: Object.freeze({
      id: "aegis-provider-boundary",
      version: "1",
      mission: "review an inert provider boundary for identity confusion",
      artifactContract: "closed security finding list",
    }),
    diversityValues: Object.freeze([
      Object.freeze({ axis: "surface", value: "provider-boundary" }),
      Object.freeze({ axis: "failure-mode", value: "identity-confusion" }),
    ]),
  }),
]);

const comparisonPolicy = Object.freeze({
  id: "portfolio-fixture-five-condition-comparison",
  version: "1",
  baseline: "raw",
  variants: Object.freeze(["raw", "guardrail", "method", "reviewer", "combined"]),
  metrics: Object.freeze(["validity", "coverage", "unsupported-claims"]),
  stopConditions: Object.freeze(["five-artifacts-recorded", "critical-regression"]),
});

const witnessKeys = generateKeyPairSync("ed25519");
const witnessAuthority = createPortfolioWitnessAuthority({
  trustRootId: "portfolio-test-witness-root",
  registryId: "portfolio-test-preregistration-log",
  trustedKeys: new Map([["portfolio-test-witness-key", witnessKeys.publicKey]]),
});
const planWitnesses = new WeakMap();

async function json(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function trusted() {
  const [portfolioPolicy, evidencePolicy] = await Promise.all([
    json(portfolioPolicyUrl),
    json(evidencePolicyUrl),
  ]);
  return {
    portfolioPolicy,
    expectedPortfolioPolicyDigest: canonicalDigest(portfolioPolicy),
    evidencePolicy,
    expectedEvidencePolicyDigest: canonicalDigest(evidencePolicy),
    witnessAuthority,
  };
}

function attestPlan(plan, witnessedAt = iso(plan.registeredAt, 1)) {
  const record = {
    schemaVersion: 1,
    id: `${plan.id}-witness`,
    purpose: "adaptive-evidence-portfolio-preregistration",
    registryId: witnessAuthority.registryId,
    sequence: 0,
    previousWitnessDigest: null,
    planDigest: plan.planDigest,
    portfolioPolicyDigest: plan.policyDigest,
    authorityTrustRootDigest: witnessAuthority.trustRootDigest,
    witnessedAt,
    dispatchNotStarted: true,
  };
  const subjectDigest = portfolioWitnessRecordDigest(record);
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-portfolio-preregistration",
    subjectDigest,
    keyId: "portfolio-test-witness-key",
  };
  const attestation = {
    ...unsigned,
    signature: sign(
      null,
      portfolioWitnessAttestationMessage(unsigned),
      witnessKeys.privateKey,
    ).toString("base64"),
  };
  const body = { record, attestation, semanticVerificationRequired: true };
  return { ...body, witnessDigest: canonicalDigest(body) };
}

function witnessTrust(plan, trust) {
  const planWitness = planWitnesses.get(plan);
  assert.ok(planWitness, "test plan lacks its preregistration witness");
  return {
    planWitness,
    witnessAuthority: trust.witnessAuthority,
    expectedWitnessTrustRootDigest: trust.witnessAuthority.trustRootDigest,
  };
}

function planInputSlots(source = tasks) {
  return source.map((task) => ({
    slotId: task.slotId,
    trialId: task.trialId,
    taskDefinition: {
      id: task.taskDefinition.id,
      version: task.taskDefinition.version,
      digest: canonicalDigest(task.taskDefinition),
    },
    diversityValues: task.diversityValues.map((entry) => ({ ...entry })),
  }));
}

async function buildPlan(overrides = {}) {
  const trust = await trusted();
  const plan = preregisterPortfolioPlan({
    portfolioId: "aegis-cross-task-fixture-001",
    profileIdentity: identity,
    selectionRule: {
      mode: "exact-preregistered-set",
      diversityAxes: ["surface", "failure-mode"],
      minimumDistinctValues: [
        { axis: "surface", count: 2 },
        { axis: "failure-mode", count: 2 },
      ],
    },
    taskSlots: planInputSlots(),
    registeredAt: "2026-08-31T12:00:00.000Z",
    policy: trust.portfolioPolicy,
    expectedPolicyDigest: trust.expectedPortfolioPolicyDigest,
    ...overrides,
  });
  planWitnesses.set(plan, attestPlan(plan));
  return plan;
}

function iso(base, offsetSeconds) {
  return new Date(new Date(base).valueOf() + offsetSeconds * 1000).toISOString();
}

function comparisons(outcome, count) {
  if (outcome === "baseline") return { matched: 0, wins: 0, losses: 0, ties: 0 };
  return {
    matched: count,
    wins: outcome === "win" ? count : 0,
    losses: outcome === "loss" ? count : 0,
    ties: outcome === "tie" ? count : 0,
  };
}

function hasObjectKey(value, forbidden) {
  if (!value || typeof value !== "object") return false;
  if (!Array.isArray(value) && Object.hasOwn(value, forbidden)) return true;
  return Object.values(value).some((child) => hasObjectKey(child, forbidden));
}

async function buildEvidenceBundle({
  plan,
  slotId,
  outcomes = {},
  critical = {},
  caseCount = 3,
  proofLevel = "model",
  variants = ["raw", "guardrail", "method", "reviewer", "combined"],
  profileIdentity = identity,
} = {}) {
  const trust = await trusted();
  const slot = plan.taskSlots.find((candidate) => candidate.slotId === slotId);
  assert.ok(slot, `missing test slot ${slotId}`);
  const sourceTask = tasks.find((candidate) => candidate.slotId === slotId)?.taskDefinition;
  assert.ok(sourceTask, `missing source task ${slotId}`);
  const slotIndex = plan.taskSlots.findIndex((candidate) => candidate.slotId === slotId);
  const registeredAt = iso(plan.registeredAt, 60 + slotIndex * 600);
  const trial = preregisterTrial({
    trialId: slot.trialId,
    profileIdentity,
    capabilityManifestDigest: profileIdentity.capabilityVersion,
    taskDefinition: sourceTask,
    comparisonPolicy,
    artifactBoundary: { mediaType: "application/json", required: true },
    evaluator: {
      kind: "deterministic-verifier",
      id: `portfolio-fixture-evaluator-${slotId}`,
      digest: canonicalDigest({ evaluator: slotId, version: 1 }),
    },
    producerId: `portfolio-fixture-host-${slotId}`,
    registeredAt,
    policy: trust.evidencePolicy,
    expectedPolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  let ledger = createEvidenceLedger({
    trial,
    createdAt: iso(registeredAt, 10),
    policy: trust.evidencePolicy,
    expectedPolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  let baselineArtifactDigest = null;
  for (const [index, variant] of variants.entries()) {
    const outcome = variant === "raw" ? "baseline" : outcomes[variant] ?? "win";
    const artifactDigest = canonicalDigest({ slotId, variant, artifact: "fixture" });
    if (variant === "raw") baselineArtifactDigest = artifactDigest;
    const producedAt = iso(registeredAt, 20 + index * 10);
    const observedAt = iso(registeredAt, 21 + index * 10);
    const proposal = createObservationProposal({
      trial,
      expectedTrialDigest: trial.trialDigest,
      variant,
      artifact: {
        sha256: artifactDigest,
        bytes: 1000 + index,
        mediaType: "application/json",
        producedAt,
      },
      observation: {
        score: outcome === "loss" ? 1 : outcome === "tie" ? 5 : 10,
        outcomeAgainstRaw: outcome,
        criticalRegression: critical[variant] ?? false,
        baselineArtifactDigest: variant === "raw" ? null : baselineArtifactDigest,
        comparisons: comparisons(outcome, variant === "raw" ? 0 : caseCount),
        reasonCodes: [`fixture-${outcome}`],
      },
      cost: {
        bytes: 1000 + index,
        tokens: null,
        latencyMs: null,
        monetaryCost: null,
      },
      proofLevel,
      producerId: `portfolio-fixture-producer-${slotId}-${variant}`,
      evaluatorId: trial.evaluator.id,
      observedAt,
      policy: trust.evidencePolicy,
      expectedPolicyDigest: trust.expectedEvidencePolicyDigest,
    });
    ledger = appendEvidenceRow({
      ledger,
      trial,
      proposal,
      policy: trust.evidencePolicy,
      expectedPolicyDigest: trust.expectedEvidencePolicyDigest,
    });
  }
  const profile = deriveActivationProfile({
    ledger,
    trial,
    policy: trust.evidencePolicy,
    expectedPolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  return {
    trial,
    ledger,
    profile,
    completedAt: iso(registeredAt, 90),
  };
}

async function complete(plan, slotId, options = {}) {
  const trust = await trusted();
  const bundle = await buildEvidenceBundle({ plan, slotId, ...options });
  const receipt = createCompletedTrialReceipt({
    plan,
    slotId,
    ...bundle,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  return {
    receipt,
    trial: bundle.trial,
    ledger: bundle.ledger,
    profile: bundle.profile,
  };
}

test("portfolio policy is closed, authority-neutral, and generates closed schemas", async () => {
  const trust = await trusted();
  assert.deepEqual(validatePortfolioPolicy({
    policy: trust.portfolioPolicy,
    expectedPolicyDigest: trust.expectedPortfolioPolicyDigest,
  }), trust.portfolioPolicy);
  assert.equal(trust.portfolioPolicy.reportingOnly, true);
  assert.equal(trust.portfolioPolicy.minimumDiversityAxes, 2);
  assert.equal(trust.portfolioPolicy.minimumDistinctValuesPerAxis, 2);
  assert.equal(trust.portfolioPolicy.schemaValidationSufficient, false);
  assert.equal(trust.portfolioPolicy.caseComparisonAggregationAllowed, false);
  assert.equal(trust.portfolioPolicy.profilePromotionAllowed, false);
  assert.equal(trust.portfolioPolicy.lifecycleActionAllowed, false);
  assert.equal(trust.portfolioPolicy.activationRequestAllowed, false);
  assert.equal(trust.portfolioPolicy.authorityExpanded, false);

  const permissive = { ...trust.portfolioPolicy, activationRequestAllowed: true };
  assert.throws(() => validatePortfolioPolicy({
    policy: permissive,
    expectedPolicyDigest: canonicalDigest(permissive),
  }), /activation|authority|reporting/i);
  assert.throws(() => validatePortfolioPolicy({
    policy: { ...trust.portfolioPolicy, extra: true },
    expectedPolicyDigest: trust.expectedPortfolioPolicyDigest,
  }), /keys|closed|digest/i);

  const schemas = buildPortfolioSchemas();
  assert.deepEqual(Object.keys(schemas).sort(), ["completion", "plan", "report", "witness"]);
  for (const schema of Object.values(schemas)) {
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  }
  assert.equal(schemas.report.properties.reportingOnly.const, true);
  assert.equal(schemas.report.properties.profilePromotionAllowed.const, false);
  assert.equal("recommendedMode" in schemas.report.properties, false);
  assert.match(schemas.plan.$comment, /verifyPortfolioPlan.*required/i);
  assert.match(schemas.completion.$comment, /verifyCompletedTrialReceipt.*required/i);
  assert.match(schemas.report.$comment, /verifyPortfolioReport.*required/i);
  assert.match(schemas.witness.$comment, /verifyPlanWitness.*required/i);
  assert.equal(schemas.plan.properties.semanticVerificationRequired.const, true);
  assert.equal(schemas.completion.properties.semanticVerificationRequired.const, true);
  assert.equal(schemas.report.properties.semanticVerificationRequired.const, true);
  assert.match(JSON.stringify(schemas.report.allOf), /"status".*"complete".*"maxItems":0/i);
  assert.match(JSON.stringify(schemas.report.allOf), /"status".*"incomplete".*"minItems":1/i);
  assert.deepEqual(
    schemas.completion.properties.variantOutcomes.prefixItems
      .map((entry) => entry.properties.variant.const),
    ["guardrail", "method", "reviewer", "combined"],
  );
  assert.equal(schemas.completion.properties.variantOutcomes.items, false);
  assert.deepEqual(
    schemas.report.properties.variantMetrics.prefixItems
      .map((entry) => entry.properties.variant.const),
    ["guardrail", "method", "reviewer", "combined"],
  );
  assert.equal(schemas.report.properties.variantMetrics.items, false);
});

test("portfolio plan freezes one exact profile, task set, and diversity rule", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  assert.equal(plan.status, "preregistered");
  assert.equal(plan.semanticVerificationRequired, true);
  assert.equal(plan.profileKey, profileKey(identity));
  assert.equal(plan.taskSlots.length, 2);
  assert.deepEqual(plan.taskSlots.map(({ slotId }) => slotId), [
    "slot-filesystem-alias",
    "slot-provider-confusion",
  ]);
  assert.equal(verifyPortfolioPlan({
    plan,
    policy: trust.portfolioPolicy,
    expectedPolicyDigest: trust.expectedPortfolioPolicyDigest,
  }).valid, true);

  const reordered = await buildPlan({
    selectionRule: {
      mode: "exact-preregistered-set",
      diversityAxes: ["failure-mode", "surface"],
      minimumDistinctValues: [
        { axis: "failure-mode", count: 2 },
        { axis: "surface", count: 2 },
      ],
    },
    taskSlots: planInputSlots([...tasks].reverse()).map((slot) => ({
      ...slot,
      diversityValues: [...slot.diversityValues].reverse(),
    })),
  });
  assert.equal(reordered.planDigest, plan.planDigest);

  const mutated = structuredClone(plan);
  mutated.taskSlots[0].taskDefinition.digest = "0".repeat(64);
  assert.throws(() => verifyPortfolioPlan({
    plan: mutated,
    policy: trust.portfolioPolicy,
    expectedPolicyDigest: trust.expectedPortfolioPolicyDigest,
  }), /digest|plan/i);
});

test("portfolio plan rejects duplicate membership and fake diversity", async () => {
  const duplicateTasks = planInputSlots();
  duplicateTasks[1].taskDefinition = { ...duplicateTasks[0].taskDefinition };
  await assert.rejects(buildPlan({ taskSlots: duplicateTasks }), /duplicate.*task|task.*duplicate/i);

  const duplicateTrials = planInputSlots();
  duplicateTrials[1].trialId = duplicateTrials[0].trialId;
  await assert.rejects(buildPlan({ taskSlots: duplicateTrials }), /duplicate.*trial|trial.*duplicate/i);

  const missingAxis = planInputSlots();
  missingAxis[1].diversityValues = missingAxis[1].diversityValues.slice(0, 1);
  await assert.rejects(buildPlan({ taskSlots: missingAxis }), /axis|diversity/i);

  const collapsed = planInputSlots();
  collapsed[1].diversityValues = collapsed[1].diversityValues.map((entry) => ({
    ...entry,
    value: collapsed[0].diversityValues.find(({ axis }) => axis === entry.axis).value,
  }));
  await assert.rejects(buildPlan({ taskSlots: collapsed }), /distinct|diversity/i);

  await assert.rejects(buildPlan({ taskSlots: planInputSlots().slice(0, 1) }), /minimum|two|task/i);

  const oneAxisSlots = planInputSlots().map((slot) => ({
    ...slot,
    diversityValues: slot.diversityValues.filter(({ axis }) => axis === "surface"),
  }));
  await assert.rejects(buildPlan({
    selectionRule: {
      mode: "exact-preregistered-set",
      diversityAxes: ["surface"],
      minimumDistinctValues: [{ axis: "surface", count: 2 }],
    },
    taskSlots: oneAxisSlots,
  }), /diversity.*axes|axes.*minimum/i);

  await assert.rejects(buildPlan({
    selectionRule: {
      mode: "exact-preregistered-set",
      diversityAxes: ["surface", "failure-mode"],
      minimumDistinctValues: [
        { axis: "surface", count: 1 },
        { axis: "failure-mode", count: 1 },
      ],
    },
  }), /distinct.*minimum|minimum.*distinct/i);
});

test("completion receipt reverifies one separate trial and exposes no case counters", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const member = await complete(plan, "slot-filesystem-alias", { caseCount: 9000 });
  assert.equal(member.receipt.status, "completed");
  assert.equal(member.receipt.semanticVerificationRequired, true);
  assert.equal(member.receipt.planDigest, plan.planDigest);
  assert.equal(member.receipt.planWitnessDigest, planWitnesses.get(plan).witnessDigest);
  assert.equal(
    member.receipt.witnessAuthorityTrustRootDigest,
    witnessAuthority.trustRootDigest,
  );
  assert.equal(member.receipt.profileKey, plan.profileKey);
  assert.deepEqual(member.receipt.variantOutcomes.map(({ variant }) => variant), [
    "guardrail", "method", "reviewer", "combined",
  ]);
  assert.equal(JSON.stringify(member.receipt).includes("matchedComparisons"), false);
  assert.equal(JSON.stringify(member.receipt).includes("comparisons"), false);
  assert.match(member.receipt.caseEvidenceDigest, /^[a-f0-9]{64}$/);
  assert.equal(verifyCompletedTrialReceipt({
    plan,
    slotId: member.receipt.slotId,
    trial: member.trial,
    ledger: member.ledger,
    profile: member.profile,
    receipt: member.receipt,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }).valid, true);
});

test("completion rejects incomplete, retrospective, unqualified, or drifted evidence", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const incomplete = await buildEvidenceBundle({
    plan,
    slotId: "slot-filesystem-alias",
    variants: ["raw", "guardrail", "method", "reviewer"],
  });
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    slotId: "slot-filesystem-alias",
    ...incomplete,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /complete|variant/i);

  const fixture = await buildEvidenceBundle({
    plan,
    slotId: "slot-filesystem-alias",
    proofLevel: "fixture",
  });
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    slotId: "slot-filesystem-alias",
    ...fixture,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /evidence|proof|admissible/i);

  const completeBundle = await buildEvidenceBundle({ plan, slotId: "slot-filesystem-alias" });
  const changedProfile = structuredClone(completeBundle.profile);
  changedProfile.recommendedMode = changedProfile.recommendedMode === "method" ? "native" : "method";
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    slotId: "slot-filesystem-alias",
    ...completeBundle,
    profile: changedProfile,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /profile|digest/i);

  assert.throws(() => createCompletedTrialReceipt({
    plan,
    slotId: "slot-provider-confusion",
    ...completeBundle,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /slot|trial|task/i);

  const latePlan = await buildPlan({ registeredAt: iso(completeBundle.trial.registeredAt, 1) });
  assert.throws(() => createCompletedTrialReceipt({
    plan: latePlan,
    slotId: "slot-filesystem-alias",
    ...completeBundle,
    ...witnessTrust(latePlan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /predate|registered|selection/i);

  assert.throws(() => createCompletedTrialReceipt({
    plan,
    slotId: "slot-filesystem-alias",
    ...completeBundle,
    completedAt: completeBundle.ledger.rows.at(-1).observedAt,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /completion.*after|completedAt/i);
});

test("completion requires a host-pinned signed witness created before trial dispatch", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const bundle = await buildEvidenceBundle({ plan, slotId: "slot-filesystem-alias" });
  const lateWitness = attestPlan(plan, iso(bundle.trial.registeredAt, 1));
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    planWitness: lateWitness,
    witnessAuthority: trust.witnessAuthority,
    expectedWitnessTrustRootDigest: trust.witnessAuthority.trustRootDigest,
    slotId: "slot-filesystem-alias",
    ...bundle,
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /witness.*predate|witness.*before|trial.*after/i);

  const untrusted = generateKeyPairSync("ed25519");
  const wrongAuthority = createPortfolioWitnessAuthority({
    trustRootId: "portfolio-attacker-root",
    registryId: "portfolio-test-preregistration-log",
    trustedKeys: new Map([["portfolio-test-witness-key", untrusted.publicKey]]),
  });
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    planWitness: planWitnesses.get(plan),
    witnessAuthority: wrongAuthority,
    expectedWitnessTrustRootDigest: trust.witnessAuthority.trustRootDigest,
    slotId: "slot-filesystem-alias",
    ...bundle,
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /host-pinned|trust root|authority/i);

  const forgedAuthorityObject = {
    trustRootDigest: trust.witnessAuthority.trustRootDigest,
    verifyPlanWitness: () => ({
      valid: true,
      witnessDigest: planWitnesses.get(plan).witnessDigest,
      planDigest: plan.planDigest,
      witnessedAt: planWitnesses.get(plan).record.witnessedAt,
      authorityTrustRootDigest: trust.witnessAuthority.trustRootDigest,
    }),
  };
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    planWitness: planWitnesses.get(plan),
    witnessAuthority: forgedAuthorityObject,
    expectedWitnessTrustRootDigest: trust.witnessAuthority.trustRootDigest,
    slotId: "slot-filesystem-alias",
    ...bundle,
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /authentic|constructed|host-pinned|trust root|authority/i);
});

test("portfolio counts tasks rather than internal oracle cases", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const first = await complete(plan, "slot-filesystem-alias", { caseCount: 3 });
  const second = await complete(plan, "slot-provider-confusion", { caseCount: 3000 });
  const report = reduceTrialPortfolio({
    plan,
    members: [first, second],
    ...witnessTrust(plan, trust),
    generatedAt: "2026-08-31T13:00:00.000Z",
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  assert.equal(report.status, "complete");
  assert.equal(report.semanticVerificationRequired, true);
  assert.equal(report.completedTaskCount, 2);
  assert.equal(report.planWitnessDigest, planWitnesses.get(plan).witnessDigest);
  for (const metric of report.variantMetrics) {
    assert.equal(metric.completedTasks, 2);
    assert.equal(metric.wins + metric.losses + metric.ties, 2);
    assert.equal(metric.wins, 2);
    assert.equal(metric.passedEvidenceGate, true);
  }
  assert.deepEqual(report.candidatesPassingEvidenceGate, [
    "guardrail", "method", "reviewer", "combined",
  ]);
  assert.equal(JSON.stringify(report).includes("3000"), false);
  assert.equal(report.caseComparisonAggregationAllowed, false);
  assert.equal(report.reportingOnly, true);
  assert.equal(report.profilePromotionAllowed, false);
  assert.equal(report.lifecycleActionAllowed, false);
  assert.equal(report.activationRequestAllowed, false);
  assert.equal(report.authorityExpanded, false);
  for (const forbidden of ["recommendedMode", "lifecycleDecision", "activationRequest"]) {
    assert.equal(hasObjectKey(report, forbidden), false);
  }
});

test("one worst-task critical regression fails a candidate despite its wins", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const first = await complete(plan, "slot-filesystem-alias");
  const second = await complete(plan, "slot-provider-confusion", {
    critical: { method: true },
  });
  const report = reduceTrialPortfolio({
    plan,
    members: [first, second],
    ...witnessTrust(plan, trust),
    generatedAt: "2026-08-31T13:00:00.000Z",
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  const method = report.variantMetrics.find(({ variant }) => variant === "method");
  assert.equal(method.wins, 2);
  assert.equal(method.criticalRegressions, 1);
  assert.equal(method.worstTaskCriticalRegression, true);
  assert.equal(method.passedEvidenceGate, false);
  assert.ok(method.failedGates.includes("worst-task-critical-regression"));
  assert.equal(report.candidatesPassingEvidenceGate.includes("method"), false);
});

test("a missing task stays visible and cannot become a smaller passing cohort", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const first = await complete(plan, "slot-filesystem-alias");
  const report = reduceTrialPortfolio({
    plan,
    members: [first],
    ...witnessTrust(plan, trust),
    generatedAt: "2026-08-31T13:00:00.000Z",
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  });
  assert.equal(report.status, "incomplete");
  assert.deepEqual(report.missingSlotIds, ["slot-provider-confusion"]);
  assert.deepEqual(report.candidatesPassingEvidenceGate, []);
  assert.ok(report.variantMetrics.every((metric) => !metric.passedEvidenceGate));
  assert.ok(report.variantMetrics.every((metric) => metric.failedGates.includes("complete-cohort")));
});

test("portfolio rejects duplicate, unregistered, cross-profile, and tampered members", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const first = await complete(plan, "slot-filesystem-alias");
  assert.throws(() => reduceTrialPortfolio({
    plan,
    members: [first, first],
    ...witnessTrust(plan, trust),
    generatedAt: "2026-08-31T13:00:00.000Z",
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /duplicate/i);

  const tampered = structuredClone(first);
  tampered.receipt.variantOutcomes[0].outcomeAgainstRaw = "loss";
  assert.throws(() => reduceTrialPortfolio({
    plan,
    members: [tampered],
    ...witnessTrust(plan, trust),
    generatedAt: "2026-08-31T13:00:00.000Z",
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /completion|digest|receipt/i);

  const otherIdentity = { ...identity, modelFamily: "different-model" };
  const foreign = await buildEvidenceBundle({
    plan,
    slotId: "slot-filesystem-alias",
    profileIdentity: otherIdentity,
  });
  assert.throws(() => createCompletedTrialReceipt({
    plan,
    slotId: "slot-filesystem-alias",
    ...foreign,
    ...witnessTrust(plan, trust),
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  }), /profile/i);
});

test("portfolio report is deterministic under member reordering and fully reverified", async () => {
  const trust = await trusted();
  const plan = await buildPlan();
  const first = await complete(plan, "slot-filesystem-alias", {
    outcomes: { reviewer: "tie" },
  });
  const second = await complete(plan, "slot-provider-confusion", {
    outcomes: { reviewer: "loss" },
  });
  const options = {
    plan,
    ...witnessTrust(plan, trust),
    generatedAt: "2026-08-31T13:00:00.000Z",
    portfolioPolicy: trust.portfolioPolicy,
    expectedPortfolioPolicyDigest: trust.expectedPortfolioPolicyDigest,
    evidencePolicy: trust.evidencePolicy,
    expectedEvidencePolicyDigest: trust.expectedEvidencePolicyDigest,
  };
  const forward = reduceTrialPortfolio({ ...options, members: [first, second] });
  const reverse = reduceTrialPortfolio({ ...options, members: [second, first] });
  assert.equal(canonicalJson(forward), canonicalJson(reverse));
  assert.equal(verifyPortfolioReport({
    ...options,
    members: [first, second],
    report: forward,
  }).valid, true);

  const changed = structuredClone(forward);
  changed.completedTaskCount = 2000;
  assert.throws(() => verifyPortfolioReport({
    ...options,
    members: [first, second],
    report: changed,
  }), /report|digest|match/i);
});
