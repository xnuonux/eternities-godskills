import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildOperationalCapabilityReceipt,
  classifyOperationalPrompt,
} from "../src/operational-capability-evaluation.mjs";
import { buildOperationalOwnerBaseline } from "../src/operational-capability-baseline.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const recordSet = JSON.parse(fs.readFileSync(path.join(root, "data/operational-capabilities.v1.json")));
const wave = JSON.parse(fs.readFileSync(path.join(root, "data/universal-capability-wave.v1.json")));
const reviews = fs.readFileSync(path.join(root, "artifacts/wave2-semantic/review-evidence.jsonl"), "utf8")
  .trim().split(/\r?\n/).map(JSON.parse);

function evidence(id = "bounded-service-shutdown") {
  const record = recordSet.records.find((entry) => entry.id === id);
  const target = wave.targets.find((entry) => entry.implementationOwnerId === id);
  const sourceReviews = target.reviewDigests.map((digest) => reviews.find((review) => review.reviewDigest === digest));
  const files = Object.fromEntries(
    ["SKILL.md", "references/capability-contract.json", "references/provenance.json", "evals/cases.json"].map((file) => [
      file,
      fs.readFileSync(path.join(root, "skills", id, file), "utf8"),
    ]),
  );
  const ownerSkillPath = `skills/${record.ownerGodskillId}/SKILL.md`;
  const ownerContractPath = `skills/${record.ownerGodskillId}/references/capability-contract.json`;
  const ownerSkill = fs.readFileSync(path.join(root, ownerSkillPath));
  const ownerContract = fs.readFileSync(path.join(root, ownerContractPath));
  const baselineEvidence = buildOperationalOwnerBaseline({
    record,
    owner: {
      id: record.ownerGodskillId,
      entrypoint: { path: ownerSkillPath, sha256: crypto.createHash("sha256").update(ownerSkill).digest("hex"), bytes: ownerSkill.byteLength },
      contract: { path: ownerContractPath, sha256: crypto.createHash("sha256").update(ownerContract).digest("hex"), bytes: ownerContract.byteLength },
      contractBody: JSON.parse(ownerContract),
    },
  });
  return {
    record,
    target,
    sourceReviews,
    files,
    baselineEvidence,
    baselineOwnerFiles: { entrypoint: ownerSkill, contract: ownerContract },
  };
}

test("every authored case is classified to its independently declared expected outcome", () => {
  for (const record of recordSet.records) {
    for (const entry of record.evaluationCases) {
      assert.equal(classifyOperationalPrompt(record, entry.prompt), entry.expected, `${record.id}:${entry.id}`);
    }
  }
});

test("unknown and ambiguous prompts do not select an operational skill", () => {
  const record = evidence().record;
  assert.equal(classifyOperationalPrompt(record, "write a poem about a lighthouse"), "not-applicable:no-evidence");
  assert.equal(
    classifyOperationalPrompt(record, `${record.useWhen[0]} ${record.doNotUseWhen[0]}`),
    "refuse:unresolved-conflict",
  );
});

test("an exact candidate earns a bounded terminal promotion receipt", () => {
  const receipt = buildOperationalCapabilityReceipt(evidence());
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.candidate.criticalPassed, 9);
  assert.equal(receipt.candidate.criticalTotal, 9);
  assert.equal(receipt.candidate.unresolvedEffects.length, 0);
  assert.ok(receipt.candidate.tokenCount <= 1600);
  assert.equal(receipt.evidence.exactArtifacts, true);
  assert.equal(receipt.evidence.sourceProseCopied, false);
  assert.equal(receipt.evidence.sourceInstructionsExecuted, false);
  assert.match(receipt.limitation, /does not prove live-agent routing/i);
});

test("stale bytes and unresolved effects block promotion", () => {
  const stale = evidence();
  stale.files["SKILL.md"] += "\nstale mutation\n";
  assert.throws(() => buildOperationalCapabilityReceipt(stale), /artifact bytes do not match materialized record/);

  const unresolved = evidence();
  unresolved.record = { ...unresolved.record, allowedEffects: ["external-write"] };
  unresolved.record.requiredAuthority = [...unresolved.record.requiredAuthority, "external-effect"];
  assert.throws(() => buildOperationalCapabilityReceipt(unresolved), /artifact bytes do not match materialized record/);
});

test("promotion refuses absent or stale executable owner baseline evidence", () => {
  const absent = evidence();
  delete absent.baselineEvidence;
  assert.throws(() => buildOperationalCapabilityReceipt(absent), /baseline evidence is required/i);

  const stale = evidence();
  stale.baselineEvidence.ownerArtifacts.entrypoint.sha256 = "f".repeat(64);
  assert.throws(() => buildOperationalCapabilityReceipt(stale), /baseline owner entrypoint/i);
});
