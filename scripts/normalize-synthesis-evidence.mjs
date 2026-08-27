import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "../src/io.mjs";

const root = path.resolve(".");

async function exists(relativePath) {
  try {
    await access(path.join(root, ...relativePath.split("/")));
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, ...relativePath.split("/")), "utf8"));
}

async function writeJson(relativePath, value) {
  await writeFile(path.join(root, ...relativePath.split("/")), `${JSON.stringify(value, null, 2)}\n`);
}

async function artifact(relativePath) {
  const bytes = await readFile(path.join(root, ...relativePath.split("/")));
  return { path: relativePath, sha256: sha256(bytes) };
}

const clusterRows = (await readFile(path.join(root, "artifacts/corpus/cluster-evidence.jsonl"), "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const clustersById = new Map(clusterRows.map((row) => [row.id, row]));

const synthesisNames = (await readdir(path.join(root, "syntheses")))
  .filter((name) => name.endsWith(".json"))
  .sort();

for (const name of synthesisNames) {
  const synthesisPath = `syntheses/${name}`;
  const current = await readJson(synthesisPath);
  const candidateId = current.candidateId;
  const familyId = current.familyId;
  if (!candidateId || !familyId) throw new Error(`${name} lacks candidateId or familyId`);

  let clusterIds;
  if (Array.isArray(current.clusters) && current.clusters.every((row) => typeof row?.id === "string")) {
    clusterIds = current.clusters.map((row) => row.id);
  } else if (Array.isArray(current.promotedClusters)) {
    clusterIds = current.promotedClusters;
  } else if (Array.isArray(current.clusterIds)) {
    clusterIds = current.clusterIds;
  } else {
    throw new Error(`${name} lacks an exact promoted cluster set`);
  }
  clusterIds = [...new Set(clusterIds)].sort((left, right) => left.localeCompare(right));

  const clusters = clusterIds.map((id) => {
    const row = clustersById.get(id);
    if (!row) throw new Error(`${name} references unknown cluster ${id}`);
    if (row.familyId !== familyId) throw new Error(`${name} cluster family mismatch for ${id}`);
    if (row.synthesisDecision !== "candidate") throw new Error(`${name} references non-candidate cluster ${id}`);
    return { id, digest: row.clusterDigest };
  });
  const sourceIds = clusters
    .flatMap(({ id }) => clustersById.get(id).members.map((member) => member.sourceId))
    .sort((left, right) => left.localeCompare(right));
  if (new Set(sourceIds).size !== sourceIds.length) throw new Error(`${name} has duplicate promoted sources`);

  const versionedReceipt = `receipts/promotions/${candidateId}-v2.json`;
  const receiptPath = current.artifacts?.promotionReceipt?.path
    ?? ((name.includes(".v2.") && await exists(versionedReceipt)) ? versionedReceipt : `receipts/promotions/${candidateId}.json`);
  const receipt = await readJson(receiptPath);
  const receiptEvidence = { ...(receipt.evidence ?? {}) };
  delete receiptEvidence.synthesisSha256;
  if (receiptEvidence.artifacts) {
    receiptEvidence.artifacts = { ...receiptEvidence.artifacts };
    delete receiptEvidence.artifacts.synthesis;
    delete receiptEvidence.artifacts.promotionReceipt;
  }
  receiptEvidence.sourceIds = sourceIds;
  receiptEvidence.sourceCoverage = sourceIds.length;
  receiptEvidence.sourceProseCopied = false;
  receiptEvidence.externalMutation = false;
  const skillPath = `skills/${candidateId}/SKILL.md`;
  const defaultEvaluationPath = `skills/${candidateId}/evals/cases.json`;
  if (/^\$[A-Za-z][A-Za-z0-9]*Hash$/.test(receiptEvidence.skillSha256 ?? "")) {
    receiptEvidence.skillSha256 = (await artifact(skillPath)).sha256;
  }
  if (/^\$[A-Za-z][A-Za-z0-9]*Hash$/.test(receiptEvidence.casesSha256 ?? "")) {
    receiptEvidence.casesSha256 = (await artifact(defaultEvaluationPath)).sha256;
  }
  for (const [key, value] of Object.entries(receiptEvidence)) {
    if (/^\$[A-Za-z][A-Za-z0-9]*Hash$/.test(value ?? "")) delete receiptEvidence[key];
  }
  const normalizedReceipt = {
    ...receipt,
    skillName: candidateId,
    evidence: receiptEvidence,
    candidate: { ...(receipt.candidate ?? {}), status: "evaluated" },
    decision: { ...(receipt.decision ?? {}), status: "promoted" },
  };
  await writeJson(receiptPath, normalizedReceipt);

  const skillBase = `skills/${candidateId}`;
  const evaluationPath = name.includes(".v2.") && await exists(`${skillBase}/evals/cases.v2.json`)
    ? `${skillBase}/evals/cases.v2.json`
    : `${skillBase}/evals/cases.json`;
  const requiredPaths = {
    skill: `${skillBase}/SKILL.md`,
    capabilityContract: `${skillBase}/references/capability-contract.json`,
    routingCard: `${skillBase}/references/routing-card.json`,
    evaluation: evaluationPath,
    promotionReceipt: receiptPath,
  };
  for (const [key, relativePath] of Object.entries(requiredPaths)) {
    if (!await exists(relativePath)) throw new Error(`${name} missing ${key}: ${relativePath}`);
  }
  const artifacts = Object.fromEntries(await Promise.all(
    Object.entries(requiredPaths).map(async ([key, relativePath]) => [key, await artifact(relativePath)]),
  ));

  const normalized = {
    schemaVersion: 1,
    candidateId,
    familyId,
    status: "promoted",
    artifacts,
    clusters,
    sourceIds,
    copiedSourceProse: false,
    externalMutation: false,
    synthesisMethod: "independent-cluster-synthesis-v1",
  };
  if (Array.isArray(current.deferredClusters)) normalized.deferredClusters = [...current.deferredClusters].sort();
  if (Array.isArray(current.rejectedClusters)) normalized.rejectedClusters = [...current.rejectedClusters].sort();
  await writeJson(synthesisPath, normalized);
}

console.log(`normalized ${synthesisNames.length} synthesis records`);
