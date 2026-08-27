import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFamilyQueue,
  buildReviewPackets,
} from "../src/review-packets.mjs";

function source(index, overrides = {}) {
  return {
    id: `skill-${String(index).padStart(3, "0")}`,
    name: `Skill ${index}`,
    description: `Marketing capability ${index}`,
    sourcePath: `repo\\skill-${index}\\SKILL.md`,
    repositoryRoot: "repo",
    remote: "https://github.com/example/repo.git",
    gitHead: "a".repeat(40),
    licenseClass: "permissive",
    confidence: "high",
    contentDigest: String(index).padStart(64, "0"),
    families: ["marketing-growth"],
    ...overrides,
  };
}

function coverage(record, overrides = {}) {
  return {
    schemaVersion: 1,
    sourceId: record.id,
    name: record.name,
    sourcePath: record.sourcePath,
    contentDigest: record.contentDigest,
    families: record.families,
    licenseClass: record.licenseClass,
    confidence: record.confidence,
    bodyStatus: "inspected",
    bodySha256: "b".repeat(64),
    byteSize: 100,
    lineCount: 5,
    evidence: {
      indexed: true,
      classified: true,
      bodyInspected: true,
      cardReviewed: false,
      provenanceCertified: false,
      clustered: false,
      synthesized: false,
      evaluated: false,
      promoted: false,
    },
    ...overrides,
  };
}

function body(record, overrides = {}) {
  return {
    schemaVersion: 1,
    sourceId: record.id,
    status: "inspected",
    present: true,
    bodySha256: "b".repeat(64),
    byteSize: 100,
    lineCount: 5,
    structure: {
      frontmatterName: record.name,
      frontmatterDescription: record.description,
      headings: ["Workflow", "Verification"],
    },
    ...overrides,
  };
}

test("family queue contains exact members and preserves inert structural evidence", () => {
  const marketing = source(1);
  const game = source(2, { families: ["game-design-development"] });
  const queue = buildFamilyQueue(
    "marketing-growth",
    [coverage(marketing), coverage(game)],
    [marketing, game],
    [body(marketing), body(game)],
    { exact: [], aliases: [], candidates: [] },
  );

  assert.equal(queue.sourceCount, 1);
  assert.equal(queue.cards[0].sourceId, marketing.id);
  assert.deepEqual(queue.cards[0].structure.headings, ["Workflow", "Verification"]);
  assert.match(queue.cards[0].inspectedDataNotice, /inspected data/i);
});

test("family queue prioritizes present unreviewed bodies deterministically", () => {
  const present = source(2, { confidence: "medium" });
  const missing = source(1, { confidence: "high" });
  const queue = buildFamilyQueue(
    "marketing-growth",
    [
      coverage(missing, {
        bodyStatus: "missing",
        bodySha256: null,
        evidence: { ...coverage(missing).evidence, bodyInspected: false },
      }),
      coverage(present),
    ],
    [missing, present],
    [body(present), body(missing, { status: "missing", present: false, structure: null })],
    { exact: [], aliases: [], candidates: [] },
  );

  assert.deepEqual(queue.cards.map(({ sourceId }) => sourceId), [present.id, missing.id]);
});

test("review packets are bounded, lossless, unique, and byte-stable", () => {
  const sources = Array.from({ length: 26 }, (_, index) => source(index + 1));
  const queue = buildFamilyQueue(
    "marketing-growth",
    sources.map((row) => coverage(row)),
    sources,
    sources.map((row) => body(row)),
    { exact: [], aliases: [], candidates: [] },
  );
  const first = buildReviewPackets(queue);
  const second = buildReviewPackets(queue);

  assert.deepEqual(first.map(({ cards }) => cards.length), [25, 1]);
  assert.equal(new Set(first.flatMap(({ cards }) => cards.map(({ sourceId }) => sourceId))).size, 26);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.throws(() => buildReviewPackets(queue, { maxCards: 26 }), /at most 25/);
});
