import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

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
  if (independentReview.scopeExact !== true) {
    throw new Error("adversarial review scope does not bind current artifacts");
  }
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

async function readArtifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return {
    bytes,
    json: relativePath.endsWith(".json") ? JSON.parse(bytes.toString("utf8")) : null,
    path: relativePath.replaceAll("\\", "/"),
    sha256: sha256(bytes),
  };
}

export async function buildWave2SemanticCertification({ root, write = true } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const paths = {
    structural: "receipts/quarry-total-infusion-v1.json",
    reviewCoverage: "artifacts/wave2-semantic/review-coverage.json",
    reviews: "artifacts/wave2-semantic/review-evidence.jsonl",
    clusterCoverage: "artifacts/wave2-semantic/cluster-coverage.json",
    clusters: "artifacts/wave2-semantic/cluster-evidence.jsonl",
    overlaps: "artifacts/wave2-semantic/overlap-evidence.jsonl",
    synthesis: "artifacts/wave2-semantic/synthesis-evidence.json",
    routing: "receipts/wave2-automatic-gap-routing-v1.json",
    independentReview: "artifacts/wave2-semantic/independent-review.json",
  };
  const artifacts = Object.fromEntries(await Promise.all(
    Object.entries(paths).map(async ([name, relativePath]) => [name, await readArtifact(repositoryRoot, relativePath)]),
  ));

  const structuralCounts = artifacts.structural.json.counts;
  const reviewCoverage = artifacts.reviewCoverage.json;
  const clusterCoverage = artifacts.clusterCoverage.json;
  const synthesisEvidence = artifacts.synthesis.json;
  const routingReceipt = artifacts.routing.json;
  const reviewEvidence = artifacts.independentReview.json;
  const expectedReviewScope = new Map([
    [artifacts.reviews.path, artifacts.reviews],
    [artifacts.clusters.path, artifacts.clusters],
    [artifacts.overlaps.path, artifacts.overlaps],
    [artifacts.synthesis.path, artifacts.synthesis],
    [artifacts.routing.path, artifacts.routing],
  ]);
  const seenReviewScope = new Set();
  const reviewScopeExact = Array.isArray(reviewEvidence.scope) &&
    reviewEvidence.scope.length === expectedReviewScope.size &&
    reviewEvidence.scope.every((row) => {
      const expected = expectedReviewScope.get(row?.path);
      if (!expected || seenReviewScope.has(row.path)) return false;
      seenReviewScope.add(row.path);
      return row.sha256 === expected.sha256 && row.bytes === expected.bytes.byteLength;
    });

  const evidence = {
    structural: {
      status: artifacts.structural.json.status,
      receiptSha256: artifacts.structural.sha256,
      sourceCount: structuralCounts.sourceCount,
      exactDuplicateCount: structuralCounts.exactDuplicateCount,
      canonicalBodyCount: structuralCounts.canonicalBodyCount,
      rejectedCanonicalCount: structuralCounts.canonicalRejectedCount,
      acceptedCanonicalCount: structuralCounts.canonicalFacetCount,
    },
    reviews: {
      artifactSha256: artifacts.reviews.sha256,
      acceptedFacetCount: reviewCoverage.acceptedFacetCount,
      reviewedFacetCount: reviewCoverage.reviewedFacetCount,
      unresolvedFacetCount: reviewCoverage.unresolvedFacetCount,
    },
    clusters: {
      artifactSha256: sha256(Buffer.concat([artifacts.clusters.bytes, artifacts.overlaps.bytes])),
      reviewCount: clusterCoverage.reviewCount,
      clusteredReviewCount: clusterCoverage.clusteredReviewCount,
      unresolvedReviewCount: clusterCoverage.unresolvedReviewCount,
      candidateClusterCount: clusterCoverage.candidateClusterCount,
      overlapDecisionCount: clusterCoverage.overlapDecisionCount,
    },
    synthesis: {
      artifactSha256: artifacts.synthesis.sha256,
      candidateClusterCount: synthesisEvidence.candidateClusterCount,
      terminalActionCount: synthesisEvidence.terminalActionCount,
      unresolvedCandidateCount: synthesisEvidence.unresolvedCandidateCount,
      promotionReceipts: synthesisEvidence.promotionReceipts,
    },
    routing: {
      artifactSha256: artifacts.routing.sha256,
      automaticBoundedGapLookup: routingReceipt.automaticBoundedGapLookup,
      maximumCards: routingReceipt.maximumCards,
      sourceBodiesTransported: routingReceipt.sourceBodiesTransported,
      authorityExpansion: routingReceipt.authorityExpansion,
      staleCertificationFailsClosed: routingReceipt.staleCertificationFailsClosed,
    },
    activation: {
      sourceExecutions: Math.max(synthesisEvidence.activation?.sourceExecutions ?? 0, routingReceipt.activation?.sourceExecutions ?? 0),
      thirdPartyActivations: Math.max(synthesisEvidence.activation?.thirdPartyActivations ?? 0, routingReceipt.activation?.thirdPartyActivations ?? 0),
      hostProfileChanges: Math.max(synthesisEvidence.activation?.hostProfileChanges ?? 0, routingReceipt.activation?.hostProfileChanges ?? 0),
    },
    independentReview: {
      artifactSha256: artifacts.independentReview.sha256,
      mode: reviewEvidence.mode,
      scopeExact: reviewScopeExact,
      unresolvedCritical: reviewEvidence.unresolvedCritical,
      unresolvedImportant: reviewEvidence.unresolvedImportant,
      reviewerIndependenceProven: reviewEvidence.reviewerIndependenceProven,
    },
  };

  const certificate = certifyWave2SemanticRefinery(evidence);
  const receipt = {
    ...certificate,
    evidenceBindings: Object.fromEntries(Object.entries(artifacts).map(([name, artifact]) => [name, {
      path: artifact.path,
      sha256: artifact.sha256,
      bytes: artifact.bytes.byteLength,
    }])),
    adversarialReview: {
      mode: reviewEvidence.mode,
      reviewerIndependenceProven: reviewEvidence.reviewerIndependenceProven,
      scopeExact: reviewScopeExact,
      unresolvedCritical: reviewEvidence.unresolvedCritical,
      unresolvedImportant: reviewEvidence.unresolvedImportant,
      acceptedLimitations: reviewEvidence.acceptedLimitations,
    },
    activation: evidence.activation,
  };

  if (write) {
    await writeJsonAtomic(path.join(repositoryRoot, "receipts/wave2-semantic-refinery-v1.json"), receipt);
  }
  return receipt;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  const receipt = await buildWave2SemanticCertification({ write: true });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    certificateSha256: receipt.certificateSha256,
    counts: receipt.counts,
  }, null, 2)}\n`);
}
