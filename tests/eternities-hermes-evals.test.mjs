import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateSuite } from "../src/evaluate.mjs";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Hermes evals cover route distinction, paraphrase, exclusion, conflict, and proof limits", async () => {
  const suite = await json("skills/eternities-hermes/evals/cases.json");
  const kinds = Object.groupBy(suite.cases, ({ kind }) => kind);
  for (const kind of ["direct", "paraphrase", "conflict"]) assert.ok((kinds[kind]?.length ?? 0) >= 6);
  assert.ok((kinds.exclusion?.length ?? 0) >= 4);
  for (const route of ["batch-file-workflow", "browser-automation", "browser-use-integration", "java-mcp-server-generation", "omni-cli-tool-integration", "remote-test-coordination"]) assert.ok(suite.cases.some((c) => c.expected === `route:${route}`));
  assert.ok(suite.cases.some((c) => c.expected === "refuse:credential-boundary"));
  assert.ok(suite.cases.some((c) => c.expected === "refuse:untrusted-execution"));
  assert.equal(suite.baseline.fixtureOnly, true);
  assert.equal(suite.candidate.fixtureOnly, true);
  assert.deepEqual(evaluateSuite(suite.cases, suite.candidate.results).unresolvedEffects, []);
});
