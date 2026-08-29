import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256 } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";
import { buildOmnibus } from "../scripts/build-omnibus-receipt.mjs";

const root = new URL("../", import.meta.url);
const json = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

test("Omnibus is a compact cold-atlas retrieval and handoff entrypoint", async () => {
  const body = await readFile(new URL("skills/eternities-omnibus/SKILL.md", root), "utf8");
  assert.match(body, /^---\nname: eternities-omnibus\n/m);
  assert.match(body, /at most five/i);
  assert.match(body, /never execute/i);
  assert.match(body, /not.*ordinary/i);
  assert.ok(Buffer.byteLength(body) <= 5000);
  const card = validateRoutingCard(await json("skills/eternities-omnibus/references/routing-card.json"));
  assert.deepEqual(card.effects, ["local-read"]);
  assert.deepEqual(card.authorityRequirements, ["local-read"]);
});

test("Omnibus evaluation promotes only explicit specialist-corpus discovery", async () => {
  const suite = await json("skills/eternities-omnibus/evals/cases.json");
  const policy = await json("policies/promotion.v1.json");
  const body = await readFile(new URL("skills/eternities-omnibus/SKILL.md", root));
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(body.length / 4), improvements: ["sourceCoverage"] };
  assert.equal(decidePromotion({ baseline, candidate, policy }).status, "promoted");
  assert.ok(suite.cases.some(({ expected }) => expected === "skip:ordinary-domain-task"));
  assert.ok(suite.cases.some(({ expected }) => expected === "defer:arsenal-repo-miner"));
});

test("Omnibus receipt binds certified infusion and exact current artifacts", async () => {
  const result = await buildOmnibus(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"), { write: false });
  assert.equal(result.receipt.decision.status, "promoted");
  assert.equal(result.receipt.evidence.sourceInstructionsActivated, false);
  assert.equal(result.receipt.evidence.infusionStatus, "certified");
  for (const artifact of Object.values(result.receipt.evidence.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(new URL(artifact.path, root))), artifact.path);
  }
});
