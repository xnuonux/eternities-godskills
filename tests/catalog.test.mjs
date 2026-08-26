import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalizeIndex } from "../src/catalog.mjs";
import { findDuplicateGroups } from "../src/clusters.mjs";
import { sha256 } from "../src/io.mjs";
import { buildCatalog } from "../scripts/build-catalog.mjs";

function entry(overrides = {}) {
  return {
    id: "skill-a",
    name: "Evidence Reader",
    description: "Inspect source evidence and return a receipt.",
    enhanced_summary: "",
    category: "agent-systems",
    tags: ["Verify", "Evidence"],
    triggers: ["inspect evidence"],
    exclusions: ["simple answer"],
    source_path: "catalog\\owner__repo\\skills\\reader\\SKILL.md",
    repository_root: "catalog\\owner__repo",
    remote: "https://github.com/owner/repo.git",
    git_head: "a".repeat(40),
    license_class: "permissive",
    status: "raw",
    extraction_mode: "adapted-source",
    ...overrides,
  };
}

test("normalizer reads entries from the certified root object", () => {
  const rows = normalizeIndex({
    schema_version: 1,
    warehouse_root: "D:\\03-ARSENAL\\warehouse",
    entry_count: 1,
    entries: [entry()],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].schemaVersion, 1);
  assert.equal(rows[0].sourcePath, entry().source_path);
  assert.match(rows[0].contentDigest, /^[0-9a-f]{64}$/);
});

test("normalizer rejects uncertified roots and entry-count drift", () => {
  assert.throws(
    () => normalizeIndex({ schema_version: 2, entry_count: 0, entries: [] }),
    /schema_version must be 1/,
  );
  assert.throws(
    () =>
      normalizeIndex({
        schema_version: 1,
        entry_count: 2,
        entries: [entry()],
      }),
    /entry_count does not match entries/,
  );
});

test("normalization is stable across unicode, case, whitespace, and array order", () => {
  const left = normalizeIndex({
    schema_version: 1,
    entry_count: 1,
    entries: [
      entry({
        name: "  CAFÉ   VERIFY  ",
        description: "Inspect   EVIDENCE",
        tags: ["Verify", "Evidence"],
        triggers: ["Source", "Receipt"],
      }),
    ],
  })[0];
  const right = normalizeIndex({
    schema_version: 1,
    entry_count: 1,
    entries: [
      entry({
        id: "skill-b",
        name: "cafe\u0301 verify",
        description: "inspect evidence",
        tags: ["evidence", "verify"],
        triggers: ["receipt", "source"],
        source_path: "catalog\\copy\\SKILL.md",
      }),
    ],
  })[0];

  assert.equal(left.normalizedName, "café verify");
  assert.equal(left.contentDigest, right.contentDigest);
});

test("normalizer sorts records by id for deterministic artifacts", () => {
  const rows = normalizeIndex({
    schema_version: 1,
    entry_count: 2,
    entries: [entry({ id: "skill-z" }), entry({ id: "skill-a" })],
  });
  assert.deepEqual(rows.map(({ id }) => id), ["skill-a", "skill-z"]);
});

test("missing source descriptions remain valid but cannot create false exact matches", () => {
  const rows = normalizeIndex({
    schema_version: 1,
    entry_count: 2,
    entries: [
      entry({ id: "skill-a", description: "", enhanced_summary: "" }),
      entry({
        id: "skill-b",
        description: "",
        enhanced_summary: "",
        source_path: "catalog\\translation\\SKILL.md",
      }),
    ],
  });

  assert.equal(rows[0].descriptionStatus, "missing");
  assert.match(rows[0].description, /unavailable in certified index/);
  assert.notEqual(rows[0].contentDigest, rows[1].contentDigest);
  assert.equal(findDuplicateGroups(rows).exact.length, 0);
});

test("identical capability content becomes an exact duplicate group", () => {
  const records = normalizeIndex({
    schema_version: 1,
    entry_count: 2,
    entries: [
      entry({ id: "skill-a" }),
      entry({ id: "skill-b", source_path: "catalog\\copy\\SKILL.md" }),
    ],
  });
  const groups = findDuplicateGroups(records);

  assert.equal(groups.exact.length, 1);
  assert.deepEqual(groups.exact[0].sourceIds, ["skill-a", "skill-b"]);
  assert.equal(groups.aliases.length, 0);
  assert.equal(groups.candidates.length, 0);
});

test("same names with different behavior remain candidates, never exact duplicates", () => {
  const groups = findDuplicateGroups([
    {
      id: "a",
      normalizedName: "deploy",
      operations: ["release"],
      effects: ["write"],
      families: ["release-publishing"],
      contentDigest: "one",
    },
    {
      id: "b",
      normalizedName: "deploy",
      operations: ["release"],
      effects: ["external-write"],
      families: ["release-publishing"],
      contentDigest: "two",
    },
  ]);

  assert.equal(groups.exact.length, 0);
  assert.equal(groups.aliases.length, 0);
  assert.equal(groups.candidates.length, 1);
  assert.equal(groups.candidates[0].automaticMerge, false);
});

test("different names with identical capability content are explicit alias evidence", () => {
  const groups = findDuplicateGroups([
    { id: "a", normalizedName: "repo miner", contentDigest: "same" },
    { id: "b", normalizedName: "source quarry", contentDigest: "same" },
  ]);

  assert.equal(groups.exact.length, 0);
  assert.equal(groups.aliases.length, 1);
  assert.equal(groups.aliases[0].automaticMerge, false);
});

test("catalog builds are byte-stable and receipt the exact input bytes", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "godskills-catalog-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const indexPath = path.join(temporary, "index.json");
  const ontologyPath = path.join(temporary, "ontology.json");
  const outputPath = path.join(temporary, "output");
  const indexText = `${JSON.stringify({
    schema_version: 1,
    entry_count: 1,
    entries: [entry()],
  }, null, 2)}\n`;
  await writeFile(indexPath, indexText, "utf8");
  await writeFile(
    ontologyPath,
    `${JSON.stringify({
      schemaVersion: 1,
      version: "test",
      families: [{ id: "verification-evidence", keywords: ["evidence"] }],
    })}\n`,
    "utf8",
  );

  const first = await buildCatalog({ indexPath, ontologyPath, outputPath });
  const firstFiles = await Promise.all(
    ["source-records.jsonl", "duplicate-groups.json", "ontology-summary.json"].map(
      (name) => readFile(path.join(outputPath, name), "utf8"),
    ),
  );
  const second = await buildCatalog({ indexPath, ontologyPath, outputPath });
  const secondFiles = await Promise.all(
    ["source-records.jsonl", "duplicate-groups.json", "ontology-summary.json"].map(
      (name) => readFile(path.join(outputPath, name), "utf8"),
    ),
  );

  assert.equal(first.indexSha256, sha256(indexText));
  assert.deepEqual(first, second);
  assert.deepEqual(firstFiles, secondFiles);
});
