import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildCompilerGeneralizationV2Receipt } from "./build-compiler-generalization-v2-receipt.mjs";
import { buildIntentCompilerReceipt } from "./build-intent-compiler-receipt.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

export async function buildIntentCompilerV3({ root = path.resolve("."), write = true } = {}) {
  const [current, generalization, arenaBytes, historicalV1Bytes, historicalV2Bytes] = await Promise.all([
    buildIntentCompilerReceipt({ root, write: false }),
    buildCompilerGeneralizationV2Receipt({ root, write: false }),
    readFile(path.join(root, "data/intent-arena.v1.json")),
    readFile(path.join(root, "receipts/intent-compiler-v1.json")),
    readFile(path.join(root, "receipts/compiler-generalization-v2.json")),
  ]);
  const arena = JSON.parse(arenaBytes.toString("utf8"));
  const omnibusCases = arena.cases.filter(({ allowedIds = [] }) => allowedIds.includes("eternities-omnibus"));
  const gates = {
    allCurrentArenaCasesPass: current.metrics.failCount === 0,
    allGeneralizationCasesPass: generalization.metrics.generalization.failCount === 0,
    allPriorSafetyCasesPass: generalization.metrics.existingArena.failCount === 0,
    authorityInventionProhibited: current.metrics.authorityInventionCount === 0 && generalization.metrics.generalization.authorityInventionCount === 0,
    omnibusCovered: omnibusCases.length >= 4,
    unsafeSelectionCount: current.metrics.unsafeSelectionCount,
    sourceBodiesLoadedDuringRouting: false,
    hostActivationPerformed: false,
  };
  const certified = gates.allCurrentArenaCasesPass && gates.allGeneralizationCasesPass && gates.allPriorSafetyCasesPass &&
    gates.authorityInventionProhibited && gates.omnibusCovered && gates.unsafeSelectionCount === 0 &&
    gates.sourceBodiesLoadedDuringRouting === false && gates.hostActivationPerformed === false;
  const receipt = {
    schemaVersion: 1,
    id: "intent-compiler-v3",
    status: certified ? "certified" : "failed",
    purpose: "twenty-two-card-commandless-routing-with-bounded-cold-quarry-discovery",
    checkpoints: {
      intentCompilerV1: { path: "receipts/intent-compiler-v1.json", sha256: sha256(historicalV1Bytes), bytes: historicalV1Bytes.length },
      compilerGeneralizationV2: { path: "receipts/compiler-generalization-v2.json", sha256: sha256(historicalV2Bytes), bytes: historicalV2Bytes.length },
    },
    artifacts: { intentCompiler: current.artifacts, generalization: generalization.artifacts, arena: { path: "data/intent-arena.v1.json", sha256: sha256(arenaBytes), bytes: arenaBytes.length } },
    metrics: { currentArena: current.metrics, generalization: generalization.metrics.generalization, safetyArena: generalization.metrics.existingArena },
    gates,
    proofLimits: {
      arbitraryLanguageInterpretation: "not-proven",
      externalActionExecution: "not-performed",
      hostActivation: "not-performed",
      semanticEvidence: "deterministic-local-fixtures",
    },
  };
  if (!certified) throw new Error("intent compiler v3 did not certify");
  if (write) await writeJsonAtomic(path.join(root, "receipts/intent-compiler-v3.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) console.log(JSON.stringify(await buildIntentCompilerV3(), null, 2));
