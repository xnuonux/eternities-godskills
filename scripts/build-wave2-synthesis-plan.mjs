import fs from "node:fs/promises";
import path from "node:path";

import {
  buildWave2SynthesisPlan,
  evaluateWave2SynthesisPlan,
} from "../src/wave2-synthesis-evaluation.mjs";
import { certifyWave2SynthesisPlan } from "../src/wave2-synthesis-plan.mjs";
import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");
const write = process.argv.includes("--write");
const PLAN_PATH = path.join(root, "data/wave2-synthesis-plan.v1.json");
const EVALUATIONS_PATH = path.join(root, "artifacts/wave2-semantic/synthesis-evaluations.jsonl");
const EVIDENCE_PATH = path.join(root, "artifacts/wave2-semantic/synthesis-evidence.json");
const jsonLines = (text) => text.split("\n").filter(Boolean).map(JSON.parse);

const clusters = jsonLines(await fs.readFile(path.join(root, "artifacts/wave2-semantic/cluster-evidence.jsonl"), "utf8"));
const overlaps = jsonLines(await fs.readFile(path.join(root, "artifacts/wave2-semantic/overlap-evidence.jsonl"), "utf8"));
const comparisonIndex = JSON.parse(
  await fs.readFile(path.join(root, "artifacts/wave2-semantic/comparison-index.json"), "utf8"),
);
const plan = buildWave2SynthesisPlan(clusters, overlaps);
const certified = certifyWave2SynthesisPlan({ clusters, overlaps, plan });

async function exactPromotedReceiptByOwner() {
  const directory = path.join(root, "receipts/promotions");
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  const candidates = new Map();
  for (const file of files) {
    const receiptPath = path.join(directory, file);
    const bytes = await fs.readFile(receiptPath);
    const text = bytes.toString("utf8");
    const receipt = JSON.parse(text);
    const owner = receipt.skillName;
    const target = comparisonIndex.targetContracts[owner];
    if (!owner || !target || !text.includes(target.digest)) continue;
    const status = receipt.decision?.status ?? receipt.status;
    const candidate = receipt.candidate;
    const testsPassed = status === "promoted" && (
      !candidate ||
      (candidate.failures?.length ?? 0) === 0 &&
      (candidate.criticalTotal === undefined || candidate.criticalPassed === candidate.criticalTotal)
    );
    if (!testsPassed) continue;
    candidates.set(owner, {
      id: receipt.id ?? receipt.skillName ?? path.basename(file, ".json"),
      path: path.relative(root, receiptPath).replaceAll("\\", "/"),
      digest: sha256(bytes),
      status,
      testsPassed,
    });
  }
  return candidates;
}

const receiptByOwner = await exactPromotedReceiptByOwner();
const evaluations = evaluateWave2SynthesisPlan(plan, receiptByOwner);
const evaluationText = `${evaluations.map((row) => JSON.stringify(row)).join("\n")}\n`;
const evaluationCounts = Object.fromEntries(
  ["promoted", "experimental", "deferred", "rejected"].map((status) => [
    status,
    evaluations.filter((row) => row.status === status).length,
  ]),
);
const evidence = {
  schemaVersion: 1,
  evidenceId: "wave2-synthesis-evidence-v1",
  planDigest: certified.planDigest,
  candidateClusterCount: certified.coverage.candidateClusterCount,
  terminalActionCount: certified.coverage.terminalActionCount,
  unresolvedCandidateCount: certified.coverage.unresolvedCandidateCount,
  mechanismOwnershipCount: certified.coverage.mechanismOwnershipCount,
  evaluationCounts,
  promotionReceipts: evaluations.map((row) => ({
    id: row.id,
    status: row.status,
    testsPassed: row.testsPassed,
    evaluationDigest: row.evaluationDigest,
  })),
  artifacts: {
    plan: { path: "data/wave2-synthesis-plan.v1.json", sha256: sha256(`${JSON.stringify(plan, null, 2)}\n`) },
    evaluations: { path: "artifacts/wave2-semantic/synthesis-evaluations.jsonl", sha256: sha256(evaluationText) },
  },
  activation: {
    sourceExecutions: 0,
    thirdPartyActivations: 0,
    hostProfileChanges: 0,
    externalMutations: 0,
  },
  limitation: "Terminal deferred outcomes identify evidence-worthy mechanisms but do not claim implementation, measured improvement, or promotion. Retained promoted outcomes are accepted only when an exact current owner-contract digest appears in a passing promotion receipt.",
};
evidence.evidenceDigest = sha256(JSON.stringify(evidence));

if (write) {
  await fs.writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  await fs.writeFile(EVALUATIONS_PATH, evaluationText);
  await fs.writeFile(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify({
  outputs: [
    path.relative(root, PLAN_PATH).replaceAll("\\", "/"),
    path.relative(root, EVALUATIONS_PATH).replaceAll("\\", "/"),
    path.relative(root, EVIDENCE_PATH).replaceAll("\\", "/"),
  ],
  coverage: certified.coverage,
  exactPromotedOwnerReceipts: receiptByOwner.size,
  evaluationCounts,
}, null, 2)}\n`);
