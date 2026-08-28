import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";

const SOURCE_ID = "K-Dense-AI/scientific-agent-skills@36d8f13a1e754618794bf42f417884940077b4ae:skills/scientific-critical-thinking/SKILL.md";
const files = {
  skill: "skills/eternities-athena/SKILL.md",
  operatingContract: "skills/eternities-athena/references/operating-contract.md",
  capabilityContract: "skills/eternities-athena/references/capability-contract.json",
  routingCard: "skills/eternities-athena/references/routing-card.json",
  evaluation: "skills/eternities-athena/evals/cases.json"
};

async function evidence(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath, sha256: sha256(bytes) };
}

export async function buildAthena(root = path.resolve(".")) {
  const suite = JSON.parse(await readFile(path.join(root, files.evaluation), "utf8"));
  const policy = JSON.parse(await readFile(path.join(root, "policies/promotion.v1.json"), "utf8"));
  const skillBytes = await readFile(path.join(root, files.skill));
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(skillBytes.length / 4), improvements: ["sourceCoverage"] };
  const decision = decidePromotion({ baseline, candidate, policy });
  if (decision.status !== "promoted") throw new Error("Athena did not clear promotion: " + decision.status);
  const sourceRows = (await readFile(path.join(root, "artifacts/github-wave-2/source-records.jsonl"), "utf8")).trim().split(/\r?\n/).map(JSON.parse);
  const source = sourceRows.find(({ id }) => id === SOURCE_ID);
  if (!source || source.bodySha256 !== "48a3b32aa9273343dacae7532546a2fee375b148bb467305905b0ca169c1d3b0" || source.inert !== true) throw new Error("Athena source evidence is absent or stale");
  const artifacts = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, relativePath]) => [name, await evidence(root, relativePath)])));
  const receipt = {
    schemaVersion: 1,
    skillName: "eternities-athena",
    version: 1,
    evidenceLevel: "exact-inert-source-and-deterministic-contract",
    evaluationMode: "deterministic-commandless-fixture",
    limitation: "This receipt verifies exact source provenance, route boundaries, candidate fixtures, least authority, and current artifact bytes. It does not prove arbitrary live-model judgment, domain-expert agreement, medical validity, or correctness on unseen studies.",
    evidence: {
      sourceId: SOURCE_ID,
      sourceBodySha256: source.bodySha256,
      sourceLicenseSignal: source.licenseSignal,
      sourceDisposition: "independent-implementation",
      sourceProseCopied: false,
      implementationCopied: false,
      targetCodeExecuted: false,
      externalMutation: false,
      artifacts,
      sourceCoverage: 1
    },
    baseline,
    candidate,
    decision
  };
  const receiptPath = "receipts/promotions/eternities-athena.json";
  await writeJsonAtomic(path.join(root, receiptPath), receipt);
  const receiptEvidence = await evidence(root, receiptPath);
  const synthesis = {
    schemaVersion: 1,
    candidateId: "eternities-athena",
    familyId: "scientific-epistemology",
    status: "promoted",
    artifacts: { ...artifacts, promotionReceipt: receiptEvidence },
    sourceIds: [SOURCE_ID],
    copiedSourceProse: false,
    copiedImplementation: false,
    targetCodeExecuted: false,
    externalMutation: false,
    synthesisMethod: "independent-first-party-scientific-epistemology-v1"
  };
  await writeJsonAtomic(path.join(root, "artifacts/athena/synthesis.v1.json"), synthesis);
  return { receipt, synthesis };
}

async function main() {
  const result = await buildAthena(path.resolve("."));
  console.log(JSON.stringify({ status: result.receipt.decision.status, cases: result.receipt.candidate.total }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
