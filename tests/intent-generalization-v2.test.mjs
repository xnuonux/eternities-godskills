import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileAndRoute } from "../src/intent-runtime.mjs";

const root = new URL("../", import.meta.url);

async function cards() {
  return (await readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
}

function request(text) {
  return {
    schemaVersion: 1,
    requestId: `compiler-v2-${text.length}`,
    text,
    context: {
      permittedEffects: ["local-read", "local-write"],
      availableAuthority: [
        "authorized-security-scope",
        "local-read",
        "local-write",
        "repository-write",
      ],
      availablePreconditions: [
        "authorized-target",
        "repository-present",
        "settled-outcome",
      ],
      forbiddenCapabilities: [],
      maximumRisk: "high",
      minimumEvidenceConfidence: "verified",
      contextBudget: 6000,
      maxCompositionSize: 3,
    },
  };
}

function syntheticCard({ id, family, intent, provides, compatibleWith }) {
  return {
    schemaVersion: 1,
    id,
    family,
    intent,
    successCondition: `${intent} produces verified local evidence`,
    provides,
    requires: [],
    intentExamples: {
      direct: [intent],
      paraphrased: [`perform ${intent}`],
      contextual: [`the mission requires ${intent}`],
    },
    negativeIntents: [`unrelated to ${intent}`],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith,
    conflictsWith: [],
    contextCost: 100,
    dependencyCost: 0,
    evidenceConfidence: "verified",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: [],
  };
}

test("natural capability evidence reaches the smallest compatible composition without a proposal", async () => {
  const result = compileAndRoute({
    request: request(
      "audit the authorized security findings and mitigations, then implement the repository repair with tests and verification",
    ),
    cards: await cards(),
  });

  assert.equal(result.compilerReceipt.mode, "deterministic");
  assert.deepEqual(result.compilerReceipt.acceptedProposalIds, []);
  assert.deepEqual(result.compilerReceipt.envelope.candidateFamilies, [
    "governance-security",
    "implementation-engineering",
  ]);
  assert.equal(result.routeReceipt.status, "selected");
  assert.equal(result.routeReceipt.selectionKind, "composition");
  assert.deepEqual(result.routeReceipt.selectedIds, [
    "eternities-aegis",
    "eternities-forge",
  ]);
});

test("natural composition is card-driven rather than tied to Eternities skill names", () => {
  const values = [
    syntheticCard({
      id: "alpha-audit",
      family: "evidence-audit",
      intent: "audit evidence and analyze risk",
      provides: ["evidence-audit", "risk-analysis"],
      compatibleWith: ["beta-design"],
    }),
    syntheticCard({
      id: "beta-design",
      family: "interface-design",
      intent: "design interface and verify accessibility",
      provides: ["accessibility-verification", "interface-design"],
      compatibleWith: ["alpha-audit"],
    }),
  ];
  const mission = request(
    "audit the evidence and analyze risk, then design the interface and verify accessibility",
  );
  mission.context.permittedEffects = ["local-read"];
  mission.context.availableAuthority = ["local-read"];
  mission.context.availablePreconditions = [];
  mission.context.maximumRisk = "low";

  const result = compileAndRoute({ request: mission, cards: values });

  assert.equal(result.routeReceipt.selectionKind, "composition");
  assert.deepEqual(result.routeReceipt.selectedIds, ["alpha-audit", "beta-design"]);
});

test("generic workflow language cannot inflate one security mission into a composition", async () => {
  const result = compileAndRoute({
    request: request(
      "review security permissions across the authorized workflow and identify the smallest residual-risk reductions",
    ),
    cards: await cards(),
  });

  assert.equal(result.routeReceipt.status, "selected");
  assert.equal(result.routeReceipt.selectionKind, "single");
  assert.deepEqual(result.routeReceipt.selectedIds, ["eternities-aegis"]);
});

test("broad unresolved multi-domain language still pauses instead of composing", async () => {
  const result = compileAndRoute({
    request: request(
      "coordinate research, design, implementation, and communication into one answer for the launch",
    ),
    cards: await cards(),
  });

  assert.equal(result.routeReceipt.status, "needs-decision");
  assert.deepEqual(result.routeReceipt.selectedIds, []);
  assert.ok(result.compilerReceipt.unresolvedDecisions.includes("intent-ambiguous"));
});
