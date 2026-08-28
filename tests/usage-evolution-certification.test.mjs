import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { assertConstructionArtifactBytes, buildUsageEvolutionEvidence } from "../scripts/build-usage-evolution-evaluation.mjs";
import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

test("usage evolution certification rebuilds byte-exact from current artifacts", async () => {
  const expectedCertification = await readJson("artifacts/usage-evolution/certification.json");
  const expectedReceipt = await readJson("receipts/promotions/sovereign-skill-refinery-usage-evolution-v1.json");
  const actual = await buildUsageEvolutionEvidence(root);
  assert.deepEqual(actual.certification, expectedCertification);
  assert.deepEqual(actual.receipt, expectedReceipt);
  assert.equal(expectedReceipt.certification.sha256, sha256(`${JSON.stringify(expectedCertification, null, 2)}\n`));
  for (const input of expectedReceipt.inputs) {
    const bytes = await readFile(path.join(root, input.path));
    assert.equal(input.sha256, sha256(bytes), input.path);
    assert.equal(input.bytes, bytes.length, input.path);
  }
});

test("certification preserves the non-adoption and proof boundaries", async () => {
  const receipt = await readJson("receipts/promotions/sovereign-skill-refinery-usage-evolution-v1.json");
  const certification = await readJson("artifacts/usage-evolution/certification.json");
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.review.disposition, "clean");
  assert.equal(receipt.evolutionDecision.status, "eligible");
  assert.equal(receipt.evolutionDecision.adopted, false);
  assert.equal(receipt.activation.automaticAdoption, false);
  assert.equal(certification.evaluation.leakageAuditPackage.record.status, "clear");
  assert.equal(certification.authority.liveSkillMutationByEngine, false);
  assert.ok(certification.proofLimits.every((limit) => limit.length > 40));
});

test("the evaluator rejects stale construction artifact bytes", async () => {
  const construction = await readJson("artifacts/usage-evolution/construction.json");
  const baseline = "# baseline\n";
  const candidate = "# candidate\n";
  assert.throws(() => assertConstructionArtifactBytes(construction.proposalPackage.record, baseline, candidate), /baseline bytes drifted/);
});
