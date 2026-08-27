import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { canonicalText } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveClusterSourceEvidence } from "../src/provenance-evidence.mjs";
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

test("Chorus evaluation covers every route and required social boundary", async () => {
  const [suite, contract, clusters, reviews, policy, markdown] = await Promise.all([
    json("skills/eternities-chorus/evals/cases.json"),
    json("skills/eternities-chorus/references/capability-contract.json"),
    jsonLines("artifacts/corpus/cluster-evidence.jsonl"),
    jsonLines("artifacts/corpus/review-evidence.jsonl"),
    json("policies/promotion.v1.json"),
    readFile(skillPath, "utf8"),
  ]);
  const sourceEvidence = deriveClusterSourceEvidence(contract, clusters, reviews);
  const baseline = {
    ...evaluateSuite(suite.cases, suite.baseline.results),
    tokenCount: suite.baseline.tokenCount,
  };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(canonicalText(markdown), "utf8") / 4),
    improvements: sourceEvidence.sourceCoverage > suite.baseline.sourceCoverage ? ["sourceCoverage"] : [],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  assert.ok(suite.cases.length >= 40);
  assert.ok(suite.cases.every(({ critical }) => critical === true));
  const kinds = Object.groupBy(suite.cases, ({ kind }) => kind);
  assert.ok(kinds.direct.length >= 12);
  assert.ok(kinds.paraphrase.length >= 12);
  assert.ok(kinds.exclusion.length >= 3);
  assert.ok(kinds.conflict.length >= 13);
  const outcomes = new Set(suite.cases.map(({ expected }) => expected));
  for (const expected of [
    "route:identity-and-channel-strategy", "route:editorial-production",
    "route:community-operations", "route:measurement-and-stewardship", "skip",
    "defer:eternities-oracle", "defer:eternities-aegis", "defer:eternities-muse",
    "refuse:paid-acquisition-boundary", "refuse:platform-scraping-boundary",
    "refuse:public-action-boundary", "refuse:identity-fabrication-boundary",
    "refuse:participant-dignity-boundary", "refuse:human-sensitive-decision-boundary",
  ]) assert.ok(outcomes.has(expected), `missing outcome: ${expected}`);
  assert.equal(sourceEvidence.sourceCoverage, 47);
  assert.equal(sourceEvidence.proseCopied, false);
  assert.equal(candidate.criticalPassed, suite.cases.length);
  assert.deepEqual(candidate.unresolvedEffects, []);
  assert.equal(decision.status, "promoted");
});
