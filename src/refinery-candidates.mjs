import { readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

import { canonicalText, sha256 } from "./io.mjs";

const STATUSES = new Set(["synthesized", "evaluated", "promoted"]);
const REQUIRED_ARTIFACTS = ["skill", "capabilityContract", "routingCard", "evaluation"];
const HISTORICAL_LOCKS_PATH = "data/historical-synthesis-locks.v1.json";

function relativeFile(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} artifact path must be a non-empty string`);
  }
  if (value !== value.trim() || /^[a-z]:[\\/]/i.test(value) || value.startsWith("/") || value.includes("\\")) {
    throw new Error(`${label} artifact path must be normalized repository-relative`);
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`${label} artifact path must be normalized repository-relative`);
  }
  return value;
}

function digest(value, label) {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label} must be a lowercase SHA-256 digest`);
  return value;
}

function exactSorted(values, label) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || value.trim() === "")) {
    throw new Error(`${label} must be a non-empty string array`);
  }
  if (new Set(values).size !== values.length) throw new Error(`${label} must not contain duplicates`);
  const sorted = [...values].sort((left, right) => left.localeCompare(right));
  if (values.some((value, index) => value !== sorted[index])) throw new Error(`${label} must be lexically sorted`);
  return values;
}

function equalArrays(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function validateCandidateEvidence(record, clusterRows, reviewRows, promotionReceipt, promotionReceiptBytes = null) {
  if (!record || record.schemaVersion !== 1) throw new Error("candidate schemaVersion must be 1");
  if (typeof record.candidateId !== "string" || record.candidateId.trim() === "") throw new Error("candidateId is required");
  if (typeof record.familyId !== "string" || record.familyId.trim() === "") throw new Error("familyId is required");
  if (!STATUSES.has(record.status)) throw new Error(`unknown candidate status: ${record.status}`);
  if (record.copiedSourceProse !== false) throw new Error("candidate contains copied source prose");
  if (record.externalMutation !== false) throw new Error("candidate externalMutation must be false");
  if (record.synthesisMethod !== "independent-cluster-synthesis-v1") {
    throw new Error("candidate synthesisMethod must be independent-cluster-synthesis-v1");
  }

  const artifacts = record.artifacts;
  if (!artifacts || typeof artifacts !== "object" || Array.isArray(artifacts)) throw new Error("candidate artifacts are required");
  for (const key of REQUIRED_ARTIFACTS) {
    if (!artifacts[key]) throw new Error(`missing candidate artifact: ${key}`);
  }
  for (const [key, artifact] of Object.entries(artifacts)) {
    relativeFile(artifact?.path, key);
    digest(artifact?.sha256, `${key}.sha256`);
  }

  const sourceIds = exactSorted(record.sourceIds, "candidate.sourceIds");
  if (!Array.isArray(record.clusters) || record.clusters.length === 0) throw new Error("candidate.clusters must not be empty");
  const declaredClusterIds = record.clusters.map(({ id }) => id);
  exactSorted(declaredClusterIds, "candidate cluster ids");
  const selectedMembers = [];
  for (const declared of record.clusters) {
    digest(declared.digest, `cluster ${declared.id} digest`);
    const matches = clusterRows.filter(({ id }) => id === declared.id);
    if (matches.length === 0) throw new Error(`missing cluster: ${declared.id}`);
    if (matches.length > 1) throw new Error(`duplicate cluster: ${declared.id}`);
    const cluster = matches[0];
    if (cluster.clusterDigest !== declared.digest) throw new Error(`stale cluster digest: ${declared.id}`);
    if (cluster.familyId !== record.familyId) throw new Error(`cluster family mismatch: ${declared.id}`);
    if (cluster.synthesisDecision !== "candidate") throw new Error(`cluster is not a synthesis candidate: ${declared.id}`);
    selectedMembers.push(...cluster.members);
  }
  const memberIds = selectedMembers.map(({ sourceId }) => sourceId).sort((a, b) => a.localeCompare(b));
  if (new Set(memberIds).size !== memberIds.length) throw new Error("duplicate source across candidate clusters");
  if (!equalArrays(sourceIds, memberIds)) throw new Error("candidate source union does not match cluster membership");

  for (const member of selectedMembers) {
    const matches = reviewRows.filter(({ sourceId }) => sourceId === member.sourceId);
    if (matches.length !== 1) throw new Error(`missing or duplicate review: ${member.sourceId}`);
    const review = matches[0];
    if (review.reviewDigest !== member.reviewDigest) throw new Error(`stale review digest: ${member.sourceId}`);
    if (review.copiedSourceProse !== false) throw new Error(`review contains copied source prose: ${member.sourceId}`);
    if (review.promotionClaim !== false) throw new Error(`review contains promotion claim: ${member.sourceId}`);
  }

  const evaluated = record.status === "evaluated" || record.status === "promoted";
  const promoted = record.status === "promoted";
  if (evaluated) {
    if (!promotionReceipt || !artifacts.promotionReceipt) throw new Error("evaluated candidate requires promotion receipt");
    const receiptEvidence = promotionReceiptBytes ?? `${JSON.stringify(promotionReceipt, null, 2)}\n`;
    if (sha256(receiptEvidence) !== artifacts.promotionReceipt.sha256) throw new Error("stale promotion receipt hash");
    if (promotionReceipt.skillName !== record.candidateId) throw new Error("promotion receipt candidate id mismatch");
    const receiptSources = [...(promotionReceipt.evidence?.sourceIds ?? [])].sort((a, b) => a.localeCompare(b));
    if (!equalArrays(sourceIds, receiptSources)) throw new Error("promotion receipt source ids do not match candidate");
    if (promotionReceipt.candidate?.status !== "evaluated") throw new Error("promotion receipt candidate is not evaluated");
    if (promoted && promotionReceipt.decision?.status !== "promoted") throw new Error("promotion receipt decision is not promoted");
  }

  const normalizedWithoutDigest = {
    schemaVersion: 1,
    candidateId: record.candidateId,
    familyId: record.familyId,
    sourceIds: [...sourceIds],
    clusterIds: [...declaredClusterIds],
    evaluated,
    promoted,
  };
  return {
    ...normalizedWithoutDigest,
    synthesisDigest: sha256(JSON.stringify(normalizedWithoutDigest)),
  };
}

async function jsonFiles(root) {
  try {
    return (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
      .map((entry) => path.join(root, entry.name))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function historicalSynthesisLocks(repositoryRoot) {
  try {
    const document = JSON.parse(await readFile(path.join(repositoryRoot, HISTORICAL_LOCKS_PATH), "utf8"));
    if (document.schemaVersion !== 1 || !Array.isArray(document.records)) {
      throw new Error("historical synthesis lock registry is invalid");
    }
    const locks = new Map();
    for (const record of document.records) {
      const relative = relativeFile(record.path, "historical synthesis lock");
      digest(record.sha256, `historical synthesis lock ${relative}`);
      if (locks.has(relative)) throw new Error(`duplicate historical synthesis lock: ${relative}`);
      locks.set(relative, record);
    }
    return locks;
  } catch (error) {
    if (error.code === "ENOENT") return new Map();
    throw error;
  }
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function loadCandidateEvidence(root, repositoryRoot, clusterRows, reviewRows) {
  const rows = [];
  const canonicalRoot = await realpath(repositoryRoot);
  const historicalLocks = await historicalSynthesisLocks(canonicalRoot);
  for (const filePath of await jsonFiles(root)) {
    const synthesisBytes = await readFile(filePath);
    const synthesisText = synthesisBytes.toString("utf8");
    const record = JSON.parse(synthesisText);
    const synthesisPath = path.relative(canonicalRoot, filePath).split(path.sep).join("/");
    const historicalLock = historicalLocks.get(synthesisPath);
    if (historicalLock && sha256(synthesisBytes) !== historicalLock.sha256) {
      throw new Error(`historical synthesis changed after lock: ${synthesisPath}`);
    }
    for (const [key, artifact] of Object.entries(record.artifacts ?? {})) {
      const relative = relativeFile(artifact.path, key);
      if (historicalLock && key !== "promotionReceipt") continue;
      const lexicalTarget = path.resolve(canonicalRoot, ...relative.split("/"));
      if (!isInside(canonicalRoot, lexicalTarget)) throw new Error(`artifact escapes repository root: ${key}`);
      const canonicalTarget = await realpath(lexicalTarget);
      if (!isInside(canonicalRoot, canonicalTarget)) throw new Error(`artifact escapes repository root: ${key}`);
      const text = await readFile(canonicalTarget, "utf8");
      if (sha256(canonicalText(text)) !== artifact.sha256) throw new Error(`stale artifact hash: ${key}`);
    }
    const receiptArtifact = record.artifacts?.promotionReceipt;
    const receiptBytes = receiptArtifact
      ? await readFile(await realpath(path.resolve(canonicalRoot, ...receiptArtifact.path.split("/"))))
      : null;
    const receipt = receiptBytes ? JSON.parse(receiptBytes) : null;
    rows.push(validateCandidateEvidence(record, clusterRows, reviewRows, receipt, receiptBytes));
  }
  return rows.sort((left, right) => left.candidateId.localeCompare(right.candidateId));
}
