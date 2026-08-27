import test from "node:test";
import assert from "node:assert/strict";

import { deriveClusterSourceEvidence } from "../src/provenance-evidence.mjs";

const clusterDigest = "c".repeat(64);
const reviewDigestA = "d".repeat(64);
const reviewDigestB = "e".repeat(64);

function contract(overrides = {}) {
  return {
    sourceIds: ["source-a", "source-b"],
    sourceEvidence: {
      mode: "cluster-review-v1",
      clusterSetId: "agency-client-services-clusters-v1",
      clusters: [{ id: "cluster-a", digest: clusterDigest }],
    },
    ...overrides,
  };
}

function cluster(overrides = {}) {
  return {
    schemaVersion: 1,
    clusterSetId: "agency-client-services-clusters-v1",
    familyId: "agency-client-services",
    id: "cluster-a",
    intent: "reconcile authorized account evidence",
    relationship: "canonical-with-variants",
    synthesisDecision: "candidate",
    rationale: "the reviewed members define one bounded capability",
    members: [
      { sourceId: "source-a", reviewDigest: reviewDigestA, role: "canonical" },
      { sourceId: "source-b", reviewDigest: reviewDigestB, role: "variant" },
    ],
    clusterDigest,
    ...overrides,
  };
}

function reviews() {
  return [
    {
      sourceId: "source-a",
      reviewDigest: reviewDigestA,
      copiedSourceProse: false,
      promotionClaim: false,
    },
    {
      sourceId: "source-b",
      reviewDigest: reviewDigestB,
      copiedSourceProse: false,
      promotionClaim: false,
    },
  ];
}

test("cluster-review evidence reconciles exact candidate membership", () => {
  assert.deepEqual(
    deriveClusterSourceEvidence(contract(), [cluster()], reviews()),
    {
      sourceCoverage: 2,
      sourceIds: ["source-a", "source-b"],
      proseCopied: false,
      sourceEvidenceMode: "cluster-review-v1",
      clusterIds: ["cluster-a"],
    },
  );
});

test("cluster-review evidence rejects stale, unknown, or deferred clusters", () => {
  assert.throws(
    () => deriveClusterSourceEvidence(contract(), [cluster({ clusterDigest: "f".repeat(64) })], reviews()),
    /stale cluster digest/,
  );
  assert.throws(
    () => deriveClusterSourceEvidence(contract(), [], reviews()),
    /missing cluster evidence: cluster-a/,
  );
  assert.throws(
    () => deriveClusterSourceEvidence(contract(), [cluster({ synthesisDecision: "deferred" })], reviews()),
    /cluster is not a synthesis candidate: cluster-a/,
  );
  assert.throws(
    () => deriveClusterSourceEvidence(
      contract({ sourceIds: ["source-a", "source-b", "source-c"] }),
      [cluster()],
      reviews(),
    ),
    /cluster source union does not match contract.sourceIds/,
  );
});

test("cluster-review evidence rejects missing, stale, copied, and promotional reviews", () => {
  assert.throws(
    () => deriveClusterSourceEvidence(contract(), [cluster()], reviews().slice(0, 1)),
    /missing review evidence: source-b/,
  );
  assert.throws(
    () => deriveClusterSourceEvidence(
      contract(),
      [cluster()],
      reviews().map((row) => row.sourceId === "source-b"
        ? { ...row, reviewDigest: "a".repeat(64) }
        : row),
    ),
    /stale review digest for source-b/,
  );
  assert.throws(
    () => deriveClusterSourceEvidence(
      contract(),
      [cluster()],
      reviews().map((row) => row.sourceId === "source-b"
        ? { ...row, copiedSourceProse: true }
        : row),
    ),
    /review contains copied source prose: source-b/,
  );
  assert.throws(
    () => deriveClusterSourceEvidence(
      contract(),
      [cluster()],
      reviews().map((row) => row.sourceId === "source-b"
        ? { ...row, promotionClaim: true }
        : row),
    ),
    /review contains a promotion claim: source-b/,
  );
});

test("cluster-review evidence rejects duplicate source membership", () => {
  const secondCluster = cluster({
    id: "cluster-b",
    clusterDigest: "b".repeat(64),
    members: [{ sourceId: "source-a", reviewDigest: reviewDigestA, role: "canonical" }],
  });
  const duplicateContract = contract({
    sourceEvidence: {
      mode: "cluster-review-v1",
      clusterSetId: "agency-client-services-clusters-v1",
      clusters: [
        { id: "cluster-a", digest: clusterDigest },
        { id: "cluster-b", digest: "b".repeat(64) },
      ],
    },
  });
  assert.throws(
    () => deriveClusterSourceEvidence(duplicateContract, [cluster(), secondCluster], reviews()),
    /duplicate source across selected clusters: source-a/,
  );
});
