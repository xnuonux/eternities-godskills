import test from "node:test";
import assert from "node:assert/strict";

import {
  auditHeldOutLeakage,
  decideEvolutionAdoption,
  mineRecurringFailures,
  stageEvolutionProposal,
} from "../src/skill-evolution.mjs";

const digest = (character) => character.repeat(64);
const development = [
  { id: "d-1", partition: "development", reviewed: true, evidenceDigest: digest("1"), targetSkillId: "oracle", failureCodes: ["missing-source-boundary"], critical: true },
  { id: "d-2", partition: "development", reviewed: true, evidenceDigest: digest("2"), targetSkillId: "oracle", failureCodes: ["missing-source-boundary", "weak-date-check"], critical: false },
  { id: "d-3", partition: "development", reviewed: true, evidenceDigest: digest("3"), targetSkillId: "oracle", failureCodes: ["weak-date-check"], critical: false },
];

const heldOut = [
  { id: "h-1", partition: "held-out", evidenceDigest: digest("a") },
  { id: "h-2", partition: "held-out", evidenceDigest: digest("b") },
];

function evaluation(overrides = {}) {
  return {
    status: "evaluated",
    targetSkillId: "oracle",
    baselineDigest: digest("c"),
    datasetPartition: "held-out",
    suiteDigest: digest("f"),
    total: 4,
    passed: 4,
    criticalTotal: 2,
    criticalPassed: 2,
    score: 1,
    tokenCount: 100,
    kindScores: { direct: { total: 4, passed: 4, score: 1 } },
    unresolvedEffects: [],
    improvements: [],
    ...overrides,
  };
}

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

test("recurring failure mining is deterministic and development-only", () => {
  const forward = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const reverse = mineRecurringFailures([...development].reverse(), { minimumOccurrences: 2 });
  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward.map(({ failureCode }) => failureCode), ["missing-source-boundary", "weak-date-check"]);
  assert.throws(() => mineRecurringFailures([...development, heldOut[0]]), /development partition/);
  assert.throws(() => mineRecurringFailures([{ ...development[0], reviewed: false }]), /reviewed/);
});

test("staging is bounded, byte-bound, and inactive by default", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const proposal = stageEvolutionProposal({
    targetSkillId: "oracle",
    baselineDigest: digest("c"),
    edits: [
      { operation: "replace-section", section: "source boundaries", rationaleCode: "missing-source-boundary" },
      { operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" },
    ],
    failures,
    maximumEdits: 2,
  });
  assert.equal(proposal.status, "staged");
  assert.equal(proposal.active, false);
  assert.equal(proposal.adopted, false);
  assert.deepEqual(proposal.constructionEvidenceIds, ["d-1", "d-2", "d-3"]);
  assert.throws(() => stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [...proposal.edits, proposal.edits[0]], failures, maximumEdits: 2 }), /edit budget/);
});

test("held-out leakage catches identity digest and suite construction overlap", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const clean = stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" }], failures, maximumEdits: 2 });
  assert.equal(auditHeldOutLeakage({ proposal: clean, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") }).status, "clear");
  const leaked = { ...clean, constructionEvidenceDigests: [...clean.constructionEvidenceDigests, digest("a")] };
  const audit = auditHeldOutLeakage({ proposal: leaked, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") });
  assert.equal(audit.status, "leaked");
  assert.ok(audit.leaks.some(({ type }) => type === "evidence-digest"));
  assert.equal(auditHeldOutLeakage({ proposal: { ...clean, constructionInputDigests: [digest("f")] }, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") }).status, "leaked");
});

test("adoption eligibility requires same held-out suite, clean leakage, and measured gain", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const proposal = stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" }], failures, maximumEdits: 2 });
  const leakageAudit = auditHeldOutLeakage({ proposal, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") });
  const decision = decideEvolutionAdoption({ proposal, baseline: evaluation({ score: 0.75, passed: 3 }), candidate: evaluation({ score: 1 }), policy, leakageAudit });
  assert.equal(decision.status, "eligible");
  assert.equal(decision.adopted, false);
  assert.equal(decision.requiresExplicitAdoption, true);
});

test("leakage, suite drift, critical regression, and absent gain fail closed", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const proposal = stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" }], failures, maximumEdits: 2 });
  const clean = auditHeldOutLeakage({ proposal, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") });
  assert.equal(decideEvolutionAdoption({ proposal, baseline: evaluation(), candidate: evaluation(), policy, leakageAudit: clean }).status, "unverified");
  assert.equal(decideEvolutionAdoption({ proposal, baseline: evaluation(), candidate: evaluation({ suiteDigest: digest("e") }), policy, leakageAudit: clean }).status, "blocked");
  assert.equal(decideEvolutionAdoption({ proposal, baseline: evaluation(), candidate: evaluation({ criticalPassed: 1 }), policy, leakageAudit: clean }).status, "blocked");
  assert.equal(decideEvolutionAdoption({ proposal, baseline: evaluation({ score: 0.75, passed: 3 }), candidate: evaluation(), policy, leakageAudit: { status: "leaked", leaks: [{ type: "case-id" }] } }).status, "blocked");
});

test("a clean audit from another proposal cannot be substituted", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const proposal = stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" }], failures, maximumEdits: 2 });
  const other = { ...proposal, edits: [{ ...proposal.edits[0], section: "different section" }] };
  const wrongAudit = auditHeldOutLeakage({ proposal: other, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") });
  const decision = decideEvolutionAdoption({ proposal, baseline: evaluation({ score: 0.75, passed: 3 }), candidate: evaluation(), policy, leakageAudit: wrongAudit });
  assert.equal(decision.status, "blocked");
  assert.ok(decision.failedGates.includes("leakage-audit-binding"));
});

test("evaluation evidence must bind the target skill and exact baseline", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const proposal = stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" }], failures, maximumEdits: 2 });
  const audit = auditHeldOutLeakage({ proposal, heldOutCases: heldOut, heldOutSuiteDigest: digest("f") });
  const wrongTarget = decideEvolutionAdoption({ proposal, baseline: evaluation(), candidate: evaluation({ targetSkillId: "aegis" }), policy, leakageAudit: audit });
  const wrongBaseline = decideEvolutionAdoption({ proposal, baseline: evaluation(), candidate: evaluation({ baselineDigest: digest("d") }), policy, leakageAudit: audit });
  assert.ok(wrongTarget.failedGates.includes("target-binding"));
  assert.ok(wrongBaseline.failedGates.includes("baseline-binding"));
});

test("forged recurrence and duplicate held-out digests fail validation", () => {
  const failures = mineRecurringFailures(development, { minimumOccurrences: 2 });
  const forged = [{ ...failures[0], occurrences: 2, traceIds: ["d-1"], evidenceDigests: [digest("1")] }];
  assert.throws(() => stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: forged[0].failureCode }], failures: forged }), /recurrence evidence/);
  const proposal = stageEvolutionProposal({ targetSkillId: "oracle", baselineDigest: digest("c"), edits: [{ operation: "append-case", section: "evaluation", rationaleCode: "weak-date-check" }], failures, maximumEdits: 2 });
  assert.throws(() => auditHeldOutLeakage({ proposal, heldOutCases: [heldOut[0], { ...heldOut[1], evidenceDigest: heldOut[0].evidenceDigest }], heldOutSuiteDigest: digest("f") }), /duplicate held-out evidence digest/);
});
