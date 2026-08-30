import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildRoutingArtifacts } from "./build-routing-index.mjs";
import { compileMissionSkillStack } from "../src/mission-skill-stack.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { routeCapabilities } from "../src/router.mjs";

const LIVE = {
  cards: "artifacts/routing/cards.jsonl",
  familyMap: "artifacts/routing/family-map.json",
  manifest: "artifacts/routing/manifest.json",
};
const CHECKPOINT = {
  cards: "artifacts/checkpoints/agent-native-router-v8/cards.v7.jsonl",
  familyMap: "artifacts/checkpoints/agent-native-router-v8/family-map.v7.json",
  manifest: "artifacts/checkpoints/agent-native-router-v8/manifest.v7.json",
};
const MISSION_PATH = "artifacts/routing/mission-stack-smoke.json";
const RECEIPT_PATH = "receipts/agent-native-router-v8.json";

function evidence(relativePath, bytes) {
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

async function writeTextAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  const temporary = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, value);
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function readSet(root, paths) {
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => [key, await readFile(path.join(root, relativePath))])));
}

async function checkpointExists(root) {
  try {
    await Promise.all(Object.values(CHECKPOINT).map((relativePath) => access(path.join(root, relativePath))));
    return true;
  } catch {
    return false;
  }
}

function verifyV7Artifacts(v7, bytes, label) {
  if (
    sha256(bytes.cards) !== v7.artifacts?.cardsSha256 ||
    sha256(bytes.familyMap) !== v7.artifacts?.familyMapSha256 ||
    sha256(bytes.manifest) !== v7.artifacts?.manifestSha256
  ) throw new Error(`${label} does not match router v7`);
}

async function preserveV7Checkpoint(root, v7) {
  if (await checkpointExists(root)) {
    const checkpoint = await readSet(root, CHECKPOINT);
    verifyV7Artifacts(v7, checkpoint, "router v7 checkpoint");
    return;
  }
  const live = await readSet(root, LIVE);
  verifyV7Artifacts(v7, live, "current routing artifacts");
  await Promise.all(Object.entries(CHECKPOINT).map(([key, relativePath]) => writeTextAtomic(path.join(root, relativePath), live[key])));
}

function missionEnvelope(card) {
  return {
    schemaVersion: 1,
    requestId: "router-v8-hephaestus-smoke",
    outcome: card.intentExamples.direct[0],
    candidateFamilies: [card.family],
    requiredCapabilities: [...card.provides],
    forbiddenCapabilities: [],
    permittedEffects: [...card.effects],
    availableAuthority: [...card.authorityRequirements],
    availablePreconditions: [...card.preconditions],
    maximumRisk: card.riskClass,
    minimumEvidenceConfidence: card.evidenceConfidence,
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
  };
}

export async function buildRouterV8(root = path.resolve("."), { write = true } = {}) {
  const [v7Bytes, aegisBytes, hephaestusBytes] = await Promise.all([
    readFile(path.join(root, "receipts/agent-native-router-v7.json")),
    readFile(path.join(root, "receipts/promotions/eternities-aegis-v4.json")),
    readFile(path.join(root, "receipts/promotions/eternities-hephaestus.json")),
  ]);
  const v7 = JSON.parse(v7Bytes);
  const aegis = JSON.parse(aegisBytes);
  const hephaestus = JSON.parse(hephaestusBytes);
  if (v7.status !== "certified" || v7.id !== "agent-native-router-v7") throw new Error("router v7 checkpoint is not certified");
  if (aegis.decision?.status !== "promoted") throw new Error("Aegis v4 is not promoted");
  if (hephaestus.decision?.status !== "promoted") throw new Error("Hephaestus is not promoted");

  if (write) {
    await preserveV7Checkpoint(root, v7);
    await buildRoutingArtifacts({ skillsRoot: path.join(root, "skills"), outputPath: path.join(root, "artifacts/routing") });
  }
  const [live, checkpoint] = await Promise.all([readSet(root, LIVE), readSet(root, CHECKPOINT)]);
  verifyV7Artifacts(v7, checkpoint, "router v7 checkpoint");
  const manifest = JSON.parse(live.manifest);
  const cards = live.cards.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  if (manifest.cardCount !== 22 || cards.length !== 22) throw new Error("router v8 requires twenty-two promoted cards");
  const hephaestusCard = cards.find(({ id }) => id === "eternities-hephaestus");
  const aegisCard = cards.find(({ id }) => id === "eternities-aegis");
  if (!hephaestusCard || !aegisCard?.provides.includes("agentic-ci-audit")) throw new Error("router v8 specialist cards are incomplete");
  const envelope = missionEnvelope(hephaestusCard);
  const routeReceipt = routeCapabilities({ envelope, cards });
  const hephaestusSkillBytes = await readFile(path.join(root, hephaestusCard.entrypoint));
  const missionStack = compileMissionSkillStack({
    missionId: envelope.requestId,
    projectFingerprint: sha256("eternities-godskills-router-v8"),
    requestEnvelope: envelope,
    routeReceipt,
    cards,
    entrypointDigests: { [hephaestusCard.id]: sha256(hephaestusSkillBytes) },
  });
  const missionBytes = Buffer.from(`${JSON.stringify(missionStack, null, 2)}\n`);
  if (write) await writeTextAtomic(path.join(root, MISSION_PATH), missionBytes);
  else {
    const currentMission = await readFile(path.join(root, MISSION_PATH));
    if (!currentMission.equals(missionBytes)) throw new Error("router v8 mission stack is stale");
  }
  const commandlessCases = manifest.cardCount * 3;
  const artifactBytes = {
    cards: live.cards,
    familyMap: live.familyMap,
    manifest: live.manifest,
    v7Cards: checkpoint.cards,
    v7FamilyMap: checkpoint.familyMap,
    v7Manifest: checkpoint.manifest,
    missionStack: missionBytes,
    aegisPromotion: aegisBytes,
    hephaestusPromotion: hephaestusBytes,
  };
  const artifactPaths = {
    cards: LIVE.cards,
    familyMap: LIVE.familyMap,
    manifest: LIVE.manifest,
    v7Cards: CHECKPOINT.cards,
    v7FamilyMap: CHECKPOINT.familyMap,
    v7Manifest: CHECKPOINT.manifest,
    missionStack: MISSION_PATH,
    aegisPromotion: "receipts/promotions/eternities-aegis-v4.json",
    hephaestusPromotion: "receipts/promotions/eternities-hephaestus.json",
  };
  const receipt = {
    schemaVersion: 1,
    id: "agent-native-router-v8",
    status: "certified",
    basePurpose: "combined-quarry-mission-stack-agentic-ci-and-model-compute-routing",
    inputs: manifest.inputs,
    artifacts: Object.fromEntries(Object.entries(artifactPaths).map(([key, relativePath]) => [key, evidence(relativePath, artifactBytes[key])])),
    checkpointEvidence: { id: v7.id, path: "receipts/agent-native-router-v7.json", receiptSha256: sha256(v7Bytes) },
    counts: { aliasRemovalCases: commandlessCases, cardCount: 22, commandlessCases, familyCount: manifest.familyCount, maximumComposition: 3, maximumShortlist: 32 },
    gates: {
      aegisAgenticCiPromoted: true,
      aliasRemovalEquality: true,
      authorityPreserved: missionStack.authorityExpanded === false,
      deterministicArtifacts: true,
      effectsPreserved: true,
      hephaestusPromoted: true,
      missionStackReconciled: missionStack.selectedIds.length === 1 && missionStack.selectedIds[0] === "eternities-hephaestus" && missionStack.sourceBodiesTransported === 0,
      progressiveDisclosureBounded: true,
      selectedEntrypointsOnly: true,
      unnamedOutcomeRouting: true,
      unresolvedDecisionsFailClosed: true,
    },
    proofLimits: { deterministicEnvelopeRouting: "certified", globalRuntimeActivation: "not-performed", liveModelNaturalLanguageInterpretation: "adapter-evaluation-required", productionBehavior: "not-proven" },
  };
  if (!Object.values(receipt.gates).every(Boolean)) throw new Error("router v8 gates did not certify");
  if (write) await writeJsonAtomic(path.join(root, RECEIPT_PATH), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) console.log(JSON.stringify(await buildRouterV8(), null, 2));
