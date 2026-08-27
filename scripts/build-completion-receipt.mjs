import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildFamilyCompletion } from "../src/family-completion.mjs";
import { loadCandidateEvidence } from "../src/refinery-candidates.mjs";

const root = path.resolve(process.argv[2] ?? ".");
const json = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const bytesDigest = async (relativePath) => sha256(await readFile(path.join(root, relativePath)));
const jsonl = async (relativePath) => (await readFile(path.join(root, relativePath), "utf8"))
  .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));

const coverage = await json("artifacts/corpus/coverage-summary.json");
const familyNames = (await readdir(path.join(root, "receipts/families")))
  .filter((name) => name.endsWith(".json"))
  .sort();
const families = await Promise.all(familyNames.map((name) => json(`receipts/families/${name}`)));
const router = await json("receipts/agent-native-router-v6.json");
const [owners, reviews, clusters, recordedCandidates] = await Promise.all([
  jsonl("artifacts/corpus/ownership.jsonl"),
  jsonl("artifacts/corpus/review-evidence.jsonl"),
  jsonl("artifacts/corpus/cluster-evidence.jsonl"),
  jsonl("artifacts/corpus/candidate-evidence.jsonl"),
]);
const synthesisNames = (await readdir(path.join(root, "syntheses"))).filter((name) => name.endsWith(".json")).sort();
const syntheses = await Promise.all(synthesisNames.map((name) => json(`syntheses/${name}`)));
const candidates = await loadCandidateEvidence(path.join(root, "syntheses"), root, clusters, reviews);
const queues = [];
for (const familyId of (await readdir(path.join(root, "artifacts/corpus/owners"))).sort()) {
  queues.push(await json(`artifacts/corpus/owners/${familyId}/queue.json`));
}
const unresolvedCandidateClusters = families
  .flatMap((family) => family.clusters?.candidate ?? [])
  .filter(({ decision }) => !["promoted", "second-order-deferred"].includes(decision)).length;
if (coverage.sourceCount !== 4741 || coverage.evidenceCounts.cardReviewed !== 4741 || coverage.evidenceCounts.clustered !== 4741) {
  throw new Error("full source review and cluster coverage is required");
}
if (families.length !== 21 || unresolvedCandidateClusters !== 0) throw new Error("all family decisions must be terminal");
if (families.some(({ status }) => !["certified", "deferred"].includes(status))) throw new Error("family receipt is not terminal");
if (router.status !== "certified") throw new Error("router v6 is not certified");

const ownerBySource = new Map();
for (const owner of owners) {
  if (ownerBySource.has(owner.sourceId)) throw new Error(`duplicate owner: ${owner.sourceId}`);
  ownerBySource.set(owner.sourceId, owner);
}
const reviewBySource = new Map();
for (const review of reviews) {
  if (reviewBySource.has(review.sourceId)) throw new Error(`duplicate review: ${review.sourceId}`);
  const owner = ownerBySource.get(review.sourceId);
  if (!owner || owner.ownerFamily !== review.familyId) throw new Error(`review ownership mismatch: ${review.sourceId}`);
  reviewBySource.set(review.sourceId, review);
}
const clusteredSources = new Set();
for (const cluster of clusters) for (const member of cluster.members ?? []) {
  if (clusteredSources.has(member.sourceId)) throw new Error(`duplicate cluster source: ${member.sourceId}`);
  const review = reviewBySource.get(member.sourceId);
  if (!review || review.reviewDigest !== member.reviewDigest) throw new Error(`cluster review mismatch: ${member.sourceId}`);
  clusteredSources.add(member.sourceId);
}
if (ownerBySource.size !== 4741 || reviewBySource.size !== 4741 || clusteredSources.size !== 4741) {
  throw new Error("ownership, review, and cluster graph must cover all sources exactly once");
}
if (JSON.stringify(candidates) !== JSON.stringify(recordedCandidates)) throw new Error("candidate ledger does not match strict synthesis evidence");
const rebuiltFamilies = buildFamilyCompletion({
  owners, queues, reviews, clusters, syntheses,
  secondOrderPlan: await json("data/second-order-promotion-plan.v1.json"),
});
if (JSON.stringify(rebuiltFamilies.families) !== JSON.stringify(families)) throw new Error("family receipts do not reconcile with the evidence graph");

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
    pantheonEnablement: false,
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
