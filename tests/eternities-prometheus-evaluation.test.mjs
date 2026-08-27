import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateSuite } from "../src/evaluate.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveClusterSourceEvidence } from "../src/provenance-evidence.mjs";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const lines = async (path) => (await readFile(new URL(path, root), "utf8")).trim().split(/\r?\n/).map(JSON.parse);

test("Prometheus has deterministic complete evals and promotion evidence", async () => {
  const suite = await json("skills/eternities-prometheus/evals/cases.json");
  const contract = await json("skills/eternities-prometheus/references/capability-contract.json");
  const evidence = deriveClusterSourceEvidence(contract, await lines("artifacts/corpus/cluster-evidence.jsonl"), await lines("artifacts/corpus/review-evidence.jsonl"));
  const candidate = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: suite.candidate.tokenCount, improvements: suite.candidate.improvements };
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  assert.equal(suite.cases.length, 27);
  assert.ok(suite.cases.every(({ critical }) => critical === true));
  assert.equal(evidence.sourceCoverage, 22);
  assert.equal(evidence.proseCopied, false);
  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(candidate.unresolvedEffects.length, 0);
  assert.equal(decidePromotion({ baseline, candidate, policy: await json("policies/promotion.v1.json") }).status, "promoted");
});
