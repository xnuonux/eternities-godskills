import { sha256 } from "./io.mjs";

const CONSTRUCTION_ACTIONS = new Map([
  ["synthesize-operational-skill", "operational-skill"],
  ["extend-existing", "godskill-extension"],
]);

const TOP_LEVEL_OWNERS = new Set([
  "eternities-aegis",
  "eternities-agora",
  "eternities-arcadia",
  "eternities-architect",
  "eternities-athena",
  "eternities-atlas",
  "eternities-beacon",
  "eternities-chorus",
  "eternities-daedalus",
  "eternities-forge",
  "eternities-herald",
  "eternities-hermes",
  "eternities-logos",
  "eternities-mnemosyne",
  "eternities-muse",
  "eternities-omnibus",
  "eternities-oracle",
  "eternities-orpheus",
  "eternities-phoenix",
  "eternities-prometheus",
  "sovereign-skill-refinery",
]);

const OPERATIONAL_CATEGORICAL_OWNER = new Map(Object.entries({
  "api-rate-limit-recovery": "eternities-daedalus",
  "approval-bound-private-session-mining": "eternities-mnemosyne",
  "bounded-service-shutdown": "eternities-daedalus",
  "bounded-verified-object-ingestion": "eternities-atlas",
  "columnar-ingestion-rollup-and-query-layout-design": "eternities-atlas",
  "confirmed-destructive-reconstruction": "eternities-phoenix",
  "diagnostic-statistical-model-inference": "eternities-athena",
  "docx-package-redline-and-render-verification": "eternities-logos",
  "formula-preserving-workbook-engineering": "eternities-daedalus",
  "fp-ts-functional-refactoring": "eternities-daedalus",
  "genomic-coordinate-assembly-and-variant-gates": "eternities-athena",
  "interface-localization-and-bidirectionality": "eternities-muse",
  "invariant-guard": "eternities-daedalus",
  "lazy-tabular-transformation-and-validation": "eternities-atlas",
  "measured-paid-creative-iteration": "eternities-beacon",
  "performance-release-gating": "eternities-herald",
  "physics-constrained-numerical-validation": "eternities-athena",
  "release-script-safety": "eternities-herald",
  "semantic-implementation-diff": "eternities-daedalus",
  "symbolic-mathematics-python": "eternities-daedalus",
  "venture-falsification-and-planning": "eternities-prometheus",
  "web-performance-optimization": "eternities-daedalus",
}));

const COMPOSITION_SCORE = new Map([
  ["ordered-composition", 5],
  ["behavioral-equivalent", 3],
  ["specialized-alternative", 2],
  ["boundary", 2],
  ["exact-duplicate", 1],
]);

const PRIORITY_DIMENSIONS = [
  "crossDomainApplicability",
  "compositionalLeverage",
  "mechanismDistinctness",
  "evidenceAndTestability",
  "authorityNeutralityAndSafeLocalOperation",
  "implementationTractability",
];

function asciiCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function clampScore(value) {
  return Math.max(0, Math.min(5, Math.round(value)));
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function requireDigest(value, field) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${field} must be a SHA-256 digest`);
  return value;
}

function exactSorted(values, field) {
  if (!Array.isArray(values)) throw new Error(`${field} must be an array`);
  const sorted = values.map((value) => requireDigest(value, field)).sort(asciiCompare);
  if (new Set(sorted).size !== sorted.length) throw new Error(`duplicate ${field}`);
  return sorted;
}

function mapUnique(rows, keyOf, label) {
  const result = new Map();
  for (const row of rows ?? []) {
    const key = keyOf(row);
    requireString(key, `${label} key`);
    if (result.has(key)) throw new Error(`duplicate ${label}: ${key}`);
    result.set(key, row);
  }
  return result;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function crossDomainScore(reviews) {
  const provider = { none: 5, conditional: 3, "provider-bound": 1 };
  const project = { portable: 5, "project-adjacent": 3, "project-bound": 1 };
  const scores = reviews.map((review) => {
    if (!(review.providerCoupling in provider)) throw new Error(`unknown provider coupling: ${review.providerCoupling}`);
    if (!(review.projectCoupling in project)) throw new Error(`unknown project coupling: ${review.projectCoupling}`);
    return (provider[review.providerCoupling] + project[review.projectCoupling]) / 2;
  });
  return clampScore(average(scores));
}

function evidenceScore(reviews) {
  const signals = new Set();
  for (const review of reviews) {
    for (const value of [...(review.usefulInvariants ?? []), ...(review.failureBehavior ?? [])]) {
      if (typeof value === "string" && value.trim()) signals.add(value.trim());
    }
  }
  return clampScore(Math.ceil(signals.size / 3));
}

function authorityScore(reviews) {
  const effects = new Set(reviews.flatMap((review) => review.effects ?? []));
  if (effects.has("external-write")) return 1;
  if (effects.has("write")) return 3;
  if (effects.has("read")) return 4;
  return 5;
}

function tractabilityScore(reviews) {
  const operations = new Set(reviews.flatMap((review) => review.operations ?? []).filter(Boolean));
  let score = operations.size <= 3 ? 5 : operations.size <= 6 ? 4 : operations.size <= 10 ? 3 : operations.size <= 15 ? 2 : 1;
  if (reviews.some((review) => review.providerCoupling === "provider-bound" || review.projectCoupling === "project-bound")) score -= 1;
  return clampScore(score);
}

function priorityFor(entry, cluster, reviews) {
  const crossDomainApplicability = crossDomainScore(reviews);
  const compositionalLeverage = COMPOSITION_SCORE.get(cluster.relationship);
  if (compositionalLeverage === undefined) throw new Error(`unknown cluster relationship: ${cluster.relationship}`);
  const mechanismDistinctness = clampScore(
    (entry.action === "synthesize-operational-skill" ? 5 : 3) - (cluster.relationship === "exact-duplicate" ? 1 : 0),
  );
  const evidenceAndTestability = evidenceScore(reviews);
  const authorityNeutralityAndSafeLocalOperation = authorityScore(reviews);
  const implementationTractability = tractabilityScore(reviews);
  const dimensions = {
    crossDomainApplicability,
    compositionalLeverage,
    mechanismDistinctness,
    evidenceAndTestability,
    authorityNeutralityAndSafeLocalOperation,
    implementationTractability,
  };
  return {
    dimensions,
    total: PRIORITY_DIMENSIONS.reduce((sum, dimension) => sum + dimensions[dimension], 0),
    evidence: [
      { dimension: "crossDomainApplicability", basis: "review providerCoupling and projectCoupling", score: crossDomainApplicability },
      { dimension: "compositionalLeverage", basis: `cluster relationship ${cluster.relationship}`, score: compositionalLeverage },
      { dimension: "mechanismDistinctness", basis: `construction action ${entry.action} and cluster relationship ${cluster.relationship}`, score: mechanismDistinctness },
      { dimension: "evidenceAndTestability", basis: "unique reviewed invariants and failure behaviors", score: evidenceAndTestability },
      { dimension: "authorityNeutralityAndSafeLocalOperation", basis: "union of reviewed effect classes", score: authorityNeutralityAndSafeLocalOperation },
      { dimension: "implementationTractability", basis: "unique reviewed operations and coupling penalties", score: implementationTractability },
    ],
  };
}

function categoricalOwnerFor(implementationOwnerId) {
  if (TOP_LEVEL_OWNERS.has(implementationOwnerId)) return implementationOwnerId;
  return OPERATIONAL_CATEGORICAL_OWNER.get(implementationOwnerId);
}

function compareTargets(left, right) {
  return right.priority.total - left.priority.total
    || asciiCompare(left.familyId, right.familyId)
    || asciiCompare(left.clusterId, right.clusterId);
}

export function certifyUniversalCapabilityCoverage(targets) {
  if (!Array.isArray(targets) || targets.length !== 48) throw new Error("universal capability coverage requires exactly 48 targets");
  const ids = targets.map((target) => requireString(target?.targetId, "target.targetId"));
  if (new Set(ids).size !== ids.length) throw new Error("duplicate universal capability target");
  const operationalSkillCount = targets.filter((target) => target.kind === "operational-skill").length;
  const godskillExtensionCount = targets.filter((target) => target.kind === "godskill-extension").length;
  if (operationalSkillCount !== 22 || godskillExtensionCount !== 26) {
    throw new Error("universal capability kind counts must be 22 operational skills and 26 Godskill extensions");
  }
  const sorted = [...targets].sort(compareTargets);
  if (targets.some((target, index) => target.targetId !== sorted[index].targetId)) {
    throw new Error("universal capability targets are not in deterministic priority order");
  }
  return {
    schemaVersion: 1,
    targetCount: 48,
    operationalSkillCount,
    godskillExtensionCount,
    unresolvedInputBindingCount: 0,
  };
}

export function buildUniversalCapabilityWave({ synthesisPlan, clusterEvidence, reviewEvidence }) {
  if (!synthesisPlan || synthesisPlan.schemaVersion !== 1 || !Array.isArray(synthesisPlan.entries)) {
    throw new Error("synthesisPlan must be a schemaVersion 1 plan");
  }
  const clusterByKey = mapUnique(clusterEvidence, (row) => `${row?.familyId ?? ""}::${row?.id ?? ""}`, "cluster evidence");
  const reviewByDigest = mapUnique(reviewEvidence, (row) => row?.reviewDigest ?? "", "review evidence");
  const operationalIds = new Set(
    synthesisPlan.entries
      .filter((entry) => entry.action === "synthesize-operational-skill")
      .map((entry) => entry.ownerSkillId),
  );
  const knownImplementationOwners = new Set([...TOP_LEVEL_OWNERS, ...operationalIds]);

  const targets = [];
  for (const entry of synthesisPlan.entries) {
    const kind = CONSTRUCTION_ACTIONS.get(entry.action);
    if (!kind) continue;
    const familyId = requireString(entry.familyId, "synthesisEntry.familyId");
    const clusterId = requireString(entry.clusterId, "synthesisEntry.clusterId");
    const implementationOwnerId = requireString(entry.ownerSkillId, "synthesisEntry.ownerSkillId");
    if (!knownImplementationOwners.has(implementationOwnerId)) {
      throw new Error(`unknown implementation owner: ${implementationOwnerId}`);
    }
    const categoricalOwnerId = categoricalOwnerFor(implementationOwnerId);
    if (!categoricalOwnerId || !TOP_LEVEL_OWNERS.has(categoricalOwnerId)) {
      throw new Error(`unknown categorical owner for: ${implementationOwnerId}`);
    }
    const targetId = `${familyId}::${clusterId}`;
    const cluster = clusterByKey.get(targetId);
    if (!cluster) throw new Error(`missing cluster evidence: ${targetId}`);
    requireDigest(entry.clusterDigest, "synthesisEntry.clusterDigest");
    requireDigest(cluster.clusterDigest, "cluster.clusterDigest");
    if (entry.clusterDigest !== cluster.clusterDigest) throw new Error(`stale cluster evidence: ${targetId}`);
    requireDigest(entry.overlapDigest, "synthesisEntry.overlapDigest");

    const planReviewDigests = exactSorted(entry.reviewDigests, "synthesisEntry.reviewDigests");
    const clusterReviewDigests = exactSorted(cluster.members?.map((member) => member.reviewDigest), "cluster review digests");
    if (JSON.stringify(planReviewDigests) !== JSON.stringify(clusterReviewDigests)) {
      throw new Error(`review evidence mismatch: ${targetId}`);
    }
    const reviews = cluster.members.map((member) => {
      const review = reviewByDigest.get(member.reviewDigest);
      if (!review) throw new Error(`missing review evidence: ${member.reviewDigest}`);
      if (review.familyId !== familyId || review.facetId !== member.facetId) {
        throw new Error(`stale review evidence: ${member.reviewDigest}`);
      }
      return review;
    });
    const mechanismIds = (entry.mechanismIds ?? []).map((value) => requireString(value, "synthesisEntry.mechanismId")).sort(asciiCompare);
    if (mechanismIds.length === 0 || new Set(mechanismIds).size !== mechanismIds.length) {
      throw new Error(`invalid mechanism ownership: ${targetId}`);
    }

    targets.push({
      schemaVersion: 1,
      targetId,
      familyId,
      clusterId,
      clusterDigest: cluster.clusterDigest,
      overlapDigest: entry.overlapDigest,
      reviewDigests: clusterReviewDigests,
      comparisonDigests: exactSorted(entry.comparisonDigests, "synthesisEntry.comparisonDigests"),
      mechanismIds,
      kind,
      intendedTier: requireString(entry.intendedTier, "synthesisEntry.intendedTier"),
      categoricalOwnerId,
      implementationOwnerId,
      priority: priorityFor(entry, cluster, reviews),
    });
  }

  targets.sort(compareTargets);
  const coverage = certifyUniversalCapabilityCoverage(targets);
  const normalized = {
    schemaVersion: 1,
    waveId: "universal-capability-construction-v1",
    sourcePlanId: requireString(synthesisPlan.planId, "synthesisPlan.planId"),
    priorityPolicy: {
      dimensions: PRIORITY_DIMENSIONS,
      scoreRange: [0, 5],
      ordering: ["priority.total:desc", "familyId:asc", "clusterId:asc"],
      productDemandWeight: 0,
    },
    targets,
    coverage,
  };
  return { ...normalized, waveDigest: sha256(JSON.stringify(normalized)) };
}
