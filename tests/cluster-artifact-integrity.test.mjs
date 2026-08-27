import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { validateClusterBatch } from "../src/refinery-clusters.mjs";
import { validateReviewBatch } from "../src/reviews.mjs";

const root = path.resolve(".");

test("every present owner-family cluster artifact binds exact normalized review digests", async () => {
  const ownerRoot = path.join(root, "artifacts/corpus/owners");
  const familyIds = (await readdir(ownerRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort();
  let checked = 0;
  for (const familyId of familyIds) {
    const clusterPath = path.join(root, "clusters", `${familyId}.v1.json`);
    try { await access(clusterPath); } catch { continue; }
    const queue = JSON.parse(await readFile(path.join(ownerRoot, familyId, "queue.json"), "utf8"));
    const sources = queue.cards.map((card) => ({ ...card, id: card.sourceId }));
    const bodies = queue.cards.map((card) => ({
      sourceId: card.sourceId,
      status: "inspected",
      present: true,
      bodySha256: card.bodySha256,
    }));
    const reviewRoot = path.join(root, "reviews/waves", familyId);
    const waveNames = (await readdir(reviewRoot)).filter((name) => name.endsWith(".json")).sort();
    const reviews = [];
    for (const waveName of waveNames) {
      const batch = JSON.parse(await readFile(path.join(reviewRoot, waveName), "utf8"));
      reviews.push(...validateReviewBatch(batch, sources, bodies));
    }
    const clusterBatch = JSON.parse(await readFile(clusterPath, "utf8"));
    const clusters = validateClusterBatch(clusterBatch, reviews);
    const members = clusters.flatMap(({ members: rows }) => rows);
    assert.equal(members.length, queue.sourceCount, `${familyId} cluster membership drift`);
    assert.equal(new Set(members.map(({ sourceId }) => sourceId)).size, queue.sourceCount, `${familyId} duplicate cluster membership`);
    checked += 1;
  }
  assert.ok(checked >= 19, `expected at least 19 present family cluster artifacts, found ${checked}`);
});
