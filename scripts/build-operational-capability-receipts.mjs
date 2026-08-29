import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildOperationalCapabilityReceipt } from "../src/operational-capability-evaluation.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

const SKILL_FILES = ["SKILL.md", "references/capability-contract.json", "references/provenance.json", "evals/cases.json"];

function jsonLines(text) {
  return text.split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

export async function buildOperationalCapabilityReceipts({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const [recordBytes, waveBytes, reviewBytes] = await Promise.all([
    readFile(path.join(repositoryRoot, "data/operational-capabilities.v1.json")),
    readFile(path.join(repositoryRoot, "data/universal-capability-wave.v1.json")),
    readFile(path.join(repositoryRoot, "artifacts/wave2-semantic/review-evidence.jsonl")),
  ]);
  const records = JSON.parse(recordBytes.toString("utf8")).records;
  const wave = JSON.parse(waveBytes.toString("utf8"));
  const targetById = new Map(wave.targets.filter((target) => target.kind === "operational-skill").map((target) => [target.implementationOwnerId, target]));
  const reviewByDigest = new Map(jsonLines(reviewBytes.toString("utf8")).map((review) => [review.reviewDigest, review]));
  if (records.length !== 22 || targetById.size !== 22) throw new Error("receipt build requires exact 22-record coverage");

  const skillRows = [];
  for (const record of records) {
    const target = targetById.get(record.id);
    if (!target) throw new Error(`missing operational target: ${record.id}`);
    const sourceReviews = target.reviewDigests.map((digest) => {
      const review = reviewByDigest.get(digest);
      if (!review) throw new Error(`missing review evidence: ${digest}`);
      return review;
    });
    const files = Object.fromEntries(await Promise.all(SKILL_FILES.map(async (file) => [
      file,
      await readFile(path.join(repositoryRoot, "skills", record.id, file), "utf8"),
    ])));
    const receipt = buildOperationalCapabilityReceipt({ record, target, sourceReviews, files });
    if (receipt.status !== "promoted") throw new Error(`operational skill did not promote: ${record.id}`);
    const receiptPath = `receipts/operational/${record.id}.json`;
    const receiptText = `${JSON.stringify(receipt, null, 2)}\n`;
    if (write) await writeJsonAtomic(path.join(repositoryRoot, receiptPath), receipt);
    skillRows.push({
      id: record.id,
      ownerGodskillId: record.ownerGodskillId,
      targetId: target.targetId,
      status: receipt.status,
      receiptPath,
      receiptSha256: sha256(receiptText),
      receiptDigest: receipt.receiptDigest,
    });
  }
  skillRows.sort((left, right) => left.id.localeCompare(right.id));
  const body = {
    schemaVersion: 1,
    aggregateId: "operational-capabilities-v1",
    status: "certified-local-fixtures",
    sourceWaveDigest: wave.waveDigest,
    recordSetSha256: sha256(recordBytes),
    operationalSkillCount: skillRows.length,
    promotedCount: skillRows.filter((row) => row.status === "promoted").length,
    skills: skillRows,
    activation: {
      sourceExecutions: 0,
      thirdPartyActivations: 0,
      hostProfileChanges: 0,
      externalMutations: 0,
    },
    proofLimits: [
      "deterministic-contract-and-prompt-fixtures-only",
      "no-arbitrary-live-agent-routing-proof",
      "no-external-execution-safety-proof",
      "no-universal-domain-correctness-proof",
    ],
  };
  const aggregate = { ...body, aggregateDigest: sha256(JSON.stringify(body)) };
  if (write) await writeJsonAtomic(path.join(repositoryRoot, "receipts/operational-capabilities-v1.json"), aggregate);
  return aggregate;
}

async function main() {
  const result = await buildOperationalCapabilityReceipts({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify({ status: result.status, operationalSkillCount: result.operationalSkillCount, promotedCount: result.promotedCount, aggregateDigest: result.aggregateDigest }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
