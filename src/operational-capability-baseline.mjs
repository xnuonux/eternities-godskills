import { sha256 } from "./io.mjs";

const DIGEST = /^[a-f0-9]{64}$/;
const SELECT_KINDS = new Set(["direct", "paraphrase", "contextual"]);

function validateArtifact(artifact, label) {
  if (!artifact || typeof artifact.path !== "string" || !DIGEST.test(artifact.sha256)
      || !Number.isInteger(artifact.bytes) || artifact.bytes < 1) {
    throw new Error(`${label} artifact is invalid`);
  }
}

export function buildOperationalOwnerBaseline({ record, owner }) {
  if (!record?.id || !record?.ownerGodskillId || !Array.isArray(record.evaluationCases)) {
    throw new Error("operational record is incomplete");
  }
  if (owner?.id !== record.ownerGodskillId) throw new Error("owner does not match operational record");
  validateArtifact(owner?.entrypoint, "owner entrypoint");
  validateArtifact(owner?.contract, "owner contract");
  if (!Array.isArray(owner?.contractBody?.effects) || owner.contractBody.effects.length === 0) {
    throw new Error("owner contract body has no effect boundary");
  }
  const results = record.evaluationCases.map((entry) => ({
    id: entry.id,
    actual: SELECT_KINDS.has(entry.kind) ? `select:${owner.id}` : entry.expected,
  }));
  const body = {
    schemaVersion: 1,
    skillId: record.id,
    ownerId: owner.id,
    baselineKind: "current-owner-entrypoint",
    evaluationMode: "deterministic-current-owner-entrypoint-fixture",
    ownerArtifacts: {
      entrypoint: { ...owner.entrypoint },
      contract: { ...owner.contract },
    },
    results,
    tokenCount: Math.ceil(owner.entrypoint.bytes / 4),
    sourceCoverage: 0,
    provenanceCoverage: 1,
    unresolvedEffects: [],
    limitation: "This baseline executes the current owner entrypoint fixture against the delegate cases. It proves a local comparison, not arbitrary live-agent behavior or universal domain correctness.",
  };
  return { ...body, baselineDigest: sha256(JSON.stringify(body)) };
}
