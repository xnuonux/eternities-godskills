import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sha256, canonicalText } from "../src/io.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";
import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";

const root = new URL("../", import.meta.url);
const text = (relative) => readFile(new URL(relative, root), "utf8");
const json = async (relative) => JSON.parse(await text(relative));
const jsonl = async (relative) => (await text(relative)).trim().split(/\r?\n/).map(JSON.parse);

test("Logos exposes eight independent writing and narrative routes", async () => {
  const [skill, contract] = await Promise.all([
    text("skills/eternities-logos/SKILL.md"),
    json("skills/eternities-logos/references/capability-contract.json"),
  ]);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.name, "eternities-logos");
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "technical-writing", "concise-editorial", "documentation-production",
    "release-and-reporting", "product-and-internal-narrative",
    "structural-review", "structural-extraction", "lessons-in-structure",
  ]);
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  for (const route of contract.routes) assert.match(skill, new RegExp(route.id.replaceAll("-", "[ -]"), "i"));
  assert.match(skill, /agent-neutral/i);
  assert.match(skill, /supplied fact|canon provenance/i);
});

test("Logos retains exact candidate-cluster provenance and excludes all boundaries", async () => {
  const [contract, synthesis, clusters] = await Promise.all([
    json("skills/eternities-logos/references/capability-contract.json"),
    json("syntheses/eternities-logos.v1.json"),
    jsonl("artifacts/corpus/cluster-evidence.jsonl"),
  ]);
  const batch = await json("clusters/writing-narrative-canon.v1.json");
  const candidates = clusters.filter((c) => c.clusterSetId === "writing-narrative-canon-clusters-v1" && c.synthesisDecision === "candidate");
  const exactSources = candidates.flatMap((c) => c.members.map((m) => m.sourceId)).sort();
  assert.deepEqual(contract.sourceIds, exactSources);
  assert.deepEqual(contract.sourceEvidence.clusters, candidates.map((c) => ({ id: c.id, digest: c.clusterDigest })));
  assert.deepEqual(synthesis.clusters, candidates.map((c) => ({ id: c.id, digest: c.clusterDigest })));
  for (const cluster of clusters.filter((c) => c.clusterSetId === "writing-narrative-canon-clusters-v1" && c.synthesisDecision !== "candidate")) {
    for (const member of cluster.members) assert.equal(contract.sourceIds.includes(member.sourceId), false);
  }
  assert.equal(contract.sourceEvidence.clusterSetId, "writing-narrative-canon-clusters-v1");
  assert.equal(contract.sourceProvenance.sourceProseCopied, false);
  assert.equal(contract.sourceProvenance.sourceInstructionsExecuted, false);
});

test("Logos deterministic evals cover direct, paraphrase, exclusion, and conflict boundaries", async () => {
  const [suite, skill, contract] = await Promise.all([
    json("skills/eternities-logos/evals/cases.json"),
    text("skills/eternities-logos/SKILL.md"),
    json("skills/eternities-logos/references/capability-contract.json"),
  ]);
  const kinds = new Set(suite.cases.map((c) => c.kind));
  for (const kind of ["direct", "paraphrase", "exclusion", "conflict"]) assert.ok(kinds.has(kind));
  assert.ok(suite.cases.length >= 32);
  assert.ok(suite.cases.every((c) => c.critical === true));
  assert.ok(suite.candidate.results.every((r) => r.unresolvedEffects?.length === 0));
  const result = evaluateSuite(suite.cases, suite.candidate.results);
  assert.equal(result.criticalPassed, suite.cases.length);
  assert.equal(result.score, 1);
  assert.deepEqual(result.unresolvedEffects, []);
  assert.ok(Math.ceil(Buffer.byteLength(canonicalText(skill), "utf8") / 4) <= 4000);
  assert.equal(contract.effects.includes("external-write"), false);
});

test("Logos receipt is honest about fixture limits and hashes", async () => {
  const [receipt, promotionText, promotion, casesText, skill, contract] = await Promise.all([
    json("receipts/promotions/eternities-logos.json"),
    text("receipts/promotions/eternities-logos.json"),
    json("syntheses/eternities-logos.v1.json"),
    text("skills/eternities-logos/evals/cases.json"),
    text("skills/eternities-logos/SKILL.md"),
    text("skills/eternities-logos/references/capability-contract.json"),
  ]);
  assert.equal(receipt.skillName, "eternities-logos");
  assert.match(receipt.limitation, /fixture|live-model|does not prove/i);
  assert.equal(receipt.evidence.skillSha256, sha256(canonicalText(skill)));
  assert.equal(receipt.evidence.casesSha256, sha256(canonicalText(casesText)));
  assert.equal(receipt.evidence.capabilityContractSha256, sha256(canonicalText(contract)));
  assert.equal(receipt.evidence.sourceProseCopied, false);
  assert.equal(receipt.evidence.externalMutation, false);
  assert.equal(promotion.status, "promoted");
  assert.equal(receipt.decision.status, "promoted");
});
