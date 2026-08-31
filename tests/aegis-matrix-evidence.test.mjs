import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const hostPolicyPath = "C:\\Users\\Dom\\.codex\\AGENTS.md";
const variants = ["raw", "guardrail", "method", "reviewer", "combined"];

async function evidenceModule() {
  return import("../scripts/build-aegis-matrix-evidence.mjs").catch((error) =>
    assert.fail(`Aegis matrix evidence builder is unavailable: ${error.message}`));
}

async function loadJson(relative) {
  return readFile(new URL(relative, root), "utf8").then(JSON.parse);
}

async function loadCompileInputs() {
  const [{ rebuildAegisMatrixPreregistration }, policy, taskDefinitionText, ...records] =
    await Promise.all([
      import("../scripts/build-aegis-matrix-preregistration.mjs"),
      loadJson("policies/adaptive-evidence.v2.json"),
      readFile(new URL(
        "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
        root,
      ), "utf8"),
      ...variants.flatMap((variant) => [
        loadJson(`evidence/adaptive-evidence-v2/aegis-matrix/prompts/${variant}.json`),
        loadJson(`evidence/adaptive-evidence-v2/aegis-matrix/artifacts/${variant}.json`),
        loadJson(`evidence/adaptive-evidence-v2/aegis-matrix/observations/${variant}.json`),
      ]),
    ]);
  const preregistration = await rebuildAegisMatrixPreregistration({ root, hostPolicyPath });
  const captures = {};
  for (const [index, variant] of variants.entries()) {
    captures[variant] = {
      prompt: records[index * 3],
      artifact: records[index * 3 + 1],
      observation: records[index * 3 + 2],
    };
  }
  const layers = {};
  for (const layer of preregistration.environment.capability.selectedLayers) {
    layers[layer.name] = {
      ...layer,
      text: await readFile(new URL(layer.path, root), "utf8"),
    };
  }
  return {
    policy,
    trial: preregistration.trial,
    environment: preregistration.environment,
    taskDefinitionText,
    layers,
    captures,
  };
}

test("fresh five-condition matrix compiles into model evidence without promotion", async () => {
  const { rebuildAegisMatrixEvidence } = await evidenceModule();
  const first = await rebuildAegisMatrixEvidence({ root, hostPolicyPath });
  const second = await rebuildAegisMatrixEvidence({ root, hostPolicyPath });

  assert.deepEqual(first.files, second.files);
  assert.deepEqual(first.ledger.rows.map(({ variant }) => variant), variants);
  assert.deepEqual(first.ledger.rows.map(({ proofLevel }) => proofLevel),
    variants.map(() => "model"));
  assert.deepEqual(first.ledger.rows.map(({ score }) => score), [26, 27, 3, 26, 0]);
  assert.ok(first.ledger.rows.every(({ criticalRegression }) => criticalRegression));
  assert.equal(first.verification.valid, true);
  assert.equal(first.verification.rowCount, 5);

  assert.equal(first.profile.lifecycleState, "ineligible");
  assert.equal(first.profile.recommendedMode, "guardrail");
  assert.equal(first.profile.promotableEvidenceRows, 4);
  assert.deepEqual(first.profile.failedGates, ["criticalRegressions"]);

  assert.equal(first.lifecycle.action, "promote");
  assert.equal(first.lifecycle.status, "rejected");
  assert.equal(first.lifecycle.priorMode, "native");
  assert.equal(first.lifecycle.nextMode, "native");
  assert.equal(first.lifecycle.authorityExpanded, false);
  assert.ok(first.lifecycle.reasonCodes.includes("criticalRegressions"));
  assert.ok(first.lifecycle.reasonCodes.includes("profile-not-eligible"));
  assert.ok(first.lifecycle.reasonCodes.includes("mode-not-recommended"));

  assert.deepEqual(Object.keys(first.files).sort(), [
    "evidence/adaptive-evidence-v2/aegis-matrix/ledger.json",
    "evidence/adaptive-evidence-v2/aegis-matrix/lifecycle.json",
    "evidence/adaptive-evidence-v2/aegis-matrix/profile.json",
  ]);
});

test("matrix compiler rejects artifact and evaluator tampering", async () => {
  const { compileAegisMatrixEvidence } = await evidenceModule();
  const input = await loadCompileInputs();

  const artifactTamper = structuredClone(input);
  artifactTamper.captures.guardrail.artifact.artifactText += " ";
  assert.throws(
    () => compileAegisMatrixEvidence(artifactTamper),
    /artifact digest|artifact bytes/i,
  );

  const observationTamper = structuredClone(input);
  observationTamper.captures.method.observation.evaluation.score = 30;
  assert.throws(
    () => compileAegisMatrixEvidence(observationTamper),
    /evaluation.*exact|evaluation.*match/i,
  );
});

test("checked matrix ledger, profile, and lifecycle rebuild exactly", async () => {
  const { verifyCheckedAegisMatrixEvidence } = await evidenceModule();
  assert.deepEqual(
    await verifyCheckedAegisMatrixEvidence({ root, hostPolicyPath }),
    { valid: true, files: 3 },
  );
});
