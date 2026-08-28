import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildIntentCompilerReceipt } from "../scripts/build-intent-compiler-receipt.mjs";

const repositoryRoot = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

test("intent compiler receipt reconciles exact artifacts and arena metrics", async () => {
  const expected = JSON.parse(
    await readFile(path.join(repositoryRoot, "receipts", "intent-compiler-v1.json"), "utf8"),
  );
  const actual = await buildIntentCompilerReceipt({ root: repositoryRoot, write: false });
  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "certified");
  assert.equal(actual.metrics.caseCount, 140);
  assert.equal(actual.metrics.passCount, 140);
  assert.equal(actual.metrics.positiveCaseCount, 81);
  assert.equal(actual.metrics.positiveExactSelectionCount, 81);
  assert.equal(actual.metrics.unsafeSelectionCount, 0);
  assert.equal(actual.metrics.authorityInventionCount, 0);
  assert.equal(actual.metrics.repeatabilityMismatchCount, 0);
});

test("intent compiler certification preserves universal safety boundaries", async () => {
  const receipt = await buildIntentCompilerReceipt({ root: repositoryRoot, write: false });
  assert.deepEqual(receipt.gates, {
    ambiguityFailsClosed: true,
    authorityInventionProhibited: true,
    deterministicRepeatability: true,
    externalActionExecution: false,
    modelDependencyRequired: false,
    progressiveDisclosureBounded: true,
    skillBodiesLoadedDuringRouting: false,
    unsafeSelectionCount: 0,
  });
  assert.deepEqual(receipt.proofLimits, {
    hostAdapterDeployment: "not-performed",
    liveModelInterpretation: "not-proven-by-fixtures",
    productionOperation: "not-performed",
    semanticArena: "certified-local-fixture-evidence",
  });
  for (const digest of Object.values(receipt.artifacts)) assert.match(digest, /^[0-9a-f]{64}$/);
});
