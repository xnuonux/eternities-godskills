import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { evaluateSuite } from "../src/evaluate.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const skillRoot = new URL("../skills/sovereign-skill-refinery/", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, skillRoot), "utf8"));
}

function frontmatter(markdown) {
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

test("refinery exposes a discriminating skill entrypoint and valid neutral contract", async () => {
  const markdown = await readFile(new URL("SKILL.md", skillRoot), "utf8");
  const metadata = frontmatter(markdown);
  const contract = await json("references/contract-template.json");

  assert.equal(metadata.name, "sovereign-skill-refinery");
  assert.match(metadata.description, /multiple candidate skills|workflow quarry/i);
  assert.match(metadata.description, /do not use/i);
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.match(markdown, /references\/contract-template\.json/);
});

test("routing suite covers direct, paraphrase, exclusion, and conflict boundaries", async () => {
  const suite = await json("evals/cases.json");
  const kinds = new Set(suite.cases.map(({ kind }) => kind));
  assert.deepEqual(
    [...kinds].sort(),
    ["conflict", "direct", "exclusion", "paraphrase"],
  );
  assert.ok(suite.cases.every(({ prompt }) => typeof prompt === "string" && prompt.length > 10));
  assert.ok(
    suite.cases
      .filter(({ kind }) => kind === "exclusion")
      .every(({ expected }) => expected === "skip"),
  );
  assert.ok(
    suite.cases
      .filter(({ kind }) => kind === "conflict")
      .every(({ expected }) => expected.startsWith("defer:")),
  );
});

test("candidate routing preserves every critical baseline and measures improvement", async () => {
  const suite = await json("evals/cases.json");
  const skillText = await readFile(new URL("SKILL.md", skillRoot), "utf8");
  const policy = JSON.parse(
    await readFile(new URL("../policies/promotion.v1.json", import.meta.url), "utf8"),
  );
  const baseline = {
    ...evaluateSuite(suite.cases, suite.baseline.results),
    tokenCount: suite.baseline.tokenCount,
  };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(Buffer.byteLength(skillText, "utf8") / 4),
    improvements:
      suite.candidate.sourceCoverage > suite.baseline.sourceCoverage
        ? ["sourceCoverage"]
        : [],
  };
  const decision = decidePromotion({ baseline, candidate, policy });

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.ok(candidate.score > baseline.score);
  assert.equal(decision.status, "promoted");
});

test("provenance ledger retains exact source identity and pattern-only boundaries", async () => {
  const text = await readFile(
    new URL("../provenance/source-ledger.jsonl", import.meta.url),
    "utf8",
  );
  const rows = text.trim().split(/\r?\n/).map(JSON.parse);
  const certified = new Map(
    (
      await readFile(
        new URL("../artifacts/release-one/source-records.jsonl", import.meta.url),
        "utf8",
      )
    )
      .trim()
      .split(/\r?\n/)
      .map(JSON.parse)
      .map((row) => [row.id, row]),
  );
  assert.ok(rows.length >= 5);
  assert.equal(new Set(rows.map(({ sourceId }) => sourceId)).size, rows.length);
  assert.ok(rows.every(({ sourcePath, contentDigest }) => sourcePath && contentDigest));
  assert.ok(
    rows.every(
      (row) =>
        certified.get(row.sourceId)?.sourcePath === row.sourcePath &&
        certified.get(row.sourceId)?.contentDigest === row.contentDigest,
    ),
  );
  assert.ok(
    rows
      .filter(({ licenseClass }) => licenseClass !== "permissive")
      .every(({ disposition }) => disposition === "pattern-reference"),
  );
});

test("promotion receipt states both the promoted decision and its proof limit", async () => {
  const receipt = JSON.parse(
    await readFile(
      new URL(
        "../receipts/promotions/sovereign-skill-refinery.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(receipt.decision.status, "promoted");
  assert.equal(receipt.candidate.criticalPassed, receipt.candidate.criticalTotal);
  assert.match(receipt.limitation, /fresh-prompt proof/i);
});
