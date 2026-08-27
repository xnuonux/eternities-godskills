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
  return (await readFile(new URL("artifacts/checkpoints/agent-native-router-v5/cards.jsonl", root), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse).map(validateRoutingCard);
}

function envelope(card, outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `v5-${card.id}-${suffix}`,
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
    id: `v5-synthetic-${suffix}`,
    family: `v5-family-${String(index % 100).padStart(3, "0")}`,
    intent: `provide synthetic capability ${suffix}`,
    successCondition: `synthetic capability ${suffix} completes locally`,
    provides: [`v5-capability-${suffix}`],
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
    entrypoint: `skills/v5-synthetic-${suffix}/SKILL.md`,
    legacyAliases: [],
  });
}

test("router v5 certifies thirty-three commandless outcomes across eleven cards", async () => {
  const values = await cards();
  const aliasFree = values.map((card) => ({ ...card, legacyAliases: [] }));
  assert.equal(values.length, 11);
  assert.equal(new Set(values.map(({ family }) => family)).size, 11);
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
  assert.equal(count, 33);
});

test("router v5 stays bounded at five thousand cards and fails closed on decisions", async () => {
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

test("router v5 preserves Beacon authority effect and risk boundaries", async () => {
  const promoted = await cards();
  const beacon = promoted.find(({ id }) => id === "eternities-beacon");
  const request = envelope(beacon, beacon.intentExamples.direct[0], "boundaries");
  assert.equal(routeCapabilities({
    envelope: { ...request, availableAuthority: ["local-read"] }, cards: [beacon],
  }).status, "no-qualified-route");
  assert.equal(routeCapabilities({
    envelope: { ...request, permittedEffects: ["external-write"] }, cards: [beacon],
  }).status, "no-qualified-route");
  assert.equal(routeCapabilities({
    envelope: { ...request, maximumRisk: "low" }, cards: [beacon],
  }).status, "no-qualified-route");
});

test("router v5 receipt reconciles its immutable checkpoint artifacts", async () => {
  const receipt = await json("receipts/agent-native-router-v5.json");
  const [manifestText, cardsText, familyText] = await Promise.all([
    readFile(new URL("artifacts/checkpoints/agent-native-router-v5/manifest.json", root), "utf8"),
    readFile(new URL("artifacts/checkpoints/agent-native-router-v5/cards.jsonl", root), "utf8"),
    readFile(new URL("artifacts/checkpoints/agent-native-router-v5/family-map.json", root), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(receipt.id, "agent-native-router-v5");
  assert.equal(receipt.basePurpose, "router-v4-construction-base");
  assert.deepEqual(receipt.inputs, manifest.inputs);
  assert.deepEqual(receipt.artifacts, {
    cardsSha256: sha256(cardsText),
    familyMapSha256: sha256(familyText),
    manifestSha256: sha256(manifestText),
  });
  assert.deepEqual(receipt.counts, {
    aliasRemovalCases: 33, cardCount: 11, commandlessCases: 33,
    familyCount: 11, maximumComposition: 3, maximumShortlist: 32,
  });
  const v3Text = await readFile(new URL(receipt.checkpointEvidence.path, root), "utf8");
  assert.equal(receipt.checkpointEvidence.receiptSha256, sha256(v3Text));
  assert.deepEqual(receipt.gates, {
    aliasRemovalEquality: true,
    authorityPreserved: true,
    deterministicArtifacts: true,
    effectsPreserved: true,
    progressiveDisclosureBounded: true,
    selectedEntrypointsOnly: true,
    unnamedOutcomeRouting: true,
    unresolvedDecisionsFailClosed: true,
  });
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});
