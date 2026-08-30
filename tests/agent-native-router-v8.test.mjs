import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildRouterV8 } from "../scripts/build-router-v8-receipt.mjs";
import { sha256 } from "../src/io.mjs";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const root = path.resolve(".");

test("router v8 selects all twenty-two promoted cards from commandless examples", async () => {
  const cards = (await readFile(path.join(root, "artifacts/routing/cards.jsonl"), "utf8")).trim().split(/\r?\n/).map(JSON.parse).map(validateRoutingCard);
  assert.equal(cards.length, 22);
  assert.ok(cards.some(({ id }) => id === "eternities-hephaestus"));
  for (const card of cards) {
    const envelope = {
      schemaVersion: 1, requestId: `v8-${card.id}`, outcome: card.intentExamples.direct[0], candidateFamilies: [card.family],
      requiredCapabilities: card.provides, forbiddenCapabilities: [], permittedEffects: card.effects,
      availableAuthority: card.authorityRequirements, availablePreconditions: card.preconditions,
      maximumRisk: card.riskClass, minimumEvidenceConfidence: card.evidenceConfidence,
      contextBudget: 4000, maxCompositionSize: 3, unresolvedDecisions: [],
    };
    assert.deepEqual(routeCapabilities({ envelope, cards }).selectedIds, [card.id], card.id);
  }
});

test("router v8 binds current artifacts, prior checkpoint, and a mission stack", async () => {
  const receipt = await buildRouterV8(root, { write: false });
  assert.equal(receipt.status, "certified");
  assert.equal(receipt.counts.cardCount, 22);
  assert.equal(receipt.counts.commandlessCases, 66);
  assert.equal(receipt.gates.missionStackReconciled, true);
  assert.equal(receipt.gates.hephaestusPromoted, true);
  assert.equal(receipt.gates.aegisAgenticCiPromoted, true);
  for (const artifact of Object.values(receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
});

test("router v8 gives exact specialist ownership to Hephaestus and Aegis", async () => {
  const cards = (await readFile(path.join(root, "artifacts/routing/cards.jsonl"), "utf8")).trim().split(/\r?\n/).map(JSON.parse);
  const hephaestus = cards.find(({ id }) => id === "eternities-hephaestus");
  const aegis = cards.find(({ id }) => id === "eternities-aegis");
  assert.ok(hephaestus.provides.includes("model-selection"));
  assert.ok(hephaestus.provides.includes("compute-selection"));
  assert.ok(aegis.provides.includes("agentic-ci-audit"));
});
