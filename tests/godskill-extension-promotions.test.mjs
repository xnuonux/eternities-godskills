import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const aggregate = JSON.parse(fs.readFileSync(path.join(root, "receipts/godskill-extensions-v1.json")));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

test("all 26 extensions have terminal owner-local receipts", () => {
  assert.equal(aggregate.extensionCount, 26);
  assert.equal(aggregate.promotedCount, 26);
  assert.equal(aggregate.ownerCount, 13);
  assert.equal(new Set(aggregate.extensions.map((row) => row.id)).size, 26);
  for (const row of aggregate.extensions) {
    const bytes = fs.readFileSync(path.join(root, row.receiptPath));
    const receipt = JSON.parse(bytes);
    assert.equal(sha256(bytes), row.receiptSha256);
    assert.equal(receipt.status, "promoted");
    assert.equal(receipt.selection.selected, true);
    assert.equal(receipt.selection.ownerLocal, true);
    assert.equal(receipt.gates.capabilityDoesNotGrantAuthority, true);
    assert.equal(receipt.gates.sourceInstructionsExecuted, false);
  }
});

test("owner registries preserve the promoted owner entrypoint as an immutable routing identity", () => {
  for (const owner of aggregate.owners) {
    const skillBytes = fs.readFileSync(path.join(root, `skills/${owner.id}/SKILL.md`));
    assert.equal(sha256(skillBytes), owner.ownerSkillSha256);
    const registryBytes = fs.readFileSync(path.join(root, owner.registryPath));
    assert.equal(sha256(registryBytes), owner.registrySha256);
  }
});

test("the aggregate extension receipt binds its exact body and no activation", () => {
  const { aggregateDigest, ...body } = aggregate;
  assert.equal(aggregateDigest, sha256(JSON.stringify(body)));
  assert.equal(aggregate.activation.sourceExecutions, 0);
  assert.equal(aggregate.activation.thirdPartyActivations, 0);
  assert.equal(aggregate.activation.externalMutations, 0);
});
