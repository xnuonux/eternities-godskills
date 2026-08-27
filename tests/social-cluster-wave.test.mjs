import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateReviewBatch } from "../src/reviews.mjs";
import { validateClusterBatch } from "../src/refinery-clusters.mjs";
import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const routes = new Set([
  "identity-and-channel-strategy",
  "editorial-production",
  "community-operations",
  "measurement-and-stewardship",
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

async function socialReviews() {
  const [queue, bodies] = await Promise.all([
    json("artifacts/corpus/families/social-media-community/queue.json"),
    jsonLines("artifacts/corpus/body-evidence.jsonl"),
  ]);
  const sources = queue.cards.map((card) => ({ id: card.sourceId, families: card.families }));
  const reviews = [];
  for (let wave = 1; wave <= 6; wave += 1) {
    const batch = await json(`reviews/waves/social-media-community/wave-00${wave}.json`);
    reviews.push(...validateReviewBatch(batch, sources, bodies));
  }
  return reviews.sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

test("the complete social family reconciles exactly once into bounded clusters", async () => {
  const reviews = await socialReviews();
  const batch = await json("clusters/social-media-community.v1.json");
  const first = validateClusterBatch(batch, reviews);
  const second = validateClusterBatch(batch, reviews);
  const clusteredIds = first.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  const reviewedIds = reviews.map(({ sourceId }) => sourceId).sort();

  assert.equal(reviews.length, 106);
  assert.deepEqual(clusteredIds, reviewedIds);
  assert.deepEqual(second, first);
  assert.ok(first.every(({ synthesisDecision }) =>
    ["candidate", "deferred", "rejected"].includes(synthesisDecision),
  ));
  assert.equal(first.some(({ synthesisDecision }) => synthesisDecision === "promoted"), false);
  assert.ok(batch.clusters.every((cluster) =>
    cluster.synthesisDecision !== "candidate" || routes.has(cluster.candidateRoute),
  ));

  const reviewsById = new Map(reviews.map((review) => [review.sourceId, review]));
  for (const cluster of batch.clusters) {
    const kinds = new Set(cluster.members.map(({ sourceId }) => {
      const disposition = reviewsById.get(sourceId).disposition;
      return ["independent-implementation", "pattern-reference"].includes(disposition)
        ? "candidate"
        : disposition;
    }));
    assert.equal(kinds.size, 1, `${cluster.id} mixes candidate and boundary dispositions`);
  }
});

test("the social cluster receipt freezes exact decisions and deterministic artifacts", async () => {
  const receipt = await json("receipts/social-media-community-clusters-v1.json");
  const checkpoint = "artifacts/checkpoints/social-media-community-clusters-v1/";
  const [batchText, clusterText, coverageText] = await Promise.all([
    readFile(new URL(`${checkpoint}cluster-batch.json`, root), "utf8"),
    readFile(new URL(`${checkpoint}cluster-evidence.jsonl`, root), "utf8"),
    readFile(new URL(`${checkpoint}coverage-ledger.jsonl`, root), "utf8"),
  ]);
  assert.equal(receipt.checkpointRoot, checkpoint.slice(0, -1));
  assert.deepEqual(receipt.counts, {
    candidateClusters: 4,
    candidateSources: 47,
    clusteredSources: 106,
    clusters: 13,
    deferredClusters: 5,
    deferredSources: 46,
    rejectedClusters: 4,
    rejectedSources: 13,
    promotedSources: 0,
    reviewedSources: 106,
  });
  assert.equal(
    receipt.counts.candidateSources + receipt.counts.deferredSources + receipt.counts.rejectedSources,
    106,
  );
  assert.deepEqual(receipt.artifacts, {
    clusterBatchSha256: sha256(batchText),
    clusterEvidenceSha256: sha256(clusterText),
    coverageLedgerSha256: sha256(coverageText),
  });
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});
