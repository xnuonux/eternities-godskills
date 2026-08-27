import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { loadCandidateEvidence } from "../src/refinery-candidates.mjs";

const root = path.resolve(".");

test("every synthesis binds exact artifact bytes and contains no hash placeholders", async () => {
  const names = (await readdir(path.join(root, "syntheses"))).filter((name) => name.endsWith(".json")).sort();
  for (const name of names) {
    const synthesisText = await readFile(path.join(root, "syntheses", name), "utf8");
    assert.doesNotMatch(synthesisText, /\$[A-Za-z][A-Za-z0-9]*Hash/, `${name} contains a hash placeholder`);
    const synthesis = JSON.parse(synthesisText);
    for (const [key, artifact] of Object.entries(synthesis.artifacts ?? {})) {
      const bytes = await readFile(path.join(root, ...artifact.path.split("/")));
      assert.equal(artifact.sha256, sha256(bytes), `${name} has stale ${key} hash`);
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
