import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);

async function text(relative) {
  return readFile(new URL(relative, root), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

test("Agora release receipt reconciles the complete local candidate", async () => {
  const receipt = await json("receipts/eternities-agora-release.json");
  const promotionText = await text("receipts/promotions/eternities-agora.json");
  const promotion = JSON.parse(promotionText);
  const routerV1 = await json("receipts/agent-native-router-v1.json");
  const routerV2 = await json("receipts/agent-native-router-v2.json");
  const coverage = await json("artifacts/corpus/coverage-summary.json");
  const promotionNames = (await readdir(new URL("receipts/promotions/", root)))
    .filter((name) => name.endsWith(".json"));
  const promotions = await Promise.all(
    promotionNames.map((name) => json(`receipts/promotions/${name}`)),
  );

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "eternities-agora-release");
  assert.equal(receipt.status, "certified-local-candidate");
  assert.deepEqual(receipt.capabilities, { added: 1, promotedTotal: 8 });
  assert.equal(promotions.filter(({ decision }) => decision?.status === "promoted").length, 8);
  assert.deepEqual(receipt.evidence, {
    selectedClusters: 3,
    selectedSources: 7,
    deferredClusters: 4,
    routes: 3,
    scopesAndModes: 7,
    criticalCasesPassed: 29,
    criticalCasesTotal: 29,
    entrypointTokenCount: 1158,
  });
  assert.equal(receipt.evidence.entrypointTokenCount <= 4000, true);
  assert.equal(promotion.decision.status, "promoted");
  assert.equal(receipt.promotionReceiptSha256, sha256(promotionText));
  assert.deepEqual(receipt.router, {
    v1CheckpointStatus: routerV1.status,
    v1CheckpointRoot: routerV1.checkpointRoot,
    v2Status: routerV2.status,
    v2CardCount: routerV2.counts.cardCount,
  });
  assert.deepEqual(receipt.corpus, {
    clustered: coverage.evidenceCounts.clustered,
    synthesized: coverage.evidenceCounts.synthesized,
    evaluated: coverage.evidenceCounts.evaluated,
    promoted: coverage.evidenceCounts.promoted,
  });
  assert.deepEqual(receipt.corpus, {
    clustered: 12,
    synthesized: 7,
    evaluated: 7,
    promoted: 7,
  });
  assert.equal(receipt.gates.compositionCycles, 0);
  assert.equal(receipt.gates.selfRoute, false);
  for (const absent of [
    "copiedSourceProse",
    "globalActivation",
    "profileMutation",
    "publication",
    "push",
    "deployment",
    "externalWrite",
    "pantheonEnablement",
  ]) {
    assert.equal(receipt.gates[absent], false, `${absent} must remain false`);
  }
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});

test("Agora report and README state the measured scope and proof limits", async () => {
  const [report, readme] = await Promise.all([
    text("docs/eternities-agora-report.md"),
    text("README.md"),
  ]);
  for (const phrase of [
    "live-model interpretation",
    "commercial performance",
    "external evidence freshness",
    "rendered-document correctness",
    "production operation",
    "no global activation",
  ]) {
    assert.match(report.toLowerCase(), new RegExp(phrase));
  }
  assert.match(readme, /8 promoted/i);
  assert.match(readme, /29.*29/);
  assert.match(readme, /7 synthesized.*7 evaluated.*7 promoted/is);
});
