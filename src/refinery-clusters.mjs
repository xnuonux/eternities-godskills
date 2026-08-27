import { sha256 } from "./io.mjs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const RELATIONSHIPS = new Set([
  "canonical-with-variants",
  "ordered-composition",
  "exact-duplicate",
  "boundary-deferred",
  "specialized-alternative",
]);
const MEMBER_ROLES = new Set([
  "canonical",
  "variant",
  "duplicate",
  "deferred",
  "boundary",
]);
const SYNTHESIS_DECISIONS = new Set(["candidate", "deferred", "rejected"]);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function uniqueMap(rows, keyFor, label) {
  const result = new Map();
  for (const row of rows ?? []) {
    const key = keyFor(row);
    if (typeof key !== "string" || key.trim() === "") {
      throw new Error(`${label} is missing an id`);
    }
    if (result.has(key)) throw new Error(`duplicate ${label}: ${key}`);
    result.set(key, row);
  }
  return result;
}

export function validateClusterBatch(batch, reviewRows) {
  if (!batch || batch.schemaVersion !== 1) {
    throw new Error("cluster batch schemaVersion must be 1");
  }
  const clusterSetId = nonEmptyString(batch.clusterSetId, "clusterBatch.clusterSetId");
  const familyId = nonEmptyString(batch.familyId, "clusterBatch.familyId");
  if (!Array.isArray(batch.clusters) || batch.clusters.length === 0) {
    throw new Error("clusterBatch.clusters must not be empty");
  }

  const reviews = uniqueMap(reviewRows, (row) => row.sourceId, "review source");
  const clusteredSources = new Set();
  const clusterIds = new Set();
  const normalized = batch.clusters.map((cluster) => {
    const id = nonEmptyString(cluster.id, "cluster.id");
    if (clusterIds.has(id)) throw new Error(`duplicate cluster id: ${id}`);
    clusterIds.add(id);
    if (!RELATIONSHIPS.has(cluster.relationship)) {
      throw new Error(`unknown cluster relationship: ${cluster.relationship}`);
    }
    if (!SYNTHESIS_DECISIONS.has(cluster.synthesisDecision)) {
      throw new Error(`unknown synthesis decision: ${cluster.synthesisDecision}`);
    }
    if (!Array.isArray(cluster.members) || cluster.members.length === 0) {
      throw new Error(`cluster.members must not be empty: ${id}`);
    }

    const members = cluster.members.map((member) => {
      const sourceId = nonEmptyString(member.sourceId, "cluster member sourceId");
      if (clusteredSources.has(sourceId)) {
        throw new Error(`duplicate clustered source: ${sourceId}`);
      }
      clusteredSources.add(sourceId);
      const review = reviews.get(sourceId);
      if (!review) throw new Error(`unknown reviewed source: ${sourceId}`);
      if (review.familyId !== familyId) {
        throw new Error(`reviewed source ${sourceId} is not in family ${familyId}`);
      }
      if (member.reviewDigest !== review.reviewDigest) {
        throw new Error(`stale review digest for ${sourceId}`);
      }
      if (!MEMBER_ROLES.has(member.role)) {
        throw new Error(`unknown cluster member role: ${member.role}`);
      }
      return {
        sourceId,
        reviewDigest: member.reviewDigest,
        role: member.role,
      };
    }).sort((left, right) => left.sourceId.localeCompare(right.sourceId));

    const row = {
      schemaVersion: 1,
      clusterSetId,
      familyId,
      id,
      intent: nonEmptyString(cluster.intent, "cluster.intent"),
      relationship: cluster.relationship,
      synthesisDecision: cluster.synthesisDecision,
      rationale: nonEmptyString(cluster.rationale, "cluster.rationale"),
      members,
    };
    row.clusterDigest = sha256(JSON.stringify(row));
    return row;
  });

  return normalized.sort((left, right) => left.id.localeCompare(right.id));
}

async function jsonFiles(root) {
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) files.push(target);
    }
  }
  await visit(root);
  return files;
}

export async function loadClusterEvidence(root, reviewRows) {
  const rows = [];
  const clusterSets = new Set();
  const clusterIds = new Set();
  const sourceIds = new Set();
  for (const filePath of await jsonFiles(root)) {
    const batch = JSON.parse(await readFile(filePath, "utf8"));
    if (clusterSets.has(batch.clusterSetId)) {
      throw new Error(`duplicate cluster set across batches: ${batch.clusterSetId}`);
    }
    clusterSets.add(batch.clusterSetId);
    for (const row of validateClusterBatch(batch, reviewRows)) {
      if (clusterIds.has(row.id)) throw new Error(`duplicate cluster id across batches: ${row.id}`);
      clusterIds.add(row.id);
      for (const member of row.members) {
        if (sourceIds.has(member.sourceId)) {
          throw new Error(`duplicate clustered source across batches: ${member.sourceId}`);
        }
        sourceIds.add(member.sourceId);
      }
      rows.push(row);
    }
  }
  return rows.sort((left, right) => left.id.localeCompare(right.id));
}
