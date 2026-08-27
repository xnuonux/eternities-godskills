import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const cardPath = new URL(
  "../skills/eternities-agora/references/routing-card.json",
  import.meta.url,
);

async function card() {
  return validateRoutingCard(JSON.parse(await readFile(cardPath, "utf8")));
}

function envelope(outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `agora-${suffix}`,
    outcome,
    candidateFamilies: ["agency-client-services"],
    requiredCapabilities: [
      "account-operations",
      "client-deliverables",
      "client-service-governance",
      "evidence-traceability",
      "prospect-assessment",
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

test("Agora routing card is compact, bounded, and agent native", async () => {
  const value = await card();
  assert.equal(value.id, "eternities-agora");
  assert.equal(value.family, "agency-client-services");
  assert.deepEqual(value.provides, [
    "account-operations",
    "client-deliverables",
    "client-service-governance",
    "evidence-traceability",
    "prospect-assessment",
  ]);
  assert.deepEqual(value.effects, ["local-read", "local-write"]);
  assert.equal(value.riskClass, "moderate");
  assert.equal(value.contextCost, 1158);
  assert.equal(value.entrypoint, "skills/eternities-agora/SKILL.md");
});

test("direct, paraphrased, and contextual unnamed outcomes select only Agora", async () => {
  const value = await card();
  const aliasFree = { ...value, legacyAliases: [] };
  const outcomes = [
    "reconcile prospect assessment, account state, and client deliverables from authorized evidence",
    "turn our opportunity records and client findings into traceable operational and delivery artifacts",
    "several client-service stages disagree, so the evidence, account state, and deliverables need one bounded workflow",
  ];
  for (const [index, outcome] of outcomes.entries()) {
    assert.equal(outcome.includes("/"), false);
    assert.equal(outcome.toLowerCase().includes("eternities"), false);
    assert.equal(outcome.toLowerCase().includes("agora"), false);
    const request = envelope(outcome, index);
    const receipt = routeCapabilities({ envelope: request, cards: [value] });
    assert.deepEqual(receipt.selectedIds, ["eternities-agora"]);
    assert.deepEqual(routeCapabilities({ envelope: request, cards: [aliasFree] }), receipt);
  }
});

test("Agora fails closed across effects, domain boundaries, risk, and authority", async () => {
  const value = await card();
  const external = routeCapabilities({
    envelope: envelope("publish the proposal", "external", {
      permittedEffects: ["external-write"],
      availableAuthority: ["external-write"],
    }),
    cards: [value],
  });
  assert.equal(external.status, "no-qualified-route");

  for (const capability of ["financial-planning", "kyc-screening", "legal-drafting"]) {
    const result = routeCapabilities({
      envelope: envelope(`perform ${capability}`, capability, {
        requiredCapabilities: [capability],
      }),
      cards: [value],
    });
    assert.equal(result.status, "no-qualified-route");
  }

  const lowRisk = routeCapabilities({
    envelope: envelope("reconcile client services", "risk", { maximumRisk: "low" }),
    cards: [value],
  });
  assert.equal(lowRisk.status, "no-qualified-route");
  assert.deepEqual(lowRisk.rejected[0].reasons, ["risk-exceeds-maximum"]);

  const missingWrite = routeCapabilities({
    envelope: envelope("construct a local proposal", "authority", {
      availableAuthority: ["local-read"],
    }),
    cards: [value],
  });
  assert.equal(missingWrite.status, "no-qualified-route");
  assert.deepEqual(missingWrite.rejected[0].reasons, ["authority-missing"]);

  const unresolved = routeCapabilities({
    envelope: envelope("construct a commercial proposal", "decision", {
      unresolvedDecisions: ["commercial-policy"],
    }),
    cards: [value],
  });
  assert.equal(unresolved.status, "needs-decision");
});
