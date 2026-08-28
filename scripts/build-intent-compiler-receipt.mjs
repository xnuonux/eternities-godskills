import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateIntentArena } from "../src/intent-arena.mjs";
import { canonicalText, readJson, sha256, writeJsonAtomic } from "../src/io.mjs";

const ARTIFACT_PATHS = Object.freeze({
  arena: "data/intent-arena.v1.json",
  arenaSource: "data/intent-arena-source.v1.json",
  cards: "artifacts/routing/cards.jsonl",
  compiler: "src/intent-compiler.mjs",
  contracts: "src/intent-contracts.mjs",
  documentation: "docs/intent-compiler.md",
  evaluator: "src/intent-arena.mjs",
  runtime: "src/intent-runtime.mjs",
  transport: "scripts/intent.mjs",
});

async function canonicalFileDigest(root, relativePath) {
  return sha256(canonicalText(await readFile(path.join(root, relativePath), "utf8")));
}

export async function buildIntentCompilerReceipt({ root = path.resolve("."), write = true } = {}) {
  const artifactEntries = await Promise.all(
    Object.entries(ARTIFACT_PATHS).map(async ([id, relativePath]) => [
      id,
      await canonicalFileDigest(root, relativePath),
    ]),
  );
  const [arena, cardsText] = await Promise.all([
    readJson(path.join(root, ARTIFACT_PATHS.arena)),
    readFile(path.join(root, ARTIFACT_PATHS.cards), "utf8"),
  ]);
  const evaluation = evaluateIntentArena({
    arena,
    cards: cardsText.trim().split(/\r?\n/).map(JSON.parse),
  });
  const receipt = {
    schemaVersion: 1,
    id: "intent-compiler-v1",
    status: evaluation.failCount === 0 ? "certified" : "failed",
    purpose: "agent-neutral-natural-language-to-godskills-envelope",
    artifacts: Object.fromEntries(artifactEntries),
    metrics: {
      authorityInventionCount: evaluation.authorityInventionCount,
      caseCount: evaluation.caseCount,
      failCount: evaluation.failCount,
      overCompositionCount: evaluation.overCompositionCount,
      passCount: evaluation.passCount,
      positiveCaseCount: evaluation.positiveCaseCount,
      positiveExactSelectionCount: evaluation.positiveExactSelectionCount,
      positiveExactSelectionRate: evaluation.positiveExactSelectionRate,
      repeatabilityMismatchCount: evaluation.repeatabilityMismatchCount,
      unsafeSelectionCount: evaluation.unsafeSelectionCount,
    },
    gates: {
      ambiguityFailsClosed: evaluation.results
        .filter(({ kind }) => kind === "ambiguous")
        .every(({ actualStatus }) => actualStatus === "needs-decision"),
      authorityInventionProhibited: evaluation.authorityInventionCount === 0,
      deterministicRepeatability: evaluation.repeatabilityMismatchCount === 0,
      externalActionExecution: false,
      modelDependencyRequired: false,
      progressiveDisclosureBounded: true,
      skillBodiesLoadedDuringRouting: false,
      unsafeSelectionCount: evaluation.unsafeSelectionCount,
    },
    verification: {
      arenaCommand: "npm run evaluate:intent",
      focusedTestCommand: "node --test tests/intent-contracts.test.mjs tests/intent-compiler.test.mjs tests/intent-runtime.test.mjs tests/intent-transport.test.mjs tests/intent-arena.test.mjs tests/intent-compiler-certification.test.mjs",
      minimumPositiveExactSelectionRate: 0.9,
      maximumCompilerCandidates: 8,
      maximumRouterCandidates: 32,
      maximumCompositionSize: 3,
    },
    proofLimits: {
      hostAdapterDeployment: "not-performed",
      liveModelInterpretation: "not-proven-by-fixtures",
      productionOperation: "not-performed",
      semanticArena: "certified-local-fixture-evidence",
    },
  };
  if (write) {
    await writeJsonAtomic(path.join(root, "receipts", "intent-compiler-v1.json"), receipt);
  }
  return receipt;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const root = path.resolve(process.argv[2] ?? ".");
  const receipt = await buildIntentCompilerReceipt({ root, write: true });
  console.log(JSON.stringify({ status: receipt.status, metrics: receipt.metrics }, null, 2));
}
