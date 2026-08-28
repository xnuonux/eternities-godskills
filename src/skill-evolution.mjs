import { decidePromotion } from "./promote.mjs";
import { sha256 } from "./io.mjs";

const HEX_64 = /^[0-9a-f]{64}$/;
const ALLOWED_EDIT_OPERATIONS = new Set([
  "append-case",
  "append-boundary",
  "replace-section",
]);

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function digest(value, label) {
  if (typeof value !== "string" || !HEX_64.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function recordDigest(value) {
  return sha256(JSON.stringify(stableValue(value)) ?? String(value));
}

export function mineRecurringFailures(traces, { minimumOccurrences = 2, maximumClusters = 32 } = {}) {
  if (!Array.isArray(traces) || traces.length === 0) {
    throw new Error("trace records must be a non-empty array");
  }
  if (!Number.isInteger(minimumOccurrences) || minimumOccurrences < 2) {
    throw new Error("minimumOccurrences must be an integer of at least 2");
  }
  if (!Number.isInteger(maximumClusters) || maximumClusters < 1 || maximumClusters > 32) {
    throw new Error("maximumClusters must be an integer between 1 and 32");
  }

  const ids = new Set();
  const byFailure = new Map();
  for (const trace of traces) {
    const id = nonEmpty(trace?.id, "trace.id");
    if (ids.has(id)) throw new Error(`duplicate trace id: ${id}`);
    ids.add(id);
    if (trace.partition !== "development") {
      throw new Error(`trace ${id} must use the development partition`);
    }
    if (trace.reviewed !== true) throw new Error(`trace ${id} must be reviewed`);
    const evidenceDigest = digest(trace.evidenceDigest, `trace ${id}.evidenceDigest`);
    const targetSkillId = nonEmpty(trace.targetSkillId, `trace ${id}.targetSkillId`);
    if (!Array.isArray(trace.failureCodes) || trace.failureCodes.length === 0) {
      throw new Error(`trace ${id}.failureCodes must be a non-empty array`);
    }
    const failureCodes = sortedUnique(
      trace.failureCodes.map((code) => nonEmpty(code, `trace ${id}.failureCode`)),
    );
    if (failureCodes.length !== trace.failureCodes.length) {
      throw new Error(`trace ${id}.failureCodes must be unique`);
    }
    if (typeof trace.critical !== "boolean") {
      throw new Error(`trace ${id}.critical must be boolean`);
    }
    for (const failureCode of failureCodes) {
      const key = `${targetSkillId}\u0000${failureCode}`;
      const cluster = byFailure.get(key) ?? {
        targetSkillId,
        failureCode,
        traceIds: [],
        evidenceDigests: [],
        criticalOccurrences: 0,
      };
      cluster.traceIds.push(id);
      cluster.evidenceDigests.push(evidenceDigest);
      if (trace.critical) cluster.criticalOccurrences += 1;
      byFailure.set(key, cluster);
    }
  }

  const clusters = [...byFailure.values()]
    .filter(({ traceIds }) => traceIds.length >= minimumOccurrences)
    .map((cluster) => ({
      ...cluster,
      occurrences: cluster.traceIds.length,
      traceIds: sortedUnique(cluster.traceIds),
      evidenceDigests: sortedUnique(cluster.evidenceDigests),
    }))
    .sort(
      (left, right) =>
        left.targetSkillId.localeCompare(right.targetSkillId) ||
        left.failureCode.localeCompare(right.failureCode),
    );
  if (clusters.length > maximumClusters) {
    throw new Error(`recurring failure cluster count exceeds maximumClusters: ${clusters.length}`);
  }
  return clusters;
}

function validateFailures(failures, targetSkillId) {
  if (!Array.isArray(failures) || failures.length === 0) {
    throw new Error("at least one recurring failure cluster is required");
  }
  const codes = new Set();
  for (const failure of failures) {
    if (failure.targetSkillId !== targetSkillId) {
      throw new Error("all recurring failures must target the proposal skill");
    }
    const code = nonEmpty(failure.failureCode, "failure.failureCode");
    if (codes.has(code)) throw new Error(`duplicate failure code: ${code}`);
    codes.add(code);
    if (!Array.isArray(failure.traceIds) || !Array.isArray(failure.evidenceDigests)) {
      throw new Error(`failure ${code} must preserve trace and digest evidence`);
    }
    if (
      !Number.isInteger(failure.occurrences) ||
      failure.occurrences < 2 ||
      failure.traceIds.length !== failure.occurrences ||
      failure.evidenceDigests.length !== failure.occurrences ||
      sortedUnique(failure.traceIds).length !== failure.traceIds.length ||
      sortedUnique(failure.evidenceDigests).length !== failure.evidenceDigests.length
    ) {
      throw new Error(`failure ${code} has invalid recurrence evidence`);
    }
    failure.evidenceDigests.forEach((value) => digest(value, `failure ${code}.evidenceDigest`));
  }
  return codes;
}

export function stageEvolutionProposal({
  targetSkillId,
  baselineDigest,
  edits,
  failures,
  maximumEdits = 4,
  constructionInputDigests = [],
}) {
  targetSkillId = nonEmpty(targetSkillId, "targetSkillId");
  baselineDigest = digest(baselineDigest, "baselineDigest");
  if (!Number.isInteger(maximumEdits) || maximumEdits < 1 || maximumEdits > 16) {
    throw new Error("maximumEdits must be an integer between 1 and 16");
  }
  if (!Array.isArray(edits) || edits.length === 0) {
    throw new Error("edits must be a non-empty array");
  }
  if (edits.length > maximumEdits) throw new Error("proposal exceeds its edit budget");
  const failureCodes = validateFailures(failures, targetSkillId);
  const normalizedEdits = edits.map((edit, index) => {
    const operation = nonEmpty(edit?.operation, `edit ${index}.operation`);
    if (!ALLOWED_EDIT_OPERATIONS.has(operation)) {
      throw new Error(`edit ${index}.operation is not allowed`);
    }
    const section = nonEmpty(edit.section, `edit ${index}.section`);
    const rationaleCode = nonEmpty(edit.rationaleCode, `edit ${index}.rationaleCode`);
    if (!failureCodes.has(rationaleCode)) {
      throw new Error(`edit ${index}.rationaleCode lacks recurring failure evidence`);
    }
    return { operation, section, rationaleCode };
  });
  if (!Array.isArray(constructionInputDigests)) {
    throw new Error("constructionInputDigests must be an array");
  }
  constructionInputDigests.forEach((value) => digest(value, "constructionInputDigest"));

  return {
    schemaVersion: 1,
    status: "staged",
    targetSkillId,
    baselineDigest,
    maximumEdits,
    edits: normalizedEdits,
    constructionEvidenceIds: sortedUnique(failures.flatMap(({ traceIds }) => traceIds)),
    constructionEvidenceDigests: sortedUnique(
      failures.flatMap(({ evidenceDigests }) => evidenceDigests),
    ),
    constructionInputDigests: sortedUnique(constructionInputDigests),
    active: false,
    adopted: false,
    requiresExplicitAdoption: true,
  };
}

export function auditHeldOutLeakage({ proposal, heldOutCases, heldOutSuiteDigest }) {
  if (proposal?.status !== "staged" || proposal.active !== false || proposal.adopted !== false) {
    throw new Error("leakage audit requires an inactive staged proposal");
  }
  if (!Array.isArray(heldOutCases) || heldOutCases.length === 0) {
    throw new Error("heldOutCases must be a non-empty array");
  }
  heldOutSuiteDigest = digest(heldOutSuiteDigest, "heldOutSuiteDigest");
  const heldIds = new Set();
  const heldDigests = new Set();
  for (const item of heldOutCases) {
    const id = nonEmpty(item?.id, "held-out case.id");
    if (item.partition !== "held-out") throw new Error(`case ${id} must use the held-out partition`);
    if (heldIds.has(id)) throw new Error(`duplicate held-out case id: ${id}`);
    heldIds.add(id);
    const evidenceDigest = digest(item.evidenceDigest, `case ${id}.evidenceDigest`);
    if (heldDigests.has(evidenceDigest)) {
      throw new Error(`duplicate held-out evidence digest: ${evidenceDigest}`);
    }
    heldDigests.add(evidenceDigest);
  }
  const leaks = [];
  for (const id of proposal.constructionEvidenceIds ?? []) {
    if (heldIds.has(id)) leaks.push({ type: "case-id", value: id });
  }
  for (const value of proposal.constructionEvidenceDigests ?? []) {
    if (heldDigests.has(value)) leaks.push({ type: "evidence-digest", value });
  }
  for (const value of proposal.constructionInputDigests ?? []) {
    if (value === heldOutSuiteDigest) leaks.push({ type: "suite-digest", value });
    if (heldDigests.has(value)) leaks.push({ type: "construction-input", value });
  }
  leaks.sort((left, right) => `${left.type}:${left.value}`.localeCompare(`${right.type}:${right.value}`));
  return {
    schemaVersion: 1,
    status: leaks.length === 0 ? "clear" : "leaked",
    proposalDigest: recordDigest(proposal),
    heldOutSuiteDigest,
    heldOutCases: heldIds.size,
    leaks,
  };
}

export function decideEvolutionAdoption({ proposal, baseline, candidate, policy, leakageAudit }) {
  const failedGates = [];
  if (proposal?.status !== "staged" || proposal.active !== false || proposal.adopted !== false) {
    failedGates.push("inactive-staged-proposal");
  }
  if (leakageAudit?.status !== "clear") failedGates.push("held-out-leakage");
  if (leakageAudit?.proposalDigest !== recordDigest(proposal)) {
    failedGates.push("leakage-audit-binding");
  }
  if (
    baseline?.targetSkillId !== proposal?.targetSkillId ||
    candidate?.targetSkillId !== proposal?.targetSkillId
  ) {
    failedGates.push("target-binding");
  }
  if (
    baseline?.baselineDigest !== proposal?.baselineDigest ||
    candidate?.baselineDigest !== proposal?.baselineDigest
  ) {
    failedGates.push("baseline-binding");
  }
  if (baseline?.datasetPartition !== "held-out" || candidate?.datasetPartition !== "held-out") {
    failedGates.push("held-out-partition");
  }
  if (
    typeof baseline?.suiteDigest !== "string" ||
    baseline.suiteDigest !== candidate?.suiteDigest ||
    baseline.suiteDigest !== leakageAudit?.heldOutSuiteDigest
  ) {
    failedGates.push("held-out-suite-drift");
  }
  if (failedGates.length > 0) {
    return {
      schemaVersion: 1,
      status: "blocked",
      adopted: false,
      requiresExplicitAdoption: true,
      failedGates: sortedUnique(failedGates),
      improvements: [],
      reasons: sortedUnique(failedGates).map((gate) => `evolution gate failed: ${gate}`),
    };
  }

  const promotion = decidePromotion({ baseline, candidate, policy });
  return {
    ...promotion,
    status: promotion.status === "promoted" ? "eligible" : promotion.status,
    adopted: false,
    requiresExplicitAdoption: true,
  };
}
