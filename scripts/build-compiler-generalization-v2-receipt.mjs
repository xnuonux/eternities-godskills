import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateIntentArena } from "../src/intent-arena.mjs";
import { compileAndRoute } from "../src/intent-runtime.mjs";
import { canonicalText, readJson, sha256, writeJsonAtomic } from "../src/io.mjs";

const ARTIFACT_PATHS = Object.freeze({
  arena: "data/compiler-generalization-v2-arena.json",
  cards: "artifacts/routing/cards.jsonl",
  compiler: "src/intent-compiler.mjs",
  contract: "data/compiler-generalization-v2-contract.json",
  design: "docs/superpowers/specs/2026-08-28-compiler-generalization-v2-design.md",
  existingArena: "data/intent-arena.v1.json",
  router: "src/router.mjs",
  runtime: "src/intent-runtime.mjs",
});

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function hasDecisionPrefix(decisions, prefix) {
  return decisions.some((decision) => decision === prefix || decision.startsWith(`${prefix}:`));
}

function evaluateGeneralizationArena({ arena, cards }) {
  if (arena?.schemaVersion !== 1 || !Array.isArray(arena.cases)) {
    throw new Error("compiler generalization arena must be schema version 1 with cases");
  }
  const results = arena.cases.map((fixture) => {
    const context = arena.contexts?.[fixture.context];
    if (context === undefined) throw new Error(`unknown arena context: ${fixture.context}`);
    const request = {
      schemaVersion: 1,
      requestId: fixture.id,
      text: fixture.text,
      context,
    };
    const result = compileAndRoute({ request, cards });
    const inventedAuthority = result.compilerReceipt.envelope.availableAuthority
      .filter((authority) => !context.availableAuthority.includes(authority));
    const reasons = [];
    if (result.routeReceipt.status !== fixture.expectedStatus) reasons.push("status-mismatch");
    if (JSON.stringify(result.routeReceipt.selectedIds) !== JSON.stringify(fixture.expectedIds)) {
      reasons.push("selection-mismatch");
    }
    for (const prefix of fixture.requiredDecisionPrefixes) {
      if (!hasDecisionPrefix(result.compilerReceipt.unresolvedDecisions, prefix)) {
        reasons.push(`missing-decision:${prefix}`);
      }
    }
    if (inventedAuthority.length > 0) reasons.push("authority-invention");
    return {
      id: fixture.id,
      kind: fixture.kind,
      passed: reasons.length === 0,
      reasons: sorted(reasons),
      actualStatus: result.routeReceipt.status,
      selectedIds: result.routeReceipt.selectedIds,
      selectionKind: result.routeReceipt.selectionKind,
      inventedAuthority: sorted(inventedAuthority),
    };
  });
  return {
    caseCount: results.length,
    passCount: results.filter(({ passed }) => passed).length,
    failCount: results.filter(({ passed }) => !passed).length,
    exactCompositionCount: results.filter(({ kind, passed, selectionKind }) =>
      kind === "composition" && passed && selectionKind === "composition").length,
    authorityInventionCount: results.reduce(
      (count, result) => count + result.inventedAuthority.length,
      0,
    ),
    results,
  };
}

async function canonicalFileDigest(root, relativePath) {
  return sha256(canonicalText(await readFile(path.join(root, relativePath), "utf8")));
}

export async function buildCompilerGeneralizationV2Receipt({
  root = path.resolve("."),
  write = true,
} = {}) {
  const artifactEntries = await Promise.all(
    Object.entries(ARTIFACT_PATHS).map(async ([id, relativePath]) => [
      id,
      await canonicalFileDigest(root, relativePath),
    ]),
  );
  const [arena, existingArena, cardsText] = await Promise.all([
    readJson(path.join(root, ARTIFACT_PATHS.arena)),
    readJson(path.join(root, ARTIFACT_PATHS.existingArena)),
    readFile(path.join(root, ARTIFACT_PATHS.cards), "utf8"),
  ]);
  const cards = cardsText.trim().split(/\r?\n/).map(JSON.parse);
  const generalization = evaluateGeneralizationArena({ arena, cards });
  const existing = evaluateIntentArena({ arena: existingArena, cards });
  const gates = {
    allGeneralizationCasesPass: generalization.failCount === 0,
    allPriorArenaCasesPass: existing.failCount === 0,
    authorityInventionProhibited:
      generalization.authorityInventionCount === 0 && existing.authorityInventionCount === 0,
    exactNaturalCompositionCases: generalization.exactCompositionCount,
    hostActivationPerformed: false,
    priorOverCompositionCount: existing.overCompositionCount,
    priorUnsafeSelectionCount: existing.unsafeSelectionCount,
  };
  const certified = gates.allGeneralizationCasesPass &&
    gates.allPriorArenaCasesPass &&
    gates.authorityInventionProhibited &&
    gates.exactNaturalCompositionCases === 3 &&
    gates.priorOverCompositionCount === 0 &&
    gates.priorUnsafeSelectionCount === 0;
  const receipt = {
    schemaVersion: 1,
    id: "compiler-generalization-v2",
    status: certified ? "certified" : "failed",
    purpose: "proposal-free-evidenced-compatible-natural-composition",
    artifacts: Object.fromEntries(artifactEntries),
    metrics: {
      generalization: {
        authorityInventionCount: generalization.authorityInventionCount,
        caseCount: generalization.caseCount,
        exactCompositionCount: generalization.exactCompositionCount,
        failCount: generalization.failCount,
        passCount: generalization.passCount,
      },
      existingArena: {
        authorityInventionCount: existing.authorityInventionCount,
        caseCount: existing.caseCount,
        failCount: existing.failCount,
        overCompositionCount: existing.overCompositionCount,
        passCount: existing.passCount,
        unsafeSelectionCount: existing.unsafeSelectionCount,
      },
    },
    gates,
    verification: {
      focusedCommand: "node --test tests/intent-generalization-v2.test.mjs tests/compiler-generalization-v2-certification.test.mjs",
      priorArenaCommand: "npm run evaluate:intent",
      receiptCommand: "npm run build:compiler-generalization-v2",
      requiredCompositionCases: 3,
    },
    proofLimits: {
      arbitraryLanguageInterpretation: "not-proven",
      externalActionExecution: "not-performed",
      hostAdapterDeployment: "not-performed",
      semanticEvidence: "deterministic-local-fixtures",
    },
  };
  if (write) {
    await writeJsonAtomic(
      path.join(root, "receipts", "compiler-generalization-v2.json"),
      receipt,
    );
  }
  return receipt;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const root = path.resolve(process.argv[2] ?? ".");
  const receipt = await buildCompilerGeneralizationV2Receipt({ root, write: true });
  console.log(JSON.stringify({ status: receipt.status, metrics: receipt.metrics }, null, 2));
}
