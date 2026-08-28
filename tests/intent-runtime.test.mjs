import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { compileAndRoute } from "../src/intent-runtime.mjs";

const root = new URL("../", import.meta.url);

async function cards() {
  return (await readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse);
}

function request(text, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "runtime-mission",
    text,
    context: {
      permittedEffects: ["external-read", "local-read", "local-write"],
      availableAuthority: [
        "external-read",
        "local-read",
        "local-write",
        "repository-write",
      ],
      availablePreconditions: ["repository-present", "settled-outcome"],
      forbiddenCapabilities: [],
      maximumRisk: "moderate",
      minimumEvidenceConfidence: "verified",
      contextBudget: 4000,
      maxCompositionSize: 3,
      ...overrides,
    },
  };
}

test("compile-and-route selects a Godskill from natural language", async () => {
  const result = compileAndRoute({
    request: request(
      "coordinate implementation, tests, independent review, verification, and integration for this settled release",
    ),
    cards: await cards(),
  });
  assert.equal(result.compilerReceipt.candidateScores[0].id, "eternities-forge");
  assert.equal(result.routeReceipt.status, "selected");
  assert.deepEqual(result.routeReceipt.selectedIds, ["eternities-forge"]);
  assert.ok(result.routeReceipt.candidateIds.length <= 32);
});

test("unknown and unsafe natural missions terminate before selection", async () => {
  const values = await cards();
  const unknown = compileAndRoute({
    request: request("tell me something nice about the afternoon"),
    cards: values,
  });
  assert.equal(unknown.routeReceipt.status, "needs-decision");
  assert.deepEqual(unknown.routeReceipt.selectedIds, []);
  assert.ok(unknown.compilerReceipt.unresolvedDecisions.includes("intent-not-understood"));

  const unsafe = compileAndRoute({
    request: request(
      "publish this campaign to every social account and spend 2000 dollars today",
      {
        permittedEffects: ["local-read", "local-write"],
        availableAuthority: ["local-read", "local-write"],
        availablePreconditions: [],
      },
    ),
    cards: values,
  });
  assert.equal(unsafe.routeReceipt.status, "needs-decision");
  assert.deepEqual(unsafe.routeReceipt.selectedIds, []);
  assert.ok(unsafe.compilerReceipt.unresolvedDecisions.includes("authority:spending-authority"));
});

test("compile-and-route is deterministic across repeated calls", async () => {
  const values = await cards();
  const mission = request(
    "redesign the branded interface, improve accessibility, and verify it visually",
  );
  const first = compileAndRoute({ request: mission, cards: values });
  const second = compileAndRoute({ request: mission, cards: values });
  assert.deepEqual(second, first);
});
