import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildSkillReceipt } from "../scripts/evaluate-skill.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);
const candidateRoot = new URL("candidates/audio-dsp-integrity-review/", root);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, candidateRoot), "utf8"));
}

test("audio DSP integrity review has a discriminating first-party contract", async () => {
  const markdown = await readFile(new URL("SKILL.md", candidateRoot), "utf8");
  const contract = await json("references/capability-contract.json");

  assert.match(markdown, /^---[\s\S]*name: audio-dsp-integrity-review/m);
  assert.match(markdown, /hard realtime|real-time/i);
  assert.match(markdown, /do not use/i);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.equal(contract.sourceEvidence.mode, "cold-intake-v1");
  assert.equal(contract.sourceEvidence.sources.length, 4);
  assert.ok(contract.sourceEvidence.sources.every(({ proseCopied }) => proseCopied === false));
});

test("audio DSP integrity review separates deadline, numeric, and graph evidence", async () => {
  const markdown = await readFile(new URL("SKILL.md", candidateRoot), "utf8");
  for (const expected of [
    /deadline safety/i,
    /numeric integrity/i,
    /signal graph/i,
    /transitive call/i,
    /sample rate/i,
    /latency/i,
    /residual uncertainty/i,
  ]) assert.match(markdown, expected);
  assert.match(markdown, /does not prove audible quality/i);
  assert.match(markdown, /does not certify.*host|host.*certif/i);
});

test("audio DSP candidate earns a cold promotion receipt without activating itself", async () => {
  const receipt = await buildSkillReceipt({
    skillPath: new URL(".", candidateRoot).pathname.slice(1),
    policyPath: new URL("policies/promotion.v1.json", root).pathname.slice(1),
  });

  assert.equal(receipt.evidence.sourceEvidenceMode, "cold-intake-v1");
  assert.equal(receipt.evidence.candidateSourceCoverage, 4);
  assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
  assert.equal(receipt.decision.status, "promoted");
  assert.match(receipt.limitation, /does not prove live-model routing behavior/i);

  const contract = await json("references/capability-contract.json");
  assert.equal(contract.activation, "none");
});
