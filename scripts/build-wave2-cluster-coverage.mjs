import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildWave2SemanticCoverageArtifacts } from "./build-wave2-semantic-coverage.mjs";
import { certifyWave2SemanticClusters } from "../src/wave2-semantic-clusters.mjs";
import { sha256 } from "../src/io.mjs";

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
}

export function normalizeWave2ClusterSets(clusterSets) {
  const byFamily = new Map();
  for (const set of clusterSets ?? []) {
    if (!set || set.schemaVersion !== 1) throw new Error("cluster set schemaVersion must be 1");
    nonEmptyString(set.clusterSetId, "clusterSet.clusterSetId");
    nonEmptyString(set.familyId, "clusterSet.familyId");
    if (!Array.isArray(set.clusters) || set.clusters.length === 0) {
      throw new Error(`cluster family ${set.familyId} must contain clusters`);
    }
    if (byFamily.has(set.familyId)) throw new Error(`duplicate cluster family: ${set.familyId}`);
    byFamily.set(set.familyId, set);
  }
  return [...byFamily.values()].sort((left, right) => left.familyId.localeCompare(right.familyId));
}

export function flattenWave2OverlapDecisionSets(overlapSets) {
  const familyIds = new Set();
  const decisionKeys = new Set();
  const decisions = [];
  for (const set of overlapSets ?? []) {
    if (!set || set.schemaVersion !== 1) throw new Error("overlap set schemaVersion must be 1");
    nonEmptyString(set.overlapSetId, "overlapSet.overlapSetId");
    nonEmptyString(set.familyId, "overlapSet.familyId");
    if (familyIds.has(set.familyId)) throw new Error(`duplicate overlap family: ${set.familyId}`);
    familyIds.add(set.familyId);
    if (!Array.isArray(set.decisions)) throw new Error(`overlap family ${set.familyId} decisions must be an array`);
    for (const decision of set.decisions) {
      if (decision?.familyId !== set.familyId) {
        throw new Error(`overlap family drift: ${decision?.clusterId ?? "unknown"}`);
      }
      nonEmptyString(decision.clusterId, "overlap.clusterId");
      const key = `${decision.familyId}::${decision.clusterId}`;
      if (decisionKeys.has(key)) throw new Error(`duplicate overlap decision: ${key}`);
      decisionKeys.add(key);
      decisions.push(decision);
    }
  }
  return decisions.sort((left, right) =>
    `${left.familyId}:${left.clusterId}`.localeCompare(`${right.familyId}:${right.clusterId}`),
  );
}

async function loadJsonFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.name.localeCompare(right.name));
  return Promise.all(files.map(async (entry) => JSON.parse(await readFile(path.join(root, entry.name), "utf8"))));
}

async function writeTextAtomic(filePath, text) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.tmp`);
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function buildWave2ClusterCoverageArtifacts(root = path.resolve("."), { write = true } = {}) {
  const { reviews } = await buildWave2SemanticCoverageArtifacts(root, { write: false });
  const clusterSets = normalizeWave2ClusterSets(
    await loadJsonFiles(path.join(root, "data/wave2-semantic-clusters")),
  );
  const overlapDecisions = flattenWave2OverlapDecisionSets(
    await loadJsonFiles(path.join(root, "data/wave2-overlap-decisions")),
  );
  const certified = certifyWave2SemanticClusters({ reviews, clusterSets, overlapDecisions });
  if (certified.coverage.reviewCount !== 3448 || certified.coverage.clusteredReviewCount !== 3448) {
    throw new Error(`unexpected Wave 2 cluster coverage: ${certified.coverage.clusteredReviewCount}/3448`);
  }

  const clusterText = `${certified.clusters.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const overlapText = `${certified.overlaps.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const coverage = {
    ...certified.coverage,
    clusterEvidenceSha256: sha256(clusterText),
    overlapEvidenceSha256: sha256(overlapText),
  };
  if (write) {
    await writeTextAtomic(path.join(root, "artifacts/wave2-semantic/cluster-evidence.jsonl"), clusterText);
    await writeTextAtomic(path.join(root, "artifacts/wave2-semantic/overlap-evidence.jsonl"), overlapText);
    await writeTextAtomic(
      path.join(root, "artifacts/wave2-semantic/cluster-coverage.json"),
      `${JSON.stringify(coverage, null, 2)}\n`,
    );
  }
  return { ...certified, coverage };
}

async function main() {
  const { coverage } = await buildWave2ClusterCoverageArtifacts();
  process.stdout.write(`${JSON.stringify(coverage, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) await main();
