import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";
import { validateCompositionGraph } from "../src/composition.mjs";

const root = new URL("../", import.meta.url);
async function text(relative) { return readFile(new URL(relative, root), "utf8"); }
async function json(relative) { return JSON.parse(await text(relative)); }

test("Chorus release receipt reconciles every local certification boundary", async () => {
  const [receipt, clusterBatch, clusterReceipt, promotionText, promotion, contract, routerV3, routerV4, coverage] = await Promise.all([
    json("receipts/eternities-chorus-release.json"),
    json("clusters/social-media-community.v1.json"),
    json("receipts/social-media-community-clusters-v1.json"),
    text("receipts/promotions/eternities-chorus.json"),
    json("receipts/promotions/eternities-chorus.json"),
    json("skills/eternities-chorus/references/capability-contract.json"),
    json("receipts/agent-native-router-v3.json"),
    json("receipts/agent-native-router-v4.json"),
    json("artifacts/corpus/coverage-summary.json"),
  ]);
  const reviewWaves = await Promise.all(Array.from({ length: 6 }, (_, index) =>
    json(`reviews/waves/social-media-community/wave-${String(index + 1).padStart(3, "0")}.json`)));
  const reviewIds = reviewWaves.flatMap(({ reviews }) => reviews.map(({ sourceId }) => sourceId));
  const byDecision = (decision) => clusterBatch.clusters.filter(({ synthesisDecision }) => synthesisDecision === decision);
  const sourcesFor = (decision) => byDecision(decision).flatMap(({ members }) => members);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "eternities-chorus-release");
  assert.equal(receipt.status, "certified-local-candidate");
  assert.deepEqual(receipt.capabilities, { added: 1, promotedTotal: 10 });
  assert.equal(receipt.capabilities.promotedTotal, routerV4.counts.cardCount);
  assert.equal(reviewIds.length, 106);
  assert.equal(new Set(reviewIds).size, 106);
  const clusteredIds = clusterBatch.clusters.flatMap(({ members }) => members.map(({ sourceId }) => sourceId));
  assert.deepEqual([...clusteredIds].sort(), [...reviewIds].sort());
  assert.deepEqual(receipt.evidence, {
    reviewedSources: 106,
    clusters: 13,
    selectedClusters: 4,
    selectedSources: 47,
    deferredClusters: 5,
    deferredSources: 46,
    rejectedClusters: 4,
    rejectedSources: 13,
    routes: 4,
    criticalCasesPassed: 43,
    criticalCasesTotal: 43,
    entrypointTokenCount: 1502,
  });
  assert.equal(receipt.evidence.selectedSources + receipt.evidence.deferredSources + receipt.evidence.rejectedSources, 106);
  assert.equal(byDecision("candidate").length, receipt.evidence.selectedClusters);
  assert.equal(sourcesFor("candidate").length, receipt.evidence.selectedSources);
  assert.equal(byDecision("deferred").length, receipt.evidence.deferredClusters);
  assert.equal(sourcesFor("deferred").length, receipt.evidence.deferredSources);
  assert.equal(byDecision("rejected").length, receipt.evidence.rejectedClusters);
  assert.equal(sourcesFor("rejected").length, receipt.evidence.rejectedSources);
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "identity-and-channel-strategy",
    "editorial-production",
    "community-operations",
    "measurement-and-stewardship",
  ]);
  assert.equal(receipt.evidence.entrypointTokenCount <= 4000, true);
  assert.equal(promotion.decision.status, "promoted");
  assert.equal(promotion.candidate.criticalPassed, 43);
  assert.equal(promotion.candidate.criticalTotal, 43);
  assert.deepEqual(promotion.candidate.unresolvedEffects, []);
  assert.equal(receipt.promotionReceiptSha256, sha256(promotionText));

  assert.equal(routerV3.status, "certified");
  assert.equal(routerV3.checkpointRoot, "artifacts/checkpoints/agent-native-router-v3");
  for (const [name, file] of [["cardsSha256", "cards.jsonl"], ["familyMapSha256", "family-map.json"], ["manifestSha256", "manifest.json"]]) {
    assert.equal(routerV3.artifacts[name], sha256(await text(`${routerV3.checkpointRoot}/${file}`)));
  }
  assert.equal(routerV4.status, "certified");
  assert.deepEqual(routerV4.counts, {
    aliasRemovalCases: 30, cardCount: 10, commandlessCases: 30,
    familyCount: 10, maximumComposition: 3, maximumShortlist: 32,
  });
  assert.deepEqual(receipt.router, {
    v3CheckpointStatus: routerV3.status,
    v3CheckpointRoot: routerV3.checkpointRoot,
    v4Status: routerV4.status,
    v4CardCount: routerV4.counts.cardCount,
    v4FamilyCount: routerV4.counts.familyCount,
  });
  assert.deepEqual(receipt.corpus, { reviewed: 145, clustered: 143, synthesized: 74, evaluated: 74, promoted: 74 });
  assert.deepEqual(receipt.corpus, {
    reviewed: coverage.evidenceCounts.cardReviewed,
    clustered: coverage.evidenceCounts.clustered,
    synthesized: coverage.evidenceCounts.synthesized,
    evaluated: coverage.evidenceCounts.evaluated,
    promoted: coverage.evidenceCounts.promoted,
  });
  assert.doesNotThrow(() => validateCompositionGraph([contract]));
  assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
  assert.equal(receipt.gates.compositionCycles, 0);
  assert.equal(receipt.gates.selfRoute, false);
  assert.equal(clusterReceipt.gates.sourceInstructionsExecuted, false);
  assert.ok(receipt.artifacts.reviewEvidence);
  assert.ok(receipt.artifacts.clusterEvidence);
  for (const artifact of Object.values(receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await text(artifact.path)), artifact.path);
  }
  for (const absent of [
    "copiedSourceProse", "sourceExecution", "globalActivation", "profileMutation",
    "publication", "push", "deployment", "externalWrite", "accountMutation", "pantheonEnablement",
  ]) assert.equal(receipt.gates[absent], false, `${absent} must remain false`);
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});

test("Chorus report and README state measured scope and proof limits", async () => {
  const [report, readme] = await Promise.all([
    text("docs/eternities-chorus-report.md"),
    text("README.md"),
  ]);
  for (const phrase of [
    "live-model interpretation", "platform policy freshness", "commercial performance",
    "human moderation", "production operation", "no global activation",
  ]) assert.match(report.toLowerCase(), new RegExp(phrase));
  assert.match(readme, /Chorus passes 43 of 43/i);
  assert.match(readme, /47 exact sources/i);
  assert.match(readme, /74 synthesized.*74 evaluated.*74 promoted/is);
  assert.match(readme, /router v4.*10 promoted capabilities/is);
});
