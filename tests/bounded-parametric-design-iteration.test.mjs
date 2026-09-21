import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildSkillReceipt } from "../scripts/evaluate-skill.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const candidateRoot = new URL("candidates/bounded-parametric-design-iteration/", root);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, candidateRoot), "utf8"));
}

test("bounded parametric design iteration has an inert source-bound contract", async () => {
  const markdown = await readFile(new URL("SKILL.md", candidateRoot), "utf8");
  const contract = await json("references/capability-contract.json");
  assert.match(markdown, /^---[\s\S]*name: bounded-parametric-design-iteration/m);
  assert.match(markdown, /do not use/i);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.equal(contract.activation, "none");
  assert.equal(contract.sourceEvidence.mode, "cold-intake-v1");
  assert.equal(contract.sourceEvidence.sources.length, 3);
});

test("design iteration preserves attribution, credibility, approval, and proof boundaries", async () => {
  const markdown = await readFile(new URL("SKILL.md", candidateRoot), "utf8");
  for (const expected of [
    /one change per iteration/i,
    /iteration budget/i,
    /baseline/i,
    /like-for-like/i,
    /credibility/i,
    /approval/i,
    /rollback/i,
    /target met/i,
    /physical certification/i,
  ]) assert.match(markdown, expected);
});

test("bounded parametric design candidate clears fixtures but remains cold", async () => {
  const receipt = await buildSkillReceipt({
    skillPath: new URL(".", candidateRoot).pathname.slice(1),
    policyPath: new URL("policies/promotion.v1.json", root).pathname.slice(1),
  });
  assert.equal(receipt.evidence.sourceEvidenceMode, "cold-intake-v1");
  assert.equal(receipt.evidence.candidateSourceCoverage, 3);
  assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
  assert.equal(receipt.decision.status, "promoted");
  assert.equal((await json("references/capability-contract.json")).activation, "none");
});
