import { sha256 } from "./io.mjs";

const ACTION_BY_DISPOSITION = new Map([
  ["covered-stronger", "retain-existing"],
  ["extend-existing", "extend-existing"],
  ["new-operational-skill", "synthesize-operational-skill"],
  ["new-godskill", "synthesize-godskill"],
  ["ultragodskill-candidate", "evaluate-ultragodskill"],
  ["deferred", "defer"],
  ["rejected", "reject"],
]);
const MECHANISM_ACTIONS = new Set([
  "extend-existing",
  "synthesize-operational-skill",
  "synthesize-godskill",
  "evaluate-ultragodskill",
]);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
}

function digest(value, field) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${field} must be a SHA-256 digest`);
}

function exactDigestSet(actual, expected, label) {
  if (!Array.isArray(actual)) throw new Error(`${label} must be an array`);
  for (const value of actual) digest(value, label);
  const normalized = [...new Set(actual)].sort();
  if (normalized.length !== actual.length || JSON.stringify(normalized) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} mismatch`);
  }
  return normalized;
}

function key(familyId, clusterId) {
  return `${familyId}::${clusterId}`;
}

export function certifyWave2SynthesisPlan({ clusters, overlaps, plan }) {
  if (!plan || plan.schemaVersion !== 1) throw new Error("synthesis plan schemaVersion must be 1");
  nonEmptyString(plan.planId, "synthesisPlan.planId");
  if (!Array.isArray(plan.entries)) throw new Error("synthesisPlan.entries must be an array");

  const candidateByKey = new Map();
  const clusterByKey = new Map();
  for (const cluster of clusters ?? []) {
    const clusterKey = key(cluster.familyId, cluster.id);
    if (clusterByKey.has(clusterKey)) throw new Error(`duplicate cluster evidence: ${clusterKey}`);
    digest(cluster.clusterDigest, "cluster.clusterDigest");
    clusterByKey.set(clusterKey, cluster);
    if (cluster.synthesisDecision === "candidate") candidateByKey.set(clusterKey, cluster);
  }

  const overlapByKey = new Map();
  for (const overlap of overlaps ?? []) {
    const overlapKey = key(overlap.familyId, overlap.clusterId);
    if (overlapByKey.has(overlapKey)) throw new Error(`duplicate overlap evidence: ${overlapKey}`);
    if (!candidateByKey.has(overlapKey)) throw new Error(`overlap targets noncandidate cluster: ${overlapKey}`);
    digest(overlap.clusterDigest, "overlap.clusterDigest");
    digest(overlap.overlapDigest, "overlap.overlapDigest");
    overlapByKey.set(overlapKey, overlap);
  }

  const seen = new Set();
  const mechanismOwner = new Map();
  const entries = [];
  for (const entry of plan.entries) {
    for (const field of ["familyId", "clusterId", "action", "intendedTier", "ownerSkillId", "rationale"]) {
      nonEmptyString(entry?.[field], `synthesisEntry.${field}`);
    }
    const entryKey = key(entry.familyId, entry.clusterId);
    if (seen.has(entryKey)) throw new Error(`duplicate synthesis action: ${entryKey}`);
    seen.add(entryKey);
    const cluster = clusterByKey.get(entryKey);
    if (!cluster || cluster.synthesisDecision !== "candidate") {
      throw new Error(`synthesis action targets noncandidate cluster: ${entryKey}`);
    }
    const overlap = overlapByKey.get(entryKey);
    if (!overlap) throw new Error(`missing overlap evidence for synthesis action: ${entryKey}`);
    if (entry.clusterDigest !== cluster.clusterDigest) throw new Error(`stale synthesis cluster digest: ${entryKey}`);
    if (entry.overlapDigest !== overlap.overlapDigest) throw new Error(`stale synthesis overlap digest: ${entryKey}`);

    const reviewDigests = exactDigestSet(
      entry.reviewDigests,
      cluster.members.map((member) => member.reviewDigest),
      "review evidence",
    );
    const comparisonDigests = exactDigestSet(
      entry.comparisonDigests,
      overlap.comparedAgainst.map((comparison) => comparison.digest),
      "comparison evidence",
    );
    const expectedAction = ACTION_BY_DISPOSITION.get(overlap.disposition);
    if (!expectedAction || entry.action !== expectedAction) {
      throw new Error(`synthesis action does not match overlap disposition: ${entryKey}`);
    }
    if (entry.intendedTier !== overlap.intendedTier) throw new Error(`synthesis intended tier mismatch: ${entryKey}`);
    if (!Array.isArray(entry.mechanismIds)) throw new Error("synthesisEntry.mechanismIds must be an array");
    if (MECHANISM_ACTIONS.has(entry.action) && entry.mechanismIds.length === 0) {
      throw new Error(`synthesis action requires mechanism ownership: ${entryKey}`);
    }
    const mechanismIds = [...entry.mechanismIds].sort();
    if (new Set(mechanismIds).size !== mechanismIds.length) {
      throw new Error(`duplicate mechanism ownership within synthesis action: ${entryKey}`);
    }
    for (const mechanismId of mechanismIds) {
      nonEmptyString(mechanismId, "synthesisEntry.mechanismId");
      if (mechanismOwner.has(mechanismId)) {
        throw new Error(`duplicate mechanism ownership: ${mechanismId}`);
      }
      mechanismOwner.set(mechanismId, entry.ownerSkillId);
    }
    entries.push({
      schemaVersion: 1,
      familyId: entry.familyId,
      clusterId: entry.clusterId,
      clusterDigest: entry.clusterDigest,
      overlapDigest: entry.overlapDigest,
      reviewDigests,
      comparisonDigests,
      action: entry.action,
      intendedTier: entry.intendedTier,
      ownerSkillId: entry.ownerSkillId,
      mechanismIds,
      rationale: entry.rationale.trim(),
    });
  }

  const missing = [...candidateByKey.keys()].filter((candidateKey) => !seen.has(candidateKey)).sort();
  if (missing.length) throw new Error(`missing synthesis action: ${missing.join(", ")}`);
  entries.sort((left, right) => key(left.familyId, left.clusterId).localeCompare(key(right.familyId, right.clusterId)));
  const normalized = {
    schemaVersion: 1,
    planId: plan.planId.trim(),
    entries,
  };
  return {
    ...normalized,
    planDigest: sha256(JSON.stringify(normalized)),
    coverage: {
      schemaVersion: 1,
      candidateClusterCount: candidateByKey.size,
      terminalActionCount: entries.length,
      unresolvedCandidateCount: candidateByKey.size - entries.length,
      mechanismOwnershipCount: mechanismOwner.size,
    },
  };
}
