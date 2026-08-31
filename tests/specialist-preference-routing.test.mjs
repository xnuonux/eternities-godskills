import assert from "node:assert/strict";
import test from "node:test";

import { compileAndRoute as compileAndRouteHistorical } from "../src/intent-runtime.mjs";
import { compileAndRoute } from "../src/specialist-preference-runtime.mjs";
import {
  buildPreferenceRoutingShortlist,
  buildRoutingIndex,
  shortlistRoutingCards,
} from "../src/specialist-preference-routing-index.mjs";
import {
  DECISION_POLICY,
} from "../src/routing-contracts.mjs";
import {
  extendCompilerReceipt,
  PREFERENCE_DECISION_POLICY,
  splitPreferenceRequest,
  validatePreferenceEnvelope as validateRequestEnvelope,
  validatePreferenceRouteReceipt as validateRouteReceipt,
} from "../src/specialist-preference-contracts.mjs";
import { routeCapabilities } from "../src/specialist-preference-router.mjs";

function card(id, overrides = {}) {
  return {
    schemaVersion: 1,
    id,
    family: "preference-fixture",
    intent: "perform one exact verified operation",
    successCondition: "the operation is verified",
    provides: ["operation"],
    requires: [],
    intentExamples: {
      direct: ["perform the operation"],
      paraphrased: ["complete the exact operation"],
      contextual: ["this mission requires the operation"],
    },
    negativeIntents: ["skip the operation"],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 100,
    dependencyCost: 1,
    evidenceConfidence: "verified",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: [],
    ...overrides,
  };
}

function envelope(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "specialist-preference-fixture",
    outcome: "perform the operation",
    candidateFamilies: ["preference-fixture"],
    requiredCapabilities: ["operation"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    maximumRisk: "low",
    minimumEvidenceConfidence: "verified",
    contextBudget: 1000,
    maxCompositionSize: 1,
    unresolvedDecisions: [],
    ...overrides,
  };
}

function naturalRequest(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "specialist-natural-fixture",
    text: "perform the operation",
    context: {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
      availablePreconditions: [],
      forbiddenCapabilities: [],
      maximumRisk: "low",
      minimumEvidenceConfidence: "verified",
      contextBudget: 1000,
      maxCompositionSize: 1,
      ...overrides,
    },
  };
}

const alpha = () => card("alpha-operation");
const beta = () => card("beta-operation");

test("preference breaks only an otherwise equal final id tie", () => {
  const cards = [beta(), alpha()];
  const historical = routeCapabilities({ envelope: envelope(), cards });
  const preferred = routeCapabilities({
    envelope: envelope({ preferredCapabilities: ["beta-operation"] }),
    cards,
  });

  assert.deepEqual(historical.selectedIds, ["alpha-operation"]);
  assert.equal(historical.decisionPolicy, DECISION_POLICY);
  assert.equal("preference" in historical, false);
  assert.equal("preferredCapabilities" in historical.requestFeatures, false);

  assert.deepEqual(preferred.selectedIds, ["beta-operation"]);
  assert.equal(preferred.decisionPolicy, PREFERENCE_DECISION_POLICY);
  assert.deepEqual(preferred.requestFeatures.preferredCapabilities, ["beta-operation"]);
  assert.deepEqual(preferred.preference, {
    protocolId: "eternities-godskills-specialist-preference-v1",
    suppliedIds: ["beta-operation"],
    qualifiedIds: ["beta-operation"],
    selectedIds: ["beta-operation"],
    baselineSelectedIds: ["alpha-operation"],
    semanticCandidateIds: ["alpha-operation", "beta-operation"],
    applied: true,
    reason: "equal-quality-tie-break",
  });
});

test("stronger non-preferred quality wins and rejected preferences stay rejected", () => {
  const stronger = card("alpha-operation", { contextCost: 50 });
  const weakerPreferred = card("beta-operation", { contextCost: 100 });
  const result = routeCapabilities({
    envelope: envelope({ preferredCapabilities: ["beta-operation"] }),
    cards: [weakerPreferred, stronger],
  });
  assert.deepEqual(result.selectedIds, ["alpha-operation"]);
  assert.equal(result.preference.applied, false);
  assert.equal(result.preference.reason, "stronger-nonpreferred-selection");
  assert.deepEqual(result.preference.qualifiedIds, ["beta-operation"]);

  const rejected = routeCapabilities({
    envelope: envelope({ preferredCapabilities: ["beta-operation"] }),
    cards: [stronger, card("beta-operation", { riskClass: "high" })],
  });
  assert.deepEqual(rejected.selectedIds, ["alpha-operation"]);
  assert.deepEqual(rejected.preference.qualifiedIds, []);
  assert.equal(rejected.preference.applied, false);
  assert.equal(rejected.preference.reason, "no-qualified-preference");
  assert.deepEqual(rejected.rejected, [
    { id: "beta-operation", reasons: ["risk-exceeds-maximum"] },
  ]);
});

test("policy-qualified preferences that cannot form a route are reported distinctly", () => {
  const result = routeCapabilities({
    envelope: envelope({ preferredCapabilities: ["beta-operation"] }),
    cards: [alpha(), card("beta-operation", { provides: ["other-operation"] })],
  });
  assert.deepEqual(result.selectedIds, ["alpha-operation"]);
  assert.deepEqual(result.preference.qualifiedIds, ["beta-operation"]);
  assert.equal(result.preference.applied, false);
  assert.equal(result.preference.reason, "preference-not-route-capable");
});

test("every reachable historical quality metric outranks preference", async (t) => {
  const cases = [
    {
      name: "extra capabilities",
      nonpreferred: alpha(),
      preferred: card("beta-operation", { provides: ["extra", "operation"] }),
      envelope: {},
    },
    {
      name: "effect cost",
      nonpreferred: alpha(),
      preferred: card("beta-operation", { effects: ["external-read"] }),
      envelope: { permittedEffects: ["external-read", "local-read"] },
    },
    {
      name: "context cost",
      nonpreferred: card("alpha-operation", { contextCost: 50 }),
      preferred: beta(),
      envelope: {},
    },
    {
      name: "dependency cost",
      nonpreferred: alpha(),
      preferred: card("beta-operation", { dependencyCost: 2 }),
      envelope: {},
    },
    {
      name: "evidence confidence",
      nonpreferred: alpha(),
      preferred: card("beta-operation", { evidenceConfidence: "high" }),
      envelope: { minimumEvidenceConfidence: "low" },
    },
  ];
  for (const fixture of cases) {
    await t.test(fixture.name, () => {
      const result = routeCapabilities({
        envelope: envelope({
          ...fixture.envelope,
          preferredCapabilities: ["beta-operation"],
        }),
        cards: [fixture.preferred, fixture.nonpreferred],
      });
      assert.deepEqual(result.selectedIds, ["alpha-operation"]);
      assert.deepEqual(result.preference.baselineSelectedIds, ["alpha-operation"]);
      assert.equal(result.preference.applied, false);
      assert.equal(result.preference.reason, "stronger-nonpreferred-selection");
    });
  }

  await t.test("card count", () => {
    const cards = [
      card("alpha-a", {
        provides: ["part-a", "part-b"],
        compatibleWith: ["alpha-b"],
      }),
      card("alpha-b", {
        provides: ["part-c"],
        compatibleWith: ["alpha-a"],
      }),
      card("beta-a", {
        provides: ["part-a"],
        compatibleWith: ["beta-b", "beta-c"],
      }),
      card("beta-b", {
        provides: ["part-b"],
        compatibleWith: ["beta-a", "beta-c"],
      }),
      card("beta-c", {
        provides: ["part-c"],
        compatibleWith: ["beta-a", "beta-b"],
      }),
    ];
    const result = routeCapabilities({
      envelope: envelope({
        requiredCapabilities: ["part-a", "part-b", "part-c"],
        maxCompositionSize: 3,
        preferredCapabilities: ["beta-a", "beta-b", "beta-c"],
      }),
      cards,
    });
    assert.deepEqual(result.selectedIds, ["alpha-a", "alpha-b"]);
    assert.deepEqual(result.preference.baselineSelectedIds, ["alpha-a", "alpha-b"]);
    assert.equal(result.preference.applied, false);
    assert.equal(result.preference.reason, "stronger-nonpreferred-selection");
  });
});

test("preferences cannot clear decisions and receipt claims fail closed", () => {
  const receipt = routeCapabilities({
    envelope: envelope({
      preferredCapabilities: ["beta-operation"],
      unresolvedDecisions: ["user-choice"],
    }),
    cards: [alpha(), beta()],
  });
  assert.equal(receipt.status, "needs-decision");
  assert.deepEqual(receipt.selectedIds, []);
  assert.deepEqual(receipt.preference.baselineSelectedIds, []);
  assert.equal(receipt.preference.applied, false);
  assert.equal(receipt.preference.reason, "unresolved-decision");

  assert.throws(() => validateRouteReceipt({
    ...receipt,
    preference: {
      ...receipt.preference,
      applied: true,
      reason: "equal-quality-tie-break",
    },
  }), /preference|applied|selection/i);

  const tied = routeCapabilities({
    envelope: envelope({ preferredCapabilities: ["beta-operation"] }),
    cards: [alpha(), beta()],
  });
  const movedAway = structuredClone(tied);
  movedAway.requestFeatures.preferredCapabilities = ["alpha-operation"];
  movedAway.preference.suppliedIds = ["alpha-operation"];
  movedAway.preference.qualifiedIds = ["alpha-operation"];
  assert.throws(() => validateRouteReceipt(movedAway), /preference|direction|selected/i);
});

test("preference inputs are bounded, canonical, known, and not explicitly forbidden", () => {
  assert.throws(() => validateRequestEnvelope(envelope({
    preferredCapabilities: [],
  })), /preferredCapabilities.*empty|must not be empty/i);
  assert.throws(() => validateRequestEnvelope(envelope({
    preferredCapabilities: ["beta-operation", "alpha-operation"],
  })), /preferredCapabilities.*sorted|lexical/i);
  assert.throws(() => validateRequestEnvelope(envelope({
    preferredCapabilities: ["beta-operation", "beta-operation"],
  })), /preferredCapabilities.*duplicate/i);
  assert.throws(() => validateRequestEnvelope(envelope({
    preferredCapabilities: Array.from({ length: 33 }, (_, index) =>
      `skill-${String(index).padStart(2, "0")}`),
  })), /preferredCapabilities.*32|at most/i);
  assert.throws(() => validateRequestEnvelope({
    ...envelope({ preferredCapabilities: ["beta-operation"] }),
    unexpectedPreferenceControl: true,
  }), /exact fields|unexpected/i);
  assert.throws(() => routeCapabilities({
    envelope: envelope({ preferredCapabilities: ["unknown-operation"] }),
    cards: [alpha(), beta()],
  }), /preferred.*unknown|unknown.*preferred/i);
  assert.throws(() => routeCapabilities({
    envelope: envelope({
      forbiddenCapabilities: ["beta-operation"],
      preferredCapabilities: ["beta-operation"],
    }),
    cards: [alpha(), beta()],
  }), /preferred.*forbidden|forbidden.*preferred/i);
  assert.throws(() => routeCapabilities({
    envelope: envelope(),
    cards: [alpha(), beta()],
    semanticCandidateIds: ["alpha-operation"],
  }), /semanticCandidateIds.*preference|preference.*semanticCandidateIds/i);

  const cards = [alpha(), beta()];
  const proposal = {
    schemaVersion: 1,
    candidateIds: ["alpha-operation", "beta-operation"],
    requiredCapabilities: ["operation"],
    requestedEffects: ["local-read"],
    unresolvedDecisions: [],
  };
  const betaRequest = { ...naturalRequest({ preferredCapabilities: ["beta-operation"] }), proposal };
  const { baseRequest } = splitPreferenceRequest(betaRequest);
  const baseReceipt = compileAndRouteHistorical({ request: baseRequest, cards }).compilerReceipt;
  const alphaRequest = {
    ...naturalRequest({ preferredCapabilities: ["alpha-operation"] }),
    proposal,
  };
  assert.throws(() => extendCompilerReceipt({
    baseReceipt,
    request: alphaRequest,
    preferredCapabilities: ["beta-operation"],
  }), /preference.*mismatch|request.*preference/i);
});

test("bounded retrieval retains known preferences and refuses union truncation", () => {
  const index = buildRoutingIndex([
    card("alpha-operation"),
    card("beta-operation", { family: "other-family", provides: ["other-operation"] }),
  ]);
  const shortlist = shortlistRoutingCards(index, envelope({
    preferredCapabilities: ["beta-operation"],
  }), { limit: 32 });
  assert.deepEqual(shortlist.map(({ id }) => id), ["alpha-operation", "beta-operation"]);
  assert.throws(() => shortlistRoutingCards(index, envelope({
    preferredCapabilities: ["unknown-operation"],
  }), { limit: 32 }), /unknown.*preferred|preferred.*unknown/i);

  const many = Array.from({ length: 33 }, (_, index_) => card(
    `skill-${String(index_).padStart(2, "0")}`,
    index_ === 32
      ? {}
      : { family: "other-family", provides: [`other-${String(index_).padStart(2, "0")}`] },
  ));
  const manyIndex = buildRoutingIndex(many);
  assert.throws(() => shortlistRoutingCards(manyIndex, envelope({
    preferredCapabilities: many.slice(0, 32).map(({ id }) => id).sort(),
  }), { limit: 32 }), /shortlist.*32|bounded.*32|overflow/i);
});

test("a preference-only dependency cannot expand the semantic route set", () => {
  const cards = [
    card("alpha-a", {
      provides: ["alpha-extra", "part-a"],
      compatibleWith: ["alpha-b", "alpha-c"],
    }),
    card("alpha-b", {
      provides: ["part-b"],
      compatibleWith: ["alpha-a", "alpha-c"],
    }),
    card("alpha-c", {
      provides: ["part-c"],
      compatibleWith: ["alpha-a", "alpha-b"],
    }),
    card("beta-a", {
      provides: ["part-a", "part-b"],
      requires: ["support"],
      compatibleWith: ["beta-b", "beta-support"],
    }),
    card("beta-b", {
      provides: ["part-c"],
      compatibleWith: ["beta-a", "beta-support"],
    }),
    card("beta-support", {
      provides: ["support"],
      compatibleWith: ["beta-a", "beta-b"],
    }),
  ];
  const request = envelope({
    requiredCapabilities: ["part-a", "part-b", "part-c"],
    maxCompositionSize: 3,
    preferredCapabilities: ["beta-support"],
  });
  const shortlist = buildPreferenceRoutingShortlist(buildRoutingIndex(cards), request);
  assert.ok(shortlist.cards.some(({ id }) => id === "beta-support"));
  assert.ok(!shortlist.semanticCandidateIds.includes("beta-support"));
  const result = routeCapabilities({
    envelope: request,
    cards: shortlist.cards,
    semanticCandidateIds: shortlist.semanticCandidateIds,
  });
  assert.deepEqual(result.selectedIds, ["alpha-a", "alpha-b", "alpha-c"]);
  assert.equal(result.preference.applied, false);
  assert.equal(result.preference.reason, "preference-not-semantic-candidate");
  const forged = structuredClone(result);
  forged.preference.reason = "stronger-nonpreferred-selection";
  assert.throws(() => validateRouteReceipt(forged), /stronger|semantic|preference/i);
});

test("intent compilation copies exact preferences while omission stays historical", () => {
  const cards = [alpha(), beta()];
  const proposal = {
    schemaVersion: 1,
    candidateIds: ["alpha-operation", "beta-operation"],
    requiredCapabilities: ["operation"],
    requestedEffects: ["local-read"],
    unresolvedDecisions: [],
  };
  const historical = compileAndRoute({ request: { ...naturalRequest(), proposal }, cards });
  const historicalReference = compileAndRouteHistorical({
    request: { ...naturalRequest(), proposal },
    cards,
  });
  const preferred = compileAndRoute({
    request: {
      ...naturalRequest({ preferredCapabilities: ["beta-operation"] }),
      proposal,
    },
    cards,
  });

  assert.equal("preferredCapabilities" in historical.compilerReceipt.envelope, false);
  assert.equal("preference" in historical.routeReceipt, false);
  assert.deepEqual(historical, historicalReference);
  assert.deepEqual(preferred.compilerReceipt.envelope.preferredCapabilities, ["beta-operation"]);
  assert.deepEqual(preferred.routeReceipt.requestFeatures.preferredCapabilities, ["beta-operation"]);
  assert.deepEqual(preferred.routeReceipt.selectedIds, ["beta-operation"]);
});
