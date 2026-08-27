import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateClusterBatch } from "../src/refinery-clusters.mjs";
import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function jsonLines(relative) {
  return (await readFile(new URL(relative, root), "utf8"))
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

test("the complete game family has exact non-promotional cluster evidence", async () => {
  const [batch, allReviews] = await Promise.all([
    json("clusters/game-design-development.v1.json"),
    jsonLines("artifacts/corpus/review-evidence.jsonl"),
  ]);
  const reviews = allReviews.filter(({ familyId }) => familyId === "game-design-development");
  const clusters = validateClusterBatch(batch, reviews);
  const clustered = clusters.flatMap(({ members }) => members.map(({ sourceId }) => sourceId));
  const counts = Object.fromEntries(["candidate", "deferred", "rejected"].map((decision) => [
    decision,
    clusters.filter(({ synthesisDecision }) => synthesisDecision === decision).length,
  ]));
  const sourceCounts = Object.fromEntries(["candidate", "deferred", "rejected"].map((decision) => [
    decision,
    clusters.filter(({ synthesisDecision }) => synthesisDecision === decision)
      .flatMap(({ members }) => members).length,
  ]));

  assert.equal(reviews.length, 25);
  assert.equal(clusters.length, 8);
  assert.equal(new Set(clustered).size, 25);
  assert.deepEqual(clustered.sort(), reviews.map(({ sourceId }) => sourceId).sort());
  assert.deepEqual(counts, { candidate: 4, deferred: 3, rejected: 1 });
  assert.deepEqual(sourceCounts, { candidate: 20, deferred: 4, rejected: 1 });
  assert.equal(clusters.some(({ synthesisDecision }) => synthesisDecision === "promoted"), false);
  assert.ok(clusters.every(({ clusterDigest }) => /^[0-9a-f]{64}$/.test(clusterDigest)));
});

test("the game cluster receipt freezes exact clustered evidence", async () => {
  const receipt = await json("receipts/game-design-development-clusters-v1.json");
  const checkpoint = "artifacts/checkpoints/game-design-development-clusters-v1/";
  const [batchText, clusterText, coverageText] = await Promise.all([
    readFile(new URL(`${checkpoint}cluster-batch.json`, root), "utf8"),
    readFile(new URL(`${checkpoint}cluster-evidence.jsonl`, root), "utf8"),
    readFile(new URL(`${checkpoint}coverage-ledger.jsonl`, root), "utf8"),
  ]);

  assert.equal(receipt.status, "clustered");
  assert.equal(receipt.checkpointRoot, checkpoint.slice(0, -1));
  assert.deepEqual(receipt.counts, {
    candidateClusters: 4,
    clusteredSources: 25,
    clusters: 8,
    deferredClusters: 3,
    rejectedClusters: 1,
    promotedSources: 0,
    reviewedSources: 25,
  });
  assert.deepEqual(receipt.artifacts, {
    clusterBatchSha256: sha256(batchText),
    clusterEvidenceSha256: sha256(clusterText),
    coverageLedgerSha256: sha256(coverageText),
  });
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
  assert.equal(receipt.gates.sourceInstructionsExecuted, false);
  assert.equal(receipt.gates.promotionClaimed, false);
});
