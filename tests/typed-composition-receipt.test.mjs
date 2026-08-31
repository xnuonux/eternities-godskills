import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  rebuildTypedCompositionV1,
  verifyTypedCompositionRelease,
} from "../scripts/build-typed-composition-v1.mjs";
import { canonicalJson, root, sha256 } from "./helpers/typed-composition-fixture.mjs";

const expectedArtifacts = [
  "artifacts/typed-composition/activation.v1.json",
  "artifacts/typed-composition/budget.v1.json",
  "artifacts/typed-composition/canary-execution.v1.json",
  "artifacts/typed-composition/compatibility.v1.json",
  "artifacts/typed-composition/method.v1.json",
  "artifacts/typed-composition/plan.v1.json",
  "artifacts/typed-composition/registry.v1.json",
  "artifacts/typed-composition/rejection-matrix.v1.json",
  "artifacts/typed-composition/vocabulary.v1.json",
];

test("portable typed-composition schemas are closed and pin all three public envelopes", async () => {
  for (const [relative, protocol] of [
    ["schemas/typed-composition-plan.v1.schema.json", "eternities-typed-composition-plan-v1"],
    ["schemas/typed-mission-method.v1.schema.json", "eternities-typed-mission-method-v1"],
    ["schemas/typed-composition-execution.v1.schema.json", "eternities-typed-composition-execution-v1"],
  ]) {
    const schema = JSON.parse(await readFile(new URL(relative, root), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.protocolId.const, protocol);
    assert.ok(schema.required.includes(protocol.includes("plan") ? "planDigest"
      : protocol.includes("method") ? "methodDigest" : "executionDigest"));
  }
});

test("the release builder reproduces one exact typed graph, method, execution, and rejection matrix", async () => {
  const first = await rebuildTypedCompositionV1({ root });
  const second = await rebuildTypedCompositionV1({ root });

  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first.files), expectedArtifacts);
  assert.equal(first.receipt.schemaVersion, 1);
  assert.equal(first.receipt.id, "typed-composition-v1");
  assert.equal(first.receipt.status, "verified-build");
  assert.deepEqual(first.receipt.verification, {
    focusedTests: 14,
    parentCompatibilityTests: 31,
    combinedFocusedAndParentTests: 45,
    fullRepositoryTests: 782,
    inlineAdversarialReview: "passed-after-four-boundary-repairs",
    independentReview: "not-run-inline-only-user-constraint",
  });
  assert.equal(first.receipt.protocolId, "eternities-typed-composition-v1");
  assert.equal(first.receipt.parents.capabilityLayer.receiptDigest,
    "1c19271951abb00e93529656a35e8fb52dccc2f3cf0b6208bcee6821361ab788");
  assert.equal(first.receipt.parents.activationExecutable.receiptDigest,
    "c5a086bb131ff7e1a9508f02b95796ae9066627be3e8e1f8b7e57421220e9bd7");
  assert.equal(first.receipt.canary.nodes, 2);
  assert.equal(first.receipt.canary.links, 6);
  assert.equal(first.receipt.canary.estimatedContextBytes, 8571);
  assert.equal(first.receipt.canary.authorityExpanded, false);
  assert.equal(first.receipt.sourceClosure.complete, true);
  assert.ok(first.receipt.sourceClosure.modules.some(({ path }) => path === "src/typed-composition.mjs"));
  assert.ok(first.receipt.sourceClosure.modules.some(({ path }) => path === "src/adaptive-activation-protocol.mjs"));
  assert.deepEqual(first.receipt.generatedArtifacts.map(({ path }) => path), expectedArtifacts);
  for (const row of first.receipt.generatedArtifacts) {
    assert.equal(row.sha256, sha256(first.files[row.path]));
    assert.equal(row.bytes, Buffer.byteLength(first.files[row.path]));
  }
  const unsigned = structuredClone(first.receipt);
  delete unsigned.receiptDigest;
  assert.equal(first.receipt.receiptDigest, sha256(canonicalJson(unsigned)));

  const method = JSON.parse(first.files["artifacts/typed-composition/method.v1.json"]);
  const execution = JSON.parse(first.files["artifacts/typed-composition/canary-execution.v1.json"]);
  const rejections = JSON.parse(first.files["artifacts/typed-composition/rejection-matrix.v1.json"]);
  assert.equal(method.aggregate.methodBodiesEmbedded, 0);
  assert.equal(method.aggregate.sourceBodiesTransported, 0);
  assert.equal(execution.receipt.methodDigest, method.methodDigest);
  assert.equal(execution.outputs.implementation.status, "verified");
  assert.ok(rejections.cases.length >= 16);
  assert.equal(rejections.cases.every(({ observed }) => observed === "rejected"), true);
});

test("checked release artifacts, receipt, and certification rebuild byte for byte", async () => {
  const result = await verifyTypedCompositionRelease({ root });
  assert.equal(result.valid, true);
  assert.equal(result.generatedArtifacts, expectedArtifacts.length);
  assert.match(result.receiptDigest, /^[a-f0-9]{64}$/);
});
