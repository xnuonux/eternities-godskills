import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalDigest,
} from "../src/adaptive-evidence-contracts.mjs";
import { createObservationProposal } from "../src/adaptive-evidence-trials.mjs";
import { validateEvaluatorPackageReceipt } from "../src/adaptive-evaluator-package.mjs";

const repositoryRoot = new URL("../", import.meta.url);
const variants = Object.freeze(["raw", "guardrail", "method", "reviewer", "combined"]);
const outputPaths = Object.freeze([
  "artifacts/adaptive-evaluators/aegis-v2/shadow-replay.v1.json",
  "docs/adaptive-evaluator-aegis-v2-shadow-report.md",
  "receipts/adaptive-evaluator-aegis-v2.json",
  "receipts/adaptive-evaluator-packages-v1.json",
  "schemas/adaptive-evaluator-package-v1.schema.json",
  "schemas/adaptive-evaluator-request-v1.schema.json",
  "schemas/adaptive-evaluator-result-v1.schema.json",
]);

async function builder() {
  return import("../scripts/build-aegis-evaluator-v2-shadow-replay.mjs").catch((error) =>
    assert.fail(`Aegis evaluator v2 shadow builder is unavailable: ${error.message}`));
}

async function readJson(relativePath, root = repositoryRoot) {
  return JSON.parse(await readFile(new URL(relativePath, root), "utf8"));
}

test("rebuilds one deterministic ineligible five-variant shadow replay", async () => {
  const {
    rebuildAegisEvaluatorV2Shadow,
  } = await builder();
  const [first, second, trial, packageJson, adaptivePolicy] = await Promise.all([
    rebuildAegisEvaluatorV2Shadow({ root: repositoryRoot }),
    rebuildAegisEvaluatorV2Shadow({ root: repositoryRoot }),
    readJson("evidence/adaptive-evidence-v2/aegis-matrix/trial-envelope.json"),
    readJson("package.json"),
    readJson("policies/adaptive-evidence.v2.json"),
  ]);

  assert.deepEqual(second, first);
  assert.deepEqual(Object.keys(first), [
    "schemas",
    "packageReceipt",
    "shadowReplay",
    "report",
    "aggregateReceipt",
  ]);
  assert.deepEqual(validateEvaluatorPackageReceipt(first.packageReceipt), first.packageReceipt);
  assert.equal(packageJson.scripts["build:adaptive-evaluator-packages"],
    "node scripts/build-aegis-evaluator-v2-shadow-replay.mjs");

  const shadow = first.shadowReplay;
  assert.equal(shadow.schemaVersion, 1);
  assert.equal(shadow.id, "aegis-v2-archived-matrix-shadow-replay");
  assert.equal(shadow.status, "retrospective-shadow-ineligible");
  assert.equal(shadow.ledgerAdmissionAllowed, false);
  assert.equal(shadow.profilePromotionAllowed, false);
  assert.equal(shadow.lifecycleActionAllowed, false);
  assert.equal(shadow.godagentsActivationAllowed, false);
  assert.equal(shadow.sourceTrialDigest, trial.trialDigest);
  assert.equal(shadow.packageReceiptDigest, first.packageReceipt.receiptDigest);
  assert.deepEqual(shadow.variants.map(({ variant }) => variant), variants);
  assert.equal(shadow.replayDigest, canonicalDigest({
    ...shadow,
    replayDigest: undefined,
  }));

  for (const row of shadow.variants) {
    const [artifact, observation] = await Promise.all([
      readJson(row.archivedArtifact.path),
      readJson(row.archivedObservation.path),
    ]);
    assert.equal(row.archivedArtifact.artifactDigest, artifact.artifactDigest);
    assert.equal(row.archivedObservation.evaluationDigest,
      observation.evaluation.evaluationDigest);
    assert.equal(row.v2Result.variant, row.variant);
    assert.equal(row.v2Result.detectedCases, 3);
    assert.equal(row.v2Result.criticalRegression, false);
    assert.equal(row.v2Result.authorityExpanded, false);
  }

  const row = shadow.variants[1];
  assert.throws(() => createObservationProposal({
    trial: shadow,
    expectedTrialDigest: shadow.sourceTrialDigest,
    variant: row.variant,
    artifact: {
      sha256: row.archivedArtifact.artifactDigest,
      bytes: 1,
      mediaType: "application/json",
      producedAt: "2026-08-31T07:40:37.790Z",
    },
    observation: {
      score: row.v2Result.score,
      outcomeAgainstRaw: row.v2Result.comparison.outcomeAgainstRaw,
      criticalRegression: row.v2Result.criticalRegression,
      baselineArtifactDigest: row.v2Result.comparison.baselineArtifactDigest,
      comparisons: row.v2Result.comparison.counts,
      reasonCodes: row.v2Result.reasonCodes,
    },
    cost: { bytes: 1, tokens: null, latencyMs: null, monetaryCost: null },
    proofLevel: "model",
    producerId: "retrospective-shadow",
    evaluatorId: row.v2Result.evaluatorId,
    observedAt: "2026-08-31T07:40:38.228Z",
    policy: adaptivePolicy,
    expectedPolicyDigest: canonicalDigest(adaptivePolicy),
  }), /trial.*keys.*closed|trial.*identity|preregistered/i);

  assert.equal(first.aggregateReceipt.parent.receiptDigest,
    "2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d");
  assert.equal(first.aggregateReceipt.evaluatorPackage.receiptDigest,
    first.packageReceipt.receiptDigest);
  assert.equal(first.aggregateReceipt.shadowReplay.replayDigest, shadow.replayDigest);
  assert.equal(first.aggregateReceipt.receiptDigest, canonicalDigest({
    ...first.aggregateReceipt,
    receiptDigest: undefined,
  }));
  for (const limit of [
    "retrospective-only",
    "no-ledger-admission",
    "no-profile-promotion",
    "no-model-quality-proof",
    "no-godagents-activation",
  ]) assert.ok(first.aggregateReceipt.proofLimits.includes(limit), limit);

  for (const row of shadow.variants) {
    assert.match(first.report,
      new RegExp(`\\| ${row.variant} \\| .*${row.v2Result.score}.* \\|`));
  }
});

test("checked shadow outputs commit transactionally and restore on a later failure", async (t) => {
  const {
    AEGIS_SHADOW_INPUT_PATHS,
    writeAegisEvaluatorV2Shadow,
  } = await builder();
  const fixturePath = await mkdtemp(path.join(tmpdir(), "aegis-v2-shadow-transaction-"));
  t.after(() => rm(fixturePath, { recursive: true, force: true }));
  for (const relativePath of AEGIS_SHADOW_INPUT_PATHS) {
    const destination = path.join(fixturePath, ...relativePath.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(new URL(relativePath, repositoryRoot), destination);
  }
  const fixtureRoot = pathToFileURL(`${fixturePath}${path.sep}`);
  await writeAegisEvaluatorV2Shadow({ root: fixtureRoot });
  const before = Object.fromEntries(await Promise.all(outputPaths.map(async (relativePath) => [
    relativePath,
    await readFile(path.join(fixturePath, ...relativePath.split("/")), "utf8"),
  ])));

  let renames = 0;
  await assert.rejects(writeAegisEvaluatorV2Shadow({
    root: fixtureRoot,
    renameFile: async (source, destination) => {
      renames += 1;
      if (renames === 10) throw new Error("injected later rename failure");
      return rename(source, destination);
    },
  }), /injected later rename failure/i);
  assert.equal(renames, 10);
  for (const relativePath of outputPaths) {
    assert.equal(
      await readFile(path.join(fixturePath, ...relativePath.split("/")), "utf8"),
      before[relativePath],
      relativePath,
    );
  }
});
