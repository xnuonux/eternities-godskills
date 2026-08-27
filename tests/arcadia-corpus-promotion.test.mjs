import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
async function json(relative) { return JSON.parse(await readFile(new URL(relative, root), "utf8")); }
async function lines(relative) { return (await readFile(new URL(relative, root), "utf8")).trim().split(/\r?\n/).map(JSON.parse); }

test("Arcadia synthesis reconciles exact promoted artifacts and candidate clusters", async () => {
  const synthesis = await json("syntheses/eternities-arcadia.v1.json");
  assert.equal(synthesis.status, "promoted");
  assert.equal(synthesis.synthesisMethod, "independent-cluster-synthesis-v1");
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.equal(synthesis.sourceIds.length, 20);
  assert.equal(synthesis.clusters.length, 4);
  for (const artifact of Object.values(synthesis.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, root), "utf8")));
  }
});

test("Arcadia advances exactly twenty sources through promoted corpus evidence", async () => {
  const [summary, candidates] = await Promise.all([
    json("artifacts/corpus/coverage-summary.json"), lines("artifacts/corpus/candidate-evidence.jsonl"),
  ]);
  const arcadia = candidates.filter(({ candidateId }) => candidateId === "eternities-arcadia");
  assert.equal(arcadia.length, 1);
  assert.equal(arcadia[0].sourceIds.length, 20);
  assert.equal(arcadia[0].clusterIds.length, 4);
  assert.equal(arcadia[0].evaluated, true);
  assert.equal(arcadia[0].promoted, true);
  assert.equal(summary.evidenceCounts.clustered, 37);
  assert.equal(summary.evidenceCounts.synthesized, 27);
  assert.equal(summary.evidenceCounts.evaluated, 27);
  assert.equal(summary.evidenceCounts.promoted, 27);
});
