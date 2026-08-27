import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Atlas exposes six neutral routes, bounded effects, and exact candidate evidence", async () => {
  const contract = await json("skills/eternities-atlas/references/capability-contract.json");
  const synthesis = await json("syntheses/eternities-atlas.v1.json");
  assert.equal(contract.name, "eternities-atlas");
  assert.deepEqual(contract.routes.map((route) => route.id), [
    "analytics-and-experimentation", "query-and-performance", "reconciliation-and-quality-gates",
    "schema-design", "schema-migration-and-compatibility", "sync-and-streaming",
  ]);
  assert.deepEqual(contract.effects, ["read", "write"]);
  assert.equal(contract.externalMutation, false);
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.clusters.length, 6);
});

test("Atlas evaluation cases cover all routes and fail-closed boundaries", async () => {
  const suite = await json("skills/eternities-atlas/evals/cases.json");
  for (const route of ["analytics-and-experimentation", "query-and-performance", "reconciliation-and-quality-gates", "schema-design", "schema-migration-and-compatibility", "sync-and-streaming"]) {
    assert.ok(suite.cases.some((item) => item.expected === `route:${route}`));
  }
  for (const expected of ["refuse:production-mutation", "refuse:credentials", "refuse:destructive-migration", "refuse:external-system", "refuse:missing-backup", "refuse:unverified-reconciliation", "defer:authority-gap"]) {
    assert.ok(suite.cases.some((item) => item.expected === expected), expected);
  }
  assert.ok(suite.cases.some((item) => item.kind === "direct"));
  assert.ok(suite.cases.some((item) => item.kind === "paraphrase"));
  assert.ok(suite.cases.some((item) => item.kind === "exclusion"));
  assert.ok(suite.cases.some((item) => item.kind === "conflict"));
  assert.ok(suite.baseline.tokenCount > 0);
  assert.match(suite.baseline.limitations, /fixture|live|model/i);
});
