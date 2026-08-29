import assert from "node:assert/strict";
import test from "node:test";

import { validateWave2ReviewBatch } from "../src/wave2-semantic-refinery.mjs";

const DIGEST = "a".repeat(64);

function facet(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "facet-alpha",
    bodySha256: DIGEST,
    canonicalSourceId: "owner/repo@head:skills/alpha/SKILL.md",
    aliasSourceIds: [],
    repository: "owner/repo",
    sourcePath: "skills/alpha/SKILL.md",
    licenseSignals: ["MIT"],
    name: "alpha",
    summary: "Source-authored summary that reviews may not copy.",
    headings: ["Alpha", "Limits"],
    familyIds: ["implementation-engineering"],
    primaryFamily: "implementation-engineering",
    targetSkillId: "eternities-daedalus",
    security: {
      dispositions: ["clear-for-semantic-review"],
      requiredReviews: ["semantic"],
      surfaces: [],
      ruleIds: [],
      semanticReviewComplete: false,
      sourceExecutionAuthorized: false,
    },
    evidenceMode: "inert-pattern-reference",
    ...overrides,
  };
}

function bodyEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    bodySha256: DIGEST,
    canonicalSourceId: "owner/repo@head:skills/alpha/SKILL.md",
    bodyBytes: 1200,
    structure: {
      frontmatterName: "alpha",
      frontmatterDescription: "Source-authored summary that reviews may not copy.",
      headings: ["Alpha", "Limits"],
    },
    ...overrides,
  };
}

function review(overrides = {}) {
  return {
    facetId: "facet-alpha",
    canonicalSourceId: "owner/repo@head:skills/alpha/SKILL.md",
    bodySha256: DIGEST,
    neutralCapabilitySummary: "Turns a bounded implementation request into a verifiable local change while preserving explicit failure limits.",
    neutralIntentExamples: [
      "implement a bounded local behavior and prove the result",
      "turn this settled requirement into a tested repository change",
    ],
    legacyAliases: ["alpha"],
    inputs: ["settled behavior and repository evidence"],
    operations: ["derive a minimal change and verify its observable result"],
    outputs: ["a local implementation and reproducible verification evidence"],
    effects: ["read", "write"],
    failureBehavior: ["stop when authority or required evidence is absent"],
    exclusions: ["external mutation and unverified completion claims"],
    usefulInvariants: ["the claimed result remains tied to observed evidence"],
    materialRisks: ["an incomplete fixture can conceal a behavioral regression"],
    providerCoupling: "none",
    projectCoupling: "portable",
    disposition: "independent-implementation",
    proposedCluster: "bounded-implementation-and-proof",
    confidence: "high",
    copiedSourceProse: false,
    promotionClaim: false,
    ...overrides,
  };
}

function batch(reviews = [review()], overrides = {}) {
  return {
    schemaVersion: 1,
    waveId: "wave2-implementation-engineering-001",
    familyId: "implementation-engineering",
    reviewer: "codex:test-reviewer",
    reviewMethod: "bounded-source-review-v2",
    reviews,
    ...overrides,
  };
}

test("valid review is bound to exact facet evidence and has a stable digest", () => {
  const first = validateWave2ReviewBatch(batch(), [facet()], [bodyEvidence()]);
  const second = validateWave2ReviewBatch(batch(), [facet()], [bodyEvidence()]);

  assert.equal(first.length, 1);
  assert.deepEqual(first, second);
  assert.match(first[0].reviewDigest, /^[a-f0-9]{64}$/);
  assert.equal(first[0].facetId, "facet-alpha");
  assert.equal(first[0].reviewer, "codex:test-reviewer");
});

test("stale body digest cannot advance to semantic review", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ bodySha256: "b".repeat(64) })]), [facet()], [bodyEvidence()]),
    /stale body digest/,
  );
});

test("duplicate facet reviews in one batch are rejected", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch([review(), review()]), [facet()], [bodyEvidence()]),
    /duplicate review facet/,
  );
});

test("copied source summary and slash-command intent are rejected", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ neutralCapabilitySummary: facet().summary })]), [facet()], [bodyEvidence()]),
    /copies the source summary/,
  );
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ neutralIntentExamples: ["/alpha"] })]), [facet()], [bodyEvidence()]),
    /must not begin with a slash command/,
  );
});

test("unknown effects and unsupported coupling values fail closed", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ effects: ["deploy"] })]), [facet()], [bodyEvidence()]),
    /unknown effect/,
  );
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ providerCoupling: "magical" })]), [facet()], [bodyEvidence()]),
    /unknown provider coupling/,
  );
});

test("security-rejected canonical bodies cannot enter semantic review", () => {
  const rejected = facet({
    security: {
      ...facet().security,
      dispositions: ["reject-before-indexing"],
    },
  });
  assert.throws(
    () => validateWave2ReviewBatch(batch(), [rejected], [bodyEvidence()]),
    /security-rejected facet/,
  );
});

test("review family and canonical source must match the facet", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch(), [facet({ primaryFamily: "debugging-recovery" })], [bodyEvidence()]),
    /not owned by batch family/,
  );
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ canonicalSourceId: "other/repo@head:SKILL.md" })]), [facet()], [bodyEvidence()]),
    /canonical source mismatch/,
  );
});

test("reviews require complete neutral behavior and cannot claim promotion", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ materialRisks: [] })]), [facet()], [bodyEvidence()]),
    /materialRisks must not be empty/,
  );
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({ promotionClaim: true })]), [facet()], [bodyEvidence()]),
    /cannot claim promotion/,
  );
});

test("generic semantic-review boilerplate is rejected", () => {
  assert.throws(
    () => validateWave2ReviewBatch(batch([review({
      neutralCapabilitySummary: "Provides a bounded method for alpha with explicit inputs, outcomes, and limits.",
      operations: [
        "interpret the requested outcome",
        "apply the source pattern within scope",
        "check results against stated constraints",
      ],
    })]), [facet()], [bodyEvidence()]),
    /generic semantic review boilerplate/,
  );
});

test("mass-repeated operation scaffolds fail batch quality review", () => {
  const facets = [];
  const bodies = [];
  const reviews = [];
  for (let index = 0; index < 5; index += 1) {
    const suffix = String(index + 1);
    const bodySha256 = suffix.repeat(64);
    const facetId = `facet-${suffix}`;
    const canonicalSourceId = `owner/repo@head:skills/alpha-${suffix}/SKILL.md`;
    facets.push(facet({ id: facetId, bodySha256, canonicalSourceId, name: `alpha-${suffix}` }));
    bodies.push(bodyEvidence({ bodySha256, canonicalSourceId }));
    reviews.push(review({
      facetId,
      bodySha256,
      canonicalSourceId,
      neutralCapabilitySummary: `Derives alpha mechanism ${suffix} through a distinct evidence path and preserves its observable contract.`,
    }));
  }

  assert.throws(
    () => validateWave2ReviewBatch(batch(reviews), facets, bodies),
    /repeated operation scaffold/,
  );
});

test("repeated generic operation fragments cannot hide behind a varied first operation", () => {
  const facets = [];
  const bodies = [];
  const reviews = [];
  for (let index = 0; index < 5; index += 1) {
    const suffix = String(index + 1);
    const bodySha256 = suffix.repeat(64);
    const facetId = `facet-${suffix}`;
    const canonicalSourceId = `owner/repo@head:skills/beta-${suffix}/SKILL.md`;
    facets.push(facet({ id: facetId, bodySha256, canonicalSourceId, name: `beta-${suffix}` }));
    bodies.push(bodyEvidence({ bodySha256, canonicalSourceId }));
    reviews.push(review({
      facetId,
      bodySha256,
      canonicalSourceId,
      neutralCapabilitySummary: `Coordinates beta mechanism ${suffix} through a distinct artifact and decision boundary.`,
      operations: [
        `inspect beta artifact ${suffix}`,
        "trace the documented configuration mechanism",
        "verify prerequisites and side-effect boundaries",
      ],
    }));
  }

  assert.throws(
    () => validateWave2ReviewBatch(batch(reviews), facets, bodies),
    /repeated operation fragment/,
  );
});
