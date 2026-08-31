import {
  EVIDENCE_LEVELS,
  PROFILE_IDENTITY_FIELDS,
  TRIAL_VARIANTS,
  canonicalDigest,
  compileProfileIdentity,
  deepFreeze,
  digestString,
  exactKeys,
  nonEmptyString,
  profileKey,
  validateAdaptiveEvidencePolicy,
} from "./adaptive-evidence-contracts.mjs";
import { createAdaptiveEvidenceAuthority } from "./adaptive-evidence-authority.mjs";
import { verifyTrialEnvelope } from "./adaptive-evidence-trials.mjs";

const RUNTIME_MODES = Object.freeze(["native", "guardrail", "method", "review"]);
const PROFILE_STATES = Object.freeze([
  "ineligible",
  "eligible",
  "promoted",
  "demoted",
  "quarantined",
  "invalidated",
]);
const BOUND_DIGEST_FIELDS = Object.freeze([
  "policyDigest",
  "taskDefinitionDigest",
  "comparisonPolicyDigest",
  "trialDigest",
  "ledgerDigest",
]);
const PROPOSAL_KEYS = Object.freeze([
  "schemaVersion",
  "proposalId",
  "trialDigest",
  "profileKey",
  "variant",
  "artifactDigest",
  "artifactBytes",
  "artifactMediaType",
  "artifactProducedAt",
  "observationDigest",
  "score",
  "outcomeAgainstRaw",
  "criticalRegression",
  "baselineArtifactDigest",
  "comparisons",
  "reasonCodes",
  "cost",
  "proofLevel",
  "producerId",
  "evaluatorId",
  "observedAt",
  "proposalDigest",
]);
const ROW_KEYS = Object.freeze([
  "schemaVersion",
  "sequence",
  "previousRowDigest",
  "proposalDigest",
  "trialDigest",
  "profileKey",
  "variant",
  "artifactDigest",
  "artifactBytes",
  "artifactProducedAt",
  "observationDigest",
  "score",
  "outcomeAgainstRaw",
  "criticalRegression",
  "baselineArtifactDigest",
  "comparisons",
  "reasonCodes",
  "cost",
  "proofLevel",
  "producerId",
  "evaluatorId",
  "observedAt",
  "rowDigest",
]);
const LEDGER_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "status",
  "policyDigest",
  "trialDigest",
  "profileKey",
  "taskDefinitionDigest",
  "comparisonPolicyDigest",
  "createdAt",
  "rows",
  "ledgerDigest",
]);
const PROFILE_KEYS = Object.freeze([
  "schemaVersion",
  "profileIdentity",
  "profileKey",
  "lifecycleState",
  "recommendedMode",
  "variantMetrics",
  "evidenceRowDigests",
  "participantIds",
  "promotableEvidenceRows",
  "failedGates",
  "boundDigests",
  "profileDigest",
]);

const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;

function exactIso(value, label) {
  nonEmptyString(value, label);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new TypeError(`${label} must be an exact ISO timestamp`);
  }
  return value;
}

function uniqueStrings(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)
      || value.some((item) => typeof item !== "string" || item.trim() === "")
      || new Set(value).size !== value.length) {
    throw new TypeError(`${label} must contain unique non-empty strings`);
  }
  return value;
}

function nonNegative(value, label, { integer = false, nullable = false } = {}) {
  if (nullable && value === null) return value;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0
      || (integer && !Number.isInteger(value))) {
    throw new TypeError(`${label} must be ${nullable ? "null or " : ""}a non-negative${integer ? " integer" : " number"}`);
  }
  return value;
}

function validateComparisons(comparisons, variant, label) {
  exactKeys(comparisons, ["matched", "wins", "losses", "ties"], label);
  for (const [key, value] of Object.entries(comparisons)) {
    nonNegative(value, `${label}.${key}`, { integer: true });
  }
  if (comparisons.wins + comparisons.losses + comparisons.ties !== comparisons.matched) {
    throw new Error(`${label} totals are contradictory`);
  }
  if (variant === "raw" && comparisons.matched !== 0) {
    throw new Error(`${label} gives intervention comparisons to raw`);
  }
  return comparisons;
}

function validateCost(cost, label) {
  exactKeys(cost, ["bytes", "tokens", "latencyMs", "monetaryCost"], label);
  nonNegative(cost.bytes, `${label}.bytes`, { integer: true });
  nonNegative(cost.tokens, `${label}.tokens`, { integer: true, nullable: true });
  nonNegative(cost.latencyMs, `${label}.latencyMs`, { nullable: true });
  nonNegative(cost.monetaryCost, `${label}.monetaryCost`, { nullable: true });
  return cost;
}

function validateProposal(proposal, trial, policy) {
  exactKeys(proposal, PROPOSAL_KEYS, "evidence proposal");
  const { proposalDigest, ...unsigned } = proposal;
  digestString(proposalDigest, "proposal digest");
  if (canonicalDigest(unsigned) !== proposalDigest) {
    throw new Error("proposal digest does not match its body");
  }
  if (proposal.schemaVersion !== 2 || proposal.trialDigest !== trial.trialDigest
      || proposal.profileKey !== trial.profileKey || !trial.variants.includes(proposal.variant)) {
    throw new Error("proposal does not match the trial lineage");
  }
  digestString(proposal.artifactDigest, "proposal artifact digest");
  digestString(proposal.observationDigest, "proposal observation digest");
  nonNegative(proposal.artifactBytes, "proposal artifact bytes", { integer: true });
  exactIso(proposal.artifactProducedAt, "proposal artifact producedAt");
  if (new Date(proposal.artifactProducedAt) <= new Date(trial.registeredAt)) {
    throw new Error("proposal artifact predates trial preregistration");
  }
  nonNegative(proposal.score, "proposal score");
  if (proposal.artifactMediaType !== trial.artifactBoundary.mediaType) {
    throw new Error("proposal artifact media type does not match the trial");
  }
  const allowedOutcomes = proposal.variant === "raw"
    ? new Set(["baseline"])
    : new Set(["win", "loss", "tie"]);
  if (!allowedOutcomes.has(proposal.outcomeAgainstRaw)) {
    throw new Error("proposal outcome does not match its variant");
  }
  if (typeof proposal.criticalRegression !== "boolean") {
    throw new TypeError("proposal critical regression must be boolean");
  }
  validateComparisons(proposal.comparisons, proposal.variant, "proposal comparisons");
  if (proposal.variant === "raw") {
    if (proposal.baselineArtifactDigest !== null) {
      throw new Error("raw proposal cannot reference a baseline artifact");
    }
  } else {
    digestString(proposal.baselineArtifactDigest, "proposal baseline artifact digest");
  }
  uniqueStrings(proposal.reasonCodes, "proposal reason codes", { allowEmpty: true });
  validateCost(proposal.cost, "proposal cost");
  if (!policy.evidenceLevels.includes(proposal.proofLevel)) {
    throw new Error("proposal proof level is invalid");
  }
  nonEmptyString(proposal.producerId, "proposal producerId");
  nonEmptyString(proposal.evaluatorId, "proposal evaluatorId");
  if (proposal.evaluatorId !== trial.evaluator.id
      || proposal.producerId === proposal.evaluatorId
      || proposal.producerId === trial.profileIdentity.capabilityId) {
    throw new Error("proposal evaluator is not independent");
  }
  exactIso(proposal.observedAt, "proposal observedAt");
  if (new Date(proposal.observedAt) <= new Date(proposal.artifactProducedAt)) {
    throw new Error("proposal observation predates its artifact");
  }
  return proposal;
}

function validateRow(row, index, previousDigest, trial, policy) {
  exactKeys(row, ROW_KEYS, `evidence row ${index}`);
  const { rowDigest, ...unsigned } = row;
  digestString(rowDigest, `evidence row ${index} digest`);
  if (canonicalDigest(unsigned) !== rowDigest) {
    throw new Error(`evidence row digest does not match its body at sequence ${index}`);
  }
  if (row.schemaVersion !== 2 || row.sequence !== index
      || row.previousRowDigest !== previousDigest || row.trialDigest !== trial.trialDigest
      || row.profileKey !== trial.profileKey || !trial.variants.includes(row.variant)) {
    throw new Error(`evidence row ${index} does not match its parent or trial lineage`);
  }
  digestString(row.proposalDigest, `evidence row ${index} proposal digest`);
  digestString(row.artifactDigest, `evidence row ${index} artifact digest`);
  digestString(row.observationDigest, `evidence row ${index} observation digest`);
  nonNegative(row.artifactBytes, `evidence row ${index} artifact bytes`, { integer: true });
  exactIso(row.artifactProducedAt, `evidence row ${index} artifact producedAt`);
  if (new Date(row.artifactProducedAt) <= new Date(trial.registeredAt)) {
    throw new Error(`evidence row ${index} artifact predates trial preregistration`);
  }
  nonNegative(row.score, `evidence row ${index} score`);
  const allowedOutcomes = row.variant === "raw"
    ? new Set(["baseline"])
    : new Set(["win", "loss", "tie"]);
  if (!allowedOutcomes.has(row.outcomeAgainstRaw)) {
    throw new Error(`evidence row ${index} outcome is invalid`);
  }
  if (typeof row.criticalRegression !== "boolean") {
    throw new TypeError(`evidence row ${index} critical regression must be boolean`);
  }
  validateComparisons(row.comparisons, row.variant, `evidence row ${index} comparisons`);
  if (row.variant === "raw") {
    if (row.baselineArtifactDigest !== null) {
      throw new Error(`evidence row ${index} raw baseline reference is invalid`);
    }
  } else {
    digestString(row.baselineArtifactDigest, `evidence row ${index} baseline artifact digest`);
  }
  uniqueStrings(row.reasonCodes, `evidence row ${index} reason codes`, { allowEmpty: true });
  validateCost(row.cost, `evidence row ${index} cost`);
  if (!policy.evidenceLevels.includes(row.proofLevel)) {
    throw new Error(`evidence row ${index} proof level is invalid`);
  }
  nonEmptyString(row.producerId, `evidence row ${index} producerId`);
  nonEmptyString(row.evaluatorId, `evidence row ${index} evaluatorId`);
  if (row.evaluatorId !== trial.evaluator.id || row.producerId === row.evaluatorId
      || row.producerId === trial.profileIdentity.capabilityId) {
    throw new Error(`evidence row ${index} evaluator is not independent`);
  }
  exactIso(row.observedAt, `evidence row ${index} observedAt`);
  if (new Date(row.observedAt) <= new Date(row.artifactProducedAt)) {
    throw new Error(`evidence row ${index} observation predates its artifact`);
  }
  return row;
}

export function createEvidenceLedger(options = {}) {
  exactKeys(
    options,
    ["trial", "createdAt", "policy", "expectedPolicyDigest"],
    "evidence ledger creation input",
  );
  const { trial, policy, expectedPolicyDigest } = options;
  validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  verifyTrialEnvelope({ trial, policy, expectedPolicyDigest });
  exactIso(options.createdAt, "ledger createdAt");
  if (new Date(options.createdAt) <= new Date(trial.registeredAt)) {
    throw new Error("evidence ledger must be created after trial preregistration");
  }
  const unsigned = {
    schemaVersion: 2,
    id: `ledger-${trial.trialId}`,
    status: "open",
    policyDigest: expectedPolicyDigest,
    trialDigest: trial.trialDigest,
    profileKey: trial.profileKey,
    taskDefinitionDigest: trial.taskDefinition.digest,
    comparisonPolicyDigest: trial.comparisonPolicy.digest,
    createdAt: options.createdAt,
    rows: [],
  };
  return deepFreeze({ ...unsigned, ledgerDigest: canonicalDigest(unsigned) });
}

export function verifyEvidenceLedger(options = {}) {
  exactKeys(
    options,
    ["ledger", "trial", "policy", "expectedPolicyDigest"],
    "evidence ledger verification input",
  );
  const { ledger, trial, policy, expectedPolicyDigest } = options;
  const trustedPolicy = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  verifyTrialEnvelope({ trial, policy, expectedPolicyDigest });
  exactKeys(ledger, LEDGER_KEYS, "evidence ledger");
  const { ledgerDigest, ...unsigned } = ledger;
  digestString(ledgerDigest, "ledger digest");
  if (canonicalDigest(unsigned) !== ledgerDigest) {
    throw new Error("ledger digest does not match its body");
  }
  if (ledger.schemaVersion !== 2 || ledger.status !== "open"
      || ledger.policyDigest !== expectedPolicyDigest
      || ledger.trialDigest !== trial.trialDigest || ledger.profileKey !== trial.profileKey
      || ledger.taskDefinitionDigest !== trial.taskDefinition.digest
      || ledger.comparisonPolicyDigest !== trial.comparisonPolicy.digest) {
    throw new Error("evidence ledger does not match the trusted trial lineage");
  }
  exactIso(ledger.createdAt, "ledger createdAt");
  if (!Array.isArray(ledger.rows)) throw new TypeError("evidence ledger rows must be an array");
  const proposalDigests = new Set();
  const artifactDigests = new Set();
  const variants = new Set();
  let previous = null;
  let rawArtifactDigest = null;
  for (const [index, row] of ledger.rows.entries()) {
    validateRow(row, index, previous, trial, trustedPolicy);
    if (proposalDigests.has(row.proposalDigest) || artifactDigests.has(row.artifactDigest)
        || variants.has(row.variant)) {
      throw new Error("evidence ledger contains a duplicate proposal, artifact, or variant");
    }
    proposalDigests.add(row.proposalDigest);
    artifactDigests.add(row.artifactDigest);
    variants.add(row.variant);
    if (row.variant === "raw") {
      if (index !== 0) throw new Error("raw baseline must be the first evidence row");
      rawArtifactDigest = row.artifactDigest;
    } else if (rawArtifactDigest === null) {
      throw new Error("intervention evidence requires the raw baseline first");
    } else if (row.baselineArtifactDigest !== rawArtifactDigest) {
      throw new Error("intervention baseline digest does not match the raw artifact");
    }
    previous = row.rowDigest;
  }
  const proofLevelCounts = Object.fromEntries(
    trustedPolicy.evidenceLevels.map((level) => [
      level,
      ledger.rows.filter((row) => row.proofLevel === level).length,
    ]),
  );
  return deepFreeze({
    valid: true,
    rowCount: ledger.rows.length,
    variants: [...variants].sort(lexical),
    proofLevelCounts,
    ledgerDigest,
  });
}

export function appendEvidenceRow(options = {}) {
  exactKeys(
    options,
    ["ledger", "trial", "proposal", "policy", "expectedPolicyDigest"],
    "evidence append input",
  );
  const { ledger, trial, proposal, policy, expectedPolicyDigest } = options;
  const trustedPolicy = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  verifyEvidenceLedger({ ledger, trial, policy, expectedPolicyDigest });
  validateProposal(proposal, trial, trustedPolicy);
  if (ledger.rows.some((row) => row.proposalDigest === proposal.proposalDigest
      || row.artifactDigest === proposal.artifactDigest || row.variant === proposal.variant)) {
    throw new Error("evidence append would duplicate a proposal, artifact, or variant");
  }
  const raw = ledger.rows.find((row) => row.variant === "raw");
  if (proposal.variant === "raw" && ledger.rows.length !== 0) {
    throw new Error("raw baseline must be admitted first");
  }
  if (proposal.variant !== "raw" && !raw) {
    throw new Error("intervention evidence requires the raw baseline first");
  }
  if (proposal.variant !== "raw" && proposal.baselineArtifactDigest !== raw.artifactDigest) {
    throw new Error("intervention baseline digest does not match the raw artifact");
  }
  const rowBody = {
    schemaVersion: 2,
    sequence: ledger.rows.length,
    previousRowDigest: ledger.rows.at(-1)?.rowDigest ?? null,
    proposalDigest: proposal.proposalDigest,
    trialDigest: proposal.trialDigest,
    profileKey: proposal.profileKey,
    variant: proposal.variant,
    artifactDigest: proposal.artifactDigest,
    artifactBytes: proposal.artifactBytes,
    artifactProducedAt: proposal.artifactProducedAt,
    observationDigest: proposal.observationDigest,
    score: proposal.score,
    outcomeAgainstRaw: proposal.outcomeAgainstRaw,
    criticalRegression: proposal.criticalRegression,
    baselineArtifactDigest: proposal.baselineArtifactDigest,
    comparisons: structuredClone(proposal.comparisons),
    reasonCodes: [...proposal.reasonCodes],
    cost: structuredClone(proposal.cost),
    proofLevel: proposal.proofLevel,
    producerId: proposal.producerId,
    evaluatorId: proposal.evaluatorId,
    observedAt: proposal.observedAt,
  };
  const row = { ...rowBody, rowDigest: canonicalDigest(rowBody) };
  const { ledgerDigest: _discard, ...ledgerBody } = ledger;
  const nextBody = { ...structuredClone(ledgerBody), rows: [...ledger.rows, row] };
  return deepFreeze({ ...nextBody, ledgerDigest: canonicalDigest(nextBody) });
}

function ratio(value, baseline) {
  if (baseline === 0) return value === 0 ? 1 : null;
  return Math.round((value / baseline) * 1e12) / 1e12;
}

function metricFor(rows, variant, rawBytes) {
  const selected = rows.filter((row) => row.variant === variant);
  const overheadRatios = selected
    .map((row) => ratio(row.cost.bytes, rawBytes))
    .filter((value) => value !== null);
  return {
    variant,
    matchedComparisons: selected.reduce((sum, row) => sum + row.comparisons.matched, 0),
    wins: selected.reduce((sum, row) => sum + row.comparisons.wins, 0),
    losses: selected.reduce((sum, row) => sum + row.comparisons.losses, 0),
    ties: selected.reduce((sum, row) => sum + row.comparisons.ties, 0),
    criticalRegressions: selected.filter((row) => row.criticalRegression).length,
    maximumOverheadRatio: overheadRatios.length === 0
      ? null
      : Math.max(...overheadRatios),
    evidenceLevels: [...new Set(selected.map((row) => row.proofLevel))]
      .sort((left, right) => EVIDENCE_LEVELS.indexOf(left) - EVIDENCE_LEVELS.indexOf(right)),
    rowDigests: selected.map((row) => row.rowDigest),
  };
}

function thresholdFailures(metric, threshold) {
  const winRate = metric.matchedComparisons === 0 ? 0 : metric.wins / metric.matchedComparisons;
  const gates = {
    matchedComparisons: metric.matchedComparisons >= threshold.minimumMatchedComparisons,
    wins: metric.wins >= threshold.minimumWins,
    winRate: winRate >= threshold.minimumWinRate,
    criticalRegressions: metric.criticalRegressions <= threshold.maximumCriticalRegressions,
    overhead: metric.maximumOverheadRatio !== null
      && metric.maximumOverheadRatio <= threshold.maximumOverheadRatio,
  };
  return Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => name);
}

function validateMetric(metric, policy, label) {
  exactKeys(metric, [
    "variant",
    "matchedComparisons",
    "wins",
    "losses",
    "ties",
    "criticalRegressions",
    "maximumOverheadRatio",
    "evidenceLevels",
    "rowDigests",
  ], label);
  if (!policy.trialVariants.includes(metric.variant)) throw new Error(`${label} variant is invalid`);
  for (const key of ["matchedComparisons", "wins", "losses", "ties", "criticalRegressions"]) {
    nonNegative(metric[key], `${label}.${key}`, { integer: true });
  }
  if (metric.wins + metric.losses + metric.ties !== metric.matchedComparisons) {
    throw new Error(`${label} comparison totals are contradictory`);
  }
  nonNegative(metric.maximumOverheadRatio, `${label}.maximumOverheadRatio`, { nullable: true });
  uniqueStrings(metric.evidenceLevels, `${label}.evidenceLevels`, { allowEmpty: true });
  if (metric.evidenceLevels.some((level) => !policy.evidenceLevels.includes(level))) {
    throw new Error(`${label} evidence level is invalid`);
  }
  uniqueStrings(metric.rowDigests, `${label}.rowDigests`, { allowEmpty: true });
  for (const digest of metric.rowDigests) digestString(digest, `${label} row digest`);
  return metric;
}

function validateProfile(profile, policy) {
  exactKeys(profile, PROFILE_KEYS, "derived activation profile");
  const { profileDigest, ...unsigned } = profile;
  digestString(profileDigest, "profile digest");
  if (canonicalDigest(unsigned) !== profileDigest) {
    throw new Error("profile digest does not match its body");
  }
  if (profile.schemaVersion !== 2 || !PROFILE_STATES.includes(profile.lifecycleState)
      || !policy.runtimeModes.includes(profile.recommendedMode)) {
    throw new Error("profile state or recommended mode is invalid");
  }
  const identity = compileProfileIdentity(profile.profileIdentity);
  if (profile.profileKey !== profileKey(identity)) throw new Error("profile key is invalid");
  if (!Array.isArray(profile.variantMetrics)
      || profile.variantMetrics.length !== policy.trialVariants.length) {
    throw new Error("profile variant metrics are incomplete");
  }
  const seen = new Set();
  for (const metric of profile.variantMetrics) {
    validateMetric(metric, policy, `profile metric ${metric?.variant ?? "unknown"}`);
    if (seen.has(metric.variant)) throw new Error("profile contains a duplicate variant metric");
    seen.add(metric.variant);
  }
  uniqueStrings(profile.evidenceRowDigests, "profile evidence row digests", { allowEmpty: true });
  for (const digest of profile.evidenceRowDigests) digestString(digest, "profile evidence row digest");
  exactKeys(profile.participantIds, ["producers", "evaluators"], "profile participant identities");
  uniqueStrings(profile.participantIds.producers, "profile producers", { allowEmpty: true });
  uniqueStrings(profile.participantIds.evaluators, "profile evaluators", { allowEmpty: true });
  nonNegative(profile.promotableEvidenceRows, "profile promotable evidence rows", { integer: true });
  uniqueStrings(profile.failedGates, "profile failed gates", { allowEmpty: true });
  exactKeys(profile.boundDigests, BOUND_DIGEST_FIELDS, "profile bound digests");
  for (const [field, digest] of Object.entries(profile.boundDigests)) {
    digestString(digest, `profile bound digest.${field}`);
  }
  return profile;
}

export function deriveActivationProfile(options = {}) {
  exactKeys(
    options,
    ["ledger", "trial", "policy", "expectedPolicyDigest"],
    "profile derivation input",
  );
  const { ledger, trial, policy, expectedPolicyDigest } = options;
  const trustedPolicy = validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest });
  verifyEvidenceLedger({ ledger, trial, policy, expectedPolicyDigest });
  const raw = ledger.rows.find((row) => row.variant === "raw");
  const rawBytes = raw?.cost.bytes ?? 0;
  const variantMetrics = trustedPolicy.trialVariants.map((variant) =>
    metricFor(ledger.rows, variant, rawBytes));
  const promotableMatrixRows = ledger.rows.filter((row) =>
    trustedPolicy.promotableEvidenceLevels.includes(row.proofLevel));
  const promotableRows = promotableMatrixRows.filter((row) => row.variant !== "raw");
  const promotableMetrics = trustedPolicy.trialVariants.map((variant) =>
    metricFor(promotableRows, variant, rawBytes));

  let lifecycleState = "ineligible";
  let recommendedMode = "native";
  let failedGates;
  if (promotableRows.length === 0) {
    failedGates = ["promotable-evidence-level"];
  } else if (ledger.rows.length !== trustedPolicy.trialVariants.length) {
    failedGates = ["incomplete-variant-coverage"];
  } else if (new Set(promotableMatrixRows.map((row) => row.variant)).size
      !== trustedPolicy.trialVariants.length) {
    failedGates = ["promotable-variant-coverage"];
  } else {
    const methodMetric = promotableMetrics.find(({ variant }) => variant === "method");
    const reviewerMetric = promotableMetrics.find(({ variant }) => variant === "reviewer");
    const methodFailures = thresholdFailures(methodMetric, trustedPolicy.methodPromotion);
    const reviewFailures = thresholdFailures(reviewerMetric, trustedPolicy.reviewPromotion);
    const hasCriticalRegression = promotableMetrics.some((metric) => metric.criticalRegressions > 0);
    if (hasCriticalRegression) {
      recommendedMode = "guardrail";
      failedGates = ["criticalRegressions"];
    } else if (methodFailures.length === 0) {
      lifecycleState = "eligible";
      recommendedMode = "method";
      failedGates = [];
    } else if (reviewFailures.length === 0) {
      lifecycleState = "eligible";
      recommendedMode = "review";
      failedGates = [];
    } else {
      const critical = promotableMetrics.some((metric) => metric.criticalRegressions > 0);
      recommendedMode = critical ? "guardrail" : "native";
      failedGates = [...new Set([...methodFailures, ...reviewFailures])];
    }
  }

  const body = {
    schemaVersion: 2,
    profileIdentity: structuredClone(trial.profileIdentity),
    profileKey: trial.profileKey,
    lifecycleState,
    recommendedMode,
    variantMetrics,
    evidenceRowDigests: ledger.rows.map((row) => row.rowDigest),
    participantIds: {
      producers: [...new Set(ledger.rows.map((row) => row.producerId))].sort(lexical),
      evaluators: [...new Set(ledger.rows.map((row) => row.evaluatorId))].sort(lexical),
    },
    promotableEvidenceRows: promotableRows.length,
    failedGates,
    boundDigests: {
      policyDigest: expectedPolicyDigest,
      taskDefinitionDigest: trial.taskDefinition.digest,
      comparisonPolicyDigest: trial.comparisonPolicy.digest,
      trialDigest: trial.trialDigest,
      ledgerDigest: ledger.ledgerDigest,
    },
  };
  const profile = { ...body, profileDigest: canonicalDigest(body) };
  validateProfile(profile, trustedPolicy);
  return deepFreeze(profile);
}

export function evaluateProfileFreshness(options = {}) {
  exactKeys(options, [
    "profile",
    "currentIdentity",
    "currentBindings",
    "policy",
    "expectedPolicyDigest",
  ], "profile freshness input");
  const trustedPolicy = validateAdaptiveEvidencePolicy(options);
  validateProfile(options.profile, trustedPolicy);
  const currentIdentity = compileProfileIdentity(options.currentIdentity);
  exactKeys(options.currentBindings, BOUND_DIGEST_FIELDS, "current profile bindings");
  for (const [field, digest] of Object.entries(options.currentBindings)) {
    digestString(digest, `current profile binding.${field}`);
  }
  const mismatches = [];
  for (const field of PROFILE_IDENTITY_FIELDS) {
    if (options.profile.profileIdentity[field] !== currentIdentity[field]) {
      mismatches.push(`profileIdentity.${field}`);
    }
  }
  for (const field of BOUND_DIGEST_FIELDS) {
    if (options.profile.boundDigests[field] !== options.currentBindings[field]) {
      mismatches.push(`boundDigests.${field}`);
    }
  }
  return deepFreeze({ current: mismatches.length === 0, mismatches });
}

function compileLifecycleDecisionWithAuthority(options, authority, expectedPolicyDigest) {
  exactKeys(options, [
    "profile",
    "action",
    "requestedMode",
    "currentMode",
    "authorizationPackage",
    "decidedAt",
    "currentIdentity",
    "currentBindings",
    "policy",
  ], "lifecycle decision input");
  const trustedPolicy = validateAdaptiveEvidencePolicy({
    policy: options.policy,
    expectedPolicyDigest,
  });
  validateProfile(options.profile, trustedPolicy);
  const freshness = evaluateProfileFreshness({
    profile: options.profile,
    currentIdentity: options.currentIdentity,
    currentBindings: options.currentBindings,
    policy: options.policy,
    expectedPolicyDigest,
  });
  if (!freshness.current) {
    throw new Error(`profile is not current: ${freshness.mismatches.join(", ")}`);
  }
  if (!Object.hasOwn(trustedPolicy.lifecycleGrants, options.action)) {
    throw new Error("lifecycle action is invalid");
  }
  if (!trustedPolicy.runtimeModes.includes(options.requestedMode)
      || !trustedPolicy.runtimeModes.includes(options.currentMode)) {
    throw new Error("lifecycle mode is invalid");
  }
  exactIso(options.decidedAt, "lifecycle decidedAt");
  const bindingsDigest = canonicalDigest(options.currentBindings);
  const authorization = authority.verifyAuthorizationPackage({
    authorizationPackage: options.authorizationPackage,
    expected: {
      profileDigest: options.profile.profileDigest,
      bindingsDigest,
      action: options.action,
      requestedMode: options.requestedMode,
      currentMode: options.currentMode,
      grant: trustedPolicy.lifecycleGrants[options.action],
      decidedAt: options.decidedAt,
    },
  });
  const actorId = authorization.record.actorId;
  const participants = new Set([
    options.profile.profileIdentity.capabilityId,
    ...options.profile.participantIds.producers,
    ...options.profile.participantIds.evaluators,
  ]);
  if (participants.has(actorId)) {
    throw new Error("lifecycle actor cannot self-promote or govern its own evidence");
  }

  let status = "applied";
  let nextMode = options.requestedMode;
  let reasonCodes = [];
  if (options.action === "promote") {
    if (!new Set(["method", "review"]).has(options.requestedMode)) {
      throw new Error("promotion may target only method or review");
    }
    const variant = options.requestedMode === "method" ? "method" : "reviewer";
    const metric = options.profile.variantMetrics.find((item) => item.variant === variant);
    const threshold = options.requestedMode === "method"
      ? trustedPolicy.methodPromotion
      : trustedPolicy.reviewPromotion;
    const metricFailures = thresholdFailures(metric, threshold);
    const promotable = metric.evidenceLevels.some((level) =>
      trustedPolicy.promotableEvidenceLevels.includes(level));
    reasonCodes = [...new Set([
      ...options.profile.failedGates,
      ...(options.profile.lifecycleState === "eligible" ? [] : ["profile-not-eligible"]),
      ...(options.profile.recommendedMode === options.requestedMode ? [] : ["mode-not-recommended"]),
      ...(options.profile.promotableEvidenceRows > 0 && promotable ? [] : ["promotable-evidence-level"]),
      ...metricFailures,
    ])];
    if (reasonCodes.length > 0) {
      status = "rejected";
      nextMode = options.currentMode;
    } else {
      reasonCodes = ["all-promotion-gates-passed"];
    }
  } else if (options.action === "demote") {
    if (!new Set(["native", "guardrail"]).has(options.requestedMode)) {
      throw new Error("demotion must lower activation to native or guardrail");
    }
    if (options.currentMode === options.requestedMode) {
      status = "no-change";
      reasonCodes = ["requested-mode-already-active"];
    } else {
      reasonCodes = ["authorized-demotion"];
    }
  } else if (options.action === "quarantine") {
    nextMode = options.profile.profileIdentity.consequenceClass === "low" ? "native" : "guardrail";
    reasonCodes = ["authorized-quarantine"];
  } else {
    nextMode = options.profile.profileIdentity.consequenceClass === "low" ? "native" : "guardrail";
    reasonCodes = ["authorized-invalidation"];
  }

  const body = {
    schemaVersion: 2,
    action: options.action,
    status,
    actorId,
    authorityKeyId: authorization.authorityKeyId,
    authorityTrustRootDigest: authorization.authorityTrustRootDigest,
    authorizationDigest: authorization.authorizationDigest,
    profileDigest: options.profile.profileDigest,
    bindingsDigest,
    evidenceDigest: canonicalDigest(options.profile.evidenceRowDigests),
    priorMode: options.currentMode,
    nextMode,
    decidedAt: options.decidedAt,
    reasonCodes,
    authorityExpanded: false,
  };
  return deepFreeze({ ...body, decisionDigest: canonicalDigest(body) });
}

export function createLifecycleController(options = {}) {
  exactKeys(
    options,
    ["trustRootId", "trustedKeys", "expectedPolicyDigest"],
    "lifecycle controller input",
  );
  digestString(options.expectedPolicyDigest, "lifecycle trusted policy digest");
  const authority = createAdaptiveEvidenceAuthority({
    trustRootId: options.trustRootId,
    trustedKeys: options.trustedKeys,
  });
  return Object.freeze({
    trustRoot: authority.trustRoot,
    trustRootDigest: authority.trustRootDigest,
    compileLifecycleDecision: (input) => compileLifecycleDecisionWithAuthority(
      input,
      authority,
      options.expectedPolicyDigest,
    ),
  });
}
