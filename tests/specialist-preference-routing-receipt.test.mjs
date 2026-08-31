import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canonicalDigest,
  canonicalFile,
} from "../src/adaptive-evidence-contracts.mjs";
import { sha256 } from "../src/io.mjs";

async function builder() {
  return import("../scripts/build-specialist-preference-routing-v1.mjs").catch((error) =>
    assert.fail(`specialist preference receipt builder is unavailable: ${error.message}`));
}

test("builds a deterministic preference-only routing release", async () => {
  const { rebuildSpecialistPreferenceRoutingV1 } = await builder();
  const first = await rebuildSpecialistPreferenceRoutingV1();
  const second = await rebuildSpecialistPreferenceRoutingV1();
  assert.equal(canonicalFile(second.receipt), canonicalFile(first.receipt));
  assert.equal(canonicalFile(second.fixture), canonicalFile(first.fixture));

  assert.equal(first.receipt.schemaVersion, 1);
  assert.equal(first.receipt.id, "specialist-preference-routing-v1");
  assert.equal(first.receipt.status, "verified-structural-protocol");
  assert.equal(
    first.receipt.protocolId,
    "eternities-godskills-specialist-preference-v1",
  );
  const { receiptDigest, ...body } = first.receipt;
  assert.equal(receiptDigest, canonicalDigest(body));
  assert.equal(first.receipt.authorityExpanded, false);

  assert.deepEqual(first.fixture.legacy.selectedIds, ["alpha-operation"]);
  assert.equal("preference" in first.fixture.legacy, false);
  assert.deepEqual(first.fixture.equalTie.selectedIds, ["beta-operation"]);
  assert.equal(first.fixture.equalTie.preference.applied, true);
  assert.deepEqual(first.fixture.equalTie.preference.baselineSelectedIds, ["alpha-operation"]);
  assert.deepEqual(first.fixture.strongerNonpreferred.selectedIds, ["alpha-operation"]);
  assert.equal(first.fixture.strongerNonpreferred.preference.applied, false);
  assert.equal(
    first.fixture.strongerNonpreferred.preference.reason,
    "stronger-nonpreferred-selection",
  );
  assert.deepEqual(first.fixture.rejectedPreference.preference.qualifiedIds, []);
  assert.equal(first.fixture.unresolved.status, "needs-decision");
  assert.equal(first.fixture.unresolved.preference.reason, "unresolved-decision");
});

test("release receipt binds exact parents, runtime sources, fixture bytes, and gates", async () => {
  const { rebuildSpecialistPreferenceRoutingV1 } = await builder();
  const result = await rebuildSpecialistPreferenceRoutingV1();
  assert.deepEqual(result.receipt.parents, [
    {
      path: "receipts/agent-native-router-v8.json",
      sha256: "b32500d810ba66539334cbe3ae5ef31223dbf712197a061779fc21f75048ebf3",
      bytes: 7284,
    },
    {
      path: "receipts/godskills-system-certification-v3.json",
      sha256: "228ba0a63d252f0c37178ff3de8c1278d0ea878e9abeb173e7faea699f28fb57",
      bytes: 4446,
    },
    {
      path: "receipts/intent-compiler-v3.json",
      sha256: "1ca40ec9138c1d0583068ee4dc3db58f0b77b07f631a2b38d9c47eb28ccce49a",
      bytes: 3661,
    },
    {
      path: "receipts/portable-capability-manifest-v1.json",
      sha256: "f78f6aded5198e8db1591af49fe97285307427d93396b34c78dd6e5f2466f33d",
      bytes: 1128,
    },
  ]);
  for (const path of [
    "scripts/intent.mjs",
    "scripts/intent-preference.mjs",
    "src/intent-compiler.mjs",
    "src/intent-contracts.mjs",
    "src/intent-runtime.mjs",
    "src/router.mjs",
    "src/routing-contracts.mjs",
    "src/routing-index.mjs",
    "src/specialist-preference-contracts.mjs",
    "src/specialist-preference-router.mjs",
    "src/specialist-preference-routing-index.mjs",
    "src/specialist-preference-runtime.mjs",
    "tests/specialist-preference-routing.test.mjs",
  ]) {
    assert.ok(result.receipt.inputs.sources.some((entry) => entry.path === path), path);
  }
  assert.deepEqual(result.receipt.computedGates, {
    legacyShapePreserved: true,
    equalQualityTieBreakApplied: true,
    strongerNonpreferredPreserved: true,
    rejectedPreferenceNotQualified: true,
    unresolvedDecisionPreserved: true,
    preferenceOnlyDependencyBlocked: true,
    unknownPreferenceRejected: true,
    shortlistOverflowRejected: true,
    authorityExpansions: 0,
  });
  assert.ok(result.receipt.proofLimits.includes("no-specialist-quality-superiority-claim"));
  assert.ok(result.receipt.proofLimits.includes("no-eligibility-or-authority-change"));
  const output = result.receipt.outputs.find(({ path }) =>
    path === "artifacts/specialist-preference-routing-v1/fixture.json");
  assert.equal(output.sha256, sha256(result.writes[output.path]));
  assert.equal(output.bytes, Buffer.byteLength(result.writes[output.path]));
});

test("checked preference fixture and receipt match a pure rebuild", async () => {
  const { rebuildSpecialistPreferenceRoutingV1 } = await builder();
  const result = await rebuildSpecialistPreferenceRoutingV1();
  const [fixture, receipt] = await Promise.all([
    readFile(
      new URL("../artifacts/specialist-preference-routing-v1/fixture.json", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../receipts/specialist-preference-routing-v1.json", import.meta.url),
      "utf8",
    ),
  ]);
  assert.equal(fixture, result.writes["artifacts/specialist-preference-routing-v1/fixture.json"]);
  assert.equal(receipt, result.writes["receipts/specialist-preference-routing-v1.json"]);
});

test("certification binds the reviewed implementation and honest proof boundary", async () => {
  const [certification, receiptText] = await Promise.all([
    readFile(
      new URL("../docs/specialist-preference-routing-v1-certification.md", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../receipts/specialist-preference-routing-v1.json", import.meta.url),
      "utf8",
    ),
  ]);
  const receipt = JSON.parse(receiptText);
  assert.match(
    certification,
    /reviewed implementation head: `b85a7be178463a548ed92f0b1346de4f8772a527`/,
  );
  assert.match(certification, /post-repair independent re-review: `not performed`/);
  assert.match(certification, new RegExp(receipt.receiptDigest));
  assert.match(certification, new RegExp(sha256(receiptText)));
  assert.match(certification, /historical.*byte-identical|byte-identical.*historical/is);
  assert.match(certification, /no specialist-quality|no model-quality/i);
  assert.match(certification, /no authority expansion|authorityExpanded.*false/i);
  assert.match(certification, /no Godagents activation|Godagents.*not activated/i);
});
