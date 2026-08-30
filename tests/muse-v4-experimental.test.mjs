import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const text = async (relative) => readFile(new URL(relative, root), "utf8");
const json = async (relative) => JSON.parse(await text(relative));

test("Muse v4 development evidence is inactive, exact, and held-out blind", async () => {
  const [contract, evidence] = await Promise.all([
    json("artifacts/muse-v4-experimental/neutral-contract.json"),
    json("artifacts/muse-v4-experimental/development-evidence.json"),
  ]);
  assert.equal(contract.active, false);
  assert.equal(contract.requiresExplicitAdoption, true);
  assert.deepEqual(contract.effects, ["read"]);
  assert.equal(evidence.partition, "development");
  assert.equal(evidence.reviewed, true);
  assert.equal(evidence.source.manifestSha256, "c8f4976f09f0062118923c51223eecc1d8bdffbcfccdf62788f2cbfff1d72974");
  assert.deepEqual(evidence.failureCodes, [
    "method-cost-overrun",
    "natural-motion-regularization",
    "solution-space-collapse",
    "spatial-affordance-regression",
  ]);
  const constructionBytes = `${JSON.stringify(contract)}\n${JSON.stringify(evidence)}`.toLowerCase();
  for (const heldOutIdentity of ["gravitational portal", "captive storm", "bioluminescent ecosystem"]) {
    assert.equal(constructionBytes.includes(heldOutIdentity), false, heldOutIdentity);
  }
});
