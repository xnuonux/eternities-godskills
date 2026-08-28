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
      "audit the authorized security findings, trust boundaries, and mitigations, then implement the repository repair with tests and verification",
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
  const reversed = compileAndRoute({ request: mission, cards: [...values].reverse() });

  assert.equal(result.routeReceipt.selectionKind, "composition");
  assert.deepEqual(result.routeReceipt.selectedIds, ["alpha-audit", "beta-design"]);
  assert.deepEqual(reversed, result);
});

test("two words from one provided capability do not count as two capabilities", () => {
  const values = [
    syntheticCard({
      id: "alpha-single",
      family: "alpha-family",
      intent: "alpha beta alpha beta",
      provides: ["alpha-beta"],
      compatibleWith: ["beta-single"],
    }),
    syntheticCard({
      id: "beta-single",
      family: "beta-family",
      intent: "gamma delta gamma delta",
      provides: ["gamma-delta"],
      compatibleWith: ["alpha-single"],
    }),
  ];
  const mission = request("alpha beta then gamma delta");
  mission.context.permittedEffects = ["local-read"];
  mission.context.availableAuthority = ["local-read"];
  mission.context.availablePreconditions = [];
  mission.context.maximumRisk = "low";

  const result = compileAndRoute({ request: mission, cards: values });

  assert.notEqual(result.routeReceipt.selectionKind, "composition");
});

test("an under-evidenced leading card cannot enter a natural composition", () => {
  const values = [
    syntheticCard({
      id: "alpha-leading",
      family: "alpha-family",
      intent: "alpha alpha alpha alpha mission",
      provides: ["alpha-work"],
      compatibleWith: ["beta-qualified"],
    }),
    syntheticCard({
      id: "beta-qualified",
      family: "beta-family",
      intent: "beta gamma mission",
      provides: ["beta-work", "gamma-proof"],
      compatibleWith: ["alpha-leading"],
    }),
  ];
  const mission = request("alpha alpha alpha alpha mission then beta work gamma proof");
  mission.context.permittedEffects = ["local-read"];
  mission.context.availableAuthority = ["local-read"];
  mission.context.availablePreconditions = [];
  mission.context.maximumRisk = "low";

  const result = compileAndRoute({ request: mission, cards: values });

  assert.notEqual(result.routeReceipt.selectionKind, "composition");
});

test("natural composition obeys the host maximum and never bypasses an incompatible leader", () => {
  const alpha = syntheticCard({
    id: "alpha-audit",
    family: "alpha-family",
    intent: "alpha audit evidence risk",
    provides: ["alpha-evidence", "alpha-risk"],
    compatibleWith: ["beta-design"],
  });
  const beta = syntheticCard({
    id: "beta-design",
    family: "beta-family",
    intent: "beta design interface access",
    provides: ["beta-access", "beta-interface"],
    compatibleWith: ["alpha-audit"],
  });
  const mission = request("alpha evidence risk then beta interface access");
  mission.context.permittedEffects = ["local-read"];
  mission.context.availableAuthority = ["local-read"];
  mission.context.availablePreconditions = [];
  mission.context.maximumRisk = "low";
  mission.context.maxCompositionSize = 1;
  const bounded = compileAndRoute({ request: mission, cards: [alpha, beta] });
  assert.notEqual(bounded.routeReceipt.selectionKind, "composition");

  mission.context.maxCompositionSize = 2;
  const composed = compileAndRoute({ request: mission, cards: [alpha, beta] });
  assert.equal(composed.routeReceipt.selectionKind, "composition");

  const incompatibleLeader = syntheticCard({
    id: "aardvark-leader",
    family: "leader-family",
    intent: "leader leader alpha beta gamma delta",
    provides: ["leader-alpha", "leader-beta"],
    compatibleWith: [],
  });
  const alternateMission = request(
    "leader alpha beta leader alpha beta then alpha evidence risk and beta interface access",
  );
  alternateMission.context.permittedEffects = ["local-read"];
  alternateMission.context.availableAuthority = ["local-read"];
  alternateMission.context.availablePreconditions = [];
  alternateMission.context.maximumRisk = "low";
  alternateMission.context.maxCompositionSize = 2;
  const alternate = compileAndRoute({
    request: alternateMission,
    cards: [incompatibleLeader, alpha, beta],
  });
  assert.notEqual(alternate.routeReceipt.selectionKind, "composition");
});

test("a contradictory compatible and conflicting relationship cannot compose", () => {
  const alpha = syntheticCard({
    id: "alpha-conflict",
    family: "alpha-family",
    intent: "alpha evidence risk",
    provides: ["alpha-evidence", "alpha-risk"],
    compatibleWith: ["beta-conflict"],
  });
  const beta = syntheticCard({
    id: "beta-conflict",
    family: "beta-family",
    intent: "beta interface access",
    provides: ["beta-access", "beta-interface"],
    compatibleWith: ["alpha-conflict"],
  });
  alpha.conflictsWith = ["beta-conflict"];
  beta.conflictsWith = ["alpha-conflict"];
  const mission = request("alpha evidence risk then beta interface access");
  mission.context.permittedEffects = ["local-read"];
  mission.context.availableAuthority = ["local-read"];
  mission.context.availablePreconditions = [];
  mission.context.maximumRisk = "low";

  const result = compileAndRoute({ request: mission, cards: [alpha, beta] });

  assert.notEqual(result.routeReceipt.selectionKind, "composition");
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

test("security-audit language requires scope even when another card leads the scores", async () => {
  const mission = request(
    "audit the security findings and mitigations, then implement the repository repair with tests and verification",
  );
  mission.context.availableAuthority = ["local-read", "local-write"];
  mission.context.availablePreconditions = [];
  const result = compileAndRoute({ request: mission, cards: await cards() });

  assert.equal(result.routeReceipt.status, "needs-decision");
  assert.deepEqual(result.routeReceipt.selectedIds, []);
  assert.ok(
    result.compilerReceipt.unresolvedDecisions.includes("authority:authorized-security-scope"),
  );
});
