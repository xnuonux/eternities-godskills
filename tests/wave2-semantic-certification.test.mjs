import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWave2SemanticCertification,
  certifyWave2SemanticRefinery,
} from "../scripts/build-wave2-semantic-certification.mjs";

const DIGEST = "a".repeat(64);

function evidence(overrides = {}) {
  return {
    structural: {
      status: "certified",
      receiptSha256: DIGEST,
      sourceCount: 7776,
      exactDuplicateCount: 4195,
      canonicalBodyCount: 3581,
      rejectedCanonicalCount: 133,
      acceptedCanonicalCount: 3448,
    },
    reviews: {
      artifactSha256: DIGEST,
      acceptedFacetCount: 3448,
      reviewedFacetCount: 3448,
      unresolvedFacetCount: 0,
    },
    clusters: {
      artifactSha256: DIGEST,
      reviewCount: 3448,
      clusteredReviewCount: 3448,
      unresolvedReviewCount: 0,
      candidateClusterCount: 12,
      overlapDecisionCount: 12,
    },
    synthesis: {
      artifactSha256: DIGEST,
      candidateClusterCount: 12,
      terminalActionCount: 12,
      unresolvedCandidateCount: 0,
      promotionReceipts: [{ id: "candidate-a", status: "experimental", testsPassed: true }],
    },
    routing: {
      artifactSha256: DIGEST,
      automaticBoundedGapLookup: true,
      maximumCards: 5,
      sourceBodiesTransported: 0,
      authorityExpansion: false,
      staleCertificationFailsClosed: true,
    },
    activation: {
      sourceExecutions: 0,
      thirdPartyActivations: 0,
      hostProfileChanges: 0,
    },
    independentReview: {
      artifactSha256: DIGEST,
      mode: "separate-adversarial-review-pass",
      scopeExact: true,
      unresolvedCritical: 0,
      unresolvedImportant: 0,
      reviewerIndependenceProven: false,
    },
    ...overrides,
  };
}

test("complete terminal evidence produces one bounded semantic certificate", () => {
  const certificate = certifyWave2SemanticRefinery(evidence());
  assert.equal(certificate.status, "certified");
  assert.equal(certificate.counts.reviewedFacets, 3448);
  assert.equal(certificate.counts.clusteredFacets, 3448);
  assert.equal(certificate.gates.length > 0, true);
  assert.match(certificate.certificateSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(certificate.proofLimits, [
    "deterministic-local-evidence-only",
    "no-third-party-source-execution",
    "no-universal-capability-claim",
    "reviewer-independence-not-proven-beyond-recorded-pass",
  ]);
});

test("historical structural totals and exact duplicate inheritance are immutable", () => {
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({
      structural: { ...evidence().structural, exactDuplicateCount: 4194 },
    })),
    /structural exact duplicate count/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({
      structural: { ...evidence().structural, acceptedCanonicalCount: 3447 },
    })),
    /structural accepted canonical count/,
  );
});

test("missing reviews, cluster memberships, overlaps, or terminal synthesis fail closed", () => {
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ reviews: { ...evidence().reviews, reviewedFacetCount: 3447 } })),
    /semantic review coverage/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ clusters: { ...evidence().clusters, clusteredReviewCount: 3447 } })),
    /semantic cluster coverage/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ clusters: { ...evidence().clusters, overlapDecisionCount: 11 } })),
    /overlap decision coverage/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ synthesis: { ...evidence().synthesis, terminalActionCount: 11 } })),
    /terminal synthesis coverage/,
  );
});

test("routing must stay bounded, metadata-only, authority-neutral, and stale-safe", () => {
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ routing: { ...evidence().routing, maximumCards: 6 } })),
    /bounded routing maximum/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ routing: { ...evidence().routing, sourceBodiesTransported: 1 } })),
    /source body transport/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ routing: { ...evidence().routing, authorityExpansion: true } })),
    /routing authority expansion/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ routing: { ...evidence().routing, staleCertificationFailsClosed: false } })),
    /stale routing certification/,
  );
});

test("source execution, third-party activation, host changes, and unproved promotions are forbidden", () => {
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ activation: { ...evidence().activation, sourceExecutions: 1 } })),
    /source execution/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ activation: { ...evidence().activation, thirdPartyActivations: 1 } })),
    /third-party activation/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({ activation: { ...evidence().activation, hostProfileChanges: 1 } })),
    /host profile change/,
  );
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({
      synthesis: {
        ...evidence().synthesis,
        promotionReceipts: [{ id: "candidate-a", status: "promoted", testsPassed: false }],
      },
    })),
    /unproved promotion receipt/,
  );
});

test("unresolved critical or important adversarial findings block certification", () => {
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({
      independentReview: { ...evidence().independentReview, unresolvedImportant: 1 },
    })),
    /adversarial review/i,
  );
});

test("a stale adversarial review scope cannot certify current artifacts", () => {
  assert.throws(
    () => certifyWave2SemanticRefinery(evidence({
      independentReview: { ...evidence().independentReview, scopeExact: false },
    })),
    /adversarial review scope/i,
  );
});

test("the repository rebuilds one exact terminal Wave 2 certificate", async () => {
  const receipt = await buildWave2SemanticCertification({
    root: new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"),
    write: false,
  });
  assert.equal(receipt.status, "certified");
  assert.equal(receipt.counts.reviewedFacets, 3448);
  assert.equal(receipt.counts.clusteredFacets, 3448);
  assert.equal(receipt.counts.candidateClusters, 267);
  assert.equal(receipt.adversarialReview.unresolvedCritical, 0);
  assert.equal(receipt.adversarialReview.unresolvedImportant, 0);
});
