import assert from "node:assert/strict";
import test from "node:test";

import { buildExaColdIntake } from "../src/exa-cold-intake.mjs";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const BLOB_A = "1".repeat(40);
const BLOB_B = "2".repeat(40);

function source(overrides = {}) {
  return {
    sourceId: "owner/repo@abc:skills/a/SKILL.md",
    repository: "owner/repo",
    originalCandidate: "owner/repo",
    destination: "D:\\warehouse\\owner__repo",
    origin: "https://github.com/owner/repo.git",
    commit: "abc",
    path: "skills/a/SKILL.md",
    gitBlob: BLOB_A,
    bodySha256: HASH_A,
    bytes: 123,
    name: "a",
    description: "Does A",
    licenseHint: "MIT",
    licenseName: "MIT License",
    reviewStatus: "cold-unreviewed",
    activation: "none",
    sourceKind: "exa-jev-proposal",
    ...overrides,
  };
}

function fixture(overrides = {}) {
  return {
    sourceEnvelope: {
      schemaVersion: 1,
      status: "cold-unreviewed",
      activation: "none",
      exactSourceMethod: "tracked-skill-files",
      count: 2,
      uniqueBodyHashes: 2,
      records: [
        source(),
        source({
          sourceId: "other/repo@def:SKILL.md",
          repository: "other/repo",
          originalCandidate: "other/repo",
          destination: "D:\\warehouse\\other__repo",
          origin: "https://github.com/other/repo.git",
          commit: "def",
          path: "SKILL.md",
          gitBlob: BLOB_B,
          bodySha256: HASH_B,
          bytes: 456,
          name: "other",
        }),
      ],
      errors: [],
    },
    integrationReceipt: {
      schemaVersion: 1,
      status: "integrated",
      operation: "exa-jev-skill-acquisition-2026-09-20",
      activation: "none",
      semanticReview: "cold-unreviewed",
      additiveOnly: true,
      additions: {
        rows: 3,
        sourceRecords: 2,
        uniqueBodyHashes: 2,
      },
      boundaries: {
        upstreamCodeExecuted: false,
        providerCallsDuringIntegration: 0,
        sourceBodiesActivated: false,
        qualityCertified: false,
      },
    },
    sourceEnvelopeSha256: "c".repeat(64),
    integrationReceiptSha256: "d".repeat(64),
    expectedSourceEnvelopeSha256: "c".repeat(64),
    expectedIntegrationReceiptSha256: "d".repeat(64),
    ...overrides,
  };
}

test("builds a deterministic inert intake from exact acquired source records", () => {
  const result = buildExaColdIntake(fixture());

  assert.equal(result.records.length, 2);
  assert.equal(result.manifest.status, "cold-unreviewed");
  assert.equal(result.manifest.activation, "none");
  assert.equal(result.manifest.counts.sourceRecords, 2);
  assert.equal(result.manifest.counts.acquiredRepositories, 3);
  assert.equal(result.manifest.counts.sourceBearingRepositories, 2);
  assert.equal(result.manifest.counts.uniqueBodyHashes, 2);
  assert.equal(result.manifest.boundaries.upstreamCodeExecuted, false);
  assert.equal(result.manifest.boundaries.qualityCertified, false);
  assert.deepEqual(result.records.map(({ sourceId }) => sourceId), [
    "other/repo@def:SKILL.md",
    "owner/repo@abc:skills/a/SKILL.md",
  ]);
  assert.equal(result.jsonl, `${result.records.map((row) => JSON.stringify(row)).join("\n")}\n`);
});

test("rejects activated, duplicated, malformed, or unbound source records", () => {
  const cases = [
    ["activated envelope", fixture({ sourceEnvelope: { ...fixture().sourceEnvelope, activation: "apply" } })],
    ["activated source", (() => {
      const value = fixture();
      value.sourceEnvelope.records[0] = source({ activation: "apply" });
      return value;
    })()],
    ["duplicate source", (() => {
      const value = fixture();
      value.sourceEnvelope.records[1] = { ...value.sourceEnvelope.records[0] };
      return value;
    })()],
    ["invalid body hash", (() => {
      const value = fixture();
      value.sourceEnvelope.records[0] = source({ bodySha256: "not-a-hash" });
      return value;
    })()],
    ["unintegrated receipt", fixture({ integrationReceipt: { ...fixture().integrationReceipt, status: "dry-run-verified" } })],
    ["untrusted source envelope", fixture({ sourceEnvelopeSha256: "e".repeat(64) })],
  ];

  for (const [name, value] of cases) {
    assert.throws(() => buildExaColdIntake(value), Error, name);
  }
});
