import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assessCoordinationLease,
  validateDelegationEnvelope,
  validateDiagnosticState,
  validateStaticRuleEvidence,
  assessPriorArt,
  assessExperimentClaim,
  resolveRunState,
  validateWritingPacket,
  validateGoalProofLedger,
  validateReleaseManifest,
} from "../src/lunari-first-party-contracts.mjs";
import { sha256 } from "../src/io.mjs";
import { validateReviewedSelection } from "../scripts/build-lunari-first-party-infusion-receipt.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("forge leases only the contested key and rejects stale integration state", () => {
  const leases = [{ key: "package-lock", owner: "alpha", expiresAt: 200 }];
  assert.equal(assessCoordinationLease({ leases, key: "package-lock", owner: "beta", now: 100 }).accepted, false);
  assert.equal(assessCoordinationLease({ leases, key: "src/isolated", owner: "beta", now: 100 }).accepted, true);
  assert.equal(assessCoordinationLease({ leases, key: "package-lock", owner: "beta", now: 201 }).accepted, true);
  assert.equal(assessCoordinationLease({ leases: [], key: "x", owner: "beta", now: 100, integrationStateAgeMs: 6_000, maxStateAgeMs: 5_000 }).accepted, false);
});

test("forge delegation envelopes fail closed before dispatch", () => {
  const valid = {
    version: 1,
    parentTraceId: "trace-1",
    objective: "inspect bounded evidence",
    inputArtifacts: ["receipt.json"],
    outputSchema: "review.v1",
    allowedEffects: ["read-local"],
    budget: { maxFiles: 5 },
    boundaries: ["no writes"],
    termination: "return one review",
  };
  assert.equal(validateDelegationEnvelope(valid, { allowedEffects: ["read-local"] }).valid, true);
  assert.equal(validateDelegationEnvelope({ ...valid, version: 2 }, { allowedEffects: ["read-local"] }).valid, false);
  assert.equal(validateDelegationEnvelope({ ...valid, allowedEffects: ["deploy"] }, { allowedEffects: ["read-local"] }).valid, false);
});

test("phoenix preserves eliminated hypotheses and exactly one next check", () => {
  const packet = {
    verifiedFoundations: ["failure reproduced"],
    eliminated: [{ hypothesisId: "h1", evidenceRef: "log:12" }],
    current: { hypothesisId: "h2", check: "inspect boundary" },
  };
  assert.equal(validateDiagnosticState(packet).valid, true);
  assert.equal(validateDiagnosticState({ ...packet, current: { hypothesisId: "h1", check: "retry" } }).valid, false);
  assert.equal(validateDiagnosticState({ ...packet, current: [{ hypothesisId: "h2" }, { hypothesisId: "h3" }] }).valid, false);
});

test("aegis static rules require positive negative scope integrity and isolation proof", () => {
  const proof = { positiveDetected: true, cleanControlFlagged: false, outOfScopeRejected: true, tamperDetected: true, outputIsolated: true };
  assert.equal(validateStaticRuleEvidence(proof).valid, true);
  assert.equal(validateStaticRuleEvidence({ ...proof, cleanControlFlagged: true }).valid, false);
  assert.equal(validateStaticRuleEvidence({ ...proof, tamperDetected: false }).valid, false);
});

test("oracle prior-art conclusions cannot overclaim a bounded search", () => {
  assert.equal(assessPriorArt({ overlapFound: false, retrievalAttempts: 2, retrievalFloor: 3, finalCorpusReviewed: true }).disposition, "inconclusive");
  assert.equal(assessPriorArt({ overlapFound: false, retrievalAttempts: 3, retrievalFloor: 3, finalCorpusReviewed: true }).disposition, "not-yet-refuted");
  assert.equal(assessPriorArt({ overlapFound: true, retrievalAttempts: 1, retrievalFloor: 3, finalCorpusReviewed: false }).disposition, "inconclusive");
  assert.equal(assessPriorArt({ overlapFound: true, evidenceRecord: "paper-7", locator: "claim-2" }).disposition, "refuted");
});

test("athena requires independently observed criterion validity", () => {
  assert.equal(assessExperimentClaim({ selfReport: true }).disposition, "inconclusive");
  assert.equal(assessExperimentClaim({ independentMeasure: true, intervention: true, control: true, errorAccounting: true }).disposition, "calibrated");
  assert.equal(assessExperimentClaim({ independentMeasure: true, intervention: true, control: false, errorAccounting: true }).disposition, "inconclusive");
});

test("architect runtime truth overrides self-report and pauses excessive tool velocity", () => {
  assert.equal(resolveRunState({ agentReportedComplete: true, verifierPassed: false, toolRate: 2, toolRateLimit: 5 }).state, "errored");
  assert.equal(resolveRunState({ agentReportedComplete: false, verifierPassed: false, toolRate: 6, toolRateLimit: 5 }).state, "paused");
  assert.equal(resolveRunState({ agentReportedComplete: true, verifierPassed: true, toolRate: 2, toolRateLimit: 5 }).state, "complete");
});

test("logos writing packets bind sources voice blueprint and ordered revision", () => {
  const packet = {
    sourceLedger: [{ sourceId: "s1", claim: "bounded claim" }],
    voiceConstraints: ["plain language"],
    blueprint: ["opening", "argument", "close"],
    revisionStages: ["structure", "support", "voice", "provenance"],
  };
  assert.equal(validateWritingPacket(packet).valid, true);
  assert.equal(validateWritingPacket({ ...packet, sourceLedger: [] }).valid, false);
  assert.equal(validateWritingPacket({ ...packet, revisionStages: ["voice", "structure"] }).valid, false);
});

test("daedalus completion claims require passing probes and declared coverage", () => {
  const ledger = [{ claimId: "c1", state: "complete", probe: { passed: true, evidenceRef: "test:1" }, coverage: { bounded: true, limit: "module" } }];
  assert.equal(validateGoalProofLedger(ledger).valid, true);
  assert.equal(validateGoalProofLedger([{ ...ledger[0], probe: { passed: false, evidenceRef: "test:1" } }]).valid, false);
  assert.equal(validateGoalProofLedger([{ ...ledger[0], coverage: { bounded: true } }]).valid, false);
  assert.equal(validateGoalProofLedger([{ claimId: "c2", state: "complete", probe: { passed: true, evidenceRef: "test:2" } }]).valid, false);
});

test("herald release manifests require verified rollback-safe dependency closure", () => {
  const manifest = {
    items: [
      { id: "core", version: "1", verificationRef: "test:core", rollbackRef: "tag:0", dependsOn: [] },
      { id: "ui", version: "1", verificationRef: "test:ui", rollbackRef: "tag:0", dependsOn: ["core"] },
    ],
  };
  assert.equal(validateReleaseManifest(manifest).valid, true);
  assert.equal(validateReleaseManifest({ items: [{ ...manifest.items[1], dependsOn: ["missing"] }] }).valid, false);
  assert.equal(validateReleaseManifest({ items: [{ ...manifest.items[0], rollbackRef: "" }] }).valid, false);
});

test("infusion receipt binds the deterministic quarry, exact selected sources, and current artifacts", async () => {
  const receipt = JSON.parse(await readFile(path.join(root, "receipts/lunari-first-party-infusion-v1.json"), "utf8"));
  const coverage = JSON.parse(await readFile(path.join(root, "artifacts/lunari-first-party-quarry/coverage.json"), "utf8"));
  const ledger = new Map((await readFile(path.join(root, "artifacts/lunari-first-party-quarry/coverage-ledger.jsonl"), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse).map((row) => [row.relativePath, row]));
  assert.equal(receipt.sourceIdentity, coverage.sourceIdentity);
  assert.equal(receipt.coverage.pathCount, 5438);
  assert.equal(receipt.coverage.unresolvedCount, 0);
  assert.equal(receipt.selectedSources.length, 18);
  for (const source of receipt.selectedSources) {
    assert.equal(source.sha256, ledger.get(source.path)?.sha256, source.path);
    assert.equal(ledger.get(source.path)?.contentInspected, true, source.path);
    assert.ok(["reviewed-promoted-source", "reviewed-supporting-source"].includes(source.reviewState), source.path);
    assert.equal(source.duplicateStatus, "unique", source.path);
    assert.ok(["portable", "project-specific-supporting-only"].includes(source.projectCouplingVerdict), source.path);
  }
  for (const artifact of receipt.artifacts) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
  assert.equal(receipt.copiedSourceProse, false);
  assert.equal(receipt.archivedCodeExecuted, false);
});

test("reviewed selection rejects unreviewed and duplicate-disposition drift", () => {
  const source = {
    path: "source.md",
    sha256: "a".repeat(64),
    discoveryOwner: "eternities-forge",
    owner: "eternities-forge",
    mechanism: "lease",
    disposition: "promote",
    reviewState: "unreviewed-first-party",
    duplicateStatus: "unique",
    projectCouplingVerdict: "portable",
    overlapAnalysis: "gap",
    rationale: "portable mechanism",
  };
  const input = {
    expected: [{ path: source.path, sha256: source.sha256, owner: source.owner }],
    selection: { schemaVersion: 1, sourceIdentity: "archive@test", selections: [source] },
    sourceIdentity: "archive@test",
    ledger: new Map([[source.path, { sha256: source.sha256, contentInspected: true }]]),
    ownerMap: { candidates: [{ relativePath: source.path, owner: source.discoveryOwner }] },
    duplicateGroups: { internal: [], corpusMatches: [], godskillMatches: [] },
    enhancedOwnerIds: new Set([source.owner]),
  };
  assert.throws(() => validateReviewedSelection(input), /unreviewed/);
  const reviewed = { ...source, reviewState: "reviewed-promoted-source" };
  assert.throws(() => validateReviewedSelection({
    ...input,
    selection: { ...input.selection, selections: [reviewed] },
    duplicateGroups: { internal: [{ sha256: source.sha256, paths: [source.path, "copy.md"] }], corpusMatches: [], godskillMatches: [] },
  }), /duplicate disposition drift/);
});
