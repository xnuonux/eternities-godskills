import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function json(relative) {
  try {
    return JSON.parse(await readFile(new URL(relative, root), "utf8"));
  } catch (error) {
    assert.fail(`required adaptive activation artifact is missing or invalid: ${relative}: ${error.message}`);
  }
}

async function compiler() {
  try {
    return await import("../src/adaptive-activation.mjs");
  } catch (error) {
    assert.fail(`adaptive activation compiler is unavailable: ${error.message}`);
  }
}

const task = (overrides = {}) => ({
  taskClass: "creative-generation",
  consequenceClass: "consequential",
  authorityProjection: {
    availableAuthority: ["local-read", "local-write"],
    permittedEffects: ["local-read", "local-write"],
  },
  ...overrides,
});

test("reviewed visual evidence rejects unconditional Muse method activation", async () => {
  const [contract, policy, evidence] = await Promise.all([
    json("artifacts/adaptive-activation/neutral-contract.json"),
    json("policies/adaptive-activation.v1.json"),
    json("artifacts/adaptive-activation/evidence.v1.json"),
  ]);

  assert.equal(contract.id, "adaptive-amplification-v1");
  assert.deepEqual(contract.effects, ["read"]);
  assert.deepEqual(policy.modes, ["native", "guardrail", "method", "review"]);
  assert.deepEqual(policy.methodEvidence, {
    minimumMatchedEvaluations: 3,
    minimumWins: 2,
    minimumWinRate: 0.6666666666666666,
    maximumCriticalRegressions: 0,
    maximumOverheadRatio: 1.35,
  });

  assert.equal(evidence.partition, "development");
  assert.equal(evidence.reviewed, true);
  assert.equal(evidence.sources[0].commit, "265d40d121463de5f3b6215bf513db851ccb8f3b");
  assert.deepEqual(evidence.sources[0].artifacts, [
    {
      path: "provenance/manifest.json",
      sha256: "0c669f70e728e65ee8069e17a9e9ccb5502b4d72c35003740b838e115139d11d",
    },
    {
      path: "verdicts/muse-v4-replication.json",
      sha256: "b3d8c0d2f56b3b62777b3a4813c1889e47f532c45b2c87b839e8111ccf284e07",
    },
    {
      path: "verdicts/white-fire.json",
      sha256: "d8e3eefaba9e8e288cccd2f28f548a2920ff240576876aa6871b57f87d82c984",
    },
  ]);

  const muse = evidence.profiles.find(({ capabilityId }) => capabilityId === "eternities-muse");
  assert.deepEqual({
    taskClass: muse.taskClass,
    matchedEvaluations: muse.matchedEvaluations,
    wins: muse.wins,
    losses: muse.losses,
    ties: muse.ties,
    criticalRegressions: muse.criticalRegressions,
    methodEligible: muse.methodEligible,
    preferredMode: muse.preferredMode,
  }, {
    taskClass: "creative-generation",
    matchedEvaluations: 4,
    wins: 1,
    losses: 3,
    ties: 0,
    criticalRegressions: 0,
    methodEligible: false,
    preferredMode: "review",
  });
  assert.equal(JSON.stringify(evidence).includes('"verbatim"'), false);
});

test("mixed Muse evidence defers method until after the native creative attempt", async () => {
  const [{ compileActivationDecision }, policy, evidence] = await Promise.all([
    compiler(),
    json("policies/adaptive-activation.v1.json"),
    json("artifacts/adaptive-activation/evidence.v1.json"),
  ]);
  const decision = compileActivationDecision({
    selectedId: "eternities-muse",
    task: task(),
    reviewAvailable: true,
    policy,
    evidence,
  });

  assert.equal(decision.mode, "review");
  assert.equal(decision.preInferenceDisclosure, "none");
  assert.equal(decision.deferredReview, true);
  assert.equal(decision.methodEvidence.eligible, false);
  assert.deepEqual(decision.authorityProjection, task().authorityProjection);
  assert.match(decision.policyDigest, /^[a-f0-9]{64}$/);
  assert.match(decision.evidenceDigest, /^[a-f0-9]{64}$/);
  assert.match(decision.decisionDigest, /^[a-f0-9]{64}$/);
});

test("review fallback preserves only consequential guardrails and leaves low-risk work native", async () => {
  const [{ compileActivationDecision }, policy, evidence] = await Promise.all([
    compiler(),
    json("policies/adaptive-activation.v1.json"),
    json("artifacts/adaptive-activation/evidence.v1.json"),
  ]);
  const consequential = compileActivationDecision({
    selectedId: "eternities-muse",
    task: task(),
    reviewAvailable: false,
    policy,
    evidence,
  });
  const low = compileActivationDecision({
    selectedId: "eternities-muse",
    task: task({ consequenceClass: "low" }),
    reviewAvailable: false,
    policy,
    evidence,
  });

  assert.deepEqual(
    [consequential.mode, consequential.preInferenceDisclosure, low.mode, low.preInferenceDisclosure],
    ["guardrail", "guardrails-only", "native", "none"],
  );
});

test("replicated positive evidence or explicit intent can earn full method without changing authority", async () => {
  const [{ compileActivationDecision }, policy] = await Promise.all([
    compiler(),
    json("policies/adaptive-activation.v1.json"),
  ]);
  const positiveEvidence = {
    schemaVersion: 1,
    id: "synthetic-held-out-positive",
    partition: "held-out",
    reviewed: true,
    profiles: [{
      capabilityId: "eternities-phoenix",
      taskClass: "debugging-recovery",
      matchedEvaluations: 4,
      wins: 3,
      losses: 1,
      ties: 0,
      criticalRegressions: 0,
      maximumObservedOverheadRatio: 1.2,
      methodEligible: true,
      preferredMode: "method",
    }],
  };
  const debuggingTask = task({ taskClass: "debugging-recovery" });
  const evidenced = compileActivationDecision({
    selectedId: "eternities-phoenix",
    task: debuggingTask,
    reviewAvailable: true,
    policy,
    evidence: positiveEvidence,
  });
  const explicit = compileActivationDecision({
    selectedId: "eternities-muse",
    task: task(),
    explicitMethodRequest: true,
    reviewAvailable: true,
    policy,
    evidence: null,
  });

  assert.equal(evidenced.mode, "method");
  assert.equal(evidenced.preInferenceDisclosure, "entrypoint-and-contract");
  assert.equal(explicit.mode, "method");
  assert.deepEqual(evidenced.authorityProjection, debuggingTask.authorityProjection);
  assert.deepEqual(explicit.authorityProjection, task().authorityProjection);
});

test("malformed, unreviewed, or self-contradictory evidence cannot steer activation", async () => {
  const [{ compileActivationDecision }, policy] = await Promise.all([
    compiler(),
    json("policies/adaptive-activation.v1.json"),
  ]);
  const base = {
    schemaVersion: 1,
    id: "invalid-evidence",
    partition: "development",
    reviewed: true,
    profiles: [{
      capabilityId: "eternities-muse",
      taskClass: "creative-generation",
      matchedEvaluations: 4,
      wins: 1,
      losses: 3,
      ties: 0,
      criticalRegressions: 0,
      maximumObservedOverheadRatio: 1.2,
      methodEligible: true,
      preferredMode: "method",
    }],
  };
  assert.throws(() => compileActivationDecision({
    selectedId: "eternities-muse", task: task(), policy, evidence: { ...base, reviewed: false },
  }), /reviewed/i);
  assert.throws(() => compileActivationDecision({
    selectedId: "eternities-muse", task: task(), policy, evidence: base,
  }), /contradict/i);
  assert.throws(() => compileActivationDecision({
    selectedId: "eternities-muse", task: task(), policy: { ...policy, modes: ["method"] }, evidence: null,
  }), /mode|policy/i);
});
