import fs from "node:fs/promises";
import path from "node:path";

import {
  buildBehavioralClusterSet,
  buildConservativeOverlapSet,
  normalizeDraftCluster,
} from "../src/wave2-behavioral-cluster-builder.mjs";
import { certifyWave2SemanticClusters } from "../src/wave2-semantic-clusters.mjs";
import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");
const write = process.argv.includes("--write");
const refreshGenerated = process.argv.includes("--refresh-generated");
const CLUSTER_ROOT = path.join(root, "data/wave2-semantic-clusters");
const OVERLAP_ROOT = path.join(root, "data/wave2-overlap-decisions");
const REVIEW_EVIDENCE = path.join(root, "artifacts/wave2-semantic/review-evidence.jsonl");
const INDEX_PATH = path.join(root, "artifacts/wave2-semantic/comparison-index.json");
const TARGET_BY_FAMILY = {
  "agent-orchestration": "eternities-forge",
  "repository-source-research": "eternities-oracle",
  "audio-voice-media": "eternities-orpheus",
  "visual-3d-motion": "eternities-muse",
  general: "sovereign-skill-refinery",
  "debugging-recovery": "eternities-phoenix",
  "automation-mcp-integrations": "eternities-hermes",
  "governance-security": "eternities-aegis",
  "architecture-specification": "eternities-architect",
  "marketing-growth": "eternities-beacon",
  "knowledge-memory-context": "eternities-mnemosyne",
};

const jsonLines = (text) => text.split("\n").filter(Boolean).map(JSON.parse);
const stableDigest = (value) => sha256(JSON.stringify(value));

async function jsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function readJsonSets(directory) {
  return Promise.all((await jsonFiles(directory)).map(async (entry) =>
    JSON.parse(await fs.readFile(path.join(directory, entry.name), "utf8"))));
}

function tokens(value) {
  return new Set(String(value ?? "").toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

function setSimilarity(a, b) {
  let score = 0;
  for (const token of a) if (b.has(token)) score += 1;
  return score;
}

async function promotedContracts() {
  const skillEntries = await fs.readdir(path.join(root, "skills"), { withFileTypes: true });
  const rows = [];
  for (const entry of skillEntries.filter((candidate) => candidate.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const candidates = [
      path.join(root, "skills", entry.name, "references/capability-contract.json"),
      path.join(root, "skills", entry.name, "references/routing-card.json"),
    ];
    for (const file of candidates) {
      try {
        const bytes = await fs.readFile(file);
        rows.push({
          id: entry.name,
          path: path.relative(root, file).replaceAll("\\", "/"),
          digest: sha256(bytes),
        });
        break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
  return rows;
}

async function lunariContracts() {
  const skillEntries = await fs.readdir(path.join(root, "skills"), { withFileTypes: true });
  const rows = [];
  for (const entry of skillEntries.filter((candidate) => candidate.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(root, "skills", entry.name, "references/first-party-contracts.md");
    try {
      const bytes = await fs.readFile(file);
      rows.push({
        id: entry.name,
        path: path.relative(root, file).replaceAll("\\", "/"),
        digest: sha256(bytes),
      });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const reviewedSelection = path.join(root, "data/lunari-first-party-reviewed-selection.v1.json");
  const selectionBytes = await fs.readFile(reviewedSelection);
  rows.push({
    id: "lunari-first-party-reviewed-selection-v1",
    path: path.relative(root, reviewedSelection).replaceAll("\\", "/"),
    digest: sha256(selectionBytes),
  });
  return rows;
}

const reviews = jsonLines(await fs.readFile(REVIEW_EVIDENCE, "utf8"));
const reviewByFacet = new Map(reviews.map((review) => [review.facetId, review]));
const existingClusterSets = (await readJsonSets(CLUSTER_ROOT))
  .filter((set) => !(refreshGenerated && Object.hasOwn(TARGET_BY_FAMILY, set.familyId)));
const existingFamilies = new Set(existingClusterSets.map((set) => set.familyId));
const generatedClusterSets = [];
for (const familyId of Object.keys(TARGET_BY_FAMILY).sort()) {
  if (existingFamilies.has(familyId)) continue;
  generatedClusterSets.push(buildBehavioralClusterSet(
    familyId,
    reviews.filter((review) => review.familyId === familyId),
  ));
}
const allClusterSets = [...existingClusterSets, ...generatedClusterSets]
  .sort((left, right) => left.familyId.localeCompare(right.familyId));
const normalizedClusters = allClusterSets.flatMap((set) =>
  set.clusters.map((cluster) => normalizeDraftCluster(set, cluster)));

const contracts = await promotedContracts();
const targetContracts = Object.fromEntries(contracts.map((entry) => [entry.id, entry]));
const originalClusters = jsonLines(
  await fs.readFile(path.join(root, "artifacts/corpus/cluster-evidence.jsonl"), "utf8"),
).map((cluster) => ({
  id: cluster.id,
  familyId: cluster.familyId,
  intent: cluster.intent,
  digest: cluster.clusterDigest,
})).sort((left, right) => `${left.familyId}:${left.id}`.localeCompare(`${right.familyId}:${right.id}`));
const lunari = await lunariContracts();
const wave2 = normalizedClusters.map((cluster) => ({
  id: cluster.id,
  familyId: cluster.familyId,
  intent: cluster.intent,
  digest: cluster.clusterDigest,
})).sort((left, right) => `${left.familyId}:${left.id}`.localeCompare(`${right.familyId}:${right.id}`));

const closestLegacyByFamily = {};
const originalTokenSets = new Map(originalClusters.map((cluster) => [cluster.id, tokens(`${cluster.intent} ${cluster.id}`)]));
for (const familyId of new Set(reviews.map((review) => review.familyId))) {
  const familyReviews = reviews.filter((review) => review.familyId === familyId);
  const query = tokens(familyReviews.flatMap((review) => [review.neutralCapabilitySummary, ...review.operations]).join(" "));
  const best = [...originalClusters].sort((left, right) =>
    setSimilarity(query, originalTokenSets.get(right.id)) - setSimilarity(query, originalTokenSets.get(left.id)) || left.id.localeCompare(right.id))[0];
  if (best) closestLegacyByFamily[familyId] = { id: best.id, digest: best.digest };
}
const closestWave2ByCluster = {};
const wave2TokenSets = new Map(normalizedClusters.map((cluster) => [
  `${cluster.familyId}::${cluster.id}`,
  tokens(cluster.intent),
]));
for (const cluster of normalizedClusters) {
  const clusterKey = `${cluster.familyId}::${cluster.id}`;
  const query = wave2TokenSets.get(clusterKey);
  const alternatives = normalizedClusters.filter((candidate) =>
    candidate.familyId === cluster.familyId && candidate.id !== cluster.id);
  const best = alternatives.sort((left, right) =>
    setSimilarity(query, wave2TokenSets.get(`${right.familyId}::${right.id}`)) -
      setSimilarity(query, wave2TokenSets.get(`${left.familyId}::${left.id}`)) || left.id.localeCompare(right.id))[0];
  if (best) closestWave2ByCluster[clusterKey] = {
    id: `${best.familyId}::${best.id}`,
    digest: best.clusterDigest,
  };
}

const comparisonIndex = {
  schemaVersion: 1,
  indexId: "wave2-comparison-index-v1",
  promotedContracts: contracts,
  originalCorpusClusters: originalClusters,
  lunariContracts: lunari,
  wave2Clusters: wave2,
  sectionDigests: {
    promotedContracts: stableDigest(contracts),
    originalCorpusClusters: stableDigest(originalClusters),
    lunariContracts: stableDigest(lunari),
    wave2Clusters: stableDigest(wave2),
  },
  targetContracts,
  closestLegacyByFamily,
  closestWave2ByCluster,
};
comparisonIndex.indexDigest = stableDigest({
  indexId: comparisonIndex.indexId,
  sectionDigests: comparisonIndex.sectionDigests,
});

const generatedOverlapSets = generatedClusterSets.map((set) => buildConservativeOverlapSet(
  set.familyId,
  normalizedClusters.filter((cluster) => cluster.familyId === set.familyId),
  comparisonIndex,
  TARGET_BY_FAMILY[set.familyId],
  reviewByFacet,
));
const existingOverlapSets = (await readJsonSets(OVERLAP_ROOT))
  .filter((set) => !(refreshGenerated && Object.hasOwn(TARGET_BY_FAMILY, set.familyId)));
const allOverlapDecisions = [...existingOverlapSets, ...generatedOverlapSets].flatMap((set) => set.decisions);
const certified = certifyWave2SemanticClusters({
  reviews,
  clusterSets: allClusterSets,
  overlapDecisions: allOverlapDecisions,
});

if (certified.coverage.reviewCount !== 3448 || certified.coverage.clusteredReviewCount !== 3448) {
  throw new Error("generated behavioral cluster coverage is incomplete");
}
if (certified.coverage.candidateClusterCount !== certified.coverage.overlapDecisionCount) {
  throw new Error("generated overlap coverage is incomplete");
}

if (write) {
  for (const set of generatedClusterSets) {
    await fs.writeFile(path.join(CLUSTER_ROOT, `${set.familyId}.json`), `${JSON.stringify(set, null, 2)}\n`);
  }
  for (const set of generatedOverlapSets) {
    await fs.writeFile(path.join(OVERLAP_ROOT, `${set.familyId}.json`), `${JSON.stringify(set, null, 2)}\n`);
  }
  await fs.writeFile(INDEX_PATH, `${JSON.stringify(comparisonIndex, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify({
  output: path.relative(root, INDEX_PATH).replaceAll("\\", "/"),
  generatedFamilies: generatedClusterSets.map((set) => set.familyId),
  comparisonCounts: {
    promotedContracts: contracts.length,
    originalCorpusClusters: originalClusters.length,
    lunariContracts: lunari.length,
    wave2Clusters: wave2.length,
  },
  coverage: certified.coverage,
}, null, 2)}\n`);
