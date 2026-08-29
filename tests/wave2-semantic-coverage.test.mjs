import assert from "node:assert/strict";
import test from "node:test";

import { buildWave2SemanticCoverage } from "../scripts/build-wave2-semantic-coverage.mjs";

const A = "a".repeat(64);
const B = "b".repeat(64);

function facet(id, digest, family = "implementation-engineering") {
  return {
    id,
    bodySha256: digest,
    canonicalSourceId: `owner/repo@head:${id}/SKILL.md`,
    primaryFamily: family,
  };
}

function review(id, digest, family = "implementation-engineering") {
  return {
    schemaVersion: 1,
    facetId: id,
    bodySha256: digest,
    familyId: family,
    reviewDigest: id === "facet-a" ? "1".repeat(64) : "2".repeat(64),
    disposition: "pattern-reference",
    confidence: "medium",
  };
}

test("complete review coverage binds every exact facet once", () => {
  const coverage = buildWave2SemanticCoverage({
    facets: [facet("facet-a", A), facet("facet-b", B)],
    reviews: [review("facet-b", B), review("facet-a", A)],
  });

  assert.deepEqual(coverage, {
    schemaVersion: 1,
    acceptedFacetCount: 2,
    reviewedFacetCount: 2,
    unresolvedFacetCount: 0,
    familyCounts: { "implementation-engineering": 2 },
    dispositionCounts: { "pattern-reference": 2 },
    confidenceCounts: { medium: 2 },
  });
});

test("missing and duplicate reviews cannot produce semantic completion", () => {
  const facets = [facet("facet-a", A), facet("facet-b", B)];
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [review("facet-a", A)] }),
    /missing semantic reviews: facet-b/,
  );
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [review("facet-a", A), review("facet-a", A)] }),
    /duplicate semantic review: facet-a/,
  );
});

test("unknown facets and stale digest or family evidence fail closed", () => {
  const facets = [facet("facet-a", A)];
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [review("facet-x", A)] }),
    /unknown reviewed facet: facet-x/,
  );
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [review("facet-a", B)] }),
    /stale semantic review body digest/,
  );
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [review("facet-a", A, "general")] }),
    /semantic review family drift/,
  );
});

test("invalid review digest and unsupported terminal labels are rejected", () => {
  const facets = [facet("facet-a", A)];
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [{ ...review("facet-a", A), reviewDigest: "bad" }] }),
    /invalid review digest/,
  );
  assert.throws(
    () => buildWave2SemanticCoverage({ facets, reviews: [{ ...review("facet-a", A), disposition: "promoted" }] }),
    /unsupported semantic disposition/,
  );
});
