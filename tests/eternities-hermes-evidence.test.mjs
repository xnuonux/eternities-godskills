import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const lines = async (path) => (await readFile(new URL(path, root), "utf8")).trim().split(/\r?\n/).map(JSON.parse);

test("Hermes carries exactly the six candidate clusters and exact digests", async () => {
  const [synthesis, clusters, evidence] = await Promise.all([
    json("syntheses/eternities-hermes.v1.json"), json("clusters/automation-mcp-integrations.v1.json"),
    lines("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  const candidates = clusters.clusters.filter((c) => c.synthesisDecision === "candidate");
  assert.equal(synthesis.status, "promoted");
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.deepEqual(synthesis.sourceIds, candidates.flatMap((c) => c.members.map((m) => m.sourceId)).sort());
  assert.deepEqual(synthesis.clusters, evidence.filter((c) => c.familyId === "automation-mcp-integrations" && c.synthesisDecision === "candidate").map((c) => ({ id: c.id, digest: c.clusterDigest })));
  for (const artifact of Object.values(synthesis.artifacts)) assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, root), "utf8")));
});
