import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildExaColdIntake } from "../src/exa-cold-intake.mjs";

const repositoryRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const defaultOperationRoot = "D:/03-ARSENAL/warehouse/_operations/exa-skill-acquisition-2026-09-20";
const expectedSourceEnvelopeSha256 = "2e6dd42e131c199dd192fd77e3cb14f70c39a7c3195cea3e7cbccbdc3ae11697";
const expectedIntegrationReceiptSha256 = "3f9dc0ebd841fcff6d06b12f52dabe29ef4514faee8749990ee34597296aec31";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function parseArgs(argv) {
  const parsed = {
    operationRoot: defaultOperationRoot,
    outputPath: path.join(repositoryRoot, "data", "quarry-intake-2026-09-21-exa"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--operation-root") parsed.operationRoot = path.resolve(argv[++index]);
    else if (argument === "--output") parsed.outputPath = path.resolve(argv[++index]);
    else if (argument === "--help" || argument === "-h") parsed.help = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return parsed;
}

export async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log("Usage: node scripts/import-exa-cold-intake.mjs [--operation-root PATH] [--output PATH]");
    return null;
  }
  const sourcePath = path.join(args.operationRoot, "source-records.json");
  const receiptPath = path.join(args.operationRoot, "index-integration-receipt.json");
  const [sourceBody, receiptBody] = await Promise.all([readFile(sourcePath), readFile(receiptPath)]);
  const result = buildExaColdIntake({
    sourceEnvelope: JSON.parse(sourceBody),
    integrationReceipt: JSON.parse(receiptBody),
    sourceEnvelopeSha256: sha256(sourceBody),
    integrationReceiptSha256: sha256(receiptBody),
    expectedSourceEnvelopeSha256,
    expectedIntegrationReceiptSha256,
  });
  const sourcesBody = Buffer.from(result.jsonl);
  const manifestWithoutDigest = {
    ...result.manifest,
    outputs: {
      sourcesJsonlSha256: sha256(sourcesBody),
      sourcesJsonlBytes: sourcesBody.length,
    },
  };
  const manifest = {
    ...manifestWithoutDigest,
    manifestSha256: sha256(JSON.stringify(canonicalize(manifestWithoutDigest))),
  };
  await mkdir(args.outputPath, { recursive: true });
  await Promise.all([
    writeFile(path.join(args.outputPath, "sources.jsonl"), sourcesBody, { flag: "wx" }),
    writeFile(path.join(args.outputPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" }),
  ]);
  console.log(JSON.stringify({ outputPath: args.outputPath, ...manifest }, null, 2));
  return manifest;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await run();
