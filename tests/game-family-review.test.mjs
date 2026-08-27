import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { validateReviewBatch } from "../src/reviews.mjs";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function jsonLines(relative) {
  const value = await readFile(new URL(relative, root), "utf8");
  return value.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

test("every exact game-design source has one bounded semantic review", async () => {
  const [queue, bodies, files] = await Promise.all([
    json("artifacts/corpus/families/game-design-development/queue.json"),
    jsonLines("artifacts/corpus/body-evidence.jsonl"),
    readdir(new URL("../reviews/waves/game-design-development/", import.meta.url)),
  ]);
  const sources = queue.cards.map((card) => ({
    id: card.sourceId,
    description: card.description,
    families: card.families,
  }));
  const reviews = [];
  for (const file of files.filter((name) => name.endsWith(".json")).sort()) {
    const batch = await json(`reviews/waves/game-design-development/${file}`);
    reviews.push(...validateReviewBatch(batch, sources, bodies));
  }
  const queueIds = queue.cards.map(({ sourceId }) => sourceId).sort();

  assert.equal(reviews.length, 25);
  assert.equal(new Set(reviews.map(({ sourceId }) => sourceId)).size, 25);
  assert.deepEqual(reviews.map(({ sourceId }) => sourceId).sort(), queueIds);
  assert.ok(reviews.every(({ sourceId, bodySha256 }) =>
    bodySha256 === queue.cards.find((card) => card.sourceId === sourceId)?.bodySha256,
  ));
  assert.ok(reviews.every(({ copiedSourceProse, promotionClaim }) =>
    copiedSourceProse === false && promotionClaim === false,
  ));
  assert.ok(reviews.every(({ neutralIntentExamples }) =>
    neutralIntentExamples.length >= 2 &&
    neutralIntentExamples.every((intent) => !intent.trim().startsWith("/")),
  ));
  assert.ok(reviews.every((review) => [
    "independent-implementation",
    "pattern-reference",
    "deferred",
    "rejected",
  ].includes(review.disposition)));
  for (const review of reviews) {
    for (const field of [
      "inputs",
      "operations",
      "outputs",
      "effects",
      "failureBehavior",
      "exclusions",
      "usefulInvariants",
      "materialRisks",
    ]) {
      assert.ok(review[field].length > 0, `${review.sourceId} requires ${field}`);
    }
  }
});
