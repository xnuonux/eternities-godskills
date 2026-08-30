import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, sha256, writeJsonAtomic } from "../src/io.mjs";
import { buildQuarrySnapshot } from "../src/quarry-snapshot.mjs";

const DEFAULTS = Object.freeze({
  manifest: "data/github-skill-quarry-wave-3.json",
  sourceRecords: "artifacts/github-wave-3/source-records.jsonl",
  repositoryFileManifests: "artifacts/github-wave-3/repository-file-manifests.jsonl",
  duplicateGroups: "artifacts/github-wave-3/duplicate-groups.json",
  receipt: "receipts/github-skill-quarry-wave-3.json",
});

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const jsonl = (rows) => `${rows.map((row) => JSON.stringify(row)).join("\n")}${rows.length ? "\n" : ""}`;

async function writeTextAtomic(filePath, value) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(temporary, value, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function outputEvidence(relativePath, body) {
  return { path: relativePath, sha256: sha256(body), bytes: Buffer.byteLength(body) };
}

export async function buildWaveThreeSnapshot({
  root = path.resolve("."),
  manifest,
  manifestPath = DEFAULTS.manifest,
  repositoryRoot,
  write = true,
} = {}) {
  const resolvedManifestPath = path.resolve(root, manifestPath);
  const value = manifest ?? await readJson(resolvedManifestPath);
  const snapshot = await buildQuarrySnapshot({
    manifest: value,
    repositoryRoot: repositoryRoot ?? value.warehouseRoot,
  });
  const bodies = {
    sourceRecords: jsonl(snapshot.sourceRecords),
    repositoryFileManifests: jsonl(snapshot.repositoryFileRows),
    duplicateGroups: json({ schemaVersion: 1, groups: snapshot.duplicateGroups }),
  };
  const manifestBody = manifest === undefined
    ? await readFile(resolvedManifestPath)
    : Buffer.from(json(value));
  const receipt = {
    schemaVersion: 1,
    certification: "github-skill-quarry-wave-3",
    status: snapshot.summary.repositories === snapshot.summary.verifiedRepositories ? "verified" : "failed",
    evidenceLevel: "exact-canonical-repository-snapshot",
    limitation: "This receipt proves exact local repository identity, commit, clean state, file manifests, and inert SKILL.md body records. It does not prove semantic correctness, safe execution, license clearance, or promotion.",
    manifest: { path: manifestPath, sha256: sha256(manifestBody) },
    repositoryRoot: path.resolve(repositoryRoot ?? value.warehouseRoot),
    outputs: {
      sourceRecords: outputEvidence(DEFAULTS.sourceRecords, bodies.sourceRecords),
      repositoryFileManifests: outputEvidence(DEFAULTS.repositoryFileManifests, bodies.repositoryFileManifests),
      duplicateGroups: outputEvidence(DEFAULTS.duplicateGroups, bodies.duplicateGroups),
    },
    summary: snapshot.summary,
    rows: snapshot.rows,
    thirdPartyCodeExecuted: false,
    sourceInstructionsActivated: false,
    externalMutation: false,
  };
  if (receipt.status !== "verified") throw new Error("wave three snapshot did not verify");

  if (write) {
    await Promise.all([
      writeTextAtomic(path.resolve(root, DEFAULTS.sourceRecords), bodies.sourceRecords),
      writeTextAtomic(path.resolve(root, DEFAULTS.repositoryFileManifests), bodies.repositoryFileManifests),
      writeTextAtomic(path.resolve(root, DEFAULTS.duplicateGroups), bodies.duplicateGroups),
    ]);
    await writeJsonAtomic(path.resolve(root, DEFAULTS.receipt), receipt);
  }
  return { ...snapshot, receipt };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const result = await buildWaveThreeSnapshot();
  process.stdout.write(`${JSON.stringify(result.receipt.summary)}\n`);
}
