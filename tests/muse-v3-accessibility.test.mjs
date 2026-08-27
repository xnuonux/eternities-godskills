import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { sha256 } from "../src/io.mjs";
import { validateCandidateEvidence } from "../src/refinery-candidates.mjs";

const root = new URL("../", import.meta.url);
const text = async (relative) => readFile(new URL(relative, root), "utf8");
const json = async (relative) => JSON.parse(await text(relative));

test("Muse v3 adds a bounded interface accessibility audit route without replacing v2 routes", async () => {
  const skill = await text("skills/eternities-muse/SKILL.md");
  const contract = await json("skills/eternities-muse/references/capability-contract.json");
  const card = await json("skills/eternities-muse/references/routing-card.json");
  const cases = await json("skills/eternities-muse/evals/cases.v3.json");
  assert.match(skill, /interface-accessibility-audit/);
  assert.deepEqual(contract.routes.map(({ id }) => id), ["visual-forensics", "interface-art-direction", "motion-story", "visual-acceptance", "interface-accessibility-audit"]);
  assert.ok(card.provides.includes("interface-accessibility-audit"));
  assert.equal(cases.cases.filter(({ kind }) => kind === "direct").length, 5);
  assert.ok(cases.cases.some(({ id, expected }) => id === "direct-accessibility-audit" && expected === "route:interface-accessibility-audit"));
});

test("Muse v3 accessibility route is deterministic and fail-closed at its proof boundary", async () => {
  const cases = await json("skills/eternities-muse/evals/cases.v3.json");
  const byId = new Map(cases.cases.map((entry) => [entry.id, entry]));
  for (const [id, expected] of [
    ["paraphrase-accessibility-audit", "route:interface-accessibility-audit"],
    ["context-accessibility-audit", "route:interface-accessibility-audit"],
    ["conflict-live-certification", "fail-closed:live-proof"],
    ["exclude-legal-certification", "fail-closed:legal-proof"],
    ["exclude-credential-request", "fail-closed:credentials"],
  ]) assert.equal(byId.get(id)?.expected, expected, id);
});

test("Muse v3 candidate record proves exactly the two planned clusters and four sources", async () => {
  const [receipt, synthesis] = await Promise.all([
    json("receipts/promotions/eternities-muse-v3.json"),
    json("syntheses/eternities-muse.v3.json"),
  ]);
  const row = validateCandidateEvidence(synthesis,
    (await text("artifacts/corpus/cluster-evidence.jsonl")).trim().split("\n").map(JSON.parse),
    (await text("artifacts/corpus/review-evidence.jsonl")).trim().split("\n").map(JSON.parse), receipt);
  assert.deepEqual(row.clusterIds, ["web-exact-966d4723e1643d1a", "web-exact-cfc9e1cda626ec1d"]);
  assert.equal(row.sourceIds.length, 4);
  assert.equal(receipt.evidence.artifacts.skill.sha256, sha256(await text("skills/eternities-muse/SKILL.md")));
  assert.equal(synthesis.copiedSourceProse, false);
  assert.equal(synthesis.externalMutation, false);
});
