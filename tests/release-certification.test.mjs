import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);

async function text(relative) {
  return readFile(new URL(relative, root), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

async function canonicalTextSha256(relative) {
  return sha256((await text(relative)).replaceAll("\r\n", "\n"));
}

test("release one certification reconciles every critical receipt and scope boundary", async () => {
  const [
    certification,
    starManifest,
    starReceipt,
    indexReceipt,
    ontology,
    refinery,
    oracle,
    profile,
  ] = await Promise.all([
    json("receipts/release-one-certification.json"),
    json("data/star-delta-2026-08-26.json"),
    json("receipts/star-sync-2026-08-26.json"),
    json("receipts/cold-index-refresh-2026-08-26.json"),
    json("artifacts/release-one/ontology-summary.json"),
    json("receipts/promotions/sovereign-skill-refinery.json"),
    json("receipts/promotions/eternities-oracle.json"),
    json("receipts/profile-eternities-core.json"),
  ]);

  assert.equal(certification.schemaVersion, 1);
  assert.equal(certification.status, "certified");
  assert.deepEqual(certification.criticalFailures, []);
  assert.equal(certification.scope.corpusWideRefinement, false);

  const expectedRepositories = starManifest.entries.map(({ fullName }) =>
    fullName.toLowerCase(),
  );
  assert.equal(starReceipt.complete, true);
  assert.equal(starReceipt.rows.length, expectedRepositories.length);
  assert.deepEqual(
    starReceipt.rows.map(({ identity }) => identity).sort(),
    expectedRepositories.sort(),
  );
  assert.equal(certification.repositories.total, starReceipt.rows.length);
  assert.equal(certification.repositories.failed, 0);

  assert.equal(indexReceipt.after.entryCount, 4741);
  assert.equal(ontology.sourceCount, 4741);
  assert.equal(certification.catalog.indexSha256, indexReceipt.after.skillIndexSha256);
  assert.equal(certification.catalog.sourceRecordsSha256, ontology.sourceRecordsSha256);
  assert.equal(certification.catalog.duplicateGroupsSha256, ontology.duplicateGroupsSha256);
  assert.deepEqual(certification.catalog.duplicateGroupCounts, ontology.duplicateGroupCounts);

  assert.equal(refinery.decision.status, "promoted");
  assert.equal(oracle.decision.status, "promoted");
  assert.equal(
    certification.promotions.refinery.receiptSha256,
    await canonicalTextSha256("receipts/promotions/sovereign-skill-refinery.json"),
  );
  assert.equal(
    certification.promotions.oracle.receiptSha256,
    await canonicalTextSha256("receipts/promotions/eternities-oracle.json"),
  );
  assert.equal(certification.promotions.refinery.tokenCount, refinery.evidence.measuredTokenCount);
  assert.equal(certification.promotions.oracle.tokenCount, oracle.evidence.measuredTokenCount);

  assert.equal(profile.verification.valid, true);
  assert.deepEqual(
    certification.profile.activeSkills,
    profile.links.map(({ name }) => name),
  );
  assert.equal(
    certification.profile.receiptSha256,
    await canonicalTextSha256("receipts/profile-eternities-core.json"),
  );
  assert.equal(certification.profile.pantheonDiscoverable, false);
  assert.ok(profile.links.every(({ createdByProfile }) => createdByProfile));

  assert.equal(certification.verification.testTotal, 57);
  assert.equal(certification.verification.testFailures, 0);
  assert.ok(certification.remainingUncertainty.length > 0);
});
