import { normalizeText } from "./catalog.mjs";
import { sha256 } from "./io.mjs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DISPOSITIONS = new Set([
  "independent-implementation",
  "pattern-reference",
  "rejected",
  "deferred",
]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const EFFECTS = new Set(["none", "read", "write", "external-write"]);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function nonEmptyStrings(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must not be empty`);
  }
  if (value.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new Error(`${field} must contain only non-empty strings`);
  }
}

function normalizedStrings(value, field, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array of strings`);
  if (nonEmpty && value.length === 0) throw new Error(`${field} must not be empty`);
  if (value.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new Error(`${field} must contain only non-empty strings`);
  }
  const identities = value.map(normalizeText);
  if (new Set(identities).size !== identities.length) {
    throw new Error(`${field} must not contain normalized duplicates`);
  }
  return identities;
}

function uniqueMap(rows, key, label) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (map.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    map.set(value, row);
  }
  return map;
}

export function validateReviewBatch(batch, sourceRecords, bodyEvidence) {
  if (!batch || batch.schemaVersion !== 1) throw new Error("review batch schemaVersion must be 1");
  for (const field of ["waveId", "familyId", "reviewer", "reviewMethod"]) {
    nonEmptyString(batch[field], `reviewBatch.${field}`);
  }
  if (!Array.isArray(batch.reviews) || batch.reviews.length === 0) {
    throw new Error("reviewBatch.reviews must not be empty");
  }
  const sources = uniqueMap(sourceRecords, "id", "source id");
  const bodies = uniqueMap(bodyEvidence, "sourceId", "body evidence source");
  const seen = new Set();

  return batch.reviews.map((review) => {
    nonEmptyString(review.sourceId, "review.sourceId");
    if (seen.has(review.sourceId)) throw new Error(`duplicate review source: ${review.sourceId}`);
    seen.add(review.sourceId);
    const source = sources.get(review.sourceId);
    if (!source) throw new Error(`unknown review source: ${review.sourceId}`);
    if (!(source.families ?? []).includes(batch.familyId)) {
      throw new Error(`review source ${review.sourceId} is not in family ${batch.familyId}`);
    }
    const body = bodies.get(review.sourceId);
    if (!body || body.status !== "inspected" || body.present !== true) {
      throw new Error(`review source body is not inspected: ${review.sourceId}`);
    }
    if (review.bodySha256 !== body.bodySha256) {
      throw new Error(`stale body digest for ${review.sourceId}`);
    }
    for (const field of ["neutralCapabilitySummary", "proposedCluster"]) {
      nonEmptyString(review[field], `review.${field}`);
    }
    const neutralIntentIdentities = normalizedStrings(
      review.neutralIntentExamples,
      "review.neutralIntentExamples",
      { nonEmpty: true },
    );
    const legacyAliasIdentities = normalizedStrings(
      review.legacyAliases,
      "review.legacyAliases",
    );
    if (review.neutralIntentExamples.some((example) => example.trim().startsWith("/"))) {
      throw new Error("review.neutralIntentExamples must not begin with a slash command");
    }
    if (legacyAliasIdentities.some((alias) => neutralIntentIdentities.includes(alias))) {
      throw new Error("review legacy alias cannot be a canonical intent example");
    }
    for (const field of [
      "inputs",
      "operations",
      "outputs",
      "effects",
      "failureBehavior",
      "exclusions",
      "usefulInvariants",
      "materialRisks",
    ]) {
      nonEmptyStrings(review[field], `review.${field}`);
    }
    if (review.effects.some((effect) => !EFFECTS.has(effect))) {
      throw new Error(`review.effects contains an unknown effect for ${review.sourceId}`);
    }
    if (!DISPOSITIONS.has(review.disposition)) {
      throw new Error(`unknown review disposition: ${review.disposition}`);
    }
    if (!CONFIDENCE.has(review.confidence)) {
      throw new Error(`unknown review confidence: ${review.confidence}`);
    }
    if (review.copiedSourceProse !== false) {
      throw new Error(`review contains or does not reject copied source prose: ${review.sourceId}`);
    }
    if (review.promotionClaim !== false) {
      throw new Error(`review cannot claim promotion: ${review.sourceId}`);
    }
    if (normalizeText(review.neutralCapabilitySummary) === normalizeText(source.description)) {
      throw new Error(`review summary copies the indexed source description: ${review.sourceId}`);
    }

    const normalized = {
      schemaVersion: 1,
      waveId: batch.waveId,
      familyId: batch.familyId,
      reviewer: batch.reviewer,
      reviewMethod: batch.reviewMethod,
      sourceId: review.sourceId,
      bodySha256: review.bodySha256,
      neutralCapabilitySummary: review.neutralCapabilitySummary.trim(),
      neutralIntentExamples: [...review.neutralIntentExamples],
      legacyAliases: [...review.legacyAliases],
      inputs: [...review.inputs],
      operations: [...review.operations],
      outputs: [...review.outputs],
      effects: [...review.effects],
      failureBehavior: [...review.failureBehavior],
      exclusions: [...review.exclusions],
      usefulInvariants: [...review.usefulInvariants],
      materialRisks: [...review.materialRisks],
      disposition: review.disposition,
      proposedCluster: review.proposedCluster.trim(),
      confidence: review.confidence,
      copiedSourceProse: false,
      promotionClaim: false,
    };
    normalized.reviewDigest = sha256(JSON.stringify(normalized));
    return normalized;
  });
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

export async function loadReviewEvidence(root, sourceRecords, bodyEvidence) {
  const rows = [];
  const seen = new Set();
  for (const filePath of await jsonFiles(root)) {
    const batch = JSON.parse(await readFile(filePath, "utf8"));
    for (const row of validateReviewBatch(batch, sourceRecords, bodyEvidence)) {
      if (seen.has(row.sourceId)) {
        throw new Error(`duplicate reviewed source across batches: ${row.sourceId}`);
      }
      seen.add(row.sourceId);
      rows.push(row);
    }
  }
  return rows.sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}
