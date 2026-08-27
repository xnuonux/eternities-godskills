import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadReviewEvidence } from "../src/reviews.mjs";

function jsonLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim() !== "").map(JSON.parse);
}

const familyId = process.argv[2];
if (!familyId || !/^[a-z0-9-]+$/.test(familyId)) {
  throw new Error("usage: node scripts/validate-family-reviews.mjs <owner-family>");
}

const root = path.resolve(".");
const queue = JSON.parse(await readFile(path.join(root, "artifacts/corpus/owners", familyId, "queue.json"), "utf8"));
assert.equal(queue.familyId, familyId);
const bodies = jsonLines(await readFile(path.join(root, "artifacts/corpus/body-evidence.jsonl"), "utf8"));
const sourceRecords = queue.cards.map((card) => ({ ...card, id: card.sourceId }));
const rows = await loadReviewEvidence(path.join(root, "reviews/waves", familyId), sourceRecords, bodies);
assert.equal(rows.length, queue.sourceCount, `${familyId} review count drift`);
assert.deepEqual(
  rows.map(({ sourceId }) => sourceId).sort(),
  queue.cards.map(({ sourceId }) => sourceId).sort(),
  `${familyId} review membership drift`,
);
assert.ok(rows.every((row) => row.familyId === familyId), `${familyId} owner-family drift`);
console.log(JSON.stringify({ familyId, sourceCount: rows.length, status: "reviewed" }, null, 2));
