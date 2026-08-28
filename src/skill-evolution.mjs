import { sha256 } from "./io.mjs";
import { decidePromotion } from "./promote.mjs";
import { validateEvaluation } from "./schema.mjs";

const HEX_64 = /^[0-9a-f]{64}$/;
const IDENTIFIER = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ALLOWED_EDIT_OPERATIONS = new Set(["append-boundary", "append-case", "replace-section"]);

function ordinal(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.keys(value).sort(ordinal).map((key) => [key, stable(value[key])]));
  return value;
}
function hashRecord(value) { return sha256(JSON.stringify(stable(value)) ?? String(value)); }
function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}
function identifier(value, label) {
  value = nonEmpty(value, label);
  if (!IDENTIFIER.test(value)) throw new Error(`${label} must be a bounded lowercase identifier`);
  return value;
}
function digest(value, label) {
  if (typeof value !== "string" || !HEX_64.test(value)) throw new Error(`${label} must be a lowercase SHA-256 digest`);
  return value;
}
function sortedUnique(values) { return [...new Set(values)].sort(ordinal); }
function verifySelfDigest(record, field, label) {
  const claimed = digest(record?.[field], `${label}.${field}`);
  const unsigned = { ...record };
  delete unsigned[field];
  if (hashRecord(unsigned) !== claimed) throw new Error(`${label} digest does not match its content`);
  return record;
}

export function createDevelopmentManifest(traces, { reviewAuthority, reviewLedgerDigest }) {
  if (!Array.isArray(traces) || traces.length === 0) throw new Error("trace records must be a non-empty array");
  reviewAuthority = identifier(reviewAuthority, "reviewAuthority");
  reviewLedgerDigest = digest(reviewLedgerDigest, "reviewLedgerDigest");
  const ids = new Set();
  const records = traces.map((trace) => {
    const id = identifier(trace?.id, "trace.id");
    if (ids.has(id)) throw new Error(`duplicate trace id: ${id}`);
    ids.add(id);
    if (trace.partition !== "development") throw new Error(`trace ${id} must use the development partition`);
    if (trace.reviewed !== true) throw new Error(`trace ${id} must be reviewed`);
    const targetSkillId = identifier(trace.targetSkillId, `trace ${id}.targetSkillId`);
    const evidenceDigest = digest(trace.evidenceDigest, `trace ${id}.evidenceDigest`);
    if (!Array.isArray(trace.failureCodes) || trace.failureCodes.length === 0) throw new Error(`trace ${id}.failureCodes must be a non-empty array`);
    const failureCodes = sortedUnique(trace.failureCodes.map((code) => identifier(code, `trace ${id}.failureCode`)));
    if (failureCodes.length !== trace.failureCodes.length) throw new Error(`trace ${id}.failureCodes must be unique`);
    if (typeof trace.critical !== "boolean") throw new Error(`trace ${id}.critical must be boolean`);
    return { id, partition: "development", reviewed: true, targetSkillId, evidenceDigest, failureCodes, critical: trace.critical };
  }).sort((left, right) => ordinal(left.id, right.id));
  const unsigned = { schemaVersion: 1, partition: "development", reviewAuthority, reviewLedgerDigest, records };
  return { ...unsigned, manifestDigest: hashRecord(unsigned) };
}

export function mineRecurringFailures(manifest, { minimumOccurrences = 2, maximumClusters = 32 } = {}) {
  verifySelfDigest(manifest, "manifestDigest", "development manifest");
  if (manifest.partition !== "development" || !Array.isArray(manifest.records) || manifest.records.length === 0) throw new Error("development manifest is invalid");
  if (!Number.isInteger(minimumOccurrences) || minimumOccurrences < 2) throw new Error("minimumOccurrences must be an integer of at least 2");
  if (!Number.isInteger(maximumClusters) || maximumClusters < 1 || maximumClusters > 32) throw new Error("maximumClusters must be an integer between 1 and 32");
  const byFailure = new Map();
  for (const trace of manifest.records) {
    if (trace.partition !== "development" || trace.reviewed !== true) throw new Error("development manifest contains unreviewed or non-development evidence");
    for (const failureCode of trace.failureCodes) {
      const key = `${trace.targetSkillId}\u0000${failureCode}`;
      const cluster = byFailure.get(key) ?? { targetSkillId: trace.targetSkillId, failureCode, traceIds: [], evidenceDigests: [], criticalOccurrences: 0 };
      cluster.traceIds.push(trace.id);
      cluster.evidenceDigests.push(trace.evidenceDigest);
      if (trace.critical) cluster.criticalOccurrences += 1;
      byFailure.set(key, cluster);
    }
  }
  const clusters = [...byFailure.values()]
    .filter(({ traceIds }) => traceIds.length >= minimumOccurrences)
    .map((cluster) => ({ ...cluster, occurrences: cluster.traceIds.length, traceIds: sortedUnique(cluster.traceIds), evidenceDigests: sortedUnique(cluster.evidenceDigests) }))
    .sort((left, right) => ordinal(left.targetSkillId, right.targetSkillId) || ordinal(left.failureCode, right.failureCode));
  if (clusters.length > maximumClusters) throw new Error(`recurring failure cluster count exceeds maximumClusters: ${clusters.length}`);
  const unsigned = { schemaVersion: 1, status: "mined", developmentManifestDigest: manifest.manifestDigest, reviewAuthority: manifest.reviewAuthority, reviewLedgerDigest: manifest.reviewLedgerDigest, parameters: { minimumOccurrences, maximumClusters }, clusters };
  return { ...unsigned, receiptDigest: hashRecord(unsigned) };
}

function validateMiningReceipt(receipt, developmentManifest, targetSkillId, trustedDevelopmentManifestDigest, trustedReviewLedgerDigest) {
  verifySelfDigest(developmentManifest, "manifestDigest", "development manifest");
  if (developmentManifest.manifestDigest !== trustedDevelopmentManifestDigest) throw new Error("development manifest does not match the trusted manifest digest");
  verifySelfDigest(receipt, "receiptDigest", "mining receipt");
  if (receipt.status !== "mined") throw new Error("mining receipt status must be mined");
  if (receipt.developmentManifestDigest !== trustedDevelopmentManifestDigest) throw new Error("mining receipt does not match the trusted development manifest");
  if (receipt.reviewLedgerDigest !== trustedReviewLedgerDigest) throw new Error("mining receipt does not match the trusted review ledger");
  const expected = mineRecurringFailures(developmentManifest, receipt.parameters);
  if (expected.receiptDigest !== receipt.receiptDigest) throw new Error("mining receipt does not reconcile to the trusted development manifest");
  const codes = new Set();
  for (const cluster of receipt.clusters ?? []) {
    if (cluster.targetSkillId !== targetSkillId) continue;
    if (!Number.isInteger(cluster.occurrences) || cluster.occurrences < receipt.parameters.minimumOccurrences || cluster.traceIds?.length !== cluster.occurrences || cluster.evidenceDigests?.length !== cluster.occurrences) throw new Error(`failure ${cluster.failureCode} has invalid recurrence evidence`);
    if (codes.has(cluster.failureCode)) throw new Error(`duplicate failure code: ${cluster.failureCode}`);
    codes.add(cluster.failureCode);
  }
  if (codes.size === 0) throw new Error("mining receipt contains no recurring failures for the target skill");
  return codes;
}

export function stageEvolutionProposal({ targetSkillId, baselineDigest, candidateDigest, edits, miningReceipt, developmentManifest, trustedDevelopmentManifestDigest, trustedReviewLedgerDigest, maximumEdits = 4 }) {
  targetSkillId = identifier(targetSkillId, "targetSkillId");
  baselineDigest = digest(baselineDigest, "baselineDigest");
  candidateDigest = digest(candidateDigest, "candidateDigest");
  trustedDevelopmentManifestDigest = digest(trustedDevelopmentManifestDigest, "trustedDevelopmentManifestDigest");
  trustedReviewLedgerDigest = digest(trustedReviewLedgerDigest, "trustedReviewLedgerDigest");
  if (baselineDigest === candidateDigest) throw new Error("candidateDigest must differ from baselineDigest");
  if (!Number.isInteger(maximumEdits) || maximumEdits < 1 || maximumEdits > 16) throw new Error("maximumEdits must be an integer between 1 and 16");
  if (!Array.isArray(edits) || edits.length === 0) throw new Error("edits must be a non-empty array");
  if (edits.length > maximumEdits) throw new Error("proposal exceeds its edit budget");
  const failureCodes = validateMiningReceipt(miningReceipt, developmentManifest, targetSkillId, trustedDevelopmentManifestDigest, trustedReviewLedgerDigest);
  const normalizedEdits = edits.map((edit, index) => {
    const operation = identifier(edit?.operation, `edit ${index}.operation`);
    if (!ALLOWED_EDIT_OPERATIONS.has(operation)) throw new Error(`edit ${index}.operation is not allowed`);
    const sectionId = identifier(edit.sectionId, `edit ${index}.sectionId`);
    const rationaleCode = identifier(edit.rationaleCode, `edit ${index}.rationaleCode`);
    if (!failureCodes.has(rationaleCode)) throw new Error(`edit ${index}.rationaleCode lacks recurring failure evidence`);
    return { operation, sectionId, rationaleCode };
  });
  const unsigned = { schemaVersion: 1, status: "staged", targetSkillId, baselineDigest, candidateDigest, miningReceiptDigest: miningReceipt.receiptDigest, developmentManifestDigest: trustedDevelopmentManifestDigest, reviewLedgerDigest: trustedReviewLedgerDigest, maximumEdits, edits: normalizedEdits, active: false, adopted: false, requiresExplicitAdoption: true };
  return { ...unsigned, proposalDigest: hashRecord(unsigned) };
}

export function sealHeldOutManifest(cases, { suiteId }) {
  suiteId = identifier(suiteId, "suiteId");
  if (!Array.isArray(cases) || cases.length === 0) throw new Error("held-out cases must be a non-empty array");
  const ids = new Set();
  const digests = new Set();
  const records = cases.map((item) => {
    const id = identifier(item?.id, "held-out case.id");
    if (ids.has(id)) throw new Error(`duplicate held-out case id: ${id}`);
    ids.add(id);
    if (item.partition !== "held-out") throw new Error(`case ${id} must use the held-out partition`);
    const evidenceDigest = digest(item.evidenceDigest, `case ${id}.evidenceDigest`);
    if (digests.has(evidenceDigest)) throw new Error(`duplicate held-out evidence digest: ${evidenceDigest}`);
    digests.add(evidenceDigest);
    return { id, partition: "held-out", evidenceDigest };
  }).sort((left, right) => ordinal(left.id, right.id));
  const unsigned = { schemaVersion: 1, suiteId, partition: "held-out", records };
  return { ...unsigned, manifestDigest: hashRecord(unsigned) };
}

export function auditHeldOutLeakage({ proposal, heldOutManifest }) {
  verifySelfDigest(proposal, "proposalDigest", "proposal");
  verifySelfDigest(heldOutManifest, "manifestDigest", "held-out manifest");
  const heldIds = new Set(heldOutManifest.records.map(({ id }) => id));
  const leaks = [];
  for (const edit of proposal.edits) {
    for (const value of [edit.sectionId, edit.rationaleCode]) if (heldIds.has(value)) leaks.push({ type: "held-out-id", value });
  }
  return { schemaVersion: 1, status: leaks.length === 0 ? "clear" : "leaked", proposalDigest: proposal.proposalDigest, heldOutManifestDigest: heldOutManifest.manifestDigest, heldOutCases: heldOutManifest.records.length, leaks: leaks.sort((left, right) => ordinal(`${left.type}:${left.value}`, `${right.type}:${right.value}`)), proofLimit: "manifest disjointness does not prove that an upstream constructor never observed held-out content" };
}

export function createEvaluationReceipt({ role, proposal, heldOutManifest, artifactDigest, evaluation, evaluatorId }) {
  verifySelfDigest(proposal, "proposalDigest", "proposal");
  verifySelfDigest(heldOutManifest, "manifestDigest", "held-out manifest");
  if (role !== "baseline" && role !== "candidate") throw new Error("evaluation role must be baseline or candidate");
  evaluatorId = identifier(evaluatorId, "evaluatorId");
  artifactDigest = digest(artifactDigest, "artifactDigest");
  const expectedArtifact = role === "baseline" ? proposal.baselineDigest : proposal.candidateDigest;
  if (artifactDigest !== expectedArtifact) throw new Error(`${role} artifact digest does not match the proposal`);
  const measured = { ...evaluation, improvements: [] };
  validateEvaluation(measured);
  const evaluationDigest = hashRecord(measured);
  const unsigned = { schemaVersion: 1, role, evaluatorId, proposalDigest: proposal.proposalDigest, targetSkillId: proposal.targetSkillId, artifactDigest, baselineSkillDigest: proposal.baselineDigest, candidateSkillDigest: proposal.candidateDigest, heldOutManifestDigest: heldOutManifest.manifestDigest, evaluation: measured, evaluationDigest };
  return { ...unsigned, receiptDigest: hashRecord(unsigned) };
}

function verifyEvaluationReceipt(receipt, role, proposal, heldOutManifestDigest) {
  verifySelfDigest(receipt, "receiptDigest", `${role} evaluation receipt`);
  if (receipt.role !== role || receipt.proposalDigest !== proposal.proposalDigest || receipt.targetSkillId !== proposal.targetSkillId || receipt.heldOutManifestDigest !== heldOutManifestDigest) throw new Error(`${role} evaluation receipt binding mismatch`);
  const expectedArtifact = role === "baseline" ? proposal.baselineDigest : proposal.candidateDigest;
  if (receipt.artifactDigest !== expectedArtifact || receipt.baselineSkillDigest !== proposal.baselineDigest || receipt.candidateSkillDigest !== proposal.candidateDigest) throw new Error(`${role} evaluation artifact binding mismatch`);
  if (hashRecord(receipt.evaluation) !== receipt.evaluationDigest) throw new Error(`${role} evaluation digest mismatch`);
  validateEvaluation(receipt.evaluation);
}

export function decideEvolutionAdoption({ proposal, baselineReceipt, candidateReceipt, policy, leakageAudit }) {
  const failedGates = [];
  try { verifySelfDigest(proposal, "proposalDigest", "proposal"); } catch { failedGates.push("proposal-binding"); }
  if (proposal?.status !== "staged" || proposal?.active !== false || proposal?.adopted !== false) failedGates.push("inactive-staged-proposal");
  if (leakageAudit?.status !== "clear") failedGates.push("held-out-leakage");
  if (leakageAudit?.proposalDigest !== proposal?.proposalDigest) failedGates.push("leakage-audit-binding");
  const heldOutManifestDigest = leakageAudit?.heldOutManifestDigest;
  try { verifyEvaluationReceipt(baselineReceipt, "baseline", proposal, heldOutManifestDigest); } catch { failedGates.push("baseline-receipt-binding"); }
  try { verifyEvaluationReceipt(candidateReceipt, "candidate", proposal, heldOutManifestDigest); } catch { failedGates.push("candidate-receipt-binding"); }
  if (failedGates.length > 0) {
    const unique = sortedUnique(failedGates);
    return { schemaVersion: 1, status: "blocked", adopted: false, requiresExplicitAdoption: true, failedGates: unique, improvements: [], reasons: unique.map((gate) => `evolution gate failed: ${gate}`) };
  }
  const baseline = { ...baselineReceipt.evaluation, improvements: [] };
  const candidate = { ...candidateReceipt.evaluation, improvements: [] };
  const promotion = decidePromotion({ baseline, candidate, policy });
  return { ...promotion, status: promotion.status === "promoted" ? "eligible" : promotion.status, adopted: false, requiresExplicitAdoption: true, evidence: { proposalDigest: proposal.proposalDigest, heldOutManifestDigest, baselineReceiptDigest: baselineReceipt.receiptDigest, candidateReceiptDigest: candidateReceipt.receiptDigest } };
}
