import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { canonicalText, sha256 } from "../src/io.mjs";

const root = new URL("../", import.meta.url);
const foundationRoot = "artifacts/checkpoints/corpus-refinery-foundation";

async function text(relative) {
  return readFile(new URL(relative, root), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

function jsonLines(value) {
  return value.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

test("corpus refinery foundation certifies honest all-source coverage", async () => {
  const [certification, summary, bodyText, coverageText, reviewText, packageJson, readme] =
    await Promise.all([
      json("receipts/corpus-refinery-foundation.json"),
      json(`${foundationRoot}/coverage-summary.json`),
      text(`${foundationRoot}/body-evidence.jsonl`),
      text(`${foundationRoot}/coverage-ledger.jsonl`),
      text(`${foundationRoot}/review-evidence.jsonl`),
      json("package.json"),
      text("README.md"),
    ]);
  const bodies = jsonLines(bodyText);
  const coverage = jsonLines(coverageText);
  const reviews = jsonLines(reviewText);

  assert.equal(packageJson.name, "@eternities/skills");
  // Current product branding; the historical foundation receipts below remain frozen.
  assert.match(readme, /^# Eternities Godskills$/m);
  assert.equal(certification.schemaVersion, 1);
  assert.equal(certification.status, "certified-foundation");
  assert.deepEqual(certification.criticalFailures, []);

  assert.equal(summary.sourceCount, 4741);
  assert.equal(bodies.length, 4741);
  assert.equal(coverage.length, 4741);
  assert.equal(new Set(bodies.map(({ sourceId }) => sourceId)).size, 4741);
  assert.equal(new Set(coverage.map(({ sourceId }) => sourceId)).size, 4741);
  assert.ok(bodies.every(({ status, present, bodySha256 }) =>
    status === "inspected" && present === true && /^[0-9a-f]{64}$/.test(bodySha256),
  ));
  assert.deepEqual(summary.bodyStatusCounts, {
    inspected: 4741,
    missing: 0,
    unreadable: 0,
  });

  assert.equal(reviews.length, 10);
  assert.equal(summary.evidenceCounts.cardReviewed, reviews.length);
  assert.equal(summary.evidenceCounts.provenanceCertified, 30);
  assert.equal(summary.evidenceCounts.clustered, 0);
  assert.equal(summary.evidenceCounts.synthesized, 0);
  assert.equal(summary.evidenceCounts.evaluated, 0);
  assert.equal(summary.evidenceCounts.promoted, 0);
  assert.ok(reviews.every(({ promotionClaim, copiedSourceProse }) =>
    promotionClaim === false && copiedSourceProse === false,
  ));

  const expectedQueues = {
    "agency-client-services": 12,
    "marketing-growth": 291,
    "social-media-community": 106,
    "game-design-development": 25,
  };
  for (const [familyId, sourceCount] of Object.entries(expectedQueues)) {
    const queue = await json(`${foundationRoot}/families/${familyId}/queue.json`);
    assert.equal(queue.sourceCount, sourceCount);
    assert.equal(queue.cards.length, sourceCount);
    assert.ok(queue.cards.every((card) => card.families.includes(familyId)));
    const packetCount = summary.reviewQueues[familyId].packetCount;
    const packetCards = [];
    for (let sequence = 1; sequence <= packetCount; sequence += 1) {
      const packet = await json(
        `${foundationRoot}/families/${familyId}/packets/${String(sequence).padStart(3, "0")}.json`,
      );
      assert.ok(packet.cards.length >= 1 && packet.cards.length <= 25);
      packetCards.push(...packet.cards);
    }
    assert.deepEqual(
      packetCards.map(({ sourceId }) => sourceId),
      queue.cards.map(({ sourceId }) => sourceId),
    );
  }

  assert.equal(summary.artifactDigests.bodyEvidenceSha256, sha256(bodyText));
  assert.equal(summary.artifactDigests.coverageLedgerSha256, sha256(coverageText));
  assert.equal(summary.artifactDigests.reviewEvidenceSha256, sha256(reviewText));
  assert.equal(certification.coverage.sourceCount, summary.sourceCount);
  assert.equal(certification.coverage.bodyInspected, summary.evidenceCounts.bodyInspected);
  assert.equal(certification.coverage.cardReviewed, summary.evidenceCounts.cardReviewed);
  assert.equal(
    certification.artifacts.coverageSummarySha256,
    sha256(canonicalText(await text(`${foundationRoot}/coverage-summary.json`))),
  );
  assert.equal(certification.scope.globalActivationChanged, false);
  assert.equal(certification.scope.thirdPartyCodeExecuted, false);
  assert.equal(certification.scope.corpusRefinementComplete, false);
  assert.ok(certification.remainingUncertainty.length > 0);
});
