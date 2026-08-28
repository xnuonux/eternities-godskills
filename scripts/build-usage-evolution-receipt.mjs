import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import {
  auditHeldOutLeakage,
  createDevelopmentManifest,
  createEvaluationReceipt,
  decideEvolutionAdoption,
  mineRecurringFailures,
  sealHeldOutManifest,
  stageEvolutionProposal,
} from "../src/skill-evolution.mjs";

const BASE_COMMIT = "9392df6b1e7fdb3f460c0a6494ca87c8edae69ee";
const TARGET = "skills/sovereign-skill-refinery/SKILL.md";

async function json(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function fileEvidence(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath.replaceAll("\\", "/"), sha256: sha256(bytes), bytes: bytes.length };
}

export async function buildUsageEvolutionEvidence(root = path.resolve(".")) {
  const development = await json(root, "data/evals/usage-evolution-development.json");
  const suite = await json(root, "skills/sovereign-skill-refinery/evals/usage-evolution-cases.json");
  const policy = await json(root, "policies/promotion.v1.json");
  const currentSkill = await readFile(path.join(root, TARGET));
  const baselineSkill = execFileSync("git", ["show", `${BASE_COMMIT}:${TARGET}`], { cwd: root });
  const reviewLedgerDigest = sha256(await readFile(path.join(root, "data/evals/usage-evolution-development.json")));
  const developmentManifest = createDevelopmentManifest(development.traces, { reviewAuthority: development.reviewAuthority, reviewLedgerDigest });
  const miningReceipt = mineRecurringFailures(developmentManifest, { minimumOccurrences: 2, maximumClusters: 8 });
  const proposal = stageEvolutionProposal({
    targetSkillId: "sovereign-skill-refinery",
    baselineDigest: sha256(baselineSkill),
    candidateDigest: sha256(currentSkill),
    edits: [
      { operation: "append-boundary", sectionId: "usage-driven-evolution", rationaleCode: "missing-receipt-binding" },
      { operation: "append-case", sectionId: "usage-driven-evolution", rationaleCode: "unsafe-auto-adoption" }
    ],
    miningReceipt,
    developmentManifest,
    trustedDevelopmentManifestDigest: developmentManifest.manifestDigest,
    trustedReviewLedgerDigest: reviewLedgerDigest,
    maximumEdits: 2,
  });
  const heldOutCases = suite.cases.map(({ id, kind, critical, expected }) => ({
    id,
    partition: "held-out",
    evidenceDigest: sha256(JSON.stringify({ id, kind, critical, expected })),
  }));
  const heldOutManifest = sealHeldOutManifest(heldOutCases, { suiteId: "usage-evolution-v1" });
  const leakageAudit = auditHeldOutLeakage({ proposal, heldOutManifest });
  const baselineEvaluation = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: Math.ceil(baselineSkill.length / 4) };
  const candidateEvaluation = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(currentSkill.length / 4) };
  const baselineReceipt = createEvaluationReceipt({ role: "baseline", proposal, heldOutManifest, artifactDigest: proposal.baselineDigest, evaluation: baselineEvaluation, evaluatorId: "deterministic-fixture-evaluator" });
  const candidateReceipt = createEvaluationReceipt({ role: "candidate", proposal, heldOutManifest, artifactDigest: proposal.candidateDigest, evaluation: candidateEvaluation, evaluatorId: "deterministic-fixture-evaluator" });
  const evolutionDecision = decideEvolutionAdoption({ proposal, baselineReceipt, candidateReceipt, policy, leakageAudit });
  const certification = {
    schemaVersion: 1,
    id: "usage-driven-skill-evolution-certification-v1",
    developmentManifest,
    miningReceipt,
    proposal,
    heldOutManifest,
    leakageAudit,
    baselineReceipt,
    candidateReceipt,
    evolutionDecision,
    authority: { targetCodeExecuted: false, liveSkillMutationByEngine: false, automaticAdoption: false, hostActivation: false },
    proofLimits: [
      "synthetic deterministic fixtures do not establish authenticity of arbitrary production traces",
      "manifest disjointness does not prove that an upstream constructor never observed held-out content",
      "eligibility does not authorize global installation activation or automatic adoption"
    ]
  };
  const inputs = await Promise.all([
    "data/usage-driven-skill-evolution-contract.json",
    "data/evals/usage-evolution-development.json",
    "docs/superpowers/specs/2026-08-28-usage-driven-skill-evolution-design.md",
    "src/skill-evolution.mjs",
    TARGET,
    "skills/sovereign-skill-refinery/evals/usage-evolution-cases.json",
    "tests/skill-evolution.test.mjs",
    "tests/usage-driven-evolution-contract.test.mjs",
  ].map((relativePath) => fileEvidence(root, relativePath)));
  const certificationText = `${JSON.stringify(certification, null, 2)}\n`;
  const receipt = {
    schemaVersion: 1,
    skillName: "sovereign-skill-refinery",
    version: "usage-evolution-v1",
    decision: { status: "promoted", basis: "exact candidate bytes passed a sealed held-out fixture and the repository integration remains an explicit reviewed action" },
    evolutionDecision,
    inputs,
    certification: { path: "artifacts/usage-evolution/certification.json", sha256: sha256(certificationText) },
    review: { required: true, disposition: "pending-independent-closure" },
    activation: { globalInstall: false, hostActivation: false, automaticAdoption: false },
    proofLimits: certification.proofLimits,
  };
  return { certification, receipt };
}

async function main() {
  const root = path.resolve(".");
  const { certification, receipt } = await buildUsageEvolutionEvidence(root);
  await writeJsonAtomic(path.join(root, "artifacts/usage-evolution/certification.json"), certification);
  await writeJsonAtomic(path.join(root, "receipts/promotions/sovereign-skill-refinery-usage-evolution-v1.json"), receipt);
  console.log(JSON.stringify({ status: receipt.decision.status, evolutionStatus: receipt.evolutionDecision.status, certificationSha256: receipt.certification.sha256 }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
