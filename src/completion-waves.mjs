import { sha256 } from "./io.mjs";
import { buildReviewPackets } from "./review-packets.mjs";

export const TERMINAL_STATUSES = new Set([
  "pending-review",
  "reviewed",
  "clustered",
  "promoted",
  "deferred",
  "certified",
]);

export const COMPLETION_STAGES = Object.freeze([
  { stage: 1, families: ["release-publishing", "data-infrastructure", "automation-mcp-integrations", "product-operations", "writing-narrative-canon"] },
  { stage: 2, families: ["audio-voice-media", "implementation-engineering", "governance-security", "architecture-specification", "web-interface-accessibility"] },
  { stage: 3, families: ["debugging-recovery", "visual-3d-motion", "repository-source-research", "knowledge-memory-context"] },
  { stage: 4, families: ["verification-evidence", "general"] },
  { stage: 5, families: ["agent-orchestration"] },
]);

const STAGE_BY_FAMILY = new Map(
  COMPLETION_STAGES.flatMap(({ stage, families }) => families.map((familyId) => [familyId, stage])),
);

const HISTORICALLY_CERTIFIED_FAMILIES = new Set([
  "agency-client-services",
  "game-design-development",
  "marketing-growth",
  "social-media-community",
]);

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function evidenceCounts(cards) {
  const fields = ["cardReviewed", "clustered", "synthesized", "evaluated", "promoted"];
  return Object.fromEntries(fields.map((field) => [field, cards.filter(({ evidence }) => evidence[field] === true).length]));
}

export function deriveFamilyStatus(familyId, sourceCount, counts) {
  if (HISTORICALLY_CERTIFIED_FAMILIES.has(familyId)) return "certified";
  if (counts.cardReviewed !== sourceCount) return "pending-review";
  if (counts.clustered !== sourceCount) return "reviewed";
  return "clustered";
}

function assertInputs({ ownership, summary, queues }) {
  if (!Array.isArray(ownership) || ownership.length === 0) throw new Error("ownership must not be empty");
  if (!summary?.ownerQueues) throw new Error("coverage summary ownerQueues are required");
  if (!(queues instanceof Map)) throw new Error("queues must be a Map");
  const ids = ownership.map(({ sourceId }) => sourceId);
  if (new Set(ids).size !== ids.length) throw new Error("ownership source ids must be unique");
}

export function buildCompletionPlan(inputs) {
  assertInputs(inputs);
  const { ownership, summary, queues } = inputs;
  const ownerFamilies = [...new Set(ownership.map(({ ownerFamily }) => ownerFamily))].sort();
  const plannedFamilies = COMPLETION_STAGES.flatMap(({ families }) => families);
  const unfinished = new Set(
    ownership.filter(({ reviewed }) => !reviewed).map(({ ownerFamily }) => ownerFamily),
  );
  if (unfinished.size !== plannedFamilies.length || plannedFamilies.some((familyId) => !unfinished.has(familyId))) {
    throw new Error("completion stages must contain every unfinished family exactly once");
  }

  const waves = plannedFamilies.map((familyId) => {
    const queue = queues.get(familyId);
    if (!queue || queue.familyId !== familyId) throw new Error(`missing owner queue: ${familyId}`);
    const cards = queue.cards.filter(({ evidence }) => evidence.cardReviewed !== true);
    if (cards.length !== queue.cards.length) throw new Error(`unfinished owner queue contains reviewed cards: ${familyId}`);
    const packets = buildReviewPackets({ ...queue, sourceCount: cards.length, cards }).map((packet) => ({
      packetId: packet.packetId,
      sequence: packet.sequence,
      path: `artifacts/corpus/owners/${familyId}/packets/${String(packet.sequence).padStart(3, "0")}.json`,
      sha256: sha256(canonicalJson(packet)),
      sourceCount: packet.sourceCount,
      sourceIds: packet.cards.map(({ sourceId }) => sourceId),
      dependencies: [],
    }));
    return {
      schemaVersion: 1,
      waveId: `completion-${familyId}`,
      stage: STAGE_BY_FAMILY.get(familyId),
      familyId,
      sourceCount: queue.sourceCount,
      reviewedSourceCount: 0,
      remainingSourceCount: cards.length,
      packetCount: packets.length,
      queuePath: `artifacts/corpus/owners/${familyId}/queue.json`,
      queueSha256: sha256(canonicalJson(queue)),
      packets,
      parallelism: "packets-are-disjoint-and-dependency-free-within-family",
      allowedNextTransition: "reviewed",
    };
  });

  const familyReceipts = ownerFamilies.map((familyId) => {
    const queue = queues.get(familyId);
    if (!queue) throw new Error(`missing owner queue: ${familyId}`);
    const counts = evidenceCounts(queue.cards);
    const status = deriveFamilyStatus(familyId, queue.sourceCount, counts);
    if (!TERMINAL_STATUSES.has(status)) throw new Error(`unknown family status: ${status}`);
    const packetDigests = buildReviewPackets(queue).map((packet) => ({
      path: `artifacts/corpus/owners/${familyId}/packets/${String(packet.sequence).padStart(3, "0")}.json`,
      sha256: sha256(canonicalJson(packet)),
    }));
    return {
      schemaVersion: 1,
      familyId,
      status,
      stage: STAGE_BY_FAMILY.get(familyId) ?? null,
      sourceCount: queue.sourceCount,
      evidenceCounts: counts,
      queue: {
        path: `artifacts/corpus/owners/${familyId}/queue.json`,
        sha256: sha256(canonicalJson(queue)),
      },
      packets: packetDigests,
      promotionClaims: 0,
      allowedNextTransition: status === "certified" ? null : status === "pending-review" ? "reviewed" : status === "reviewed" ? "clustered" : "promoted-or-deferred",
      gates: {
        externalActivation: false,
        profileMutation: false,
        publication: false,
        deployment: false,
        push: false,
        accountMutation: false,
        spending: false,
      },
      proofLimit: status === "certified"
        ? "historical local certification only; live-agent and production performance remain unproven"
        : "semantic review, clustering, synthesis, evaluation, and promotion remain pending",
    };
  });

  const remainingSourceCount = waves.reduce((sum, wave) => sum + wave.remainingSourceCount, 0);
  const packetCount = waves.reduce((sum, wave) => sum + wave.packetCount, 0);
  if (remainingSourceCount !== summary.ownership.unreviewed) throw new Error("remaining source count drift");
  return {
    schemaVersion: 1,
    id: "full-corpus-wave-plan-v1",
    ownershipPath: "artifacts/corpus/ownership.jsonl",
    ownershipSha256: summary.artifactDigests.ownershipSha256,
    sourceCount: ownership.length,
    reviewedSourceCount: ownership.length - remainingSourceCount,
    remainingSourceCount,
    packetCount,
    stages: COMPLETION_STAGES,
    waves,
    familyReceipts,
    externalActionsAuthorized: false,
  };
}
