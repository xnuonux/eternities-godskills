import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { buildAttestedContinuityReceipt } from "./build-attested-continuity-receipt.mjs";
import { buildCompilerGeneralizationV2Receipt } from "./build-compiler-generalization-v2-receipt.mjs";
import { buildIntentCompilerReceipt } from "./build-intent-compiler-receipt.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

const RECEIPTS = {
  completion: "receipts/eternities-godskills-completion.json",
  router: "receipts/agent-native-router-v6.json",
  compilerV1: "receipts/intent-compiler-v1.json",
  compilerV2: "receipts/compiler-generalization-v2.json",
  supplyChain: "receipts/promotions/eternities-aegis-v3.json",
  usageEvolution: "receipts/promotions/sovereign-skill-refinery-usage-evolution-v1.json",
  athena: "receipts/promotions/eternities-athena.json",
  continuity: "receipts/promotions/attested-task-continuity.json",
  quarry: "receipts/github-skill-quarry-wave-2.json",
};

async function json(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function evidence(root, relativePath) {
  return { path: relativePath, sha256: sha256(await readFile(path.join(root, relativePath))) };
}

function everyFalse(value) {
  return Object.values(value).every((entry) => entry === false);
}

export async function buildGodskillsSystemCertification({ root = path.resolve("."), write = true } = {}) {
  const entries = await Promise.all(Object.entries(RECEIPTS).map(async ([name, relativePath]) => [name, await json(root, relativePath)]));
  const proofs = Object.fromEntries(entries);
  const [manifest, cardsText, familyMapText, routingManifestText] = await Promise.all([
    json(root, "artifacts/routing/manifest.json"),
    readFile(path.join(root, "artifacts/routing/cards.jsonl"), "utf8"),
    readFile(path.join(root, "artifacts/routing/family-map.json"), "utf8"),
    readFile(path.join(root, "artifacts/routing/manifest.json"), "utf8"),
  ]);
  const cards = cardsText.trim().split(/\r?\n/).map(JSON.parse);
  const exactInputs = await Promise.all(manifest.inputs.map(async ({ id, path: cardPath, sha256: expected }) => {
    const actual = sha256(await readFile(path.join(root, "skills", cardPath)));
    return id === path.basename(path.dirname(path.dirname(cardPath))) && actual === expected;
  }));
  const [rebuiltV1, rebuiltV2, rebuiltContinuity] = await Promise.all([
    buildIntentCompilerReceipt({ root, write: false }),
    buildCompilerGeneralizationV2Receipt({ root, write: false }),
    buildAttestedContinuityReceipt({ root, write: false }),
  ]);
  const routingArtifactsExact = proofs.router.artifacts.cardsSha256 === sha256(cardsText) &&
    proofs.router.artifacts.familyMapSha256 === sha256(familyMapText) &&
    proofs.router.artifacts.manifestSha256 === sha256(routingManifestText) &&
    manifest.outputs.cardsSha256 === sha256(cardsText) &&
    manifest.outputs.familyMapSha256 === sha256(familyMapText);
  const counts = {
    sourceRecords: proofs.completion.counts.sources,
    reviewedSources: proofs.completion.counts.reviewed,
    clusteredSources: proofs.completion.counts.clustered,
    promotedSourceMembers: proofs.completion.counts.promotedSources,
    promotedCards: cards.length,
    routingFamilies: manifest.familyCount,
    intentArenaCases: proofs.compilerV1.metrics.caseCount,
    compilerGeneralizationCases: proofs.compilerV2.metrics.generalization.caseCount,
    athenaCases: proofs.athena.candidate.total,
  };
  const gates = {
    allRoutingCardsExact: exactInputs.every(Boolean) && routingArtifactsExact && new Set(cards.map(({ id }) => id)).size === cards.length,
    allSourcesReviewedAndClustered: counts.sourceRecords === 4741 && counts.reviewedSources === 4741 && counts.clusteredSources === 4741 && proofs.completion.counts.unresolvedCandidateClusters === 0,
    allIntentArenasPass: proofs.compilerV1.status === "certified" && proofs.compilerV1.metrics.failCount === 0 && proofs.compilerV2.status === "certified" && proofs.compilerV2.metrics.generalization.failCount === 0 && proofs.compilerV2.metrics.existingArena.failCount === 0,
    authorityInventionCount: proofs.compilerV1.metrics.authorityInventionCount + proofs.compilerV2.metrics.generalization.authorityInventionCount,
    unsafeSelectionCount: proofs.compilerV1.metrics.unsafeSelectionCount + proofs.compilerV2.metrics.existingArena.unsafeSelectionCount,
    supplyChainGatePromoted: proofs.supplyChain.decision.status === "promoted",
    usageEvolutionPromotedButNotAdopted: proofs.usageEvolution.decision.status === "promoted" && proofs.usageEvolution.evolutionDecision.status === "eligible" && proofs.usageEvolution.evolutionDecision.adopted === false && proofs.usageEvolution.evolutionDecision.requiresExplicitAdoption === true,
    athenaPromoted: proofs.athena.decision.status === "promoted" && proofs.athena.candidate.criticalPassed === proofs.athena.candidate.criticalTotal,
    attestedContinuityCertified: proofs.continuity.status === "certified" && proofs.continuity.gates.authorityCannotExpand === true && proofs.continuity.gates.concurrentForkHasSingleWinner === true,
    externalActionExecution: false,
    hostActivationPerformed: false,
    pantheonEnabled: false,
  };
  const receiptRebuildsExact = isDeepStrictEqual(rebuiltV1, proofs.compilerV1) &&
    isDeepStrictEqual(rebuiltV2, proofs.compilerV2) &&
    isDeepStrictEqual(rebuiltContinuity, proofs.continuity);
  const quarryExact = proofs.quarry.complete === true && proofs.quarry.rows.every(({ verified }) => verified === true);
  const positiveGates = Object.entries(gates).every(([key, value]) =>
    ["externalActionExecution", "hostActivationPerformed", "pantheonEnabled"].includes(key) ? value === false :
      ["authorityInventionCount", "unsafeSelectionCount"].includes(key) ? value === 0 : value === true);
  const artifacts = Object.fromEntries(await Promise.all([
    ...Object.entries(RECEIPTS),
    ["routingManifest", "artifacts/routing/manifest.json"],
    ["routingCards", "artifacts/routing/cards.jsonl"],
    ["routingFamilyMap", "artifacts/routing/family-map.json"],
  ].map(async ([name, relativePath]) => [name, await evidence(root, relativePath)])));
  const receipt = {
    schemaVersion: 1,
    id: "eternities-godskills-system-v1",
    status: positiveGates && receiptRebuildsExact && quarryExact ? "certified" : "failed",
    purpose: "rebuildable-cross-system-certification-of-the-current-portable-godskills-layer",
    counts,
    gates,
    reconciliation: {
      quarryExact,
      readOnlyReceiptRebuildsExact: receiptRebuildsExact,
      routingArtifactsExact,
      routingInputCount: manifest.inputs.length,
      allCompletionExternalActionsProhibited: everyFalse(proofs.completion.prohibitedExternalActions),
    },
    artifacts,
    verification: {
      focusedCommand: "node --test tests/godskills-final-certification.test.mjs tests/attested-continuity-certification.test.mjs tests/athena-godskill.test.mjs tests/usage-evolution-certification.test.mjs tests/compiler-generalization-v2-certification.test.mjs",
      fullCommand: "npm test",
    },
    proofLimits: {
      arbitraryLiveLanguage: "not-proven",
      hostActivation: "not-performed",
      hostKeyCustody: "not-proven",
      productionBehavior: "not-proven",
      externalActionExecution: "not-performed",
      semanticEvidence: "deterministic-local-fixtures-and-independent-reviewed-forward-trials",
    },
  };
  if (write) await writeJsonAtomic(path.join(root, "receipts/godskills-system-certification-v1.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const receipt = await buildGodskillsSystemCertification({ root: path.resolve("."), write: true });
  console.log(JSON.stringify({ status: receipt.status, counts: receipt.counts, gates: receipt.gates }, null, 2));
}
