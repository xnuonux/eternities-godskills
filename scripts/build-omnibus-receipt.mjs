import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";

const FILES = {
  skill: "skills/eternities-omnibus/SKILL.md",
  operatingContract: "skills/eternities-omnibus/references/operating-contract.md",
  capabilityContract: "skills/eternities-omnibus/references/capability-contract.json",
  routingCard: "skills/eternities-omnibus/references/routing-card.json",
  evaluation: "skills/eternities-omnibus/evals/cases.json",
  atlasModule: "src/quarry-atlas.mjs",
  atlasTests: "tests/quarry-atlas.test.mjs",
};

async function artifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

export async function buildOmnibus(root = path.resolve("."), { write = true } = {}) {
  const suite = JSON.parse(await readFile(path.join(root, FILES.evaluation), "utf8"));
  const policy = JSON.parse(await readFile(path.join(root, "policies/promotion.v1.json"), "utf8"));
  const skillBytes = await readFile(path.join(root, FILES.skill));
  const infusionPath = "receipts/quarry-total-infusion-v1.json";
  const infusionBytes = await readFile(path.join(root, infusionPath));
  const infusion = JSON.parse(infusionBytes.toString("utf8"));
  if (infusion.status !== "certified" || infusion.counts?.unresolvedSourceCount !== 0) throw new Error("Omnibus requires certified total infusion");
  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(skillBytes.length / 4), improvements: ["sourceCoverage"] };
  const decision = decidePromotion({ baseline, candidate, policy });
  if (decision.status !== "promoted") throw new Error(`Omnibus did not clear promotion: ${decision.status}`);
  const artifacts = Object.fromEntries(await Promise.all(Object.entries(FILES).map(async ([key, relativePath]) => [key, await artifact(root, relativePath)])));
  const receipt = {
    schemaVersion: 1,
    skillName: "eternities-omnibus",
    version: 1,
    evidenceLevel: "certified-total-infusion-and-deterministic-commandless-contract",
    evaluationMode: "deterministic-commandless-fixture",
    limitation: "This receipt proves exact current artifacts, route boundaries, bounded inert retrieval, and its certified infusion dependency. It does not prove arbitrary live-agent judgment, semantic correctness of third-party patterns, license clearance, safe source execution, or production activation.",
    evidence: {
      infusionReceipt: { path: infusionPath, sha256: sha256(infusionBytes), bytes: infusionBytes.length },
      infusionStatus: infusion.status,
      sourceCount: infusion.counts.sourceCount,
      canonicalBodyCount: infusion.counts.canonicalBodyCount,
      artifacts,
      sourceInstructionsActivated: false,
      thirdPartyCodeExecuted: false,
      externalMutation: false,
    },
    baseline,
    candidate,
    decision,
  };
  const receiptPath = "receipts/promotions/eternities-omnibus.json";
  if (write) await writeJsonAtomic(path.join(root, receiptPath), receipt);
  const receiptText = `${JSON.stringify(receipt, null, 2)}\n`;
  const synthesis = {
    schemaVersion: 1,
    candidateId: "eternities-omnibus",
    familyId: "quarry-corpus-discovery",
    status: "promoted",
    artifacts: {
      ...artifacts,
      infusionReceipt: receipt.evidence.infusionReceipt,
      promotionReceipt: { path: receiptPath, sha256: sha256(receiptText), bytes: Buffer.byteLength(receiptText) },
    },
    sourceInstructionsActivated: false,
    thirdPartyCodeExecuted: false,
    externalMutation: false,
    synthesisMethod: "independent-first-party-cold-atlas-retrieval-v1",
  };
  if (write) await writeJsonAtomic(path.join(root, "artifacts/omnibus/synthesis.v1.json"), synthesis);
  return { receipt, synthesis };
}

async function main() {
  const result = await buildOmnibus();
  console.log(JSON.stringify({ status: result.receipt.decision.status, sourceCount: result.receipt.evidence.sourceCount }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
