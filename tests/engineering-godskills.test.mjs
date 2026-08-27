import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";
import { deriveSourceEvidence } from "../src/provenance-evidence.mjs";

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
  const contract = await json(`skills/${name}/references/capability-contract.json`);
  const ledger = (await text("provenance/source-ledger.jsonl"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
  const sourceEvidence = deriveSourceEvidence(contract, ledger);
  const baseline = {
    ...evaluateSuite(suite.cases, suite.baseline.results),
    tokenCount: suite.baseline.tokenCount,
  };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(skillText, "utf8") / 4),
    improvements:
      sourceEvidence.sourceCoverage > suite.baseline.sourceCoverage
        ? ["sourceCoverage"]
        : [],
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
  const contract = await json(
    "skills/eternities-forge/references/capability-contract.json",
  );

  assert.equal(ledger.length, sourceIds.size);
  assert.deepEqual(new Set(contract.sourceIds), sourceIds);
  assert.ok(
    ledger.every(
      (row) =>
        row.proseCopied === false &&
        row.sourcePath === certified.get(row.sourceId)?.sourcePath &&
        row.contentDigest === certified.get(row.sourceId)?.contentDigest,
    ),
  );
});

test("Aegis has discriminating metadata and valid contracts", async () => {
  const markdown = await text("skills/eternities-aegis/SKILL.md");
  const frontmatter = metadata(markdown);
  const contract = await json(
    "skills/eternities-aegis/references/capability-contract.json",
  );

  assert.equal(frontmatter.name, "eternities-aegis");
  assert.match(frontmatter.description, /authorized/i);
  assert.match(frontmatter.description, /do not use/i);
  assert.match(markdown, /references\/operating-contract\.md/);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
});

test("Aegis routes governed audits and refuses unauthorized action", async () => {
  const { suite } = await evaluate("eternities-aegis");
  const expected = new Set(suite.cases.map(({ expected }) => expected));

  assert.ok(expected.has("route:source-audit"));
  assert.ok(expected.has("route:threat-model"));
  assert.ok(expected.has("route:mcp-audit"));
  assert.ok(expected.has("route:authority-review"));
  assert.ok(expected.has("skip"));
  assert.ok(expected.has("refuse:unauthorized"));
  assert.ok(expected.has("defer:installed-exact-security-skill"));
});

test("Aegis preserves all critical cases and clears promotion gates", async () => {
  const { candidate, decision } = await evaluate("eternities-aegis");

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(decision.status, "promoted");
});

test("Aegis provenance matches the certified release-one records", async () => {
  const sourceIds = new Set([
    "skill-72cad70c3765e1c2",
    "skill-6a5af032f4ae778f",
    "skill-81bf77b4de7d5da3",
    "skill-e2c045990c37a6b5",
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

test("Aegis v2 adds the three candidate governance routes without replacing v1", async () => {
  const contract = await json(
    "skills/eternities-aegis/references/capability-contract.json",
  );
  assert.equal(contract.id, "godskill-eternities-aegis-v2");
  assert.deepEqual(
    contract.routes.map(({ id }) => id),
    [
      "source-audit",
      "threat-model",
      "mcp-audit",
      "authority-review",
      "policy-lifecycle",
      "identity-access",
      "security-assurance",
    ],
  );
  assert.deepEqual(contract.sourceEvidence.clusters.map(({ id }) => id), [
    "governance-identity-access",
    "governance-policy-lifecycle",
    "governance-security-assurance",
  ]);
});

test("Aegis v2 keeps credential, legal, provider, and mutation boundaries closed", async () => {
  const markdown = await text("skills/eternities-aegis/SKILL.md");
  const cases = await json("skills/eternities-aegis/evals/cases.json");
  for (const phrase of [
    "credentials",
    "personal data",
    "legal conclusions",
    "current-policy claims",
    "external mutation",
    "fail closed",
  ]) assert.match(markdown, new RegExp(phrase, "i"));
  assert.deepEqual(
    cases.candidate.results.slice(-5).map(({ actual }) => actual),
    [
      "route:policy-lifecycle",
      "route:identity-access",
      "route:security-assurance",
      "refuse:unauthorized",
      "defer:current-specialist-evidence",
    ],
  );
});
