import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { buildFamilyCompletion } from "../src/family-completion.mjs";
import { loadCandidateEvidence } from "../src/refinery-candidates.mjs";

const root = path.resolve(".");
const json = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

test("the full corpus completion receipt proves every terminal layer", async () => {
  const receipt = await json("receipts/eternities-godskills-completion.json");
  const coverage = await json("artifacts/corpus/coverage-summary.json");
  assert.equal(receipt.status, "certified");
  assert.equal(coverage.sourceCount, 4741);
  assert.equal(coverage.evidenceCounts.cardReviewed, 4741);
  assert.equal(coverage.evidenceCounts.clustered, 4741);
  assert.equal(receipt.counts.sources, 4741);
  assert.equal(receipt.counts.reviewed, 4741);
  assert.equal(receipt.counts.clustered, 4741);
  assert.equal(receipt.counts.promotedSources, coverage.evidenceCounts.promoted);
  assert.equal(receipt.counts.familyReceipts, 21);
  assert.equal(receipt.counts.unresolvedCandidateClusters, 0);

  const familyNames = (await readdir(path.join(root, "receipts/families")))
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.equal(familyNames.length, 21);
  for (const name of familyNames) {
    const family = await json(`receipts/families/${name}`);
    assert.ok(["certified", "deferred"].includes(family.status), name);
    assert.ok(family.clusters.candidate.every(({ decision }) => ["promoted", "second-order-deferred"].includes(decision)), name);
    assert.deepEqual(Object.values(family.gates), [false, false, false, false, false, false, false]);
  }

  const router = await json("receipts/agent-native-router-v6.json");
  assert.equal(router.status, "certified");
  for (const [key, relativePath] of Object.entries({
    cardsSha256: "artifacts/checkpoints/godskills-system-v1-routing/cards.jsonl",
    familyMapSha256: "artifacts/checkpoints/godskills-system-v1-routing/family-map.json",
    manifestSha256: "artifacts/checkpoints/godskills-system-v1-routing/manifest.json",
  })) {
    assert.equal(router.artifacts[key], sha256(await readFile(path.join(root, relativePath))), key);
  }
  assert.equal(router.counts.maximumComposition, 3);
  assert.ok(router.counts.cardCount <= 32);
  assert.equal(receipt.prohibitedExternalActions.pantheonEnablement, false);
  assert.ok(Object.values(receipt.prohibitedExternalActions).every((value) => value === false));
  assert.equal(receipt.proofLimits.liveAgentBehavior, "not-proven");
  assert.equal(receipt.proofLimits.productionBehavior, "not-proven");
});

test("completion independently reconciles the ownership review cluster candidate and family graph", async () => {
  const parseJsonl = async (relativePath) => (await readFile(path.join(root, relativePath), "utf8"))
    .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const [owners, reviews, clusters, recordedCandidates] = await Promise.all([
    parseJsonl("artifacts/corpus/ownership.jsonl"),
    parseJsonl("artifacts/corpus/review-evidence.jsonl"),
    parseJsonl("artifacts/corpus/cluster-evidence.jsonl"),
    parseJsonl("artifacts/corpus/candidate-evidence.jsonl"),
  ]);
  const synthesisNames = (await readdir(path.join(root, "syntheses"))).filter((name) => name.endsWith(".json")).sort();
  const syntheses = await Promise.all(synthesisNames.map((name) => json(`syntheses/${name}`)));
  const candidates = await loadCandidateEvidence(path.join(root, "syntheses"), root, clusters, reviews);
  assert.deepEqual(candidates, recordedCandidates);
  const ownerBySource = new Map(owners.map((owner) => [owner.sourceId, owner]));
  assert.equal(ownerBySource.size, 4741);
  assert.ok(reviews.every((review) => ownerBySource.get(review.sourceId)?.ownerFamily === review.familyId));

  const queues = [];
  for (const familyId of (await readdir(path.join(root, "artifacts/corpus/owners"))).sort()) {
    queues.push(await json(`artifacts/corpus/owners/${familyId}/queue.json`));
  }
  const rebuilt = buildFamilyCompletion({
    owners, queues, reviews, clusters, syntheses,
    secondOrderPlan: await json("data/second-order-promotion-plan.v1.json"),
  });
  const familyNames = (await readdir(path.join(root, "receipts/families"))).filter((name) => name.endsWith(".json")).sort();
  const families = await Promise.all(familyNames.map((name) => json(`receipts/families/${name}`)));
  assert.deepEqual(rebuilt.families, families);
});
