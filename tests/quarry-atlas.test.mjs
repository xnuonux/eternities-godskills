import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadQuarryAtlas, searchQuarryAtlas } from "../src/quarry-atlas.mjs";
import { sha256 } from "../src/io.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "quarry-atlas-"));
  await mkdir(path.join(root, "artifacts/quarry-infusion"), { recursive: true });
  await mkdir(path.join(root, "receipts"), { recursive: true });
  const facets = [
    { id: "facet-api", bodySha256: "a".repeat(64), canonicalSourceId: "source-api", repository: "repo/api", sourcePath: "skills/api/SKILL.md", licenseSignals: ["MIT"], name: "api contracts", summary: "design stable service interfaces", headings: ["versioning"], familyIds: ["implementation-engineering"], primaryFamily: "implementation-engineering", targetSkillId: "eternities-daedalus", evidenceMode: "inert-pattern-reference", security: { dispositions: ["manual-review-required"], requiredReviews: ["semantic"], surfaces: ["network"], ruleIds: ["SENSITIVE-CAPABILITY"], semanticReviewComplete: false, sourceExecutionAuthorized: false } },
    { id: "facet-story", bodySha256: "b".repeat(64), canonicalSourceId: "source-story", repository: "repo/story", sourcePath: "skills/story/SKILL.md", licenseSignals: ["MIT"], name: "narrative revision", summary: "edit compelling long form stories", headings: ["character arcs"], familyIds: ["writing-narrative-canon"], primaryFamily: "writing-narrative-canon", targetSkillId: "eternities-logos", evidenceMode: "inert-pattern-reference", security: { dispositions: ["clear-for-semantic-review"], requiredReviews: ["semantic"], surfaces: [], ruleIds: [], semanticReviewComplete: false, sourceExecutionAuthorized: false } },
  ];
  const text = `${facets.map(JSON.stringify).join("\n")}\n`;
  const facetPath = "artifacts/quarry-infusion/facets.jsonl";
  await writeFile(path.join(root, facetPath), text);
  await writeFile(path.join(root, "receipts/quarry-total-infusion-v1.json"), `${JSON.stringify({ status: "certified", outputs: { facets: { path: facetPath, sha256: sha256(text), bytes: Buffer.byteLength(text) } } }, null, 2)}\n`);
  return root;
}

test("verified cold atlas retrieves direct and paraphrased specialist intents", async () => {
  const atlas = await loadQuarryAtlas(await fixture());
  assert.equal(searchQuarryAtlas(atlas, { query: "stable API versioning", limit: 1 })[0].id, "facet-api");
  assert.equal(searchQuarryAtlas(atlas, { query: "improve the plot and character arc", family: "writing-narrative-canon", limit: 2 })[0].id, "facet-story");
});

test("atlas enforces bounded compact results and family filters", async () => {
  const atlas = await loadQuarryAtlas(await fixture());
  const results = searchQuarryAtlas(atlas, { query: "design", family: "implementation-engineering", limit: 5 });
  assert.equal(results.length, 1);
  assert.deepEqual(Object.keys(results[0]).sort(), ["bodySha256", "familyIds", "id", "primaryFamily", "provenance", "risk", "score", "targetSkillId", "untrustedMetadata"]);
  assert.equal(results[0].untrustedMetadata.trust, "untrusted-inert-source-metadata");
  assert.equal(results[0].risk.sourceExecutionAuthorized, false);
  assert.equal(results[0].risk.semanticReviewComplete, false);
  assert.equal(results[0].provenance.canonicalSourceId, "source-api");
  assert.throws(() => searchQuarryAtlas(atlas, { query: "api", limit: 6 }), /limit/);
  assert.throws(() => searchQuarryAtlas(atlas, { query: "api", unknown: true }), /unknown option/);
});

test("atlas rejects tampered and activation-capable facets", async () => {
  const root = await fixture();
  const facetPath = path.join(root, "artifacts/quarry-infusion/facets.jsonl");
  await writeFile(facetPath, `${await readFile(facetPath, "utf8")}tamper`);
  await assert.rejects(loadQuarryAtlas(root), /digest mismatch/);

  const unsafeRoot = await fixture();
  const unsafePath = path.join(unsafeRoot, "artifacts/quarry-infusion/facets.jsonl");
  const unsafe = JSON.parse((await readFile(unsafePath, "utf8")).split("\n")[0]);
  unsafe.security.sourceExecutionAuthorized = true;
  const text = `${JSON.stringify(unsafe)}\n`;
  await writeFile(unsafePath, text);
  const receiptPath = path.join(unsafeRoot, "receipts/quarry-total-infusion-v1.json");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  receipt.outputs.facets = { path: receipt.outputs.facets.path, sha256: sha256(text), bytes: Buffer.byteLength(text) };
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await assert.rejects(loadQuarryAtlas(unsafeRoot), /activation-capable/);
});
