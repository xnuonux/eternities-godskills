import assert from "node:assert/strict";
import test from "node:test";

import { compileIntentWithGapLookup } from "../src/intent-compiler.mjs";
import { loadWave2SemanticAtlas, searchWave2SemanticAtlas } from "../src/quarry-atlas.mjs";
import { buildWave2GapRoutingReceipt } from "../scripts/build-wave2-gap-routing-receipt.mjs";

const digest = (letter) => letter.repeat(64);
const card = {
  schemaVersion: 1,
  id: "eternities-daedalus",
  family: "implementation-engineering",
  intent: "implement bounded local software changes with tests",
  successCondition: "the requested code behavior passes fresh tests",
  provides: ["behavioral-verification", "bounded-implementation"],
  requires: [],
  intentExamples: {
    direct: ["implement this local feature with tests"],
    paraphrased: ["change the code and prove the behavior"],
    contextual: ["the requirement is settled and now needs implementation"],
  },
  negativeIntents: ["find an obscure scientific workflow"],
  effects: ["local-read", "local-write"],
  riskClass: "moderate",
  authorityRequirements: ["local-read", "local-write"],
  preconditions: ["settled-requirement"],
  compatibleWith: [],
  conflictsWith: [],
  contextCost: 500,
  dependencyCost: 0,
  evidenceConfidence: "verified",
  entrypoint: "skills/eternities-daedalus/SKILL.md",
  legacyAliases: [],
};

function request(text, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "gap-route-test",
    text,
    context: {
      permittedEffects: ["local-read", "local-write"],
      availableAuthority: ["local-read", "local-write"],
      availablePreconditions: ["settled-requirement"],
      forbiddenCapabilities: [],
      maximumRisk: "high",
      minimumEvidenceConfidence: "medium",
      contextBudget: 4000,
      maxCompositionSize: 2,
      ...overrides,
    },
  };
}

const semanticAtlas = {
  certificate: { digest: digest("f"), stale: false },
  clusters: Array.from({ length: 7 }, (_, index) => ({
    schemaVersion: 1,
    familyId: "verification-evidence",
    id: `genomic-coordinate-gate-${index}`,
    intent: `validate genomic coordinate assembly and variant evidence ${index}`,
    synthesisDecision: index === 0 ? "candidate" : "deferred",
    relationship: "ordered-composition",
    clusterDigest: digest(String((index + 1) % 10)),
    members: [{ facetId: `facet-${index}`, reviewDigest: digest("a"), role: "canonical" }],
  })),
  overlapByCluster: new Map([["verification-evidence::genomic-coordinate-gate-0", {
    targetSkillId: "genomic-coordinate-assembly-and-variant-gates",
  }]]),
  evaluationByCluster: new Map([["verification-evidence::genomic-coordinate-gate-0", {
    status: "deferred",
  }]]),
};

test("semantic cluster search is deterministic, compact, and bounded to five", () => {
  const first = searchWave2SemanticAtlas(semanticAtlas, { query: "genomic coordinate variant validation", limit: 5 });
  const second = searchWave2SemanticAtlas(semanticAtlas, { query: "genomic coordinate variant validation", limit: 5 });
  assert.deepEqual(first, second);
  assert.equal(first.length, 5);
  assert.equal(first.some((row) => "sourceAbsolutePath" in row || "sourceBody" in row), false);
  assert.throws(() => searchWave2SemanticAtlas(semanticAtlas, { query: "genomic", limit: 6 }), /limit/);
  assert.throws(
    () => searchWave2SemanticAtlas({ ...semanticAtlas, certificate: { ...semanticAtlas.certificate, stale: true } }, { query: "genomic" }),
    /stale/,
  );
});

test("the current repository atlas loads only from exact terminal evidence", async () => {
  const atlas = await loadWave2SemanticAtlas(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
  assert.equal(atlas.certificate.reviewedFacetCount, 3448);
  assert.equal(atlas.clusters.length, 1674);
  assert.equal(atlas.certificate.candidateClusterCount, 267);
});

test("covered ordinary work stays on promoted routing without atlas lookup", () => {
  const result = compileIntentWithGapLookup({
    request: request("implement this local feature with tests"),
    cards: [card],
    semanticAtlas,
  });
  assert.equal(result.gapLookup.invoked, false);
  assert.equal(result.gapLookup.reason, "promoted-route-qualified");
  assert.deepEqual(result.compilerReceipt.suppliedAuthority, ["local-read", "local-write"]);
});

test("uncovered consequential work invokes bounded lookup without expanding authority", () => {
  const result = compileIntentWithGapLookup({
    request: request("build a genomic coordinate and variant validation gate"),
    cards: [card],
    semanticAtlas,
  });
  assert.equal(result.gapLookup.invoked, true);
  assert.equal(result.gapLookup.cards.length, 5);
  assert.equal(result.gapLookup.terminalRoute, "refinery-handoff");
  assert.equal(result.gapLookup.targetSkillId, "sovereign-skill-refinery");
  assert.equal(result.gapLookup.authorityExpanded, false);
  assert.deepEqual(result.compilerReceipt.suppliedAuthority, ["local-read", "local-write"]);
});

test("the repository gap-routing receipt binds current artifacts and all safety gates", async () => {
  const receipt = await buildWave2GapRoutingReceipt({
    root: new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"),
    write: false,
  });
  assert.equal(receipt.status, "certified");
  assert.equal(receipt.automaticBoundedGapLookup, true);
  assert.equal(receipt.maximumCards, 5);
  assert.equal(receipt.sourceBodiesTransported, 0);
  assert.equal(receipt.authorityExpansion, false);
  assert.equal(receipt.staleCertificationFailsClosed, true);
  assert.equal(Object.values(receipt.gates).every(Boolean), true);
});
