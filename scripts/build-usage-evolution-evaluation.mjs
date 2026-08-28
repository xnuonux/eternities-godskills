import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { auditHeldOutLeakage, configureEvolutionTrust, createEvaluationReceipt, evidenceSubjectDigest, sealHeldOutManifest } from "../src/skill-evolution.mjs";
import { attestEvaluation, EVALUATOR_KEY_ID, EVALUATOR_PUBLIC_KEY, REVIEW_KEY_ID, REVIEW_PUBLIC_KEY, fixtureKeyProofLimit } from "./evolution-fixture-keys.mjs";

const BASE_COMMIT = "9392df6b1e7fdb3f460c0a6494ca87c8edae69ee";
const TARGET = "skills/sovereign-skill-refinery/SKILL.md";

async function json(root, relativePath) { return JSON.parse(await readFile(path.join(root, relativePath), "utf8")); }
async function fileEvidence(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath.replaceAll("\\", "/"), sha256: sha256(bytes), bytes: bytes.length };
}

export async function buildUsageEvolutionEvidence(root = path.resolve(".")) {
  const construction = await json(root, "artifacts/usage-evolution/construction.json");
  const suite = await json(root, "skills/sovereign-skill-refinery/evals/usage-evolution-cases.json");
  const policy = await json(root, "policies/promotion.v1.json");
  const currentSkill = await readFile(path.join(root, TARGET));
  const baselineSkill = execFileSync("git", ["show", `${BASE_COMMIT}:${TARGET}`], { cwd: root });
  const heldOutManifest = sealHeldOutManifest(suite.cases.map(({ id, kind, critical, expected }) => ({ id, partition: "held-out", evidenceDigest: sha256(JSON.stringify({ id, kind, critical, expected })) })), { suiteId: "usage-evolution-v1" });
  const leakageAudit = auditHeldOutLeakage({ proposal: construction.proposal, heldOutManifest });
  const baselineEvaluation = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: Math.ceil(baselineSkill.length / 4) };
  const candidateEvaluation = { ...evaluateSuite(suite.cases, suite.candidate.results), tokenCount: Math.ceil(currentSkill.length / 4) };
  const baselineReceipt = createEvaluationReceipt({ role: "baseline", proposal: construction.proposal, heldOutManifest, artifactDigest: construction.proposal.baselineDigest, evaluation: baselineEvaluation, evaluatorId: EVALUATOR_KEY_ID });
  const candidateReceipt = createEvaluationReceipt({ role: "candidate", proposal: construction.proposal, heldOutManifest, artifactDigest: construction.proposal.candidateDigest, evaluation: candidateEvaluation, evaluatorId: EVALUATOR_KEY_ID });
  const leakageAuditPackage = { record: leakageAudit, attestation: attestEvaluation("heldout-audit", evidenceSubjectDigest(leakageAudit)) };
  const baselinePackage = { record: baselineReceipt, attestation: attestEvaluation("baseline-evaluation", baselineReceipt.receiptDigest) };
  const candidatePackage = { record: candidateReceipt, attestation: attestEvaluation("candidate-evaluation", candidateReceipt.receiptDigest) };
  const authority = configureEvolutionTrust({ reviewPublicKeys: { [REVIEW_KEY_ID]: REVIEW_PUBLIC_KEY }, evaluatorPublicKeys: { [EVALUATOR_KEY_ID]: EVALUATOR_PUBLIC_KEY } });
  const evolutionDecision = authority.decideAdoption({ proposal: construction.proposal, baselinePackage, candidatePackage, policy, leakageAuditPackage });
  const proofLimits = [
    ...construction.proofLimits,
    fixtureKeyProofLimit,
    "construction and held-out evaluation run in separate processes, but synthetic fixtures do not establish production isolation",
    leakageAudit.proofLimit,
    "eligibility does not authorize global installation activation or automatic adoption"
  ];
  const certification = { schemaVersion: 1, id: "usage-driven-skill-evolution-certification-v1", construction, evaluation: { heldOutManifest, leakageAuditPackage, baselinePackage, candidatePackage, evolutionDecision }, authority: { constructionProcessSeparated: true, targetCodeExecuted: false, liveSkillMutationByEngine: false, automaticAdoption: false, hostActivation: false }, proofLimits: [...new Set(proofLimits)] };
  const inputs = await Promise.all([
    "artifacts/usage-evolution/construction.json",
    "data/usage-driven-skill-evolution-contract.json",
    "data/evals/usage-evolution-development.json",
    "docs/superpowers/specs/2026-08-28-usage-driven-skill-evolution-design.md",
    "src/skill-evolution.mjs",
    TARGET,
    "skills/sovereign-skill-refinery/evals/usage-evolution-cases.json",
    "scripts/build-usage-evolution-construction.mjs",
    "scripts/build-usage-evolution-evaluation.mjs",
    "tests/skill-evolution.test.mjs",
    "tests/usage-driven-evolution-contract.test.mjs",
  ].map((relativePath) => fileEvidence(root, relativePath)));
  const certificationText = `${JSON.stringify(certification, null, 2)}\n`;
  const receipt = {
    schemaVersion: 1,
    skillName: "sovereign-skill-refinery",
    version: "usage-evolution-v1",
    decision: { status: "pending-review", basis: "the evidence chain is eligible but independent closure review has not yet passed" },
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
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
