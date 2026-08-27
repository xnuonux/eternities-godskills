import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
async function text(relative) { return readFile(new URL(relative, root), "utf8"); }
async function json(relative) { return JSON.parse(await text(relative)); }

test("Arcadia release receipt reconciles the complete local candidate", async () => {
  const [receipt, promotionText, routerV2, routerV3, coverage] = await Promise.all([
    json("receipts/eternities-arcadia-release.json"),
    text("receipts/promotions/eternities-arcadia.json"),
    json("receipts/agent-native-router-v2.json"),
    json("receipts/agent-native-router-v3.json"),
    json("artifacts/checkpoints/eternities-arcadia-release-v1/coverage-summary.json"),
  ]);
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "eternities-arcadia-release");
  assert.equal(receipt.status, "certified-local-candidate");
  assert.deepEqual(receipt.capabilities, { added: 1, promotedTotal: 9 });
  assert.equal(routerV3.counts.cardCount, receipt.capabilities.promotedTotal);
  assert.deepEqual(receipt.evidence, {
    reviewedSources: 25,
    selectedClusters: 4,
    selectedSources: 20,
    deferredClusters: 3,
    deferredSources: 4,
    rejectedClusters: 1,
    rejectedSources: 1,
    routes: 4,
    criticalCasesPassed: 41,
    criticalCasesTotal: 41,
    entrypointTokenCount: 1417,
  });
  assert.equal(receipt.promotionReceiptSha256, sha256(promotionText));
  for (const artifact of Object.values(receipt.artifacts)) {
    assert.equal(artifact.sha256, sha256(await text(artifact.path)), artifact.path);
  }
  assert.deepEqual(receipt.router, {
    v2CheckpointStatus: routerV2.status,
    v2CheckpointRoot: routerV2.checkpointRoot,
    v3Status: routerV3.status,
    v3CardCount: routerV3.counts.cardCount,
  });
  assert.deepEqual(receipt.corpus, {
    clustered: coverage.evidenceCounts.clustered,
    synthesized: coverage.evidenceCounts.synthesized,
    evaluated: coverage.evidenceCounts.evaluated,
    promoted: coverage.evidenceCounts.promoted,
  });
  assert.deepEqual(receipt.corpus, { clustered: 37, synthesized: 27, evaluated: 27, promoted: 27 });
  assert.equal(receipt.gates.compositionCycles, 0);
  assert.equal(receipt.gates.selfRoute, false);
  for (const absent of [
    "copiedSourceProse", "sourceExecution", "globalActivation", "profileMutation",
    "publication", "push", "deployment", "externalWrite", "pantheonEnablement",
  ]) assert.equal(receipt.gates[absent], false, `${absent} must remain false`);
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});

test("Arcadia report and README state measured scope and proof limits", async () => {
  const [report, readme] = await Promise.all([text("docs/eternities-arcadia-report.md"), text("README.md")]);
  for (const phrase of [
    "live-model interpretation", "game quality", "commercial performance", "external evidence freshness",
    "representative-device reliability", "production operation", "no global activation",
  ]) assert.match(report.toLowerCase(), new RegExp(phrase));
  assert.match(readme, /routing v3 is frozen\s+for nine capabilities/i);
  assert.match(readme, /Arcadia passes 41 of 41/i);
  assert.match(readme, /Arcadia[\s\S]*20 exact sources/i);
  assert.match(readme, /Agora's[\s\S]*7[\s\S]*Arcadia's 20[\s\S]*Chorus's 47/i);
});
