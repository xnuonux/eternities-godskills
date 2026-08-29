import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { canonicalText, sha256 } from "../src/io.mjs";

const repositoryRoot = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

test("active intent compiler v1 receipt reconciles its exact current artifacts", async () => {
  const actual = JSON.parse(
    await readFile(path.join(repositoryRoot, "receipts", "intent-compiler-v1.json"), "utf8"),
  );
  assert.equal(actual.status, "certified");
  assert.equal(actual.metrics.caseCount, 148);
  assert.equal(actual.metrics.passCount, 148);
  assert.equal(actual.metrics.positiveCaseCount, 89);
  assert.equal(actual.metrics.positiveExactSelectionCount, 89);
  assert.equal(actual.metrics.unsafeSelectionCount, 0);
  assert.equal(actual.metrics.authorityInventionCount, 0);
  assert.equal(actual.metrics.repeatabilityMismatchCount, 0);
  const paths = {
    arena: "data/intent-arena.v1.json",
    arenaSource: "data/intent-arena-source.v1.json",
    cards: "artifacts/routing/cards.jsonl",
    compiler: "src/intent-compiler.mjs", contracts: "src/intent-contracts.mjs",
    documentation: "docs/intent-compiler.md", evaluator: "src/intent-arena.mjs",
    runtime: "src/intent-runtime.mjs", transport: "scripts/intent.mjs",
  };
  for (const [key, relativePath] of Object.entries(paths)) {
    assert.equal(actual.artifacts[key], sha256(canonicalText(await readFile(path.join(repositoryRoot, relativePath), "utf8"))), key);
  }
});

test("intent compiler certification preserves universal safety boundaries", async () => {
  const receipt = JSON.parse(await readFile(path.join(repositoryRoot, "receipts", "intent-compiler-v1.json"), "utf8"));
  assert.deepEqual(receipt.gates, {
    ambiguityFailsClosed: true,
    authorityInventionProhibited: true,
    deterministicRepeatability: true,
    externalActionExecution: false,
    modelDependencyRequired: false,
    progressiveDisclosureBounded: true,
    skillBodiesLoadedDuringRouting: false,
    unsafeSelectionCount: 0,
  });
  assert.deepEqual(receipt.proofLimits, {
    hostAdapterDeployment: "not-performed",
    liveModelInterpretation: "not-proven-by-fixtures",
    productionOperation: "not-performed",
    semanticArena: "certified-local-fixture-evidence",
  });
  for (const digest of Object.values(receipt.artifacts)) assert.match(digest, /^[0-9a-f]{64}$/);
});
