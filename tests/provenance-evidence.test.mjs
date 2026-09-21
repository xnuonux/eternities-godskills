import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveColdIntakeSourceEvidence,
  deriveSourceEvidence,
} from "../src/provenance-evidence.mjs";

const contract = {
  sourceIds: ["source-a", "source-b"],
};

const ledger = [
  { sourceId: "source-a", contentDigest: "a", proseCopied: false },
  { sourceId: "source-b", contentDigest: "b", proseCopied: false },
];

test("source coverage is derived from exact contract and ledger rows", () => {
  assert.deepEqual(deriveSourceEvidence(contract, ledger), {
    sourceCoverage: 2,
    sourceIds: ["source-a", "source-b"],
    proseCopied: false,
  });
});

test("source evidence fails closed when a contract source is absent", () => {
  assert.throws(
    () => deriveSourceEvidence(contract, ledger.slice(0, 1)),
    /missing provenance row: source-b/i,
  );
});

test("source evidence rejects duplicate provenance rows", () => {
  assert.throws(
    () => deriveSourceEvidence(contract, [...ledger, ledger[0]]),
    /duplicate provenance row: source-a/i,
  );
});

test("source evidence exposes copied prose instead of certifying it away", () => {
  const copied = ledger.map((row) =>
    row.sourceId === "source-b" ? { ...row, proseCopied: true } : row,
  );
  assert.equal(deriveSourceEvidence(contract, copied).proseCopied, true);
});

const intakeHash = "f".repeat(64);
const bodyA = "a".repeat(64);
const bodyB = "b".repeat(64);
const coldContract = {
  sourceIds: ["cold-a", "cold-b"],
  sourceEvidence: {
    mode: "cold-intake-v1",
    intakeDirectory: "quarry-intake-example",
    sourcesJsonlSha256: intakeHash,
    sources: [
      {
        sourceId: "cold-a",
        bodySha256: bodyA,
        disposition: "independent-implementation",
        proseCopied: false,
      },
      {
        sourceId: "cold-b",
        bodySha256: bodyB,
        disposition: "pattern-reference",
        proseCopied: false,
      },
    ],
  },
};
const coldManifest = {
  schemaVersion: 1,
  status: "cold-unreviewed",
  activation: "none",
  counts: { sourceRecords: 2 },
  outputs: { sourcesJsonlSha256: intakeHash },
};
const coldRows = [
  {
    sourceId: "cold-a",
    bodySha256: bodyA,
    reviewStatus: "cold-unreviewed",
    activation: "none",
  },
  {
    sourceId: "cold-b",
    bodySha256: bodyB,
    reviewStatus: "cold-unreviewed",
    activation: "none",
  },
];

test("cold intake evidence binds exact manifest, source file, identities, and body hashes", () => {
  assert.deepEqual(
    deriveColdIntakeSourceEvidence(coldContract, coldRows, {
      manifest: coldManifest,
      sourcesJsonlSha256: intakeHash,
    }),
    {
      sourceCoverage: 2,
      sourceIds: ["cold-a", "cold-b"],
      proseCopied: false,
      sourceEvidenceMode: "cold-intake-v1",
      intakeDirectory: "quarry-intake-example",
      sourcesJsonlSha256: intakeHash,
    },
  );
});

test("cold intake evidence fails closed on stale files, changed bodies, or active inputs", () => {
  const evaluate = (contract = coldContract, rows = coldRows, manifest = coldManifest, hash = intakeHash) =>
    deriveColdIntakeSourceEvidence(contract, rows, {
      manifest,
      sourcesJsonlSha256: hash,
    });

  assert.throws(() => evaluate(coldContract, coldRows, coldManifest, "0".repeat(64)), /source file hash/i);
  assert.throws(
    () => evaluate(coldContract, [{ ...coldRows[0], bodySha256: "0".repeat(64) }, coldRows[1]]),
    /body hash mismatch/i,
  );
  assert.throws(
    () => evaluate(coldContract, [{ ...coldRows[0], activation: "enabled" }, coldRows[1]]),
    /activation/i,
  );
  assert.throws(
    () => evaluate(coldContract, coldRows, { ...coldManifest, status: "promoted" }),
    /cold-unreviewed/i,
  );
});

test("cold intake evidence rejects undeclared rows, copied prose, and unsafe intake paths", () => {
  const evaluate = (contract) =>
    deriveColdIntakeSourceEvidence(contract, coldRows, {
      manifest: coldManifest,
      sourcesJsonlSha256: intakeHash,
    });

  assert.throws(
    () => evaluate({
      ...coldContract,
      sourceEvidence: {
        ...coldContract.sourceEvidence,
        sources: coldContract.sourceEvidence.sources.slice(0, 1),
      },
    }),
    /source declaration union/i,
  );
  assert.throws(
    () => evaluate({
      ...coldContract,
      sourceEvidence: {
        ...coldContract.sourceEvidence,
        sources: [
          { ...coldContract.sourceEvidence.sources[0], proseCopied: true },
          coldContract.sourceEvidence.sources[1],
        ],
      },
    }),
    /copied prose/i,
  );
  assert.throws(
    () => evaluate({
      ...coldContract,
      sourceEvidence: { ...coldContract.sourceEvidence, intakeDirectory: "../escape" },
    }),
    /intake directory/i,
  );
});
