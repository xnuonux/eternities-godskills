import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { unionQuarryEvidence } from "../src/quarry-corpus-union.mjs";
import { buildQuarryInfusion } from "../src/quarry-infusion.mjs";

const INPUTS = {
  wave2Sources: "artifacts/github-wave-2/source-records.jsonl",
  wave2Security: "artifacts/github-wave-2/skill-security-ledger.jsonl",
  wave2Structures: "artifacts/quarry-infusion/body-structures.jsonl",
  wave3Sources: "artifacts/github-wave-3/source-records.jsonl",
  wave3Security: "artifacts/github-wave-3/skill-security-ledger.jsonl",
  wave3Structures: "artifacts/github-wave-3/body-structures.jsonl",
  ontology: "data/ontology.v1.json",
  familyTargets: "data/quarry-family-targets.v1.json",
};

const RECEIPTS = {
  wave2: "receipts/quarry-total-infusion-v1.json",
  wave3Snapshot: "receipts/github-skill-quarry-wave-3.json",
  wave3Security: "receipts/github-wave-3-skill-security.json",
  wave3Structures: "receipts/github-wave-3-structural-evidence.json",
};

const OUTPUTS = {
  canonicalSources: "artifacts/quarry-infusion-v2/canonical-sources.jsonl",
  terminalDispositions: "artifacts/quarry-infusion-v2/terminal-dispositions.jsonl",
  facets: "artifacts/quarry-infusion-v2/facets.jsonl",
  familyIndex: "artifacts/quarry-infusion-v2/family-index.json",
  coverage: "artifacts/quarry-infusion-v2/coverage.json",
  corpusUnion: "artifacts/quarry-infusion-v2/corpus-union.json",
};

const RECEIPT_PATH = "receipts/quarry-total-infusion-v2.json";

function parseJsonl(bytes, label) {
  return bytes.toString("utf8").split(/\r?\n/).filter(Boolean).map((line, index) => {
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

function evidence(relativePath, bytes) {
  const value = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return { path: relativePath, sha256: sha256(value), bytes: value.length };
}

function assertBinding(binding, expectedPath, bytes, label) {
  if (!binding || binding.path !== expectedPath || binding.sha256 !== sha256(bytes)) {
    throw new Error(`${label} evidence binding mismatch`);
  }
  if (binding.bytes !== undefined && binding.bytes !== bytes.length) {
    throw new Error(`${label} evidence byte count mismatch`);
  }
}

function validateEvidenceReceipts(parsed, rawInputs) {
  if (parsed.wave2.status !== "certified") throw new Error("wave 2 evidence is not certified");
  assertBinding(parsed.wave2.inputs?.sources, INPUTS.wave2Sources, rawInputs.wave2Sources, "wave 2 sources");
  assertBinding(parsed.wave2.inputs?.security, INPUTS.wave2Security, rawInputs.wave2Security, "wave 2 security");
  assertBinding(parsed.wave2.inputs?.structures, INPUTS.wave2Structures, rawInputs.wave2Structures, "wave 2 structures");

  if (parsed.wave3Snapshot.status !== "verified") throw new Error("wave 3 snapshot is not verified");
  assertBinding(parsed.wave3Snapshot.outputs?.sourceRecords, INPUTS.wave3Sources, rawInputs.wave3Sources, "wave 3 sources");

  const securitySourceBinding = {
    path: parsed.wave3Security.sourceRecordsPath,
    sha256: parsed.wave3Security.sourceRecordsSha256,
  };
  const securityLedgerBinding = {
    path: parsed.wave3Security.ledgerPath,
    sha256: parsed.wave3Security.ledgerSha256,
  };
  assertBinding(securitySourceBinding, INPUTS.wave3Sources, rawInputs.wave3Sources, "wave 3 security sources");
  assertBinding(securityLedgerBinding, INPUTS.wave3Security, rawInputs.wave3Security, "wave 3 security ledger");

  if (parsed.wave3Structures.status !== "verified") throw new Error("wave 3 structures are not verified");
  assertBinding(parsed.wave3Structures.inputs?.sourceRecords, INPUTS.wave3Sources, rawInputs.wave3Sources, "wave 3 structural sources");
  assertBinding(parsed.wave3Structures.outputs?.securityLedger, INPUTS.wave3Security, rawInputs.wave3Security, "wave 3 structural security");
  assertBinding(parsed.wave3Structures.outputs?.bodyStructures, INPUTS.wave3Structures, rawInputs.wave3Structures, "wave 3 body structures");
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

export async function buildQuarryInfusionV2Evidence({ root = path.resolve("."), write = true } = {}) {
  const rawInputs = Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, relativePath]) => [
    key,
    await readFile(path.join(root, relativePath)),
  ])));
  const rawReceipts = Object.fromEntries(await Promise.all(Object.entries(RECEIPTS).map(async ([key, relativePath]) => [
    key,
    await readFile(path.join(root, relativePath)),
  ])));
  const parsedReceipts = Object.fromEntries(Object.entries(rawReceipts).map(([key, bytes]) => [key, JSON.parse(bytes)]));
  validateEvidenceReceipts(parsedReceipts, rawInputs);

  const waves = [
    {
      id: "wave-2",
      sources: parseJsonl(rawInputs.wave2Sources, INPUTS.wave2Sources),
      securityRows: parseJsonl(rawInputs.wave2Security, INPUTS.wave2Security),
      bodyStructures: parseJsonl(rawInputs.wave2Structures, INPUTS.wave2Structures),
    },
    {
      id: "wave-3",
      sources: parseJsonl(rawInputs.wave3Sources, INPUTS.wave3Sources),
      securityRows: parseJsonl(rawInputs.wave3Security, INPUTS.wave3Security),
      bodyStructures: parseJsonl(rawInputs.wave3Structures, INPUTS.wave3Structures),
    },
  ];
  const union = unionQuarryEvidence({ waves });
  const result = buildQuarryInfusion({
    sources: union.sources,
    securityRows: union.securityRows,
    bodyStructures: union.bodyStructures,
    ontology: JSON.parse(rawInputs.ontology),
    familyTargets: JSON.parse(rawInputs.familyTargets),
  });
  const corpusUnion = {
    schemaVersion: 2,
    waveIds: union.waveIds,
    rawSourceRecordCount: union.rawSourceRecordCount,
    coalescedSourceIdentityCount: union.sources.length,
    coalescedDuplicateSourceRecordCount: union.coalescedDuplicateSourceRecordCount,
    sourceCount: union.sources.length,
    canonicalBodyCount: union.canonicalBodies.length,
    crossWaveDuplicateBodyCount: union.canonicalBodies.filter(({ sourceIds }) => {
      const wavesPresent = new Set(sourceIds.flatMap((id) => union.sourceWaveIdsById[id]));
      return wavesPresent.size > 1;
    }).length,
    aliasesByDigest: union.aliasesByDigest,
  };
  const outputTexts = {
    canonicalSources: jsonl(result.canonical),
    terminalDispositions: jsonl(result.dispositions),
    facets: jsonl(result.facets),
    familyIndex: json(result.familyIndex),
    coverage: json(result.coverage),
    corpusUnion: json(corpusUnion),
  };
  const receipt = {
    schemaVersion: 2,
    certification: "quarry-total-infusion-v2",
    status: result.coverage.unresolvedSourceCount === 0 ? "certified" : "failed",
    evidenceLevel: "exact-cross-wave-source-disposition-and-inert-structural-facet",
    limitation: "This certificate proves exact deterministic cross-wave coverage, exact-body duplicate folding, static security disposition, bounded structural extraction, family mapping, and current artifact bytes. It does not prove semantic correctness, safe execution of third-party instructions, unseen behavior, production activation, promotion, or license clearance.",
    counts: result.coverage,
    waveEvidence: {
      wave2: { status: parsedReceipts.wave2.status, receipt: evidence(RECEIPTS.wave2, rawReceipts.wave2) },
      wave3: {
        status: parsedReceipts.wave3Snapshot.status,
        snapshotReceipt: evidence(RECEIPTS.wave3Snapshot, rawReceipts.wave3Snapshot),
        securityReceipt: evidence(RECEIPTS.wave3Security, rawReceipts.wave3Security),
        structuralReceipt: evidence(RECEIPTS.wave3Structures, rawReceipts.wave3Structures),
      },
    },
    inputs: Object.fromEntries(Object.entries(INPUTS).map(([key, relativePath]) => [key, evidence(relativePath, rawInputs[key])])),
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, relativePath]) => [key, evidence(relativePath, outputTexts[key])])),
    thirdPartyCodeExecuted: false,
    sourceInstructionsActivated: false,
    externalMutation: false,
  };
  if (receipt.status !== "certified") throw new Error("quarry infusion v2 did not certify");

  if (write) {
    await Promise.all(Object.entries(OUTPUTS).map(([key, relativePath]) => writeTextAtomic(path.join(root, relativePath), outputTexts[key])));
    await writeJsonAtomic(path.join(root, RECEIPT_PATH), receipt);
  }
  return { ...result, union, corpusUnion, receipt };
}

async function main() {
  const result = await buildQuarryInfusionV2Evidence();
  console.log(JSON.stringify({ status: result.receipt.status, counts: result.coverage, crossWaveDuplicateBodyCount: result.corpusUnion.crossWaveDuplicateBodyCount }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
