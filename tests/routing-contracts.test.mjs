import test from "node:test";
import assert from "node:assert/strict";

import {
  EFFECT_COSTS,
  EVIDENCE_LEVELS,
  RISK_LEVELS,
  ROUTE_STATUSES,
  ROUTING_EFFECTS,
  effectCost,
  evidenceAtLeast,
  riskAtMost,
  validateRequestEnvelope,
  validateRouteReceipt,
  validateRoutingCard,
} from "../src/routing-contracts.mjs";

function envelope(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "request-commandless-feature",
    outcome: "deliver a consequential feature with tests, review, and proof",
    candidateFamilies: ["implementation-engineering"],
    requiredCapabilities: ["implementation", "review", "tests", "verification"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write", "repository-write"],
    availablePreconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "medium",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
    ...overrides,
  };
}

function card(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "eternities-forge",
    family: "implementation-engineering",
    intent: "deliver a consequential multi-stage software change",
    successCondition: "implementation, review, and verification are evidenced",
    provides: ["implementation", "integration", "review", "tests", "verification"],
    requires: [],
    intentExamples: {
      direct: ["deliver a consequential feature across several engineering phases"],
      paraphrased: [
        "carry this approved change through implementation, review, and proof",
      ],
      contextual: ["the design is settled and now needs a verified repository delivery"],
    },
    negativeIntents: ["routine one-file edit"],
    effects: ["local-read", "local-write"],
    riskClass: "moderate",
    authorityRequirements: ["local-read", "local-write", "repository-write"],
    preconditions: ["repository-present", "settled-outcome"],
    compatibleWith: ["eternities-aegis", "eternities-architect", "eternities-oracle"],
    conflictsWith: [],
    contextCost: 998,
    dependencyCost: 8,
    evidenceConfidence: "verified",
    entrypoint: "skills/eternities-forge/SKILL.md",
    legacyAliases: [],
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "request-commandless-feature",
    requestDigest: "a".repeat(64),
    status: "selected",
    selectionKind: "single",
    requestFeatures: {
      candidateFamilies: ["implementation-engineering"],
      requiredCapabilities: ["implementation", "review", "tests", "verification"],
      permittedEffects: ["local-read", "local-write"],
      maximumRisk: "moderate",
      minimumEvidenceConfidence: "medium",
      contextBudget: 4000,
    },
    candidateIds: ["eternities-forge"],
    selectedIds: ["eternities-forge"],
    selectedEntrypoints: ["skills/eternities-forge/SKILL.md"],
    selectionConfidence: "verified",
    rejected: [],
    unresolvedDecisions: [],
    decisionPolicy:
      "coverage>card-count>extra-capabilities>effects>context>dependencies>evidence>id",
    ...overrides,
  };
}

test("portable routing contracts accept a complete commandless request", () => {
  assert.equal(validateRequestEnvelope(envelope()).requestId, "request-commandless-feature");
  assert.equal(validateRoutingCard(card()).id, "eternities-forge");
  assert.equal(validateRouteReceipt(receipt()).status, "selected");
});

test("routing vocabularies expose stable effect, risk, evidence, and status domains", () => {
  assert.deepEqual(ROUTING_EFFECTS, [
    "none",
    "local-read",
    "external-read",
    "local-write",
    "external-write",
  ]);
  assert.deepEqual(RISK_LEVELS, ["low", "moderate", "high", "critical"]);
  assert.deepEqual(EVIDENCE_LEVELS, ["verified", "high", "medium", "low"]);
  assert.deepEqual(ROUTE_STATUSES, [
    "selected",
    "needs-decision",
    "no-qualified-route",
  ]);
  assert.equal(EFFECT_COSTS["external-write"], 5);
});

test("effect, risk, and evidence comparisons preserve least-authority ordering", () => {
  assert.ok(effectCost(["local-read", "local-write"]) < effectCost(["external-write"]));
  assert.equal(effectCost(["local-read", "local-read"]), 1);
  assert.equal(riskAtMost("moderate", "moderate"), true);
  assert.equal(riskAtMost("high", "moderate"), false);
  assert.equal(evidenceAtLeast("verified", "medium"), true);
  assert.equal(evidenceAtLeast("low", "medium"), false);
});

test("request validation rejects missing authority and invalid routing bounds", () => {
  assert.throws(
    () => validateRequestEnvelope(envelope({ availableAuthority: undefined })),
    /availableAuthority must be an array of strings/,
  );
  assert.throws(
    () => validateRequestEnvelope(envelope({ requiredCapabilities: [] })),
    /requiredCapabilities must not be empty/,
  );
  assert.throws(
    () => validateRequestEnvelope(envelope({ contextBudget: -1 })),
    /contextBudget must be an integer from 1/,
  );
  assert.throws(
    () => validateRequestEnvelope(envelope({ maxCompositionSize: 4 })),
    /maxCompositionSize must be an integer from 1 to 3/,
  );
});

test("request and card validation reject unknown policy vocabulary", () => {
  assert.throws(
    () => validateRequestEnvelope(envelope({ maximumRisk: "extreme" })),
    /maximumRisk contains unknown value: extreme/,
  );
  assert.throws(
    () =>
      validateRequestEnvelope(envelope({ minimumEvidenceConfidence: "absolute" })),
    /minimumEvidenceConfidence contains unknown value: absolute/,
  );
  assert.throws(
    () => validateRoutingCard(card({ effects: ["shell"] })),
    /effects contains unknown value: shell/,
  );
});

test("canonical set arrays reject duplicates and unstable order", () => {
  assert.throws(
    () =>
      validateRequestEnvelope(
        envelope({ requiredCapabilities: ["tests", "implementation"] }),
      ),
    /requiredCapabilities must be lexically sorted/,
  );
  assert.throws(
    () => validateRoutingCard(card({ provides: ["tests", "tests"] })),
    /provides must not contain duplicates/,
  );
});

test("routing cards reject unsafe or non-entrypoint paths", () => {
  assert.throws(
    () => validateRoutingCard(card({ entrypoint: "C:/skills/forge/SKILL.md" })),
    /entrypoint must be a normalized relative path/,
  );
  assert.throws(
    () => validateRoutingCard(card({ entrypoint: "skills/../forge/SKILL.md" })),
    /entrypoint must not contain parent traversal/,
  );
  assert.throws(
    () => validateRoutingCard(card({ entrypoint: "skills/forge/README.md" })),
    /entrypoint must end in SKILL.md/,
  );
});

test("routing cards require all three commandless intent-example classes", () => {
  assert.throws(
    () =>
      validateRoutingCard(
        card({ intentExamples: { direct: ["deliver this"], paraphrased: [], contextual: [] } }),
      ),
    /intentExamples.paraphrased must not be empty/,
  );
});

test("route receipts reconcile selection identity, digest, and terminal status", () => {
  assert.throws(
    () => validateRouteReceipt(receipt({ requestDigest: "abc" })),
    /requestDigest must be a 64-character lowercase hex digest/,
  );
  assert.throws(
    () => validateRouteReceipt(receipt({ selectedEntrypoints: [] })),
    /selectedIds and selectedEntrypoints must have equal length/,
  );
  assert.throws(
    () =>
      validateRouteReceipt(
        receipt({ status: "no-qualified-route", selectionKind: "none" }),
      ),
    /no-qualified-route receipt must not contain a selection/,
  );
  assert.doesNotThrow(() =>
    validateRouteReceipt(
      receipt({
        status: "needs-decision",
        selectionKind: "none",
        selectedIds: [],
        selectedEntrypoints: [],
        selectionConfidence: null,
        unresolvedDecisions: ["confirm repository write authority"],
      }),
    ),
  );
});
