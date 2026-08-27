import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sha256 } from "../src/io.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Herald exposes four local release workflows and exact candidate provenance", async () => {
  const contract = await json("skills/eternities-herald/references/capability-contract.json");
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.equal(contract.id, "godskill-eternities-herald-v1");
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "change-lifecycle", "continuous-delivery-design", "dependency-name-screening", "production-readiness",
  ]);
  assert.deepEqual(contract.effects, ["read", "write"]);
  assert.equal(contract.explicitOnly, false);
  assert.equal(new Set(contract.sourceIds).size, 9);
  assert.equal(contract.sourceIds.length, 9);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  assert.match(JSON.stringify(contract), /fail closed/i);
});

test("Herald routing card is agent-neutral and rejects unsafe release effects", async () => {
  const card = await json("skills/eternities-herald/references/routing-card.json");
  assert.doesNotThrow(() => validateRoutingCard(card));
  assert.deepEqual(card.provides, [
    "change-lifecycle", "continuous-delivery-design", "dependency-name-screening", "production-readiness",
  ]);
  assert.deepEqual(card.effects, ["local-read", "local-write"]);
  assert.equal(card.legacyAliases.length, 0);
  for (const text of [
    "publish this release and push the tag",
    "install the package after the name looks safe",
    "use the deployment credential to ship to production",
    "the approving authority is unresolved, decide anyway",
  ]) assert.match(card.boundaries.join(" "), /publication|tag|installation|credential|authority|risk/i);
});

test("Herald artifact hashes and receipt policy limits are self-consistent", async () => {
  const synthesis = await json("syntheses/eternities-herald.v1.json");
  const receipt = await json("receipts/promotions/eternities-herald.json");
  assert.equal(synthesis.status, "promoted");
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.equal(synthesis.synthesisMethod, "independent-cluster-synthesis-v1");
  for (const artifact of Object.values(synthesis.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, root), "utf8")));
  }
  assert.match(receipt.limitation, /live-agent.*superiority|live.*routing|does not prove/i);
  assert.deepEqual(receipt.evidence.clusterIds, [
    "release-change-lifecycle", "release-continuous-delivery-design",
    "release-dependency-name-screening", "release-production-readiness",
  ]);
});
