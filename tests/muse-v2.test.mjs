import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { validateCompositionContract } from "../src/composition.mjs";

const root = new URL("../", import.meta.url);
const text = async (relative) => readFile(new URL(relative, root), "utf8");
const json = async (relative) => JSON.parse(await text(relative));

test("Muse v2 preserves all four v1 routes and adds bounded visual systems", async () => {
  const [contract, synthesis, clusterSet] = await Promise.all([
    json("skills/eternities-muse/references/capability-contract.json"),
    json("syntheses/eternities-muse.v2.json"),
    json("clusters/visual-3d-motion.v1.json"),
  ]);
  const candidate = clusterSet.clusters.filter(({ synthesisDecision }) => synthesisDecision === "candidate");
  assert.equal(candidate.length, 5);
  assert.equal(candidate.flatMap(({ members }) => members).length, 40);
  assert.equal(new Set(candidate.flatMap(({ members }) => members.map(({ sourceId }) => sourceId))).size, 40);
  assert.deepEqual(synthesis.clusters.map(({ id }) => id), candidate.map(({ id }) => id));
  assert.equal(synthesis.sourceIds.length, 40);
  assert.equal(new Set(synthesis.sourceIds).size, 40);
  for (const id of ["visual-forensics", "interface-art-direction", "motion-story", "visual-acceptance"]) assert.ok(contract.routes.some((route) => route.id === id), id);
  assert.ok(contract.routes.find(({ id }) => id === "interface-art-direction").capabilities.includes("3d-scene-budget"));
  assert.ok(contract.routes.find(({ id }) => id === "motion-story").capabilities.includes("semantic-motion-state"));
  assert.ok(contract.routes.find(({ id }) => id === "visual-acceptance").capabilities.includes("shader-safety"));
  assert.ok(contract.operations.includes("bound geometry cameras lighting and render passes to device-aware budgets"));
  assert.doesNotThrow(() => validateCompositionContract(contract));
});

test("Muse v2 retains fail-closed boundaries and excludes non-promoted evidence", async () => {
  const [contract, synthesis, cases, clusterSet] = await Promise.all([
    json("skills/eternities-muse/references/capability-contract.json"),
    json("syntheses/eternities-muse.v2.json"),
    json("skills/eternities-muse/evals/cases.v2.json"),
    json("clusters/visual-3d-motion.v1.json"),
  ]);
  const candidateIds = new Set(clusterSet.clusters.filter(({ synthesisDecision }) => synthesisDecision === "candidate").map(({ id }) => id));
  assert.ok(synthesis.clusters.every(({ id }) => candidateIds.has(id)));
  assert.match(JSON.stringify(contract), /rights|shader|render|publication|credential|mutation/i);
  for (const id of ["exclude-rights-ambiguity", "exclude-unsafe-shader", "exclude-unverified-render", "exclude-external-publication", "exclude-provider-credentials", "exclude-destructive-asset-mutation"]) {
    assert.ok(cases.cases.some((candidate) => candidate.id === id), id);
  }
  assert.equal(cases.cases.filter(({ expected }) => expected.startsWith("fail-closed:")).length, 6);
  for (const id of ["direct-forensics", "direct-interface", "direct-story", "direct-acceptance"]) assert.ok(cases.cases.some((candidate) => candidate.id === id && candidate.expected.startsWith("route:")));
});

test("Muse v2 hashes its exact artifacts and declares fixture limits", async () => {
  const [receipt, synthesis, synthesisText, skillText, contractText, routingText, casesText, promotionText] = await Promise.all([
    json("receipts/promotions/eternities-muse-v2.json"),
    json("syntheses/eternities-muse.v2.json"),
    text("syntheses/eternities-muse.v2.json"),
    text("skills/eternities-muse/SKILL.md"),
    text("skills/eternities-muse/references/capability-contract.json"),
    text("skills/eternities-muse/references/routing-card.json"),
    text("skills/eternities-muse/evals/cases.v2.json"),
    text("receipts/promotions/eternities-muse-v2.json"),
  ]);
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.evidence.candidateSourceCoverage, 40);
  assert.equal(receipt.evidence.sourceProseCopied, false);
  assert.equal(receipt.evidence.externalMutation, false);
  assert.equal(synthesis.artifacts.skill.sha256, sha256(skillText));
  assert.equal(synthesis.artifacts.capabilityContract.sha256, sha256(contractText));
  assert.equal(synthesis.artifacts.routingCard.sha256, sha256(routingText));
  assert.equal(synthesis.artifacts.evaluation.sha256, sha256(casesText));
  assert.equal(synthesis.artifacts.promotionReceipt.path, "receipts/promotions/eternities-muse-v2.json");
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.equal(receipt.limits.liveModelRoutingProven, false);
  assert.equal(receipt.limits.commandlessEvaluation, true);
});
