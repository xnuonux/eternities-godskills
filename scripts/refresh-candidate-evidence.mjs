import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { canonicalText, sha256, writeJsonAtomic } from "../src/io.mjs";
import { loadCandidateEvidence } from "../src/refinery-candidates.mjs";

const root = path.resolve(process.argv[2] ?? ".");
const corpusRoot = path.join(root, "artifacts/corpus");
const lines = (text) => text.split(/\r?\n/).filter(Boolean).map(JSON.parse);

async function writeTextAtomic(filePath, text) {
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

const [clusters, reviews] = await Promise.all([
  readFile(path.join(corpusRoot, "cluster-evidence.jsonl"), "utf8").then(lines),
  readFile(path.join(corpusRoot, "review-evidence.jsonl"), "utf8").then(lines),
]);
const candidates = await loadCandidateEvidence(path.join(root, "syntheses"), root, clusters, reviews);
const candidateText = `${candidates.map((row) => JSON.stringify(row)).join("\n")}\n`;
await writeTextAtomic(path.join(corpusRoot, "candidate-evidence.jsonl"), candidateText);

const summaryPath = path.join(corpusRoot, "coverage-summary.json");
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
summary.artifactDigests.candidateEvidenceSha256 = sha256(canonicalText(candidateText));
await writeJsonAtomic(summaryPath, summary);
console.log(JSON.stringify({ candidateCount: candidates.length, candidateEvidenceSha256: summary.artifactDigests.candidateEvidenceSha256 }, null, 2));
