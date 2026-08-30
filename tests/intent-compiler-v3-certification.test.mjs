import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildIntentCompilerV3 } from "../scripts/build-intent-compiler-v3-receipt.mjs";

const rootUrl = new URL("../", import.meta.url);
const root = rootUrl.pathname.replace(/^\/(.:)/, "$1");

test("intent compiler v3 certifies the twenty-two-card arena and prior generalization", async () => {
  const expected = JSON.parse(await readFile(new URL("receipts/intent-compiler-v3.json", rootUrl), "utf8"));
  const actual = await buildIntentCompilerV3({ root, write: false });
  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "certified");
  assert.equal(actual.metrics.currentArena.caseCount, 151);
  assert.equal(actual.metrics.currentArena.failCount, 0);
  assert.equal(actual.metrics.currentArena.positiveExactSelectionCount, 92);
  assert.equal(actual.metrics.generalization.failCount, 0);
  assert.equal(actual.gates.omnibusCovered, true);
  assert.equal(actual.gates.sourceBodiesLoadedDuringRouting, false);
});
