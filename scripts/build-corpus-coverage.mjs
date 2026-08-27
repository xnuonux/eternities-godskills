import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { auditBodies } from "../src/body-audit.mjs";
import { buildCoverageRows, summarizeCoverage } from "../src/coverage.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { classify } from "../src/ontology.mjs";

const DEFAULTS = Object.freeze({
  warehouseRoot: "D:\\03-ARSENAL\\warehouse",
  sourceRecordsPath: "artifacts/release-one/source-records.jsonl",
  ontologyPath: "data/ontology.v1.json",
  provenancePath: "provenance/source-ledger.jsonl",
  outputPath: "artifacts/corpus",
});

function parseJsonLines(text, label) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${label} line ${index + 1} is invalid JSON: ${error.message}`);
      }
    });
}

async function writeTextAtomic(filePath, content) {
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.tmp`,
  );
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function jsonLines(rows) {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

export async function buildCorpusCoverage({
  warehouseRoot,
  sourceRecordsPath,
  ontologyPath,
  provenancePath,
  outputPath,
}) {
  const [sourceText, ontologyText, provenanceText] = await Promise.all([
    readFile(sourceRecordsPath, "utf8"),
    readFile(ontologyPath, "utf8"),
    readFile(provenancePath, "utf8"),
  ]);
  const ontology = JSON.parse(ontologyText);
  const records = parseJsonLines(sourceText, "source records").map((record) => ({
    ...record,
    families: classify(record, ontology),
  }));
  const provenanceRows = parseJsonLines(provenanceText, "provenance ledger");
  const bodyEvidence = await auditBodies(warehouseRoot, records);
  const coverageRows = buildCoverageRows(records, bodyEvidence, provenanceRows);
  const bodyText = jsonLines(bodyEvidence);
  const coverageText = jsonLines(coverageRows);
  const summary = {
    ...summarizeCoverage(coverageRows),
    warehouseRoot: path.resolve(warehouseRoot),
    ontologyVersion: ontology.version,
    inputDigests: {
      sourceRecordsSha256: sha256(sourceText),
      ontologySha256: sha256(ontologyText),
      provenanceSha256: sha256(provenanceText),
    },
    artifactDigests: {
      bodyEvidenceSha256: sha256(bodyText),
      coverageLedgerSha256: sha256(coverageText),
    },
    bodyStatusCounts: Object.fromEntries(
      ["inspected", "missing", "unreadable"].map((status) => [
        status,
        bodyEvidence.filter((row) => row.status === status).length,
      ]),
    ),
  };

  await mkdir(outputPath, { recursive: true });
  await Promise.all([
    writeTextAtomic(path.join(outputPath, "body-evidence.jsonl"), bodyText),
    writeTextAtomic(path.join(outputPath, "coverage-ledger.jsonl"), coverageText),
    writeJsonAtomic(path.join(outputPath, "coverage-summary.json"), summary),
  ]);
  return summary;
}

function parseArgs(argv) {
  const parsed = { ...DEFAULTS };
  const fields = {
    "--warehouse": "warehouseRoot",
    "--sources": "sourceRecordsPath",
    "--ontology": "ontologyPath",
    "--provenance": "provenancePath",
    "--output": "outputPath",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const field = fields[argv[index]];
    if (!field) throw new Error(`unknown argument: ${argv[index]}`);
    parsed[field] = argv[++index];
  }
  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await buildCorpusCoverage({
    warehouseRoot: path.resolve(args.warehouseRoot),
    sourceRecordsPath: path.resolve(args.sourceRecordsPath),
    ontologyPath: path.resolve(args.ontologyPath),
    provenancePath: path.resolve(args.provenancePath),
    outputPath: path.resolve(args.outputPath),
  });
  console.log(JSON.stringify(summary, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
