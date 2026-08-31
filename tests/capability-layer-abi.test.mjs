import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

test("capability layer policy freezes three sorted first-party canaries", async () => {
  const policy = await json("policies/capability-layer-abi.v1.json");

  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.id, "capability-layer-abi-v1");
  assert.deepEqual(policy.canaries.map(({ capabilityId }) => capabilityId), [
    "eternities-aegis",
    "eternities-forge",
    "eternities-muse",
  ]);
  assert.equal(policy.reviewerPolicy.artifactRequired, true);
  assert.equal(policy.reviewerPolicy.selfCertificationAllowed, false);
  assert.equal(policy.verifierPolicy.initialStatus, "declared-not-executed");
  assert.equal(policy.capabilityGrantsAuthority, false);
});

test("every canary slot maps to an exact capability source field", async () => {
  const policy = await json("policies/capability-layer-abi.v1.json");

  for (const canary of policy.canaries) {
    const contract = await json(canary.sources.contract);
    const route = await json(canary.sources.routingCard);
    assert.equal(contract.name, canary.capabilityId);
    assert.equal(route.id, canary.capabilityId);

    for (const [slots, source] of [
      [canary.inputSlots, contract.inputs],
      [canary.outputSlots, contract.outputs],
    ]) {
      assert.equal(new Set(slots.map(({ id }) => id)).size, slots.length);
      assert.equal(new Set(slots.map(({ typeId }) => typeId)).size, slots.length);
      for (const slot of slots) {
        assert.equal(typeof source[slot.sourceIndex], "string");
        assert.ok(source[slot.sourceIndex].length > 0);
        assert.ok(["object", "array"].includes(slot.jsonKind));
      }
    }
  }
});
