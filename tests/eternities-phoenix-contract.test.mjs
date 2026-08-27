import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { validateCapabilityContract } from "../src/schema.mjs";
import { validateCompositionContract } from "../src/composition.mjs";
import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");
const json = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const text = async (relative) => readFile(path.join(root, relative), "utf8");

const candidateSourceIds = [
  "skill-0a8894248d762165", "skill-133f5225af6504c2", "skill-1ee9fedf1e9dbc44",
  "skill-4154217d9a19415d", "skill-4e367ac15eb8e30d", "skill-6006574eb04347a3",
  "skill-88e5556bb91d8fa2", "skill-b1990e98aab2f845", "skill-c07be47a3d2362f7",
  "skill-cac368fed7372edd", "skill-d6cda383b52cdd73", "skill-ec6a7338ff8ed22f",
];

test("Phoenix promotes exactly the eight candidate clusters and twelve sources", async () => {
  const clusters = await json("clusters/debugging-recovery.v1.json");
  const synthesis = await json("syntheses/eternities-phoenix.v1.json");
  const candidates = clusters.clusters.filter(({ synthesisDecision }) => synthesisDecision === "candidate");
  assert.equal(candidates.length, 8);
  assert.equal(clusters.clusters.filter(({ synthesisDecision }) => synthesisDecision === "deferred").reduce((total, cluster) => total + cluster.members.length, 0), 105);
  assert.equal(clusters.clusters.filter(({ synthesisDecision }) => synthesisDecision === "rejected").reduce((total, cluster) => total + cluster.members.length, 0), 12);
  assert.deepEqual(synthesis.clusterIds, candidates.map(({ id }) => id).sort());
  assert.deepEqual(synthesis.sourceIds, candidateSourceIds);
  assert.equal(synthesis.deferredClusterCount, 105);
  assert.equal(synthesis.rejectedClusterCount, 12);
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
});

test("Phoenix is an agent-neutral, fail-closed composition contract", async () => {
  const contract = await json("skills/eternities-phoenix/references/capability-contract.json");
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.name, "eternities-phoenix");
  assert.equal(contract.sourceIds.length, 12);
  assert.equal(contract.sourceEvidence.clusters.length, 8);
  assert.ok(contract.effects.includes("read"));
  assert.ok(!contract.effects.includes("external-write"));
  assert.match(JSON.stringify(contract), /fail closed|missing reproduction|missing rollback|authority gap/i);
  assert.match(JSON.stringify(contract), /production mutation|destructive repair|credentials|external systems/i);
});

test("Phoenix artifacts self-report exact digests and preserve all evaluation kinds", async () => {
  const synthesis = await json("syntheses/eternities-phoenix.v1.json");
  const receipt = await json("receipts/promotions/eternities-phoenix.json");
  const cases = await json("skills/eternities-phoenix/evals/cases.json");
  for (const [name, artifact] of Object.entries(synthesis.artifacts)) if (name !== "promotionReceipt") assert.equal(artifact.sha256, sha256(await text(artifact.path)));
  assert.equal(receipt.skillName, "eternities-phoenix");
  assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
  assert.deepEqual(receipt.candidate.unresolvedEffects, []);
  for (const kind of ["direct", "paraphrase", "exclusion", "conflict"]) assert.ok(cases.cases.some(({ kind: actual }) => actual === kind));
  assert.deepEqual((await readdir(path.join(root, "skills/eternities-phoenix"))).sort(), ["SKILL.md", "evals", "references"]);
});
