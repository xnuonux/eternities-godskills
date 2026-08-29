import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildOperationalOwnerBaseline } from "../src/operational-capability-baseline.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

export async function buildOperationalBaselineArtifacts({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const records = JSON.parse(await readFile(path.join(repositoryRoot, "data/operational-capabilities.v1.json"), "utf8")).records;
  if (records.length !== 22) throw new Error("operational baseline build requires exactly 22 records");
  const baselines = [];
  for (const record of records) {
    const ownerId = record.ownerGodskillId;
    const entrypointPath = `skills/${ownerId}/SKILL.md`;
    const contractPath = `skills/${ownerId}/references/capability-contract.json`;
    const [entrypoint, contract] = await Promise.all([
      readFile(path.join(repositoryRoot, entrypointPath)),
      readFile(path.join(repositoryRoot, contractPath)),
    ]);
    baselines.push(buildOperationalOwnerBaseline({
      record,
      owner: {
        id: ownerId,
        entrypoint: { path: entrypointPath, sha256: sha256(entrypoint), bytes: entrypoint.byteLength },
        contract: { path: contractPath, sha256: sha256(contract), bytes: contract.byteLength },
        contractBody: JSON.parse(contract),
      },
    }));
  }
  baselines.sort((left, right) => left.skillId.localeCompare(right.skillId));
  const body = {
    schemaVersion: 1,
    baselineSetId: "operational-current-owner-baselines-v1",
    status: "materialized-local-fixtures",
    baselines,
    proofLimits: [
      "deterministic-current-owner-entrypoint-fixtures-only",
      "no-arbitrary-live-agent-baseline-proof",
      "no-universal-domain-correctness-proof",
    ],
  };
  const result = { ...body, baselineSetDigest: sha256(JSON.stringify(body)) };
  if (write) await writeJsonAtomic(path.join(repositoryRoot, "data/operational-capability-baselines.v1.json"), result);
  return result;
}

async function main() {
  const result = await buildOperationalBaselineArtifacts({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify({ baselineCount: result.baselines.length, baselineSetDigest: result.baselineSetDigest }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
