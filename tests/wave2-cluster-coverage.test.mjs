import assert from "node:assert/strict";
import test from "node:test";

import {
  flattenWave2OverlapDecisionSets,
  normalizeWave2ClusterSets,
} from "../scripts/build-wave2-cluster-coverage.mjs";

const DIGEST = "a".repeat(64);

function clusterSet(familyId = "implementation-engineering") {
  return {
    schemaVersion: 1,
    clusterSetId: `wave2-${familyId}-clusters-v1`,
    familyId,
    clusters: [{
      id: "bounded-proof",
      intent: "produce a bounded result with observable proof",
      relationship: "ordered-composition",
      synthesisDecision: "candidate",
      rationale: "the behaviors form one compatible authority boundary",
      members: [{ facetId: "facet-a", reviewDigest: DIGEST, role: "canonical" }],
    }],
  };
}

function overlapSet(familyId = "implementation-engineering") {
  return {
    schemaVersion: 1,
    overlapSetId: `wave2-${familyId}-overlaps-v1`,
    familyId,
    decisions: [{
      schemaVersion: 1,
      familyId,
      clusterId: "bounded-proof",
      targetSkillId: "eternities-daedalus",
      disposition: "extend-existing",
      comparedAgainst: [{ kind: "godskill", id: "eternities-daedalus", digest: DIGEST }],
      mechanismComparison: "the existing owner lacks the candidate verification ledger",
      rationale: "extend one authority owner instead of creating a parallel skill",
      intendedTier: "godskill-extension",
    }],
  };
}

test("family cluster sets and overlap decision sets normalize deterministically", () => {
  const clusters = normalizeWave2ClusterSets([
    clusterSet("release-publishing"),
    clusterSet("implementation-engineering"),
  ]);
  const overlaps = flattenWave2OverlapDecisionSets([
    overlapSet("release-publishing"),
    overlapSet("implementation-engineering"),
  ]);

  assert.deepEqual(clusters.map((row) => row.familyId), ["implementation-engineering", "release-publishing"]);
  assert.deepEqual(overlaps.map((row) => row.familyId), ["implementation-engineering", "release-publishing"]);
});

test("duplicate family sets and overlap family drift fail closed", () => {
  assert.throws(
    () => normalizeWave2ClusterSets([clusterSet(), clusterSet()]),
    /duplicate cluster family/,
  );
  assert.throws(
    () => flattenWave2OverlapDecisionSets([{
      ...overlapSet(),
      decisions: [{ ...overlapSet().decisions[0], familyId: "general" }],
    }]),
    /overlap family drift/,
  );
});

test("duplicate overlap decisions cannot be hidden across family files", () => {
  const first = overlapSet();
  assert.throws(
    () => flattenWave2OverlapDecisionSets([{
      ...first,
      decisions: [first.decisions[0], { ...first.decisions[0] }],
    }]),
    /duplicate overlap decision/,
  );
});
