import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCompositionContract } from "../src/composition.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const skillPath = new URL("../skills/eternities-agora/SKILL.md", import.meta.url);
const contractPath = new URL(
  "../skills/eternities-agora/references/capability-contract.json",
  import.meta.url,
);

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
