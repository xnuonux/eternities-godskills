import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { assignCorpusOwners } from "../src/corpus-ownership.mjs";
import { classify } from "../src/ontology.mjs";

const root = new URL("../", import.meta.url);
async function lines(relative) {
  return (await readFile(new URL(relative, root), "utf8"))
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

test("existing validated review ownership wins and secondary families remain evidence", () => {
  const records = [
    { id: "skill-b", families: ["agent-orchestration", "implementation-engineering"] },
    { id: "skill-a", families: ["marketing-growth", "writing-narrative-canon"] },
    { id: "skill-c", families: ["general"] },
  ];
  const rows = assignCorpusOwners(records, [
    { sourceId: "skill-a", familyId: "social-media-community" },
  ]);
  assert.deepEqual(rows, [
    {
      schemaVersion: 1,
      sourceId: "skill-a",
      ownerFamily: "social-media-community",
      secondaryFamilies: ["marketing-growth", "writing-narrative-canon"],
      ownershipBasis: "existing-review",
      reviewed: true,
    },
    {
      schemaVersion: 1,
      sourceId: "skill-b",
      ownerFamily: "agent-orchestration",
      secondaryFamilies: ["implementation-engineering"],
      ownershipBasis: "classifier-primary",
      reviewed: false,
    },
    {
      schemaVersion: 1,
      sourceId: "skill-c",
      ownerFamily: "general",
      secondaryFamilies: [],
      ownershipBasis: "classifier-primary",
      reviewed: false,
    },
  ]);
});

test("ownership rejects duplicate or orphan evidence", () => {
  const record = { id: "skill-a", families: ["implementation-engineering"] };
  assert.throws(() => assignCorpusOwners([record, record], []), /duplicate source/i);
  assert.throws(() => assignCorpusOwners([record], [
    { sourceId: "skill-a", familyId: "implementation-engineering" },
    { sourceId: "skill-a", familyId: "implementation-engineering" },
  ]), /duplicate review/i);
  assert.throws(() => assignCorpusOwners([record], [
    { sourceId: "missing", familyId: "implementation-engineering" },
  ]), /unknown source/i);
});

test("repository ownership partitions all certified sources exactly once", async () => {
  const [rawRecords, reviews, ontology] = await Promise.all([
    lines("artifacts/release-one/source-records.jsonl"),
    lines("artifacts/corpus/review-evidence.jsonl"),
    readFile(new URL("data/ontology.v1.json", root), "utf8").then(JSON.parse),
  ]);
  const records = rawRecords.map((record) => ({ ...record, families: classify(record, ontology) }));
  const rows = assignCorpusOwners(records, reviews);
  assert.equal(rows.length, 4741);
  assert.equal(new Set(rows.map(({ sourceId }) => sourceId)).size, 4741);
  assert.equal(rows.filter(({ reviewed }) => reviewed).length, 396);
  assert.equal(rows.filter(({ reviewed }) => !reviewed).length, 4345);
  assert.deepEqual(
    Object.fromEntries(Object.entries(Object.groupBy(rows, ({ ownerFamily }) => ownerFamily))
      .map(([family, members]) => [family, members.length]).sort()),
    {
      "agency-client-services": 12,
      "agent-orchestration": 1784,
      "architecture-specification": 82,
      "audio-voice-media": 58,
      "automation-mcp-integrations": 40,
      "data-infrastructure": 37,
      "debugging-recovery": 129,
      "game-design-development": 25,
      "general": 861,
      "governance-security": 76,
      "implementation-engineering": 67,
      "knowledge-memory-context": 286,
      "marketing-growth": 253,
      "product-operations": 47,
      "release-publishing": 31,
      "repository-source-research": 249,
      "social-media-community": 106,
      "verification-evidence": 288,
      "visual-3d-motion": 154,
      "web-interface-accessibility": 100,
      "writing-narrative-canon": 56,
    },
  );
});

test("generated owner queues are disjoint and cover the ownership manifest", async () => {
  const [ownership, summary] = await Promise.all([
    lines("artifacts/corpus/ownership.jsonl"),
    readFile(new URL("artifacts/corpus/coverage-summary.json", root), "utf8").then(JSON.parse),
  ]);
  const queues = await Promise.all(Object.keys(summary.ownerQueues).map(async (familyId) => ({
    familyId,
    queue: await readFile(new URL(`artifacts/corpus/owners/${familyId}/queue.json`, root), "utf8").then(JSON.parse),
  })));
  const queued = queues.flatMap(({ familyId, queue }) => {
    assert.equal(queue.familyId, familyId);
    assert.equal(queue.sourceCount, summary.ownerQueues[familyId].sourceCount);
    return queue.cards.map(({ sourceId, ownerFamily }) => ({ sourceId, ownerFamily }));
  });
  assert.equal(queued.length, 4741);
  assert.equal(new Set(queued.map(({ sourceId }) => sourceId)).size, 4741);
  assert.deepEqual(
    queued.sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
    ownership.map(({ sourceId, ownerFamily }) => ({ sourceId, ownerFamily })),
  );
});
