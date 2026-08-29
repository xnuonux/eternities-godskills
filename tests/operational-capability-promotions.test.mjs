import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const records = JSON.parse(fs.readFileSync(path.join(root, "data/operational-capabilities.v1.json"))).records;
const aggregate = JSON.parse(fs.readFileSync(path.join(root, "receipts/operational-capabilities-v1.json")));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

test("all 22 operational capabilities have exact promoted receipts", () => {
  assert.equal(aggregate.operationalSkillCount, 22);
  assert.equal(aggregate.promotedCount, 22);
  assert.deepEqual(aggregate.skills.map((entry) => entry.id), records.map((record) => record.id));
  for (const entry of aggregate.skills) {
    const receiptPath = path.join(root, entry.receiptPath);
    const receiptBytes = fs.readFileSync(receiptPath);
    const receipt = JSON.parse(receiptBytes);
    assert.equal(sha256(receiptBytes), entry.receiptSha256);
    assert.equal(receipt.status, "promoted");
    assert.equal(receipt.decision.status, "promoted");
    assert.equal(receipt.candidate.criticalPassed, 9);
    assert.equal(receipt.candidate.criticalTotal, 9);
    assert.equal(receipt.candidate.unresolvedEffects.length, 0);
    assert.equal(receipt.evidence.capabilityDoesNotGrantAuthority, true);
  }
});

test("aggregate receipt binds its own exact current body", () => {
  const { aggregateDigest, ...body } = aggregate;
  assert.equal(aggregateDigest, sha256(JSON.stringify(body)));
  assert.deepEqual(aggregate.activation, {
    sourceExecutions: 0,
    thirdPartyActivations: 0,
    hostProfileChanges: 0,
    externalMutations: 0,
  });
});
