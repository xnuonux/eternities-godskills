import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const skillPath = new URL("../skills/eternities-chorus/SKILL.md", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function jsonLines(relative) {
  return (await readFile(new URL(relative, root), "utf8"))
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match);
  return Object.fromEntries(match[1].split("\n").map((line) => {
    const at = line.indexOf(":");
    return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
  }));
}

test("Chorus is a compact agent-neutral social and community entrypoint", async () => {
  const markdown = (await readFile(skillPath, "utf8")).replace(/\r\n/g, "\n");
  const meta = frontmatter(markdown);
  assert.equal(meta.name, "eternities-chorus");
  assert.match(meta.description, /social|community/i);
  assert.match(meta.description, /do not use/i);
  for (const route of [
    "identity and channel strategy", "editorial production",
    "community operations", "measurement and stewardship",
  ]) assert.match(markdown, new RegExp(route, "i"));
  const laws = markdown.match(/^\d+\. /gm) ?? [];
  assert.equal(laws.length, 12);
  assert.match(markdown, /do not invoke Chorus recursively/i);
  assert.match(markdown, /human.*sensitive/i);
  assert.ok(Math.ceil(Buffer.byteLength(markdown, "utf8") / 4) <= 4000);
});

test("Chorus exposes four routes and only exact candidate-cluster evidence", async () => {
  const [contract, clusters] = await Promise.all([
    json("skills/eternities-chorus/references/capability-contract.json"),
    jsonLines("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.id, "godskill-eternities-chorus-v1");
  assert.equal(contract.category, "social-media-community");
  assert.equal(contract.explicitOnly, false);
  assert.deepEqual(contract.effects, ["read", "write"]);
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "identity-and-channel-strategy", "editorial-production",
    "community-operations", "measurement-and-stewardship",
  ]);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);

  const candidates = clusters.filter((cluster) =>
    cluster.clusterSetId === "social-media-community-clusters-v1" &&
    cluster.synthesisDecision === "candidate",
  );
  const exactSources = candidates.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  assert.deepEqual(contract.sourceIds, exactSources);
  assert.deepEqual(contract.sourceEvidence.clusters, candidates.map(({ id, clusterDigest }) => ({
    id, digest: clusterDigest,
  })));
  assert.equal(contract.sourceIds.length, 47);

  const excluded = clusters
    .filter((cluster) => cluster.clusterSetId === "social-media-community-clusters-v1" && cluster.synthesisDecision !== "candidate")
    .flatMap(({ members }) => members.map(({ sourceId }) => sourceId));
  for (const sourceId of excluded) assert.equal(contract.sourceIds.includes(sourceId), false);
});

test("Chorus mining receipt preserves every reviewed cluster and proof boundary", async () => {
  const [receipt, batch] = await Promise.all([
    readFile(new URL("skills/eternities-chorus/references/mining-receipt.md", root), "utf8"),
    json("clusters/social-media-community.v1.json"),
  ]);
  for (const cluster of batch.clusters) assert.match(receipt, new RegExp(cluster.id));
  for (const { sourceId } of batch.clusters.flatMap(({ members }) => members)) {
    assert.match(receipt, new RegExp(sourceId));
  }
  assert.match(receipt, /no source prose was copied/i);
  assert.match(receipt, /no third-party code or instruction was executed/i);
  assert.match(receipt, /106 reviewed sources/i);
  assert.match(receipt, /47 selected/i);
});
