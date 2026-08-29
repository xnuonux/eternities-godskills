import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildQuarryInfusionEvidence } from "../scripts/build-quarry-infusion.mjs";
import { sha256 } from "../src/io.mjs";

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const jsonl = (rows) => `${rows.map(JSON.stringify).join("\n")}\n`;

async function fixtureRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "quarry-infusion-"));
  for (const directory of ["artifacts/github-wave-2", "artifacts/quarry-infusion", "data", "receipts"]) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  const digest = "a".repeat(64);
  await writeFile(path.join(root, "artifacts/github-wave-2/source-records.jsonl"), jsonl([
    { id: "source-a", repository: "repo/a", sourcePath: "skills/api/SKILL.md", bodySha256: digest, bodyBytes: 10, licenseSignal: "MIT", inert: true },
    { id: "source-b", repository: "repo/b", sourcePath: "copy/api/SKILL.md", bodySha256: digest, bodyBytes: 10, licenseSignal: "MIT", inert: true },
  ]));
  await writeFile(path.join(root, "artifacts/github-wave-2/skill-security-ledger.jsonl"), jsonl([
    { id: "source-a", bodySha256: digest, disposition: "clear-for-semantic-review", requiredReview: "semantic", surfaces: [], findings: [] },
    { id: "source-b", bodySha256: digest, disposition: "manual-review-required", requiredReview: "semantic", surfaces: ["network"], findings: [{ ruleId: "SENSITIVE-CAPABILITY" }] },
  ]));
  await writeFile(path.join(root, "artifacts/quarry-infusion/body-structures.jsonl"), jsonl([
    { bodySha256: digest, structure: { frontmatterName: "api designer", frontmatterDescription: "design stable APIs", headings: ["contracts"] } },
  ]));
  await writeFile(path.join(root, "data/ontology.v1.json"), json({ schemaVersion: 1, families: [{ id: "implementation-engineering", keywords: ["api"] }] }));
  await writeFile(path.join(root, "data/quarry-family-targets.v1.json"), json({ schemaVersion: 1, defaultFamily: "general", targets: { "implementation-engineering": "eternities-daedalus", general: "sovereign-skill-refinery" } }));
  return root;
}

test("infusion certification writes deterministic exact artifacts", async () => {
  const root = await fixtureRoot();
  const first = await buildQuarryInfusionEvidence({ root, write: true });
  const second = await buildQuarryInfusionEvidence({ root, write: false });
  assert.deepEqual(second.receipt, first.receipt);
  assert.equal(first.receipt.status, "certified");
  assert.deepEqual(first.receipt.counts, {
    sourceCount: 2,
    canonicalBodyCount: 1,
    canonicalFacetCount: 1,
    canonicalRejectedCount: 0,
    exactDuplicateCount: 1,
    unresolvedSourceCount: 0,
  });
  for (const artifact of Object.values(first.receipt.outputs)) {
    assert.equal(artifact.sha256, sha256(await readFile(path.join(root, artifact.path))), artifact.path);
  }
});

test("infusion certification rejects stale body-structure coverage", async () => {
  const root = await fixtureRoot();
  await writeFile(path.join(root, "artifacts/quarry-infusion/body-structures.jsonl"), "");
  await assert.rejects(buildQuarryInfusionEvidence({ root, write: false }), /body structure coverage/);
});
