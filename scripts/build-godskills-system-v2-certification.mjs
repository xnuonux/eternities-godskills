import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildOmnibus } from "./build-omnibus-receipt.mjs";
import { buildQuarryInfusionEvidence } from "./build-quarry-infusion.mjs";
import { buildRouterV7 } from "./build-router-v7-receipt.mjs";
import { buildIntentCompilerV3 } from "./build-intent-compiler-v3-receipt.mjs";

const PROOFS = {
  systemV1: "receipts/godskills-system-certification-v1.json",
  infusion: "receipts/quarry-total-infusion-v1.json",
  omnibus: "receipts/promotions/eternities-omnibus.json",
  routerV7: "receipts/agent-native-router-v7.json",
  intentCompilerV3: "receipts/intent-compiler-v3.json",
};

const BINDINGS = {
  systemV1: PROOFS.systemV1,
  v1RoutingCards: "artifacts/checkpoints/godskills-system-v1-routing/cards.jsonl",
  v1RoutingFamilyMap: "artifacts/checkpoints/godskills-system-v1-routing/family-map.json",
  v1RoutingManifest: "artifacts/checkpoints/godskills-system-v1-routing/manifest.json",
  infusion: PROOFS.infusion,
  terminalDispositions: "artifacts/quarry-infusion/terminal-dispositions.jsonl",
  facets: "artifacts/quarry-infusion/facets.jsonl",
  coverage: "artifacts/quarry-infusion/coverage.json",
  omnibus: PROOFS.omnibus,
  routerV7: PROOFS.routerV7,
  intentCompilerV3: PROOFS.intentCompilerV3,
  routingCards: "artifacts/routing/cards.jsonl",
  routingFamilyMap: "artifacts/routing/family-map.json",
  routingManifest: "artifacts/routing/manifest.json",
};

async function json(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function artifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

export function certificationStatusV2({ exact, terminalCoverage, coldAndInert, noActivation }) {
  return exact && terminalCoverage && coldAndInert && noActivation ? "certified" : "failed";
}

export async function buildGodskillsSystemV2({ root = path.resolve("."), write = true } = {}) {
  const [systemV1, infusion, omnibus, routerV7, intentCompilerV3, routingManifest] = await Promise.all([
    json(root, PROOFS.systemV1), json(root, PROOFS.infusion), json(root, PROOFS.omnibus),
    json(root, PROOFS.routerV7), json(root, PROOFS.intentCompilerV3), json(root, "artifacts/routing/manifest.json"),
  ]);
  const [rebuiltInfusion, rebuiltOmnibus, rebuiltRouter, rebuiltIntentCompiler] = await Promise.all([
    buildQuarryInfusionEvidence({ root, write: false }), buildOmnibus(root, { write: false }), buildRouterV7(root, { write: false }), buildIntentCompilerV3({ root, write: false }),
  ]);
  const artifacts = Object.fromEntries(await Promise.all(Object.entries(BINDINGS).map(async ([key, relativePath]) => [key, await artifact(root, relativePath)])));
  const historicalV1RoutingCheckpointExact =
    artifacts.v1RoutingCards.sha256 === systemV1.artifacts.routingCards.sha256 &&
    artifacts.v1RoutingFamilyMap.sha256 === systemV1.artifacts.routingFamilyMap.sha256 &&
    artifacts.v1RoutingManifest.sha256 === systemV1.artifacts.routingManifest.sha256;
  const receiptRebuildsExact = isDeepStrictEqual(rebuiltInfusion.receipt, infusion) &&
    isDeepStrictEqual(rebuiltOmnibus.receipt, omnibus) && isDeepStrictEqual(rebuiltRouter, routerV7) &&
    isDeepStrictEqual(rebuiltIntentCompiler, intentCompilerV3);
  const terminalCoverage = infusion.status === "certified" && infusion.counts.sourceCount === 7776 &&
    infusion.counts.canonicalBodyCount === 3581 && infusion.counts.exactDuplicateCount === 4195 &&
    infusion.counts.unresolvedSourceCount === 0;
  const gates = {
    historicalSystemV1Certified: systemV1.status === "certified",
    historicalV1RoutingCheckpointExact,
    infusionReceiptRebuildExact: isDeepStrictEqual(rebuiltInfusion.receipt, infusion),
    omnibusReceiptRebuildExact: isDeepStrictEqual(rebuiltOmnibus.receipt, omnibus),
    routerV7ReceiptRebuildExact: isDeepStrictEqual(rebuiltRouter, routerV7),
    intentCompilerV3ReceiptRebuildExact: isDeepStrictEqual(rebuiltIntentCompiler, intentCompilerV3),
    allQuarrySourcesTerminal: terminalCoverage,
    omnibusPromoted: omnibus.decision?.status === "promoted",
    sourceInstructionsActivated: false,
    thirdPartyCodeExecuted: false,
    hostActivationPerformed: false,
    pantheonEnabled: false,
  };
  const counts = {
    legacyReviewedSources: systemV1.counts.reviewedSources,
    quarrySources: infusion.counts.sourceCount,
    canonicalBodies: infusion.counts.canonicalBodyCount,
    canonicalFacets: infusion.counts.canonicalFacetCount,
    securityRejectedCanonicalBodies: infusion.counts.canonicalRejectedCount,
    exactDuplicates: infusion.counts.exactDuplicateCount,
    unresolvedQuarrySources: infusion.counts.unresolvedSourceCount,
    promotedCards: routingManifest.cardCount,
    routingFamilies: routingManifest.familyCount,
    intentArenaCases: intentCompilerV3.metrics.currentArena.caseCount,
  };
  const status = certificationStatusV2({
    exact: systemV1.status === "certified" && historicalV1RoutingCheckpointExact && receiptRebuildsExact && routerV7.status === "certified",
    terminalCoverage,
    coldAndInert: omnibus.decision?.status === "promoted" && infusion.sourceInstructionsActivated === false && infusion.thirdPartyCodeExecuted === false,
    noActivation: gates.sourceInstructionsActivated === false && gates.thirdPartyCodeExecuted === false && gates.hostActivationPerformed === false && gates.pantheonEnabled === false,
  });
  const receipt = {
    schemaVersion: 1,
    id: "eternities-godskills-system-v2",
    status,
    purpose: "rebuildable-total-quarry-infusion-and-bounded-specialist-retrieval-certification",
    counts,
    gates,
    artifacts,
    proofLimits: {
      arbitraryLiveLanguage: "not-proven",
      semanticCorrectnessOfThirdPartyPatterns: "not-proven",
      licenseClearance: "not-proven",
      thirdPartyExecutionSafety: "not-proven-and-not-executed",
      hostActivation: "not-performed",
      productionBehavior: "not-proven",
    },
  };
  if (status !== "certified") throw new Error("Godskills system v2 did not certify");
  if (write) await writeJsonAtomic(path.join(root, "receipts/godskills-system-certification-v2.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) console.log(JSON.stringify(await buildGodskillsSystemV2(), null, 2));
