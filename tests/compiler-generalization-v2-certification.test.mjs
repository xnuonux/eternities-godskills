import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { canonicalText, sha256 } from "../src/io.mjs";

const repositoryRoot = path.resolve(new URL("../", import.meta.url).pathname.slice(1));

test("active compiler generalization v2 receipt reconciles exact current artifacts", async () => {
  const actual = JSON.parse(
    await readFile(
      path.join(repositoryRoot, "receipts", "compiler-generalization-v2.json"),
      "utf8",
    ),
  );
  assert.equal(actual.status, "certified");
  assert.deepEqual(actual.metrics.generalization, {
    authorityInventionCount: 0,
    caseCount: 10,
    exactCompositionCount: 3,
    failCount: 0,
    passCount: 10,
  });
  assert.deepEqual(actual.metrics.existingArena, {
    authorityInventionCount: 0,
    caseCount: 148,
    failCount: 0,
    overCompositionCount: 0,
    passCount: 148,
    unsafeSelectionCount: 0,
  });
  const paths = {
    arena: "data/compiler-generalization-v2-arena.json",
    cards: "artifacts/routing/cards.jsonl",
    compiler: "src/intent-compiler.mjs",
    contract: "data/compiler-generalization-v2-contract.json",
    design: "docs/superpowers/specs/2026-08-28-compiler-generalization-v2-design.md",
    existingArena: "data/intent-arena.v1.json",
    genericBoundaryTests: "tests/intent-generalization-v2.test.mjs",
    router: "src/router.mjs", runtime: "src/intent-runtime.mjs",
  };
  for (const [key, relativePath] of Object.entries(paths)) {
    assert.equal(actual.artifacts[key], sha256(canonicalText(await readFile(path.join(repositoryRoot, relativePath), "utf8"))), key);
  }
});

test("compiler generalization v2 remains cold and does not claim arbitrary-language proof", async () => {
  const receipt = JSON.parse(await readFile(path.join(repositoryRoot, "receipts", "compiler-generalization-v2.json"), "utf8"));

  assert.deepEqual(receipt.gates, {
    allGeneralizationCasesPass: true,
    allPriorArenaCasesPass: true,
    authorityInventionProhibited: true,
    exactNaturalCompositionCases: 3,
    hostActivationPerformed: false,
    priorOverCompositionCount: 0,
    priorUnsafeSelectionCount: 0,
  });
  assert.deepEqual(receipt.proofLimits, {
    arbitraryLanguageInterpretation: "not-proven",
    externalActionExecution: "not-performed",
    hostAdapterDeployment: "not-performed",
    semanticEvidence: "deterministic-local-fixtures",
  });
  for (const digest of Object.values(receipt.artifacts)) {
    assert.match(digest, /^[0-9a-f]{64}$/);
  }
});

test("the original v1 compiler certification remains byte-identical in history", async () => {
  const historical = await readFile(
    path.join(repositoryRoot, "history", "receipts", "intent-compiler-v1.json"),
    "utf8",
  );
  assert.equal(
    sha256(canonicalText(historical)),
    "65b77b836b2c6873469193a0ebf4844b146113b71c202f7ac196453a45a44c2d",
  );
});
