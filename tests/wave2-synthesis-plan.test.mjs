import assert from "node:assert/strict";
import test from "node:test";

import { certifyWave2SynthesisPlan } from "../src/wave2-synthesis-plan.mjs";

const CLUSTER = "a".repeat(64);
const OVERLAP = "b".repeat(64);
const REVIEW_A = "c".repeat(64);
const REVIEW_B = "d".repeat(64);
const COMPARISON = "e".repeat(64);

function cluster(overrides = {}) {
  return {
    familyId: "implementation-engineering",
    id: "bounded-proof",
    clusterDigest: CLUSTER,
    synthesisDecision: "candidate",
    members: [
      { facetId: "facet-a", reviewDigest: REVIEW_A, role: "canonical" },
      { facetId: "facet-b", reviewDigest: REVIEW_B, role: "variant" },
    ],
    ...overrides,
  };
}

function overlap(overrides = {}) {
  return {
    familyId: "implementation-engineering",
    clusterId: "bounded-proof",
    clusterDigest: CLUSTER,
    overlapDigest: OVERLAP,
    targetSkillId: "eternities-daedalus",
    disposition: "extend-existing",
    intendedTier: "godskill-extension",
    comparedAgainst: [{ kind: "godskill", id: "eternities-daedalus", digest: COMPARISON }],
    ...overrides,
  };
}

function entry(overrides = {}) {
  return {
    familyId: "implementation-engineering",
    clusterId: "bounded-proof",
    clusterDigest: CLUSTER,
    overlapDigest: OVERLAP,
    reviewDigests: [REVIEW_A, REVIEW_B],
    comparisonDigests: [COMPARISON],
    action: "extend-existing",
    intendedTier: "godskill-extension",
    ownerSkillId: "eternities-daedalus",
    mechanismIds: ["bounded-change-ledger"],
    rationale: "extend the existing owner with one independently specified verification ledger",
    ...overrides,
  };
}

function plan(entries = [entry()]) {
  return {
    schemaVersion: 1,
    planId: "wave2-synthesis-plan-v1",
    entries,
  };
}

test("every candidate receives one exact evidence-bound terminal action", () => {
  const result = certifyWave2SynthesisPlan({
    clusters: [cluster()],
    overlaps: [overlap()],
    plan: plan(),
  });

  assert.equal(result.coverage.candidateClusterCount, 1);
  assert.equal(result.coverage.terminalActionCount, 1);
  assert.equal(result.coverage.unresolvedCandidateCount, 0);
  assert.match(result.planDigest, /^[a-f0-9]{64}$/);
});

test("missing, duplicate, and noncandidate plan entries fail closed", () => {
  const inputs = { clusters: [cluster()], overlaps: [overlap()] };
  assert.throws(() => certifyWave2SynthesisPlan({ ...inputs, plan: plan([]) }), /missing synthesis action/);
  assert.throws(() => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry(), entry()]) }), /duplicate synthesis action/);
  assert.throws(
    () => certifyWave2SynthesisPlan({
      clusters: [cluster({ synthesisDecision: "deferred" })],
      overlaps: [],
      plan: plan(),
    }),
    /noncandidate cluster/,
  );
});

test("stale cluster, overlap, review, and comparison evidence is rejected", () => {
  const inputs = { clusters: [cluster()], overlaps: [overlap()] };
  assert.throws(
    () => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry({ clusterDigest: "f".repeat(64) })]) }),
    /stale synthesis cluster digest/,
  );
  assert.throws(
    () => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry({ overlapDigest: "f".repeat(64) })]) }),
    /stale synthesis overlap digest/,
  );
  assert.throws(
    () => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry({ reviewDigests: [REVIEW_A] })]) }),
    /review evidence mismatch/,
  );
  assert.throws(
    () => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry({ comparisonDigests: [] })]) }),
    /comparison evidence mismatch/,
  );
});

test("action and tier must match the adjudicated overlap disposition", () => {
  const inputs = { clusters: [cluster()], overlaps: [overlap()] };
  assert.throws(
    () => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry({ action: "synthesize-godskill" })]) }),
    /action does not match overlap disposition/,
  );
  assert.throws(
    () => certifyWave2SynthesisPlan({ ...inputs, plan: plan([entry({ intendedTier: "godskill" })]) }),
    /intended tier mismatch/,
  );
});

test("one mechanism cannot be assigned to multiple capability owners", () => {
  const secondCluster = cluster({
    id: "resilient-api",
    clusterDigest: "1".repeat(64),
    members: [{ facetId: "facet-c", reviewDigest: "2".repeat(64), role: "canonical" }],
  });
  const secondOverlap = overlap({
    clusterId: "resilient-api",
    clusterDigest: secondCluster.clusterDigest,
    overlapDigest: "3".repeat(64),
    targetSkillId: "eternities-hermes",
    comparedAgainst: [{ kind: "godskill", id: "eternities-hermes", digest: "4".repeat(64) }],
  });
  const secondEntry = entry({
    clusterId: "resilient-api",
    clusterDigest: secondCluster.clusterDigest,
    overlapDigest: secondOverlap.overlapDigest,
    reviewDigests: ["2".repeat(64)],
    comparisonDigests: ["4".repeat(64)],
    ownerSkillId: "eternities-hermes",
  });

  assert.throws(
    () => certifyWave2SynthesisPlan({
      clusters: [cluster(), secondCluster],
      overlaps: [overlap(), secondOverlap],
      plan: plan([entry(), secondEntry]),
    }),
    /duplicate mechanism ownership/,
  );
});
