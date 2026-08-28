import test from "node:test";
import assert from "node:assert/strict";
import { sign } from "node:crypto";

import {
  auditHeldOutLeakage,
  attestationMessage,
  configureEvolutionTrust,
  createDevelopmentManifest,
  createEvaluationReceipt,
  evidenceSubjectDigest,
  mineRecurringFailures,
  reviewSubjectDigest,
  sealHeldOutManifest,
} from "../src/skill-evolution.mjs";

const REVIEW_PUBLIC = `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEALf9Rc+C4Pfrj//AcDhzWZGyhSBJ1zds/9/KjEy2JGo4=\n-----END PUBLIC KEY-----\n`;
const REVIEW_PRIVATE = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEILn7IuIyd1I7LADFGPq6s+ID3q8G07LVzPr0fr/GpD72\n-----END PRIVATE KEY-----\n`;
const EVALUATOR_PUBLIC = `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA7aLQEjHeKlIgB/MfUANYUKRW69DD1kRu4HJKnQXiFpQ=\n-----END PUBLIC KEY-----\n`;
const EVALUATOR_PRIVATE = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDe+1ltFT1fAVS34ToG6Ti+VMOaAONscykgAtV4cGmrh\n-----END PRIVATE KEY-----\n`;
const authority = configureEvolutionTrust({ reviewPublicKeys: { "fixture-review": REVIEW_PUBLIC }, evaluatorPublicKeys: { "fixture-evaluator": EVALUATOR_PUBLIC } });
function attest(purpose, subjectDigest, keyId, privateKey) {
  const unsigned = { algorithm: "ed25519", purpose, subjectDigest, keyId };
  return { ...unsigned, signature: sign(null, attestationMessage(unsigned), privateKey).toString("base64") };
}

const digest = (character) => character.repeat(64);
const traces = [
  { id: "d-1", partition: "development", reviewed: true, evidenceDigest: digest("1"), targetSkillId: "oracle", failureCodes: ["missing-source-boundary"], critical: true },
  { id: "d-2", partition: "development", reviewed: true, evidenceDigest: digest("2"), targetSkillId: "oracle", failureCodes: ["missing-source-boundary", "weak-date-check"], critical: false },
  { id: "d-3", partition: "development", reviewed: true, evidenceDigest: digest("3"), targetSkillId: "oracle", failureCodes: ["weak-date-check"], critical: false },
];
const reviewLedgerDigest = digest("9");
const developmentManifest = createDevelopmentManifest(traces, { reviewAuthority: "review-board", reviewLedgerDigest });
const miningReceipt = mineRecurringFailures(developmentManifest, { minimumOccurrences: 2 });
const reviewAttestation = attest("reviewed-development", reviewSubjectDigest(developmentManifest), "fixture-review", REVIEW_PRIVATE);
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
  return authority.stageProposal({
    targetSkillId: "oracle",
    baselineText: "# Oracle\n\n## Evaluation\nold\n",
    candidateText: "# Oracle\n\n## Evaluation\nnew\n",
    edits: [{ operation: "append-case", sectionId: "evaluation", rationaleCode: "weak-date-check" }],
    miningReceipt,
    developmentManifest,
    reviewAttestation,
    maximumEdits: 2,
    ...overrides,
  });
}

function evidence({ baseline = evaluation({ score: 0.75, passed: 3 }), candidate = evaluation(), staged = proposal(), held = heldOutManifest } = {}) {
  const leakageAudit = auditHeldOutLeakage({ proposal: staged, heldOutManifest: held });
  const baselineReceipt = createEvaluationReceipt({ role: "baseline", proposal: staged, heldOutManifest: held, artifactDigest: staged.baselineDigest, evaluation: baseline, evaluatorId: "deterministic-evaluator" });
  const candidateReceipt = createEvaluationReceipt({ role: "candidate", proposal: staged, heldOutManifest: held, artifactDigest: staged.candidateDigest, evaluation: candidate, evaluatorId: "deterministic-evaluator" });
  return {
    leakageAuditPackage: { record: leakageAudit, attestation: attest("heldout-audit", evidenceSubjectDigest(leakageAudit), "fixture-evaluator", EVALUATOR_PRIVATE) },
    baselinePackage: { record: baselineReceipt, attestation: attest("baseline-evaluation", baselineReceipt.receiptDigest, "fixture-evaluator", EVALUATOR_PRIVATE) },
    candidatePackage: { record: candidateReceipt, attestation: attest("candidate-evaluation", candidateReceipt.receiptDigest, "fixture-evaluator", EVALUATOR_PRIVATE) },
  };
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
  assert.throws(() => proposal({ reviewAttestation: { ...reviewAttestation, signature: Buffer.alloc(64).toString("base64") } }), /signature is invalid/);
});

test("fabricated or tampered mining evidence cannot stage", () => {
  const fabricated = structuredClone(miningReceipt);
  fabricated.clusters[0].failureCode = "fabricated-failure";
  assert.throws(() => proposal({ miningReceipt: fabricated, edits: [{ operation: "append-case", sectionId: "evaluation", rationaleCode: "fabricated-failure" }] }), /digest does not match/);
  const tamperedManifest = structuredClone(developmentManifest);
  tamperedManifest.records[0].failureCodes.push("fabricated-failure");
  assert.throws(() => proposal({ developmentManifest: tamperedManifest }), /digest does not match/);
});

test("a coherent self-signed reviewed manifest is rejected by the host trust root", () => {
  const forgedManifest = createDevelopmentManifest(traces.map((trace) => ({ ...trace, evidenceDigest: digest("8") })), { reviewAuthority: "attacker", reviewLedgerDigest: digest("8") });
  const forgedReceipt = mineRecurringFailures(forgedManifest);
  const forgedAttestation = attest("reviewed-development", reviewSubjectDigest(forgedManifest), "attacker-key", REVIEW_PRIVATE);
  assert.throws(() => proposal({ developmentManifest: forgedManifest, miningReceipt: forgedReceipt, reviewAttestation: forgedAttestation }), /key is not trusted/);
});

test("candidate bytes must reconcile exactly to declared changed sections", () => {
  assert.throws(() => proposal({ candidateText: "# Oracle\n\n## Evaluation\nnew\n\n## Hidden\nunrelated\n" }), /section diff does not match/);
});

test("held-out manifest derives its own digest and rejects duplicate evidence", () => {
  const reversed = sealHeldOutManifest([...heldOutManifest.records].reverse(), { suiteId: "oracle-holdout" });
  assert.equal(reversed.manifestDigest, heldOutManifest.manifestDigest);
  assert.throws(() => sealHeldOutManifest([{ id: "h-1", partition: "held-out", evidenceDigest: digest("a") }, { id: "h-2", partition: "held-out", evidenceDigest: digest("a") }], { suiteId: "oracle-holdout" }), /duplicate held-out evidence digest/);
});

test("evaluation receipts bind proposal, exact artifacts, and sealed suite", () => {
  const staged = proposal();
  const { baselinePackage, candidatePackage } = evidence({ staged });
  const baselineReceipt = baselinePackage.record;
  const candidateReceipt = candidatePackage.record;
  assert.equal(baselineReceipt.artifactDigest, staged.baselineDigest);
  assert.equal(candidateReceipt.artifactDigest, staged.candidateDigest);
  assert.equal(candidateReceipt.heldOutManifestDigest, heldOutManifest.manifestDigest);
  assert.throws(() => createEvaluationReceipt({ role: "candidate", proposal: staged, heldOutManifest, artifactDigest: digest("e"), evaluation: evaluation(), evaluatorId: "deterministic-evaluator" }), /artifact digest/);
});

test("measured held-out gain can become eligible but never adopted", () => {
  const staged = proposal();
  const receipts = evidence({ staged });
  const decision = authority.decideAdoption({ proposal: staged, ...receipts, policy });
  assert.equal(decision.status, "eligible");
  assert.equal(decision.adopted, false);
  assert.equal(decision.requiresExplicitAdoption, true);
});

test("self-declared improvements cannot forge measured gain", () => {
  const staged = proposal();
  const equal = evaluation({ improvements: ["score"] });
  const receipts = evidence({ staged, baseline: equal, candidate: equal });
  const decision = authority.decideAdoption({ proposal: staged, ...receipts, policy });
  assert.equal(decision.status, "unverified");
  assert.deepEqual(decision.improvements, []);
});

test("swapped proposal audit and evaluation receipts fail closed", () => {
  const staged = proposal();
  const other = proposal({ candidateText: "# Oracle\n\n## Evaluation\nother\n" });
  const wrong = evidence({ staged: other });
  const decision = authority.decideAdoption({ proposal: staged, ...wrong, policy });
  assert.equal(decision.status, "blocked");
  assert.ok(decision.failedGates.includes("leakage-audit-binding"));
  assert.ok(decision.failedGates.includes("baseline-receipt-binding"));
  assert.ok(decision.failedGates.includes("candidate-receipt-binding"));
});

test("suite drift, critical regression, and unresolved effects fail closed", () => {
  const staged = proposal();
  const alternateHeld = sealHeldOutManifest([{ id: "h-3", partition: "held-out", evidenceDigest: digest("e") }], { suiteId: "other-holdout" });
  const mixed = evidence({ staged });
  mixed.candidatePackage = evidence({ staged, held: alternateHeld }).candidatePackage;
  assert.equal(authority.decideAdoption({ proposal: staged, ...mixed, policy }).status, "blocked");
  const critical = evidence({ staged, candidate: evaluation({ criticalPassed: 1 }) });
  assert.equal(authority.decideAdoption({ proposal: staged, ...critical, policy }).status, "blocked");
  const unresolved = evidence({ staged, candidate: evaluation({ unresolvedEffects: ["network"] }) });
  assert.equal(authority.decideAdoption({ proposal: staged, ...unresolved, policy }).status, "blocked");
});

test("a forged clear leakage audit without evaluator attestation fails closed", () => {
  const staged = proposal({ baselineText: "# Oracle\n\n## H-1\nold\n", candidateText: "# Oracle\n\n## H-1\nnew\n", edits: [{ operation: "replace-section", sectionId: "h-1", rationaleCode: "weak-date-check" }] });
  const realAudit = auditHeldOutLeakage({ proposal: staged, heldOutManifest });
  assert.equal(realAudit.status, "leaked");
  const receipts = evidence({ staged });
  receipts.leakageAuditPackage = { record: { ...realAudit, status: "clear", leaks: [] }, attestation: receipts.leakageAuditPackage.attestation };
  const decision = authority.decideAdoption({ proposal: staged, ...receipts, policy });
  assert.equal(decision.status, "blocked");
  assert.ok(decision.failedGates.includes("held-out-audit-attestation"));
});

test("receipt-bound ordering is ordinal for unicode identifiers", () => {
  const unicodeTraces = [
    { id: "z-trace", partition: "development", reviewed: true, evidenceDigest: digest("4"), targetSkillId: "oracle", failureCodes: ["z-failure"], critical: false },
    { id: "a-trace", partition: "development", reviewed: true, evidenceDigest: digest("5"), targetSkillId: "oracle", failureCodes: ["a-failure"], critical: false },
  ];
  const manifest = createDevelopmentManifest(unicodeTraces, { reviewAuthority: "review-board", reviewLedgerDigest });
  assert.deepEqual(manifest.records.map(({ id }) => id), ["a-trace", "z-trace"]);
});
