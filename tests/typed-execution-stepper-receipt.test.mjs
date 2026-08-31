import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildDeterministicTypedExecutionStepperFixture,
  rebuildTypedExecutionStepperReceipt,
  verifyTypedExecutionStepperFixture,
  verifyTypedExecutionStepperReceipt,
} from "../scripts/build-typed-execution-stepper-v1-receipt.mjs";
import {
  canonicalJson,
  root,
  rootPath,
} from "./helpers/typed-composition-fixture.mjs";

test("typed execution stepper fixture reproduces the exact validated replay boundary", async () => {
  const committedText = await readFile(new URL("fixtures/typed-execution-stepper-v1.json", root), "utf8");
  const committed = verifyTypedExecutionStepperFixture(JSON.parse(committedText));
  const rebuilt = verifyTypedExecutionStepperFixture(
    await buildDeterministicTypedExecutionStepperFixture(),
  );
  assert.equal(committedText, canonicalJson(committed));
  assert.deepEqual(rebuilt, committed);
});

test("typed execution stepper receipt reproduces from its exact source commit", async (t) => {
  let text;
  try {
    text = await readFile(new URL("receipts/typed-execution-stepper-v1.json", root), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      t.skip("release receipt has not been issued yet");
      return;
    }
    throw error;
  }
  const receipt = verifyTypedExecutionStepperReceipt(JSON.parse(text));
  const rebuilt = await rebuildTypedExecutionStepperReceipt({
    repositoryRoot: rootPath,
    sourceCommit: receipt.source.commit,
    testRuns: receipt.testRuns,
  });
  assert.equal(text, canonicalJson(receipt));
  assert.deepEqual(rebuilt, receipt);
});
