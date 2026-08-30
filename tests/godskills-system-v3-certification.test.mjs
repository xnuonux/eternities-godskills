import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildGodskillsSystemV3, certificationStatusV3 } from "../scripts/build-godskills-system-v3-certification.mjs";
import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");

test("system v3 certifies the combined corpus and twenty-two universal routes", async () => {
  const expected = JSON.parse(await readFile(path.join(root, "receipts/godskills-system-certification-v3.json"), "utf8"));
  const actual = await buildGodskillsSystemV3({ root, write: false });
  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "certified");
  assert.equal(actual.counts.rawSourceRecords, 16876);
  assert.equal(actual.counts.uniqueSourceIdentities, 15993);
  assert.equal(actual.counts.canonicalBodies, 5209);
  assert.equal(actual.counts.unresolvedSources, 0);
  assert.equal(actual.counts.promotedCards, 22);
  assert.equal(actual.gates.historicalSystemV2DigestExact, true);
});

test("system v3 binds all proofs and proves no activation or authority expansion", async () => {
  const receipt = await buildGodskillsSystemV3({ root, write: false });
  for (const artifact of Object.values(receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
  assert.equal(receipt.gates.sourceInstructionsActivated, false);
  assert.equal(receipt.gates.thirdPartyCodeExecuted, false);
  assert.equal(receipt.gates.hostActivationPerformed, false);
  assert.equal(receipt.gates.authorityExpanded, false);
});

test("system v3 status fails closed on stale proofs coverage or activation", () => {
  const base = { exact: true, terminalCoverage: true, promoted: true, noActivation: true, authorityPreserved: true };
  assert.equal(certificationStatusV3(base), "certified");
  assert.equal(certificationStatusV3({ ...base, exact: false }), "failed");
  assert.equal(certificationStatusV3({ ...base, terminalCoverage: false }), "failed");
  assert.equal(certificationStatusV3({ ...base, noActivation: false }), "failed");
});
