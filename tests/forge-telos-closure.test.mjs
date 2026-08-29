import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateSuite } from "../src/evaluate.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const json = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

test("Forge exposes Telos only for explicit ideal-bar structural closure", async () => {
  const skill = await readFile(new URL("skills/eternities-forge/SKILL.md", root), "utf8");
  const contract = await json("skills/eternities-forge/references/capability-contract.json");
  const route = contract.routes.find(({ id }) => id === "telos-closure");

  assert.ok(route, "missing telos-closure route");
  assert.match(skill, /ideal-bar|perfection/i);
  assert.match(skill, /explicit/i);
  assert.match(skill, /references\/telos-closure\.md/);
  assert.deepEqual(route.terminalStates, ["closed", "saturated", "blocked", "budget-exhausted"]);
  assert.equal(route.explicitIntentRequired, true);
});

test("Telos closes defect shapes structurally and hunts relocation", async () => {
  const body = await readFile(new URL("skills/eternities-forge/references/telos-closure.md", root), "utf8");
  for (const pattern of [
    /defect shape/i,
    /relocat/i,
    /structural/i,
    /downstream|blast radius/i,
    /fresh.*evidence|evidence.*fresh/i,
    /regression/i,
  ]) assert.match(body, pattern);
  assert.doesNotMatch(body, /<promise>|ruflo/i);
});

test("Telos is budgeted, detects saturation, and never self-certifies", async () => {
  const body = await readFile(new URL("skills/eternities-forge/references/telos-closure.md", root), "utf8");
  for (const pattern of [
    /iteration budget/i,
    /time budget/i,
    /token budget/i,
    /mutation budget/i,
    /two consecutive rounds/i,
    /material evidence/i,
    /measurable gain/i,
    /independent|fresh context/i,
    /reviewer.*not.*evidence|review.*does not.*prove/i,
  ]) assert.match(body, pattern);
});

test("Telos provenance preserves licenses and rejects unsafe source transfer", async () => {
  const provenance = await json("skills/eternities-forge/references/telos-provenance.json");
  const byRepo = new Map(provenance.sources.map((source) => [source.repository, source]));
  assert.equal(provenance.copiedSourceProse, false);
  assert.equal(provenance.copiedImplementation, false);
  assert.equal(byRepo.get("xnuonux/eternities-canon").disposition, "canonical-first-party-source");
  assert.equal(byRepo.get("xnuonux/eternities-canon").blobSha, "28e704971b47c70788d12223a94861d42d52316c");
  assert.equal(byRepo.get("xnuonux/eternities-canon").commitSha, "db0c4cfa66df8a7f9afe397c29018c9e87777372");
  assert.equal(byRepo.get("juspay/kolu").license, "AGPL-3.0");
  assert.equal(byRepo.get("juspay/kolu").disposition, "pattern-reference");
  assert.equal(byRepo.get("proffesor-for-testing/agentic-qe").license, "MIT");
  assert.equal(byRepo.get("proffesor-for-testing/agentic-qe").disposition, "independent-implementation");
  assert.equal(byRepo.get("hondazn/aimod").disposition, "rejected");
  assert.equal(byRepo.get("lance-p/perfection-loop").disposition, "rejected");
});

test("Telos evaluation covers routing, exclusions, conflicts, saturation, and budgets", async () => {
  const suite = await json("skills/eternities-forge/evals/cases.json");
  const ids = new Set(suite.cases.map(({ id }) => id));
  for (const id of [
    "telos-direct-ideal-bar",
    "telos-paraphrase-relocated-defect",
    "telos-exclude-ordinary-review",
    "telos-conflict-authority",
    "telos-saturated",
    "telos-budget-exhausted",
  ]) assert.ok(ids.has(id), id);

  const policy = await json("policies/promotion.v1.json");
  const skill = await readFile(new URL("skills/eternities-forge/SKILL.md", root), "utf8");
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(skill) / 4),
    improvements: ["sourceCoverage"],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(decision.status, "promoted");
});

test("Telos promotion receipt binds the exact first-party capability artifacts", async () => {
  const receipt = await json("receipts/promotions/eternities-forge-telos-v1.json");
  assert.equal(receipt.skillName, "eternities-forge");
  assert.equal(receipt.capability, "telos-closure");
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.evidence.canonicalRepository, "xnuonux/eternities-canon");
  assert.equal(receipt.evidence.canonicalBlobSha, "28e704971b47c70788d12223a94861d42d52316c");
  for (const [field, relative] of Object.entries(receipt.artifacts)) {
    const bytes = await readFile(new URL(relative.path, root));
    assert.equal(relative.sha256, sha256(bytes), field);
  }
});
