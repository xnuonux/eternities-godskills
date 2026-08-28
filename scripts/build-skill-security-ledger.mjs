import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildSkillLedgerRow, scanSkill } from "../src/skill-supply-chain-defense.mjs";
import { writeJsonAtomic } from "../src/io.mjs";

const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function parseJsonl(bytes) {
  const text = bytes.toString("utf8").trim();
  return text === "" ? [] : text.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`invalid source record JSON at line ${index + 1}: ${error.message}`);
    }
  });
}

async function writeJsonlAtomic(filePath, rows) {
  const resolved = path.resolve(filePath);
  const temporary = path.join(path.dirname(resolved), `.${path.basename(resolved)}.${process.pid}.${Date.now()}.tmp`);
  await mkdir(path.dirname(resolved), { recursive: true });
  const body = rows.length === 0 ? "" : `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  try {
    await writeFile(temporary, body, "utf8");
    await rename(temporary, resolved);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return Buffer.from(body);
}

function structuralFailure(error) {
  const message = String(error?.message ?? error).replaceAll(/\s+/g, " ").slice(0, 240);
  return {
    disposition: "reject-before-indexing",
    requiredReview: "reject",
    scanDigest: null,
    manifest: [],
    surfaces: [],
    findings: [{
      ruleId: "STRUCT-SCAN-FAILED",
      severity: "critical",
      path: "SKILL.md",
      line: null,
      evidence: message,
    }],
    scanError: message,
  };
}

function countBy(rows, selector) {
  const counts = {};
  for (const row of rows) {
    const value = selector(row);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compare(left, right)));
}

export async function buildSkillSecurityLedger(options = {}) {
  const recordsPath = path.resolve(options.recordsPath ?? "artifacts/github-wave-2/source-records.jsonl");
  const ledgerPath = path.resolve(options.ledgerPath ?? "artifacts/github-wave-2/skill-security-ledger.jsonl");
  const receiptPath = path.resolve(options.receiptPath ?? "receipts/github-wave-2-skill-security.json");
  const sourceBytes = await readFile(recordsPath);
  const sourceRecords = parseJsonl(sourceBytes).sort((left, right) => compare(left.id, right.id));
  const seen = new Set();
  const rows = [];

  for (const record of sourceRecords) {
    if (!record?.id || seen.has(record.id)) throw new Error(`duplicate source id: ${record?.id ?? "<missing>"}`);
    seen.add(record.id);
    if (record.inert !== true) throw new Error(`source is not marked inert: ${record.id}`);
    const sourceAbsolutePath = path.resolve(record.sourceAbsolutePath);
    const body = await readFile(sourceAbsolutePath);
    if (body.byteLength !== record.bodyBytes || sha256(body) !== record.bodySha256) {
      throw new Error(`body digest mismatch: ${record.id}`);
    }

    let scan;
    try {
      scan = await scanSkill(path.dirname(sourceAbsolutePath), options.scanOptions);
    } catch (error) {
      scan = structuralFailure(error);
    }
    const sourceManifestPath = path.basename(sourceAbsolutePath);
    const scannedBody = scan.manifest.find((entry) => entry.path.toLowerCase() === sourceManifestPath.toLowerCase());
    if (scan.scanDigest !== null && scannedBody?.sha256 !== record.bodySha256) {
      throw new Error(`scan body digest mismatch: ${record.id}`);
    }
    rows.push(buildSkillLedgerRow(record, scan));
  }

  const ledgerBytes = await writeJsonlAtomic(ledgerPath, rows);
  const dispositionCounts = countBy(rows, (row) => row.disposition);
  const findingRows = rows.flatMap((row) => row.findings);
  const summary = {
    totalSources: rows.length,
    dispositions: dispositionCounts,
    ruleTotals: countBy(findingRows, (finding) => finding.ruleId),
    scanErrors: rows.filter((row) => row.scanError).length,
  };
  const receipt = {
    schemaVersion: 1,
    sourceRecordsPath: path.relative(process.cwd(), recordsPath).replaceAll("\\", "/"),
    sourceRecordsSha256: sha256(sourceBytes),
    ledgerPath: path.relative(process.cwd(), ledgerPath).replaceAll("\\", "/"),
    ledgerSha256: sha256(ledgerBytes),
    ...summary,
    targetCodeExecuted: false,
    staticClearanceIsPromotion: false,
  };
  await writeJsonAtomic(receiptPath, receipt);
  return { rows, summary, receipt };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--records") options.recordsPath = argv[++index];
    else if (argument === "--ledger") options.ledgerPath = argv[++index];
    else if (argument === "--receipt") options.receiptPath = argv[++index];
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

if (pathToFileURL(process.argv[1] ?? "").href === import.meta.url) {
  const result = await buildSkillSecurityLedger(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result.summary)}\n`);
}
