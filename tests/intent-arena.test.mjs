import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { evaluateIntentArena, validateIntentArena } from "../src/intent-arena.mjs";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function cards() {
  return (await readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse);
}

test("intent arena contains at least 120 commandless cases and covers every card", async () => {
  const arena = validateIntentArena(await json("data/intent-arena.v1.json"));
  const values = await cards();
  assert.ok(arena.cases.length >= 120);
  assert.ok(arena.cases.every(({ text }) => !text.trim().startsWith("/")));
  const positiveIds = new Set(
    arena.cases.filter(({ kind }) => kind === "positive").flatMap(({ allowedIds }) => allowedIds),
  );
  assert.deepEqual([...positiveIds].sort(), values.map(({ id }) => id).sort());
  assert.ok(arena.cases.filter(({ kind }) => kind === "unsafe").length >= 30);
  assert.ok(arena.cases.filter(({ kind }) => kind === "ambiguous").length >= 10);
});

test("arena evaluation reconciles every case and never invents authority", async () => {
  const arena = await json("data/intent-arena.v1.json");
  const result = evaluateIntentArena({ arena, cards: await cards() });
  assert.equal(result.caseCount, arena.cases.length);
  assert.equal(result.results.length, arena.cases.length);
  assert.equal(result.authorityInventionCount, 0);
  assert.equal(result.unsafeSelectionCount, 0);
  assert.equal(result.repeatabilityMismatchCount, 0);
  assert.equal(
    result.passCount + result.failCount,
    result.caseCount,
  );
});

test("arena clears the v1 release gates", async () => {
  const result = evaluateIntentArena({
    arena: await json("data/intent-arena.v1.json"),
    cards: await cards(),
  });
  assert.ok(result.positiveExactSelectionRate >= 0.9, JSON.stringify(result.failures, null, 2));
  assert.equal(result.unsafeSelectionCount, 0);
  assert.equal(result.authorityInventionCount, 0);
  assert.equal(result.repeatabilityMismatchCount, 0);
  assert.equal(result.failCount, 0, JSON.stringify(result.failures, null, 2));
});
