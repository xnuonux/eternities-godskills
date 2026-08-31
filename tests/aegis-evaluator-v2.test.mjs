import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalDigest } from "../src/adaptive-evidence-contracts.mjs";
import { sha256 } from "../src/io.mjs";
import { buildAdaptiveEvaluatorPackageReceipt } from "../scripts/build-adaptive-evaluator-package-receipt.mjs";

const root = new URL("../", import.meta.url);
const repositoryRoot = fileURLToPath(root);
const taskPath = "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json";

async function evaluator() {
  return import("../src/aegis-evaluator-v2.mjs").catch((error) =>
    assert.fail(`Aegis evaluator v2 is unavailable: ${error.message}`));
}

async function loadJson(relativePath) {
  const text = await readFile(new URL(relativePath, root), "utf8").catch((error) =>
    assert.fail(`required Aegis v2 fixture is unavailable: ${relativePath}: ${error.message}`));
  return { text, value: JSON.parse(text) };
}

function taskSource(task) {
  const separator = task.mission.indexOf("\n\n");
  assert.notEqual(separator, -1, "task source separator is absent");
  return task.mission.slice(separator + 2);
}

async function context() {
  const [{ value: oracle }, { value: task }] = await Promise.all([
    loadJson("artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json"),
    loadJson(taskPath),
  ]);
  const packageReceipt = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot,
    descriptor: {
      id: "adaptive-evaluator-aegis-v2",
      evaluatorId: "aegis-deterministic-verifier-v2",
      evaluatorKind: "deterministic-verifier",
      taskClass: "security-review",
      artifactMediaType: "application/json",
      entrypointPath: "src/aegis-evaluator-v2.mjs",
      policyPath: "policies/adaptive-evaluator-packages.v1.json",
      packageSchemaPath: "schemas/adaptive-evaluator-package-v1.schema.json",
      requestSchemaPath: "schemas/adaptive-evaluator-request-v1.schema.json",
      resultSchemaPath: "schemas/adaptive-evaluator-result-v1.schema.json",
      resources: [
        { role: "oracle", path: "artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json", logical: true },
        { role: "task-definition", path: taskPath, logical: true },
      ],
    },
  });
  return { oracle, task, source: taskSource(task), packageReceipt };
}

function finding(overrides = {}) {
  return {
    id: "command-injection-diagnostics-host",
    title: "OS command injection through diagnostics host",
    severity: "critical",
    location: "Lines 19-20 in the diagnostics handler",
    evidence: "Untrusted req.body.host is interpolated into a shell command passed to exec.",
    repair: "Use execFile or spawn without a shell and strictly validate the host argument.",
    confidence: "high",
    ...overrides,
  };
}

function idealFindings() {
  return [
    {
      id: "sql-injection-invoice-customer",
      title: "SQL injection through customer query parameter",
      severity: "high",
      location: "Lines 8-10 in the invoice handler",
      evidence: "Untrusted req.query.customer is interpolated into SQL passed to db.query.",
      repair: "Use a parameterized prepared query with a bound placeholder.",
      confidence: "high",
    },
    {
      id: "path-traversal-download-name",
      title: "Path traversal through download name",
      severity: "high",
      location: "Lines 14-16 in the download handler",
      evidence: "Untrusted req.query.name flows through path.join and reaches res.sendFile without a containment check.",
      repair: "Use path.resolve and reject any candidate outside the allowed base directory; prefer an allowlisted identifier.",
      confidence: "high",
    },
    finding(),
  ];
}

function artifact(findings = idealFindings(), summary = "three source-grounded issues") {
  return JSON.stringify({ schemaVersion: 1, findings, summary });
}

function bound(result, artifactText) {
  return {
    artifactText,
    artifactDigest: sha256(artifactText),
    resultText: JSON.stringify(result),
    resultDigest: result.resultDigest,
  };
}

function request({
  packageReceipt,
  task,
  source,
  variant = "raw",
  artifactText = artifact(),
  baseline = null,
  parent = null,
  evaluatedAt = "2026-08-31T12:00:00.000Z",
}) {
  return {
    schemaVersion: 1,
    packageReceiptDigest: packageReceipt.receiptDigest,
    taskDefinitionDigest: canonicalDigest(task),
    taskSourceText: source,
    taskSourceDigest: sha256(source),
    variant,
    artifactText,
    artifactDigest: sha256(artifactText),
    baseline,
    parent,
    evaluatedAt,
  };
}

async function evaluateRaw(ctx, artifactText = artifact(), evaluatedAt = "2026-08-31T12:00:00.000Z") {
  const { evaluateAegisArtifactV2 } = await evaluator();
  return evaluateAegisArtifactV2({
    request: request({ ...ctx, artifactText, evaluatedAt }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  });
}

test("normalizes punctuation without weakening source-grounded Aegis checks", async () => {
  const [{ normalizeEvaluatorText, evaluateAegisArtifactV2 }, ctx] = await Promise.all([
    evaluator(),
    context(),
  ]);
  assert.equal(normalizeEvaluatorText("OS-command_injection: CWE-78"), "os command injection cwe 78");

  const result = evaluateAegisArtifactV2({
    request: request({ ...ctx }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  });
  assert.equal(result.detectedCases, 3);
  assert.equal(result.score, result.maximumScore);
  assert.equal(result.maximumScore, 30);
  assert.equal(result.criticalRegression, false);
  assert.equal(result.authorityExpanded, false);
  assert.equal(result.caseResults.every(({ checks }) => checks.every(({ passed }) => passed)), true);
});

test("recognizes the archived hyphenated method findings without rewriting v1", async () => {
  const [{ evaluateAegisArtifactV2 }, ctx, rawEnvelope, methodEnvelope] = await Promise.all([
    evaluator(),
    context(),
    loadJson("evidence/adaptive-evidence-v2/aegis-matrix/artifacts/raw.json"),
    loadJson("evidence/adaptive-evidence-v2/aegis-matrix/artifacts/method.json"),
  ]);
  const raw = await evaluateRaw(ctx, rawEnvelope.value.artifactText);
  const method = evaluateAegisArtifactV2({
    request: request({
      ...ctx,
      variant: "method",
      artifactText: methodEnvelope.value.artifactText,
      baseline: bound(raw, rawEnvelope.value.artifactText),
      evaluatedAt: "2026-08-31T12:00:02.000Z",
    }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  });

  assert.equal(method.detectedCases, 3);
  assert.equal(method.unsupportedFindings, 0);
  assert.equal(method.criticalRegression, false);
  assert.equal(method.caseResults.find(({ id }) => id === "command-injection").matchedArtifactId,
    "command-injection-in-diagnostics");
  assert.equal(method.caseResults.find(({ id }) => id === "path-traversal").matchedArtifactId,
    "path-traversal-in-download-route");
});

test("ids, stuffing, negation, fabricated locations, and generic repairs cannot ground a critical case", async () => {
  const [{ evaluateAegisArtifactV2 }, ctx] = await Promise.all([evaluator(), context()]);
  const controls = [
    ["flow-grounded", finding({
      evidence: "command injection exec shell req.body.host",
    })],
    ["flow-grounded", finding({
      evidence: "req.body.host does not reach exec and is never passed to a shell",
    })],
    ["location-specific", finding({ location: "Everywhere in the service" })],
    ["source-grounded", finding({
      evidence: "A value is interpolated into a shell command passed to exec.",
    })],
    ["sink-grounded", finding({
      evidence: "Untrusted req.body.host is interpolated into a command.",
    })],
    ["repair-specific", finding({ repair: "Validate the input." })],
  ];

  for (const [failedCheck, commandFinding] of controls) {
    const findings = idealFindings();
    findings[2] = commandFinding;
    const result = evaluateAegisArtifactV2({
      request: request({ ...ctx, artifactText: artifact(findings) }),
      packageReceipt: ctx.packageReceipt,
      oracle: ctx.oracle,
    });
    const critical = result.caseResults.find(({ id }) => id === "command-injection");
    assert.equal(critical.checks.find(({ id }) => id === failedCheck).passed, false, failedCheck);
    assert.equal(result.criticalRegression, true, failedCheck);
  }
});

test("malformed, duplicate, reused, and unsupported critical findings fail closed", async () => {
  const [{ evaluateAegisArtifactV2 }, ctx] = await Promise.all([evaluator(), context()]);
  for (const artifactText of [
    "{",
    "{\"schemaVersion\":1,\"schemaVersion\":1,\"findings\":[],\"summary\":\"duplicate\"}",
    artifact([idealFindings()[0], { ...idealFindings()[1], id: idealFindings()[0].id }, finding()]),
  ]) {
    const result = evaluateAegisArtifactV2({
      request: request({ ...ctx, artifactText }),
      packageReceipt: ctx.packageReceipt,
      oracle: ctx.oracle,
    });
    assert.equal(result.schemaValid, false);
    assert.equal(result.criticalRegression, true);
  }

  const unsupported = finding({
    id: "imaginary-root-compromise",
    title: "Imaginary root compromise",
    location: "No source location",
    evidence: "No grounded source or sink exists.",
    repair: "Rewrite everything.",
  });
  const unsupportedResult = evaluateAegisArtifactV2({
    request: request({ ...ctx, artifactText: artifact([...idealFindings(), unsupported]) }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  });
  assert.equal(unsupportedResult.unsupportedFindings, 1);
  assert.equal(unsupportedResult.criticalRegression, true);

  const reused = finding({
    id: "command-and-path",
    title: "Command injection and path traversal",
    evidence: "req.body.host reaches exec while req.query.name reaches path.join and res.sendFile.",
    repair: "Use execFile without a shell and path.resolve with containment.",
  });
  const reusedResult = evaluateAegisArtifactV2({
    request: request({ ...ctx, artifactText: artifact([idealFindings()[0], reused]) }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  });
  assert.ok(reusedResult.detectedCases < 3);
});

test("assignment is stable and review parents cannot be removed, degraded, or substituted", async () => {
  const [{ evaluateAegisArtifactV2 }, ctx] = await Promise.all([evaluator(), context()]);
  const firstText = artifact(idealFindings());
  const secondText = artifact([...idealFindings()].reverse());
  const first = await evaluateRaw(ctx, firstText, "2026-08-31T12:00:00.000Z");
  const second = await evaluateRaw(ctx, secondText, "2026-08-31T12:00:01.000Z");
  assert.deepEqual(
    first.caseResults.map(({ id, matchedArtifactId, score }) => ({ id, matchedArtifactId, score })),
    second.caseResults.map(({ id, matchedArtifactId, score }) => ({ id, matchedArtifactId, score })),
  );

  const degradedFindings = idealFindings().filter(({ id }) => !id.startsWith("command-injection"));
  const reviewedText = artifact(degradedFindings, "review removed the critical finding");
  const reviewed = evaluateAegisArtifactV2({
    request: request({
      ...ctx,
      variant: "reviewer",
      artifactText: reviewedText,
      baseline: bound(first, firstText),
      parent: bound(first, firstText),
      evaluatedAt: "2026-08-31T12:00:03.000Z",
    }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  });
  assert.equal(reviewed.criticalRegression, true);
  assert.ok(reviewed.reasonCodes.includes("parent-grounded-case-removed"));

  const forgedBaseline = bound(first, firstText);
  forgedBaseline.resultText = forgedBaseline.resultText.replace(
    "no-critical-regression",
    "forged-result",
  );
  assert.throws(() => evaluateAegisArtifactV2({
    request: request({
      ...ctx,
      variant: "method",
      baseline: forgedBaseline,
      evaluatedAt: "2026-08-31T12:00:04.000Z",
    }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  }), /result digest|result text/i);

  const substitutedResultBody = {
    ...first,
    evaluatorId: "different-evaluator-v2",
  };
  delete substitutedResultBody.resultDigest;
  const substitutedResult = {
    ...substitutedResultBody,
    resultDigest: canonicalDigest(substitutedResultBody),
  };
  const substitutedBaseline = {
    artifactText: firstText,
    artifactDigest: sha256(firstText),
    resultText: JSON.stringify(substitutedResult),
    resultDigest: substitutedResult.resultDigest,
  };
  assert.throws(() => evaluateAegisArtifactV2({
    request: request({
      ...ctx,
      variant: "method",
      baseline: substitutedBaseline,
      evaluatedAt: "2026-08-31T12:00:05.000Z",
    }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  }), /baseline.*evaluator|result.*evaluator/i);

  const fabricatedResultBody = structuredClone(first);
  delete fabricatedResultBody.resultDigest;
  fabricatedResultBody.score = 0;
  fabricatedResultBody.caseResults[0].score = 0;
  const fabricatedResult = {
    ...fabricatedResultBody,
    resultDigest: canonicalDigest(fabricatedResultBody),
  };
  const fabricatedBaseline = bound(fabricatedResult, firstText);
  assert.throws(() => evaluateAegisArtifactV2({
    request: request({
      ...ctx,
      variant: "method",
      baseline: fabricatedBaseline,
      evaluatedAt: "2026-08-31T12:00:06.000Z",
    }),
    packageReceipt: ctx.packageReceipt,
    oracle: ctx.oracle,
  }), /baseline.*deterministic|baseline.*score|result.*score/i);
});
