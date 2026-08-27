import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'data/second-order-promotion-plan.v1.json'), 'utf8'));
const families = plan.scope.families;
const candidateClusters = families.flatMap((familyId) => {
  const source = JSON.parse(fs.readFileSync(path.join(root, `clusters/${familyId}.v1.json`), 'utf8'));
  return source.clusters.filter((cluster) => cluster.synthesisDecision === 'candidate').map((cluster) => ({ ...cluster, familyId }));
});
const corpusEvidence = new Map(fs.readFileSync(path.join(root, 'artifacts/corpus/cluster-evidence.jsonl'), 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line)).map((cluster) => [cluster.id, cluster]));
const candidateById = new Map(candidateClusters.map((cluster) => [cluster.id, cluster]));
const groupClusters = plan.adjudication.groups.flatMap((group) => group.clusters.map((cluster) => ({ ...cluster, group })));
const deferred = plan.adjudication.decisions.deferred;

test('candidate coverage is complete and disjoint between groups and deferrals', () => {
  const covered = [...groupClusters.map((cluster) => cluster.clusterId), ...deferred.map((cluster) => cluster.clusterId)];
  assert.equal(covered.length, candidateClusters.length);
  assert.equal(new Set(covered).size, covered.length);
  assert.deepEqual(new Set(covered), new Set(candidateById.keys()));
});

test('deferred clusters cannot appear in a capability group', () => {
  const deferredIds = new Set(deferred.map((cluster) => cluster.clusterId));
  for (const cluster of groupClusters) assert.equal(deferredIds.has(cluster.clusterId), false, cluster.clusterId);
});

test('groups have no duplicate clusters or sources', () => {
  const allGroupIds = groupClusters.map((cluster) => cluster.clusterId);
  assert.equal(new Set(allGroupIds).size, allGroupIds.length);
  const allSources = plan.adjudication.groups.flatMap((group) => group.sourceUnion.map((source) => source.sourceId));
  assert.equal(new Set(allSources).size, allSources.length);
  for (const cluster of groupClusters) {
    const source = candidateById.get(cluster.clusterId);
    assert.ok(source);
    const expectedDigest = source.clusterDigest ?? corpusEvidence.get(cluster.clusterId)?.clusterDigest;
    assert.match(cluster.clusterDigest, /^[a-f0-9]{64}$/);
    if (expectedDigest) assert.equal(cluster.clusterDigest, expectedDigest);
  }
});

test('route groups are bounded and every group declares decision boundaries', () => {
  assert.ok(plan.adjudication.groups.length > 0);
  for (const group of plan.adjudication.groups) {
    assert.ok(group.routeGroup);
    assert.ok(group.targetSkillId);
    assert.ok(group.rationale.length > 80);
    assert.ok(group.authorityEffectRiskBoundary.length > 80);
    assert.ok(group.proofLimits.length > 80);
    assert.ok(group.clusters.length <= 16);
  }
  const routeCounts = new Map();
  for (const group of plan.adjudication.groups) routeCounts.set(group.routeGroup, (routeCounts.get(group.routeGroup) ?? 0) + 1);
  for (const count of routeCounts.values()) assert.ok(count <= plan.constraints.maxRouteGroupsPerFamily);
});
