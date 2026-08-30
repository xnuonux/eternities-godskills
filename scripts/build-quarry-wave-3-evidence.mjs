import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildSkillSecurityLedger } from "./build-skill-security-ledger.mjs";
import { extractQuarryBodyStructures } from "./extract-quarry-body-structures.mjs";

const PATHS = Object.freeze({
  sourceRecords: "artifacts/github-wave-3/source-records.jsonl",
  securityLedger: "artifacts/github-wave-3/skill-security-ledger.jsonl",
  bodyStructures: "artifacts/github-wave-3/body-structures.jsonl",
  securityReceipt: "receipts/github-wave-3-skill-security.json",
  structuralReceipt: "receipts/github-wave-3-structural-evidence.json",
});

function evidence(relativePath, bytes) {
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

export async function buildWaveThreeEvidence({ root = path.resolve(".") } = {}) {
  const sourcePath = path.join(root, PATHS.sourceRecords);
  const security = await buildSkillSecurityLedger({
    recordsPath: sourcePath,
    ledgerPath: path.join(root, PATHS.securityLedger),
    receiptPath: path.join(root, PATHS.securityReceipt),
  });
  const structures = await extractQuarryBodyStructures({
    recordsPath: sourcePath,
    outputPath: path.join(root, PATHS.bodyStructures),
    write: true,
  });
  const [sourceBytes, securityBytes, structureBytes, securityReceipt] = await Promise.all([
    readFile(sourcePath),
    readFile(path.join(root, PATHS.securityLedger)),
    readFile(path.join(root, PATHS.bodyStructures)),
    readJson(path.join(root, PATHS.securityReceipt)),
  ]);
  if (securityReceipt.totalSources !== structures.sourceCount) {
    throw new Error("security and structural source counts do not match");
  }
  const receipt = {
    schemaVersion: 1,
    certification: "github-wave-3-structural-evidence",
    status: "verified",
    evidenceLevel: "exact-inert-static-scan-and-bounded-body-structure",
    limitation: "This receipt proves exact static scan coverage and bounded structural extraction. It does not make third-party instructions trusted, semantically correct, executable, promoted, or license-cleared.",
    inputs: { sourceRecords: evidence(PATHS.sourceRecords, sourceBytes) },
    outputs: {
      securityLedger: evidence(PATHS.securityLedger, securityBytes),
      bodyStructures: evidence(PATHS.bodyStructures, structureBytes),
      securityReceipt: {
        path: PATHS.securityReceipt,
        sha256: sha256(await readFile(path.join(root, PATHS.securityReceipt))),
      },
    },
    counts: {
      sourceCount: structures.sourceCount,
      canonicalBodyCount: structures.canonicalBodyCount,
      scanErrors: securityReceipt.scanErrors,
      securityDispositions: securityReceipt.dispositions,
    },
    thirdPartyCodeExecuted: false,
    sourceInstructionsActivated: false,
    externalMutation: false,
  };
  await writeJsonAtomic(path.join(root, PATHS.structuralReceipt), receipt);
  return { security: securityReceipt, structures, receipt };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const result = await buildWaveThreeEvidence();
  process.stdout.write(`${JSON.stringify(result.receipt.counts)}\n`);
}
