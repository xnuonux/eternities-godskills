import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadVerifiedAtlas, searchQuarryAtlas } from "../src/quarry-atlas.mjs";
import { sha256 } from "../src/io.mjs";
import { buildQuarryInfusionV2Evidence } from "../scripts/build-quarry-infusion-v2.mjs";

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const jsonl = (rows) => `${rows.map(JSON.stringify).join("\n")}\n`;

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "quarry-atlas-v2-"));
  await mkdir(path.join(root, "artifacts/quarry-infusion-v2"), { recursive: true });
  await mkdir(path.join(root, "receipts"), { recursive: true });
  const facet = {
    id: "facet-v2",
    bodySha256: "a".repeat(64),
    canonicalSourceId: "wave2:a",
    aliasSourceIds: ["wave3:b"],
    repository: "repo/shared",
    sourcePath: "skills/shared/SKILL.md",
    licenseSignals: ["MIT"],
    name: "shared specialist",
    summary: "shared cross wave specialist evidence",
    headings: ["evidence"],
    familyIds: ["research-evidence"],
    primaryFamily: "research-evidence",
    targetSkillId: "eternities-oracle",
    evidenceMode: "inert-pattern-reference",
    security: {
      dispositions: ["clear-for-semantic-review"],
      requiredReviews: ["semantic"],
      surfaces: [],
      ruleIds: [],
      semanticReviewComplete: false,
      sourceExecutionAuthorized: false,
    },
  };
  const text = `${JSON.stringify(facet)}\n`;
  const facetPath = "artifacts/quarry-infusion-v2/facets.jsonl";
  await writeFile(path.join(root, facetPath), text);
  await writeFile(path.join(root, "receipts/quarry-total-infusion-v2.json"), `${JSON.stringify({
    schemaVersion: 2,
    status: "certified",
    counts: { sourceCount: 2, canonicalBodyCount: 1, canonicalFacetCount: 1, unresolvedSourceCount: 0 },
    outputs: { facets: { path: facetPath, sha256: sha256(text), bytes: Buffer.byteLength(text) } },
  }, null, 2)}\n`);
  return root;
}

test("verified atlas defaults to certified v2 and retains cross-wave aliases", async () => {
  const atlas = await loadVerifiedAtlas(await fixture());
  assert.equal(atlas.receipt.schemaVersion, 2);
  assert.deepEqual(atlas.facets[0].aliasSourceIds, ["wave3:b"]);
  assert.equal(searchQuarryAtlas(atlas, { query: "cross wave evidence", limit: 1 })[0].id, "facet-v2");
});

test("verified atlas rejects incomplete v2 terminal coverage", async () => {
  const root = await fixture();
  const receiptPath = path.join(root, "receipts/quarry-total-infusion-v2.json");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  receipt.counts.unresolvedSourceCount = 1;
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await assert.rejects(loadVerifiedAtlas(root), /terminal coverage/);
});

async function infusionFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "quarry-infusion-v2-"));
  for (const directory of ["artifacts/github-wave-2", "artifacts/github-wave-3", "artifacts/quarry-infusion", "data", "receipts"]) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  const shared = "a".repeat(64);
  const unique = "b".repeat(64);
  const wave2Sources = jsonl([{ id: "wave2:a", repository: "repo/a", sourcePath: "skills/a/SKILL.md", bodySha256: shared, inert: true }]);
  const wave3Sources = jsonl([
    { id: "wave3:a", repository: "repo/a3", sourcePath: "skills/a/SKILL.md", bodySha256: shared, inert: true },
    { id: "wave3:b", repository: "repo/b", sourcePath: "skills/b/SKILL.md", bodySha256: unique, inert: true },
  ]);
  const wave2Security = jsonl([{ id: "wave2:a", bodySha256: shared, disposition: "clear-for-semantic-review", requiredReview: "semantic", surfaces: [], findings: [] }]);
  const wave3Security = jsonl([
    { id: "wave3:a", bodySha256: shared, disposition: "manual-review-required", requiredReview: "semantic", surfaces: ["network"], findings: [{ ruleId: "SENSITIVE-CAPABILITY" }] },
    { id: "wave3:b", bodySha256: unique, disposition: "clear-for-semantic-review", requiredReview: "semantic", surfaces: [], findings: [] },
  ]);
  const wave2Structures = jsonl([{ bodySha256: shared, structure: { frontmatterName: "api", frontmatterDescription: "design api contracts", headings: ["contracts"] } }]);
  const wave3Structures = jsonl([
    { bodySha256: shared, structure: { frontmatterName: "api", frontmatterDescription: "design api contracts", headings: ["contracts"] } },
    { bodySha256: unique, structure: { frontmatterName: "research", frontmatterDescription: "gather source evidence", headings: ["evidence"] } },
  ]);
  const files = {
    "artifacts/github-wave-2/source-records.jsonl": wave2Sources,
    "artifacts/github-wave-2/skill-security-ledger.jsonl": wave2Security,
    "artifacts/quarry-infusion/body-structures.jsonl": wave2Structures,
    "artifacts/github-wave-3/source-records.jsonl": wave3Sources,
    "artifacts/github-wave-3/skill-security-ledger.jsonl": wave3Security,
    "artifacts/github-wave-3/body-structures.jsonl": wave3Structures,
  };
  for (const [relativePath, value] of Object.entries(files)) await writeFile(path.join(root, relativePath), value);
  await writeFile(path.join(root, "data/ontology.v1.json"), json({ schemaVersion: 1, families: [{ id: "implementation-engineering", keywords: ["api"] }, { id: "research-evidence", keywords: ["research", "evidence"] }] }));
  await writeFile(path.join(root, "data/quarry-family-targets.v1.json"), json({ schemaVersion: 1, defaultFamily: "general", targets: { "implementation-engineering": "eternities-daedalus", "research-evidence": "eternities-oracle", general: "sovereign-skill-refinery" } }));
  const binding = (relativePath) => ({ path: relativePath, sha256: sha256(files[relativePath]), bytes: Buffer.byteLength(files[relativePath]) });
  await writeFile(path.join(root, "receipts/quarry-total-infusion-v1.json"), json({ status: "certified", inputs: { sources: binding("artifacts/github-wave-2/source-records.jsonl"), security: binding("artifacts/github-wave-2/skill-security-ledger.jsonl"), structures: binding("artifacts/quarry-infusion/body-structures.jsonl") } }));
  await writeFile(path.join(root, "receipts/github-skill-quarry-wave-3.json"), json({ status: "verified", outputs: { sourceRecords: binding("artifacts/github-wave-3/source-records.jsonl") } }));
  await writeFile(path.join(root, "receipts/github-wave-3-skill-security.json"), json({ sourceRecordsPath: "artifacts/github-wave-3/source-records.jsonl", sourceRecordsSha256: binding("artifacts/github-wave-3/source-records.jsonl").sha256, ledgerPath: "artifacts/github-wave-3/skill-security-ledger.jsonl", ledgerSha256: binding("artifacts/github-wave-3/skill-security-ledger.jsonl").sha256, totalSources: 2 }));
  await writeFile(path.join(root, "receipts/github-wave-3-structural-evidence.json"), json({ status: "verified", inputs: { sourceRecords: binding("artifacts/github-wave-3/source-records.jsonl") }, outputs: { securityLedger: binding("artifacts/github-wave-3/skill-security-ledger.jsonl"), bodyStructures: binding("artifacts/github-wave-3/body-structures.jsonl") } }));
  return root;
}

test("v2 infusion binds both waves and folds cross-wave bodies deterministically", async () => {
  const root = await infusionFixture();
  const first = await buildQuarryInfusionV2Evidence({ root, write: true });
  const second = await buildQuarryInfusionV2Evidence({ root, write: false });
  assert.deepEqual(second.receipt, first.receipt);
  assert.deepEqual(first.coverage, {
    sourceCount: 3,
    canonicalBodyCount: 2,
    canonicalFacetCount: 2,
    canonicalRejectedCount: 0,
    exactDuplicateCount: 1,
    unresolvedSourceCount: 0,
  });
  assert.equal(first.receipt.waveEvidence.wave2.status, "certified");
  assert.equal(first.receipt.waveEvidence.wave3.status, "verified");
  for (const artifact of Object.values(first.receipt.outputs)) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
});
