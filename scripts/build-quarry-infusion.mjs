import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildQuarryInfusion } from "../src/quarry-infusion.mjs";

const INPUTS = {
  sources: "artifacts/github-wave-2/source-records.jsonl",
  security: "artifacts/github-wave-2/skill-security-ledger.jsonl",
  structures: "artifacts/quarry-infusion/body-structures.jsonl",
  ontology: "data/ontology.v1.json",
  familyTargets: "data/quarry-family-targets.v1.json",
};

const OUTPUTS = {
  canonicalSources: "artifacts/quarry-infusion/canonical-sources.jsonl",
  terminalDispositions: "artifacts/quarry-infusion/terminal-dispositions.jsonl",
  facets: "artifacts/quarry-infusion/facets.jsonl",
  familyIndex: "artifacts/quarry-infusion/family-index.json",
  coverage: "artifacts/quarry-infusion/coverage.json",
};

const RECEIPT_PATH = "receipts/quarry-total-infusion-v1.json";

function parseJsonl(text, label) {
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`${label} line ${index + 1}: ${error.message}`); }
  });
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonl(rows) {
  return `${rows.map(JSON.stringify).join("\n")}\n`;
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

function evidence(relativePath, bytes) {
  const value = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return { path: relativePath, sha256: sha256(value), bytes: value.length };
}

function validateBodyStructures(sources, rows) {
  const expected = new Set(sources.map(({ bodySha256 }) => bodySha256));
  const structures = {};
  for (const row of rows) {
    if (!expected.has(row?.bodySha256) || structures[row.bodySha256]) {
      throw new Error(`body structure coverage has an unexpected or duplicate digest: ${row?.bodySha256}`);
    }
    if (!row.structure || typeof row.structure !== "object") {
      throw new Error(`body structure coverage has an invalid record: ${row.bodySha256}`);
    }
    structures[row.bodySha256] = row.structure;
  }
  if (Object.keys(structures).length !== expected.size) {
    throw new Error(`body structure coverage is incomplete: expected ${expected.size}, received ${Object.keys(structures).length}`);
  }
  return structures;
}

export async function buildQuarryInfusionEvidence({ root = path.resolve("."), write = true } = {}) {
  const rawInputs = Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, relativePath]) => [
    key,
    await readFile(path.join(root, relativePath)),
  ])));
  const sources = parseJsonl(rawInputs.sources.toString("utf8"), INPUTS.sources);
  const securityRows = parseJsonl(rawInputs.security.toString("utf8"), INPUTS.security);
  const structureRows = parseJsonl(rawInputs.structures.toString("utf8"), INPUTS.structures);
  const ontology = JSON.parse(rawInputs.ontology.toString("utf8"));
  const familyTargets = JSON.parse(rawInputs.familyTargets.toString("utf8"));
  const bodyStructures = validateBodyStructures(sources, structureRows);
  const result = buildQuarryInfusion({ sources, securityRows, bodyStructures, ontology, familyTargets });

  const outputTexts = {
    canonicalSources: jsonl(result.canonical),
    terminalDispositions: jsonl(result.dispositions),
    facets: jsonl(result.facets),
    familyIndex: json(result.familyIndex),
    coverage: json(result.coverage),
  };
  const inputs = Object.fromEntries(Object.entries(INPUTS).map(([key, relativePath]) => [key, evidence(relativePath, rawInputs[key])]));
  const outputs = Object.fromEntries(Object.entries(OUTPUTS).map(([key, relativePath]) => [key, evidence(relativePath, outputTexts[key])]));
  const receipt = {
    schemaVersion: 1,
    certification: "quarry-total-infusion",
    status: result.coverage.unresolvedSourceCount === 0 ? "certified" : "failed",
    evidenceLevel: "exact-source-disposition-and-inert-structural-facet",
    limitation: "This certificate proves exact deterministic coverage, duplicate folding, static security disposition, structural extraction, bounded family mapping, and current artifact bytes. It does not prove semantic correctness, safe execution of third-party instructions, unseen behavior, production activation, or license clearance.",
    counts: result.coverage,
    inputs,
    outputs,
    thirdPartyCodeExecuted: false,
    sourceInstructionsActivated: false,
    externalMutation: false,
  };
  if (receipt.status !== "certified") throw new Error("quarry infusion did not certify");

  if (write) {
    await Promise.all(Object.entries(OUTPUTS).map(([key, relativePath]) => writeTextAtomic(path.join(root, relativePath), outputTexts[key])));
    await writeJsonAtomic(path.join(root, RECEIPT_PATH), receipt);
  }
  return { ...result, receipt };
}

async function main() {
  const result = await buildQuarryInfusionEvidence();
  console.log(JSON.stringify({ status: result.receipt.status, counts: result.coverage }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
