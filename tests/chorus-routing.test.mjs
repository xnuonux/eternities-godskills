import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const path = new URL("../skills/eternities-chorus/references/routing-card.json", import.meta.url);
async function card() { return validateRoutingCard(JSON.parse(await readFile(path, "utf8"))); }

function envelope(outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `chorus-${suffix}`,
    outcome,
    candidateFamilies: ["social-media-community"],
    requiredCapabilities: [
      "community-operations", "editorial-production",
      "identity-and-channel-strategy", "measurement-and-stewardship",
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

test("Chorus routing card is compact, bounded, and agent native", async () => {
  const value = await card();
  assert.equal(value.id, "eternities-chorus");
  assert.equal(value.family, "social-media-community");
  assert.deepEqual(value.provides, [
    "community-operations", "editorial-production",
    "identity-and-channel-strategy", "measurement-and-stewardship",
  ]);
  assert.deepEqual(value.effects, ["local-read", "local-write"]);
  assert.equal(value.riskClass, "moderate");
  assert.equal(value.contextCost, 1502);
  assert.equal(value.entrypoint, "skills/eternities-chorus/SKILL.md");
  assert.deepEqual(value.legacyAliases, []);
});

test("direct paraphrased and contextual unnamed outcomes select only Chorus", async () => {
  const value = await card();
  const outcomes = [
    "build one truthful social system connecting identity, original content, community care, and measured learning",
    "turn our voice and evidence into channel-native drafts, a response policy, and a reliable feedback loop",
    "the posts, audience, community rules, and analytics exist separately but need one governed workflow",
  ];
  for (const [index, outcome] of outcomes.entries()) {
    assert.equal(outcome.includes("/"), false);
    assert.equal(/eternities|chorus|social-media-manager|linkedin-content/i.test(outcome), false);
    const request = envelope(outcome, index);
    const receipt = routeCapabilities({ envelope: request, cards: [value] });
    assert.deepEqual(receipt.selectedIds, ["eternities-chorus"]);
    assert.deepEqual(routeCapabilities({ envelope: request, cards: [{ ...value, legacyAliases: [] }] }), receipt);
  }
});

test("Chorus fails closed across external effects policy risk and authority boundaries", async () => {
  const value = await card();
  for (const capability of [
    "paid-advertising", "specialist-media-generation", "platform-scraping", "impersonation",
    "fabricated-testimony", "sensitive-moderation", "crisis-publication", "account-mutation",
  ]) assert.equal(routeCapabilities({
    envelope: envelope(capability, capability, { requiredCapabilities: [capability] }), cards: [value],
  }).status, "no-qualified-route");
  assert.equal(routeCapabilities({
    envelope: envelope("publish replies", "external", {
      permittedEffects: ["external-write"], availableAuthority: ["external-write"],
    }), cards: [value],
  }).status, "no-qualified-route");
  assert.deepEqual(routeCapabilities({
    envelope: envelope("change local social system", "authority", { availableAuthority: ["local-read"] }), cards: [value],
  }).rejected[0].reasons, ["authority-missing"]);
  assert.deepEqual(routeCapabilities({
    envelope: envelope("small low risk task", "risk", { maximumRisk: "low" }), cards: [value],
  }).rejected[0].reasons, ["risk-exceeds-maximum"]);
  assert.equal(routeCapabilities({
    envelope: envelope("use the latest platform rules", "policy", { unresolvedDecisions: ["current-platform-policy"] }), cards: [value],
  }).status, "needs-decision");
});
