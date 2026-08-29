import { sha256 } from "./io.mjs";

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96) || "reviewed-capability";
}

function roleFor(review, index, decision) {
  if (decision !== "candidate") return "boundary";
  if (review.disposition === "independent-implementation") return index === 0 ? "canonical" : "variant";
  return "component";
}

function effectsFor(reviews) {
  return [...new Set(reviews.flatMap((review) => review.effects ?? []))].sort();
}

function clusterRow(baseId, reviews, synthesisDecision, suffix = "") {
  const sorted = [...reviews].sort((left, right) => {
    const priority = (value) => value.disposition === "independent-implementation" ? 0 : 1;
    return priority(left) - priority(right) || left.facetId.localeCompare(right.facetId);
  });
  const effects = effectsFor(sorted);
  const independentCount = sorted.filter((review) => review.disposition === "independent-implementation").length;
  const patternCount = sorted.filter((review) => review.disposition === "pattern-reference").length;
  const id = `${baseId}${suffix}`;
  return {
    id,
    intent: synthesisDecision === "candidate"
      ? `Apply the reviewed ${baseId.replaceAll("-", " ")} mechanism with explicit ${effects.join(", ")} effects and observable acceptance evidence.`
      : synthesisDecision === "deferred"
        ? `Retain ${baseId.replaceAll("-", " ")} as cold boundary evidence until its authority, coupling, and verification conditions are resolved.`
        : `Exclude ${baseId.replaceAll("-", " ")} from capability synthesis while retaining its exact rejection evidence.`,
    relationship: synthesisDecision === "candidate" ? "ordered-composition" : "boundary",
    synthesisDecision,
    rationale: synthesisDecision === "candidate"
      ? `${sorted.length} exact reviews share compatible inputs, operations, outputs, effects, and failure boundaries; ${independentCount} independently implementable contracts provide the canonical mechanism and ${patternCount} reviewed patterns remain supporting components.`
      : synthesisDecision === "deferred"
        ? `${sorted.length} exact reviews remain provider-bound, project-bound, sensitive, incomplete, or pattern-only and therefore cannot acquire independent execution authority.`
        : `${sorted.length} exact reviews were rejected during semantic adjudication and contribute only negative or boundary evidence.`,
    members: sorted.map((review, index) => ({
      facetId: review.facetId,
      reviewDigest: review.reviewDigest,
      role: roleFor(review, index, synthesisDecision),
    })),
  };
}

export function buildBehavioralClusterSet(familyId, reviews) {
  const groups = new Map();
  for (const review of reviews) {
    if (review.familyId !== familyId) throw new Error(`behavioral cluster family drift: ${review.facetId}`);
    const base = slug(review.proposedCluster);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(review);
  }
  const clusters = [];
  for (const [base, rows] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
    const independent = rows.filter((review) => review.disposition === "independent-implementation");
    const patterns = rows.filter((review) => review.disposition === "pattern-reference");
    const deferred = rows.filter((review) => review.disposition === "deferred");
    const rejected = rows.filter((review) => review.disposition === "rejected");
    if (independent.length > 0) clusters.push(clusterRow(base, [...independent, ...patterns], "candidate"));
    else if (patterns.length > 0) clusters.push(clusterRow(base, patterns, "deferred"));
    if (deferred.length > 0) clusters.push(clusterRow(base, deferred, "deferred", independent.length || patterns.length ? "-deferred-boundary" : ""));
    if (rejected.length > 0) clusters.push(clusterRow(base, rejected, "rejected", rows.length > rejected.length ? "-rejected-boundary" : ""));
  }
  return {
    schemaVersion: 1,
    clusterSetId: `wave2-${familyId}-clusters-v1`,
    familyId,
    clusters: clusters.sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function normalizeDraftCluster(set, row) {
  const normalized = {
    schemaVersion: 1,
    clusterSetId: set.clusterSetId,
    familyId: set.familyId,
    id: row.id,
    intent: row.intent.trim(),
    relationship: row.relationship,
    synthesisDecision: row.synthesisDecision,
    rationale: row.rationale.trim(),
    members: [...row.members]
      .map((member) => ({ facetId: member.facetId, reviewDigest: member.reviewDigest, role: member.role }))
      .sort((left, right) => left.facetId.localeCompare(right.facetId)),
  };
  return { ...normalized, clusterDigest: sha256(JSON.stringify(normalized)) };
}

function compactOperations(cluster, reviewByFacet) {
  const operations = cluster.members
    .flatMap((member) => reviewByFacet?.get(member.facetId)?.operations ?? [])
    .map((operation) => operation.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return [...new Set(operations)].slice(0, 3);
}

export function buildCoveredOverlapSet(familyId, clusters, comparisonIndex, targetSkillId, reviewByFacet = new Map()) {
  const target = comparisonIndex.targetContracts[targetSkillId];
  if (!target) throw new Error(`missing exact target contract: ${targetSkillId}`);
  const decisions = clusters
    .filter((cluster) => cluster.synthesisDecision === "candidate")
    .map((cluster) => {
      const key = `${familyId}::${cluster.id}`;
      const legacy = comparisonIndex.closestLegacyByFamily[familyId];
      const otherWave2 = comparisonIndex.closestWave2ByCluster[key];
      const operations = compactOperations(cluster, reviewByFacet);
      const comparedAgainst = [
        { kind: "godskill", id: target.id, digest: target.digest },
        { kind: "godskill", id: "promoted-contract-index-v1", digest: comparisonIndex.sectionDigests.promotedContracts },
        { kind: "legacy-cluster", id: "original-corpus-cluster-index-v1", digest: comparisonIndex.sectionDigests.originalCorpusClusters },
        { kind: "lunari-contract", id: "lunari-first-party-contract-index-v1", digest: comparisonIndex.sectionDigests.lunariContracts },
        { kind: "wave2-cluster", id: "wave2-cluster-index-v1", digest: comparisonIndex.sectionDigests.wave2Clusters },
        legacy ? { kind: "legacy-cluster", id: legacy.id, digest: legacy.digest } : null,
        otherWave2 ? { kind: "wave2-cluster", id: otherWave2.id, digest: otherWave2.digest } : null,
      ].filter(Boolean);
      return {
        schemaVersion: 1,
        familyId,
        clusterId: cluster.id,
        targetSkillId,
        disposition: "covered-stronger",
        comparedAgainst,
        mechanismComparison: `${targetSkillId} and the complete promoted, original-corpus, Lunari, and Wave 2 indexes were checked against the candidate's ${operations.length ? operations.join("; ") : cluster.intent} mechanism. The existing owner already supplies the family authority boundary, effect gating, verification contract, and terminal failure behavior while the candidate adds no separately routable terminal artifact.`,
        rationale: `Retain cluster ${cluster.id} as digest-bound supporting evidence for ${targetSkillId} without creating a parallel owner or expanding authority.`,
        intendedTier: "none",
      };
    });
  return {
    schemaVersion: 1,
    overlapSetId: `wave2-${familyId}-overlaps-v1`,
    familyId,
    decisions,
  };
}
