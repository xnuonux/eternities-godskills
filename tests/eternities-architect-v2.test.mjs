import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { validateCompositionContract } from "../src/composition.mjs";

const root = new URL("../", import.meta.url);
const json = async (relative) => JSON.parse(await readFile(new URL(relative, root), "utf8"));

test("architect v2 preserves v1 routes and adds six evidence-bounded architecture routes", async () => {
  const [manifest, contract, synthesis, receipt] = await Promise.all([
    json("clusters/architecture-specification.v1.json"),
    json("skills/eternities-architect/references/capability-contract.json"),
    json("syntheses/eternities-architect.v2.json"),
    json("receipts/promotions/eternities-architect-v2.json"),
  ]);
  const candidate = manifest.clusters.filter((cluster) => cluster.synthesisDecision === "candidate");
  const candidateSourceIds = candidate.flatMap((cluster) => cluster.members.map(({ sourceId }) => sourceId));
  const deferred = manifest.clusters.filter((cluster) => cluster.synthesisDecision === "deferred");
  const rejected = manifest.clusters.filter((cluster) => cluster.synthesisDecision === "rejected");

  assert.equal(candidate.length, 6);
  assert.equal(candidateSourceIds.length, 53);
  assert.equal(new Set(candidateSourceIds).size, 53);
  assert.equal(deferred.length, 2);
  assert.equal(rejected.length, 1);
  const routeIds = new Set(contract.routes.map(({ id }) => id));
  for (const id of ["decision-record", "new-system", "existing-system", "assessment", "requirements-adr", "diagrams", "interfaces-apis", "reliability", "verification"]) assert.ok(routeIds.has(id), id);
  assert.deepEqual(synthesis.clusters.map(({ id }) => id), candidate.map(({ id }) => id));
  assert.deepEqual(synthesis.deferredClusters, deferred.map(({ id }) => id));
  assert.deepEqual(synthesis.rejectedClusters, rejected.map(({ id }) => id));
  assert.equal(synthesis.sourceIds.length, 53);
  assert.equal(new Set(synthesis.sourceIds).size, 53);
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
  assert.equal(receipt.evidence.candidateClusterCount, 6);
  assert.equal(receipt.evidence.candidateSourceCoverage, 53);
  assert.equal(receipt.evidence.sourceProseCopied, false);
  assert.equal(receipt.evidence.externalMutation, false);
  assert.deepEqual(receipt.decision.failedGates, []);
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.evidence.synthesisPath, "syntheses/eternities-architect.v2.json");
  assert.doesNotThrow(() => validateCompositionContract(contract));
});

test("architect v2 cases prove commandless routes and fail-closed limits", async () => {
  const cases = await json("skills/eternities-architect/evals/cases.json");
  const ids = new Set(cases.cases.map(({ id }) => id));
  for (const id of ["direct-assessment", "direct-requirements-adr", "direct-diagrams", "direct-interfaces", "direct-reliability", "direct-verification", "exclude-deployment", "exclude-credentials", "exclude-production-mutation", "exclude-unsupported-claim", "exclude-unresolved-tradeoff"]) assert.ok(ids.has(id), id);
  assert.ok(cases.cases.filter(({ expected }) => expected.startsWith("route:")).length >= 11);
  assert.ok(cases.cases.filter(({ expected }) => expected.startsWith("fail-closed:")).length >= 5);
});
