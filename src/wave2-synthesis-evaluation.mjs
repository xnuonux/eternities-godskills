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

function key(familyId, clusterId) {
  return `${familyId}::${clusterId}`;
}

export function buildWave2SynthesisPlan(clusters, overlaps) {
  const overlapByKey = new Map(overlaps.map((overlap) => [key(overlap.familyId, overlap.clusterId), overlap]));
  const entries = clusters
    .filter((cluster) => cluster.synthesisDecision === "candidate")
    .map((cluster) => {
      const overlap = overlapByKey.get(key(cluster.familyId, cluster.id));
      if (!overlap) throw new Error(`missing overlap for synthesis candidate: ${cluster.familyId}::${cluster.id}`);
      const action = ACTION_BY_DISPOSITION.get(overlap.disposition);
      if (!action) throw new Error(`unsupported synthesis overlap disposition: ${overlap.disposition}`);
      return {
        familyId: cluster.familyId,
        clusterId: cluster.id,
        clusterDigest: cluster.clusterDigest,
        overlapDigest: overlap.overlapDigest,
        reviewDigests: cluster.members.map((member) => member.reviewDigest).sort(),
        comparisonDigests: [...new Set(overlap.comparedAgainst.map((comparison) => comparison.digest))].sort(),
        action,
        intendedTier: overlap.intendedTier,
        ownerSkillId: overlap.targetSkillId,
        mechanismIds: MECHANISM_ACTIONS.has(action) ? [`wave2:${cluster.familyId}:${cluster.id}`] : [],
        rationale: overlap.rationale,
      };
    })
    .sort((left, right) => key(left.familyId, left.clusterId).localeCompare(key(right.familyId, right.clusterId)));
  return {
    schemaVersion: 1,
    planId: "wave2-synthesis-plan-v1",
    entries,
  };
}

export function evaluateWave2SynthesisPlan(plan, promotedReceiptByOwner) {
  return plan.entries.map((entry) => {
    const entryDigest = sha256(JSON.stringify(entry));
    if (entry.action === "retain-existing") {
      const receipt = promotedReceiptByOwner.get(entry.ownerSkillId);
      if (!receipt || receipt.status !== "promoted" || receipt.testsPassed !== true) {
        const row = {
          schemaVersion: 1,
          id: `${entry.familyId}::${entry.clusterId}`,
          entryDigest,
          action: entry.action,
          ownerSkillId: entry.ownerSkillId,
          status: "deferred",
          testsPassed: false,
          artifactCreated: false,
          existingOwnerReceipt: null,
          measuredImprovement: null,
          reason: "the current exact owner contract lacks a current passing owner receipt, so covered behavior remains terminally deferred rather than being re-promoted from stale evidence",
          sourceCodeExecuted: false,
          externalMutation: false,
        };
        return { ...row, evaluationDigest: sha256(JSON.stringify(row)) };
      }
      const row = {
        schemaVersion: 1,
        id: `${entry.familyId}::${entry.clusterId}`,
        entryDigest,
        action: entry.action,
        ownerSkillId: entry.ownerSkillId,
        status: "promoted",
        testsPassed: true,
        artifactCreated: false,
        existingOwnerReceipt: {
          id: receipt.id,
          path: receipt.path,
          digest: receipt.digest,
        },
        measuredImprovement: "existing owner already passed its independent promotion gates and subsumes the candidate mechanism",
        reason: "retain the stronger promoted owner without creating duplicate capability or authority",
        sourceCodeExecuted: false,
        externalMutation: false,
      };
      return { ...row, evaluationDigest: sha256(JSON.stringify(row)) };
    }
    const row = {
      schemaVersion: 1,
      id: `${entry.familyId}::${entry.clusterId}`,
      entryDigest,
      action: entry.action,
      ownerSkillId: entry.ownerSkillId,
      status: entry.action === "reject" ? "rejected" : "deferred",
      testsPassed: false,
      artifactCreated: false,
      existingOwnerReceipt: null,
      measuredImprovement: null,
      reason: "no independently implemented candidate artifact, complete critical fixture set, and measured baseline improvement are present, so the mechanism remains cold design evidence",
      sourceCodeExecuted: false,
      externalMutation: false,
    };
    return { ...row, evaluationDigest: sha256(JSON.stringify(row)) };
  });
}
