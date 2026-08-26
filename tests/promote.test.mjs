import test from "node:test";
import assert from "node:assert/strict";

import { decidePromotion } from "../src/promote.mjs";

const policy = {
  schemaVersion: 1,
  requireAllCritical: true,
  requireImprovement: true,
  requireResolvedEffects: true,
  minimumScore: 0.8,
  maximumTokenCount: 500,
  kindMinimums: {
    direct: 1,
    paraphrase: 1,
    exclusion: 1,
    conflict: 0.5,
  },
  improvementDimensions: [
    "score",
    "tokenCount",
    "direct",
    "paraphrase",
    "exclusion",
    "conflict",
    "sourceCoverage",
  ],
};

function evaluation(overrides = {}) {
  return {
    status: "evaluated",
    total: 4,
    passed: 4,
    criticalTotal: 3,
    criticalPassed: 3,
    score: 1,
    tokenCount: 200,
    kindScores: {
      direct: { total: 1, passed: 1, score: 1 },
      paraphrase: { total: 1, passed: 1, score: 1 },
      exclusion: { total: 1, passed: 1, score: 1 },
      conflict: { total: 1, passed: 1, score: 1 },
    },
    unresolvedEffects: [],
    improvements: [],
    ...overrides,
  };
}

test("critical regression blocks promotion even when average score rises", () => {
  const decision = decidePromotion({
    baseline: evaluation({
      criticalTotal: 4,
      criticalPassed: 4,
      score: 0.8,
      improvements: [],
    }),
    candidate: evaluation({
      criticalTotal: 4,
      criticalPassed: 3,
      score: 0.95,
      improvements: ["score"],
    }),
    policy,
  });
  assert.equal(decision.status, "blocked");
  assert.ok(decision.failedGates.includes("all-critical"));
});

test("unknown executable baseline cannot produce a superiority claim", () => {
  const candidate = evaluation({ improvements: ["score"] });
  const decision = decidePromotion({ baseline: null, candidate, policy });
  assert.equal(decision.status, "unverified");
  assert.match(decision.reasons[0], /baseline/);
});

test("missing candidate evidence stays experimental", () => {
  assert.equal(
    decidePromotion({ baseline: evaluation(), candidate: null, policy }).status,
    "experimental",
  );
});

test("kind thresholds, token budgets, and unresolved effects fail closed", () => {
  const baseline = evaluation({ score: 0.8, tokenCount: 300 });
  const decision = decidePromotion({
    baseline,
    candidate: evaluation({
      tokenCount: 501,
      kindScores: {
        ...evaluation().kindScores,
        exclusion: { total: 1, passed: 0, score: 0 },
      },
      unresolvedEffects: ["filesystem target"],
      improvements: ["sourceCoverage"],
    }),
    policy,
  });

  assert.equal(decision.status, "blocked");
  assert.ok(decision.failedGates.includes("kind:exclusion"));
  assert.ok(decision.failedGates.includes("token-budget"));
  assert.ok(decision.failedGates.includes("resolved-effects"));
});

test("passing gates without a measured improvement remains unverified", () => {
  const baseline = evaluation();
  const candidate = evaluation();
  const decision = decidePromotion({ baseline, candidate, policy });

  assert.equal(decision.status, "unverified");
  assert.deepEqual(decision.improvements, []);
});

test("candidate promotes only with all gates and a policy-listed improvement", () => {
  const baseline = evaluation({ score: 0.75, tokenCount: 300 });
  const candidate = evaluation({
    score: 1,
    tokenCount: 250,
    improvements: ["sourceCoverage", "unlisted-claim"],
  });
  const decision = decidePromotion({ baseline, candidate, policy });

  assert.equal(decision.status, "promoted");
  assert.deepEqual(decision.failedGates, []);
  assert.deepEqual(decision.improvements, ["score", "sourceCoverage", "tokenCount"]);
});
