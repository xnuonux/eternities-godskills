import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const repositoryRoot = new URL("../", import.meta.url);

async function text(relative) {
  return readFile(new URL(relative, repositoryRoot), "utf8");
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

function metadata(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "skill frontmatter is required");
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-z_]+):\s*(.*)$/))
      .filter(Boolean)
      .map((parts) => [parts[1], parts[2]]),
  );
}

async function evaluate(name) {
  const suite = await json(`skills/${name}/evals/cases.json`);
  const skillText = await text(`skills/${name}/SKILL.md`);
  const policy = await json("policies/promotion.v1.json");
  const baseline = {
    ...evaluateSuite(suite.cases, suite.baseline.results),
    tokenCount: suite.baseline.tokenCount,
  };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(skillText, "utf8") / 4),
    improvements: ["sourceCoverage"],
  };
  return {
    suite,
    candidate,
    decision: decidePromotion({ baseline, candidate, policy }),
  };
}

test("Architect has discriminating metadata and valid contracts", async () => {
  const markdown = await text("skills/eternities-architect/SKILL.md");
  const frontmatter = metadata(markdown);
  const contract = await json(
    "skills/eternities-architect/references/capability-contract.json",
  );

  assert.equal(frontmatter.name, "eternities-architect");
  assert.match(frontmatter.description, /consequential/i);
  assert.match(frontmatter.description, /do not use/i);
  assert.match(markdown, /references\/operating-contract\.md/);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
});

test("Architect routes architecture missions and yields narrow work", async () => {
  const { suite } = await evaluate("eternities-architect");
  const expected = new Set(suite.cases.map(({ expected }) => expected));

  assert.ok(expected.has("route:new-system"));
  assert.ok(expected.has("route:existing-system"));
  assert.ok(expected.has("route:decision-record"));
  assert.ok(expected.has("skip"));
  assert.ok(expected.has("defer:brainstorming"));
  assert.ok(expected.has("defer:writing-plans"));
});

test("Architect preserves all critical cases and clears promotion gates", async () => {
  const { candidate, decision } = await evaluate("eternities-architect");

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(decision.status, "promoted");
});

test("Architect provenance matches the certified release-one records", async () => {
  const sourceIds = new Set([
    "skill-0aea1470a8fb8c11",
    "skill-330342e7e8edc510",
    "skill-64376ecfd3fc8025",
    "skill-7030d919fe03611f",
  ]);
  const ledger = (await text("provenance/source-ledger.jsonl"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse)
    .filter(({ sourceId }) => sourceIds.has(sourceId));
  const certified = new Map(
    (await text("artifacts/release-one/source-records.jsonl"))
      .trim()
      .split(/\r?\n/)
      .map(JSON.parse)
      .map((row) => [row.id, row]),
  );

  assert.equal(ledger.length, sourceIds.size);
  assert.ok(
    ledger.every(
      (row) =>
        row.proseCopied === false &&
        row.sourcePath === certified.get(row.sourceId)?.sourcePath &&
        row.contentDigest === certified.get(row.sourceId)?.contentDigest,
    ),
  );
});

test("Forge has discriminating metadata and valid contracts", async () => {
  const markdown = await text("skills/eternities-forge/SKILL.md");
  const frontmatter = metadata(markdown);
  const contract = await json(
    "skills/eternities-forge/references/capability-contract.json",
  );

  assert.equal(frontmatter.name, "eternities-forge");
  assert.match(frontmatter.description, /multi-stage/i);
  assert.match(frontmatter.description, /do not use/i);
  assert.match(markdown, /references\/operating-contract\.md/);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
});

test("Forge composes development missions and yields exact process skills", async () => {
  const { suite } = await evaluate("eternities-forge");
  const expected = new Set(suite.cases.map(({ expected }) => expected));

  assert.ok(expected.has("route:feature"));
  assert.ok(expected.has("route:regression"));
  assert.ok(expected.has("route:refactor"));
  assert.ok(expected.has("route:risky-integration"));
  assert.ok(expected.has("skip"));
  assert.ok(expected.has("defer:writing-plans"));
  assert.ok(expected.has("defer:executing-plans"));
  assert.ok(expected.has("defer:systematic-debugging"));
  assert.ok(expected.has("defer:finishing-a-development-branch"));
});

test("Forge preserves all critical cases and clears promotion gates", async () => {
  const { candidate, decision } = await evaluate("eternities-forge");

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(decision.status, "promoted");
});

test("Forge provenance matches the certified release-one records", async () => {
  const sourceIds = new Set([
    "skill-0106e66a5f004bb6",
    "skill-ef1830eb06a36c46",
    "skill-b3177aeea9596bb7",
    "skill-c5d998749ee6b275",
    "skill-4e367ac15eb8e30d",
  ]);
  const ledger = (await text("provenance/source-ledger.jsonl"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse)
    .filter(({ sourceId }) => sourceIds.has(sourceId));
  const certified = new Map(
    (await text("artifacts/release-one/source-records.jsonl"))
      .trim()
      .split(/\r?\n/)
      .map(JSON.parse)
      .map((row) => [row.id, row]),
  );

  assert.equal(ledger.length, sourceIds.size);
  assert.ok(
    ledger.every(
      (row) =>
        row.proseCopied === false &&
        row.sourcePath === certified.get(row.sourceId)?.sourcePath &&
        row.contentDigest === certified.get(row.sourceId)?.contentDigest,
    ),
  );
});
