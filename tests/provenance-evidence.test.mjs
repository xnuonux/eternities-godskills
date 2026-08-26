import test from "node:test";
import assert from "node:assert/strict";

import { deriveSourceEvidence } from "../src/provenance-evidence.mjs";

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
