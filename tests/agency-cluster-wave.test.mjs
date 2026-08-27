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
  const summary = await json("artifacts/corpus/coverage-summary.json");
  const clusterBatchText = await readFile(
    new URL("clusters/agency-client-services.v1.json", repositoryRoot),
    "utf8",
  );
  const clusterEvidenceText = await readFile(
    new URL("artifacts/corpus/cluster-evidence.jsonl", repositoryRoot),
    "utf8",
  );
  const coverageText = await readFile(
    new URL("artifacts/corpus/coverage-ledger.jsonl", repositoryRoot),
    "utf8",
  );

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "agency-client-services-clusters-v1");
  assert.equal(receipt.status, "clustered");
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
  assert.equal(receipt.artifacts.clusterEvidenceSha256, summary.artifactDigests.clusterEvidenceSha256);
  assert.equal(receipt.artifacts.coverageLedgerSha256, summary.artifactDigests.coverageLedgerSha256);
  assert.equal(summary.evidenceCounts.clustered, 12);
  assert.equal(summary.evidenceCounts.synthesized, 0);
  assert.equal(summary.evidenceCounts.evaluated, 0);
  assert.equal(summary.evidenceCounts.promoted, 0);
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});
