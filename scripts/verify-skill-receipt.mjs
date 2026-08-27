import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildSkillReceipt } from "./evaluate-skill.mjs";

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--skill") parsed.skill = argv[++index];
    else if (value === "--policy") parsed.policy = argv[++index];
    else if (value === "--receipt") parsed.receipt = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  for (const required of ["skill", "policy", "receipt"]) {
    if (!parsed[required]) throw new Error(`--${required} is required`);
  }
  return parsed;
}

export async function verifySkillReceipt({ skillPath, policyPath, receiptPath }) {
  const [actual, expected] = await Promise.all([
    buildSkillReceipt({ skillPath, policyPath }),
    readFile(receiptPath, "utf8").then(JSON.parse),
  ]);
  assert.deepEqual(expected, actual, `stale promotion receipt: ${receiptPath}`);
  return {
    schemaVersion: 1,
    valid: true,
    skillName: actual.skillName,
    decision: actual.decision.status,
    tokenCount: actual.candidate.tokenCount,
    sourceCoverage: actual.evidence.candidateSourceCoverage,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await verifySkillReceipt({
    skillPath: path.resolve(args.skill),
    policyPath: path.resolve(args.policy),
    receiptPath: path.resolve(args.receipt),
  });
  console.log(JSON.stringify(result));
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) await main();
