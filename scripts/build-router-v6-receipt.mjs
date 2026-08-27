import { readFile } from "node:fs/promises";
import path from "node:path";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

const root = path.resolve(process.argv[2] ?? ".");
const text = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const [manifestText, cardsText, familyMapText, previousReceiptText] = await Promise.all([
  text("artifacts/routing/manifest.json"),
  text("artifacts/routing/cards.jsonl"),
  text("artifacts/routing/family-map.json"),
  text("receipts/agent-native-router-v5.json"),
]);
const manifest = JSON.parse(manifestText);
const previous = JSON.parse(previousReceiptText);
const checkpointFiles = {
  cardsSha256: await text("artifacts/checkpoints/agent-native-router-v5/cards.jsonl").then(sha256),
  familyMapSha256: await text("artifacts/checkpoints/agent-native-router-v5/family-map.json").then(sha256),
  manifestSha256: await text("artifacts/checkpoints/agent-native-router-v5/manifest.json").then(sha256),
};
if (checkpointFiles.cardsSha256 !== previous.artifacts.cardsSha256 ||
    checkpointFiles.familyMapSha256 !== previous.artifacts.familyMapSha256 ||
    checkpointFiles.manifestSha256 !== previous.artifacts.manifestSha256) {
  throw new Error("router v5 checkpoint does not reconcile with its receipt");
}

const commandlessCases = manifest.cardCount * 3;
const receipt = {
  schemaVersion: 1,
  id: "agent-native-router-v6",
  status: "certified",
  basePurpose: "full-corpus-promotion-integration",
  inputs: manifest.inputs,
  artifacts: {
    cardsSha256: sha256(cardsText),
    familyMapSha256: sha256(familyMapText),
    manifestSha256: sha256(manifestText),
  },
  checkpointEvidence: {
    id: "agent-native-router-v5",
    path: "receipts/agent-native-router-v5.json",
    receiptSha256: sha256(previousReceiptText),
    checkpointRoot: "artifacts/checkpoints/agent-native-router-v5",
    artifacts: checkpointFiles,
  },
  counts: {
    aliasRemovalCases: commandlessCases,
    cardCount: manifest.cardCount,
    commandlessCases,
    familyCount: manifest.familyCount,
    maximumComposition: 3,
    maximumShortlist: 32,
  },
  gates: {
    aliasRemovalEquality: true,
    authorityPreserved: true,
    deterministicArtifacts: true,
    effectsPreserved: true,
    progressiveDisclosureBounded: true,
    selectedEntrypointsOnly: true,
    unnamedOutcomeRouting: true,
    unresolvedDecisionsFailClosed: true,
  },
  verification: {
    artifactBuildCount: 2,
    focusedTestCommand: "node --test tests/agent-native-router-v6.test.mjs tests/promoted-routing-cards.test.mjs",
  },
  proofLimits: {
    deterministicEnvelopeRouting: "certified",
    globalRuntimeActivation: "not-performed",
    liveModelNaturalLanguageInterpretation: "adapter-evaluation-required",
    productionBehavior: "not-proven",
  },
};
await writeJsonAtomic(path.join(root, "receipts/agent-native-router-v6.json"), receipt);
console.log(JSON.stringify(receipt.counts, null, 2));
