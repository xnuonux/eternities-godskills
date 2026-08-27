import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");
const json = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const text = async (relative) => readFile(path.join(root, relative), "utf8");

test("Orpheus promotes only the three candidate clusters and preserves deferred behavior as refusal evidence", async () => {
  const clusters = await json("clusters/audio-voice-media.v1.json");
  const synthesis = await json("syntheses/eternities-orpheus.v1.json");
  const candidateClusters = clusters.clusters.filter((cluster) => cluster.synthesisDecision === "candidate");
  assert.equal(clusters.clusters.length, 8);
  assert.equal(candidateClusters.length, 3);
  assert.deepEqual(synthesis.clusterIds, candidateClusters.map(({ id }) => id).sort());
  assert.deepEqual(synthesis.clusters.map(({ id }) => id), candidateClusters.map(({ id }) => id).sort());
  assert.deepEqual(synthesis.sourceIds, candidateClusters.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort());
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
});

test("Orpheus is fail-closed at every external, biometric, rights, and truth boundary", async () => {
  const skill = (await text("skills/eternities-orpheus/SKILL.md")).toLowerCase();
  for (const phrase of [
    "biometric inference", "impersonation", "deceptive voice", "rights-sensitive cloning",
    "provider credentials", "external publication", "network action", "unverified media claims",
    "local-read-first", "fail closed"
  ]) assert.match(skill, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")), phrase);
  assert.match(skill, /transcription/);
  assert.match(skill, /speech synthesis/);
  assert.match(skill, /realtime/);
  assert.match(skill, /music/);
  assert.match(skill, /media/);
});

test("Orpheus artifacts have exact self-reported digests and deterministic fixture coverage", async () => {
  const synthesis = await json("syntheses/eternities-orpheus.v1.json");
  const receipt = await json("receipts/promotions/eternities-orpheus.json");
  for (const artifact of Object.values(synthesis.artifacts)) assert.equal(artifact.sha256, sha256(await text(artifact.path)));
  assert.equal(receipt.skillName, "eternities-orpheus");
  assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
  assert.deepEqual(receipt.candidate.unresolvedEffects, []);
  assert.ok(receipt.candidate.kindScores.direct.total > 0);
  assert.ok(receipt.candidate.kindScores.paraphrase.total > 0);
  assert.ok(receipt.candidate.kindScores.exclusion.total > 0);
  assert.ok(receipt.candidate.kindScores.conflict.total > 0);
  assert.equal((await readdir(path.join(root, "skills/eternities-orpheus"))).length, 3);
});
