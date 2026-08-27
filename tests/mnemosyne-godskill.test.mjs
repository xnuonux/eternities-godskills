import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { canonicalText } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveSourceEvidence } from "../src/provenance-evidence.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const root = new URL("../", import.meta.url);

async function text(relative) {
  return readFile(new URL(relative, root), "utf8");
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

async function evaluate() {
  const suite = await json("skills/eternities-mnemosyne/evals/cases.json");
  const skillText = canonicalText(
    await text("skills/eternities-mnemosyne/SKILL.md"),
  );
  const contract = await json(
    "skills/eternities-mnemosyne/references/capability-contract.json",
  );
  const policy = await json("policies/promotion.v1.json");
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
    sourceEvidence,
    candidate,
    decision: decidePromotion({ baseline, candidate, policy }),
  };
}

test("Mnemosyne has bounded metadata and valid contracts", async () => {
  const markdown = await text("skills/eternities-mnemosyne/SKILL.md");
  const frontmatter = metadata(markdown);
  const contract = await json(
    "skills/eternities-mnemosyne/references/capability-contract.json",
  );

  assert.equal(frontmatter.name, "eternities-mnemosyne");
  assert.match(frontmatter.description, /continuity/i);
  assert.match(frontmatter.description, /do not use/i);
  assert.match(markdown, /references\/operating-contract\.md/);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.equal(contract.routes.length, 4);
});

test("Mnemosyne separates continuity, context, design, and audit routes", async () => {
  const { suite } = await evaluate();
  const expected = new Set(suite.cases.map(({ expected }) => expected));

  assert.ok(expected.has("route:continuity-recovery"));
  assert.ok(expected.has("route:context-budget"));
  assert.ok(expected.has("route:memory-design"));
  assert.ok(expected.has("route:memory-audit"));
  assert.ok(expected.has("skip"));
  assert.ok(expected.has("defer:keel-wake"));
  assert.ok(expected.has("defer:eternities-oracle"));
  assert.ok(expected.has("defer:systematic-debugging"));
});

test("Mnemosyne preserves every critical route and clears promotion gates", async () => {
  const { candidate, decision } = await evaluate();

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.equal(candidate.tokenCount <= 4000, true);
  assert.equal(decision.status, "promoted");
});

test("Mnemosyne provenance exactly matches five certified source records", async () => {
  const sourceIds = new Set([
    "skill-76f8b29612e172ef",
    "skill-b45e69e1294102fe",
    "skill-894528a07f1094ec",
    "skill-8b767405ee033077",
    "skill-24af7808245a94e6",
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
  assert.equal(
    ledger.filter(({ disposition }) => disposition === "pattern-reference").length,
    3,
  );
  assert.equal(
    ledger.filter(({ disposition }) => disposition === "independent-implementation").length,
    2,
  );
});
