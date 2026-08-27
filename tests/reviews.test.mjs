import test from "node:test";
import assert from "node:assert/strict";

import { validateReviewBatch } from "../src/reviews.mjs";
import { buildCoverageRows } from "../src/coverage.mjs";

const source = {
  id: "skill-a",
  name: "Agency Client",
  sourcePath: "repo\\agency-client\\SKILL.md",
  contentDigest: "a".repeat(64),
  families: ["agency-client-services"],
  licenseClass: "permissive",
  confidence: "high",
};

const body = {
  schemaVersion: 1,
  sourceId: "skill-a",
  status: "inspected",
  present: true,
  bodySha256: "b".repeat(64),
  byteSize: 100,
  lineCount: 5,
};

function batch(reviewOverrides = {}, batchOverrides = {}) {
  return {
    schemaVersion: 1,
    waveId: "agency-client-services-wave-001",
    familyId: "agency-client-services",
    reviewer: "codex:01a03c38-8589-79d2-a007-bf4c128304af",
    reviewMethod: "bounded-source-review-v1",
    reviews: [
      {
        sourceId: "skill-a",
        bodySha256: "b".repeat(64),
        neutralCapabilitySummary:
          "Coordinate a client relationship from intake through verified delivery.",
        neutralIntentExamples: [
          "reconcile a client relationship from intake through verified delivery",
          "show the account evidence, gaps, and next bounded action",
        ],
        legacyAliases: ["/agency:client"],
        inputs: ["client objective and current account state"],
        operations: ["reconcile intake, scope, delivery state, and reporting evidence"],
        outputs: ["bounded client-service status and next-action contract"],
        effects: ["read"],
        failureBehavior: ["defer when client authority or delivery evidence is missing"],
        exclusions: ["unapproved external communication", "automatic billing changes"],
        usefulInvariants: ["client authority and delivery proof remain explicit"],
        materialRisks: ["stale account state can produce misleading status"],
        disposition: "independent-implementation",
        proposedCluster: "client-account-governance",
        confidence: "high",
        copiedSourceProse: false,
        promotionClaim: false,
        ...reviewOverrides,
      },
    ],
    ...batchOverrides,
  };
}

test("exact review evidence advances only card-reviewed state", () => {
  const reviews = validateReviewBatch(batch(), [source], [body]);
  const rows = buildCoverageRows([source], [body], [], reviews);

  assert.equal(reviews.length, 1);
  assert.equal(rows[0].evidence.cardReviewed, true);
  assert.equal(rows[0].evidence.clustered, false);
  assert.equal(rows[0].evidence.synthesized, false);
  assert.equal(rows[0].evidence.promoted, false);
  assert.deepEqual(reviews[0].neutralIntentExamples, [
    "reconcile a client relationship from intake through verified delivery",
    "show the account evidence, gaps, and next bounded action",
  ]);
  assert.deepEqual(reviews[0].legacyAliases, ["/agency:client"]);
});

test("review evidence rejects stale body digests and unknown sources", () => {
  assert.throws(
    () => validateReviewBatch(batch({ bodySha256: "c".repeat(64) }), [source], [body]),
    /stale body digest for skill-a/,
  );
  assert.throws(
    () => validateReviewBatch(batch({ sourceId: "skill-missing" }), [source], [body]),
    /unknown review source: skill-missing/,
  );
});

test("review evidence rejects copied prose and unsupported promotion language", () => {
  assert.throws(
    () => validateReviewBatch(batch({ copiedSourceProse: true }), [source], [body]),
    /copied source prose/,
  );
  assert.throws(
    () => validateReviewBatch(batch({ promotionClaim: true }), [source], [body]),
    /cannot claim promotion/,
  );
});

test("review evidence requires contract boundaries and a known disposition", () => {
  assert.throws(
    () => validateReviewBatch(batch({ exclusions: [] }), [source], [body]),
    /exclusions must not be empty/,
  );
  assert.throws(
    () => validateReviewBatch(batch({ disposition: "promoted" }), [source], [body]),
    /unknown review disposition/,
  );
});

test("review batches reject duplicate source rows", () => {
  const duplicate = batch({}, { reviews: [batch().reviews[0], batch().reviews[0]] });
  assert.throws(
    () => validateReviewBatch(duplicate, [source], [body]),
    /duplicate review source: skill-a/,
  );
});

test("review evidence requires unnamed intent and keeps aliases non-authoritative", () => {
  assert.throws(
    () => validateReviewBatch(batch({ neutralIntentExamples: [] }), [source], [body]),
    /neutralIntentExamples must not be empty/,
  );
  assert.throws(
    () =>
      validateReviewBatch(
        batch({ neutralIntentExamples: ["/agency:client"] }),
        [source],
        [body],
      ),
    /neutralIntentExamples must not begin with a slash command/,
  );
  assert.throws(
    () =>
      validateReviewBatch(
        batch({
          neutralIntentExamples: ["Client Status"],
          legacyAliases: ["client status"],
        }),
        [source],
        [body],
      ),
    /legacy alias cannot be a canonical intent example/,
  );
  assert.doesNotThrow(() =>
    validateReviewBatch(batch({ legacyAliases: [] }), [source], [body]),
  );
});

test("review evidence rejects normalized duplicate intents and aliases", () => {
  assert.throws(
    () =>
      validateReviewBatch(
        batch({ neutralIntentExamples: ["Review account", "review   account"] }),
        [source],
        [body],
      ),
    /neutralIntentExamples must not contain normalized duplicates/,
  );
  assert.throws(
    () =>
      validateReviewBatch(
        batch({ legacyAliases: ["/Agency:Client", "/agency:client"] }),
        [source],
        [body],
      ),
    /legacyAliases must not contain normalized duplicates/,
  );
});
