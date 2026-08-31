import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function evaluator() {
  return import("../scripts/evaluate-aegis-matrix.mjs").catch((error) =>
    assert.fail(`Aegis matrix evaluator is unavailable: ${error.message}`));
}

function artifact(findings, summary = "three source-grounded injection boundaries reviewed") {
  return JSON.stringify({ schemaVersion: 1, findings, summary });
}

async function reviewPromptEvidence(parent, { disclosedArtifactText = parent.artifactText } = {}) {
  const [{ constructAegisMatrixPrompt }, taskDefinitionText, reviewerText] = await Promise.all([
    import("../scripts/construct-aegis-matrix-prompt.mjs"),
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
      root,
    ), "utf8"),
    readFile(new URL(
      "artifacts/capability-layers/eternities-aegis/reviewer.v1.md",
      root,
    ), "utf8"),
  ]);
  const evidence = constructAegisMatrixPrompt({
    variant: parent.variant === "raw" ? "reviewer" : "combined",
    taskDefinitionText,
    authorizedLayer: {
      name: "reviewer",
      path: "artifacts/capability-layers/eternities-aegis/reviewer.v1.md",
      text: reviewerText,
      sha256: sha256(reviewerText),
    },
    parent,
  });
  if (disclosedArtifactText === parent.artifactText) return evidence;
  const prompt = evidence.prompt.replace(parent.artifactText, disclosedArtifactText);
  return {
    ...evidence,
    prompt,
    promptDigest: sha256(prompt),
    promptBytes: Buffer.byteLength(prompt),
  };
}

const sql = {
  id: "invoice-sql-injection",
  title: "SQL injection in invoice lookup",
  severity: "high",
  location: "review-subject.js lines 8-10 /invoice",
  evidence: "req.query.customer is interpolated into SQL and passed to db.query without binding",
  repair: "Use a parameterized query with a placeholder and bind the customer value",
  confidence: "high",
};
const traversal = {
  id: "download-path-traversal",
  title: "Path traversal in download route",
  severity: "high",
  location: "review-subject.js lines 14-16 /download",
  evidence: "req.query.name reaches path.join and sendFile without containment under DATA_ROOT",
  repair: "Resolve against DATA_ROOT, reject an absolute or parent-relative result, and allowlist files",
  confidence: "high",
};
const command = {
  id: "diagnostics-command-injection",
  title: "OS command injection in diagnostics",
  severity: "critical",
  location: "review-subject.js lines 19-22 /diagnostics",
  evidence: "req.body.host is interpolated into a shell command passed to exec",
  repair: "Use execFile or spawn without a shell and validate host against a strict allowlist",
  confidence: "high",
};

test("matrix task and comparison policy freeze one closed five-condition mission", async () => {
  const [taskDefinition, comparisonPolicy] = await Promise.all([
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
      root,
    ), "utf8").then(JSON.parse),
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/comparison-policy.json",
      root,
    ), "utf8").then(JSON.parse),
  ]);
  assert.deepEqual(Object.keys(taskDefinition).sort(), [
    "artifactContract", "id", "mission", "version",
  ]);
  assert.deepEqual(comparisonPolicy.variants, [
    "raw", "guardrail", "method", "reviewer", "combined",
  ]);
  assert.equal(comparisonPolicy.baseline, "raw");
  assert.ok(comparisonPolicy.metrics.some((value) => value.startsWith("artifact-schema:")));
  assert.ok(comparisonPolicy.metrics.some((value) => value.startsWith("scoring:")));
  assert.ok(comparisonPolicy.metrics.some((value) => value.startsWith("critical-regression:")));
  assert.ok(comparisonPolicy.metrics.includes("parent-map:reviewer=raw,combined=method"));
  assert.ok(comparisonPolicy.metrics.some((value) => value.startsWith("tie-policy:")));
  assert.ok(comparisonPolicy.metrics.some((value) => value.startsWith("case-counts:")));
  const [evaluatorBytes, promptConstructorBytes, taskDefinitionBytes, reviewerLayerBytes] =
    await Promise.all([
      readFile(new URL("scripts/evaluate-aegis-matrix.mjs", root)),
      readFile(new URL("scripts/construct-aegis-matrix-prompt.mjs", root)),
      readFile(new URL(
        "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
        root,
      )),
      readFile(new URL(
        "artifacts/capability-layers/eternities-aegis/reviewer.v1.md",
        root,
      )),
    ]);
  assert.ok(comparisonPolicy.metrics.includes(`evaluator-sha256:${sha256(evaluatorBytes)}`));
  assert.ok(comparisonPolicy.metrics.includes(
    `prompt-constructor-sha256:${sha256(promptConstructorBytes)}`,
  ));
  assert.ok(comparisonPolicy.metrics.includes(
    `task-definition-sha256:${sha256(taskDefinitionBytes)}`,
  ));
  assert.ok(comparisonPolicy.metrics.includes(
    `trusted-reviewer-layer-sha256:${sha256(reviewerLayerBytes)}`,
  ));
  assert.ok(comparisonPolicy.metrics.every((value) => !value.includes("PENDING")));
  assert.match(taskDefinition.mission, /db\.query/);
  assert.match(taskDefinition.mission, /sendFile/);
  assert.match(taskDefinition.mission, /exec/);
  assert.match(taskDefinition.artifactContract, /Return only one JSON object/);
  assert.match(taskDefinition.artifactContract, /500/);
});

test("deterministic evaluator rewards grounded coverage without requiring disclosed answer ids", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const rawText = artifact([sql]);
  const idealText = artifact([sql, traversal, command]);
  const raw = evaluateAegisMatrixArtifact({ variant: "raw", artifactText: rawText });
  const ideal = evaluateAegisMatrixArtifact({
    variant: "method",
    artifactText: idealText,
    rawArtifactText: rawText,
  });

  assert.equal(raw.schemaValid, true);
  assert.equal(raw.comparison.outcomeAgainstRaw, "baseline");
  assert.deepEqual(raw.comparison.counts, { matched: 0, wins: 0, losses: 0, ties: 0 });
  assert.equal(ideal.schemaValid, true);
  assert.equal(ideal.detectedFindings, 3);
  assert.equal(ideal.unsupportedFindings, 0);
  assert.equal(ideal.score, ideal.maximumScore);
  assert.equal(ideal.comparison.outcomeAgainstRaw, "win");
  assert.deepEqual(ideal.comparison.counts, { matched: 3, wins: 2, losses: 0, ties: 1 });
  assert.equal(ideal.criticalRegression, false);
  assert.match(ideal.evaluationDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    evaluateAegisMatrixArtifact({
      variant: "method",
      artifactText: idealText,
      rawArtifactText: rawText,
    }),
    ideal,
  );
});

test("malformed output, unsupported critical claims, and reviewer removal fail closed", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const rawText = artifact([sql, traversal, command]);
  const malformed = evaluateAegisMatrixArtifact({
    variant: "guardrail",
    artifactText: "```json\n{}\n```",
    rawArtifactText: rawText,
  });
  assert.equal(malformed.schemaValid, false);
  assert.equal(malformed.score, 0);
  assert.equal(malformed.criticalRegression, true);
  assert.equal(malformed.comparison.outcomeAgainstRaw, "loss");

  const unsupported = {
    id: "remote-code-execution",
    title: "Remote code execution in static import",
    severity: "critical",
    location: "review-subject.js line 1",
    evidence: "The express import itself executes arbitrary remote code",
    repair: "Delete all dependencies",
    confidence: "high",
  };
  const noisy = evaluateAegisMatrixArtifact({
    variant: "guardrail",
    artifactText: artifact([sql, traversal, command, unsupported]),
    rawArtifactText: rawText,
  });
  assert.equal(noisy.unsupportedFindings, 1);
  assert.equal(noisy.criticalRegression, true);

  const parent = {
    variant: "raw",
    artifactText: rawText,
    expectedArtifactDigest: sha256(rawText),
    expectedEvaluationDigest: evaluateAegisMatrixArtifact({
      variant: "raw",
      artifactText: rawText,
    }).evaluationDigest,
  };
  const reviewer = evaluateAegisMatrixArtifact({
    variant: "reviewer",
    artifactText: artifact([sql, traversal]),
    rawArtifactText: rawText,
    parent,
    promptEvidence: await reviewPromptEvidence(parent),
  });
  assert.equal(reviewer.criticalRegression, true);
  assert.ok(reviewer.reasonCodes.includes("parent-grounded-finding-removed"));
});

test("review conditions bind the exact required parent artifact and evaluation", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const rawText = artifact([sql]);
  const methodText = artifact([sql, traversal, command]);
  const rawEvaluation = evaluateAegisMatrixArtifact({ variant: "raw", artifactText: rawText });
  const methodEvaluation = evaluateAegisMatrixArtifact({
    variant: "method",
    artifactText: methodText,
    rawArtifactText: rawText,
  });
  const methodParent = {
    variant: "method",
    artifactText: methodText,
    expectedArtifactDigest: methodEvaluation.artifactDigest,
    expectedEvaluationDigest: methodEvaluation.evaluationDigest,
  };
  const combined = evaluateAegisMatrixArtifact({
    variant: "combined",
    artifactText: methodText,
    rawArtifactText: rawText,
    parent: methodParent,
    promptEvidence: await reviewPromptEvidence(methodParent),
  });
  assert.deepEqual(combined.parent, {
    variant: "method",
    artifactDigest: methodEvaluation.artifactDigest,
    evaluationDigest: methodEvaluation.evaluationDigest,
  });
  assert.throws(() => evaluateAegisMatrixArtifact({
    variant: "combined",
    artifactText: methodText,
    rawArtifactText: rawText,
    parent: {
      variant: "raw",
      artifactText: rawText,
      expectedArtifactDigest: rawEvaluation.artifactDigest,
      expectedEvaluationDigest: rawEvaluation.evaluationDigest,
    },
  }), /combined.*method|parent variant/i);
  assert.throws(() => evaluateAegisMatrixArtifact({
    variant: "reviewer",
    artifactText: methodText,
    rawArtifactText: rawText,
    parent: {
      variant: "raw",
      artifactText: rawText,
      expectedArtifactDigest: "0".repeat(64),
      expectedEvaluationDigest: rawEvaluation.evaluationDigest,
    },
  }), /parent artifact digest/i);
  assert.throws(() => evaluateAegisMatrixArtifact({
    variant: "reviewer",
    artifactText: methodText,
    rawArtifactText: rawText,
    parent: {
      variant: "raw",
      artifactText: rawText,
      expectedArtifactDigest: rawEvaluation.artifactDigest,
      expectedEvaluationDigest: "0".repeat(64),
    },
  }), /parent evaluation digest/i);
});

test("review evaluation binds the exact parent bytes disclosed by its prompt", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const rawText = artifact([sql, traversal, command]);
  const rawEvaluation = evaluateAegisMatrixArtifact({ variant: "raw", artifactText: rawText });
  const parent = {
    variant: "raw",
    artifactText: rawText,
    expectedArtifactDigest: rawEvaluation.artifactDigest,
    expectedEvaluationDigest: rawEvaluation.evaluationDigest,
  };
  const promptEvidence = await reviewPromptEvidence(parent);
  const reviewed = evaluateAegisMatrixArtifact({
    variant: "reviewer",
    artifactText: rawText,
    rawArtifactText: rawText,
    parent,
    promptEvidence,
  });
  assert.equal(reviewed.prompt.promptDigest, promptEvidence.promptDigest);
  assert.deepEqual(reviewed.prompt.parent, promptEvidence.parent);

  const forged = await reviewPromptEvidence(parent, {
    disclosedArtifactText: artifact([sql]),
  });
  assert.throws(() => evaluateAegisMatrixArtifact({
    variant: "reviewer",
    artifactText: rawText,
    rawArtifactText: rawText,
    parent,
    promptEvidence: forged,
  }), /prompt.*parent artifact|disclosed parent/i);
});

test("critical and inherited case quality regressions fail even when finding labels remain", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const rawText = artifact([sql, traversal, command]);
  const rawEvaluation = evaluateAegisMatrixArtifact({ variant: "raw", artifactText: rawText });
  const downgradedCommand = { ...command, severity: "info", repair: "Validate the input" };
  const degradedText = artifact([sql, traversal, downgradedCommand]);
  const method = evaluateAegisMatrixArtifact({
    variant: "method",
    artifactText: degradedText,
    rawArtifactText: rawText,
  });
  assert.equal(method.criticalRegression, true);
  assert.ok(method.reasonCodes.includes("critical-finding-quality-incomplete"));

  const parent = {
    variant: "raw",
    artifactText: rawText,
    expectedArtifactDigest: rawEvaluation.artifactDigest,
    expectedEvaluationDigest: rawEvaluation.evaluationDigest,
  };
  const reviewer = evaluateAegisMatrixArtifact({
    variant: "reviewer",
    artifactText: degradedText,
    rawArtifactText: rawText,
    parent,
    promptEvidence: await reviewPromptEvidence(parent),
  });
  assert.equal(reviewer.criticalRegression, true);
  assert.ok(reviewer.reasonCodes.includes("parent-grounded-finding-degraded"));
});

test("best one-to-one finding assignment is stable across array order and rejects keyword stuffing", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const weakSql = {
    ...sql,
    id: "weak-sqli",
    title: "Possible SQLi",
    evidence: "Customer input appears near SQL",
    repair: "Review input validation",
  };
  const first = evaluateAegisMatrixArtifact({
    variant: "raw",
    artifactText: artifact([weakSql, sql, traversal, command]),
  });
  const second = evaluateAegisMatrixArtifact({
    variant: "raw",
    artifactText: artifact([command, traversal, sql, weakSql]),
  });
  assert.equal(first.score, second.score);
  assert.deepEqual(first.caseResults, second.caseResults);
  assert.equal(first.unsupportedFindings, second.unsupportedFindings);
  const sqlResult = first.caseResults.find(({ id }) => id === "sql-injection");
  assert.equal(sqlResult.evidenceGrounded, true);
  assert.equal(sqlResult.repairSpecific, true);

  const stuffing = evaluateAegisMatrixArtifact({
    variant: "raw",
    artifactText: artifact([weakSql]),
  });
  const stuffedSql = stuffing.caseResults.find(({ id }) => id === "sql-injection");
  assert.equal(stuffedSql.detected, true);
  assert.equal(stuffedSql.evidenceGrounded, false);
  assert.equal(stuffedSql.repairSpecific, false);

  const deniedFlow = {
    ...sql,
    id: "denied-flow-sqli",
    evidence: "req.query.customer is not interpolated into SQL and never reaches db.query; interpolation db.query",
  };
  const denied = evaluateAegisMatrixArtifact({
    variant: "raw",
    artifactText: artifact([deniedFlow]),
  });
  assert.equal(
    denied.caseResults.find(({ id }) => id === "sql-injection").evidenceGrounded,
    false,
  );
  const paddedDenial = {
    ...sql,
    id: "padded-denial-sqli",
    evidence: `req.query.customer is never ${"irrelevant ".repeat(12)}interpolated into SQL passed to db.query`,
  };
  const padded = evaluateAegisMatrixArtifact({
    variant: "raw",
    artifactText: artifact([paddedDenial]),
  });
  assert.equal(
    padded.caseResults.find(({ id }) => id === "sql-injection").evidenceGrounded,
    false,
  );
});

test("closed evaluator rejects extra keys and contradictory comparison inputs", async () => {
  const { evaluateAegisMatrixArtifact } = await evaluator();
  const withExtra = JSON.stringify({
    schemaVersion: 1,
    findings: [sql],
    summary: "reviewed",
    hiddenScore: 99,
  });
  const invalid = evaluateAegisMatrixArtifact({ variant: "raw", artifactText: withExtra });
  assert.equal(invalid.schemaValid, false);
  assert.equal(invalid.criticalRegression, true);
  assert.throws(
    () => evaluateAegisMatrixArtifact({ variant: "method", artifactText: artifact([sql]) }),
    /raw artifact/i,
  );
  assert.throws(
    () => evaluateAegisMatrixArtifact({
      variant: "raw",
      artifactText: artifact([sql]),
      rawArtifactText: artifact([sql]),
    }),
    /raw baseline|raw artifact/i,
  );
  const duplicateMember = artifact([sql]).replace(
    '"schemaVersion":1',
    '"schemaVersion":1,"schemaVersion":1',
  );
  assert.equal(
    evaluateAegisMatrixArtifact({ variant: "raw", artifactText: duplicateMember }).schemaValid,
    false,
  );
  assert.equal(
    evaluateAegisMatrixArtifact({
      variant: "raw",
      artifactText: artifact([sql], "x".repeat(501)),
    }).schemaValid,
    false,
  );
});
