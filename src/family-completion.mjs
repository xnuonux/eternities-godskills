import { createHash } from "node:crypto";

export const FAMILY_IDS = [
  "agency-client-services", "agent-orchestration", "architecture-specification",
  "audio-voice-media", "automation-mcp-integrations", "data-infrastructure",
  "debugging-recovery", "game-design-development", "general", "governance-security",
  "implementation-engineering", "knowledge-memory-context", "marketing-growth",
  "product-operations", "release-publishing", "repository-source-research",
  "social-media-community", "verification-evidence", "visual-3d-motion",
  "web-interface-accessibility", "writing-narrative-canon",
];
const HISTORICAL = new Set(["agency-client-services", "game-design-development", "marketing-growth", "social-media-community"]);
const GATES = { externalActivation: false, profileMutation: false, publication: false, deployment: false, push: false, accountMutation: false, spending: false };

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function digest(value) { return createHash("sha256").update(stable(value)).digest("hex"); }
function fail(message) { throw new Error(`family completion: ${message}`); }
function byFamily(rows, familyId) { return rows.filter((row) => row.familyId === familyId); }

export function buildFamilyCompletion({ owners = [], queues = [], reviews = [], clusters = [], syntheses = [], secondOrderPlan = null, historicalCertified = [] } = {}) {
  const ownerByFamily = new Map(owners.map((row) => [row.familyId, row]));
  const queueByFamily = new Map(queues.map((row) => [row.familyId, row]));
  const historical = new Set([...HISTORICAL, ...historicalCertified]);
  const families = FAMILY_IDS.map((familyId) => {
    const owner = ownerByFamily.get(familyId) ?? { sourceCount: 0 };
    const queue = queueByFamily.get(familyId) ?? { sourceCount: owner.sourceCount ?? 0, cards: [] };
    const familyReviews = byFamily(reviews, familyId);
    const familyClusters = byFamily(clusters, familyId);
    const familySyntheses = byFamily(syntheses, familyId).filter((synthesis) => synthesis.status === "promoted");
    const sourceIds = (queue.cards ?? []).map((card) => card.sourceId).sort();
    if ((queue.sourceCount ?? sourceIds.length) !== sourceIds.length) fail(`queue source count mismatch: ${familyId}`);
    if (new Set(sourceIds).size !== sourceIds.length) fail(`duplicate queue source: ${familyId}`);
    const reviewBySource = new Map();
    for (const review of familyReviews) {
      if (reviewBySource.has(review.sourceId)) fail(`duplicate review: ${review.sourceId}`);
      reviewBySource.set(review.sourceId, review);
    }
    if (familyReviews.length !== sourceIds.length && sourceIds.length > 0) fail(`review count mismatch: ${familyId}`);
    const candidates = familyClusters.filter((cluster) => cluster.synthesisDecision === "candidate");
    const mapped = new Map();
    for (const synthesis of familySyntheses) {
      const declared = synthesis.clusters ?? (synthesis.clusterIds ?? []).map((id) => ({ id }));
      for (const entry of declared) {
        const id = entry.id ?? entry.clusterId;
        if (mapped.has(id)) fail(`duplicate cluster mapping: ${id}`);
        const cluster = familyClusters.find((row) => row.id === id);
        if (!cluster) fail(`unknown cluster mapping: ${id}`);
        if (entry.digest && entry.digest !== cluster.clusterDigest) fail(`stale cluster mapping: ${id}`);
        if (cluster.synthesisDecision !== "candidate") fail(`non-candidate cluster mapped: ${id}`);
        mapped.set(id, { decision: "promoted", synthesisId: synthesis.candidateId });
      }
    }
    const planEntries = secondOrderPlan?.adjudication?.decisions ?? secondOrderPlan?.decisions ?? [];
    for (const entry of planEntries.filter((row) => row.familyId === familyId && row.decision === "deferred")) {
      if (mapped.has(entry.clusterId)) fail(`duplicate cluster mapping: ${entry.clusterId}`);
      const cluster = familyClusters.find((row) => row.id === entry.clusterId);
      if (!cluster) fail(`unknown cluster mapping: ${entry.clusterId}`);
      if (cluster.synthesisDecision !== "candidate") fail(`only candidates may be second-order deferred: ${entry.clusterId}`);
      mapped.set(entry.clusterId, { decision: "second-order-deferred", reason: entry.reason ?? "explicit second-order decision" });
    }
    for (const cluster of candidates) if (!mapped.has(cluster.id)) fail(`unresolved candidate cluster: ${cluster.id}`);
    const terminal = familyClusters.filter((cluster) => cluster.synthesisDecision !== "candidate").map((cluster) => ({ id: cluster.id, decision: cluster.synthesisDecision, sourceCount: cluster.members?.length ?? 0 }));
    for (const cluster of familyClusters) for (const member of cluster.members ?? []) {
      const review = reviewBySource.get(member.sourceId);
      if (!review) fail(`missing review for cluster member: ${member.sourceId}`);
      if (review.reviewDigest !== member.reviewDigest) fail(`stale review digest: ${member.sourceId}`);
    }
    const candidateDecisions = candidates.map((cluster) => ({ id: cluster.id, decision: mapped.get(cluster.id).decision, synthesisId: mapped.get(cluster.id).synthesisId ?? null, sourceCount: cluster.members?.length ?? 0 }));
    const status = historical.has(familyId) ? "certified" : candidates.length === 0 ? "deferred" : "certified";
    return {
      schemaVersion: 1, familyId, status, decision: candidates.length === 0 ? "no-candidate" : "terminal",
      proof: { sourceCount: queue.sourceCount ?? owner.sourceCount ?? sourceIds.length, reviewCount: familyReviews.length, clusterCount: familyClusters.length, candidateClusterCount: candidates.length, promotedSynthesisCount: familySyntheses.length },
      sourceCounts: { candidate: candidates.reduce((n, c) => n + (c.members?.length ?? 0), 0), deferred: familyClusters.filter((c) => c.synthesisDecision === "deferred").reduce((n, c) => n + (c.members?.length ?? 0), 0), rejected: familyClusters.filter((c) => c.synthesisDecision === "rejected").reduce((n, c) => n + (c.members?.length ?? 0), 0) },
      clusters: { candidate: candidateDecisions, terminal },
      digests: { queue: digest(queue), reviews: digest(familyReviews), clusters: digest(familyClusters), syntheses: digest(familySyntheses) },
      proofLimits: ["local canonical evidence only", "no live-agent, production, or external-system behavior is proven"],
      allowedTransitions: ["candidate -> promoted", "candidate -> second-order-deferred", "deferred -> terminal", "rejected -> terminal"],
      gates: { ...GATES },
    };
  });
  return { schemaVersion: 1, familyCount: families.length, families };
}

export { digest, stable };
