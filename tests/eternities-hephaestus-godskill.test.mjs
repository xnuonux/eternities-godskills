import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256 } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";
import { buildHephaestusReceipt } from "../scripts/build-hephaestus-receipt.mjs";

const root = path.resolve(".");
const json = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const text = async (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("Hephaestus is a compact provider-neutral model runtime and compute governor", async () => {
  const skill = await text("skills/eternities-hephaestus/SKILL.md");
  for (const phrase of ["constraint envelope", "evidence comparability", "capacity model", "runtime compatibility", "operational budget", "governance boundary", "measurement plan", "no-qualified-option"]) {
    assert.match(skill, new RegExp(phrase, "i"));
  }
  assert.match(skill, /estimate/i);
  assert.match(skill, /do not.*download|download.*do not/i);
  assert.ok(Math.ceil(Buffer.byteLength(skill) / 4) <= 4000);
});

test("Hephaestus exposes valid universal capability and routing contracts", async () => {
  const [contract, card] = await Promise.all([
    json("skills/eternities-hephaestus/references/capability-contract.json"),
    json("skills/eternities-hephaestus/references/routing-card.json"),
  ]);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateRoutingCard(card));
  assert.equal(contract.id, "godskill-eternities-hephaestus-v1");
  assert.deepEqual(contract.effects, ["read"]);
  assert.deepEqual(card.effects, ["external-read", "local-read"]);
  assert.equal(card.id, "eternities-hephaestus");
});

test("Hephaestus evaluation handles fit fallback privacy comparability and forbidden effects", async () => {
  const [suite, policy, skill] = await Promise.all([
    json("skills/eternities-hephaestus/evals/cases.json"),
    json("policies/promotion.v1.json"),
    text("skills/eternities-hephaestus/SKILL.md"),
  ]);
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(Buffer.byteLength(skill) / 4), improvements: ["sourceCoverage"] };
  const decision = decidePromotion({ baseline, candidate, policy });
  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.deepEqual(candidate.unresolvedEffects, []);
  assert.equal(decision.status, "promoted");
  const outcomes = new Set(suite.cases.map(({ expected }) => expected));
  for (const expected of ["recommend:qualified-option", "recommend:cpu-fallback", "recommend:edge-fit", "no-qualified-option:privacy", "no-qualified-option:incomparable-evidence", "no-qualified-option:license", "refuse:deployment-or-purchase"]) assert.ok(outcomes.has(expected));
});

test("Hephaestus promotion receipt binds exact inert provenance and current artifacts", async () => {
  const built = await buildHephaestusReceipt({ root, write: false });
  assert.equal(built.receipt.decision.status, "promoted");
  assert.equal(built.receipt.evidence.sourceProseCopied, false);
  assert.equal(built.receipt.evidence.targetCodeExecuted, false);
  assert.equal(built.receipt.evidence.externalMutation, false);
  assert.equal(built.synthesis.sources.length, 2);
  for (const artifact of Object.values(built.receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
});
