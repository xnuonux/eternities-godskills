import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { gateSkillAdvancement } from "../src/skill-supply-chain-defense.mjs";
import { writeJsonAtomic } from "../src/io.mjs";

function jsonLines(text, label) {
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${label} line ${index + 1} is invalid JSON: ${error.message}`);
    }
  });
}

export async function evaluateSkillAdvancement({ sourceId, recordsPath, ledgerPath, reviewPath }) {
  if (!sourceId) throw new Error("sourceId is required");
  const [recordText, ledgerText, reviewText] = await Promise.all([
    readFile(path.resolve(recordsPath), "utf8"),
    readFile(path.resolve(ledgerPath), "utf8"),
    readFile(path.resolve(reviewPath), "utf8"),
  ]);
  const records = jsonLines(recordText, "source records").filter(({ id }) => id === sourceId);
  const ledgerRows = jsonLines(ledgerText, "security ledger").filter(({ id }) => id === sourceId);
  if (records.length !== 1) throw new Error(`expected one exact source record: ${sourceId}`);
  if (ledgerRows.length !== 1) throw new Error(`expected one exact security ledger row: ${sourceId}`);
  const result = await gateSkillAdvancement({
    record: records[0],
    ledgerRow: ledgerRows[0],
    review: JSON.parse(reviewText),
  });
  return { schemaVersion: 1, sourceId, ...result };
}

function parseArgs(argv) {
  const args = {
    recordsPath: "artifacts/github-wave-2/source-records.jsonl",
    ledgerPath: "artifacts/github-wave-2/skill-security-ledger.jsonl",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--source-id") args.sourceId = argv[++index];
    else if (value === "--records") args.recordsPath = argv[++index];
    else if (value === "--ledger") args.ledgerPath = argv[++index];
    else if (value === "--review") args.reviewPath = argv[++index];
    else if (value === "--output") args.outputPath = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  for (const required of ["sourceId", "reviewPath", "outputPath"]) {
    if (!args[required]) throw new Error(`--${required.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} is required`);
  }
  return args;
}

if (pathToFileURL(process.argv[1] ?? "").href === import.meta.url) {
  const args = parseArgs(process.argv.slice(2));
  const result = await evaluateSkillAdvancement(args);
  await writeJsonAtomic(path.resolve(args.outputPath), result);
  process.stdout.write(`${JSON.stringify({ sourceId: result.sourceId, status: result.status })}\n`);
  if (result.status !== "eligible") process.exitCode = 2;
}
