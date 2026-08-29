import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildUniversalCapabilityWave } from "../src/universal-capability-wave.mjs";

const repositoryRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const write = process.argv.includes("--write");
const paths = {
  synthesisPlan: "data/wave2-synthesis-plan.v1.json",
  clusterEvidence: "artifacts/wave2-semantic/cluster-evidence.jsonl",
  reviewEvidence: "artifacts/wave2-semantic/review-evidence.jsonl",
  wave: "data/universal-capability-wave.v1.json",
  ledger: "artifacts/universal-capability-wave/priority-ledger.jsonl",
  coverage: "artifacts/universal-capability-wave/coverage.json",
};

async function read(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return { bytes, sha256: sha256(bytes), path: relativePath.replaceAll("\\", "/") };
}

function jsonLines(bytes) {
  return bytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

const synthesis = await read(paths.synthesisPlan);
const clusters = await read(paths.clusterEvidence);
const reviews = await read(paths.reviewEvidence);
const wave = buildUniversalCapabilityWave({
  synthesisPlan: JSON.parse(synthesis.bytes.toString("utf8")),
  clusterEvidence: jsonLines(clusters.bytes),
  reviewEvidence: jsonLines(reviews.bytes),
});
const waveText = `${JSON.stringify(wave, null, 2)}\n`;
const ledgerText = `${wave.targets.map((target) => JSON.stringify(target)).join("\n")}\n`;
const coverageBase = {
  schemaVersion: 1,
  coverageId: "universal-capability-wave-coverage-v1",
  waveDigest: wave.waveDigest,
  counts: wave.coverage,
  inputs: [synthesis, clusters, reviews].map(({ path: artifactPath, sha256: digest, bytes }) => ({
    path: artifactPath,
    sha256: digest,
    bytes: bytes.byteLength,
  })),
  outputs: [
    { path: paths.wave, sha256: sha256(waveText), bytes: Buffer.byteLength(waveText) },
    { path: paths.ledger, sha256: sha256(ledgerText), bytes: Buffer.byteLength(ledgerText) },
  ],
  activation: {
    sourceExecutions: 0,
    thirdPartyActivations: 0,
    hostProfileChanges: 0,
    externalMutations: 0,
  },
};
const coverage = { ...coverageBase, coverageDigest: sha256(JSON.stringify(coverageBase)) };

if (write) {
  await writeJsonAtomic(path.join(repositoryRoot, paths.wave), wave);
  await mkdir(path.dirname(path.join(repositoryRoot, paths.ledger)), { recursive: true });
  await writeFile(path.join(repositoryRoot, paths.ledger), ledgerText, "utf8");
  await writeJsonAtomic(path.join(repositoryRoot, paths.coverage), coverage);
}

process.stdout.write(`${JSON.stringify({
  outputs: [paths.wave, paths.ledger, paths.coverage],
  waveDigest: wave.waveDigest,
  coverageDigest: coverage.coverageDigest,
  coverage: wave.coverage,
}, null, 2)}\n`);
