import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const skillPath = new URL("../skills/eternities-beacon/SKILL.md", import.meta.url);

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

test("Beacon is a compact agent-neutral marketing and growth entrypoint", async () => {
  const markdown = (await readFile(skillPath, "utf8")).replace(/\r\n/g, "\n");
  const meta = frontmatter(markdown);
  assert.equal(meta.name, "eternities-beacon");
  assert.match(meta.description, /marketing|growth/i);
  assert.match(meta.description, /do not use/i);
  for (const route of [
    "market truth and positioning",
    "offer and commercial architecture",
    "discoverability and search systems",
    "go-to-market and demand systems",
    "conversion and lifecycle systems",
    "growth measurement and stewardship",
  ]) assert.match(markdown, new RegExp(route, "i"));
  assert.match(markdown, /do not invoke Beacon recursively/i);
  assert.match(markdown, /current.*evidence/i);
  assert.match(markdown, /consent|privacy/i);
  assert.match(markdown, /correlation.*causation|causation.*correlation/i);
  assert.match(markdown, /human.*commercial|commercial.*human/i);
  assert.ok(Math.ceil(Buffer.byteLength(markdown, "utf8") / 4) <= 4000);
});

test("Beacon exposes six routes and only exact candidate-cluster evidence", async () => {
  const [contract, clusters] = await Promise.all([
    json("skills/eternities-beacon/references/capability-contract.json"),
    jsonLines("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.id, "godskill-eternities-beacon-v1");
  assert.equal(contract.category, "marketing-growth");
  assert.equal(contract.explicitOnly, false);
  assert.deepEqual(contract.effects, ["read", "write"]);
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "market-truth-and-positioning",
    "offer-and-commercial-architecture",
    "discoverability-and-search-systems",
    "go-to-market-and-demand-systems",
    "conversion-and-lifecycle-systems",
    "growth-measurement-and-stewardship",
  ]);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);

  const candidates = clusters.filter((cluster) =>
    cluster.clusterSetId === "marketing-growth-clusters-v1" &&
    cluster.synthesisDecision === "candidate",
  );
  const exactSources = candidates.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  assert.deepEqual(contract.sourceIds, exactSources);
  assert.deepEqual(contract.sourceEvidence.clusters, candidates.map(({ id, clusterDigest }) => ({
    id, digest: clusterDigest,
  })));
  assert.equal(contract.sourceIds.length, 143);

  const excluded = clusters
    .filter((cluster) => cluster.clusterSetId === "marketing-growth-clusters-v1" && cluster.synthesisDecision !== "candidate")
    .flatMap(({ members }) => members.map(({ sourceId }) => sourceId));
  for (const sourceId of excluded) assert.equal(contract.sourceIds.includes(sourceId), false);
});

test("Beacon mining receipt preserves all family evidence and proof boundaries", async () => {
  const [receipt, batch, mapping] = await Promise.all([
    readFile(new URL("skills/eternities-beacon/references/mining-receipt.md", root), "utf8"),
    json("clusters/marketing-growth.v1.json"),
    json("data/marketing-growth-cluster-map.v1.json"),
  ]);
  for (const cluster of batch.clusters) assert.match(receipt, new RegExp(cluster.id));
  for (const { sourceId } of batch.clusters.flatMap(({ members }) => members)) {
    assert.match(receipt, new RegExp(sourceId));
  }
  for (const { sourceIds } of mapping.priorCanonicalCoverage) {
    for (const sourceId of sourceIds) assert.match(receipt, new RegExp(sourceId));
  }
  assert.match(receipt, /no source prose was copied/i);
  assert.match(receipt, /no third-party code or instruction was executed/i);
  assert.match(receipt, /291.*queue|queue.*291/i);
  assert.match(receipt, /143 selected/i);
  assert.match(receipt, /38 prior/i);
});
