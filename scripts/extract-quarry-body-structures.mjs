import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { extractBodyStructure } from "../src/body-audit.mjs";
import { sha256 } from "../src/io.mjs";

function parseJsonl(text) {
  return text.split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

async function writeTextAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  const temporary = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, value, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export function sanitizeBodyStructure(extracted) {
  const bounded = (value, maximum) => typeof value === "string" ? value.slice(0, maximum) : null;
  return {
    frontmatterName: bounded(extracted.frontmatterName, 160),
    frontmatterDescription: bounded(extracted.frontmatterDescription, 500),
    headings: (extracted.headings ?? []).slice(0, 12).map((heading) => String(heading).slice(0, 240)),
  };
}

export async function sanitizeBodyStructureArtifact(outputPath) {
  const rows = parseJsonl(await readFile(outputPath, "utf8")).map((row) => ({
    ...row,
    structure: sanitizeBodyStructure(row.structure ?? {}),
  }));
  const text = `${rows.map(JSON.stringify).join("\n")}\n`;
  await writeTextAtomic(outputPath, text);
  return { canonicalBodyCount: rows.length, sha256: sha256(text) };
}

function representatives(records) {
  const byDigest = new Map();
  for (const record of [...records].sort((left, right) => left.id.localeCompare(right.id))) {
    if (record.inert !== true) throw new Error(`source is not inert: ${record.id}`);
    if (!/^[a-f0-9]{64}$/.test(record.bodySha256 ?? "")) throw new Error(`invalid source digest: ${record.id}`);
    if (!byDigest.has(record.bodySha256)) byDigest.set(record.bodySha256, record);
  }
  return [...byDigest.values()].sort((left, right) =>
    left.sourceAbsolutePath.localeCompare(right.sourceAbsolutePath) || left.id.localeCompare(right.id));
}

async function extractOne(record) {
  const bytes = await readFile(record.sourceAbsolutePath);
  if (bytes.length !== record.bodyBytes) throw new Error(`body byte-size drift: ${record.id}`);
  if (sha256(bytes) !== record.bodySha256) throw new Error(`body digest drift: ${record.id}`);
  const extracted = extractBodyStructure(bytes.toString("utf8"));
  return {
    schemaVersion: 1,
    bodySha256: record.bodySha256,
    canonicalSourceId: record.id,
    bodyBytes: bytes.length,
    structure: sanitizeBodyStructure(extracted),
  };
}

export async function extractQuarryBodyStructures({ recordsPath, outputPath, write = true, concurrency = 32 }) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 128) throw new Error("concurrency must be between 1 and 128");
  const records = parseJsonl(await readFile(recordsPath, "utf8"));
  const canonical = representatives(records);
  const rows = [];
  for (let offset = 0; offset < canonical.length; offset += concurrency) {
    rows.push(...await Promise.all(canonical.slice(offset, offset + concurrency).map(extractOne)));
  }
  rows.sort((left, right) => left.bodySha256.localeCompare(right.bodySha256));
  const text = `${rows.map(JSON.stringify).join("\n")}\n`;
  if (write) await writeTextAtomic(outputPath, text);
  return { sourceCount: records.length, canonicalBodyCount: rows.length, sha256: sha256(text), rows };
}

async function main() {
  const root = path.resolve(".");
  const result = await extractQuarryBodyStructures({
    recordsPath: path.join(root, "artifacts/github-wave-2/source-records.jsonl"),
    outputPath: path.join(root, "artifacts/quarry-infusion/body-structures.jsonl"),
  });
  console.log(JSON.stringify({ sourceCount: result.sourceCount, canonicalBodyCount: result.canonicalBodyCount, sha256: result.sha256 }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
