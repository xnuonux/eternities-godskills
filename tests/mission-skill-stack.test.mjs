import assert from "node:assert/strict";
import test from "node:test";

import { compileMissionSkillStack, diffMissionSkillStacks } from "../src/mission-skill-stack.mjs";
import { routeCapabilities } from "../src/router.mjs";

function fixtures(overrides = {}) {
  const card = {
    schemaVersion: 1,
    id: "eternities-aegis",
    family: "governance-security",
    intent: "reconcile authorization and security evidence",
    successCondition: "findings and authority are evidenced",
    provides: ["authorization", "findings"],
    requires: [],
    intentExamples: { direct: ["audit this authorized system"], paraphrased: ["find security risks"], contextual: ["authority needs review"] },
    negativeIntents: ["unauthorized intrusion"],
    effects: ["local-read"],
    riskClass: "high",
    authorityRequirements: ["authorized-security-scope", "local-read"],
    preconditions: ["authorized-target"],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 800,
    dependencyCost: 2,
    evidenceConfidence: "verified",
    entrypoint: "skills/eternities-aegis/SKILL.md",
    legacyAliases: [],
  };
  const requestEnvelope = {
    schemaVersion: 1,
    requestId: "mission-security-audit",
    outcome: "audit an authorized local agent workflow",
    candidateFamilies: ["governance-security"],
    requiredCapabilities: ["authorization", "findings"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read"],
    availableAuthority: ["authorized-security-scope", "local-read"],
    availablePreconditions: ["authorized-target"],
    maximumRisk: "high",
    minimumEvidenceConfidence: "verified",
    contextBudget: 1200,
    maxCompositionSize: 1,
    unresolvedDecisions: [],
  };
  const routeReceipt = routeCapabilities({ envelope: requestEnvelope, cards: [card] });
  return {
    missionId: "mission-security-audit",
    projectFingerprint: "a".repeat(64),
    requestEnvelope,
    routeReceipt,
    cards: [card],
    entrypointDigests: { "eternities-aegis": "b".repeat(64) },
    ...overrides,
  };
}

test("mission stack binds only selected exact contracts and preserves authority", () => {
  const receipt = compileMissionSkillStack(fixtures());
  assert.deepEqual(receipt.selectedIds, ["eternities-aegis"]);
  assert.equal(receipt.permittedEffects.includes("external-write"), false);
  assert.deepEqual(receipt.selectedEffects, ["local-read"]);
  assert.deepEqual(receipt.availableAuthority, ["authorized-security-scope", "local-read"]);
  assert.match(receipt.stackDigest, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(receipt).includes("sourceBody"), false);
  assert.equal(receipt.selected[0].entrypointSha256, "b".repeat(64));
});

test("mission stack rejects a forged route and stale entrypoint digest", () => {
  const forged = fixtures();
  forged.routeReceipt = { ...forged.routeReceipt, requestDigest: "f".repeat(64) };
  assert.throws(() => compileMissionSkillStack(forged), /route receipt mismatch/);
  assert.throws(() => compileMissionSkillStack(fixtures({ entrypointDigests: { "eternities-aegis": "stale" } })), /entrypoint digest/);
});

test("mission stack bytes and diffs are deterministic and bounded", () => {
  const first = compileMissionSkillStack(fixtures());
  const second = compileMissionSkillStack(fixtures());
  assert.deepEqual(second, first);
  const changed = { ...first, selectedEffects: ["external-read", "local-read"], stackDigest: "c".repeat(64) };
  assert.deepEqual(diffMissionSkillStacks(first, changed), {
    changed: true,
    fields: [{ field: "selectedEffects", previous: ["local-read"], current: ["external-read", "local-read"] }],
  });
});
