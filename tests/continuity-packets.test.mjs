import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendCheckpoint,
  attestCheckpoint,
  continuityAttestationMessage,
  createCheckpoint,
  estimateTokens,
  recoverContinuity,
  verifyCheckpointEnvelope,
} from "../src/continuity-packets.mjs";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const trustedKeys = new Map([["fixture-continuity", publicKey]]);

function packet(overrides = {}) {
  return createCheckpoint({
    taskRef: "task-lunari-release",
    sessionRef: "session-a",
    revision: 1,
    parentDigest: null,
    createdAt: "2026-08-28T20:00:00.000Z",
    objective: "deliver the bounded release with exact verification",
    provenState: ["baseline tests pass", "release scope is approved"],
    completedWork: ["architecture decision recorded"],
    openWork: ["implement adapter", "run independent review"],
    blockers: [],
    authority: {
      available: ["local-read", "repository-write"],
      excluded: ["deployment", "external-write"],
    },
    evidencePointers: [
      { id: "baseline", locator: "receipts/baseline.json", digest: "a".repeat(64) },
      { id: "plan", locator: "docs/plan.md", digest: "b".repeat(64) },
    ],
    nextAction: "implement the first approved slice and run its focused test",
    status: "active",
    contextBudget: 900,
    ...overrides,
  });
}

function signed(value = packet()) {
  return attestCheckpoint(value, { keyId: "fixture-continuity", privateKey });
}

test("checkpoint bytes and trusted Ed25519 attestation are exact", () => {
  const value = packet();
  const envelope = signed(value);
  assert.equal(verifyCheckpointEnvelope(envelope, { trustedKeys, expectedTaskRef: value.taskRef }).packetDigest, value.packetDigest);
  const forged = structuredClone(envelope);
  forged.packet.nextAction = "deploy without approval";
  assert.throws(() => verifyCheckpointEnvelope(forged, { trustedKeys, expectedTaskRef: value.taskRef }), /digest|signature/i);
  const attacker = generateKeyPairSync("ed25519");
  const unsigned = { algorithm: "ed25519", purpose: "task-continuity-checkpoint", subjectDigest: value.packetDigest, keyId: "attacker" };
  const attackerEnvelope = { packet: value, attestation: { ...unsigned, signature: sign(null, continuityAttestationMessage(unsigned), attacker.privateKey).toString("base64") } };
  assert.throws(() => verifyCheckpointEnvelope(attackerEnvelope, { trustedKeys, expectedTaskRef: value.taskRef }), /trusted/i);
});

test("append-only chain recovers only the newest compact packet after compaction", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "continuity-"));
  const logPath = path.join(root, "task-lunari-release.jsonl");
  const first = packet();
  await appendCheckpoint({ logPath, envelope: signed(first), trustedKeys });
  const second = packet({
    sessionRef: "session-b",
    revision: 2,
    parentDigest: first.packetDigest,
    createdAt: "2026-08-28T20:30:00.000Z",
    provenState: [...first.provenState, "adapter focused tests pass"],
    completedWork: [...first.completedWork, "adapter implemented"],
    openWork: ["run independent review"],
    nextAction: "request independent review of the exact committed diff",
  });
  await appendCheckpoint({ logPath, envelope: signed(second), trustedKeys });
  const recovered = await recoverContinuity({
    logPath,
    trustedKeys,
    expectedTaskRef: first.taskRef,
    maxTokens: 900,
    now: "2026-08-28T20:31:00.000Z",
    maxAgeMs: 60 * 60 * 1000,
  });
  assert.equal(recovered.packet.revision, 2);
  assert.equal(recovered.packet.sessionRef, "session-b");
  assert.equal(recovered.packet.nextAction, "request independent review of the exact committed diff");
  assert.equal("history" in recovered, false);
  assert.equal((await readFile(logPath, "utf8")).trim().split(/\r?\n/).length, 2);
});

test("cross-task, stale-parent, stale-time, and over-budget recovery fail closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "continuity-"));
  const logPath = path.join(root, "task.jsonl");
  const first = packet();
  await appendCheckpoint({ logPath, envelope: signed(first), trustedKeys });
  await assert.rejects(
    appendCheckpoint({ logPath, envelope: signed(packet({ taskRef: "other-task", revision: 2, parentDigest: first.packetDigest })), trustedKeys }),
    /taskRef|task/i,
  );
  await assert.rejects(
    appendCheckpoint({ logPath, envelope: signed(packet({ revision: 2, parentDigest: "c".repeat(64) })), trustedKeys }),
    /parent/i,
  );
  await assert.rejects(
    recoverContinuity({ logPath, trustedKeys, expectedTaskRef: first.taskRef, maxTokens: 900, now: "2026-08-30T20:00:00.000Z", maxAgeMs: 1000 }),
    /stale/i,
  );
  await assert.rejects(
    recoverContinuity({ logPath, trustedKeys, expectedTaskRef: first.taskRef, maxTokens: 10 }),
    /budget/i,
  );
});

test("parallel task logs remain isolated", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "continuity-"));
  const first = packet();
  const second = packet({ taskRef: "task-perseus", sessionRef: "session-p", objective: "certify the evaluator", nextAction: "run the held-out benchmark" });
  const firstPath = path.join(root, "lunari.jsonl");
  const secondPath = path.join(root, "perseus.jsonl");
  await Promise.all([
    appendCheckpoint({ logPath: firstPath, envelope: signed(first), trustedKeys }),
    appendCheckpoint({ logPath: secondPath, envelope: signed(second), trustedKeys }),
  ]);
  const [lunari, perseus] = await Promise.all([
    recoverContinuity({ logPath: firstPath, trustedKeys, expectedTaskRef: "task-lunari-release", maxTokens: 900 }),
    recoverContinuity({ logPath: secondPath, trustedKeys, expectedTaskRef: "task-perseus", maxTokens: 900 }),
  ]);
  assert.equal(lunari.packet.nextAction.includes("review"), false);
  assert.equal(perseus.packet.nextAction, "run the held-out benchmark");
  await assert.rejects(
    recoverContinuity({ logPath: firstPath, trustedKeys, expectedTaskRef: "task-perseus", maxTokens: 900 }),
    /task/i,
  );
});

test("one compact recovery costs less than per-tool plan reinjection", () => {
  const value = packet();
  const compactCost = estimateTokens(value);
  const baselinePerToolTokens = 90;
  const baselineToolCalls = 20;
  assert.ok(compactCost < baselinePerToolTokens * baselineToolCalls);
  assert.equal(JSON.stringify(value).includes("PreToolUse"), false);
  assert.equal(JSON.stringify(value).includes("slash"), false);
});
