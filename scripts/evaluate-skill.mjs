import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { deriveSourceEvidence } from "../src/provenance-evidence.mjs";

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

export async function evaluateSkill({ skillPath, policyPath, receiptPath }) {
  const casesPath = path.join(skillPath, "evals", "cases.json");
  const skillFile = path.join(skillPath, "SKILL.md");
  const contractPath = path.join(skillPath, "references", "capability-contract.json");
  const ledgerPath = path.join(path.resolve(skillPath, "..", ".."), "provenance", "source-ledger.jsonl");
  const [skillText, casesText, policyText, contractText, ledgerText] = await Promise.all([
    readFile(skillFile, "utf8"),
    readFile(casesPath, "utf8"),
    readFile(policyPath, "utf8"),
    readFile(contractPath, "utf8"),
    readFile(ledgerPath, "utf8"),
  ]);
  const suite = JSON.parse(casesText);
  const policy = JSON.parse(policyText);
  const contract = JSON.parse(contractText);
  const ledger = ledgerText.trim().split(/\r?\n/).map(JSON.parse);
  const sourceEvidence = deriveSourceEvidence(contract, ledger);
  const measuredTokenCount = Math.ceil(Buffer.byteLength(skillText, "utf8") / 4);
  const baseline = {
    ...evaluateSuite(suite.cases, suite.baseline.results),
    tokenCount: suite.baseline.tokenCount,
  };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: measuredTokenCount,
    improvements:
      sourceEvidence.sourceCoverage > suite.baseline.sourceCoverage
        ? ["sourceCoverage"]
        : [],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  const receipt = {
    schemaVersion: 1,
    skillName: path.basename(skillPath),
    evidenceLevel: "contract-certified",
    evaluationMode: "deterministic-contract-and-routing-fixture",
    limitation:
      "This receipt independently verifies contract structure, exact provenance coverage, declared routing fixtures, and promotion-policy invariants. It does not prove live-model routing behavior.",
    evidence: {
      skillSha256: sha256(skillText),
      casesSha256: sha256(casesText),
      policySha256: sha256(policyText),
      measuredTokenCount,
      baselineSourceCoverage: suite.baseline.sourceCoverage,
      candidateSourceCoverage: sourceEvidence.sourceCoverage,
      sourceIds: sourceEvidence.sourceIds,
      sourceProseCopied: sourceEvidence.proseCopied,
    },
    baseline,
    candidate,
    decision,
  };
  await writeJsonAtomic(receiptPath, receipt);
  return receipt;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await evaluateSkill({
    skillPath: path.resolve(args.skill),
    policyPath: path.resolve(args.policy),
    receiptPath: path.resolve(args.receipt),
  });
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.decision.status !== "promoted") process.exitCode = 2;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
