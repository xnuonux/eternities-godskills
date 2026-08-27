import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const json = async (name) => JSON.parse(await readFile(new URL(name, root), "utf8"));

test("Forge v2 synthesis is strict schema 1 evidence for both approved groups", async () => {
  const plan = await json("data/second-order-promotion-plan.v1.json");
  const groups = plan.adjudication.groups.filter(({ targetSkillId }) => targetSkillId === "eternities-forge");
  assert.deepEqual(groups.map(({ groupId }) => groupId), ["verification-gates-and-review", "portable-agent-workflow-planning"]);
  assert.equal(groups.reduce((n, group) => n + group.clusters.length, 0), 14);
  assert.equal(new Set(groups.flatMap(({ sourceUnion }) => sourceUnion.map(({ sourceId }) => sourceId))).size, 28);

  for (const [file, familyId, count] of [["syntheses/eternities-forge-verification.v2.json", "verification-evidence", 8], ["syntheses/eternities-forge-orchestration.v2.json", "agent-orchestration", 6]]) {
    const synthesis = await json(file);
    assert.equal(synthesis.schemaVersion, 1);
    assert.equal(synthesis.candidateId, "eternities-forge");
    assert.equal(synthesis.familyId, familyId);
    assert.equal(synthesis.synthesisMethod, "independent-cluster-synthesis-v1");
    assert.equal(synthesis.copiedSourceProse, false);
    assert.equal(synthesis.externalMutation, false);
    assert.equal(synthesis.clusters.length, count);
    assert.equal(synthesis.sourceIds.length, familyId === "verification-evidence" ? 16 : 12);
    assert.equal(new Set(synthesis.sourceIds).size, synthesis.sourceIds.length);
    for (const artifact of Object.values(synthesis.artifacts)) {
      assert.match(artifact.path, /^[^\\/].*(?<![.])$/);
      assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
    }
  }
});

test("Forge v2 exposes bounded agent-neutral routes and fail-closed gates", async () => {
  const skill = await readFile(new URL("skills/eternities-forge/SKILL.md", root), "utf8");
  const contract = await json("skills/eternities-forge/references/capability-contract.json");
  const cases = await json("skills/eternities-forge/evals/cases.json");
  assert.match(skill, /portable workflow extensions/i);
  assert.match(skill, /fail closed/i);
  const route = contract.routes.find(({ id }) => id === "portable-workflow");
  assert.deepEqual(route.failClosedOn, ["ambiguous-authority", "conflict", "stale-evidence", "failed-critical-gate", "missing-precondition"]);
  assert.equal(route.maxComposedCapabilities, 3);
  assert.deepEqual(cases.cases.slice(-4).map(({ expected }) => expected), ["route:portable-workflow", "route:portable-workflow", "fail-closed", "defer:finishing-a-development-branch"]);
});
