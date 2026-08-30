import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { canonicalText, sha256 } from "../src/io.mjs";
import { loadCandidateEvidence } from "../src/refinery-candidates.mjs";

const root = path.resolve(".");

async function historicalLocks() {
  const document = JSON.parse(await readFile(path.join(root, "data/historical-synthesis-locks.v1.json"), "utf8"));
  assert.equal(document.schemaVersion, 1);
  return new Map(document.records.map((record) => [record.path, record]));
}

test("every synthesis binds exact artifact bytes and contains no hash placeholders", async () => {
  const names = (await readdir(path.join(root, "syntheses"))).filter((name) => name.endsWith(".json")).sort();
  const locks = await historicalLocks();
  for (const name of names) {
    const synthesisBytes = await readFile(path.join(root, "syntheses", name));
    const synthesisText = synthesisBytes.toString("utf8");
    assert.doesNotMatch(synthesisText, /\$[A-Za-z][A-Za-z0-9]*Hash/, `${name} contains a hash placeholder`);
    const synthesis = JSON.parse(synthesisText);
    const lock = locks.get(`syntheses/${name}`);
    if (lock) {
      assert.equal(sha256(synthesisBytes), lock.sha256, `${name} changed after historical lock`);
      const receiptArtifact = synthesis.artifacts?.promotionReceipt;
      assert.ok(receiptArtifact, `${name} historical lock requires a promotion receipt`);
      const receiptText = await readFile(path.join(root, ...receiptArtifact.path.split("/")), "utf8");
      assert.equal(receiptArtifact.sha256, sha256(canonicalText(receiptText)), `${name} has stale historical promotion receipt`);
      continue;
    }
    for (const [key, artifact] of Object.entries(synthesis.artifacts ?? {})) {
      const text = await readFile(path.join(root, ...artifact.path.split("/")), "utf8");
      assert.equal(artifact.sha256, sha256(canonicalText(text)), `${name} has stale ${key} hash`);
    }
    const receiptArtifact = synthesis.artifacts?.promotionReceipt;
    if (receiptArtifact) {
      const receiptText = await readFile(path.join(root, ...receiptArtifact.path.split("/")), "utf8");
      assert.doesNotMatch(receiptText, /\$[A-Za-z][A-Za-z0-9]*Hash/, `${receiptArtifact.path} contains a hash placeholder`);
    }
  }
});

test("the complete synthesis directory loads through the strict candidate protocol", async () => {
  const parseJsonl = async (relativePath) => (await readFile(path.join(root, relativePath), "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const clusters = await parseJsonl("artifacts/corpus/cluster-evidence.jsonl");
  const reviews = await parseJsonl("artifacts/corpus/review-evidence.jsonl");
  const candidates = await loadCandidateEvidence(path.join(root, "syntheses"), root, clusters, reviews);
  const synthesisCount = (await readdir(path.join(root, "syntheses"))).filter((name) => name.endsWith(".json")).length;
  assert.equal(candidates.length, synthesisCount);
  assert.ok(candidates.every((candidate) => candidate.promoted && candidate.evaluated));
});
