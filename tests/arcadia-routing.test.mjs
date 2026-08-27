import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const path = new URL("../skills/eternities-arcadia/references/routing-card.json", import.meta.url);

async function card() {
  return validateRoutingCard(JSON.parse(await readFile(path, "utf8")));
}

function envelope(outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `arcadia-${suffix}`,
    outcome,
    candidateFamilies: ["game-design-development"],
    requiredCapabilities: [
      "game-direction", "player-experience", "proof-and-release", "runtime-systems",
    ],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write"],
    availablePreconditions: [],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "verified",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
    ...overrides,
  };
}

test("Arcadia routing card is compact, bounded, and agent native", async () => {
  const value = await card();
  assert.equal(value.id, "eternities-arcadia");
  assert.equal(value.family, "game-design-development");
  assert.deepEqual(value.provides, [
    "game-direction", "player-experience", "proof-and-release", "runtime-systems",
  ]);
  assert.deepEqual(value.effects, ["local-read", "local-write"]);
  assert.equal(value.riskClass, "moderate");
  assert.equal(value.contextCost, 1417);
  assert.equal(value.entrypoint, "skills/eternities-arcadia/SKILL.md");
  assert.deepEqual(value.legacyAliases, []);
});

test("direct, paraphrased, and contextual unnamed outcomes select only Arcadia", async () => {
  const value = await card();
  const outcomes = [
    "turn this game direction into reliable runtime systems, accessible player feedback, and a human release verdict",
    "connect the player promise to simulation, controls, feel, measurements, and playtest acceptance",
    "the game works in pieces but design, runtime, experience, and proof need one bounded development workflow",
  ];
  for (const [index, outcome] of outcomes.entries()) {
    assert.equal(outcome.includes("/"), false);
    assert.equal(/eternities|arcadia/i.test(outcome), false);
    const request = envelope(outcome, index);
    const receipt = routeCapabilities({ envelope: request, cards: [value] });
    assert.deepEqual(receipt.selectedIds, ["eternities-arcadia"]);
    assert.deepEqual(routeCapabilities({ envelope: request, cards: [{ ...value, legacyAliases: [] }] }), receipt);
  }
});

test("Arcadia fails closed across rights, release, effects, risk, authority, and verdict boundaries", async () => {
  const value = await card();
  const unsupported = [
    "generated-content-licensing", "store-publication", "package-installation", "human-fun-certification",
  ];
  for (const capability of unsupported) {
    const result = routeCapabilities({
      envelope: envelope(capability, capability, { requiredCapabilities: [capability] }),
      cards: [value],
    });
    assert.equal(result.status, "no-qualified-route");
  }
  assert.equal(routeCapabilities({
    envelope: envelope("publish the game", "external", {
      permittedEffects: ["external-write"], availableAuthority: ["external-write"],
    }), cards: [value],
  }).status, "no-qualified-route");
  assert.deepEqual(routeCapabilities({
    envelope: envelope("develop the game", "risk", { maximumRisk: "low" }), cards: [value],
  }).rejected[0].reasons, ["risk-exceeds-maximum"]);
  assert.deepEqual(routeCapabilities({
    envelope: envelope("change local game systems", "authority", { availableAuthority: ["local-read"] }), cards: [value],
  }).rejected[0].reasons, ["authority-missing"]);
  assert.equal(routeCapabilities({
    envelope: envelope("prepare a release", "policy", { unresolvedDecisions: ["platform-policy"] }), cards: [value],
  }).status, "needs-decision");
});
