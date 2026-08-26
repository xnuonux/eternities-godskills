import test from "node:test";
import assert from "node:assert/strict";

import { evaluateSuite } from "../src/evaluate.mjs";

const cases = [
  { id: "direct", kind: "direct", critical: true, expected: "route" },
  { id: "paraphrase", kind: "paraphrase", critical: true, expected: "route" },
  { id: "exclusion", kind: "exclusion", critical: true, expected: "skip" },
  { id: "conflict", kind: "conflict", critical: false, expected: "defer" },
];

test("evaluation scores exact outcomes by kind and aggregates token evidence", () => {
  const evaluation = evaluateSuite(cases, [
    { id: "direct", actual: "route", tokenCount: 20 },
    { id: "paraphrase", actual: "route", tokenCount: 25 },
    { id: "exclusion", actual: "skip", tokenCount: 10 },
    { id: "conflict", actual: "defer", tokenCount: 15 },
  ]);

  assert.equal(evaluation.status, "evaluated");
  assert.equal(evaluation.total, 4);
  assert.equal(evaluation.passed, 4);
  assert.equal(evaluation.criticalPassed, 3);
  assert.equal(evaluation.score, 1);
  assert.equal(evaluation.tokenCount, 70);
  assert.deepEqual(evaluation.kindScores.direct, { total: 1, passed: 1, score: 1 });
});

test("missing results fail closed, including critical cases", () => {
  const evaluation = evaluateSuite(cases, [
    { id: "direct", actual: "route", tokenCount: 20 },
  ]);

  assert.equal(evaluation.passed, 1);
  assert.equal(evaluation.criticalPassed, 1);
  assert.equal(evaluation.failures.length, 3);
  assert.match(evaluation.failures[0].reason, /missing result/);
});

test("evaluation rejects duplicate and unknown result ids", () => {
  assert.throws(
    () =>
      evaluateSuite(cases, [
        { id: "direct", actual: "route" },
        { id: "direct", actual: "route" },
      ]),
    /duplicate result id/,
  );
  assert.throws(
    () => evaluateSuite(cases, [{ id: "unknown", actual: true }]),
    /unknown result id/,
  );
});

test("unresolved effect declarations are preserved as promotion evidence", () => {
  const evaluation = evaluateSuite(
    [{ id: "write", kind: "direct", critical: true, expected: true }],
    [
      {
        id: "write",
        actual: true,
        tokenCount: 8,
        unresolvedEffects: ["network destination", "network destination"],
      },
    ],
  );

  assert.deepEqual(evaluation.unresolvedEffects, ["network destination"]);
});
