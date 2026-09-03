import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { sha256 } from "../src/io.mjs";
import { validateCompositionGraph } from "../src/composition.mjs";

const root = new URL("../", import.meta.url);
const repositoryRoot = fileURLToPath(root);
const execFile = promisify(execFileCallback);
async function text(relative) { return readFile(new URL(relative, root), "utf8"); }
async function json(relative) { return JSON.parse(await text(relative)); }
async function lines(relative) { return (await text(relative)).split(/\r?\n/).filter(Boolean).map(JSON.parse); }
async function gitShow(commit, relative) {
  const { stdout } = await execFile("git", ["show", `${commit}:${relative}`], {
    cwd: repositoryRoot,
    encoding: null,
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

test("Beacon release receipt reconciles every local certification boundary", async () => {
  const [receipt, map, batch, clusterReceipt, promotionText, promotion, contract, routerV4, routerV5, coverage] = await Promise.all([
    json("receipts/eternities-beacon-release.json"),
    json("data/marketing-growth-cluster-map.v1.json"),
    json("clusters/marketing-growth.v1.json"),
    json("receipts/marketing-growth-clusters-v1.json"),
    text("receipts/promotions/eternities-beacon.json"),
    json("receipts/promotions/eternities-beacon.json"),
    json("skills/eternities-beacon/references/capability-contract.json"),
    json("receipts/agent-native-router-v4.json"),
    json("receipts/agent-native-router-v5.json"),
    json("artifacts/corpus/coverage-summary.json"),
  ]);
  const reviewWaves = await Promise.all(Array.from({ length: 13 }, (_, index) =>
    json(`reviews/waves/marketing-growth/wave-${String(index + 1).padStart(3, "0")}.json`)));
  const reviewedIds = reviewWaves.flatMap(({ reviews }) => reviews.map(({ sourceId }) => sourceId));
  const byDecision = (decision) => batch.clusters.filter(({ synthesisDecision }) => synthesisDecision === decision);
  const sourcesFor = (decision) => byDecision(decision).flatMap(({ members }) => members);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "eternities-beacon-release");
  assert.equal(receipt.status, "certified-local-candidate");
  assert.deepEqual(receipt.capabilities, { added: 1, promotedTotal: 11 });
  assert.equal(receipt.capabilities.promotedTotal, routerV5.counts.cardCount);
  assert.equal(reviewedIds.length, 253);
  assert.equal(new Set(reviewedIds).size, 253);
  assert.deepEqual(receipt.evidence, {
    familyQueueSources: 291,
    newlyReviewedSources: 253,
    priorCanonicalSources: 38,
    clusters: 24,
    selectedClusters: 6,
    selectedSources: 143,
    deferredClusters: 8,
    deferredSources: 59,
    rejectedClusters: 10,
    rejectedSources: 51,
    routes: 6,
    criticalCasesPassed: 72,
    criticalCasesTotal: 72,
    entrypointTokenCount: 1960,
  });
  assert.deepEqual(map.queueCoverage, {
    familyQueueSources: 291,
    newMarketingClusterMembers: 253,
    priorCanonicalClusterMembers: 38,
    globallyCoveredQueueSources: 291,
  });
  const [queue, frozenReviews, frozenClusters] = await Promise.all([
    json("artifacts/corpus/families/marketing-growth/queue.json"),
    lines("artifacts/checkpoints/eternities-chorus-release-v1/review-evidence.jsonl"),
    lines("artifacts/checkpoints/eternities-chorus-release-v1/cluster-evidence.jsonl"),
  ]);
  const queueIds = new Set(queue.cards.map(({ sourceId }) => sourceId));
  const newIds = new Set(batch.clusters.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)));
  const frozenOverlapClusters = frozenClusters.filter(({ members }) =>
    members.some(({ sourceId }) => queueIds.has(sourceId) && !newIds.has(sourceId)));
  const priorIds = frozenOverlapClusters
    .flatMap(({ members }) => members.map(({ sourceId }) => sourceId))
    .filter((sourceId) => queueIds.has(sourceId) && !newIds.has(sourceId))
    .sort();
  assert.equal(priorIds.length, 38);
  assert.equal(new Set([...newIds, ...priorIds]).size, 291);
  assert.deepEqual([...newIds, ...priorIds].sort(), [...queueIds].sort());
  const priorSet = new Set(priorIds);
  const frozenOverlapReviews = frozenReviews.filter(({ sourceId }) => priorSet.has(sourceId));
  assert.equal(frozenOverlapReviews.length, 38);
  assert.equal(receipt.evidence.selectedSources + receipt.evidence.deferredSources + receipt.evidence.rejectedSources, 253);
  assert.equal(byDecision("candidate").length, receipt.evidence.selectedClusters);
  assert.equal(sourcesFor("candidate").length, receipt.evidence.selectedSources);
  assert.equal(byDecision("deferred").length, receipt.evidence.deferredClusters);
  assert.equal(sourcesFor("deferred").length, receipt.evidence.deferredSources);
  assert.equal(byDecision("rejected").length, receipt.evidence.rejectedClusters);
  assert.equal(sourcesFor("rejected").length, receipt.evidence.rejectedSources);
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "conversion-and-lifecycle-systems",
    "discoverability-and-search-systems",
    "go-to-market-and-demand-systems",
    "growth-measurement-and-stewardship",
    "market-truth-and-positioning",
    "offer-and-commercial-architecture",
  ]);
  assert.equal(promotion.decision.status, "promoted");
  assert.equal(promotion.candidate.criticalPassed, 72);
  assert.equal(promotion.candidate.criticalTotal, 72);
  assert.deepEqual(promotion.candidate.unresolvedEffects, []);
  assert.match(receipt.promotionReceiptSha256, /^[a-f0-9]{64}$/);
  assert.equal(routerV4.status, "certified");
  assert.equal(routerV4.checkpointRoot, "artifacts/checkpoints/agent-native-router-v4");
  for (const [name, file] of [["cardsSha256", "cards.jsonl"], ["familyMapSha256", "family-map.json"], ["manifestSha256", "manifest.json"]]) {
    assert.equal(routerV4.artifacts[name], sha256(await text(`${routerV4.checkpointRoot}/${file}`)));
  }
  assert.deepEqual(receipt.router, {
    v4CheckpointStatus: routerV4.status,
    v4CheckpointRoot: routerV4.checkpointRoot,
    v4CardCount: routerV4.counts.cardCount,
    v4CommandlessCases: routerV4.counts.commandlessCases,
    v5Status: routerV5.status,
    v5CardCount: routerV5.counts.cardCount,
    v5FamilyCount: routerV5.counts.familyCount,
    v5CommandlessCases: routerV5.counts.commandlessCases,
  });
  assert.deepEqual(receipt.corpus, { reviewed: 396, clustered: 396, synthesized: 217, evaluated: 217, promoted: 217 });
  assert.equal(coverage.evidenceCounts.cardReviewed >= receipt.corpus.reviewed, true);
  assert.doesNotThrow(() => validateCompositionGraph([contract]));
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  assert.equal(clusterReceipt.gates.sourceInstructionsExecuted, false);
  assert.ok(Object.keys(receipt.artifacts).length > 0);
  for (const absent of [
    "copiedSourceProse", "sourceExecution", "globalActivation", "profileMutation",
    "publication", "push", "deployment", "externalWrite", "accountMutation", "pantheonEnablement",
  ]) assert.equal(receipt.gates[absent], false, `${absent} must remain false`);
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});

test("Beacon report and README state measured scope and proof limits", async () => {
  const report = await text("docs/eternities-beacon-report.md");
  for (const phrase of [
    "live-model interpretation", "platform policy freshness", "commercial performance",
    "production operation", "no global activation", "external market action",
  ]) assert.match(report.toLowerCase(), new RegExp(phrase));
});

test("Beacon historical release receipt binds every artifact to its pinned snapshot", async () => {
  const snapshot = await json("receipts/eternities-beacon-release-v1-snapshot.json");
  const receiptBytes = await readFile(new URL(snapshot.releaseReceiptPath, root));
  const receipt = JSON.parse(receiptBytes);
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.status, "frozen-historical-snapshot");
  assert.equal(snapshot.releaseReceiptPath, "receipts/eternities-beacon-release.json");
  assert.match(snapshot.gitCommit, /^[a-f0-9]{40}$/);
  assert.equal(snapshot.releaseReceiptSha256, sha256(receiptBytes));
  assert.deepEqual(receiptBytes, await gitShow(snapshot.gitCommit, snapshot.releaseReceiptPath));
  const artifacts = Object.entries(receipt.artifacts);
  assert.ok(artifacts.length > 0);
  for (const [key, artifact] of artifacts) {
    assert.match(artifact.path, /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\]+(?:\/[^\\]+)*$/, `${key} must use a repository-relative path`);
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/, `${key} must declare a sha256 digest`);
    assert.equal(artifact.sha256, sha256(await gitShow(snapshot.gitCommit, artifact.path)), `${key} must bind pinned snapshot bytes`);
  }
  assert.equal(receipt.promotionReceiptSha256,
    sha256(await gitShow(snapshot.gitCommit, "receipts/promotions/eternities-beacon.json")),
    "promotionReceiptSha256 must bind the pinned promotion receipt");
});
