import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { evaluateSuite } from "../src/evaluate.mjs";
import { decidePromotion } from "../src/promote.mjs";

const skillRoot = new URL("../skills/eternities-oracle/", import.meta.url);
const oracleSourceIds = new Set([
  "skill-0cd7a5b268901a9a",
  "skill-23ddb32a951b8061",
  "skill-64376ecfd3fc8025",
  "skill-6fe8871f57cf0617",
  "skill-88ef1cd3129876bd",
]);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, skillRoot), "utf8"));
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

test("oracle entrypoint discriminates consequential synthesis from simple lookups", async () => {
  const markdown = await readFile(new URL("SKILL.md", skillRoot), "utf8");
  const frontmatter = metadata(markdown);

  assert.equal(frontmatter.name, "eternities-oracle");
  assert.match(frontmatter.description, /local repository evidence/i);
  assert.match(frontmatter.description, /official sources/i);
  assert.match(frontmatter.description, /do not use/i);
  assert.match(markdown, /references\/operating-contract\.md/);
});

test("oracle cases exercise local, official, hybrid, exclusions, and conflicts", async () => {
  const suite = await json("evals/cases.json");
  const expected = new Set(suite.cases.map(({ expected }) => expected));
  assert.ok(expected.has("route:local"));
  assert.ok(expected.has("route:official"));
  assert.ok(expected.has("route:hybrid"));
  assert.ok(expected.has("skip"));
  assert.ok([...expected].some((value) => value.startsWith("defer:")));
  assert.ok(
    suite.cases
      .filter(({ expected }) => expected === "skip")
      .every(({ kind }) => kind === "exclusion"),
  );
});

test("oracle candidate preserves critical coverage and clears promotion gates", async () => {
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
    improvements: ["sourceCoverage"],
  };
  const decision = decidePromotion({ baseline, candidate, policy });

  assert.equal(candidate.criticalPassed, candidate.criticalTotal);
  assert.ok(candidate.score > baseline.score);
  assert.equal(decision.status, "promoted");
});

test("oracle provenance is exact and unknown sources remain pattern-only", async () => {
  const ledger = (
    await readFile(new URL("../provenance/source-ledger.jsonl", import.meta.url), "utf8")
  )
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse)
    .filter(({ sourceId }) => oracleSourceIds.has(sourceId));
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

  assert.equal(ledger.length, oracleSourceIds.size);
  assert.ok(
    ledger.every(
      (row) =>
        certified.get(row.sourceId)?.sourcePath === row.sourcePath &&
        certified.get(row.sourceId)?.contentDigest === row.contentDigest,
    ),
  );
  assert.ok(
    ledger
      .filter(({ licenseClass }) => licenseClass !== "permissive")
      .every(({ disposition }) => disposition === "pattern-reference"),
  );
});

test("oracle receipt separates promotion proof from fresh-prompt recall", async () => {
  const receipt = JSON.parse(
    await readFile(
      new URL("../receipts/promotions/eternities-oracle.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(receipt.decision.status, "promoted");
  assert.match(receipt.limitation, /fresh-prompt proof/i);
});

test("oracle v2 adds only the four exact candidate clusters with bounded behavior", async () => {
  const markdown = await readFile(new URL("SKILL.md", skillRoot), "utf8");
  const synthesis = JSON.parse(
    await readFile(new URL("../syntheses/eternities-oracle.v2.json", import.meta.url), "utf8"),
  );
  const receipt = JSON.parse(
    await readFile(
      new URL("../receipts/promotions/eternities-oracle-v2.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(synthesis.clusters.map(({ id }) => id), [
    "repository-source-research-013",
    "repository-source-research-020",
    "repository-source-research-031",
    "repository-source-research-227",
  ]);
  assert.deepEqual([...synthesis.sourceIds].sort(), [
    "skill-64376ecfd3fc8025",
    "skill-ac1f5f663a41bdef",
    "skill-23ddb32a951b8061",
    "skill-150968403447b795",
    "skill-ecbede6d01f386ec",
  ].sort());
  assert.equal(synthesis.sourceIds.length, 5);
  assert.match(markdown, /never execute repository code/i);
  assert.match(markdown, /comparison requires a named baseline/i);
  assert.match(markdown, /unknown provenance.*pattern-only/i);
  assert.match(markdown, /credentials|security-sensitive extraction/i);
  assert.equal(receipt.decision.status, "promoted");
  assert.deepEqual(receipt.evidence.clusterIds, synthesis.clusters.map(({ id }) => id));
  assert.deepEqual(receipt.evidence.sourceIds, synthesis.sourceIds);
});
