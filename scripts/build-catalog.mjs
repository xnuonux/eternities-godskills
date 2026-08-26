import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { normalizeIndex } from "../src/catalog.mjs";
import { findDuplicateGroups } from "../src/clusters.mjs";
import { readJson, sha256, writeJsonAtomic } from "../src/io.mjs";
import { classify, summarizeOntology } from "../src/ontology.mjs";

const DEFAULT_INDEX =
  "C:\\Users\\Dom\\.codex\\skills\\arsenal-repo-miner\\references\\skill-index.json";

function parseArgs(argv) {
  const parsed = {
    index: DEFAULT_INDEX,
    ontology: "data/ontology.v1.json",
    output: "artifacts/release-one",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--index") parsed.index = argv[++index];
    else if (value === "--ontology") parsed.ontology = argv[++index];
    else if (value === "--output") parsed.output = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  return parsed;
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

export async function buildCatalog({ indexPath, ontologyPath, outputPath }) {
  const [indexText, ontology] = await Promise.all([
    readFile(indexPath, "utf8"),
    readJson(ontologyPath),
  ]);
  const index = JSON.parse(indexText);
  const sourceRecords = normalizeIndex(index).map((record) => ({
    ...record,
    families: classify(record, ontology),
  }));
  const duplicateGroups = findDuplicateGroups(sourceRecords);
  const sourceText = `${sourceRecords.map((record) => JSON.stringify(record)).join("\n")}\n`;
  const duplicateText = `${JSON.stringify(duplicateGroups, null, 2)}\n`;
  const ontologySummary = {
    ...summarizeOntology(sourceRecords, ontology),
    indexSha256: sha256(indexText),
    sourceRecordsSha256: sha256(sourceText),
    duplicateGroupsSha256: sha256(duplicateText),
    duplicateGroupCounts: {
      exact: duplicateGroups.exact.length,
      aliases: duplicateGroups.aliases.length,
      candidates: duplicateGroups.candidates.length,
    },
  };

  await mkdir(outputPath, { recursive: true });
  await Promise.all([
    writeTextAtomic(path.join(outputPath, "source-records.jsonl"), sourceText),
    writeJsonAtomic(path.join(outputPath, "duplicate-groups.json"), duplicateGroups),
    writeJsonAtomic(path.join(outputPath, "ontology-summary.json"), ontologySummary),
  ]);
  return ontologySummary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await buildCatalog({
    indexPath: path.resolve(args.index),
    ontologyPath: path.resolve(args.ontology),
    outputPath: path.resolve(args.output),
  });
  console.log(JSON.stringify(summary, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
