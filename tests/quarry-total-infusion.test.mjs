import assert from "node:assert/strict";
import test from "node:test";

import { buildQuarryInfusion } from "../src/quarry-infusion.mjs";

const digest = (character) => character.repeat(64);

function fixtures() {
  const sources = [
    { id: "a", repository: "r/a", sourcePath: "skills/api/SKILL.md", bodySha256: digest("a"), bodyBytes: 100, licenseSignal: "MIT", inert: true },
    { id: "b", repository: "r/b", sourcePath: "copies/api/SKILL.md", bodySha256: digest("a"), bodyBytes: 100, licenseSignal: "MIT", inert: true },
    { id: "c", repository: "r/c", sourcePath: "skills/payload/SKILL.md", bodySha256: digest("c"), bodyBytes: 90, licenseSignal: "NOASSERTION", inert: true },
    { id: "d", repository: "r/d", sourcePath: "skills/story/SKILL.md", bodySha256: digest("d"), bodyBytes: 80, licenseSignal: "Apache-2.0", inert: true },
  ];
  const securityRows = [
    { id: "a", bodySha256: digest("a"), disposition: "clear-for-semantic-review", requiredReview: "semantic", surfaces: [], findings: [] },
    { id: "b", bodySha256: digest("a"), disposition: "manual-review-required", requiredReview: "semantic", surfaces: ["network"], findings: [{ ruleId: "SENSITIVE-CAPABILITY" }] },
    { id: "c", bodySha256: digest("c"), disposition: "reject-before-indexing", requiredReview: "reject", surfaces: ["shell"], findings: [{ ruleId: "EXE-OBFUSCATED-PAYLOAD" }] },
    { id: "d", bodySha256: digest("d"), disposition: "manual-review-required", requiredReview: "semantic", surfaces: [], findings: [] },
  ];
  const bodyStructures = {
    [digest("a")]: { frontmatterName: "api designer", frontmatterDescription: "design stable service APIs", headings: ["contracts"] },
    [digest("c")]: { frontmatterName: "payload", frontmatterDescription: "execute hidden payload", headings: [] },
    [digest("d")]: { frontmatterName: "story editor", frontmatterDescription: "write and revise narrative", headings: ["revision"] },
  };
  const ontology = { schemaVersion: 1, families: [
    { id: "implementation-engineering", keywords: ["api", "service"] },
    { id: "writing-narrative-canon", keywords: ["story", "narrative"] },
  ] };
  const familyTargets = {
    schemaVersion: 1,
    defaultFamily: "general",
    targets: {
      "implementation-engineering": "eternities-daedalus",
      "writing-narrative-canon": "eternities-logos",
      general: "sovereign-skill-refinery",
    },
  };
  return { sources, securityRows, bodyStructures, ontology, familyTargets };
}

test("every quarry source reaches exactly one terminal disposition", () => {
  const result = buildQuarryInfusion(fixtures());
  assert.deepEqual(result.coverage, {
    sourceCount: 4,
    canonicalBodyCount: 3,
    canonicalFacetCount: 2,
    canonicalRejectedCount: 1,
    exactDuplicateCount: 1,
    unresolvedSourceCount: 0,
  });
  assert.deepEqual(result.dispositions.map(({ sourceId, disposition }) => [sourceId, disposition]), [
    ["a", "canonical-facet"],
    ["b", "exact-duplicate"],
    ["c", "security-rejected"],
    ["d", "canonical-facet"],
  ]);
});

test("canonical facets preserve aliases risks provenance and deterministic Godskill targets", () => {
  const result = buildQuarryInfusion(fixtures());
  assert.equal(result.facets.length, 2);
  assert.deepEqual(result.facets[0].aliasSourceIds, ["b"]);
  assert.deepEqual(result.facets[0].security.dispositions, ["clear-for-semantic-review", "manual-review-required"]);
  assert.equal(result.facets[0].primaryFamily, "implementation-engineering");
  assert.equal(result.facets[0].targetSkillId, "eternities-daedalus");
  assert.equal(result.facets[1].targetSkillId, "eternities-logos");
  assert.deepEqual(result.familyIndex.families.map(({ id, facetCount }) => [id, facetCount]), [
    ["implementation-engineering", 1],
    ["writing-narrative-canon", 1],
  ]);
});

test("infusion fails closed on stale or incomplete evidence", () => {
  const missingSecurity = fixtures();
  missingSecurity.securityRows.pop();
  assert.throws(() => buildQuarryInfusion(missingSecurity), /security evidence does not cover every source/);

  const stale = fixtures();
  stale.securityRows[0] = { ...stale.securityRows[0], bodySha256: digest("f") };
  assert.throws(() => buildQuarryInfusion(stale), /security body digest drift/);

  const missingStructure = fixtures();
  delete missingStructure.bodyStructures[digest("d")];
  assert.throws(() => buildQuarryInfusion(missingStructure), /missing canonical body structure/);
});
