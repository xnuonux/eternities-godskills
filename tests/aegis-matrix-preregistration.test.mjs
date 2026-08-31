import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const hostPolicyPath = "C:\\Users\\Dom\\.codex\\AGENTS.md";
const hostPolicySnapshotPath = fileURLToPath(new URL(
  "evidence/adaptive-evidence-v2/aegis-matrix/host-policy.snapshot.md",
  root,
));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function preregistrationModule() {
  return import("../scripts/build-aegis-matrix-preregistration.mjs").catch((error) =>
    assert.fail(`Aegis matrix preregistration builder is unavailable: ${error.message}`));
}

test("Aegis matrix preregistration binds model, host policy, prompt constructor, layers, and verifier", async () => {
  const [{ rebuildAegisMatrixPreregistration, verifyMatrixCommitments }, contracts, trials] =
    await Promise.all([
    preregistrationModule(),
    import("../src/adaptive-evidence-contracts.mjs"),
    import("../src/adaptive-evidence-trials.mjs"),
    ]);
  const [first, second, policy, taskDefinition, comparisonPolicy, evaluatorBytes, promptBytes,
    hostPolicyBytes, executableReceiptBytes, taskDefinitionBytes] = await Promise.all([
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
    readFile(new URL("receipts/adaptive-activation-executable-v1.json", root)),
    readFile(new URL(
      "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
      root,
    )),
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
  const commitments = {
    comparisonPolicy,
    taskDefinitionSha256: sha256(taskDefinitionBytes),
    promptConstructorSha256: sha256(promptBytes),
    evaluatorSha256: sha256(evaluatorBytes),
    layers: first.environment.capability.selectedLayers,
  };
  assert.equal(verifyMatrixCommitments(commitments), true);
  assert.throws(() => verifyMatrixCommitments({
    ...commitments,
    promptConstructorSha256: "0".repeat(64),
  }), /prompt constructor/i);
  const executableReceipt = JSON.parse(executableReceiptBytes);
  assert.deepEqual(first.environment.executableTrustRoot, {
    canonicalCommit: "f6b828ffbea29cf28cba751d4438e5c41a8deb2d",
    receipt: {
      path: "receipts/adaptive-activation-executable-v1.json",
      sha256: sha256(executableReceiptBytes),
      bytes: executableReceiptBytes.length,
      receiptDigest: executableReceipt.receiptDigest,
      status: executableReceipt.status,
      protocolId: executableReceipt.protocolId,
      parentReceipt: executableReceipt.parentReceipt,
    },
  });
  assert.equal(
    first.environment.executableTrustRoot.receipt.receiptDigest,
    "c5a086bb131ff7e1a9508f02b95796ae9066627be3e8e1f8b7e57421220e9bd7",
  );
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
  const [livePolicy, snapshotPolicy] = await Promise.all([
    readFile(hostPolicyPath),
    readFile(hostPolicySnapshotPath),
  ]);
  assert.notEqual(sha256(livePolicy), sha256(snapshotPolicy));
  const result = await verifyCheckedAegisMatrixPreregistration({
    root,
    hostPolicyPath,
    hostPolicySnapshotPath,
  });
  assert.deepEqual(result, { valid: true, files: 2 });
});
