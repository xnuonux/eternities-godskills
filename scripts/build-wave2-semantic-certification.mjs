import { sha256 } from "../src/io.mjs";

const PROMOTION_STATUSES = new Set(["promoted", "experimental", "deferred", "rejected"]);

function digest(value, field) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${field} must be a SHA-256 digest`);
  }
}

function exact(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must equal ${expected}`);
}

export function certifyWave2SemanticRefinery(evidence) {
  const { structural, reviews, clusters, synthesis, routing, activation, independentReview } = evidence ?? {};
  if (structural?.status !== "certified") throw new Error("historical structural receipt is not certified");
  digest(structural.receiptSha256, "structural receipt digest");
  exact(structural.sourceCount, 7776, "structural source count");
  exact(structural.exactDuplicateCount, 4195, "structural exact duplicate count");
  exact(structural.canonicalBodyCount, 3581, "structural canonical body count");
  exact(structural.rejectedCanonicalCount, 133, "structural rejected canonical count");
  exact(structural.acceptedCanonicalCount, 3448, "structural accepted canonical count");

  digest(reviews?.artifactSha256, "semantic review artifact digest");
  if (
    reviews.acceptedFacetCount !== 3448 ||
    reviews.reviewedFacetCount !== 3448 ||
    reviews.unresolvedFacetCount !== 0
  ) throw new Error("semantic review coverage is incomplete");

  digest(clusters?.artifactSha256, "semantic cluster artifact digest");
  if (
    clusters.reviewCount !== 3448 ||
    clusters.clusteredReviewCount !== 3448 ||
    clusters.unresolvedReviewCount !== 0
  ) throw new Error("semantic cluster coverage is incomplete");
  if (clusters.overlapDecisionCount !== clusters.candidateClusterCount) {
    throw new Error("overlap decision coverage is incomplete");
  }

  digest(synthesis?.artifactSha256, "semantic synthesis artifact digest");
  if (
    synthesis.candidateClusterCount !== clusters.candidateClusterCount ||
    synthesis.terminalActionCount !== clusters.candidateClusterCount ||
    synthesis.unresolvedCandidateCount !== 0
  ) throw new Error("terminal synthesis coverage is incomplete");
  if (!Array.isArray(synthesis.promotionReceipts)) throw new Error("promotion receipts must be an array");
  for (const receipt of synthesis.promotionReceipts) {
    if (typeof receipt?.id !== "string" || receipt.id === "" || !PROMOTION_STATUSES.has(receipt.status)) {
      throw new Error("invalid promotion receipt");
    }
    if (receipt.status === "promoted" && receipt.testsPassed !== true) {
      throw new Error(`unproved promotion receipt: ${receipt.id}`);
    }
  }

  digest(routing?.artifactSha256, "automatic routing artifact digest");
  if (routing.automaticBoundedGapLookup !== true) throw new Error("automatic bounded gap lookup is not certified");
  if (!Number.isInteger(routing.maximumCards) || routing.maximumCards < 1 || routing.maximumCards > 5) {
    throw new Error("bounded routing maximum must be between 1 and 5");
  }
  if (routing.sourceBodiesTransported !== 0) throw new Error("source body transport is forbidden");
  if (routing.authorityExpansion !== false) throw new Error("routing authority expansion is forbidden");
  if (routing.staleCertificationFailsClosed !== true) throw new Error("stale routing certification must fail closed");

  if (activation?.sourceExecutions !== 0) throw new Error("source execution is forbidden");
  if (activation.thirdPartyActivations !== 0) throw new Error("third-party activation is forbidden");
  if (activation.hostProfileChanges !== 0) throw new Error("host profile change is forbidden");

  digest(independentReview?.artifactSha256, "independent review artifact digest");
  if (typeof independentReview.mode !== "string" || independentReview.mode === "") {
    throw new Error("adversarial review mode is required");
  }
  if (independentReview.unresolvedCritical !== 0 || independentReview.unresolvedImportant !== 0) {
    throw new Error("adversarial review has unresolved critical or important findings");
  }

  const normalized = {
    schemaVersion: 1,
    certificateId: "wave2-semantic-refinery-v1",
    status: "certified",
    historicalStructuralReceiptSha256: structural.receiptSha256,
    counts: {
      sourceSkills: structural.sourceCount,
      inheritedExactDuplicates: structural.exactDuplicateCount,
      canonicalBodies: structural.canonicalBodyCount,
      rejectedCanonicalBodies: structural.rejectedCanonicalCount,
      acceptedCanonicalFacets: structural.acceptedCanonicalCount,
      reviewedFacets: reviews.reviewedFacetCount,
      clusteredFacets: clusters.clusteredReviewCount,
      candidateClusters: clusters.candidateClusterCount,
      overlapDecisions: clusters.overlapDecisionCount,
      terminalSynthesisActions: synthesis.terminalActionCount,
    },
    artifactDigests: {
      reviews: reviews.artifactSha256,
      clusters: clusters.artifactSha256,
      synthesis: synthesis.artifactSha256,
      routing: routing.artifactSha256,
      independentReview: independentReview.artifactSha256,
    },
    gates: [
      "exact-structural-inheritance",
      "complete-semantic-review",
      "complete-cluster-membership",
      "terminal-overlap-adjudication",
      "terminal-synthesis-accounting",
      "bounded-automatic-gap-routing",
      "adversarial-review-closure",
      "zero-source-execution",
      "zero-third-party-activation",
    ],
    proofLimits: [
      "deterministic-local-evidence-only",
      "no-third-party-source-execution",
      "no-universal-capability-claim",
      "reviewer-independence-not-proven-beyond-recorded-pass",
    ],
  };
  return { ...normalized, certificateSha256: sha256(JSON.stringify(normalized)) };
}
