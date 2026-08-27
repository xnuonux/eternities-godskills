import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";
import { buildRoutingIndex, shortlistRoutingCards } from "../src/routing-index.mjs";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function cards() {
  return (await readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse).map(validateRoutingCard);
}

function envelope(card, outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `v3-${card.id}-${suffix}`,
    outcome,
    candidateFamilies: [card.family],
    requiredCapabilities: card.provides,
    forbiddenCapabilities: [],
    permittedEffects: card.effects,
    availableAuthority: card.authorityRequirements,
    availablePreconditions: card.preconditions,
    maximumRisk: card.riskClass,
    minimumEvidenceConfidence: card.evidenceConfidence,
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
    ...overrides,
  };
}

function synthetic(index) {
  const suffix = String(index).padStart(4, "0");
  return validateRoutingCard({
    schemaVersion: 1,
    id: `v3-synthetic-${suffix}`,
    family: `v3-family-${String(index % 100).padStart(3, "0")}`,
    intent: `provide synthetic capability ${suffix}`,
    successCondition: `synthetic capability ${suffix} completes locally`,
    provides: [`v3-capability-${suffix}`],
    requires: [],
    intentExamples: { direct: [`complete synthetic ${suffix}`], paraphrased: [`handle synthetic ${suffix}`], contextual: [`the mission needs synthetic ${suffix}`] },
    negativeIntents: [`skip synthetic ${suffix}`],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 100,
    dependencyCost: 1,
    evidenceConfidence: "verified",
    entrypoint: `skills/v3-synthetic-${suffix}/SKILL.md`,
    legacyAliases: [],
  });
}

test("router v3 certifies twenty-seven commandless outcomes across nine cards", async () => {
  const values = await cards();
  const aliasFree = values.map((card) => ({ ...card, legacyAliases: [] }));
  assert.equal(values.length, 9);
  assert.equal(new Set(values.map(({ family }) => family)).size, 9);
  let count = 0;
  for (const card of values) {
    for (const [kind, outcomes] of Object.entries(card.intentExamples)) {
      const outcome = outcomes[0];
      assert.equal(outcome.startsWith("/"), false);
      const request = envelope(card, outcome, kind);
      const receipt = routeCapabilities({ envelope: request, cards: values });
      assert.deepEqual(receipt.selectedIds, [card.id]);
      assert.deepEqual(routeCapabilities({ envelope: request, cards: aliasFree }), receipt);
      assert.deepEqual(receipt.selectedEntrypoints, [card.entrypoint]);
      count += 1;
    }
  }
  assert.equal(count, 27);
});

test("router v3 stays bounded at five thousand cards and fails closed on decisions", async () => {
  const promoted = await cards();
  const all = [...promoted, ...Array.from({ length: 5000 - promoted.length }, (_, i) => synthetic(i))];
  const index = buildRoutingIndex(all);
  const arcadia = promoted.find(({ id }) => id === "eternities-arcadia");
  const request = envelope(arcadia, arcadia.intentExamples.contextual[0], "bounded");
  const shortlist = shortlistRoutingCards(index, request, { limit: 32 });
  assert.equal(index.cardCount, 5000);
  assert.ok(shortlist.length <= 32);
  assert.deepEqual(routeCapabilities({ envelope: request, cards: shortlist }).selectedIds, ["eternities-arcadia"]);
  assert.equal(routeCapabilities({
    envelope: { ...request, unresolvedDecisions: ["platform-policy"] }, cards: shortlist,
  }).status, "needs-decision");
});

test("router v3 receipt reconciles exact live artifacts", async () => {
  const receipt = await json("receipts/agent-native-router-v3.json");
  const [manifestText, cardsText, familyText] = await Promise.all([
    readFile(new URL("artifacts/routing/manifest.json", root), "utf8"),
    readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8"),
    readFile(new URL("artifacts/routing/family-map.json", root), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(receipt.id, "agent-native-router-v3");
  assert.deepEqual(receipt.inputs, manifest.inputs);
  assert.deepEqual(receipt.artifacts, {
    cardsSha256: sha256(cardsText),
    familyMapSha256: sha256(familyText),
    manifestSha256: sha256(manifestText),
  });
  assert.deepEqual(receipt.counts, {
    aliasRemovalCases: 27, cardCount: 9, commandlessCases: 27,
    familyCount: 9, maximumComposition: 3, maximumShortlist: 32,
  });
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});
