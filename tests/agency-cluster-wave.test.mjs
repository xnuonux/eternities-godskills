import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";
import { validateClusterBatch } from "../src/refinery-clusters.mjs";

const repositoryRoot = new URL("../", import.meta.url);

async function json(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, repositoryRoot), "utf8"));
}

async function jsonLines(relativePath) {
  return (await readFile(new URL(relativePath, repositoryRoot), "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("the reviewed agency family has exact, complete, non-promotional cluster evidence", async () => {
  const batch = await json("clusters/agency-client-services.v1.json");
  const reviews = (await jsonLines("artifacts/corpus/review-evidence.jsonl"))
    .filter(({ familyId }) => familyId === "agency-client-services");
  const clusters = validateClusterBatch(batch, reviews);
  const reviewedIds = reviews.map(({ sourceId }) => sourceId).sort();
  const clusteredIds = clusters.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();

  assert.equal(reviews.length, 12);
  assert.equal(clusters.length, 7);
  assert.deepEqual(clusteredIds, reviewedIds);
  assert.deepEqual(
    Object.fromEntries(
      ["candidate", "deferred", "rejected"].map((decision) => [
        decision,
        clusters.filter(({ synthesisDecision }) => synthesisDecision === decision).length,
      ]),
    ),
    { candidate: 3, deferred: 4, rejected: 0 },
  );
  assert.equal(clusters.some(({ synthesisDecision }) => synthesisDecision === "promoted"), false);

  const duplicate = clusters.find(({ relationship }) => relationship === "exact-duplicate");
  assert.deepEqual(duplicate.members.map(({ role }) => role).sort(), ["canonical", "duplicate"]);
});

test("the agency cluster receipt reconciles exact inputs and preserves later-state boundaries", async () => {
  const receipt = await json("receipts/agency-client-services-clusters-v1.json");
  const checkpointRoot = "artifacts/checkpoints/agency-client-services-clusters-v1/";
  const clusterBatchText = await readFile(
    new URL(`${checkpointRoot}cluster-batch.json`, repositoryRoot),
    "utf8",
  );
  const clusterEvidenceText = await readFile(
    new URL(`${checkpointRoot}cluster-evidence.jsonl`, repositoryRoot),
    "utf8",
  );
  const coverageText = await readFile(
    new URL(`${checkpointRoot}coverage-ledger.jsonl`, repositoryRoot),
    "utf8",
  );
  const laterCoverageText = await readFile(
    new URL("artifacts/checkpoints/game-design-development-clusters-v1/coverage-ledger.jsonl", repositoryRoot),
    "utf8",
  );
  const checkpointCoverage = coverageText.split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const laterCoverage = laterCoverageText.split(/\r?\n/).filter(Boolean).map(JSON.parse);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "agency-client-services-clusters-v1");
  assert.equal(receipt.status, "clustered");
  assert.equal(receipt.checkpointRoot, "artifacts/checkpoints/agency-client-services-clusters-v1");
  assert.equal(receipt.immutableGitBase, "777270e2f515441d45a1d58f85e7ef39381fe9f6");
  assert.deepEqual(receipt.counts, {
    candidateClusters: 3,
    clusteredSources: 12,
    clusters: 7,
    deferredClusters: 4,
    promotedSources: 0,
    reviewedSources: 12,
  });
  assert.deepEqual(receipt.artifacts, {
    clusterBatchSha256: sha256(clusterBatchText),
    clusterEvidenceSha256: sha256(clusterEvidenceText),
    coverageLedgerSha256: sha256(coverageText),
  });
  const stageCount = (stage) => checkpointCoverage.filter(({ evidence }) => evidence[stage]).length;
  const laterStageCount = (stage) => laterCoverage.filter(({ evidence }) => evidence[stage]).length;
  assert.equal(stageCount("clustered"), 12);
  assert.equal(stageCount("synthesized"), 0);
  assert.equal(laterStageCount("synthesized"), 7);
  assert.equal(laterStageCount("evaluated"), 7);
  assert.equal(laterStageCount("promoted"), 7);
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});
