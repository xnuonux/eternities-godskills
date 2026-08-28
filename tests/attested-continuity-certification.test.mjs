import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildAttestedContinuityReceipt } from "../scripts/build-attested-continuity-receipt.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

test("attested continuity certification rebuilds from exact current artifacts", async () => {
  const expected = JSON.parse(await readFile(path.join(root, "receipts/promotions/attested-task-continuity.json"), "utf8"));
  const actual = await buildAttestedContinuityReceipt({ root, write: false });
  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "certified");
  assert.equal(actual.metrics.estimatedContextReductionTokens > 0, true);
  assert.equal(actual.metrics.estimatedContextRatio < 1, true);
  assert.equal(actual.metrics.authorityExpansionRejected, true);
  assert.equal(actual.metrics.futureTimeRejected, true);
});

test("certification excludes source hooks and makes no host activation claim", async () => {
  const receipt = await buildAttestedContinuityReceipt({ root, write: false });
  assert.deepEqual(receipt.source.excludedMechanisms, [
    "always-on tool hooks",
    "full plan injection before each tool call",
    "slash-command dependence",
    "stop-loop enforcement",
  ]);
  assert.equal(receipt.gates.perToolPromptInjectionInstalled, false);
  assert.equal(receipt.gates.slashCommandRequired, false);
  assert.equal(receipt.gates.hostActivationPerformed, false);
  assert.equal(receipt.proofLimits.hostActivation, "not-performed");
  assert.match(receipt.proofLimits.contextCostComparison, /synthetic.*estimate/i);
});
