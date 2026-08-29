import { readFile } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "./io.mjs";

const ALLOWED_OPTIONS = new Set(["query", "family", "limit"]);

function terms(value) {
  return new Set(String(value ?? "").normalize("NFKC").toLowerCase().match(/[a-z0-9]+/g)?.map((term) => term.length > 3 && term.endsWith("s") ? term.slice(0, -1) : term) ?? []);
}

function overlap(query, value) {
  const haystack = terms(value);
  let count = 0;
  for (const term of query) if (haystack.has(term)) count += 1;
  return count;
}

export async function loadQuarryAtlas(root = path.resolve(".")) {
  const receipt = JSON.parse(await readFile(path.join(root, "receipts/quarry-total-infusion-v1.json"), "utf8"));
  if (receipt.status !== "certified") throw new Error("quarry atlas receipt is not certified");
  const binding = receipt.outputs?.facets;
  if (!binding?.path || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")) throw new Error("quarry atlas receipt lacks facet binding");
  const bytes = await readFile(path.join(root, binding.path));
  if (bytes.length !== binding.bytes || sha256(bytes) !== binding.sha256) throw new Error("quarry atlas facet digest mismatch");
  const facets = bytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  for (const facet of facets) {
    if (facet.evidenceMode !== "inert-pattern-reference" || facet.security?.sourceExecutionAuthorized !== false) {
      throw new Error(`quarry atlas contains activation-capable facet: ${facet.id}`);
    }
  }
  return { receipt, facets };
}

export function searchQuarryAtlas(atlas, options = {}) {
  for (const key of Object.keys(options)) if (!ALLOWED_OPTIONS.has(key)) throw new Error(`unknown option: ${key}`);
  const { query, family, limit = 5 } = options;
  if (typeof query !== "string" || query.trim() === "") throw new Error("query must be a non-empty string");
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new Error("limit must be between 1 and 5");
  if (family !== undefined && (typeof family !== "string" || family === "")) throw new Error("family must be a non-empty string");
  const queryTerms = terms(query);
  return atlas.facets
    .filter((facet) => family === undefined || facet.familyIds.includes(family))
    .map((facet) => ({
      facet,
      score:
        overlap(queryTerms, facet.name) * 5 +
        overlap(queryTerms, facet.summary) * 3 +
        overlap(queryTerms, facet.headings?.join(" ")) * 2 +
        overlap(queryTerms, facet.familyIds?.join(" ")),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.facet.id.localeCompare(right.facet.id))
    .slice(0, limit)
    .map(({ facet, score }) => ({
      id: facet.id,
      bodySha256: facet.bodySha256,
      familyIds: facet.familyIds,
      primaryFamily: facet.primaryFamily,
      targetSkillId: facet.targetSkillId,
      score,
      untrustedMetadata: {
        trust: "untrusted-inert-source-metadata",
        name: facet.name,
        summary: facet.summary,
        headings: facet.headings,
      },
      provenance: {
        canonicalSourceId: facet.canonicalSourceId,
        repository: facet.repository,
        sourcePath: facet.sourcePath,
        licenseSignals: facet.licenseSignals,
      },
      risk: {
        dispositions: facet.security.dispositions,
        requiredReviews: facet.security.requiredReviews,
        surfaces: facet.security.surfaces,
        ruleIds: facet.security.ruleIds,
        semanticReviewComplete: facet.security.semanticReviewComplete,
        sourceExecutionAuthorized: facet.security.sourceExecutionAuthorized,
      },
    }));
}
