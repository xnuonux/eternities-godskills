import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileIntent } from "../src/intent-compiler.mjs";
import { compileAndRoute } from "../src/intent-runtime.mjs";

const cards = (await readFile(new URL("../artifacts/routing/cards.jsonl", import.meta.url), "utf8"))
  .trim().split(/\r?\n/).map(JSON.parse);
const localContext = {
  permittedEffects: ["local-read", "local-write"],
  availableAuthority: ["local-read", "local-write", "repository-write"],
  availablePreconditions: ["repository-present", "settled-outcome"],
  forbiddenCapabilities: [], maximumRisk: "high", minimumEvidenceConfidence: "verified",
  contextBudget: 6000, maxCompositionSize: 3,
};
function compile(text, values = cards, overrides = {}) {
  return compileIntent({ cards: values, request: {
    schemaVersion: 1, requestId: "local-ranking-regression", text,
    context: { ...localContext, ...overrides },
  } });
}

// Fixed before the scoring experiment: different task classes and generic padding,
// not just variants of the triggering scheduling objective.
const uncovered = [
  "Select the maximum-total-weight compatible subset of the supplied jobs. Produce one scheduling result",
  "Find the greatest common divisor of 252 and 105.",
  "Calculate the probability of two heads in three fair coin tosses.",
  "Sort the numbers 19, 2, 11, 7 in ascending order.",
  "Given A implies B and B implies C, does A imply C?",
  "Which path is shortest from A to C given edges A-B:2, B-C:3, A-C:9?",
  "Compute 17 times 23. Produce one result.",
  "Select the largest number from 3, 8, 2. Produce one result.",
];
for (const text of uncovered) {
  test(`uncovered local reasoning is explicit, not an unrelated skill: ${text}`, () => {
    const result = compile(text);
    assert.deepEqual(result.envelope.candidateFamilies, []);
    assert.ok(result.unresolvedDecisions.includes("intent-not-understood"));
    assert.ok(!result.unresolvedDecisions.includes("authority:external-read"));
    assert.deepEqual(result.requestedEffects, ["local-read"]);
    assert.deepEqual(result.suppliedAuthority, localContext.availableAuthority);
  });
}

test("generic one-result padding cannot invent a catalog capability", () => {
  for (const padding of ["", " Produce one result.", " Please produce one result for me."]) {
    const result = compile(`Compute 17 times 23.${padding}`);
    assert.deepEqual(result.envelope.candidateFamilies, []);
    assert.ok(result.unresolvedDecisions.includes("intent-not-understood"));
  }
});

function synthetic(overrides = {}) {
  return { ...cards.find(card => card.id === "eternities-logos"),
    id: "test-spectral", family: "spectral", intent: "spectral",
    successCondition: "spectral", provides: ["spectral"],
    intentExamples: { direct: ["spectral"], paraphrased: ["spectral"], contextual: ["spectral"] },
    negativeIntents: ["unrelated"], requires: [], preconditions: [],
    effects: ["local-read"], authorityRequirements: ["local-read"],
    compatibleWith: [], conflictsWith: [], ...overrides,
  };
}
test("one lexical token repeated across metadata is not independent evidence", () => {
  const result = compile("spectral", [synthetic()]);
  assert.deepEqual(result.envelope.candidateFamilies, []);
  assert.ok(result.unresolvedDecisions.includes("intent-not-understood"));
});
test("multiple independent capability tokens still qualify", () => {
  const result = compile("spectral resonance", [synthetic({ provides: ["spectral-resonance"] })]);
  assert.deepEqual(result.envelope.candidateFamilies, ["spectral"]);
  assert.ok(!result.unresolvedDecisions.includes("intent-not-understood"));
});

for (const [id, text] of [
  ["eternities-hephaestus", "Select a model runtime and hardware configuration with measured latency, memory and throughput budgets."],
  ["eternities-oracle", "Research the latest official provider API documentation and verify source provenance, uncertainty and evidence."],
  ["eternities-logos", "Produce technical documentation from supplied source material with explicit provenance and uncertainty."],
  ["eternities-forge", "Implement the repository repair with tests, independent review, verification and integration."],
]) {
  test(`supported contrasting domain remains reachable: ${id}`, () => {
    const result = compile(text, cards, {
      permittedEffects: ["external-read", "local-read", "local-write"],
      availableAuthority: ["external-read", ...localContext.availableAuthority],
    });
    assert.equal(result.candidateScores[0].id, id);
    assert.ok(result.envelope.candidateFamilies.includes(cards.find(card => card.id === id).family));
    assert.ok(!result.unresolvedDecisions.includes("intent-not-understood"));
    const routed = compileAndRoute({ cards, request: {
      schemaVersion: 1, requestId: "supported-ranking-control", text,
      context: { ...localContext,
        permittedEffects: ["external-read", "local-read", "local-write"],
        availableAuthority: ["external-read", ...localContext.availableAuthority],
      },
    } });
    assert.equal(routed.routeReceipt.status, "selected");
    assert.ok(routed.routeReceipt.selectedIds.includes(id));
  });
}
test("genuine model-runtime selection retains card authority even with external exclusion", () => {
  const text = "Select a model runtime and hardware configuration with measured latency, memory and throughput budgets";
  for (const suffix of ["", ", without tools or external actions."]) {
    const result = compile(text + suffix);
    assert.equal(result.candidateScores[0].id, "eternities-hephaestus");
    assert.ok(result.unresolvedDecisions.includes("authority:external-read"));
    assert.deepEqual(result.suppliedAuthority, localContext.availableAuthority);
  }
});
for (const [text, decision] of [
  ["Publish this campaign to every social account.", "authority:publication-authority"],
  ["Deploy this release to production and restart the live service.", "authority:production-write"],
  ["Buy advertisements and spend 2000 dollars.", "authority:spending-authority"],
]) {
  test(`real external action never becomes a local reasoning bypass: ${text}`, () => {
    const result = compile(text);
    assert.ok(result.requestedEffects.includes("external-write"));
    assert.ok(result.unresolvedDecisions.includes("effect-authority:external-write"));
    assert.ok(result.unresolvedDecisions.includes(decision));
    assert.deepEqual(result.suppliedAuthority, localContext.availableAuthority);
  });
}
