import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildRouterV7 } from "../scripts/build-router-v7-receipt.mjs";
import { sha256 } from "../src/io.mjs";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const root = new URL("../", import.meta.url);

test("router v7 selects all twenty-one promoted cards from commandless examples", async () => {
  const cards = (await readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8")).trim().split(/\r?\n/).map(JSON.parse).map(validateRoutingCard);
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

test("router v7 receipt exactly binds current routing artifacts and v6 checkpoint", async () => {
  const result = await buildRouterV7(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"), { write: false });
  assert.equal(result.status, "certified");
  assert.equal(result.counts.cardCount, 21);
  assert.equal(result.counts.commandlessCases, 63);
  for (const [key, relativePath] of Object.entries({ cardsSha256: "artifacts/routing/cards.jsonl", familyMapSha256: "artifacts/routing/family-map.json", manifestSha256: "artifacts/routing/manifest.json" })) {
    assert.equal(result.artifacts[key], sha256(await readFile(new URL(relativePath, root))));
  }
});
