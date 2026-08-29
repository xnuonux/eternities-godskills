import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  materializeOperationalCapability,
  validateOperationalCapabilitySet,
} from "../src/operational-capability.mjs";
import { sha256 } from "../src/io.mjs";

function jsonLines(text) {
  return text.split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

export async function buildOperationalCapabilities({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const [recordsBytes, waveBytes, reviewBytes] = await Promise.all([
    readFile(path.join(repositoryRoot, "data/operational-capabilities.v1.json")),
    readFile(path.join(repositoryRoot, "data/universal-capability-wave.v1.json")),
    readFile(path.join(repositoryRoot, "artifacts/wave2-semantic/review-evidence.jsonl")),
  ]);
  const recordSet = JSON.parse(recordsBytes.toString("utf8"));
  if (recordSet?.schemaVersion !== 1 || recordSet?.recordSetId !== "universal-operational-capabilities-v1" || !Array.isArray(recordSet.records)) {
    throw new Error("operational capability record set is malformed");
  }
  const wave = JSON.parse(waveBytes.toString("utf8"));
  const targets = wave.targets.filter((target) => target.kind === "operational-skill");
  if (targets.length !== 22 || recordSet.records.length !== 22) {
    throw new Error("materialization requires the exact 22 operational records and targets");
  }
  const targetById = new Map(targets.map((target) => [target.implementationOwnerId, target]));
  const reviewByDigest = new Map(jsonLines(reviewBytes.toString("utf8")).map((review) => [review.reviewDigest, review]));
  const entries = recordSet.records.map((record) => {
    const target = targetById.get(record.id);
    if (!target) throw new Error(`record has no certified operational target: ${record.id}`);
    return {
      record,
      target,
      sourceReviews: target.reviewDigests.map((reviewDigest) => {
        const review = reviewByDigest.get(reviewDigest);
        if (!review) throw new Error(`missing exact source review: ${reviewDigest}`);
        return review;
      }),
    };
  });
  const normalized = validateOperationalCapabilitySet(entries);
  if (new Set(normalized.map((record) => record.id)).size !== targets.length) {
    throw new Error("operational record coverage is incomplete");
  }

  const outputs = [];
  for (const entry of entries.sort((left, right) => left.record.id.localeCompare(right.record.id))) {
    const files = materializeOperationalCapability(entry);
    for (const [relativeFile, text] of Object.entries(files)) {
      const relativePath = `skills/${entry.record.id}/${relativeFile}`;
      outputs.push({ path: relativePath, sha256: sha256(text), bytes: Buffer.byteLength(text) });
      if (write) {
        const destination = path.join(repositoryRoot, relativePath);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, text, "utf8");
      }
    }
  }
  const normalizedResult = {
    schemaVersion: 1,
    buildId: "universal-operational-capabilities-v1",
    recordSetSha256: sha256(recordsBytes),
    waveSha256: sha256(waveBytes),
    operationalSkillCount: normalized.length,
    outputCount: outputs.length,
    outputs,
    activation: {
      sourceExecutions: 0,
      thirdPartyActivations: 0,
      hostProfileChanges: 0,
      externalMutations: 0,
    },
  };
  return { ...normalizedResult, buildDigest: sha256(JSON.stringify(normalizedResult)) };
}

async function main() {
  const result = await buildOperationalCapabilities({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
