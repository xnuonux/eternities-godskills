import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { buildAttestedContinuityReceipt } from "./build-attested-continuity-receipt.mjs";
import { buildAthena } from "./build-athena-receipt.mjs";
import { buildCompilerGeneralizationV2Receipt } from "./build-compiler-generalization-v2-receipt.mjs";
import { buildIntentCompilerReceipt } from "./build-intent-compiler-receipt.mjs";
import { buildUsageEvolutionEvidence } from "./build-usage-evolution-evaluation.mjs";
import { canonicalText, sha256, writeJsonAtomic } from "../src/io.mjs";

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
  quarryAudit: "receipts/github-skill-quarry-wave-2-audit.json",
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

function everyTrue(value) {
  return Object.values(value).every((entry) => entry === true);
}

function exactBooleanGateProfile(value, falseKeys = []) {
  const expectedFalse = new Set(falseKeys);
  return Object.entries(value).every(([key, entry]) => entry === !expectedFalse.has(key));
}

async function exactDigest(root, relativePath, expected) {
  const bytes = await readFile(path.join(root, relativePath));
  if (sha256(bytes) === expected) return true;
  return sha256(canonicalText(bytes.toString("utf8"))) === expected;
}

function collectPathDigests(value, found = []) {
  if (!value || typeof value !== "object") return found;
  if (typeof value.path === "string" && /^[a-f0-9]{64}$/.test(value.sha256 ?? "")) {
    found.push({ path: value.path, sha256: value.sha256 });
  }
  for (const child of Object.values(value)) collectPathDigests(child, found);
  return found;
}

export async function verifyBoundArtifacts(root, ...documents) {
  const bindings = documents.flatMap((document) => collectPathDigests(document));
  const unique = [...new Map(bindings.map((binding) => [`${binding.path}\0${binding.sha256}`, binding])).values()];
  const results = await Promise.all(unique.map(async (binding) => ({
    ...binding,
    exact: await exactDigest(root, binding.path, binding.sha256).catch(() => false),
  })));
  return { count: results.length, exact: results.every(({ exact }) => exact), results };
}

async function verifyCompletion(root, receipt, router) {
  const files = {
    ownershipSha256: "artifacts/corpus/ownership.jsonl",
    reviewsSha256: "artifacts/corpus/review-evidence.jsonl",
    clustersSha256: "artifacts/corpus/cluster-evidence.jsonl",
    candidatesSha256: "artifacts/corpus/candidate-evidence.jsonl",
    coverageSha256: "artifacts/corpus/coverage-summary.json",
    secondOrderPlanSha256: "data/second-order-promotion-plan.v1.json",
    routerReceiptSha256: RECEIPTS.router,
  };
  const exact = (await Promise.all(Object.entries(files).map(([key, relativePath]) =>
    exactDigest(root, relativePath, receipt.artifacts[key]).catch(() => false)))).every(Boolean);
  const coverage = await json(root, files.coverageSha256);
  const jsonl = async (relativePath) => (await readFile(path.join(root, relativePath), "utf8")).split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const [owners, reviews, clusters, candidates, familyNames] = await Promise.all([
    jsonl(files.ownershipSha256), jsonl(files.reviewsSha256), jsonl(files.clustersSha256),
    jsonl(files.candidatesSha256), readdir(path.join(root, "receipts/families")),
  ]);
  const families = await Promise.all(familyNames.filter((name) => name.endsWith(".json")).map((name) => json(root, `receipts/families/${name}`)));
  const clusteredSources = new Set(clusters.flatMap(({ members = [] }) => members.map(({ sourceId }) => sourceId))).size;
  const promotedSources = new Set(candidates.filter(({ promoted }) => promoted).flatMap(({ sourceIds = [] }) => sourceIds)).size;
  const countsExact = receipt.counts.sources === coverage.sourceCount && receipt.counts.reviewed === reviews.length &&
    receipt.counts.clustered === clusteredSources && owners.length === coverage.sourceCount && promotedSources === coverage.evidenceCounts.promoted &&
    receipt.counts.promotedSources === coverage.evidenceCounts.promoted && receipt.counts.familyReceipts === families.length;
  const familiesTerminal = families.every((family) => ["certified", "deferred"].includes(family.status) && everyFalse(family.gates));
  return exact && countsExact && familiesTerminal && receipt.status === "certified" && router.status === "certified" && everyFalse(receipt.prohibitedExternalActions);
}

export function certificationStatus({ gates, reconciliation }) {
  const positiveGates = Object.entries(gates).every(([key, value]) =>
    ["externalActionExecution", "hostActivationPerformed", "pantheonEnabled"].includes(key) ? value === false :
      ["authorityInventionCount", "unsafeSelectionCount"].includes(key) ? value === 0 : value === true);
  return positiveGates && Object.values(reconciliation).every((value) => typeof value === "number" ? value > 0 : value === true)
    ? "certified" : "failed";
}

export async function buildGodskillsSystemCertification({ root = path.resolve("."), write = true } = {}) {
  const entries = await Promise.all(Object.entries(RECEIPTS).map(async ([name, relativePath]) => [name, await json(root, relativePath)]));
  const proofs = Object.fromEntries(entries);
  const [manifest, cardsText, familyMapText, routingManifestText, aegisSynthesis, athenaSynthesis, usageCertification] = await Promise.all([
    json(root, "artifacts/routing/manifest.json"),
    readFile(path.join(root, "artifacts/routing/cards.jsonl"), "utf8"),
    readFile(path.join(root, "artifacts/routing/family-map.json"), "utf8"),
    readFile(path.join(root, "artifacts/routing/manifest.json"), "utf8"),
    json(root, "syntheses/eternities-aegis.v3.json"),
    json(root, "artifacts/athena/synthesis.v1.json"),
    json(root, "artifacts/usage-evolution/certification.json"),
  ]);
  const cards = cardsText.trim().split(/\r?\n/).map(JSON.parse);
  const exactInputs = await Promise.all(manifest.inputs.map(async ({ id, path: cardPath, sha256: expected }) => {
    const actual = sha256(await readFile(path.join(root, "skills", cardPath)));
    return id === path.basename(path.dirname(path.dirname(cardPath))) && actual === expected;
  }));
  const [rebuiltV1, rebuiltV2, rebuiltContinuity, rebuiltUsage, rebuiltAthena] = await Promise.all([
    buildIntentCompilerReceipt({ root, write: false }),
    buildCompilerGeneralizationV2Receipt({ root, write: false }),
    buildAttestedContinuityReceipt({ root, write: false }),
    buildUsageEvolutionEvidence(root),
    buildAthena(root, { write: false }),
  ]);
  const boundArtifacts = await verifyBoundArtifacts(root, proofs.usageEvolution, proofs.athena, proofs.continuity, aegisSynthesis);
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
    supplyChainGatePromoted: proofs.supplyChain.decision.status === "promoted" && aegisSynthesis.status === "promoted",
    usageEvolutionPromotedButNotAdopted: proofs.usageEvolution.decision.status === "promoted" && proofs.usageEvolution.evolutionDecision.status === "eligible" && proofs.usageEvolution.evolutionDecision.adopted === false && proofs.usageEvolution.evolutionDecision.requiresExplicitAdoption === true,
    athenaPromoted: proofs.athena.decision.status === "promoted" && proofs.athena.candidate.criticalPassed === proofs.athena.candidate.criticalTotal,
    attestedContinuityCertified: proofs.continuity.status === "certified" && exactBooleanGateProfile(proofs.continuity.gates, ["perToolPromptInjectionInstalled", "slashCommandRequired", "hostActivationPerformed"]),
    externalActionExecution: [proofs.supplyChain.evidence.externalMutation, proofs.athena.evidence.externalMutation].some(Boolean),
    hostActivationPerformed: [proofs.supplyChain.evidence.hostActivation, proofs.usageEvolution.activation.hostActivation, proofs.continuity.gates.hostActivationPerformed].some(Boolean),
    pantheonEnabled: proofs.completion.prohibitedExternalActions.pantheonEnablement,
  };
  const receiptRebuildsExact = isDeepStrictEqual(rebuiltV1, proofs.compilerV1) &&
    isDeepStrictEqual(rebuiltV2, proofs.compilerV2) &&
    isDeepStrictEqual(rebuiltContinuity, proofs.continuity) &&
    isDeepStrictEqual(rebuiltUsage.receipt, proofs.usageEvolution) &&
    isDeepStrictEqual(rebuiltUsage.certification, usageCertification) &&
    isDeepStrictEqual(rebuiltAthena.receipt, proofs.athena) &&
    isDeepStrictEqual(rebuiltAthena.synthesis, athenaSynthesis);
  const quarryExact = proofs.quarry.complete === true && proofs.quarry.rows.every(({ verified }) => verified === true) &&
    proofs.quarryAudit.status === "verified" && proofs.quarryAudit.receiptSha256 === sha256(await readFile(path.join(root, RECEIPTS.quarry))) &&
    proofs.quarryAudit.manifestSha256 === proofs.quarry.manifestSha256 &&
    proofs.quarryAudit.repositoryFileManifestsSha256 === proofs.quarry.repositoryFileManifests.sha256;
  const completionExact = await verifyCompletion(root, proofs.completion, proofs.router);
  const routerExact = proofs.router.status === "certified" && everyTrue(proofs.router.gates) && proofs.router.proofLimits.globalRuntimeActivation === "not-performed";
  const artifacts = Object.fromEntries(await Promise.all([
    ...Object.entries(RECEIPTS),
    ["routingManifest", "artifacts/routing/manifest.json"],
    ["routingCards", "artifacts/routing/cards.jsonl"],
    ["routingFamilyMap", "artifacts/routing/family-map.json"],
  ].map(async ([name, relativePath]) => [name, await evidence(root, relativePath)])));
  const receipt = {
    schemaVersion: 1,
    id: "eternities-godskills-system-v1",
    status: "pending",
    purpose: "rebuildable-cross-system-certification-of-the-current-portable-godskills-layer",
    counts,
    gates,
    reconciliation: {
      quarryExact,
      completionExact,
      routerExact,
      allBoundArtifactsExact: boundArtifacts.exact,
      boundArtifactCount: boundArtifacts.count,
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
      semanticEvidence: "deterministic-local-fixtures; independent-review-artifact-is-outside-this-certificate-and-not-proven-here",
    },
  };
  receipt.status = certificationStatus(receipt);
  if (write) await writeJsonAtomic(path.join(root, "receipts/godskills-system-certification-v1.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const receipt = await buildGodskillsSystemCertification({ root: path.resolve("."), write: true });
  console.log(JSON.stringify({ status: receipt.status, counts: receipt.counts, gates: receipt.gates }, null, 2));
}
