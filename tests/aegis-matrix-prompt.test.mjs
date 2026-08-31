import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function promptModule() {
  return import("../scripts/construct-aegis-matrix-prompt.mjs").catch((error) =>
    assert.fail(`Aegis matrix prompt constructor is unavailable: ${error.message}`));
}

async function inputs() {
  const [taskDefinitionText, guardrails, method, reviewer] = await Promise.all([
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
      root,
    ), "utf8"),
    readFile(new URL(
      "artifacts/capability-layers/eternities-aegis/guardrails.v1.json",
      root,
    ), "utf8"),
    readFile(new URL(
      "artifacts/capability-layers/eternities-aegis/method.v1.md",
      root,
    ), "utf8"),
    readFile(new URL(
      "artifacts/capability-layers/eternities-aegis/reviewer.v1.md",
      root,
    ), "utf8"),
  ]);
  const layer = (name, path, text) => ({ name, path, text, sha256: sha256(text) });
  return {
    taskDefinitionText,
    guardrails: layer(
      "guardrails",
      "artifacts/capability-layers/eternities-aegis/guardrails.v1.json",
      guardrails,
    ),
    method: layer(
      "method",
      "artifacts/capability-layers/eternities-aegis/method.v1.md",
      method,
    ),
    reviewer: layer(
      "reviewer",
      "artifacts/capability-layers/eternities-aegis/reviewer.v1.md",
      reviewer,
    ),
  };
}

test("sealed prompt constructor isolates the exact authorized disclosure for every condition", async () => {
  const [{ constructAegisMatrixPrompt }, source] = await Promise.all([promptModule(), inputs()]);
  const rawArtifact = JSON.stringify({ schemaVersion: 1, findings: [], summary: "raw" });
  const methodArtifact = JSON.stringify({ schemaVersion: 1, findings: [], summary: "method" });
  const parent = (variant, artifactText, evaluationDigest) => ({
    variant,
    artifactText,
    expectedArtifactDigest: sha256(artifactText),
    expectedEvaluationDigest: evaluationDigest,
  });
  const rawParent = parent("raw", rawArtifact, "a".repeat(64));
  const methodParent = parent("method", methodArtifact, "b".repeat(64));
  const cases = {
    raw: { authorizedLayer: null, parent: null },
    guardrail: { authorizedLayer: source.guardrails, parent: null },
    method: { authorizedLayer: source.method, parent: null },
    reviewer: { authorizedLayer: source.reviewer, parent: rawParent },
    combined: { authorizedLayer: source.reviewer, parent: methodParent },
  };
  const prompts = Object.fromEntries(Object.entries(cases).map(([variant, values]) => [
    variant,
    constructAegisMatrixPrompt({ variant, taskDefinitionText: source.taskDefinitionText, ...values }),
  ]));

  for (const result of Object.values(prompts)) {
    assert.match(result.prompt, /sealed evaluation task/i);
    assert.match(result.prompt, /do not invoke tools/i);
    assert.ok(result.prompt.includes(source.taskDefinitionText));
    assert.match(result.promptDigest, /^[a-f0-9]{64}$/);
    assert.equal(result.promptBytes, Buffer.byteLength(result.prompt));
  }
  assert.deepEqual(prompts.raw.disclosedLayers, []);
  assert.equal(prompts.raw.parent, null);
  assert.ok(prompts.guardrail.prompt.includes(source.guardrails.text));
  assert.ok(!prompts.guardrail.prompt.includes(source.method.text));
  assert.ok(!prompts.guardrail.prompt.includes(source.reviewer.text));
  assert.ok(prompts.method.prompt.includes(source.method.text));
  assert.ok(!prompts.method.prompt.includes(source.guardrails.text));
  assert.ok(!prompts.method.prompt.includes(source.reviewer.text));
  assert.ok(prompts.reviewer.prompt.includes(source.reviewer.text));
  assert.ok(prompts.reviewer.prompt.includes(rawArtifact));
  assert.deepEqual(prompts.reviewer.parent, {
    variant: "raw",
    artifactDigest: sha256(rawArtifact),
    evaluationDigest: "a".repeat(64),
  });
  assert.ok(!prompts.reviewer.prompt.includes(source.method.text));
  assert.ok(prompts.combined.prompt.includes(source.reviewer.text));
  assert.ok(prompts.combined.prompt.includes(methodArtifact));
  assert.deepEqual(prompts.combined.parent, {
    variant: "method",
    artifactDigest: sha256(methodArtifact),
    evaluationDigest: "b".repeat(64),
  });
  assert.ok(!prompts.combined.prompt.includes(source.method.text));
  assert.doesNotMatch(prompts.raw.prompt, /raw condition|variant["': ]+raw/i);
});

test("prompt constructor rejects wrong layers, missing parents, and digest drift", async () => {
  const [{ constructAegisMatrixPrompt }, source] = await Promise.all([promptModule(), inputs()]);
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "method",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: source.guardrails,
    parent: null,
  }), /authorized layer|method/i);
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "reviewer",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: source.reviewer,
    parent: null,
  }), /parent artifact/i);
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "raw",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: { ...source.guardrails, sha256: "0".repeat(64) },
    parent: null,
  }), /raw.*layer|authorized layer/i);
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "guardrail",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: { ...source.guardrails, sha256: "0".repeat(64) },
    parent: null,
  }), /digest/i);
  const artifactText = JSON.stringify({ schemaVersion: 1, findings: [], summary: "raw" });
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "reviewer",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: source.reviewer,
    parent: {
      variant: "raw",
      artifactText,
      expectedArtifactDigest: "0".repeat(64),
      expectedEvaluationDigest: "a".repeat(64),
    },
  }), /parent artifact digest/i);
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "combined",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: source.reviewer,
    parent: {
      variant: "raw",
      artifactText,
      expectedArtifactDigest: sha256(artifactText),
      expectedEvaluationDigest: "a".repeat(64),
    },
  }), /combined.*method|parent variant/i);
  const parent = {
    variant: "raw",
    artifactText,
    expectedArtifactDigest: sha256(artifactText),
    expectedEvaluationDigest: "a".repeat(64),
  };
  const fakeReviewer = "self-consistent but unauthorized reviewer bytes";
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "reviewer",
    taskDefinitionText: source.taskDefinitionText,
    authorizedLayer: {
      ...source.reviewer,
      text: fakeReviewer,
      sha256: sha256(fakeReviewer),
    },
    parent,
  }), /trusted|authorized.*digest|reviewer.*digest/i);
  assert.throws(() => constructAegisMatrixPrompt({
    variant: "raw",
    taskDefinitionText: source.taskDefinitionText.replace("security defects", "style defects"),
    authorizedLayer: null,
    parent: null,
  }), /trusted task definition/i);
});
