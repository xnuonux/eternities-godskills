import assert from "node:assert/strict";
import test from "node:test";

import { buildFamilyCompletion } from "../src/family-completion.mjs";

const families = [
  "agency-client-services", "agent-orchestration", "architecture-specification",
  "audio-voice-media", "automation-mcp-integrations", "data-infrastructure",
  "debugging-recovery", "game-design-development", "general", "governance-security",
  "implementation-engineering", "knowledge-memory-context", "marketing-growth",
  "product-operations", "release-publishing", "repository-source-research",
  "social-media-community", "verification-evidence", "visual-3d-motion",
  "web-interface-accessibility", "writing-narrative-canon",
];

function fixture({ candidate = true, deferred = false } = {}) {
  const queue = { schemaVersion: 1, familyId: "agent-orchestration", sourceCount: 2, cards: [
    { sourceId: "s1", evidence: { cardReviewed: true } },
    { sourceId: "s2", evidence: { cardReviewed: true } },
  ] };
  const reviews = [
    { familyId: "agent-orchestration", sourceId: "s1", reviewDigest: "r1", disposition: "candidate" },
    { familyId: "agent-orchestration", sourceId: "s2", reviewDigest: "r2", disposition: "candidate" },
  ];
  const clusters = [
    { familyId: "agent-orchestration", id: "c1", clusterDigest: "d1", synthesisDecision: candidate ? "candidate" : "rejected", members: [{ sourceId: "s1", reviewDigest: "r1" }] },
    { familyId: "agent-orchestration", id: "c2", clusterDigest: "d2", synthesisDecision: deferred ? "deferred" : "rejected", members: [{ sourceId: "s2", reviewDigest: "r2" }] },
  ];
  return {
    owners: families.map((familyId) => ({ familyId, sourceCount: familyId === "agent-orchestration" ? 2 : 0 })),
    queues: [queue], reviews, clusters,
    syntheses: candidate ? [{ familyId: "agent-orchestration", candidateId: "s-agent", status: "promoted", clusters: [{ id: "c1", digest: "d1" }], sourceIds: ["s1"] }] : [],
    historicalCertified: ["agency-client-services", "game-design-development", "marketing-growth", "social-media-community"],
  };
}

test("builds all 21 family decisions with exact counts and terminal cluster accounting", () => {
  const result = buildFamilyCompletion(fixture({ deferred: true }));
  assert.deepEqual(result.families.map(({ familyId }) => familyId), families);
  const orchestration = result.families.find(({ familyId }) => familyId === "agent-orchestration");
  assert.equal(orchestration.status, "certified");
  assert.equal(orchestration.proof.sourceCount, 2);
});

test("rejects duplicate, unknown, and stale synthesis cluster mappings", () => {
  const input = fixture();
  input.syntheses[0].clusters = [{ id: "c1", digest: "wrong" }, { id: "c1", digest: "d1" }, { id: "unknown", digest: "d" }];
  assert.throws(() => buildFamilyCompletion(input), /stale|duplicate|unknown/);
});

test("marks a family with no candidate clusters deferred and emits deterministic receipts", () => {
  const input = fixture({ candidate: false });
  const result = buildFamilyCompletion(input);
  const family = result.families.find(({ familyId }) => familyId === "agent-orchestration");
  assert.equal(family.status, "deferred");
  assert.equal(family.decision, "no-candidate");
  assert.equal(family.gates.externalActivation, false);
  assert.equal(JSON.stringify(result), JSON.stringify(buildFamilyCompletion(input)));
});

test("accepts the certified second-order plan object shape", () => {
  const input = fixture();
  input.syntheses = [];
  input.secondOrderPlan = {
    adjudication: {
      decisions: {
        deferred: [{ familyId: "agent-orchestration", clusterId: "c1", decision: "deferred", reason: "bounded evidence remains insufficient" }],
      },
    },
  };
  const result = buildFamilyCompletion(input);
  const family = result.families.find(({ familyId }) => familyId === "agent-orchestration");
  assert.equal(family.clusters.candidate[0].decision, "second-order-deferred");
});
