import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileAndRoute } from "../src/intent-runtime.mjs";

async function evaluator() {
  return import("../scripts/evaluate-applicability-study.mjs").catch(error =>
    assert.fail(`offline applicability evaluator is missing: ${error.message}`));
}
const cards = (await readFile(new URL("../artifacts/routing/cards.jsonl", import.meta.url), "utf8"))
  .trim().split(/\r?\n/).map(JSON.parse);
const example = {
  id: "sort", text: "Sort 19, 2, 11, 7 from local source material.", category: "benign-local",
  annotation: { operationQuote: "Sort", deliverableQuote: "19, 2, 11, 7",
    applicableIds: [], disposition: "inapplicable", reason: "Sorting numbers is not document production.", evidence: [] },
  requiredEffects: ["local-read"], requiredDecisions: [],
};
function dataset(cases = [example]) {
  return { schemaVersion: 1, partition: "development", authorThreadId: "test-author",
    frozenAgainst: "082cf8c5edd4d8f37e7d3cd2445cd64ca2b55f28", cases };
}
test("records an unrelated clean admission instead of counting it as success", async () => {
  const { evaluatePartition } = await evaluator();
  const result = evaluatePartition({ dataset: dataset(), cards, run: compileAndRoute });
  assert.equal(result.metrics.unrelatedCleanAdmissions, 1);
  assert.deepEqual(result.rows[0].unrelatedSelectedIds, ["eternities-logos"]);
  assert.equal(result.rows[0].expectedDisposition, "inapplicable");
});
test("does not let expected labels affect the actual replayed compiler receipt", async () => {
  const { evaluatePartition } = await evaluator();
  const alternate = structuredClone(example);
  alternate.annotation = { ...alternate.annotation, disposition: "applicable", applicableIds: ["eternities-logos"],
    evidence: [{ cardId: "eternities-logos", path: "skills/eternities-logos/SKILL.md", quote: "technical writing" }] };
  const a = evaluatePartition({ dataset: dataset(), cards, run: compileAndRoute });
  const b = evaluatePartition({ dataset: dataset([alternate]), cards, run: compileAndRoute });
  assert.deepEqual(a.rows[0].compilerReceipt, b.rows[0].compilerReceipt);
  assert.deepEqual(a.rows[0].routeReceipt, b.rows[0].routeReceipt);
  assert.equal(b.metrics.unrelatedCleanAdmissions, 0);
});
test("keeps applicability separate from authority using paired contexts", async () => {
  const { evaluatePartition } = await evaluator();
  const text = "Select a model runtime and hardware configuration with measured latency, memory and throughput budgets.";
  const value = { ...example, id: "compute", text, category: "supported-or-external",
    annotation: { ...example.annotation, operationQuote: "Select", deliverableQuote: "model runtime and hardware configuration",
      applicableIds: ["eternities-hephaestus"], disposition: "applicable",
      evidence: [{ cardId: "eternities-hephaestus", path: "skills/eternities-hephaestus/SKILL.md", quote: "model choice" }] },
    requiredDecisions: ["authority:external-read"], authorityVariants: [{ name: "authorized-read",
      permittedEffects: ["external-read", "local-read", "local-write"],
      availableAuthority: ["external-read", "local-read", "local-write", "repository-write"] }] };
  const result = evaluatePartition({ dataset: dataset([value]), cards, run: compileAndRoute });
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map(row => row.missingApplicableCandidates), [[], []]);
  assert.deepEqual(result.rows.map(row => row.routeReceipt.status), ["needs-decision", "selected"]);
  assert.equal(result.metrics.missingRequiredDecisions, 0);
});
test("rejects duplicate identities and fabricated request spans before replay", async () => {
  const { evaluatePartition } = await evaluator();
  assert.throws(() => evaluatePartition({ dataset: dataset([example, example]), cards, run: compileAndRoute }), /duplicate/i);
  const bad = structuredClone(example);
  bad.annotation.operationQuote = "not in request";
  assert.throws(() => evaluatePartition({ dataset: dataset([bad]), cards, run: compileAndRoute }), /quote|span/i);
});
test("uncertain annotations cannot produce false positive or success metrics", async () => {
  const { evaluatePartition } = await evaluator();
  const value = structuredClone(example);
  value.annotation.disposition = "uncertain";
  const result = evaluatePartition({ dataset: dataset([value]), cards, run: compileAndRoute });
  assert.equal(result.metrics.uncertainRows, 1);
  assert.equal(result.metrics.unrelatedCleanAdmissions, 0);
  assert.equal(result.rows[0].applicabilityScored, false);
});
