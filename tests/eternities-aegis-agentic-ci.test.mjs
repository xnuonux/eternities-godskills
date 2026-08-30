import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { buildAegisAgenticCiReceipt } from "../scripts/build-aegis-agentic-ci-receipt.mjs";

const root = path.resolve(".");
const json = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const text = async (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("Aegis defines a complete source-to-sink agentic CI audit route", async () => {
  const [skill, contract, reference] = await Promise.all([
    text("skills/eternities-aegis/SKILL.md"),
    json("skills/eternities-aegis/references/capability-contract.json"),
    text("skills/eternities-aegis/references/agentic-ci-audit.md"),
  ]);
  assert.match(skill, /agentic-ci/);
  assert.ok(contract.routes.some(({ id }) => id === "agentic-ci"));
  for (const phrase of ["attacker-controlled source", "transport", "ai prompt or execution sink", "available authority", "amplifier"]) {
    assert.match(reference, new RegExp(phrase, "i"));
  }
});

test("agentic CI fixtures distinguish proven paths from amplifiers and clean workflows", async () => {
  const suite = await json("skills/eternities-aegis/evals/cases.json");
  const cases = suite.agenticCiCases;
  const expected = new Map(cases.map((entry) => [entry.id, entry.expected]));
  assert.equal(expected.get("direct-event-interpolation"), "finding:proven-source-to-sink");
  assert.equal(expected.get("environment-indirection"), "finding:proven-source-to-sink");
  assert.equal(expected.get("runtime-fetch"), "finding:proven-source-to-sink");
  assert.equal(expected.get("privileged-pr-checkout"), "finding:proven-source-to-sink");
  assert.equal(expected.get("ai-output-evaluation"), "finding:proven-source-to-sink");
  assert.equal(expected.get("dangerous-sandbox-plus-injection"), "finding:proven-source-to-sink");
  assert.equal(expected.get("wildcard-without-source-path"), "amplifier:not-injection-finding");
  assert.equal(expected.get("clean-pinned-workflow"), "clear:no-proven-path");
  assert.equal(expected.get("local-reusable-workflow"), "trace:continue-local");
  assert.equal(expected.get("unresolved-remote-reference"), "unresolved:fail-closed");
  assert.ok(cases.every(({ critical }) => critical === true));
});

test("v4 receipt binds inert provenance and preserves every prior critical Aegis case", async () => {
  const built = await buildAegisAgenticCiReceipt({ root, write: false });
  assert.equal(built.receipt.decision.status, "promoted");
  assert.equal(built.receipt.candidate.criticalPassed, built.receipt.candidate.criticalTotal);
  assert.equal(built.receipt.priorAegis.criticalPassed, built.receipt.priorAegis.criticalTotal);
  assert.equal(built.receipt.evidence.sourceProseCopied, false);
  assert.equal(built.receipt.evidence.targetCodeExecuted, false);
  assert.equal(built.receipt.evidence.externalMutation, false);
  assert.equal(built.synthesis.provenance.sourceBodySha256, "2bf244d5684f139d14e6787ece0bcbfb5ba14ed12143a10b3922c40a2e6b45ed");
  assert.equal(built.synthesis.status, "promoted");
  for (const artifact of Object.values(built.receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
});
