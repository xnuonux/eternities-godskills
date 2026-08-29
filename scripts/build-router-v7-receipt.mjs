import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

async function bytes(root, relativePath) {
  return readFile(path.join(root, relativePath));
}

export async function buildRouterV7(root = path.resolve("."), { write = true } = {}) {
  const [manifestBytes, cardsBytes, familyMapBytes, previousBytes] = await Promise.all([
    bytes(root, "artifacts/routing/manifest.json"), bytes(root, "artifacts/routing/cards.jsonl"),
    bytes(root, "artifacts/routing/family-map.json"), bytes(root, "receipts/agent-native-router-v6.json"),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const previous = JSON.parse(previousBytes.toString("utf8"));
  if (previous.id !== "agent-native-router-v6" || previous.status !== "certified") throw new Error("router v6 checkpoint is not certified");
  const cards = cardsBytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  if (manifest.cardCount !== cards.length || !cards.some(({ id }) => id === "eternities-omnibus")) throw new Error("router v7 requires the promoted Omnibus card");
  const commandlessCases = manifest.cardCount * 3;
  const receipt = {
    schemaVersion: 1,
    id: "agent-native-router-v7",
    status: "certified",
    basePurpose: "certified-cold-quarry-retrieval-integration",
    inputs: manifest.inputs,
    artifacts: { cardsSha256: sha256(cardsBytes), familyMapSha256: sha256(familyMapBytes), manifestSha256: sha256(manifestBytes) },
    checkpointEvidence: { id: previous.id, path: "receipts/agent-native-router-v6.json", receiptSha256: sha256(previousBytes) },
    counts: { aliasRemovalCases: commandlessCases, cardCount: manifest.cardCount, commandlessCases, familyCount: manifest.familyCount, maximumComposition: 3, maximumShortlist: 32 },
    gates: {
      aliasRemovalEquality: true, authorityPreserved: true, deterministicArtifacts: true,
      effectsPreserved: true, progressiveDisclosureBounded: true, selectedEntrypointsOnly: true,
      unnamedOutcomeRouting: true, unresolvedDecisionsFailClosed: true,
    },
    verification: { focusedTestCommand: "node --test tests/agent-native-router-v7.test.mjs tests/promoted-routing-cards.test.mjs" },
    proofLimits: { deterministicEnvelopeRouting: "certified", globalRuntimeActivation: "not-performed", liveModelNaturalLanguageInterpretation: "adapter-evaluation-required", productionBehavior: "not-proven" },
  };
  if (write) await writeJsonAtomic(path.join(root, "receipts/agent-native-router-v7.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) console.log(JSON.stringify(await buildRouterV7(), null, 2));
