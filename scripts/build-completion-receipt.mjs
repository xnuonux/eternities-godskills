import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

const root = path.resolve(process.argv[2] ?? ".");
const json = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const bytesDigest = async (relativePath) => sha256(await readFile(path.join(root, relativePath)));

const coverage = await json("artifacts/corpus/coverage-summary.json");
const familyNames = (await readdir(path.join(root, "receipts/families")))
  .filter((name) => name.endsWith(".json"))
  .sort();
const families = await Promise.all(familyNames.map((name) => json(`receipts/families/${name}`)));
const router = await json("receipts/agent-native-router-v6.json");
const unresolvedCandidateClusters = families
  .flatMap((family) => family.clusters?.candidate ?? [])
  .filter(({ decision }) => !["promoted", "second-order-deferred"].includes(decision)).length;
if (coverage.sourceCount !== 4741 || coverage.evidenceCounts.cardReviewed !== 4741 || coverage.evidenceCounts.clustered !== 4741) {
  throw new Error("full source review and cluster coverage is required");
}
if (families.length !== 21 || unresolvedCandidateClusters !== 0) throw new Error("all family decisions must be terminal");
if (families.some(({ status }) => !["certified", "deferred"].includes(status))) throw new Error("family receipt is not terminal");
if (router.status !== "certified") throw new Error("router v6 is not certified");

const receipt = {
  schemaVersion: 1,
  id: "eternities-godskills-full-corpus-v1",
  status: "certified",
  counts: {
    sources: coverage.sourceCount,
    reviewed: coverage.evidenceCounts.cardReviewed,
    clustered: coverage.evidenceCounts.clustered,
    synthesizedSources: coverage.evidenceCounts.synthesized,
    evaluatedSources: coverage.evidenceCounts.evaluated,
    promotedSources: coverage.evidenceCounts.promoted,
    familyReceipts: families.length,
    promotedCapabilities: router.counts.cardCount,
    unresolvedCandidateClusters,
  },
  artifacts: {
    ownershipSha256: await bytesDigest("artifacts/corpus/ownership.jsonl"),
    reviewsSha256: await bytesDigest("artifacts/corpus/review-evidence.jsonl"),
    clustersSha256: await bytesDigest("artifacts/corpus/cluster-evidence.jsonl"),
    candidatesSha256: await bytesDigest("artifacts/corpus/candidate-evidence.jsonl"),
    coverageSha256: await bytesDigest("artifacts/corpus/coverage-summary.json"),
    secondOrderPlanSha256: await bytesDigest("data/second-order-promotion-plan.v1.json"),
    routerReceiptSha256: await bytesDigest("receipts/agent-native-router-v6.json"),
  },
  terminalFamilyStatuses: Object.fromEntries(families.map(({ familyId, status }) => [familyId, status])),
  prohibitedExternalActions: {
    accountMutation: false,
    activation: false,
    deployment: false,
    outreach: false,
    profileMutation: false,
    publication: false,
    push: false,
    spending: false,
  },
  proofLimits: {
    deterministicLocalArtifacts: "certified",
    liveAgentBehavior: "not-proven",
    legalOrRegulatoryConformance: "not-proven",
    productionBehavior: "not-proven",
    providerAvailability: "not-proven",
  },
};

await writeJsonAtomic(path.join(root, "receipts/eternities-godskills-completion.json"), receipt);
console.log(JSON.stringify(receipt.counts, null, 2));
