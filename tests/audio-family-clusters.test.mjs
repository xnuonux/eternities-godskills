import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { validateClusterBatch } from "../src/refinery-clusters.mjs";
import { validateReviewBatch } from "../src/reviews.mjs";

const root = path.resolve(".");

test("audio clusters reconcile every exact normalized review digest", async () => {
  const familyId = "audio-voice-media";
  const queue = JSON.parse(await readFile(path.join(root, "artifacts/corpus/owners", familyId, "queue.json"), "utf8"));
  const sources = queue.cards.map((card) => ({ ...card, id: card.sourceId }));
  const bodies = (await readFile(path.join(root, "artifacts/corpus/body-evidence.jsonl"), "utf8"))
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const waveNames = (await readdir(path.join(root, "reviews/waves", familyId))).sort();
  const reviews = [];
  for (const waveName of waveNames) {
    const batch = JSON.parse(await readFile(path.join(root, "reviews/waves", familyId, waveName), "utf8"));
    reviews.push(...validateReviewBatch(batch, sources, bodies));
  }
  const clusterBatch = JSON.parse(await readFile(path.join(root, "clusters/audio-voice-media.v1.json"), "utf8"));
  const clusters = validateClusterBatch(clusterBatch, reviews);
  const members = clusters.flatMap(({ members: rows }) => rows);
  assert.equal(members.length, 58);
  assert.equal(new Set(members.map(({ sourceId }) => sourceId)).size, 58);
});
