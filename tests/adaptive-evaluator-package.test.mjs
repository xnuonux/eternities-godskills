import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { canonicalDigest } from "../src/adaptive-evidence-contracts.mjs";
import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const digest = (character) => character.repeat(64);

async function protocol() {
  return import("../src/adaptive-evaluator-package.mjs").catch((error) =>
    assert.fail(`adaptive evaluator package protocol is unavailable: ${error.message}`));
}

async function policy() {
  const text = await readFile(
    new URL("policies/adaptive-evaluator-packages.v1.json", root),
    "utf8",
  ).catch((error) => assert.fail(`adaptive evaluator policy is unavailable: ${error.message}`));
  return JSON.parse(text);
}

function validRequest(overrides = {}) {
  const taskSourceText = "01 const value = request.input;\n02 sink(value);";
  const artifactText = JSON.stringify({ schemaVersion: 1, findings: [], summary: "none" });
  return {
    schemaVersion: 1,
    packageReceiptDigest: digest("a"),
    taskDefinitionDigest: digest("b"),
    taskSourceText,
    taskSourceDigest: sha256(taskSourceText),
    variant: "raw",
    artifactText,
    artifactDigest: sha256(artifactText),
    baseline: null,
    parent: null,
    evaluatedAt: "2026-08-31T12:00:00.000Z",
    ...overrides,
  };
}

function validResult(overrides = {}) {
  const body = {
    schemaVersion: 1,
    packageId: "adaptive-evaluator-aegis-v2",
    packageReceiptDigest: digest("a"),
    evaluatorId: "aegis-deterministic-verifier-v2",
    evaluatorKind: "deterministic-verifier",
    taskClass: "security-review",
    variant: "raw",
    taskDefinitionDigest: digest("b"),
    taskSourceDigest: digest("c"),
    oracleDigest: digest("d"),
    normalizationDigest: digest("e"),
    artifactDigest: digest("f"),
    artifactBytes: 64,
    schemaValid: true,
    score: 9,
    maximumScore: 9,
    detectedCases: 1,
    unsupportedFindings: 0,
    caseResults: [{
      id: "command-injection",
      matchedArtifactId: "finding-1",
      critical: true,
      score: 9,
      maximumScore: 9,
      checks: [
        { id: "detected", passed: true, reasonCode: "case-detected" },
        { id: "flow-grounded", passed: true, reasonCode: "flow-grounded" },
      ],
    }],
    comparison: {
      baselineArtifactDigest: null,
      baselineResultDigest: null,
      outcomeAgainstRaw: "baseline",
      counts: { matched: 0, wins: 0, losses: 0, ties: 0 },
    },
    parent: null,
    criticalRegression: false,
    reasonCodes: ["artifact-schema-valid", "no-critical-regression"],
    authorityExpanded: false,
    evaluatedAt: "2026-08-31T12:00:01.000Z",
    ...overrides,
  };
  return { ...body, resultDigest: canonicalDigest(body) };
}

function boundEvaluation(request) {
  const artifactDigest = sha256(request.artifactText);
  const result = validResult({
    packageReceiptDigest: request.packageReceiptDigest,
    taskDefinitionDigest: request.taskDefinitionDigest,
    taskSourceDigest: request.taskSourceDigest,
    artifactDigest,
    artifactBytes: Buffer.byteLength(request.artifactText),
    evaluatedAt: "2026-08-31T11:59:59.000Z",
  });
  return {
    artifactText: request.artifactText,
    artifactDigest,
    resultText: JSON.stringify(result),
    resultDigest: result.resultDigest,
  };
}

test("trusted evaluator policy closes loading, resources, authority, and size", async () => {
  const [{ validateAdaptiveEvaluatorPackagePolicy }, trusted] = await Promise.all([
    protocol(),
    policy(),
  ]);
  const expectedKeys = [
    "artifactMediaTypes",
    "authorityExpanded",
    "dynamicLoadingAllowed",
    "evaluatorKinds",
    "id",
    "maximumArtifactBytes",
    "maximumDeclaredResources",
    "protocolId",
    "receiptPathExecutionAllowed",
    "schemaVersion",
    "taskClasses",
  ];

  assert.deepEqual(Object.keys(trusted).sort(), expectedKeys);
  assert.deepEqual(validateAdaptiveEvaluatorPackagePolicy({
    policy: trusted,
    expectedPolicyDigest: canonicalDigest(trusted),
  }), trusted);

  for (const [field, message] of [
    ["dynamicLoadingAllowed", /dynamic.*loading.*allowed/i],
    ["receiptPathExecutionAllowed", /receipt.*path.*execution.*allowed/i],
    ["authorityExpanded", /authority.*expanded/i],
  ]) {
    const changed = { ...trusted, [field]: true };
    assert.throws(() => validateAdaptiveEvaluatorPackagePolicy({
      policy: changed,
      expectedPolicyDigest: canonicalDigest(changed),
    }), message);
  }
  assert.throws(() => validateAdaptiveEvaluatorPackagePolicy({
    policy: { ...trusted, extra: true },
    expectedPolicyDigest: canonicalDigest(trusted),
  }), /keys.*closed/i);
  assert.throws(() => validateAdaptiveEvaluatorPackagePolicy({
    policy: trusted,
    expectedPolicyDigest: digest("0"),
  }), /trusted policy digest/i);
});

test("portable request validates exact artifact and task bytes", async () => {
  const { validateEvaluatorRequest } = await protocol();
  const request = validRequest();
  assert.deepEqual(validateEvaluatorRequest(request), request);
  assert.equal(Object.isFrozen(validateEvaluatorRequest(request)), true);

  assert.throws(() => validateEvaluatorRequest({ ...request, extra: true }), /keys.*closed/i);
  assert.throws(() => validateEvaluatorRequest({
    ...request,
    artifactDigest: digest("1"),
  }), /artifact digest/i);
  assert.throws(() => validateEvaluatorRequest({
    ...request,
    taskSourceDigest: digest("2"),
  }), /task source digest/i);
  const baseline = boundEvaluation(request);
  assert.equal(validateEvaluatorRequest({
    ...request,
    variant: "method",
    baseline,
  }).baseline.resultDigest, baseline.resultDigest);
  assert.throws(() => validateEvaluatorRequest({
    ...request,
    variant: "reviewer",
    baseline,
    parent: null,
  }), /parent/i);
  assert.throws(() => validateEvaluatorRequest({
    ...request,
    variant: "raw",
    baseline,
  }), /raw.*baseline/i);
  assert.throws(() => validateEvaluatorRequest({
    ...request,
    variant: "method",
    baseline: {
      ...baseline,
      resultText: baseline.resultText.replace("case-detected", "case-forged"),
    },
  }), /result digest|result text/i);
});

test("portable result closes case checks, comparison totals, digest, and authority", async () => {
  const { validateEvaluatorResult } = await protocol();
  const result = validResult();
  assert.deepEqual(validateEvaluatorResult(result), result);
  assert.equal(Object.isFrozen(validateEvaluatorResult(result)), true);

  const expandedBody = { ...result, authorityExpanded: true };
  delete expandedBody.resultDigest;
  assert.throws(() => validateEvaluatorResult({
    ...expandedBody,
    resultDigest: canonicalDigest(expandedBody),
  }), /authority/i);

  const contradictoryBody = structuredClone(result);
  delete contradictoryBody.resultDigest;
  contradictoryBody.comparison.counts = { matched: 1, wins: 0, losses: 0, ties: 0 };
  assert.throws(() => validateEvaluatorResult({
    ...contradictoryBody,
    resultDigest: canonicalDigest(contradictoryBody),
  }), /comparison totals/i);

  assert.throws(() => validateEvaluatorResult({ ...result, resultDigest: digest("9") }), /result digest/i);
  assert.throws(() => validateEvaluatorResult({ ...result, extra: true }), /keys.*closed/i);

  const duplicateCheckBody = structuredClone(result);
  delete duplicateCheckBody.resultDigest;
  duplicateCheckBody.caseResults[0].checks.push(
    structuredClone(duplicateCheckBody.caseResults[0].checks[0]),
  );
  assert.throws(() => validateEvaluatorResult({
    ...duplicateCheckBody,
    resultDigest: canonicalDigest(duplicateCheckBody),
  }), /duplicate.*check/i);
});

test("generated evaluator schemas close every object boundary", async () => {
  const { buildAdaptiveEvaluatorSchemas } = await protocol();
  const schemas = buildAdaptiveEvaluatorSchemas();
  assert.deepEqual(Object.keys(schemas), [
    "adaptive-evaluator-package-v1.schema.json",
    "adaptive-evaluator-request-v1.schema.json",
    "adaptive-evaluator-result-v1.schema.json",
  ]);

  function assertClosed(value, location = "schema") {
    if (!value || typeof value !== "object") return;
    if (value.type === "object") {
      assert.equal(value.additionalProperties, false, `${location} is open`);
      assert.ok(Array.isArray(value.required), `${location} has no required list`);
    }
    for (const [key, child] of Object.entries(value)) {
      assertClosed(child, `${location}.${key}`);
    }
  }
  for (const schema of Object.values(schemas)) assertClosed(schema);
});
