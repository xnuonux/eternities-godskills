import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const hostPolicyPath = "C:\\Users\\Dom\\.codex\\AGENTS.md";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function preregistrationModule() {
  return import("../scripts/build-aegis-matrix-preregistration.mjs").catch((error) =>
    assert.fail(`Aegis matrix preregistration builder is unavailable: ${error.message}`));
}

test("Aegis matrix preregistration binds model, host policy, prompt constructor, layers, and verifier", async () => {
  const [{ rebuildAegisMatrixPreregistration }, contracts, trials] = await Promise.all([
    preregistrationModule(),
    import("../src/adaptive-evidence-contracts.mjs"),
    import("../src/adaptive-evidence-trials.mjs"),
  ]);
  const [first, second, policy, taskDefinition, comparisonPolicy, evaluatorBytes, promptBytes,
    hostPolicyBytes] = await Promise.all([
    rebuildAegisMatrixPreregistration({ root, hostPolicyPath }),
    rebuildAegisMatrixPreregistration({ root, hostPolicyPath }),
    readFile(new URL("policies/adaptive-evidence.v2.json", root), "utf8").then(JSON.parse),
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
      root,
    ), "utf8").then(JSON.parse),
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/comparison-policy.json",
      root,
    ), "utf8").then(JSON.parse),
    readFile(new URL("scripts/evaluate-aegis-matrix.mjs", root)),
    readFile(new URL("scripts/construct-aegis-matrix-prompt.mjs", root)),
    readFile(hostPolicyPath),
  ]);

  assert.deepEqual(first.files, second.files);
  assert.deepEqual(Object.keys(first.files).sort(), [
    "evidence/adaptive-evidence-v2/aegis-matrix/environment.json",
    "evidence/adaptive-evidence-v2/aegis-matrix/trial-envelope.json",
  ]);
  assert.equal(first.environment.modelFamily, "gpt-5.6-terra");
  assert.equal(first.environment.reasoningTier, "high");
  assert.equal(first.environment.runner, "codex-multi-agent-v1");
  assert.deepEqual(first.environment.externalToolsAllowed, []);
  assert.equal(first.environment.authorityExpanded, false);
  assert.equal(first.environment.hostPolicy.sha256, sha256(hostPolicyBytes));
  assert.equal(first.environment.promptConstructor.sha256, sha256(promptBytes));
  assert.equal(first.environment.evaluator.sha256, sha256(evaluatorBytes));
  assert.equal(first.environment.taskDefinitionDigest, contracts.canonicalDigest(taskDefinition));
  assert.equal(first.environment.comparisonPolicyDigest, contracts.canonicalDigest(comparisonPolicy));
  assert.deepEqual(
    first.environment.disclosures.map(({ variant, layers }) => [
      variant,
      layers.map(({ name }) => name),
    ]),
    [
      ["raw", []],
      ["guardrail", ["guardrails"]],
      ["method", ["method"]],
      ["reviewer", ["reviewer"]],
      ["combined", ["reviewer"]],
    ],
  );
  assert.equal(first.trial.status, "preregistered");
  assert.equal(first.trial.profileIdentity.environmentId, first.environment.environmentDigest);
  assert.equal(first.trial.evaluator.digest, sha256(evaluatorBytes));
  assert.equal(first.trial.taskDefinition.digest, contracts.canonicalDigest(taskDefinition));
  assert.equal(first.trial.comparisonPolicy.digest, contracts.canonicalDigest(comparisonPolicy));
  assert.equal(trials.verifyTrialEnvelope({
    trial: first.trial,
    policy,
    expectedPolicyDigest: contracts.canonicalDigest(policy),
  }).valid, true);
  assert.ok(first.environment.hostContextLimitations.includes(
    "global-system-instructions-beyond-the-user-global-policy-file-are-not-byte-observable",
  ));
});

test("checked Aegis environment and trial envelope rebuild exactly before dispatch", async () => {
  const { verifyCheckedAegisMatrixPreregistration } = await preregistrationModule();
  const result = await verifyCheckedAegisMatrixPreregistration({ root, hostPolicyPath });
  assert.deepEqual(result, { valid: true, files: 2 });
});
