import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(".");

function jsonLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim() !== "").map(JSON.parse);
}

async function rows(relativePath) {
  return jsonLines(await readFile(path.join(root, relativePath), "utf8"));
}

test("every certified source has one exact owner-aligned semantic review", async () => {
  const [owners, reviews, bodies] = await Promise.all([
    rows("artifacts/corpus/ownership.jsonl"),
    rows("artifacts/corpus/review-evidence.jsonl"),
    rows("artifacts/corpus/body-evidence.jsonl"),
  ]);
  assert.equal(owners.length, 4741);
  assert.equal(reviews.length, owners.length);
  assert.equal(new Set(reviews.map(({ sourceId }) => sourceId)).size, reviews.length);
  const ownerById = new Map(owners.map((row) => [row.sourceId, row]));
  const bodyById = new Map(bodies.map((row) => [row.sourceId, row]));
  for (const review of reviews) {
    const owner = ownerById.get(review.sourceId);
    const body = bodyById.get(review.sourceId);
    assert.ok(owner, `review lacks owner: ${review.sourceId}`);
    assert.equal(review.familyId, owner.ownerFamily, `owner family drift: ${review.sourceId}`);
    assert.equal(review.bodySha256, body.bodySha256, `body digest drift: ${review.sourceId}`);
    assert.ok(review.neutralIntentExamples.length >= 2, `insufficient commandless intents: ${review.sourceId}`);
    assert.ok(review.neutralIntentExamples.every((value) => !value.trim().startsWith("/")));
    for (const field of ["inputs", "operations", "outputs", "effects", "failureBehavior", "exclusions", "usefulInvariants", "materialRisks"]) {
      assert.ok(Array.isArray(review[field]) && review[field].length > 0, `${field} missing: ${review.sourceId}`);
    }
    assert.equal(review.copiedSourceProse, false);
    assert.equal(review.promotionClaim, false);
    assert.match(review.reviewDigest, /^[a-f0-9]{64}$/);
  }
  assert.deepEqual(
    reviews.map(({ sourceId }) => sourceId).sort(),
    owners.map(({ sourceId }) => sourceId).sort(),
  );
});

test("review coverage contains no missing or unreadable source body", async () => {
  const [summary, coverage] = await Promise.all([
    readFile(path.join(root, "artifacts/corpus/coverage-summary.json"), "utf8").then(JSON.parse),
    rows("artifacts/corpus/coverage-ledger.jsonl"),
  ]);
  assert.equal(summary.bodyStatusCounts.missing, 0);
  assert.equal(summary.bodyStatusCounts.unreadable, 0);
  assert.equal(summary.evidenceCounts.cardReviewed, 4741);
  assert.ok(coverage.every(({ evidence }) => evidence.cardReviewed === true));
});
