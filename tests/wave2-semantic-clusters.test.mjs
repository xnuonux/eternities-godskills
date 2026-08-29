import assert from "node:assert/strict";
import test from "node:test";

import { certifyWave2SemanticClusters } from "../src/wave2-semantic-clusters.mjs";

const REVIEW_A = "a".repeat(64);
const REVIEW_B = "b".repeat(64);
const TARGET_DIGEST = "c".repeat(64);

function review(facetId, reviewDigest, familyId = "implementation-engineering") {
  return { facetId, reviewDigest, familyId };
}

function clusterSet(clusters) {
  return {
    schemaVersion: 1,
    clusterSetId: "wave2-implementation-engineering-clusters-v1",
    familyId: "implementation-engineering",
    clusters,
  };
}

function cluster(overrides = {}) {
  return {
    id: "bounded-implementation-proof",
    intent: "Implement a bounded local behavior and verify its observable result.",
    relationship: "ordered-composition",
    synthesisDecision: "candidate",
    rationale: "The members contribute compatible planning and proof stages with one authority boundary.",
    members: [
      { facetId: "facet-a", reviewDigest: REVIEW_A, role: "canonical" },
      { facetId: "facet-b", reviewDigest: REVIEW_B, role: "variant" },
    ],
    ...overrides,
  };
}

function overlap(overrides = {}) {
  return {
    schemaVersion: 1,
    familyId: "implementation-engineering",
    clusterId: "bounded-implementation-proof",
    targetSkillId: "eternities-daedalus",
    disposition: "extend-existing",
    comparedAgainst: [
      { kind: "godskill", id: "eternities-daedalus", digest: TARGET_DIGEST },
      { kind: "legacy-cluster", id: "implementation-goal-proof", digest: "d".repeat(64) },
    ],
    mechanismComparison: "The existing owner proves terminal behavior but lacks the candidate's pre-implementation constraint ledger.",
    rationale: "Extend the existing owner with the missing ledger rather than creating a parallel implementation authority.",
    intendedTier: "godskill-extension",
    ...overrides,
  };
}

test("complete clusters and overlap decisions bind every review exactly once", () => {
  const result = certifyWave2SemanticClusters({
    reviews: [review("facet-b", REVIEW_B), review("facet-a", REVIEW_A)],
    clusterSets: [clusterSet([cluster()])],
    overlapDecisions: [overlap()],
  });

  assert.equal(result.coverage.reviewCount, 2);
  assert.equal(result.coverage.clusteredReviewCount, 2);
  assert.equal(result.coverage.clusterCount, 1);
  assert.equal(result.coverage.candidateClusterCount, 1);
  assert.equal(result.coverage.overlapDecisionCount, 1);
  assert.equal(result.coverage.unresolvedReviewCount, 0);
  assert.match(result.clusters[0].clusterDigest, /^[a-f0-9]{64}$/);
  assert.match(result.overlaps[0].overlapDigest, /^[a-f0-9]{64}$/);
});

test("missing and duplicate review membership fail closed", () => {
  const reviews = [review("facet-a", REVIEW_A), review("facet-b", REVIEW_B)];
  assert.throws(
    () => certifyWave2SemanticClusters({
      reviews,
      clusterSets: [clusterSet([cluster({ members: [{ facetId: "facet-a", reviewDigest: REVIEW_A, role: "canonical" }] })])],
      overlapDecisions: [overlap()],
    }),
    /missing cluster membership: facet-b/,
  );
  assert.throws(
    () => certifyWave2SemanticClusters({
      reviews,
      clusterSets: [clusterSet([cluster(), cluster({ id: "duplicate-membership", synthesisDecision: "deferred" })])],
      overlapDecisions: [overlap()],
    }),
    /duplicate cluster membership: facet-a/,
  );
});

test("stale or unknown review evidence cannot enter a cluster", () => {
  assert.throws(
    () => certifyWave2SemanticClusters({
      reviews: [review("facet-a", REVIEW_A)],
      clusterSets: [clusterSet([cluster({ members: [{ facetId: "facet-a", reviewDigest: REVIEW_B, role: "canonical" }] })])],
      overlapDecisions: [overlap()],
    }),
    /stale cluster review digest/,
  );
  assert.throws(
    () => certifyWave2SemanticClusters({
      reviews: [review("facet-a", REVIEW_A)],
      clusterSets: [clusterSet([cluster({ members: [{ facetId: "facet-x", reviewDigest: REVIEW_A, role: "canonical" }] })])],
      overlapDecisions: [overlap()],
    }),
    /unknown clustered review: facet-x/,
  );
});

test("every candidate needs one exact overlap decision", () => {
  const input = {
    reviews: [review("facet-a", REVIEW_A), review("facet-b", REVIEW_B)],
    clusterSets: [clusterSet([cluster()])],
  };
  assert.throws(
    () => certifyWave2SemanticClusters({ ...input, overlapDecisions: [] }),
    /missing overlap decision: bounded-implementation-proof/,
  );
  assert.throws(
    () => certifyWave2SemanticClusters({ ...input, overlapDecisions: [overlap(), overlap()] }),
    /duplicate overlap decision: bounded-implementation-proof/,
  );
});

test("deferred clusters cannot receive promotion-shaped overlap decisions", () => {
  const deferred = cluster({ synthesisDecision: "deferred" });
  assert.throws(
    () => certifyWave2SemanticClusters({
      reviews: [review("facet-a", REVIEW_A), review("facet-b", REVIEW_B)],
      clusterSets: [clusterSet([deferred])],
      overlapDecisions: [overlap()],
    }),
    /overlap decision targets non-candidate cluster/,
  );
});

test("overlap decisions require exact comparison evidence and a supported disposition", () => {
  const input = {
    reviews: [review("facet-a", REVIEW_A), review("facet-b", REVIEW_B)],
    clusterSets: [clusterSet([cluster()])],
  };
  assert.throws(
    () => certifyWave2SemanticClusters({ ...input, overlapDecisions: [overlap({ comparedAgainst: [] })] }),
    /comparedAgainst must not be empty/,
  );
  assert.throws(
    () => certifyWave2SemanticClusters({ ...input, overlapDecisions: [overlap({ disposition: "promoted" })] }),
    /unsupported overlap disposition/,
  );
});
