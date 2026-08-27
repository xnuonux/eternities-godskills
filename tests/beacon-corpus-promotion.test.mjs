import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
async function json(relative) { return JSON.parse(await readFile(new URL(relative, root), "utf8")); }
async function lines(relative) { return (await readFile(new URL(relative, root), "utf8")).trim().split(/\r?\n/).map(JSON.parse); }

test("Beacon synthesis reconciles exact promoted artifacts and candidate clusters", async () => {
  const [synthesis, clusters, clusterEvidence] = await Promise.all([
    json("syntheses/eternities-beacon.v1.json"),
    json("clusters/marketing-growth.v1.json"),
    lines("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  const candidates = clusters.clusters.filter(({ synthesisDecision }) => synthesisDecision === "candidate");
  const evidence = clusterEvidence.filter(({ familyId, synthesisDecision }) =>
    familyId === "marketing-growth" && synthesisDecision === "candidate");
  const expectedSources = candidates.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  assert.equal(synthesis.status, "promoted");
  assert.equal(synthesis.synthesisMethod, "independent-cluster-synthesis-v1");
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.deepEqual(synthesis.sourceIds, expectedSources);
  assert.deepEqual(synthesis.clusters, evidence.map(({ id, clusterDigest }) => ({ id, digest: clusterDigest })));
  assert.equal(synthesis.sourceIds.length, 143);
  assert.equal(synthesis.clusters.length, 6);
  for (const artifact of Object.values(synthesis.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, root), "utf8")));
  }
});

test("Beacon advances exactly its selected sources without overlapping earlier candidates", async () => {
  const [summary, candidates, clusters] = await Promise.all([
    json("artifacts/corpus/coverage-summary.json"),
    lines("artifacts/corpus/candidate-evidence.jsonl"),
    json("clusters/marketing-growth.v1.json"),
  ]);
  const selectedIds = clusters.clusters
    .filter(({ synthesisDecision }) => synthesisDecision === "candidate")
    .flatMap(({ members }) => members.map(({ sourceId }) => sourceId));
  const beacon = candidates.filter(({ candidateId }) => candidateId === "eternities-beacon");
  const priorIds = candidates
    .filter(({ candidateId }) => candidateId !== "eternities-beacon")
    .flatMap(({ sourceIds }) => sourceIds);
  assert.equal(selectedIds.length, 143);
  assert.equal(new Set(selectedIds).size, 143);
  assert.equal(selectedIds.some((sourceId) => priorIds.includes(sourceId)), false);
  assert.equal(beacon.length, 1);
  assert.equal(beacon[0].sourceIds.length, 143);
  assert.equal(beacon[0].clusterIds.length, 6);
  assert.equal(beacon[0].evaluated, true);
  assert.equal(beacon[0].promoted, true);
  assert.equal(summary.evidenceCounts.cardReviewed, 396);
  assert.equal(summary.evidenceCounts.clustered, 396);
  assert.equal(summary.evidenceCounts.synthesized, 217);
  assert.equal(summary.evidenceCounts.evaluated, 217);
  assert.equal(summary.evidenceCounts.promoted, 217);
});
