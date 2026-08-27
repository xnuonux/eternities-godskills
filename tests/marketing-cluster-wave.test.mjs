import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { classify } from "../src/ontology.mjs";
import { loadReviewEvidence } from "../src/reviews.mjs";
import { loadClusterEvidence, validateClusterBatch } from "../src/refinery-clusters.mjs";
import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const candidateRoutes = new Set([
  "market-truth-and-positioning",
  "offer-and-commercial-architecture",
  "discoverability-and-search-systems",
  "go-to-market-and-demand-systems",
  "conversion-and-lifecycle-systems",
  "growth-measurement-and-stewardship",
]);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function jsonLines(relative) {
  return (await readFile(new URL(relative, root), "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);
}

async function canonicalReviewState() {
  const [queue, bodies, records, ontology] = await Promise.all([
    json("artifacts/corpus/families/marketing-growth/queue.json"),
    jsonLines("artifacts/corpus/body-evidence.jsonl"),
    jsonLines("artifacts/release-one/source-records.jsonl"),
    json("data/ontology.v1.json"),
  ]);
  const queueIds = queue.cards.map(({ sourceId }) => sourceId).sort();
  const reviews = await loadReviewEvidence(
    fileURLToPath(new URL("reviews/waves/", root)),
    records.map((record) => ({ ...record, families: classify(record, ontology) })),
    bodies,
  );
  return { queueIds, reviews };
}

test("the complete marketing family reconciles exactly once into bounded clusters", async () => {
  const { queueIds, reviews } = await canonicalReviewState();
  const queueIdSet = new Set(queueIds);
  const familyReviews = reviews.filter(({ familyId, sourceId }) =>
    familyId === "marketing-growth" && queueIdSet.has(sourceId),
  );
  const batch = await json("clusters/marketing-growth.v1.json");
  const first = validateClusterBatch(batch, familyReviews);
  const second = validateClusterBatch(batch, familyReviews);
  const clusteredIds = first.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  const reviewedIds = familyReviews.map(({ sourceId }) => sourceId).sort();
  const allClusters = await loadClusterEvidence(
    fileURLToPath(new URL("clusters/", root)),
    reviews,
  );
  const globallyClusteredQueueIds = allClusters
    .flatMap(({ members }) => members.map(({ sourceId }) => sourceId))
    .filter((sourceId) => queueIdSet.has(sourceId))
    .sort();

  assert.equal(familyReviews.length, 253);
  assert.deepEqual(clusteredIds, reviewedIds);
  assert.deepEqual(globallyClusteredQueueIds, queueIds);
  assert.deepEqual(second, first);
  assert.ok(first.every(({ synthesisDecision }) =>
    ["candidate", "deferred", "rejected"].includes(synthesisDecision),
  ));
  assert.equal(first.some(({ synthesisDecision }) => synthesisDecision === "promoted"), false);
  assert.ok(batch.clusters.every((cluster) =>
    cluster.synthesisDecision !== "candidate" || candidateRoutes.has(cluster.candidateRoute),
  ));

  const reviewsById = new Map(familyReviews.map((review) => [review.sourceId, review]));
  for (const cluster of batch.clusters) {
    const kinds = new Set(cluster.members.map(({ sourceId }) => {
      const disposition = reviewsById.get(sourceId).disposition;
      return ["independent-implementation", "pattern-reference"].includes(disposition)
        ? "candidate"
        : disposition;
    }));
    assert.equal(kinds.size, 1, `${cluster.id} mixes candidate and boundary dispositions`);
    assert.ok(cluster.intent.length >= 40, `${cluster.id} needs a substantive intent`);
    assert.ok(cluster.rationale.length >= 60, `${cluster.id} needs an evidence rationale`);
  }
});

test("the marketing cluster receipt freezes exact decisions and deterministic artifacts", async () => {
  const receipt = await json("receipts/marketing-growth-clusters-v1.json");
  const checkpoint = "artifacts/checkpoints/marketing-growth-clusters-v1/";
  const [batchText, clusterText, coverageText] = await Promise.all([
    readFile(new URL(`${checkpoint}cluster-batch.json`, root), "utf8"),
    readFile(new URL(`${checkpoint}cluster-evidence.jsonl`, root), "utf8"),
    readFile(new URL(`${checkpoint}coverage-ledger.jsonl`, root), "utf8"),
  ]);
  assert.equal(receipt.checkpointRoot, checkpoint.slice(0, -1));
  assert.equal(receipt.counts.familyQueueSources, 291);
  assert.equal(receipt.counts.priorCanonicalClusterSources, 38);
  assert.equal(receipt.counts.reviewedSources, 253);
  assert.equal(receipt.counts.clusteredSources, 253);
  assert.equal(
    receipt.counts.candidateSources + receipt.counts.deferredSources + receipt.counts.rejectedSources,
    253,
  );
  assert.equal(
    receipt.counts.candidateClusters + receipt.counts.deferredClusters + receipt.counts.rejectedClusters,
    receipt.counts.clusters,
  );
  assert.deepEqual(receipt.artifacts, {
    clusterBatchSha256: sha256(batchText),
    clusterEvidenceSha256: sha256(clusterText),
    coverageLedgerSha256: sha256(coverageText),
  });
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
  assert.equal(receipt.gates.sourceInstructionsExecuted, false);
  assert.equal(receipt.gates.synthesisClaimed, false);
  assert.equal(receipt.gates.promotionClaimed, false);
});
