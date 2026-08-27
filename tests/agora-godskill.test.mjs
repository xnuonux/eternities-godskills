import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { evaluateSuite } from "../src/evaluate.mjs";
import { canonicalText } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveClusterSourceEvidence } from "../src/provenance-evidence.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const skillPath = new URL("../skills/eternities-agora/SKILL.md", import.meta.url);
const contractPath = new URL(
  "../skills/eternities-agora/references/capability-contract.json",
  import.meta.url,
);
const root = new URL("../", import.meta.url);

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function jsonLines(relative) {
  return (await readFile(new URL(relative, root), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
}

async function evaluateAgora() {
  const suite = await json("skills/eternities-agora/evals/cases.json");
  const skillText = canonicalText(await readFile(skillPath, "utf8"));
  const contract = await json(
    "skills/eternities-agora/references/capability-contract.json",
  );
  const sourceEvidence = deriveClusterSourceEvidence(
    contract,
    await jsonLines("artifacts/corpus/cluster-evidence.jsonl"),
    await jsonLines("artifacts/corpus/review-evidence.jsonl"),
  );
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
    decision: decidePromotion({
      baseline,
      candidate,
      policy: await json("policies/promotion.v1.json"),
    }),
  };
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md must start with YAML frontmatter");
  return Object.fromEntries(
    match[1].split("\n").map((line) => {
      const separator = line.indexOf(":");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
}

test("Agora is a compact agent-neutral agency and client operations entrypoint", async () => {
  const markdown = (await readFile(skillPath, "utf8")).replace(/\r\n/g, "\n");
  const frontmatter = parseFrontmatter(markdown);

  assert.equal(frontmatter.name, "eternities-agora");
  assert.match(frontmatter.description, /agency|client/i);
  assert.match(frontmatter.description, /do not use/i);
  assert.match(markdown, /references\/operating-contract\.md/);
  assert.match(markdown, /rapid screen/i);
  assert.match(markdown, /multidimensional assessment/i);
  assert.match(markdown, /portfolio pipeline/i);
  assert.match(markdown, /client account/i);
  assert.match(markdown, /operational rollup/i);
  assert.match(markdown, /service proposal/i);
  assert.match(markdown, /client report/i);
  assert.match(markdown, /do not invoke Agora recursively/i);
  assert.ok(Math.ceil(Buffer.byteLength(markdown, "utf8") / 4) <= 4000);
});

test("Agora contract exposes three bounded routes and exact candidate evidence", async () => {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  assert.doesNotThrow(() => validateCapabilityContract(contract));
  assert.doesNotThrow(() => validateCompositionContract(contract));
  assert.deepEqual(contract.routes.map(({ id }) => id), [
    "prospect-assessment",
    "account-operations",
    "client-deliverables",
  ]);
  assert.equal(
    contract.routes.some(({ delegates }) => delegates.includes(contract.name)),
    false,
  );
  assert.deepEqual(contract.sourceIds, [
    "skill-01b3dd8d8b2e3347",
    "skill-50183bf171c8cfeb",
    "skill-6f9529112807c946",
    "skill-8ea282b5eae0cd7a",
    "skill-922f3f027d2021e7",
    "skill-ea63f2d03890111b",
    "skill-eb5ed7a3910e2cc4",
  ]);
  assert.deepEqual(contract.sourceEvidence.clusters.map(({ id }) => id), [
    "agency-operational-state",
    "client-deliverable-construction",
    "prospect-assessment-depth",
  ]);
  const serialized = JSON.stringify(contract);
  for (const deferred of [
    "skill-058001f78b86a772",
    "skill-4dfe929d406effaa",
    "skill-84d65281285aa921",
    "skill-90c47a10ad0705e2",
    "skill-af62a2ea6d3ec16a",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(deferred));
  }
});

test("Agora evaluation covers all seven outcomes and every required boundary", async () => {
  const { suite } = await evaluateAgora();
  assert.equal(suite.cases.length, 29);
  assert.ok(suite.cases.every(({ critical }) => critical === true));
  const outcomes = new Set(suite.cases.map(({ expected }) => expected));
  for (const expected of [
    "route:prospect-assessment:rapid-screen",
    "route:prospect-assessment:multidimensional",
    "route:account-operations:portfolio-pipeline",
    "route:account-operations:client-account",
    "route:account-operations:operational-rollup",
    "route:client-deliverables:service-proposal",
    "route:client-deliverables:client-report",
    "skip",
    "defer:eternities-oracle",
    "defer:eternities-aegis",
    "defer:eternities-forge",
    "defer:document-rendering",
    "refuse:legal-boundary",
    "refuse:financial-boundary",
    "refuse:regulated-identity-boundary",
    "refuse:external-authority-required",
    "refuse:runtime-administration-boundary",
  ]) {
    assert.ok(outcomes.has(expected), `missing outcome: ${expected}`);
  }
});

test("Agora passes every critical promotion gate with exact cluster evidence", async () => {
  const { sourceEvidence, candidate, decision } = await evaluateAgora();
  assert.equal(sourceEvidence.sourceCoverage, 7);
  assert.equal(sourceEvidence.proseCopied, false);
  assert.equal(candidate.criticalPassed, 29);
  assert.equal(candidate.criticalTotal, 29);
  assert.deepEqual(candidate.unresolvedEffects, []);
  assert.equal(candidate.tokenCount <= 4000, true);
  assert.equal(decision.status, "promoted");
});
