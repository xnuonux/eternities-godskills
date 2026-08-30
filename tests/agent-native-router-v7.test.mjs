import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const root = new URL("../", import.meta.url);

test("router v7 checkpoint preserves all twenty-one promoted cards", async () => {
  const cards = (await readFile(new URL("artifacts/checkpoints/agent-native-router-v8/cards.v7.jsonl", root), "utf8")).trim().split(/\r?\n/).map(JSON.parse).map(validateRoutingCard);
  assert.equal(cards.length, 21);
  for (const card of cards) {
    const envelope = {
      schemaVersion: 1, requestId: `v7-${card.id}`, outcome: card.intentExamples.direct[0], candidateFamilies: [card.family],
      requiredCapabilities: card.provides, forbiddenCapabilities: [], permittedEffects: card.effects,
      availableAuthority: card.authorityRequirements, availablePreconditions: card.preconditions,
      maximumRisk: card.riskClass, minimumEvidenceConfidence: card.evidenceConfidence,
      contextBudget: 4000, maxCompositionSize: 3, unresolvedDecisions: [],
    };
    assert.deepEqual(routeCapabilities({ envelope, cards }).selectedIds, [card.id], card.id);
  }
});

test("router v7 receipt exactly binds its immutable v8 checkpoint", async () => {
  const result = JSON.parse(await readFile(new URL("receipts/agent-native-router-v7.json", root), "utf8"));
  assert.equal(result.status, "certified");
  assert.equal(result.counts.cardCount, 21);
  assert.equal(result.counts.commandlessCases, 63);
  for (const [key, relativePath] of Object.entries({ cardsSha256: "artifacts/checkpoints/agent-native-router-v8/cards.v7.jsonl", familyMapSha256: "artifacts/checkpoints/agent-native-router-v8/family-map.v7.json", manifestSha256: "artifacts/checkpoints/agent-native-router-v8/manifest.v7.json" })) {
    assert.equal(result.artifacts[key], sha256(await readFile(new URL(relativePath, root))));
  }
});
