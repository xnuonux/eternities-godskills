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

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

test("every exact social and community source has one bounded semantic review", async () => {
  const [queue, bodies, files] = await Promise.all([
    json("artifacts/corpus/families/social-media-community/queue.json"),
    jsonLines("artifacts/corpus/body-evidence.jsonl"),
    readdir(new URL("../reviews/waves/social-media-community/", import.meta.url)),
  ]);
  const sources = queue.cards.map((card) => ({
    id: card.sourceId,
    description: card.description,
    families: card.families,
  }));
  const batches = [];
  const reviews = [];
  for (const file of files.filter((name) => name.endsWith(".json")).sort()) {
    const batch = await json(`reviews/waves/social-media-community/${file}`);
    batches.push(batch);
    reviews.push(...validateReviewBatch(batch, sources, bodies));
  }
  const queueIds = queue.cards.map(({ sourceId }) => sourceId).sort();

  assert.equal(reviews.length, 106);
  assert.equal(new Set(reviews.map(({ sourceId }) => sourceId)).size, 106);
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

  const firstWaveIds = batches[0].reviews.map(({ sourceId }) => sourceId).sort();
  const remaining = queueIds.filter((sourceId) => !firstWaveIds.includes(sourceId));
  const expectedChunks = chunks(remaining, 25);
  assert.equal(batches.length, expectedChunks.length + 1);
  for (let index = 0; index < expectedChunks.length; index += 1) {
    assert.equal(batches[index + 1].waveId, `social-media-community-wave-00${index + 2}`);
    assert.deepEqual(
      batches[index + 1].reviews.map(({ sourceId }) => sourceId),
      expectedChunks[index],
    );
  }
});
