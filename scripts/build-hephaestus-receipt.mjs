import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

const PATHS = {
  skill: "skills/eternities-hephaestus/SKILL.md",
  operatingContract: "skills/eternities-hephaestus/references/operating-contract.md",
  capabilityContract: "skills/eternities-hephaestus/references/capability-contract.json",
  routingCard: "skills/eternities-hephaestus/references/routing-card.json",
  evalSuite: "skills/eternities-hephaestus/evals/cases.json",
  synthesis: "artifacts/hephaestus/synthesis.v1.json",
  wave3Receipt: "receipts/github-skill-quarry-wave-3.json",
  wave3Sources: "artifacts/github-wave-3/source-records.jsonl",
  policy: "policies/promotion.v1.json",
};
const RECEIPT_PATH = "receipts/promotions/eternities-hephaestus.json";

function evidence(relativePath, bytes) {
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

function parseJsonl(bytes) {
  return bytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

export async function buildHephaestusReceipt({ root = path.resolve("."), write = true } = {}) {
  const bytes = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async ([key, relativePath]) => [key, await readFile(path.join(root, relativePath))])));
  const suite = JSON.parse(bytes.evalSuite);
  const synthesis = JSON.parse(bytes.synthesis);
  const contract = JSON.parse(bytes.capabilityContract);
  const card = JSON.parse(bytes.routingCard);
  const wave3Receipt = JSON.parse(bytes.wave3Receipt);
  const policy = JSON.parse(bytes.policy);
  validateCapabilityContract(contract);
  validateRoutingCard(card);
  if (wave3Receipt.status !== "verified" || wave3Receipt.outputs?.sourceRecords?.sha256 !== sha256(bytes.wave3Sources)) {
    throw new Error("wave 3 source evidence mismatch");
  }
  const sourceById = new Map(parseJsonl(bytes.wave3Sources).map((source) => [source.id, source]));
  for (const source of synthesis.sources) {
    const exact = sourceById.get(source.id);
    if (!exact || exact.bodySha256 !== source.bodySha256 || exact.inert !== true || source.sourceProseCopied !== false || source.sourceInstructionsActivated !== false) {
      throw new Error(`Hephaestus provenance mismatch: ${source.id}`);
    }
  }
  if (synthesis.status !== "promoted" || synthesis.targetCodeExecuted !== false || synthesis.externalMutation !== false) {
    throw new Error("Hephaestus synthesis is not promotion-safe");
  }
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(bytes.skill.length / 4),
    improvements: synthesis.sources.length > suite.baseline.sourceCoverage ? ["sourceCoverage"] : [],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  if (decision.status !== "promoted") throw new Error(`Hephaestus promotion failed: ${decision.failedGates.join(",")}`);
  const artifacts = Object.fromEntries(
    Object.entries(PATHS)
      .filter(([key]) => !["wave3Sources", "policy"].includes(key))
      .map(([key, relativePath]) => [key, evidence(relativePath, bytes[key])]),
  );
  const receipt = {
    schemaVersion: 1,
    skillName: "eternities-hephaestus",
    version: 1,
    evidenceLevel: "provider-neutral-model-runtime-compute-candidate-certified",
    evaluationMode: "deterministic-fixtures-inert-provenance-and-promotion-policy",
    limitation: "This receipt proves exact inert provenance, contract validity, deterministic route fixtures, promotion policy, and current artifact bytes. It does not prove arbitrary model quality, runtime compatibility, benchmark transfer, current provider facts, or authority to download purchase deploy or mutate routing.",
    evidence: {
      sourceCount: synthesis.sources.length,
      sourceProseCopied: false,
      targetCodeExecuted: false,
      sourceInstructionsActivated: false,
      externalMutation: false,
      wave3SourceRecordsSha256: wave3Receipt.outputs.sourceRecords.sha256,
    },
    baseline,
    candidate,
    decision,
    artifacts,
  };
  if (write) await writeJsonAtomic(path.join(root, RECEIPT_PATH), receipt);
  return { receipt, synthesis };
}

async function main() {
  const { receipt } = await buildHephaestusReceipt();
  console.log(JSON.stringify({ status: receipt.decision.status, critical: `${receipt.candidate.criticalPassed}/${receipt.candidate.criticalTotal}`, tokenCount: receipt.candidate.tokenCount }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
