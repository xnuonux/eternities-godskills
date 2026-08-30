import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildAegisAgenticCiReceipt } from "./build-aegis-agentic-ci-receipt.mjs";
import { buildHephaestusReceipt } from "./build-hephaestus-receipt.mjs";
import { buildQuarryInfusionV2Evidence } from "./build-quarry-infusion-v2.mjs";
import { buildRouterV8 } from "./build-router-v8-receipt.mjs";

const PROOFS = {
  systemV2: "receipts/godskills-system-certification-v2.json",
  infusionV2: "receipts/quarry-total-infusion-v2.json",
  wave3Snapshot: "receipts/github-skill-quarry-wave-3.json",
  wave3Security: "receipts/github-wave-3-skill-security.json",
  wave3Structures: "receipts/github-wave-3-structural-evidence.json",
  aegisV4: "receipts/promotions/eternities-aegis-v4.json",
  hephaestus: "receipts/promotions/eternities-hephaestus.json",
  routerV8: "receipts/agent-native-router-v8.json",
};
const HISTORICAL_SYSTEM_V2_SHA256 = "cf55d8a361c79b6fe40eba67d1df6feef1066bb379db1af96ca998c6503528c1";

const BINDINGS = {
  ...PROOFS,
  corpusUnion: "artifacts/quarry-infusion-v2/corpus-union.json",
  terminalDispositions: "artifacts/quarry-infusion-v2/terminal-dispositions.jsonl",
  facets: "artifacts/quarry-infusion-v2/facets.jsonl",
  coverage: "artifacts/quarry-infusion-v2/coverage.json",
  routingCards: "artifacts/routing/cards.jsonl",
  routingFamilyMap: "artifacts/routing/family-map.json",
  routingManifest: "artifacts/routing/manifest.json",
  missionStack: "artifacts/routing/mission-stack-smoke.json",
};

async function json(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function artifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

export function certificationStatusV3({ exact, terminalCoverage, promoted, noActivation, authorityPreserved }) {
  return exact && terminalCoverage && promoted && noActivation && authorityPreserved ? "certified" : "failed";
}

export async function buildGodskillsSystemV3({ root = path.resolve("."), write = true } = {}) {
  const [proofEntries, corpusUnion, routingManifest, missionStack] = await Promise.all([
    Promise.all(Object.entries(PROOFS).map(async ([key, relativePath]) => [key, await json(root, relativePath)])),
    json(root, "artifacts/quarry-infusion-v2/corpus-union.json"),
    json(root, "artifacts/routing/manifest.json"),
    json(root, "artifacts/routing/mission-stack-smoke.json"),
  ]);
  const proofs = Object.fromEntries(proofEntries);
  const [rebuiltInfusion, rebuiltAegis, rebuiltHephaestus, rebuiltRouter] = await Promise.all([
    buildQuarryInfusionV2Evidence({ root, write: false }),
    buildAegisAgenticCiReceipt({ root, write: false }),
    buildHephaestusReceipt({ root, write: false }),
    buildRouterV8(root, { write: false }),
  ]);
  const rebuildsExact =
    isDeepStrictEqual(rebuiltInfusion.receipt, proofs.infusionV2) &&
    isDeepStrictEqual(rebuiltAegis.receipt, proofs.aegisV4) &&
    isDeepStrictEqual(rebuiltHephaestus.receipt, proofs.hephaestus) &&
    isDeepStrictEqual(rebuiltRouter, proofs.routerV8);
  const terminalCoverage =
    proofs.infusionV2.status === "certified" &&
    proofs.infusionV2.counts.sourceCount === 15993 &&
    proofs.infusionV2.counts.canonicalBodyCount === 5209 &&
    proofs.infusionV2.counts.unresolvedSourceCount === 0 &&
    corpusUnion.rawSourceRecordCount === 16876 &&
    corpusUnion.coalescedDuplicateSourceRecordCount === 883;
  const promoted =
    proofs.aegisV4.decision?.status === "promoted" &&
    proofs.hephaestus.decision?.status === "promoted" &&
    proofs.routerV8.status === "certified";
  const noActivation =
    proofs.infusionV2.thirdPartyCodeExecuted === false &&
    proofs.infusionV2.sourceInstructionsActivated === false &&
    proofs.aegisV4.evidence.targetCodeExecuted === false &&
    proofs.aegisV4.evidence.externalMutation === false &&
    proofs.hephaestus.evidence.targetCodeExecuted === false &&
    proofs.hephaestus.evidence.externalMutation === false &&
    proofs.routerV8.proofLimits.globalRuntimeActivation === "not-performed";
  const authorityPreserved =
    missionStack.authorityExpanded === false &&
    missionStack.sourceBodiesTransported === 0 &&
    proofs.routerV8.gates.authorityPreserved === true &&
    proofs.routerV8.gates.effectsPreserved === true;
  const historicalSystemV2DigestExact =
    sha256(await readFile(path.join(root, PROOFS.systemV2))) === HISTORICAL_SYSTEM_V2_SHA256;
  const gates = {
    exactReceiptRebuilds: rebuildsExact,
    historicalSystemV2Preserved: proofs.systemV2.status === "certified" && historicalSystemV2DigestExact,
    historicalSystemV2DigestExact,
    allCombinedSourcesTerminal: terminalCoverage,
    aegisAgenticCiPromoted: proofs.aegisV4.decision?.status === "promoted",
    hephaestusPromoted: proofs.hephaestus.decision?.status === "promoted",
    routerV8Certified: proofs.routerV8.status === "certified",
    missionStackReconciled: authorityPreserved && proofs.routerV8.gates.missionStackReconciled === true,
    authorityExpanded: false,
    sourceInstructionsActivated: false,
    thirdPartyCodeExecuted: false,
    hostActivationPerformed: false,
  };
  const exact = rebuildsExact && proofs.systemV2.status === "certified" && historicalSystemV2DigestExact && routingManifest.cardCount === 22;
  const status = certificationStatusV3({ exact, terminalCoverage, promoted, noActivation, authorityPreserved });
  const artifacts = Object.fromEntries(await Promise.all(Object.entries(BINDINGS).map(async ([key, relativePath]) => [key, await artifact(root, relativePath)])));
  const receipt = {
    schemaVersion: 1,
    id: "eternities-godskills-system-v3",
    status,
    purpose: "combined-wave-three-cold-atlas-mission-stack-agentic-ci-and-model-compute-certification",
    counts: {
      rawSourceRecords: corpusUnion.rawSourceRecordCount,
      uniqueSourceIdentities: corpusUnion.coalescedSourceIdentityCount,
      repeatedSourceIdentities: corpusUnion.coalescedDuplicateSourceRecordCount,
      canonicalBodies: proofs.infusionV2.counts.canonicalBodyCount,
      canonicalFacets: proofs.infusionV2.counts.canonicalFacetCount,
      securityRejectedCanonicalBodies: proofs.infusionV2.counts.canonicalRejectedCount,
      exactDuplicates: proofs.infusionV2.counts.exactDuplicateCount,
      unresolvedSources: proofs.infusionV2.counts.unresolvedSourceCount,
      promotedCards: routingManifest.cardCount,
      routingFamilies: routingManifest.familyCount,
    },
    gates,
    artifacts,
    proofLimits: {
      arbitraryLiveLanguage: "not-proven",
      semanticCorrectnessOfThirdPartyPatterns: "not-proven",
      licenseClearance: "not-proven",
      thirdPartyExecutionSafety: "not-proven-and-not-executed",
      hostActivation: "not-performed",
      productionBehavior: "not-proven",
      missionStackHostAdoption: "not-performed",
    },
  };
  if (status !== "certified") throw new Error("Godskills system v3 did not certify");
  if (write) await writeJsonAtomic(path.join(root, "receipts/godskills-system-certification-v3.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) console.log(JSON.stringify(await buildGodskillsSystemV3(), null, 2));
