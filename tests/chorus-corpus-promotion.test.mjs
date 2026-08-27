import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
async function json(relative) { return JSON.parse(await readFile(new URL(relative, root), "utf8")); }
async function lines(relative) { return (await readFile(new URL(relative, root), "utf8")).trim().split(/\r?\n/).map(JSON.parse); }

test("Chorus synthesis reconciles exact promoted artifacts and candidate clusters", async () => {
  const [synthesis, clusters, clusterEvidence] = await Promise.all([
    json("syntheses/eternities-chorus.v1.json"),
    json("clusters/social-media-community.v1.json"),
    lines("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  const candidates = clusters.clusters.filter(({ synthesisDecision }) => synthesisDecision === "candidate");
  const evidence = clusterEvidence.filter(({ familyId, synthesisDecision }) =>
    familyId === "social-media-community" && synthesisDecision === "candidate");
  const expectedSources = candidates.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  assert.equal(synthesis.status, "promoted");
  assert.equal(synthesis.synthesisMethod, "independent-cluster-synthesis-v1");
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.deepEqual(synthesis.sourceIds, expectedSources);
  assert.deepEqual(synthesis.clusters, evidence.map(({ id, clusterDigest }) => ({ id, digest: clusterDigest })));
  assert.equal(synthesis.sourceIds.length, 47);
  assert.equal(synthesis.clusters.length, 4);
  for (const artifact of Object.values(synthesis.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, root), "utf8")));
  }
});

test("Chorus advances exactly its forty-seven selected sources through promoted corpus evidence", async () => {
  const [summary, candidates, clusters] = await Promise.all([
    json("artifacts/corpus/coverage-summary.json"),
    lines("artifacts/corpus/candidate-evidence.jsonl"),
    json("clusters/social-media-community.v1.json"),
  ]);
  const selected = clusters.clusters
    .filter(({ synthesisDecision }) => synthesisDecision === "candidate")
    .flatMap(({ members }) => members).length;
  const chorus = candidates.filter(({ candidateId }) => candidateId === "eternities-chorus");
  assert.equal(selected, 47);
  assert.equal(chorus.length, 1);
  assert.equal(chorus[0].sourceIds.length, selected);
  assert.equal(chorus[0].clusterIds.length, 4);
  assert.equal(chorus[0].evaluated, true);
  assert.equal(chorus[0].promoted, true);
  assert.equal(summary.evidenceCounts.cardReviewed, 396);
  assert.equal(summary.evidenceCounts.clustered, 396);
  assert.equal(summary.evidenceCounts.synthesized, 217);
  assert.equal(summary.evidenceCounts.evaluated, 217);
  assert.equal(summary.evidenceCounts.promoted, 217);
});
