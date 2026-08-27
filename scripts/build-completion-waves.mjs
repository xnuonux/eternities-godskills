import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildCompletionPlan } from "../src/completion-waves.mjs";
import { writeJsonAtomic } from "../src/io.mjs";

function parseJsonLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim() !== "").map(JSON.parse);
}

export async function buildCompletionWaves({ repositoryRoot = "." } = {}) {
  const root = path.resolve(repositoryRoot);
  const ownership = parseJsonLines(await readFile(path.join(root, "artifacts/corpus/ownership.jsonl"), "utf8"));
  const summary = JSON.parse(await readFile(path.join(root, "artifacts/corpus/coverage-summary.json"), "utf8"));
  const ownerRoot = path.join(root, "artifacts/corpus/owners");
  const familyIds = (await readdir(ownerRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort();
  const queues = new Map();
  for (const familyId of familyIds) {
    queues.set(familyId, JSON.parse(await readFile(path.join(ownerRoot, familyId, "queue.json"), "utf8")));
  }
  const result = buildCompletionPlan({ ownership, summary, queues });
  const { familyReceipts, ...plan } = result;
  await Promise.all([
    writeJsonAtomic(path.join(root, "data/full-corpus-wave-plan.v1.json"), plan),
    ...familyReceipts.map((receipt) => writeJsonAtomic(path.join(root, "receipts/families", `${receipt.familyId}.json`), receipt)),
  ]);
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const result = await buildCompletionWaves();
  console.log(JSON.stringify({ remainingSourceCount: result.remainingSourceCount, packetCount: result.packetCount, familyCount: result.familyReceipts.length }, null, 2));
}
