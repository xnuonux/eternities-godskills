import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { auditBody } from "../src/body-audit.mjs";
import { buildCorpusCoverage } from "../scripts/build-corpus-coverage.mjs";
import { sha256 } from "../src/io.mjs";

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "skill-a",
    name: "Agency Client",
    description: "Onboard an agency client",
    enhancedSummary: "",
    sourcePath: "repo\\skill-a\\SKILL.md",
    repositoryRoot: "repo",
    contentDigest: "a".repeat(64),
    licenseClass: "permissive",
    confidence: "high",
    tags: [],
    triggers: [],
    operations: [],
    families: ["agency-client-services"],
    ...overrides,
  };
}

async function temporary(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-corpus-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("body audit records exact inert file evidence", async (context) => {
  const root = await temporary(context);
  const target = path.join(root, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  const text = "# Agency Client\n\nInspect this as data.\n";
  await writeFile(target, text, "utf8");

  const result = await auditBody(root, record());

  assert.equal(result.status, "inspected");
  assert.equal(result.present, true);
  assert.equal(result.bodySha256, sha256(text));
  assert.equal(result.byteSize, Buffer.byteLength(text));
  assert.equal(result.lineCount, 4);
  assert.equal(result.resolvedRelativePath, "repo\\skill-a\\SKILL.md");
  assert.deepEqual(result.structure.headings, ["Agency Client"]);
  assert.equal(result.structure.frontmatterName, null);
});

test("body audit extracts bounded frontmatter and heading structure", async (context) => {
  const root = await temporary(context);
  const target = path.join(root, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(
    target,
    [
      "---",
      "name: agency-client",
      "description: Coordinate client onboarding and reporting.",
      "---",
      "# Operating workflow",
      "## Intake",
      "## Delivery",
      "",
    ].join("\n"),
    "utf8",
  );

  const result = await auditBody(root, record());

  assert.equal(result.structure.frontmatterName, "agency-client");
  assert.equal(
    result.structure.frontmatterDescription,
    "Coordinate client onboarding and reporting.",
  );
  assert.deepEqual(result.structure.headings, ["Operating workflow", "Intake", "Delivery"]);
});

test("body audit preserves missing files as explicit evidence", async (context) => {
  const root = await temporary(context);
  const result = await auditBody(root, record());

  assert.deepEqual(
    {
      status: result.status,
      present: result.present,
      bodySha256: result.bodySha256,
      errorCode: result.errorCode,
    },
    { status: "missing", present: false, bodySha256: null, errorCode: "ENOENT" },
  );
});

test("body audit rejects lexical and real-path escape", async (context) => {
  const parent = await temporary(context);
  const root = path.join(parent, "warehouse");
  await mkdir(root);
  await writeFile(path.join(parent, "outside.md"), "outside", "utf8");

  await assert.rejects(
    auditBody(root, record({ sourcePath: "..\\outside.md" })),
    /escapes canonical warehouse root/,
  );
});

test("corpus coverage build is byte-stable and reconciles exact inputs", async (context) => {
  const root = await temporary(context);
  const warehouse = path.join(root, "warehouse");
  const output = path.join(root, "output");
  const sourceRecordsPath = path.join(root, "source-records.jsonl");
  const ontologyPath = path.join(root, "ontology.json");
  const provenancePath = path.join(root, "provenance.jsonl");
  const duplicateGroupsPath = path.join(root, "duplicates.json");
  const target = path.join(warehouse, "repo", "skill-a", "SKILL.md");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, "# Agency Client\n", "utf8");
  await writeFile(sourceRecordsPath, `${JSON.stringify(record())}\n`, "utf8");
  await writeFile(
    ontologyPath,
    `${JSON.stringify({
      schemaVersion: 1,
      version: "test",
      families: [
        { id: "agency-client-services", keywords: ["agency client"] },
      ],
    })}\n`,
    "utf8",
  );
  await writeFile(provenancePath, "", "utf8");
  await writeFile(
    duplicateGroupsPath,
    `${JSON.stringify({ schemaVersion: 1, exact: [], aliases: [], candidates: [] })}\n`,
    "utf8",
  );

  const options = {
    warehouseRoot: warehouse,
    sourceRecordsPath,
    ontologyPath,
    provenancePath,
    duplicateGroupsPath,
    outputPath: output,
  };
  const first = await buildCorpusCoverage(options);
  const firstFiles = await Promise.all(
    ["body-evidence.jsonl", "coverage-ledger.jsonl", "coverage-summary.json"].map(
      (name) => readFile(path.join(output, name), "utf8"),
    ),
  );
  const second = await buildCorpusCoverage(options);
  const secondFiles = await Promise.all(
    ["body-evidence.jsonl", "coverage-ledger.jsonl", "coverage-summary.json"].map(
      (name) => readFile(path.join(output, name), "utf8"),
    ),
  );

  assert.equal(first.sourceCount, 1);
  assert.equal(first.evidenceCounts.bodyInspected, 1);
  assert.equal(first.reviewQueues["agency-client-services"].sourceCount, 1);
  assert.equal(first.reviewQueues["agency-client-services"].packetCount, 1);
  const queue = JSON.parse(
    await readFile(
      path.join(output, "families", "agency-client-services", "queue.json"),
      "utf8",
    ),
  );
  const packet = JSON.parse(
    await readFile(
      path.join(output, "families", "agency-client-services", "packets", "001.json"),
      "utf8",
    ),
  );
  assert.equal(queue.cards.length, 1);
  assert.equal(packet.cards.length, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(firstFiles, secondFiles);
});
