import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

async function protocol() {
  try {
    return await import("../src/adaptive-activation-protocol.mjs");
  } catch (error) {
    assert.fail(`adaptive activation protocol is unavailable: ${error.message}`);
  }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

const digest = (value) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const policyDigest = "1".repeat(64);
const evidenceDigest = "2".repeat(64);
const trustRootDigest = "3".repeat(64);

function authority(overrides = {}) {
  return {
    availableAuthority: ["realm:write"],
    permittedEffects: ["local-read", "local-write"],
    availablePreconditions: ["realm-observed"],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "verified",
    contextBudget: 16000,
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    schemaVersion: 1,
    protocolId: "eternities-godskills-activation-v1",
    requestId: "mission-a:source-a",
    trustRootDigest,
    classification: {
      taskClass: "implementation",
      consequenceClass: "consequential",
      reviewAvailable: true,
    },
    selected: [
      { selectedId: "eternities-forge", explicitMethodRequest: false },
      { selectedId: "eternities-aegis", explicitMethodRequest: true },
    ],
    authorityProjection: authority(),
    ...overrides,
  };
}

function unsignedDecision({
  selectedId,
  mode,
  disclosure,
  deferredReview,
  taskClass = "implementation",
  consequenceClass = "consequential",
} = {}) {
  return {
    schemaVersion: 1,
    selectedId,
    taskClass,
    consequenceClass,
    mode,
    reasonCodes: mode === "method" ? ["explicit-method-request"] : ["insufficient-method-evidence", "consequence-guardrails"],
    preInferenceDisclosure: disclosure,
    deferredReview,
    methodEvidence: {
      eligible: false,
      matchedEvaluations: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      criticalRegressions: 0,
      overheadRatio: null,
      failedGates: ["reviewed-task-class-evidence"],
    },
    policyDigest,
    evidenceDigest,
    authorityProjection: authority(),
    authorityExpanded: false,
  };
}

function decision(options) {
  const unsigned = unsignedDecision(options);
  return { ...unsigned, decisionDigest: digest(unsigned) };
}

function decisions() {
  return [
    decision({
      selectedId: "eternities-forge",
      mode: "guardrail",
      disclosure: "guardrails-only",
      deferredReview: false,
    }),
    decision({
      selectedId: "eternities-aegis",
      mode: "method",
      disclosure: "entrypoint-and-contract",
      deferredReview: false,
    }),
  ];
}

test("validates and freezes one closed activation request without mutating its input", async () => {
  const { validateActivationRequest } = await protocol();
  const input = request();
  const before = structuredClone(input);
  const validated = validateActivationRequest(input);

  assert.deepEqual(validated, before);
  assert.deepEqual(input, before);
  assert.notEqual(validated, input);
  assert.equal(Object.isFrozen(validated), true);
  assert.equal(Object.isFrozen(validated.classification), true);
  assert.equal(Object.isFrozen(validated.selected[0]), true);
  assert.equal(Object.isFrozen(validated.authorityProjection), true);
});

test("rejects request identity, field, selection, and ordering drift", async () => {
  const { validateActivationRequest } = await protocol();
  const cases = [
    [{ ...request(), schemaVersion: 2 }, /schema version/i],
    [{ ...request(), protocolId: "other" }, /protocol/i],
    [{ ...request(), requestId: "" }, /request id/i],
    [{ ...request(), trustRootDigest: "0" }, /trust root/i],
    [{ ...request(), extra: true }, /fields/i],
    [{ ...request(), selected: [] }, /one to three/i],
    [{ ...request(), selected: [...request().selected, request().selected[0], request().selected[1]] }, /one to three/i],
    [{ ...request(), selected: [request().selected[0], { ...request().selected[1], selectedId: "eternities-forge" }] }, /unique/i],
    [{ ...request(), selected: [{ ...request().selected[0], extra: true }] }, /selected fields/i],
    [{ ...request(), selected: [{ ...request().selected[0], explicitMethodRequest: "yes" }] }, /explicit method/i],
    [{ ...request(), authorityProjection: authority({ permittedEffects: ["local-write", "local-read"] }) }, /sorted/i],
    [{ ...request(), authorityProjection: authority({ availableAuthority: ["realm:write", "realm:write"] }) }, /unique/i],
  ];
  for (const [value, pattern] of cases) assert.throws(() => validateActivationRequest(value), pattern);
});

test("rejects malformed or mode-bearing classification before compilation", async () => {
  const { validateActivationRequest } = await protocol();
  const cases = [
    { taskClass: "unknown", consequenceClass: "consequential", reviewAvailable: true },
    { taskClass: "implementation", consequenceClass: "unknown", reviewAvailable: true },
    { taskClass: "implementation", consequenceClass: "consequential", reviewAvailable: "yes" },
    { taskClass: "implementation", consequenceClass: "consequential", reviewAvailable: true, mode: "method" },
  ];
  for (const classification of cases) {
    assert.throws(() => validateActivationRequest(request({ classification })), /classification/i);
  }
});

test("builds a canonical result from exact compiler decisions in selected order", async () => {
  const { buildActivationResult } = await protocol();
  const input = request();
  const compiled = decisions();
  const result = buildActivationResult({
    request: input,
    decisions: compiled,
    policyDigest,
    evidenceDigest,
  });
  const unsigned = {
    schemaVersion: 1,
    protocolId: input.protocolId,
    requestId: input.requestId,
    requestDigest: digest(input),
    trustRootDigest,
    policyDigest,
    evidenceDigest,
    classification: input.classification,
    decisions: compiled,
  };

  assert.deepEqual(result, { ...unsigned, resultDigest: digest(unsigned) });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.decisions[0]), true);
});

test("rejects decision order, identity, authority, digest, and disclosure drift", async () => {
  const { buildActivationResult } = await protocol();
  const input = request();
  const compiled = decisions();
  const attempts = [
    [compiled.toReversed(), /selected order|selected identity/i],
    [[{ ...compiled[0], taskClass: "research" }, compiled[1]], /classification|decision digest/i],
    [[{ ...compiled[0], authorityProjection: authority({ contextBudget: 16001 }) }, compiled[1]], /authority|decision digest/i],
    [[{ ...compiled[0], authorityExpanded: true }, compiled[1]], /authority/i],
    [[{ ...compiled[0], decisionDigest: "0".repeat(64) }, compiled[1]], /decision digest/i],
    [[{ ...compiled[0], preInferenceDisclosure: "entrypoint-and-contract" }, compiled[1]], /disclosure|decision digest/i],
  ];
  for (const [mutated, pattern] of attempts) {
    assert.throws(() => buildActivationResult({
      request: input,
      decisions: mutated,
      policyDigest,
      evidenceDigest,
    }), pattern);
  }
});

test("validates aggregate result identity and rejects tampering", async () => {
  const { buildActivationResult, validateActivationResult } = await protocol();
  const built = buildActivationResult({
    request: request(),
    decisions: decisions(),
    policyDigest,
    evidenceDigest,
  });
  assert.deepEqual(validateActivationResult(built), built);

  const cases = [
    [{ ...built, extra: true }, /fields/i],
    [{ ...built, requestDigest: "0".repeat(64) }, /result digest/i],
    [{ ...built, trustRootDigest: "0".repeat(64) }, /result digest/i],
    [{ ...built, policyDigest: "0".repeat(64) }, /policy|result digest/i],
    [{ ...built, decisions: built.decisions.toReversed() }, /result digest|decision/i],
    [{ ...built, resultDigest: "0".repeat(64) }, /result digest/i],
  ];
  for (const [value, pattern] of cases) assert.throws(() => validateActivationResult(value), pattern);
});
