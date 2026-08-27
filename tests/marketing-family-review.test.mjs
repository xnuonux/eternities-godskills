import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { validateReviewBatch } from "../src/reviews.mjs";

const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function jsonLines(relative) {
  const value = await readFile(new URL(relative, root), "utf8");
  return value.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function waveName(index) {
  return `marketing-growth-wave-${String(index).padStart(3, "0")}`;
}

test("every exact marketing and growth source has one bounded semantic review", async () => {
  const [queue, bodies, files] = await Promise.all([
    json("artifacts/corpus/families/marketing-growth/queue.json"),
    jsonLines("artifacts/corpus/body-evidence.jsonl"),
    readdir(new URL("../reviews/waves/marketing-growth/", import.meta.url)),
  ]);
  const sources = queue.cards.map((card) => ({
    id: card.sourceId,
    description: card.description,
    families: card.families,
  }));
  const batches = [];
  const reviews = [];
  for (const file of files.filter((name) => name.endsWith(".json")).sort()) {
    const batch = await json(`reviews/waves/marketing-growth/${file}`);
    batches.push(batch);
    reviews.push(...validateReviewBatch(batch, sources, bodies));
  }
  const queueIds = queue.cards.map(({ sourceId }) => sourceId).sort();

  const forbiddenBoilerplate = [
    "analyze the source's documented",
    "as a bounded marketing capability",
    "inspect the documented",
    "organize findings into a reusable bounded workflow",
    "evidence-aware findings, prioritization, and limitations",
    "authorized output format and portability requirements",
    "to a defined marketing or growth decision",
    "the task context and prerequisites named in",
    "work through its",
    "result grounded in the source's",
    "may depend on stale assumptions or specialized tooling",
    "as a bounded marketing workflow centered on",
    "producing an auditable decision or draft without assuming authority",
    "prepare a bounded",
    "choose the next",
    "without executing an external change",
    "produce an outcome for",
    "fits the stated need",
    "expected result:",
    "findings and implementation handoff",
  ];
  for (const review of reviews) {
    const semanticText = [
      review.neutralCapabilitySummary,
      ...review.neutralIntentExamples,
      ...review.inputs,
      ...review.operations,
      ...review.outputs,
    ].join("\n").toLowerCase();
    for (const phrase of forbiddenBoilerplate) {
      assert.equal(
        semanticText.includes(phrase),
        false,
        `${review.sourceId} contains generic review boilerplate: ${phrase}`,
      );
    }
  }

  assert.equal(reviews.length, 291);
  assert.equal(new Set(reviews.map(({ sourceId }) => sourceId)).size, 291);
  assert.ok(
    new Set(reviews.map(({ proposedCluster }) => proposedCluster)).size >= 40,
    "marketing reviews require granular behavioral clusters rather than coarse family labels",
  );
  assert.deepEqual(reviews.map(({ sourceId }) => sourceId).sort(), queueIds);
  assert.ok(reviews.every(({ sourceId, bodySha256 }) =>
    bodySha256 === queue.cards.find((card) => card.sourceId === sourceId)?.bodySha256,
  ));
  assert.ok(reviews.every(({ copiedSourceProse, promotionClaim }) =>
    copiedSourceProse === false && promotionClaim === false,
  ));
  assert.ok(reviews.every(({ neutralIntentExamples }) =>
    neutralIntentExamples.length >= 2 &&
    neutralIntentExamples.every((intent) => !intent.trim().startsWith("/")),
  ));
  for (const review of reviews) {
    const sourceName = queue.cards.find(({ sourceId }) => sourceId === review.sourceId)?.name;
    assert.ok(sourceName, `${review.sourceId} requires a queue name`);
    assert.ok(
      review.neutralIntentExamples.every((intent) =>
        !intent.trim().toLowerCase().startsWith(`use ${sourceName.trim().toLowerCase()} `),
      ),
      `${review.sourceId} intent examples must express outcomes, not invoke the source skill by name`,
    );
  }
  assert.ok(reviews.every((review) => [
    "independent-implementation",
    "pattern-reference",
    "deferred",
    "rejected",
  ].includes(review.disposition)));
  for (const review of reviews) {
    for (const field of [
      "inputs",
      "operations",
      "outputs",
      "effects",
      "failureBehavior",
      "exclusions",
      "usefulInvariants",
      "materialRisks",
    ]) {
      assert.ok(review[field].length > 0, `${review.sourceId} requires ${field}`);
    }
  }

  const firstWaveIds = batches[0].reviews.map(({ sourceId }) => sourceId).sort();
  const remaining = queueIds.filter((sourceId) => !firstWaveIds.includes(sourceId));
  const expectedChunks = chunks(remaining, 25);
  assert.equal(batches.length, expectedChunks.length + 1);
  for (let index = 0; index < expectedChunks.length; index += 1) {
    assert.equal(batches[index + 1].waveId, waveName(index + 2));
    assert.deepEqual(
      batches[index + 1].reviews.map(({ sourceId }) => sourceId),
      expectedChunks[index],
    );
  }
});
