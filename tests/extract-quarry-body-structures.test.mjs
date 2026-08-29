import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { extractQuarryBodyStructures } from "../scripts/extract-quarry-body-structures.mjs";
import { sha256 } from "../src/io.mjs";

test("extractor reads one verified canonical body per exact digest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "quarry-extract-"));
  const sourcePath = path.join(root, "warehouse", "skill", "SKILL.md");
  const recordsPath = path.join(root, "source-records.jsonl");
  const outputPath = path.join(root, "body-structures.jsonl");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  const body = "---\nname: api-pattern\ndescription: Design a stable API.\n---\n# Contracts\n/invoke-untrusted-command\n";
  await writeFile(sourcePath, body);
  const record = (id) => ({ id, sourceAbsolutePath: sourcePath, bodySha256: sha256(body), bodyBytes: Buffer.byteLength(body), inert: true });
  await writeFile(recordsPath, `${JSON.stringify(record("a"))}\n${JSON.stringify(record("b"))}\n`);

  const result = await extractQuarryBodyStructures({ recordsPath, outputPath, write: true });
  const rows = (await readFile(outputPath, "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(result.sourceCount, 2);
  assert.equal(result.canonicalBodyCount, 1);
  assert.equal(rows[0].canonicalSourceId, "a");
  assert.equal(rows[0].structure.frontmatterName, "api-pattern");
  assert.deepEqual(rows[0].structure.headings, ["Contracts"]);
  assert.equal("invocationCandidates" in rows[0].structure, false);
});

test("extractor fails closed when source bytes drift", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "quarry-extract-"));
  const sourcePath = path.join(root, "SKILL.md");
  const recordsPath = path.join(root, "source-records.jsonl");
  await writeFile(sourcePath, "changed");
  await writeFile(recordsPath, `${JSON.stringify({ id: "a", sourceAbsolutePath: sourcePath, bodySha256: "a".repeat(64), bodyBytes: 7, inert: true })}\n`);
  await assert.rejects(extractQuarryBodyStructures({ recordsPath, outputPath: path.join(root, "out.jsonl"), write: false }), /digest drift/);
});
