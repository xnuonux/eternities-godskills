import assert from "node:assert/strict";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  COMPLETION_STAGES,
  TERMINAL_STATUSES,
  buildCompletionPlan,
  deriveFamilyStatus,
} from "../src/completion-waves.mjs";
import { buildCompletionWaves } from "../scripts/build-completion-waves.mjs";
import { canonicalText, sha256 } from "../src/io.mjs";

const root = path.resolve(".");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadInputs() {
  const ownership = canonicalText(await readFile(path.join(root, "artifacts/corpus/ownership.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map(JSON.parse);
  const summary = await readJson(path.join(root, "artifacts/corpus/coverage-summary.json"));
  const queues = new Map();
  for (const familyId of Object.keys(summary.ownerQueues)) {
    queues.set(familyId, await readJson(path.join(root, "artifacts/corpus/owners", familyId, "queue.json")));
  }
  return { ownership, summary, queues };
}

test("completion plan schedules every unreviewed owner exactly once in staged order", async () => {
  const inputs = await loadInputs();
  const plan = buildCompletionPlan(inputs);
  const expectedFamilies = COMPLETION_STAGES.flatMap(({ families }) => families);
  assert.deepEqual(plan.waves.map(({ familyId }) => familyId), expectedFamilies);
  assert.equal(plan.remainingSourceCount, 4345);
  assert.equal(plan.packetCount, 183);
  const scheduled = plan.waves.flatMap(({ packets }) => packets.flatMap(({ sourceIds }) => sourceIds));
  assert.equal(scheduled.length, 4345);
  assert.equal(new Set(scheduled).size, scheduled.length);
  assert.deepEqual(
    [...scheduled].sort(),
    inputs.ownership.filter(({ reviewed }) => !reviewed).map(({ sourceId }) => sourceId).sort(),
  );
  for (const wave of plan.waves) {
    assert.equal(wave.reviewedSourceCount, 0);
    assert.ok(wave.packets.every(({ sourceCount }) => sourceCount > 0 && sourceCount <= 25));
    assert.ok(wave.packets.every(({ dependencies }) => dependencies.length === 0));
    assert.ok(wave.packets.every(({ sha256: digest }) => /^[a-f0-9]{64}$/.test(digest)));
  }
});

test("family receipts cover all owners and preserve certified families", async () => {
  const inputs = await loadInputs();
  const { familyReceipts } = buildCompletionPlan(inputs);
  assert.equal(familyReceipts.length, 21);
  assert.deepEqual(
    familyReceipts.filter(({ status }) => status === "certified").map(({ familyId }) => familyId).sort(),
    ["agency-client-services", "game-design-development", "marketing-growth", "social-media-community"],
  );
  assert.equal(familyReceipts.filter(({ status }) => status === "pending-review").length, 17);
  for (const receipt of familyReceipts) {
    assert.ok(TERMINAL_STATUSES.has(receipt.status));
    assert.equal(receipt.gates.externalActivation, false);
    assert.equal(receipt.gates.profileMutation, false);
    assert.equal(receipt.gates.publication, false);
    assert.equal(receipt.gates.deployment, false);
    assert.equal(receipt.gates.push, false);
    assert.equal(receipt.gates.accountMutation, false);
    assert.equal(receipt.gates.spending, false);
    assert.equal(receipt.promotionClaims, 0);
  }
});

test("unfinished family status advances only through earned evidence", () => {
  assert.equal(deriveFamilyStatus("release-publishing", 10, { cardReviewed: 9, clustered: 0 }), "pending-review");
  assert.equal(deriveFamilyStatus("release-publishing", 10, { cardReviewed: 10, clustered: 0 }), "reviewed");
  assert.equal(deriveFamilyStatus("release-publishing", 10, { cardReviewed: 10, clustered: 10 }), "clustered");
  assert.equal(deriveFamilyStatus("agency-client-services", 12, { cardReviewed: 12, clustered: 12 }), "certified");
});

test("completion build is byte-stable and restores a missing receipt", async () => {
  await buildCompletionWaves({ repositoryRoot: root });
  const planPath = path.join(root, "data/full-corpus-wave-plan.v1.json");
  const receiptRoot = path.join(root, "receipts/families");
  const names = (await readdir(receiptRoot)).sort();
  const snapshot = new Map([[planPath, sha256(await readFile(planPath))]]);
  for (const name of names) snapshot.set(name, sha256(await readFile(path.join(receiptRoot, name))));
  const completedPath = path.join(receiptRoot, "agency-client-services.json");
  const completedBefore = await readFile(completedPath);
  await rm(path.join(receiptRoot, "release-publishing.json"));
  await buildCompletionWaves({ repositoryRoot: root });
  assert.deepEqual(await readFile(completedPath), completedBefore);
  assert.equal(sha256(await readFile(planPath)), snapshot.get(planPath));
  for (const name of names) assert.equal(sha256(await readFile(path.join(receiptRoot, name))), snapshot.get(name));
});
