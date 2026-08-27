import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { sha256 } from "../src/io.mjs";

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
    cardsSha256: "artifacts/routing/cards.jsonl",
    familyMapSha256: "artifacts/routing/family-map.json",
    manifestSha256: "artifacts/routing/manifest.json",
  })) {
    assert.equal(router.artifacts[key], sha256(await readFile(path.join(root, relativePath))), key);
  }
  assert.equal(router.counts.maximumComposition, 3);
  assert.ok(router.counts.cardCount <= 32);
  assert.deepEqual(Object.values(receipt.prohibitedExternalActions), [false, false, false, false, false, false, false, false]);
  assert.equal(receipt.proofLimits.liveAgentBehavior, "not-proven");
  assert.equal(receipt.proofLimits.productionBehavior, "not-proven");
});
