import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { classify, summarizeOntology } from "../src/ontology.mjs";

const ontology = JSON.parse(
  await readFile(new URL("../data/ontology.v1.json", import.meta.url), "utf8"),
);

test("ontology exposes unique first-party family ids", () => {
  const ids = ontology.families.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("architecture-specification"));
  assert.ok(ids.includes("visual-3d-motion"));
  assert.ok(ids.includes("writing-narrative-canon"));
});

test("classifier assigns repository research from deterministic keyword evidence", () => {
  const families = classify(
    {
      name: "repository miner",
      description: "Search source repositories and inspect provenance evidence",
      sourcePath: "skills\\repository-miner\\SKILL.md",
      tags: ["git", "research"],
      triggers: [],
    },
    ontology,
  );

  assert.equal(families[0], "repository-source-research");
});

test("classifier preserves multiple evidenced families in ontology order", () => {
  const families = classify(
    {
      name: "shader website verifier",
      description: "Build a web interface with WebGL shader motion and visual screenshot verification",
      sourcePath: "visual\\web\\SKILL.md",
      tags: ["frontend", "3d"],
      triggers: [],
    },
    ontology,
  );

  assert.ok(families.includes("web-interface-accessibility"));
  assert.ok(families.includes("visual-3d-motion"));
  assert.ok(families.includes("verification-evidence"));
});

test("classifier returns general when no family has evidence", () => {
  assert.deepEqual(
    classify(
      {
        name: "thing",
        description: "miscellaneous capability",
        sourcePath: "misc\\thing\\SKILL.md",
        tags: [],
        triggers: [],
      },
      ontology,
    ),
    ["general"],
  );
});

test("ontology summary counts each classified source deterministically", () => {
  const summary = summarizeOntology([
    { id: "b", families: ["visual-3d-motion", "verification-evidence"] },
    { id: "a", families: ["verification-evidence"] },
  ], ontology);

  assert.equal(summary.sourceCount, 2);
  assert.equal(summary.familyCounts["verification-evidence"], 2);
  assert.equal(summary.familyCounts["visual-3d-motion"], 1);
  assert.deepEqual(summary.unclassifiedSourceIds, []);
});
