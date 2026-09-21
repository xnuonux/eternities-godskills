import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256 } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";
import { readPinnedSourceBytes } from "../src/pinned-source-bytes.mjs";

const root = new URL("../", import.meta.url);
const skillRoot = new URL("skills/eternities-athena/", root);
const sourceId = "K-Dense-AI/scientific-agent-skills@36d8f13a1e754618794bf42f417884940077b4ae:skills/scientific-critical-thinking/SKILL.md";
const json = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

test("Athena is a compact scientific epistemology entrypoint with exact boundaries", async () => {
  const body = await readFile(new URL("SKILL.md", skillRoot), "utf8");
  assert.match(body, /^---\nname: eternities-athena\n/m);
  assert.match(body, /claim-appraisal/);
  assert.match(body, /study-design/);
  assert.match(body, /evidence-synthesis/);
  assert.match(body, /association.*causation/i);
  assert.match(body, /statistical significance.*practical importance/i);
  assert.match(body, /medical advice|diagnos|prescrib/i);
  assert.match(body, /eternities-oracle/i);
  assert.ok(Buffer.byteLength(body) <= 6500);
});

test("Athena contract exposes scientific validity and exact inert provenance", async () => {
  const contract = await json("skills/eternities-athena/references/capability-contract.json");
  const records = (await readFile(new URL("artifacts/github-wave-2/source-records.jsonl", root), "utf8")).trim().split(/\r?\n/).map(JSON.parse);
  const source = records.find(({ id }) => id === sourceId);
  assert.ok(source);
  assert.equal(source.inert, true);
  assert.equal(source.bodySha256, "48a3b32aa9273343dacae7532546a2fee375b148bb467305905b0ca169c1d3b0");
  assert.equal(contract.provenance.sourceId, sourceId);
  assert.equal(contract.provenance.bodySha256, source.bodySha256);
  assert.equal(sha256(await readPinnedSourceBytes(source)), source.bodySha256);
  assert.deepEqual(contract.effects, ["read"]);
  assert.equal(contract.provenance.copiedSourceProse, false);
  assert.equal(contract.provenance.copiedImplementation, false);
});

test("Athena evaluation covers every route and hard epistemic boundary", async () => {
  const suite = await json("skills/eternities-athena/evals/cases.json");
  const expected = new Set(suite.cases.map(({ expected }) => expected));
  for (const value of [
    "route:claim-appraisal",
    "route:study-design",
    "route:evidence-synthesis",
    "defer:medical-professional",
    "defer:eternities-oracle",
    "reject:causal-overreach",
    "unknown:missing-methods",
  ]) assert.ok(expected.has(value), value);
  assert.ok(new Set(suite.cases.map(({ kind }) => kind)).isSupersetOf(new Set(["direct", "paraphrase", "exclusion", "conflict"])));
});

test("Athena clears promotion gates without critical regression", async () => {
  const suite = await json("skills/eternities-athena/evals/cases.json");
  const policy = await json("policies/promotion.v1.json");
  const body = await readFile(new URL("SKILL.md", skillRoot), "utf8");
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(Buffer.byteLength(body) / 4), improvements: ["sourceCoverage"] };
  const decision = decidePromotion({ baseline, candidate, policy });
  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.ok(candidate.score > baseline.score);
  assert.equal(decision.status, "promoted");
});

test("Athena routing card selects from commandless intent and preserves least authority", async () => {
  const card = validateRoutingCard(await json("skills/eternities-athena/references/routing-card.json"));
  const envelope = {
    schemaVersion: 1,
    requestId: "athena-route",
    outcome: "determine whether this experiment supports its causal claim after accounting for confounding multiplicity and uncertainty",
    candidateFamilies: [card.family],
    requiredCapabilities: card.provides,
    forbiddenCapabilities: [],
    permittedEffects: ["local-read"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    maximumRisk: "low",
    minimumEvidenceConfidence: "verified",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
  };
  const decision = routeCapabilities({ envelope, cards: [card] });
  assert.deepEqual(decision.selectedIds, ["eternities-athena"]);
  assert.deepEqual(card.effects, ["local-read"]);
  assert.deepEqual(card.authorityRequirements, ["local-read"]);
});

test("Athena synthesis and promotion receipt bind exact current artifacts", async () => {
  const receipt = await json("receipts/promotions/eternities-athena.json");
  const synthesis = await json("artifacts/athena/synthesis.v1.json");
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.evidence.sourceId, sourceId);
  assert.equal(receipt.evidence.targetCodeExecuted, false);
  assert.match(receipt.limitation, /does not prove live-model|does not prove arbitrary/i);
  for (const artifact of Object.values(synthesis.artifacts)) {
    const bytes = await readFile(new URL(artifact.path, root));
    assert.equal(artifact.sha256, sha256(bytes), artifact.path);
  }
});
