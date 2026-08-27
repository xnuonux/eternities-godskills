import test from "node:test";
import assert from "node:assert/strict";

import {
  COVERAGE_STAGES,
  buildCoverageRows,
  summarizeCoverage,
} from "../src/coverage.mjs";

function source(overrides = {}) {
  return {
    id: "skill-a",
    name: "Agency Client",
    sourcePath: "catalog\\agency\\SKILL.md",
    contentDigest: "a".repeat(64),
    families: ["agency-client-services"],
    licenseClass: "permissive",
    confidence: "high",
    ...overrides,
  };
}

function body(overrides = {}) {
  return {
    schemaVersion: 1,
    sourceId: "skill-a",
    status: "inspected",
    present: true,
    bodySha256: "b".repeat(64),
    byteSize: 100,
    lineCount: 5,
    ...overrides,
  };
}

test("coverage stages preserve the full evidence progression", () => {
  assert.deepEqual(COVERAGE_STAGES, [
    "indexed",
    "classified",
    "body-inspected",
    "card-reviewed",
    "provenance-certified",
    "clustered",
    "synthesized",
    "evaluated",
    "promoted",
  ]);
});

test("coverage records structural inspection without inventing semantic review", () => {
  const rows = buildCoverageRows([source()], [body()], []);

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].evidence, {
    indexed: true,
    classified: true,
    bodyInspected: true,
    cardReviewed: false,
    provenanceCertified: false,
    clustered: false,
    synthesized: false,
    evaluated: false,
    promoted: false,
  });
  assert.equal(rows[0].bodySha256, "b".repeat(64));
});

test("exact provenance does not fabricate missing review or cluster evidence", () => {
  const rows = buildCoverageRows([source()], [body()], [
    {
      sourceId: "skill-a",
      contentDigest: "a".repeat(64),
      disposition: "independent-implementation",
    },
  ]);

  assert.equal(rows[0].evidence.provenanceCertified, true);
  assert.equal(rows[0].evidence.cardReviewed, false);
  assert.equal(rows[0].evidence.clustered, false);
});

test("coverage fails closed on duplicate sources and stale provenance", () => {
  assert.throws(
    () => buildCoverageRows([source(), source()], [body()], []),
    /duplicate source id: skill-a/,
  );
  assert.throws(
    () =>
      buildCoverageRows([source()], [body()], [
        { sourceId: "skill-a", contentDigest: "c".repeat(64) },
      ]),
    /stale provenance digest for skill-a/,
  );
});

test("coverage summary reconciles every row and evidence count", () => {
  const rows = buildCoverageRows(
    [
      source(),
      source({
        id: "skill-b",
        name: "Unknown",
        sourcePath: "misc\\SKILL.md",
        contentDigest: "c".repeat(64),
        families: ["general"],
      }),
    ],
    [body()],
    [],
  );
  const summary = summarizeCoverage(rows);

  assert.equal(summary.sourceCount, 2);
  assert.equal(summary.evidenceCounts.indexed, 2);
  assert.equal(summary.evidenceCounts.classified, 1);
  assert.equal(summary.evidenceCounts.bodyInspected, 1);
  assert.equal(summary.evidenceCounts.cardReviewed, 0);
  assert.equal(summary.familyCounts["agency-client-services"], 1);
  assert.equal(summary.familyCounts.general, 1);
});
