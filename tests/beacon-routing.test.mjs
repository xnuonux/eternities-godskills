import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const cardPath = new URL("../skills/eternities-beacon/references/routing-card.json", import.meta.url);
const skillPath = new URL("../skills/eternities-beacon/SKILL.md", import.meta.url);
async function card() { return validateRoutingCard(JSON.parse(await readFile(cardPath, "utf8"))); }

function envelope(outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `beacon-${suffix}`,
    outcome,
    candidateFamilies: ["marketing-growth"],
    requiredCapabilities: [
      "market-truth-and-positioning",
      "offer-and-commercial-architecture",
      "discoverability-and-search-systems",
      "go-to-market-and-demand-systems",
      "conversion-and-lifecycle-systems",
      "growth-measurement-and-stewardship",
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

test("Beacon routing card is compact bounded and agent native", async () => {
  const [value, markdown] = await Promise.all([card(), readFile(skillPath, "utf8")]);
  assert.equal(value.id, "eternities-beacon");
  assert.equal(value.family, "marketing-growth");
  assert.deepEqual(value.provides, [
    "conversion-and-lifecycle-systems",
    "discoverability-and-search-systems",
    "go-to-market-and-demand-systems",
    "growth-measurement-and-stewardship",
    "market-truth-and-positioning",
    "offer-and-commercial-architecture",
  ]);
  assert.deepEqual(value.effects, ["local-read", "local-write"]);
  assert.equal(value.riskClass, "moderate");
  assert.equal(value.contextCost, Math.ceil(Buffer.byteLength(markdown, "utf8") / 4));
  assert.ok(value.contextCost <= 4000);
  assert.equal(value.entrypoint, "skills/eternities-beacon/SKILL.md");
  assert.deepEqual(value.legacyAliases, []);
});

test("direct paraphrased and contextual unnamed outcomes select only Beacon", async () => {
  const value = await card();
  const outcomes = [
    "turn verified customer and competitor evidence into positioning offers a launch system conversion tests and measured growth decisions",
    "connect market truth pricing search demand lifecycle experiments and attribution without launching or spending anything",
    "our research offers website acquisition funnel and analytics exist separately but need one governed learning system",
  ];
  for (const [index, outcome] of outcomes.entries()) {
    assert.equal(outcome.includes("/"), false);
    assert.equal(/eternities|beacon|growth-hacker|marketing-manager/i.test(outcome), false);
    const request = envelope(outcome, index);
    const receipt = routeCapabilities({ envelope: request, cards: [value] });
    assert.deepEqual(receipt.selectedIds, ["eternities-beacon"]);
    assert.deepEqual(routeCapabilities({ envelope: request, cards: [{ ...value, legacyAliases: [] }] }), receipt);
  }
});

test("Beacon fails closed across effect truth privacy spending and commercial boundaries", async () => {
  const value = await card();
  for (const capability of [
    "generic-copy-editing", "social-community-operations", "specialist-media-generation",
    "platform-scraping", "personal-data-enrichment", "direct-outreach", "account-mutation",
    "media-spending", "pricing-mutation", "commercial-commitment", "fabricated-proof",
    "coercive-conversion", "unsupported-current-facts", "guaranteed-growth",
  ]) assert.equal(routeCapabilities({
    envelope: envelope(capability, capability, { requiredCapabilities: [capability] }), cards: [value],
  }).status, "no-qualified-route");
  assert.equal(routeCapabilities({
    envelope: envelope("launch campaigns", "external", {
      permittedEffects: ["external-write"], availableAuthority: ["external-write"],
    }), cards: [value],
  }).status, "no-qualified-route");
  assert.deepEqual(routeCapabilities({
    envelope: envelope("change local growth system", "authority", { availableAuthority: ["local-read"] }), cards: [value],
  }).rejected[0].reasons, ["authority-missing"]);
  assert.deepEqual(routeCapabilities({
    envelope: envelope("small low risk task", "risk", { maximumRisk: "low" }), cards: [value],
  }).rejected[0].reasons, ["risk-exceeds-maximum"]);
  assert.equal(routeCapabilities({
    envelope: envelope("use current prices laws and platform rules", "current", {
      unresolvedDecisions: ["current-authoritative-evidence"],
    }), cards: [value],
  }).status, "needs-decision");
});
