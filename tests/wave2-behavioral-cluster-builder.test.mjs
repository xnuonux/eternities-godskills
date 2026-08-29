import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBehavioralClusterSet,
  buildConservativeOverlapSet,
  normalizeDraftCluster,
} from "../src/wave2-behavioral-cluster-builder.mjs";

const digest = (letter) => letter.repeat(64);
function review(id, disposition, overrides = {}) {
  return {
    facetId: id,
    familyId: "agent-orchestration",
    reviewDigest: digest(id.at(-1)),
    proposedCluster: "bounded-agent-handoffs",
    disposition,
    neutralCapabilitySummary: `reviewed ${id} handoff behavior`,
    operations: [`bind ${id} authority`, `verify ${id} handoff evidence`],
    effects: disposition === "deferred" ? ["read", "external-write"] : ["read", "write"],
    failureBehavior: [`stop ${id} on stale evidence`],
    ...overrides,
  };
}

test("clusters compatible contracts while isolating deferred and rejected boundaries", () => {
  const set = buildBehavioralClusterSet("agent-orchestration", [
    review("facet-a", "independent-implementation"),
    review("facet-b", "pattern-reference"),
    review("facet-c", "deferred"),
    review("facet-d", "rejected"),
  ]);
  assert.equal(set.clusters.length, 3);
  assert.equal(set.clusters.reduce((sum, cluster) => sum + cluster.members.length, 0), 4);
  assert.deepEqual(set.clusters.map((cluster) => cluster.synthesisDecision).sort(), [
    "candidate",
    "deferred",
    "rejected",
  ]);
  const candidate = set.clusters.find((cluster) => cluster.synthesisDecision === "candidate");
  assert.deepEqual(candidate.members.map((member) => member.role), ["canonical", "component"]);
});

test("normalizes draft clusters to the exact certification digest contract", () => {
  const set = buildBehavioralClusterSet("agent-orchestration", [
    review("facet-a", "independent-implementation"),
  ]);
  const normalized = normalizeDraftCluster(set, set.clusters[0]);
  assert.match(normalized.clusterDigest, /^[a-f0-9]{64}$/);
  assert.equal(normalized.members[0].facetId, "facet-a");
});

test("conservative overlap references all indexes but defers without mechanism-level proof", () => {
  const set = buildBehavioralClusterSet("agent-orchestration", [
    review("facet-a", "independent-implementation"),
  ]);
  const cluster = normalizeDraftCluster(set, set.clusters[0]);
  const index = {
    sectionDigests: {
      promotedContracts: digest("1"),
      originalCorpusClusters: digest("2"),
      lunariContracts: digest("3"),
      wave2Clusters: digest("4"),
    },
    targetContracts: {
      "eternities-forge": { id: "eternities-forge", digest: digest("5") },
    },
    closestLegacyByFamily: {
      "agent-orchestration": { id: "legacy-agent-cluster", digest: digest("6") },
    },
    closestWave2ByCluster: {
      [`${cluster.familyId}::${cluster.id}`]: { id: "other-wave2-cluster", digest: digest("7") },
    },
  };
  const overlaps = buildConservativeOverlapSet("agent-orchestration", [cluster], index, "eternities-forge");
  assert.equal(overlaps.decisions.length, 1);
  assert.equal(overlaps.decisions[0].disposition, "deferred");
  assert.deepEqual(new Set(overlaps.decisions[0].comparedAgainst.map((entry) => entry.kind)), new Set([
    "godskill",
    "legacy-cluster",
    "lunari-contract",
    "wave2-cluster",
  ]));
});
