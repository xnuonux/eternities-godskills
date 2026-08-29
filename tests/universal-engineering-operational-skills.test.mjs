import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const records = JSON.parse(fs.readFileSync(new URL("../data/operational-capabilities.v1.json", import.meta.url))).records;
const ids = [
  "api-rate-limit-recovery",
  "bounded-service-shutdown",
  "formula-preserving-workbook-engineering",
  "fp-ts-functional-refactoring",
  "invariant-guard",
  "semantic-implementation-diff",
  "symbolic-mathematics-python",
  "web-performance-optimization",
];

test("the eight engineering delegates are distinct and exact", () => {
  const selected = records.filter((record) => ids.includes(record.id));
  assert.deepEqual(selected.map((record) => record.id).sort(), ids);
  assert.equal(new Set(selected.map((record) => record.intent.toLowerCase())).size, 8);
  assert.equal(new Set(selected.map((record) => record.description.toLowerCase())).size, 8);
});

test("engineering delegates forbid dependency, production, and proof overreach", () => {
  for (const id of ids) {
    const record = records.find((candidate) => candidate.id === id);
    assert.ok(record.forbiddenEffects.includes("dependency-installation"), `${id} dependency boundary`);
    assert.ok(record.forbiddenEffects.includes("production-mutation"), `${id} production boundary`);
    assert.ok(record.forbiddenEffects.includes("formal-proof-claim"), `${id} proof boundary`);
    assert.equal(record.allowedEffects.includes("external-write"), false);
  }
});

test("each engineering delegate exposes mechanism-specific acceptance language", () => {
  const required = new Map([
    ["api-rate-limit-recovery", /rate|retry|backoff/i],
    ["bounded-service-shutdown", /drain|readiness|shutdown/i],
    ["formula-preserving-workbook-engineering", /formula|workbook|recalculation/i],
    ["fp-ts-functional-refactoring", /functional|effect|type/i],
    ["invariant-guard", /invariant|counterexample|oracle/i],
    ["semantic-implementation-diff", /semantic|equivalence|behavior/i],
    ["symbolic-mathematics-python", /symbolic|mathemat|identity/i],
    ["web-performance-optimization", /performance|baseline|metric/i],
  ]);
  for (const [id, pattern] of required) {
    const record = records.find((candidate) => candidate.id === id);
    assert.match([...record.operations, record.terminationCondition].join(" "), pattern);
  }
});
