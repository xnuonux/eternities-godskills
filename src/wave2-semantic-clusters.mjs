import { sha256 } from "./io.mjs";

const RELATIONSHIPS = new Set([
  "exact-duplicate",
  "behavioral-equivalent",
  "specialized-alternative",
  "ordered-composition",
  "incompatible",
  "boundary",
]);
const SYNTHESIS_DECISIONS = new Set(["candidate", "deferred", "rejected"]);
const MEMBER_ROLES = new Set(["canonical", "variant", "boundary", "component"]);
const OVERLAP_DISPOSITIONS = new Set([
  "covered-stronger",
  "extend-existing",
  "new-operational-skill",
  "new-godskill",
  "ultragodskill-candidate",
  "deferred",
  "rejected",
]);
const COMPARISON_KINDS = new Set(["godskill", "legacy-cluster", "wave2-cluster", "lunari-contract"]);
const INTENDED_TIERS = new Set([
  "sovereign-atom",
  "operational-skill",
  "godskill-extension",
  "godskill",
  "ultragodskill",
  "none",
]);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
}

function digest(value, field) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${field} must be a SHA-256 digest`);
}

function uniqueMap(rows, keyFor, label) {
  const map = new Map();
  for (const row of rows ?? []) {
    const key = keyFor(row);
    nonEmptyString(key, `${label} key`);
    if (map.has(key)) throw new Error(`duplicate ${label}: ${key}`);
    map.set(key, row);
  }
  return map;
}

function clusterKey(familyId, clusterId) {
  return `${familyId}::${clusterId}`;
}

export function certifyWave2SemanticClusters({ reviews, clusterSets, overlapDecisions }) {
  const reviewByFacet = uniqueMap(reviews, (row) => row.facetId, "semantic review");
  const membership = new Map();
  const clusterByKey = new Map();
  const clusters = [];

  for (const set of clusterSets ?? []) {
    if (!set || set.schemaVersion !== 1) throw new Error("cluster set schemaVersion must be 1");
    for (const field of ["clusterSetId", "familyId"]) nonEmptyString(set[field], `clusterSet.${field}`);
    if (!Array.isArray(set.clusters) || set.clusters.length === 0) throw new Error("clusterSet.clusters must not be empty");

    for (const row of set.clusters) {
      for (const field of ["id", "intent", "rationale"]) nonEmptyString(row[field], `cluster.${field}`);
      if (!RELATIONSHIPS.has(row.relationship)) throw new Error(`unsupported cluster relationship: ${row.relationship}`);
      if (!SYNTHESIS_DECISIONS.has(row.synthesisDecision)) throw new Error(`unsupported synthesis decision: ${row.synthesisDecision}`);
      if (!Array.isArray(row.members) || row.members.length === 0) throw new Error("cluster.members must not be empty");
      const key = clusterKey(set.familyId, row.id);
      if (clusterByKey.has(key)) throw new Error(`duplicate semantic cluster: ${row.id}`);

      const members = [];
      for (const member of row.members) {
        nonEmptyString(member.facetId, "cluster member facetId");
        const review = reviewByFacet.get(member.facetId);
        if (!review) throw new Error(`unknown clustered review: ${member.facetId}`);
        if (review.familyId !== set.familyId) throw new Error(`cluster family drift: ${member.facetId}`);
        if (member.reviewDigest !== review.reviewDigest) throw new Error(`stale cluster review digest: ${member.facetId}`);
        if (!MEMBER_ROLES.has(member.role)) throw new Error(`unsupported cluster member role: ${member.role}`);
        if (membership.has(member.facetId)) throw new Error(`duplicate cluster membership: ${member.facetId}`);
        membership.set(member.facetId, key);
        members.push({ facetId: member.facetId, reviewDigest: member.reviewDigest, role: member.role });
      }
      members.sort((left, right) => left.facetId.localeCompare(right.facetId));
      const normalized = {
        schemaVersion: 1,
        clusterSetId: set.clusterSetId,
        familyId: set.familyId,
        id: row.id,
        intent: row.intent.trim(),
        relationship: row.relationship,
        synthesisDecision: row.synthesisDecision,
        rationale: row.rationale.trim(),
        members,
      };
      normalized.clusterDigest = sha256(JSON.stringify(normalized));
      clusterByKey.set(key, normalized);
      clusters.push(normalized);
    }
  }

  const missing = [...reviewByFacet.keys()].filter((facetId) => !membership.has(facetId)).sort();
  if (missing.length) throw new Error(`missing cluster membership: ${missing.join(", ")}`);
  const candidateKeys = new Set(
    [...clusterByKey].filter(([, row]) => row.synthesisDecision === "candidate").map(([key]) => key),
  );

  const overlapByKey = new Map();
  const overlaps = [];
  for (const row of overlapDecisions ?? []) {
    if (!row || row.schemaVersion !== 1) throw new Error("overlap decision schemaVersion must be 1");
    for (const field of ["familyId", "clusterId", "targetSkillId", "mechanismComparison", "rationale"]) {
      nonEmptyString(row[field], `overlap.${field}`);
    }
    const key = clusterKey(row.familyId, row.clusterId);
    if (overlapByKey.has(key)) throw new Error(`duplicate overlap decision: ${row.clusterId}`);
    if (!candidateKeys.has(key)) throw new Error(`overlap decision targets non-candidate cluster: ${row.clusterId}`);
    if (!OVERLAP_DISPOSITIONS.has(row.disposition)) throw new Error(`unsupported overlap disposition: ${row.disposition}`);
    if (!INTENDED_TIERS.has(row.intendedTier)) throw new Error(`unsupported intended tier: ${row.intendedTier}`);
    if (!Array.isArray(row.comparedAgainst) || row.comparedAgainst.length === 0) {
      throw new Error("overlap.comparedAgainst must not be empty");
    }
    const comparedAgainst = row.comparedAgainst.map((entry) => {
      if (!COMPARISON_KINDS.has(entry.kind)) throw new Error(`unsupported comparison kind: ${entry.kind}`);
      nonEmptyString(entry.id, "overlap comparison id");
      digest(entry.digest, "overlap comparison digest");
      return { kind: entry.kind, id: entry.id, digest: entry.digest };
    }).sort((left, right) => `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`));
    const cluster = clusterByKey.get(key);
    const normalized = {
      schemaVersion: 1,
      familyId: row.familyId,
      clusterId: row.clusterId,
      clusterDigest: cluster.clusterDigest,
      targetSkillId: row.targetSkillId,
      disposition: row.disposition,
      comparedAgainst,
      mechanismComparison: row.mechanismComparison.trim(),
      rationale: row.rationale.trim(),
      intendedTier: row.intendedTier,
    };
    normalized.overlapDigest = sha256(JSON.stringify(normalized));
    overlapByKey.set(key, normalized);
    overlaps.push(normalized);
  }

  const missingOverlap = [...candidateKeys].filter((key) => !overlapByKey.has(key)).sort();
  if (missingOverlap.length) {
    throw new Error(`missing overlap decision: ${missingOverlap.map((key) => clusterByKey.get(key).id).join(", ")}`);
  }
  clusters.sort((left, right) => `${left.familyId}:${left.id}`.localeCompare(`${right.familyId}:${right.id}`));
  overlaps.sort((left, right) => `${left.familyId}:${left.clusterId}`.localeCompare(`${right.familyId}:${right.clusterId}`));
  return {
    clusters,
    overlaps,
    coverage: {
      schemaVersion: 1,
      reviewCount: reviewByFacet.size,
      clusteredReviewCount: membership.size,
      clusterCount: clusters.length,
      candidateClusterCount: candidateKeys.size,
      overlapDecisionCount: overlaps.length,
      unresolvedReviewCount: reviewByFacet.size - membership.size,
    },
  };
}
