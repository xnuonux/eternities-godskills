import test from "node:test";
import assert from "node:assert/strict";

import {
  auditHeldOutLeakage,
  createDevelopmentManifest,
  createEvaluationReceipt,
  decideEvolutionAdoption,
  mineRecurringFailures,
  sealHeldOutManifest,
  stageEvolutionProposal,
} from "../src/skill-evolution.mjs";

const digest = (character) => character.repeat(64);
const traces = [
  { id: "d-1", partition: "development", reviewed: true, evidenceDigest: digest("1"), targetSkillId: "oracle", failureCodes: ["missing-source-boundary"], critical: true },
  { id: "d-2", partition: "development", reviewed: true, evidenceDigest: digest("2"), targetSkillId: "oracle", failureCodes: ["missing-source-boundary", "weak-date-check"], critical: false },
  { id: "d-3", partition: "development", reviewed: true, evidenceDigest: digest("3"), targetSkillId: "oracle", failureCodes: ["weak-date-check"], critical: false },
];
const reviewLedgerDigest = digest("9");
const developmentManifest = createDevelopmentManifest(traces, { reviewAuthority: "review-board", reviewLedgerDigest });
const miningReceipt = mineRecurringFailures(developmentManifest, { minimumOccurrences: 2 });
const heldOutManifest = sealHeldOutManifest([
  { id: "h-1", partition: "held-out", evidenceDigest: digest("a") },
  { id: "h-2", partition: "held-out", evidenceDigest: digest("b") },
], { suiteId: "oracle-holdout" });

const policy = {
  schemaVersion: 1,
  requireAllCritical: true,
  requireImprovement: true,
  requireResolvedEffects: true,
  minimumScore: 0.75,
  maximumTokenCount: 500,
  kindMinimums: { direct: 0.75 },
  improvementDimensions: ["score", "tokenCount", "direct"],
};

function evaluation(overrides = {}) {
  return {
    schemaVersion: 1,
    status: "evaluated",
    total: 4,
    passed: 4,
    criticalTotal: 2,
    criticalPassed: 2,
    score: 1,
    tokenCount: 100,
    kindScores: { direct: { total: 4, passed: 4, score: 1 } },
    unresolvedEffects: [],
    failures: [],
    improvements: [],
    ...overrides,
  };
}

function proposal(overrides = {}) {
  return stageEvolutionProposal({
    targetSkillId: "oracle",
    baselineDigest: digest("c"),
    candidateDigest: digest("d"),
    edits: [{ operation: "append-case", sectionId: "evaluation", rationaleCode: "weak-date-check" }],
    miningReceipt,
    developmentManifest,
    trustedDevelopmentManifestDigest: developmentManifest.manifestDigest,
    trustedReviewLedgerDigest: reviewLedgerDigest,
    maximumEdits: 2,
    ...overrides,
  });
}

function evidence({ baseline = evaluation({ score: 0.75, passed: 3 }), candidate = evaluation(), staged = proposal(), held = heldOutManifest } = {}) {
  const leakageAudit = auditHeldOutLeakage({ proposal: staged, heldOutManifest: held });
  const baselineReceipt = createEvaluationReceipt({ role: "baseline", proposal: staged, heldOutManifest: held, artifactDigest: staged.baselineDigest, evaluation: baseline, evaluatorId: "deterministic-evaluator" });
  const candidateReceipt = createEvaluationReceipt({ role: "candidate", proposal: staged, heldOutManifest: held, artifactDigest: staged.candidateDigest, evaluation: candidate, evaluatorId: "deterministic-evaluator" });
  return { leakageAudit, baselineReceipt, candidateReceipt };
}

test("development manifest and recurring failure receipt are deterministic and partition-bound", () => {
  const reverse = createDevelopmentManifest([...traces].reverse(), { reviewAuthority: "review-board", reviewLedgerDigest });
  assert.equal(reverse.manifestDigest, developmentManifest.manifestDigest);
  assert.deepEqual(mineRecurringFailures(reverse), miningReceipt);
  assert.deepEqual(miningReceipt.clusters.map(({ failureCode }) => failureCode), ["missing-source-boundary", "weak-date-check"]);
  assert.throws(() => createDevelopmentManifest([{ ...traces[0], partition: "held-out" }], { reviewAuthority: "review-board", reviewLedgerDigest }), /development partition/);
  assert.throws(() => createDevelopmentManifest([{ ...traces[0], reviewed: false }], { reviewAuthority: "review-board", reviewLedgerDigest }), /reviewed/);
});

test("staging reconciles exact reviewed evidence and remains inactive", () => {
  const staged = proposal();
  assert.equal(staged.status, "staged");
  assert.equal(staged.active, false);
  assert.equal(staged.adopted, false);
  assert.match(staged.proposalDigest, /^[a-f0-9]{64}$/);
  assert.throws(() => proposal({ edits: [staged.edits[0], staged.edits[0], staged.edits[0]] }), /edit budget/);
  assert.throws(() => proposal({ trustedReviewLedgerDigest: digest("8") }), /trusted review ledger/);
});

test("fabricated or tampered mining evidence cannot stage", () => {
  const fabricated = structuredClone(miningReceipt);
  fabricated.clusters[0].failureCode = "fabricated-failure";
  assert.throws(() => proposal({ miningReceipt: fabricated, edits: [{ operation: "append-case", sectionId: "evaluation", rationaleCode: "fabricated-failure" }] }), /digest does not match/);
  const tamperedManifest = structuredClone(developmentManifest);
  tamperedManifest.records[0].failureCodes.push("fabricated-failure");
  assert.throws(() => proposal({ developmentManifest: tamperedManifest }), /digest does not match/);
});

test("held-out manifest derives its own digest and rejects duplicate evidence", () => {
  const reversed = sealHeldOutManifest([...heldOutManifest.records].reverse(), { suiteId: "oracle-holdout" });
  assert.equal(reversed.manifestDigest, heldOutManifest.manifestDigest);
  assert.throws(() => sealHeldOutManifest([{ id: "h-1", partition: "held-out", evidenceDigest: digest("a") }, { id: "h-2", partition: "held-out", evidenceDigest: digest("a") }], { suiteId: "oracle-holdout" }), /duplicate held-out evidence digest/);
});

test("evaluation receipts bind proposal, exact artifacts, and sealed suite", () => {
  const staged = proposal();
  const { baselineReceipt, candidateReceipt } = evidence({ staged });
  assert.equal(baselineReceipt.artifactDigest, staged.baselineDigest);
  assert.equal(candidateReceipt.artifactDigest, staged.candidateDigest);
  assert.equal(candidateReceipt.heldOutManifestDigest, heldOutManifest.manifestDigest);
  assert.throws(() => createEvaluationReceipt({ role: "candidate", proposal: staged, heldOutManifest, artifactDigest: digest("e"), evaluation: evaluation(), evaluatorId: "deterministic-evaluator" }), /artifact digest/);
});

test("measured held-out gain can become eligible but never adopted", () => {
  const staged = proposal();
  const receipts = evidence({ staged });
  const decision = decideEvolutionAdoption({ proposal: staged, ...receipts, policy });
  assert.equal(decision.status, "eligible");
  assert.equal(decision.adopted, false);
  assert.equal(decision.requiresExplicitAdoption, true);
});

test("self-declared improvements cannot forge measured gain", () => {
  const staged = proposal();
  const equal = evaluation({ improvements: ["score"] });
  const receipts = evidence({ staged, baseline: equal, candidate: equal });
  const decision = decideEvolutionAdoption({ proposal: staged, ...receipts, policy });
  assert.equal(decision.status, "unverified");
  assert.deepEqual(decision.improvements, []);
});

test("swapped proposal audit and evaluation receipts fail closed", () => {
  const staged = proposal();
  const other = proposal({ candidateDigest: digest("e") });
  const wrong = evidence({ staged: other });
  const decision = decideEvolutionAdoption({ proposal: staged, ...wrong, policy });
  assert.equal(decision.status, "blocked");
  assert.ok(decision.failedGates.includes("leakage-audit-binding"));
  assert.ok(decision.failedGates.includes("baseline-receipt-binding"));
  assert.ok(decision.failedGates.includes("candidate-receipt-binding"));
});

test("suite drift, critical regression, and unresolved effects fail closed", () => {
  const staged = proposal();
  const alternateHeld = sealHeldOutManifest([{ id: "h-3", partition: "held-out", evidenceDigest: digest("e") }], { suiteId: "other-holdout" });
  const mixed = evidence({ staged });
  mixed.candidateReceipt = evidence({ staged, held: alternateHeld }).candidateReceipt;
  assert.equal(decideEvolutionAdoption({ proposal: staged, ...mixed, policy }).status, "blocked");
  const critical = evidence({ staged, candidate: evaluation({ criticalPassed: 1 }) });
  assert.equal(decideEvolutionAdoption({ proposal: staged, ...critical, policy }).status, "blocked");
  const unresolved = evidence({ staged, candidate: evaluation({ unresolvedEffects: ["network"] }) });
  assert.equal(decideEvolutionAdoption({ proposal: staged, ...unresolved, policy }).status, "blocked");
});

test("receipt-bound ordering is ordinal for unicode identifiers", () => {
  const unicodeTraces = [
    { id: "z-trace", partition: "development", reviewed: true, evidenceDigest: digest("4"), targetSkillId: "oracle", failureCodes: ["z-failure"], critical: false },
    { id: "a-trace", partition: "development", reviewed: true, evidenceDigest: digest("5"), targetSkillId: "oracle", failureCodes: ["a-failure"], critical: false },
  ];
  const manifest = createDevelopmentManifest(unicodeTraces, { reviewAuthority: "review-board", reviewLedgerDigest });
  assert.deepEqual(manifest.records.map(({ id }) => id), ["a-trace", "z-trace"]);
});
