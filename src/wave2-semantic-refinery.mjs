import { normalizeText } from "./catalog.mjs";
import { sha256 } from "./io.mjs";

const DISPOSITIONS = new Set([
  "independent-implementation",
  "pattern-reference",
  "deferred",
  "rejected",
]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const EFFECTS = new Set(["none", "read", "write", "external-write"]);
const PROVIDER_COUPLING = new Set(["none", "conditional", "provider-bound"]);
const PROJECT_COUPLING = new Set(["portable", "project-adjacent", "project-bound"]);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function stringArray(value, field, { nonEmpty = true } = {}) {
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
  for (const row of rows ?? []) {
    const value = row?.[key];
    nonEmptyString(value, `${label}.${key}`);
    if (map.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    map.set(value, row);
  }
  return map;
}

export function validateWave2ReviewBatch(batch, facets, bodyEvidence) {
  if (!batch || batch.schemaVersion !== 1) throw new Error("review batch schemaVersion must be 1");
  for (const field of ["waveId", "familyId", "reviewer", "reviewMethod"]) {
    nonEmptyString(batch[field], `reviewBatch.${field}`);
  }
  if (!Array.isArray(batch.reviews) || batch.reviews.length === 0) {
    throw new Error("reviewBatch.reviews must not be empty");
  }

  const facetById = uniqueMap(facets, "id", "facet");
  const bodyByDigest = uniqueMap(bodyEvidence, "bodySha256", "body evidence");
  const seen = new Set();
  const rows = [];

  for (const review of batch.reviews) {
    nonEmptyString(review?.facetId, "review.facetId");
    if (seen.has(review.facetId)) throw new Error(`duplicate review facet: ${review.facetId}`);
    seen.add(review.facetId);

    const facet = facetById.get(review.facetId);
    if (!facet) throw new Error(`unknown review facet: ${review.facetId}`);
    if (facet.primaryFamily !== batch.familyId) {
      throw new Error(`review facet ${review.facetId} is not owned by batch family ${batch.familyId}`);
    }
    if (facet.security?.dispositions?.includes("reject-before-indexing")) {
      throw new Error(`security-rejected facet cannot enter semantic review: ${review.facetId}`);
    }
    if (review.canonicalSourceId !== facet.canonicalSourceId) {
      throw new Error(`canonical source mismatch for ${review.facetId}`);
    }
    if (review.bodySha256 !== facet.bodySha256) {
      throw new Error(`stale body digest for ${review.facetId}`);
    }
    const body = bodyByDigest.get(review.bodySha256);
    if (!body || body.canonicalSourceId !== facet.canonicalSourceId) {
      throw new Error(`missing exact body evidence for ${review.facetId}`);
    }

    for (const field of ["neutralCapabilitySummary", "proposedCluster"]) {
      nonEmptyString(review[field], `review.${field}`);
    }
    if (normalizeText(review.neutralCapabilitySummary) === normalizeText(facet.summary ?? "")) {
      throw new Error(`review summary copies the source summary for ${review.facetId}`);
    }

    const intentIdentities = stringArray(review.neutralIntentExamples, "review.neutralIntentExamples");
    const aliasIdentities = stringArray(review.legacyAliases, "review.legacyAliases", { nonEmpty: false });
    if (review.neutralIntentExamples.some((entry) => entry.trim().startsWith("/"))) {
      throw new Error("review.neutralIntentExamples must not begin with a slash command");
    }
    if (aliasIdentities.some((alias) => intentIdentities.includes(alias))) {
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
      stringArray(review[field], `review.${field}`);
    }
    if (review.effects.some((effect) => !EFFECTS.has(effect))) {
      throw new Error(`review contains an unknown effect for ${review.facetId}`);
    }
    if (!PROVIDER_COUPLING.has(review.providerCoupling)) {
      throw new Error(`review contains an unknown provider coupling for ${review.facetId}`);
    }
    if (!PROJECT_COUPLING.has(review.projectCoupling)) {
      throw new Error(`review contains an unknown project coupling for ${review.facetId}`);
    }
    if (!DISPOSITIONS.has(review.disposition)) {
      throw new Error(`unknown review disposition: ${review.disposition}`);
    }
    if (!CONFIDENCE.has(review.confidence)) {
      throw new Error(`unknown review confidence: ${review.confidence}`);
    }
    if (review.copiedSourceProse !== false) {
      throw new Error(`review contains or does not reject copied source prose: ${review.facetId}`);
    }
    if (review.promotionClaim !== false) {
      throw new Error(`review cannot claim promotion: ${review.facetId}`);
    }

    const normalized = {
      schemaVersion: 1,
      waveId: batch.waveId.trim(),
      familyId: batch.familyId.trim(),
      reviewer: batch.reviewer.trim(),
      reviewMethod: batch.reviewMethod.trim(),
      facetId: review.facetId,
      canonicalSourceId: review.canonicalSourceId,
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
      providerCoupling: review.providerCoupling,
      projectCoupling: review.projectCoupling,
      disposition: review.disposition,
      proposedCluster: review.proposedCluster.trim(),
      confidence: review.confidence,
      copiedSourceProse: false,
      promotionClaim: false,
    };
    normalized.reviewDigest = sha256(JSON.stringify(normalized));
    rows.push(normalized);
  }

  return rows.sort((left, right) => left.facetId.localeCompare(right.facetId));
}
