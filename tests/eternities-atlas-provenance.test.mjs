import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const jsonl = async (path) => (await readFile(new URL(path, root), "utf8")).trim().split(/\r?\n/).map(JSON.parse);

test("Atlas records the six candidate cluster digests and excludes non-candidates", async () => {
  const [contract, clusterSet, evidence] = await Promise.all([
    json("skills/eternities-atlas/references/capability-contract.json"),
    json("clusters/data-infrastructure.v1.json"),
    jsonl("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  const candidates = clusterSet.clusters.filter((c) => c.synthesisDecision === "candidate");
  const evidenceCandidates = evidence.filter((c) => c.clusterSetId === "data-infrastructure-clusters-v1" && c.synthesisDecision === "candidate");
  assert.deepEqual(contract.sourceEvidence.clusters, evidenceCandidates.map(({ id, clusterDigest }) => ({ id, digest: clusterDigest })));
  const selected = candidates.flatMap((c) => c.members.map((m) => m.sourceId)).sort();
  assert.deepEqual([...contract.sourceIds].sort(), selected);
  const excluded = clusterSet.clusters.filter((c) => c.synthesisDecision !== "candidate").flatMap((c) => c.members.map((m) => m.sourceId));
  assert.ok(excluded.every((id) => !contract.sourceIds.includes(id)));
});
