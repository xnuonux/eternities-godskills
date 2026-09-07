import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileAndRoute } from "../src/intent-runtime.mjs";

const cards = (await readFile(new URL("../artifacts/routing/cards.jsonl", import.meta.url), "utf8"))
  .trim().split(/\r?\n/).map(JSON.parse);
const corpus = JSON.parse(await readFile(new URL("../data/local-reasoning-admission-review.v1.json", import.meta.url), "utf8"));

// Intentionally active red regressions, not skipped/TODO tests: this candidate
// is held until generic metadata padding no longer admits unrelated skills.
for (const { id, text } of corpus.cases) {
  test(`generic metadata must not admit an uncovered numerical task: ${id}`, () => {
    const result = compileAndRoute({ cards, request: {
      schemaVersion: 1, requestId: id, text,
      context: {
        permittedEffects: ["local-read", "local-write"],
        availableAuthority: ["local-read", "local-write", "repository-write"],
        availablePreconditions: ["repository-present", "settled-outcome"],
        forbiddenCapabilities: [], maximumRisk: "high", minimumEvidenceConfidence: "verified",
        contextBudget: 6000, maxCompositionSize: 3,
      },
    } });
    assert.deepEqual(result.compilerReceipt.envelope.candidateFamilies, []);
    assert.ok(result.compilerReceipt.unresolvedDecisions.includes("intent-not-understood"));
    assert.equal(result.routeReceipt.status, "needs-decision");
    assert.deepEqual(result.routeReceipt.selectedIds, []);
  });
}
