import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { canonicalText, sha256 } from "../src/io.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";
import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";

const root = new URL("../", import.meta.url);
const text = (relative) => readFile(new URL(relative, root), "utf8");
const json = async (relative) => JSON.parse(await text(relative));
const jsonLines = async (relative) => (await text(relative)).trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);

test("Daedalus exposes distinct implementation routes and validates its contracts", async () => {
  const [skill, contract] = await Promise.all([
    text("skills/eternities-daedalus/SKILL.md"),
    json("skills/eternities-daedalus/references/capability-contract.json"),
  ]);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.name, "eternities-daedalus");
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "implementation-delivery", "refactoring-quality", "language-framework",
    "security-specialist", "integrations-observability", "migration",
    "specialist-methods",
  ]);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  for (const route of contract.routes) assert.match(skill, new RegExp(route.id.replaceAll("-", "[ -]"), "i"));
  assert.match(skill, /agent-neutral/i);
  assert.match(skill, /fail closed/i);
  assert.match(skill, /credentials|destructive migration|unsafe generated code/i);
  const card = await json("skills/eternities-daedalus/references/routing-card.json");
  assert.deepEqual(card.provides, contract.routes.map(({ id }) => id));
  assert.equal(card.entrypoint, "skills/eternities-daedalus/SKILL.md");
});

test("Daedalus preserves every candidate cluster and excludes non-candidates", async () => {
  const [contract, synthesis, clusterSet, evidence] = await Promise.all([
    json("skills/eternities-daedalus/references/capability-contract.json"),
    json("syntheses/eternities-daedalus.v1.json"),
    json("clusters/implementation-engineering.v1.json"),
    jsonLines("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  const candidates = clusterSet.clusters.filter(({ synthesisDecision }) => synthesisDecision === "candidate");
  const exact = candidates.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort();
  assert.deepEqual(contract.sourceIds, exact);
  const candidateEvidence = evidence.filter(({ clusterSetId, synthesisDecision }) => clusterSetId === clusterSet.clusterSetId && synthesisDecision === "candidate");
  assert.deepEqual(contract.sourceEvidence.clusters, candidateEvidence.map(({ id, clusterDigest }) => ({ id, digest: clusterDigest })));
  assert.deepEqual(synthesis.clusters, contract.sourceEvidence.clusters);
  assert.equal(contract.sourceEvidence.clusterSetId, clusterSet.clusterSetId);
  for (const excluded of evidence.filter(({ clusterSetId, synthesisDecision }) => clusterSetId === clusterSet.clusterSetId && synthesisDecision !== "candidate")) {
    for (const member of excluded.members) assert.equal(contract.sourceIds.includes(member.sourceId), false);
  }
  assert.equal(contract.sourceProvenance.sourceProseCopied, false);
  assert.equal(contract.sourceProvenance.sourceInstructionsExecuted, false);
});

test("Daedalus covers direct, paraphrase, exclusion, and conflict fixtures", async () => {
  const [suite, skill, contract] = await Promise.all([
    json("skills/eternities-daedalus/evals/cases.json"),
    text("skills/eternities-daedalus/SKILL.md"),
    json("skills/eternities-daedalus/references/capability-contract.json"),
  ]);
  assert.deepEqual(new Set(suite.cases.map(({ kind }) => kind)), new Set(["direct", "paraphrase", "exclusion", "conflict"]));
  assert.ok(suite.cases.length >= 28);
  assert.ok(suite.cases.every(({ critical }) => critical === true));
  const result = evaluateSuite(suite.cases, suite.candidate.results);
  assert.equal(result.criticalPassed, suite.cases.length);
  assert.equal(result.score, 1);
  assert.deepEqual(result.unresolvedEffects, []);
  assert.ok(Math.ceil(Buffer.byteLength(canonicalText(skill), "utf8") / 4) <= 4200);
  assert.equal(contract.effects.includes("external-write"), false);
});

test("Daedalus promotion receipt hashes its exact artifacts and declares fixture limits", async () => {
  const [receipt, promotion, promotionText, synthesis, skill, cases, contract] = await Promise.all([
    json("receipts/promotions/eternities-daedalus.json"),
    json("syntheses/eternities-daedalus.v1.json"),
    text("receipts/promotions/eternities-daedalus.json"),
    json("syntheses/eternities-daedalus.v1.json"),
    text("skills/eternities-daedalus/SKILL.md"),
    text("skills/eternities-daedalus/evals/cases.json"),
    text("skills/eternities-daedalus/references/capability-contract.json"),
  ]);
  assert.equal(receipt.skillName, "eternities-daedalus");
  assert.match(receipt.limitation, /fixture|live-model|does not prove/i);
  assert.equal(receipt.evidence.skillSha256, sha256(canonicalText(skill)));
  assert.equal(receipt.evidence.casesSha256, sha256(canonicalText(cases)));
  assert.equal(receipt.evidence.capabilityContractSha256, sha256(canonicalText(contract)));
  assert.equal(receipt.evidence.sourceProseCopied, false);
  assert.equal(receipt.evidence.externalMutation, false);
  assert.equal(promotion.status, "promoted");
  assert.equal(promotion.artifacts.promotionReceipt.sha256, sha256(promotionText));
  assert.equal(synthesis.status, "promoted");
});
