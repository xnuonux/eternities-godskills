import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { evaluateSuite } from "../src/evaluate.mjs";
import { canonicalText, sha256 } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { evaluateSkillAdvancement } from "../scripts/reconcile-skill-source.mjs";

const root = path.resolve(".");
const json = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const text = async (relativePath) => canonicalText(await readFile(path.join(root, relativePath), "utf8"));

test("the neutral contract binds an independently implemented, inert provenance source", async () => {
  const contract = await json("data/skill-supply-chain-defense-contract.json");
  const review = await json("data/reviews/github-wave-2-skill-defense.json");
  const records = (await text("artifacts/github-wave-2/source-records.jsonl")).trim().split(/\r?\n/).map(JSON.parse);
  const source = records.find(({ id }) => id === contract.provenance.sourceId);

  assert.equal(contract.provenance.sourceId, "NVIDIA/SkillSpector@1b875933a666b627c3ed1b695f066a21a6773dc4:skills/skill-inspector/SKILL.md");
  assert.equal(contract.provenance.bodySha256, "655d3a69020552c8ec3d64b7b64d22f3f3b6d85f1a5ed107ef44c7e8e98b1daa");
  assert.equal(contract.provenance.licenseSignal, "Apache-2.0");
  assert.equal(contract.provenance.disposition, "independent-implementation");
  assert.equal(contract.provenance.copiedSourceProse, false);
  assert.equal(contract.authority.targetCodeExecuted, false);
  assert.deepEqual(contract.authority.effects, ["local-read"]);
  assert.equal(source.bodySha256, contract.provenance.bodySha256);
  assert.equal(sha256(await readFile(source.sourceAbsolutePath)), source.bodySha256);
  assert.equal(review.provenance.sourceId, source.id);
  assert.ok(review.mechanismsStudied.length >= 5);
  assert.ok(review.excludedImplementationDetails.length >= 1);
});

test("the Wave 2 review reconciles all source rows without treating static clearance as trust", async () => {
  const review = await json("data/reviews/github-wave-2-skill-defense.json");
  const receipt = await json("receipts/github-wave-2-skill-security.json");
  const ledger = await readFile(path.join(root, receipt.ledgerPath));

  assert.equal(review.wave2.sourceRecordsSha256, receipt.sourceRecordsSha256);
  assert.equal(review.wave2.ledgerSha256, receipt.ledgerSha256);
  assert.equal(sha256(ledger), receipt.ledgerSha256);
  assert.equal(review.wave2.totalSources, 7776);
  assert.deepEqual(review.wave2.dispositions, receipt.dispositions);
  assert.equal(review.staticClearanceIsPromotion, false);
  assert.equal(review.targetCodeExecuted, false);
});

test("the selected mechanism source has an exact per-source gate decision", async () => {
  const expected = await json("data/reviews/nvidia-skillspector-skill-inspector-decision.json");
  const actual = await evaluateSkillAdvancement({
    sourceId: expected.sourceId,
    recordsPath: "artifacts/github-wave-2/source-records.jsonl",
    ledgerPath: "artifacts/github-wave-2/skill-security-ledger.jsonl",
    reviewPath: "data/reviews/nvidia-skillspector-skill-inspector-review.json",
  });

  assert.deepEqual(actual, expected);
  assert.equal(actual.status, "eligible");
  assert.equal(actual.decision.verdict, "CAUTION");
  assert.equal(actual.decision.promotionEligible, true);
});

test("Aegis v3 clears adversarial promotion policy without regressing earlier cases", async () => {
  const suite = await json("skills/eternities-aegis/evals/skill-supply-chain-cases.json");
  const prior = await json("skills/eternities-aegis/evals/cases.json");
  const policy = await json("policies/promotion.v1.json");
  const skillText = await text("skills/eternities-aegis/SKILL.md");
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(skillText) / 4),
    improvements: ["sourceCoverage"],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  const priorEvaluation = evaluateSuite(prior.cases, prior.candidate.results);

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(priorEvaluation.criticalPassed, priorEvaluation.criticalTotal);
  assert.equal(decision.status, "promoted");
  assert.equal(candidate.unresolvedEffects.length, 0);
  assert.ok(candidate.tokenCount <= policy.maximumTokenCount);
  assert.ok(new Set(suite.cases.map(({ kind }) => kind)).isSupersetOf(new Set(["direct", "paraphrase", "exclusion", "conflict"])));
});

test("the v3 receipt remains immutable historical evidence after Aegis advances", async () => {
  const receipt = await json("receipts/promotions/eternities-aegis-v3.json");
  const synthesis = await json("history/syntheses/eternities-aegis.v3.json");
  const current = await json("receipts/promotions/eternities-aegis-v4.json");
  const security = await json("receipts/github-wave-2-skill-security.json");

  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.evidence.wave2LedgerSha256, security.ledgerSha256);
  assert.equal(receipt.evidence.targetCodeExecuted, false);
  assert.equal(receipt.evidence.externalMutation, false);
  assert.match(receipt.limitation, /does not prove safety/i);
  assert.equal(receipt.historicalEvidence.preservedSynthesis, "history/syntheses/eternities-aegis.v2.json");
  assert.equal(receipt.historicalEvidence.preservedSynthesisSha256, "8cb65519fadd6bec5dd188007c60867b5b48bcab5a71a0be5ced61357744eefa");
  assert.equal(sha256(await text(receipt.historicalEvidence.preservedSynthesis)), receipt.historicalEvidence.preservedSynthesisSha256);
  assert.equal((await json(receipt.historicalEvidence.preservedSynthesis)).status, "promoted");
  assert.equal(current.artifacts.priorReceipt.sha256, sha256(await readFile(current.artifacts.priorReceipt.path)));
  assert.equal(current.artifacts.priorSynthesis.sha256, sha256(await readFile(current.artifacts.priorSynthesis.path)));
  assert.equal(sha256(await text("syntheses/eternities-aegis.v3.json")), "e9b928d0a33bb111ac0581f140303385823c7908cbae5c4ec3c48da6d3a45ed1");
  assert.equal(sha256(await text("history/syntheses/eternities-aegis.v3.json")), "e9b928d0a33bb111ac0581f140303385823c7908cbae5c4ec3c48da6d3a45ed1");
  assert.equal(synthesis.artifacts.skill.sha256, receipt.evidence.skillSha256);
  assert.equal(synthesis.artifacts.routingCard.sha256, receipt.evidence.routingCardSha256);
});
