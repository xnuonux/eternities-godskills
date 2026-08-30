import { readFile } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "./io.mjs";

const ALLOWED_OPTIONS = new Set(["query", "family", "limit"]);

function terms(value) {
  return new Set(String(value ?? "").normalize("NFKC").toLowerCase().match(/[a-z0-9]+/g)?.map((term) => term.length > 3 && term.endsWith("s") ? term.slice(0, -1) : term) ?? []);
}

function overlap(query, value) {
  const haystack = terms(value);
  let count = 0;
  for (const term of query) if (haystack.has(term)) count += 1;
  return count;
}

async function loadBoundAtlas(root, receiptPath, { requireTerminalCoverage = false } = {}) {
  const receipt = JSON.parse(await readFile(path.join(root, receiptPath), "utf8"));
  if (receipt.status !== "certified") throw new Error("quarry atlas receipt is not certified");
  if (requireTerminalCoverage && receipt.counts?.unresolvedSourceCount !== 0) {
    throw new Error("quarry atlas terminal coverage is incomplete");
  }
  const binding = receipt.outputs?.facets;
  if (!binding?.path || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")) throw new Error("quarry atlas receipt lacks facet binding");
  const bytes = await readFile(path.join(root, binding.path));
  if (bytes.length !== binding.bytes || sha256(bytes) !== binding.sha256) throw new Error("quarry atlas facet digest mismatch");
  const facets = bytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  for (const facet of facets) {
    if (facet.evidenceMode !== "inert-pattern-reference" || facet.security?.sourceExecutionAuthorized !== false) {
      throw new Error(`quarry atlas contains activation-capable facet: ${facet.id}`);
    }
  }
  return { receipt, facets };
}

export async function loadVerifiedAtlas(root = path.resolve("."), { version = "v2" } = {}) {
  if (version !== "v1" && version !== "v2") throw new Error(`unsupported quarry atlas version: ${version}`);
  return loadBoundAtlas(root, `receipts/quarry-total-infusion-${version}.json`, {
    requireTerminalCoverage: version === "v2",
  });
}

export async function loadQuarryAtlas(root = path.resolve(".")) {
  return loadVerifiedAtlas(root, { version: "v1" });
}

export function searchQuarryAtlas(atlas, options = {}) {
  for (const key of Object.keys(options)) if (!ALLOWED_OPTIONS.has(key)) throw new Error(`unknown option: ${key}`);
  const { query, family, limit = 5 } = options;
  if (typeof query !== "string" || query.trim() === "") throw new Error("query must be a non-empty string");
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new Error("limit must be between 1 and 5");
  if (family !== undefined && (typeof family !== "string" || family === "")) throw new Error("family must be a non-empty string");
  const queryTerms = terms(query);
  return atlas.facets
    .filter((facet) => family === undefined || facet.familyIds.includes(family))
    .map((facet) => ({
      facet,
      score:
        overlap(queryTerms, facet.name) * 5 +
        overlap(queryTerms, facet.summary) * 3 +
        overlap(queryTerms, facet.headings?.join(" ")) * 2 +
        overlap(queryTerms, facet.familyIds?.join(" ")),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.facet.id.localeCompare(right.facet.id))
    .slice(0, limit)
    .map(({ facet, score }) => ({
      id: facet.id,
      bodySha256: facet.bodySha256,
      familyIds: facet.familyIds,
      primaryFamily: facet.primaryFamily,
      targetSkillId: facet.targetSkillId,
      score,
      untrustedMetadata: {
        trust: "untrusted-inert-source-metadata",
        name: facet.name,
        summary: facet.summary,
        headings: facet.headings,
      },
      provenance: {
        canonicalSourceId: facet.canonicalSourceId,
        repository: facet.repository,
        sourcePath: facet.sourcePath,
        licenseSignals: facet.licenseSignals,
      },
      risk: {
        dispositions: facet.security.dispositions,
        requiredReviews: facet.security.requiredReviews,
        surfaces: facet.security.surfaces,
        ruleIds: facet.security.ruleIds,
        semanticReviewComplete: facet.security.semanticReviewComplete,
        sourceExecutionAuthorized: facet.security.sourceExecutionAuthorized,
      },
    }));
}

export async function loadWave2SemanticAtlas(root = path.resolve(".")) {
  const [coverageBytes, clusterBytes, overlapBytes, synthesisBytes, evaluationBytes] = await Promise.all([
    readFile(path.join(root, "artifacts/wave2-semantic/cluster-coverage.json")),
    readFile(path.join(root, "artifacts/wave2-semantic/cluster-evidence.jsonl")),
    readFile(path.join(root, "artifacts/wave2-semantic/overlap-evidence.jsonl")),
    readFile(path.join(root, "artifacts/wave2-semantic/synthesis-evidence.json")),
    readFile(path.join(root, "artifacts/wave2-semantic/synthesis-evaluations.jsonl")),
  ]);
  const coverage = JSON.parse(coverageBytes);
  const synthesis = JSON.parse(synthesisBytes);
  if (
    coverage.reviewCount !== 3448 ||
    coverage.clusteredReviewCount !== 3448 ||
    coverage.unresolvedReviewCount !== 0 ||
    coverage.candidateClusterCount !== coverage.overlapDecisionCount
  ) throw new Error("Wave 2 semantic atlas coverage is incomplete");
  if (sha256(clusterBytes) !== coverage.clusterEvidenceSha256) {
    throw new Error("Wave 2 semantic cluster digest mismatch");
  }
  if (sha256(overlapBytes) !== coverage.overlapEvidenceSha256) {
    throw new Error("Wave 2 semantic overlap digest mismatch");
  }
  if (
    synthesis.candidateClusterCount !== coverage.candidateClusterCount ||
    synthesis.terminalActionCount !== coverage.candidateClusterCount ||
    synthesis.unresolvedCandidateCount !== 0 ||
    synthesis.artifacts?.evaluations?.sha256 !== sha256(evaluationBytes)
  ) throw new Error("Wave 2 semantic synthesis evidence is stale or incomplete");
  const clusters = clusterBytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const overlaps = overlapBytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const evaluations = evaluationBytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  return {
    certificate: {
      digest: sha256(Buffer.concat([coverageBytes, clusterBytes, overlapBytes, synthesisBytes, evaluationBytes])),
      stale: false,
      reviewedFacetCount: coverage.reviewCount,
      clusterCount: coverage.clusterCount,
      candidateClusterCount: coverage.candidateClusterCount,
    },
    clusters,
    overlapByCluster: new Map(overlaps.map((row) => [`${row.familyId}::${row.clusterId}`, row])),
    evaluationByCluster: new Map(evaluations.map((row) => [row.id, row])),
  };
}

export function searchWave2SemanticAtlas(atlas, options = {}) {
  for (const key of Object.keys(options)) if (!ALLOWED_OPTIONS.has(key)) throw new Error(`unknown option: ${key}`);
  const { query, family, limit = 5 } = options;
  if (typeof query !== "string" || query.trim() === "") throw new Error("query must be a non-empty string");
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new Error("limit must be between 1 and 5");
  if (family !== undefined && (typeof family !== "string" || family === "")) {
    throw new Error("family must be a non-empty string");
  }
  if (atlas?.certificate?.stale !== false || !/^[a-f0-9]{64}$/.test(atlas?.certificate?.digest ?? "")) {
    throw new Error("Wave 2 semantic atlas certification is stale");
  }
  const queryTerms = terms(query);
  return atlas.clusters
    .filter((cluster) => cluster.synthesisDecision !== "rejected")
    .filter((cluster) => family === undefined || cluster.familyId === family)
    .map((cluster) => ({
      cluster,
      score:
        overlap(queryTerms, cluster.id) * 5 +
        overlap(queryTerms, cluster.intent) * 4 +
        overlap(queryTerms, cluster.familyId) * 2,
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score ||
      `${left.cluster.familyId}:${left.cluster.id}`.localeCompare(`${right.cluster.familyId}:${right.cluster.id}`))
    .slice(0, limit)
    .map(({ cluster, score }) => {
      const key = `${cluster.familyId}::${cluster.id}`;
      const adjudication = atlas.overlapByCluster.get(key) ?? null;
      const evaluation = atlas.evaluationByCluster.get(key) ?? null;
      return {
        id: key,
        familyId: cluster.familyId,
        intent: cluster.intent,
        relationship: cluster.relationship,
        synthesisDecision: cluster.synthesisDecision,
        clusterDigest: cluster.clusterDigest,
        memberCount: cluster.members.length,
        score,
        targetSkillId: adjudication?.targetSkillId ?? null,
        overlapDisposition: adjudication?.disposition ?? null,
        evaluationStatus: evaluation?.status ?? null,
        trust: "certified-reviewed-cluster-metadata",
        sourceBodiesTransported: 0,
        sourceExecutionAuthorized: false,
      };
    });
}
