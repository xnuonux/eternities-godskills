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

function request(text, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `generalization-${text.length}`,
    text,
    context: {
      permittedEffects: ["external-read", "local-read", "local-write"],
      availableAuthority: ["external-read", "local-read", "local-write"],
      availablePreconditions: [],
      forbiddenCapabilities: [],
      maximumRisk: "high",
      minimumEvidenceConfidence: "verified",
      contextBudget: 6000,
      maxCompositionSize: 3,
      ...overrides,
    },
  };
}

test("proposal-assisted natural intent reaches an explicitly compatible composition", async () => {
  const mission = request(
    "audit the authorized security findings, implement the mitigations, run tests, and verify the repository repair",
    {
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
    },
  );
  mission.proposal = {
    schemaVersion: 1,
    candidateIds: ["eternities-aegis", "eternities-forge"],
    requiredCapabilities: ["implementation", "mitigation", "tests", "verification"],
    requestedEffects: ["local-read", "local-write"],
    unresolvedDecisions: [],
  };

  const result = compileAndRoute({ request: mission, cards: await cards() });

  assert.deepEqual(result.compilerReceipt.acceptedProposalIds, [
    "eternities-aegis",
    "eternities-forge",
  ]);
  assert.deepEqual(result.compilerReceipt.envelope.candidateFamilies, [
    "governance-security",
    "implementation-engineering",
  ]);
  assert.equal(result.routeReceipt.status, "selected");
  assert.deepEqual(result.routeReceipt.selectedIds, [
    "eternities-aegis",
    "eternities-forge",
  ]);
});

test("negated deployment does not create an external production mutation", async () => {
  const result = compileAndRoute({
    request: request(
      "create local production-readiness gates and tests, but do not deploy it or restart production",
      {
        permittedEffects: ["local-read", "local-write"],
        availableAuthority: ["local-read", "local-write", "repository-write"],
        availablePreconditions: ["repository-present", "settled-outcome"],
      },
    ),
    cards: await cards(),
  });

  assert.ok(!result.compilerReceipt.requestedEffects.includes("external-write"));
  assert.ok(!result.compilerReceipt.unresolvedDecisions.includes("authority:production-write"));
  assert.ok(!result.compilerReceipt.unresolvedDecisions.includes("effect-authority:external-write"));
});

test("do-not-forget deployment remains a positive external production mutation", async () => {
  const result = compileAndRoute({
    request: request("do not forget to deploy the production service", {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
    }),
    cards: await cards(),
  });

  assert.ok(result.compilerReceipt.requestedEffects.includes("external-write"));
  assert.ok(result.compilerReceipt.unresolvedDecisions.includes("authority:production-write"));
  assert.ok(result.compilerReceipt.unresolvedDecisions.includes("effect-authority:external-write"));
});

test("do-not-forget publication remains a positive external publication request", async () => {
  const result = compileAndRoute({
    request: request("do not forget to publish the campaign", {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
    }),
    cards: await cards(),
  });

  assert.ok(result.compilerReceipt.requestedEffects.includes("external-write"));
  assert.ok(result.compilerReceipt.unresolvedDecisions.includes("authority:publication-authority"));
  assert.ok(result.compilerReceipt.unresolvedDecisions.includes("effect-authority:external-write"));
});

test("do-not-forget-that publication remains positive while an inner not remains negative", async () => {
  const positive = compileAndRoute({
    request: request("do not forget that we must publish the campaign", {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
    }),
    cards: await cards(),
  });
  const negative = compileAndRoute({
    request: request("do not forget that we must not publish the campaign", {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
    }),
    cards: await cards(),
  });

  assert.ok(positive.compilerReceipt.requestedEffects.includes("external-write"));
  assert.ok(!negative.compilerReceipt.requestedEffects.includes("external-write"));
});

test("not-only reversal cannot cross an inner negative publication clause", async () => {
  const positive = compileAndRoute({
    request: request("not only publish the campaign but also archive it", {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
    }),
    cards: await cards(),
  });
  const negative = compileAndRoute({
    request: request("not only did we not publish the campaign", {
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
    }),
    cards: await cards(),
  });

  assert.ok(positive.compilerReceipt.requestedEffects.includes("external-write"));
  assert.ok(!negative.compilerReceipt.requestedEffects.includes("external-write"));
});

test("latest official provider specification implies external research", async () => {
  const result = compileAndRoute({
    request: request(
      "compare the local adapter implementation with the latest official provider specification",
      {
        availableAuthority: ["external-read", "local-read"],
        permittedEffects: ["external-read", "local-read"],
      },
    ),
    cards: await cards(),
  });

  assert.ok(result.compilerReceipt.requestedEffects.includes("external-read"));
  assert.equal(result.compilerReceipt.candidateScores[0].id, "eternities-oracle");
});

test("adapter refactoring routes to implementation instead of a lexical integration tie", async () => {
  const result = compileAndRoute({
    request: request(
      "Refactor the local TypeScript adapter to make its observability hooks safer and easier to test.",
      {
        availableAuthority: [
          "explicit mutation or network authority when applicable",
          "local-read",
          "local-write",
        ],
        permittedEffects: ["local-read", "local-write"],
      },
    ),
    cards: await cards(),
  });

  assert.equal(result.routeReceipt.status, "selected");
  assert.deepEqual(result.routeReceipt.selectedIds, ["eternities-daedalus"]);
});

test("p99 trace diagnosis reaches bounded debugging", async () => {
  const result = compileAndRoute({
    request: request(
      "Diagnose a repeatable p99 latency spike from supplied traces and identify the smallest non-destructive repair.",
      {
        availableAuthority: ["local-read"],
        permittedEffects: ["local-read"],
      },
    ),
    cards: await cards(),
  });

  assert.equal(result.routeReceipt.status, "selected");
  assert.deepEqual(result.routeReceipt.selectedIds, ["eternities-phoenix"]);
});

test("no-spend positioning and organic search routes to marketing growth", async () => {
  const result = compileAndRoute({
    request: request(
      "Frame a no-spend positioning and organic search plan for a new analytics product using supplied survey results.",
      {
        availableAuthority: ["local-read", "local-write"],
        permittedEffects: ["local-read", "local-write"],
      },
    ),
    cards: await cards(),
  });

  assert.equal(result.routeReceipt.status, "selected");
  assert.deepEqual(result.routeReceipt.selectedIds, ["eternities-beacon"]);
});
