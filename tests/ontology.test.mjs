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
  assert.ok(ids.includes("agency-client-services"));
  assert.ok(ids.includes("marketing-growth"));
  assert.ok(ids.includes("social-media-community"));
  assert.ok(ids.includes("game-design-development"));
});

test("ontology separates the first professional refinery families", () => {
  const fixtures = [
    [
      {
        name: "agency-client",
        description: "Onboard an agency client and maintain account reporting",
        sourcePath: "skills\\agency-client\\SKILL.md",
        tags: [],
        triggers: [],
      },
      "agency-client-services",
    ],
    [
      {
        name: "campaign-analytics",
        description: "Measure marketing campaign attribution and conversion",
        sourcePath: "skills\\campaign-analytics\\SKILL.md",
        tags: [],
        triggers: [],
      },
      "marketing-growth",
    ],
    [
      {
        name: "social-media-manager",
        description: "Plan a social media content calendar and engagement strategy",
        sourcePath: "skills\\social-media-manager\\SKILL.md",
        tags: [],
        triggers: [],
      },
      "social-media-community",
    ],
    [
      {
        name: "game-design",
        description: "Tune a game loop, difficulty curve, and economy balance",
        sourcePath: "skills\\game-design\\SKILL.md",
        tags: [],
        triggers: [],
      },
      "game-design-development",
    ],
  ];

  for (const [record, family] of fixtures) {
    assert.ok(classify(record, ontology).includes(family), `${record.name} -> ${family}`);
  }
});

test("agency command family routes from its discriminating name prefix", () => {
  const families = classify(
    {
      name: "agency-stack",
      description: "Show the operating stack and current setup",
      sourcePath: "ai-agency-claude\\skills\\agency-stack\\SKILL.md",
      tags: [],
      triggers: [],
    },
    ontology,
  );

  assert.ok(families.includes("agency-client-services"));
});

test("generic design and content language does not enter specialist families", () => {
  const families = classify(
    {
      name: "general agent",
      description: "Design an agent that organizes content for a user",
      sourcePath: "skills\\general-agent\\SKILL.md",
      tags: [],
      triggers: [],
    },
    ontology,
  );

  for (const family of [
    "agency-client-services",
    "marketing-growth",
    "social-media-community",
    "game-design-development",
  ]) {
    assert.ok(!families.includes(family), family);
  }
});

test("short marketing keywords do not match inside unrelated words", () => {
  const families = classify(
    {
      name: "microsoft security migration",
      description: "Move policies across tenants and preserve access controls",
      sourcePath: "skills\\microsoft-security\\SKILL.md",
      tags: [],
      triggers: [],
    },
    ontology,
  );

  assert.ok(!families.includes("marketing-growth"));
});

test("social media repository paths classify cards with broken descriptions", () => {
  const families = classify(
    {
      name: "content-matrix",
      description: ">",
      sourcePath: "from-stars\\social-media-skills\\skills\\content-matrix\\SKILL.md",
      tags: [],
      triggers: [],
    },
    ontology,
  );

  assert.ok(families.includes("social-media-community"));
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
