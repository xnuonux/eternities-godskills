import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateWave2ReviewBatch } from "../src/wave2-semantic-refinery.mjs";

const DISPOSITIONS = new Set(["independent-implementation", "pattern-reference", "deferred", "rejected"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);

function uniqueMap(rows, key, label) {
  const map = new Map();
  for (const row of rows ?? []) {
    const value = row?.[key];
    if (typeof value !== "string" || value === "") throw new Error(`${label} is missing ${key}`);
    if (map.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    map.set(value, row);
  }
  return map;
}

function countBy(rows, field) {
  const counts = new Map();
  for (const row of rows) counts.set(row[field], (counts.get(row[field]) ?? 0) + 1);
  return Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right)));
}

export function buildWave2SemanticCoverage({ facets, reviews }) {
  const facetById = uniqueMap(facets, "id", "accepted facet");
  const reviewByFacet = new Map();

  for (const review of reviews ?? []) {
    if (reviewByFacet.has(review.facetId)) throw new Error(`duplicate semantic review: ${review.facetId}`);
    const facet = facetById.get(review.facetId);
    if (!facet) throw new Error(`unknown reviewed facet: ${review.facetId}`);
    if (review.bodySha256 !== facet.bodySha256) {
      throw new Error(`stale semantic review body digest: ${review.facetId}`);
    }
    if (review.familyId !== facet.primaryFamily) {
      throw new Error(`semantic review family drift: ${review.facetId}`);
    }
    if (typeof review.reviewDigest !== "string" || !/^[a-f0-9]{64}$/.test(review.reviewDigest)) {
      throw new Error(`invalid review digest: ${review.facetId}`);
    }
    if (!DISPOSITIONS.has(review.disposition)) {
      throw new Error(`unsupported semantic disposition: ${review.disposition}`);
    }
    if (!CONFIDENCE.has(review.confidence)) {
      throw new Error(`unsupported semantic confidence: ${review.confidence}`);
    }
    reviewByFacet.set(review.facetId, review);
  }

  const missing = [...facetById.keys()].filter((id) => !reviewByFacet.has(id)).sort();
  if (missing.length) throw new Error(`missing semantic reviews: ${missing.join(", ")}`);
  const ordered = [...reviewByFacet.values()].sort((left, right) => left.facetId.localeCompare(right.facetId));
  return {
    schemaVersion: 1,
    acceptedFacetCount: facetById.size,
    reviewedFacetCount: ordered.length,
    unresolvedFacetCount: 0,
    familyCounts: countBy(ordered, "familyId"),
    dispositionCounts: countBy(ordered, "disposition"),
    confidenceCounts: countBy(ordered, "confidence"),
  };
}

function jsonLines(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
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

export async function loadWave2SemanticReviewEvidence(reviewRoot, facets, bodyEvidence) {
  const reviews = [];
  const seen = new Set();
  for (const filePath of await jsonFiles(reviewRoot)) {
    const batch = JSON.parse(await readFile(filePath, "utf8"));
    for (const review of validateWave2ReviewBatch(batch, facets, bodyEvidence)) {
      if (seen.has(review.facetId)) throw new Error(`duplicate semantic review: ${review.facetId}`);
      seen.add(review.facetId);
      reviews.push(review);
    }
  }
  return reviews.sort((left, right) => left.facetId.localeCompare(right.facetId));
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

export async function buildWave2SemanticCoverageArtifacts(root = path.resolve("."), { write = true } = {}) {
  const facets = jsonLines(await readFile(path.join(root, "artifacts/quarry-infusion/facets.jsonl"), "utf8"));
  const bodyEvidence = jsonLines(await readFile(path.join(root, "artifacts/quarry-infusion/body-structures.jsonl"), "utf8"));
  const reviews = await loadWave2SemanticReviewEvidence(
    path.join(root, "data/wave2-semantic-reviews"),
    facets,
    bodyEvidence,
  );
  const coverage = buildWave2SemanticCoverage({ facets, reviews });
  if (coverage.acceptedFacetCount !== 3448) {
    throw new Error(`unexpected Wave 2 semantic coverage: ${coverage.acceptedFacetCount}`);
  }
  if (write) {
    await writeTextAtomic(
      path.join(root, "artifacts/wave2-semantic/review-evidence.jsonl"),
      `${reviews.map((review) => JSON.stringify(review)).join("\n")}\n`,
    );
    await writeTextAtomic(
      path.join(root, "artifacts/wave2-semantic/review-coverage.json"),
      `${JSON.stringify(coverage, null, 2)}\n`,
    );
  }
  return { reviews, coverage };
}

async function main() {
  const { coverage } = await buildWave2SemanticCoverageArtifacts();
  process.stdout.write(`${JSON.stringify(coverage, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) await main();
