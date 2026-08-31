import {
  EVIDENCE_LEVELS,
  TRIAL_VARIANTS,
  canonicalDigest,
  canonicalJson,
  compileProfileIdentity,
  deepFreeze,
  digestString,
  exactKeys,
  nonEmptyString,
  profileKey,
} from "./adaptive-evidence-contracts.mjs";
import {
  deriveActivationProfile,
  verifyEvidenceLedger,
} from "./adaptive-evidence-ledger.mjs";
import { verifyTrialEnvelope } from "./adaptive-evidence-trials.mjs";
import {
  buildPortfolioWitnessSchema,
  verifyPortfolioPlanWitness,
} from "./adaptive-evidence-portfolio-witness.mjs";

const PROTOCOL_ID = "eternities-godskills-cross-trial-portfolio-v1";
const POLICY_ID = "adaptive-evidence-portfolio-policy-v1";
const CANDIDATE_VARIANTS = Object.freeze(["guardrail", "method", "reviewer", "combined"]);
const ADMISSIBLE_EVIDENCE_LEVELS = Object.freeze(["model", "cross-model", "field", "universal"]);
const POLICY_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "protocolId",
  "trialVariants",
  "candidateVariants",
  "admissibleEvidenceLevels",
  "minimumCompletedTrials",
  "minimumDiversityAxes",
  "minimumDistinctValuesPerAxis",
  "taskOutcomeThreshold",
  "exactPreregisteredSetRequired",
  "completeCohortRequired",
  "duplicateTaskDefinitionsAllowed",
  "caseComparisonAggregationAllowed",
  "schemaValidationSufficient",
  "reportingOnly",
  "profilePromotionAllowed",
  "lifecycleActionAllowed",
  "activationRequestAllowed",
  "authorityExpanded",
]);
const PLAN_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "status",
  "protocolId",
  "profileIdentity",
  "profileKey",
  "policyDigest",
  "selectionRule",
  "taskSlots",
  "registeredAt",
  "semanticVerificationRequired",
  "planDigest",
]);
const COMPLETION_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "status",
  "protocolId",
  "planDigest",
  "planWitnessDigest",
  "planWitnessedAt",
  "witnessAuthorityTrustRootDigest",
  "portfolioPolicyDigest",
  "adaptiveEvidencePolicyDigest",
  "profileIdentity",
  "profileKey",
  "slotId",
  "trialId",
  "trialDigest",
  "ledgerDigest",
  "profileDigest",
  "taskDefinition",
  "comparisonPolicyDigest",
  "rawReference",
  "variantOutcomes",
  "caseEvidenceDigest",
  "completedAt",
  "semanticVerificationRequired",
  "reportingOnly",
  "authorityExpanded",
  "completionDigest",
]);
const REPORT_KEYS = Object.freeze([
  "schemaVersion",
  "id",
  "status",
  "protocolId",
  "planDigest",
  "planWitnessDigest",
  "planWitnessedAt",
  "witnessAuthorityTrustRootDigest",
  "portfolioPolicyDigest",
  "adaptiveEvidencePolicyDigest",
  "profileIdentity",
  "profileKey",
  "requiredTaskCount",
  "completedTaskCount",
  "missingSlotIds",
  "members",
  "diversityMetrics",
  "variantMetrics",
  "candidatesPassingEvidenceGate",
  "caseComparisonAggregationAllowed",
  "semanticVerificationRequired",
  "reportingOnly",
  "profilePromotionAllowed",
  "lifecycleActionAllowed",
  "activationRequestAllowed",
  "authorityExpanded",
  "generatedAt",
  "reportDigest",
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

function exactArray(value, expected, label) {
  if (!Array.isArray(value) || JSON.stringify(value) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the required ordered values`);
  }
}

function uniqueStrings(value, label, { minimum = 1 } = {}) {
  if (!Array.isArray(value) || value.length < minimum
      || value.some((item) => typeof item !== "string" || item.trim() === "")
      || new Set(value).size !== value.length) {
    throw new TypeError(`${label} must contain unique non-empty strings`);
  }
  return value;
}

function nonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function validateThreshold(threshold) {
  exactKeys(threshold, [
    "minimumWins",
    "minimumWinRate",
    "maximumLosses",
    "maximumCriticalRegressions",
  ], "portfolio task outcome threshold");
  nonNegativeInteger(threshold.minimumWins, "portfolio threshold.minimumWins");
  nonNegativeInteger(threshold.maximumLosses, "portfolio threshold.maximumLosses");
  nonNegativeInteger(
    threshold.maximumCriticalRegressions,
    "portfolio threshold.maximumCriticalRegressions",
  );
  if (typeof threshold.minimumWinRate !== "number"
      || !Number.isFinite(threshold.minimumWinRate)
      || threshold.minimumWinRate < 0 || threshold.minimumWinRate > 1) {
    throw new TypeError("portfolio threshold.minimumWinRate must be between zero and one");
  }
}

export function validatePortfolioPolicy({ policy, expectedPolicyDigest } = {}) {
  exactKeys(policy, POLICY_KEYS, "adaptive evidence portfolio policy");
  digestString(expectedPolicyDigest, "portfolio expectedPolicyDigest");
  if (canonicalDigest(policy) !== expectedPolicyDigest) {
    throw new Error("adaptive evidence portfolio policy does not match its trusted digest");
  }
  if (policy.schemaVersion !== 1 || policy.id !== POLICY_ID
      || policy.protocolId !== PROTOCOL_ID) {
    throw new Error("adaptive evidence portfolio policy identity is invalid");
  }
  exactArray(policy.trialVariants, TRIAL_VARIANTS, "portfolio trial variants");
  exactArray(policy.candidateVariants, CANDIDATE_VARIANTS, "portfolio candidate variants");
  exactArray(
    policy.admissibleEvidenceLevels,
    ADMISSIBLE_EVIDENCE_LEVELS,
    "portfolio admissible evidence levels",
  );
  if (policy.admissibleEvidenceLevels.some((level) => !EVIDENCE_LEVELS.includes(level))) {
    throw new Error("portfolio policy includes an unknown evidence level");
  }
  if (!Number.isInteger(policy.minimumCompletedTrials) || policy.minimumCompletedTrials < 2) {
    throw new Error("portfolio policy minimum completed trials must be at least two");
  }
  if (!Number.isInteger(policy.minimumDiversityAxes) || policy.minimumDiversityAxes < 2) {
    throw new Error("portfolio policy minimum diversity axes must be at least two");
  }
  if (!Number.isInteger(policy.minimumDistinctValuesPerAxis)
      || policy.minimumDistinctValuesPerAxis < 2
      || policy.minimumDistinctValuesPerAxis > policy.minimumCompletedTrials) {
    throw new Error("portfolio policy minimum distinct values per axis must be between two and the minimum trial count");
  }
  validateThreshold(policy.taskOutcomeThreshold);
  if (policy.taskOutcomeThreshold.minimumWins > policy.minimumCompletedTrials) {
    throw new Error("portfolio minimum wins cannot exceed its minimum trial count");
  }
  const requiredTrue = [
    "exactPreregisteredSetRequired",
    "completeCohortRequired",
    "reportingOnly",
  ];
  if (requiredTrue.some((key) => policy[key] !== true)) {
    throw new Error("portfolio policy must preserve exact selection, complete cohorts, and reporting-only use");
  }
  const requiredFalse = [
    "duplicateTaskDefinitionsAllowed",
    "caseComparisonAggregationAllowed",
    "schemaValidationSufficient",
    "profilePromotionAllowed",
    "lifecycleActionAllowed",
    "activationRequestAllowed",
    "authorityExpanded",
  ];
  if (requiredFalse.some((key) => policy[key] !== false)) {
    throw new Error("portfolio policy cannot aggregate cases, activate, promote, or expand authority");
  }
  return policy;
}

function normalizeSelectionRule(value) {
  exactKeys(
    value,
    ["mode", "diversityAxes", "minimumDistinctValues"],
    "portfolio selection rule",
  );
  if (value.mode !== "exact-preregistered-set") {
    throw new Error("portfolio selection mode must be exact-preregistered-set");
  }
  const diversityAxes = [...uniqueStrings(value.diversityAxes, "portfolio diversity axes")]
    .sort(lexical);
  if (!Array.isArray(value.minimumDistinctValues)
      || value.minimumDistinctValues.length !== diversityAxes.length) {
    throw new Error("portfolio diversity minimums must cover every declared axis");
  }
  const seen = new Set();
  const minimumDistinctValues = value.minimumDistinctValues.map((entry) => {
    exactKeys(entry, ["axis", "count"], "portfolio diversity minimum");
    nonEmptyString(entry.axis, "portfolio diversity minimum.axis");
    if (seen.has(entry.axis)) throw new Error("portfolio diversity minimum contains a duplicate axis");
    seen.add(entry.axis);
    if (!Number.isInteger(entry.count) || entry.count < 1) {
      throw new TypeError("portfolio diversity minimum count must be a positive integer");
    }
    return { axis: entry.axis, count: entry.count };
  }).sort((left, right) => lexical(left.axis, right.axis));
  if (canonicalJson(minimumDistinctValues.map(({ axis }) => axis))
      !== canonicalJson(diversityAxes)) {
    throw new Error("portfolio diversity minimum axes do not match the declared axes");
  }
  return { mode: value.mode, diversityAxes, minimumDistinctValues };
}

function normalizeTaskSlot(value, axes) {
  exactKeys(
    value,
    ["slotId", "trialId", "taskDefinition", "diversityValues"],
    "portfolio task slot",
  );
  nonEmptyString(value.slotId, "portfolio task slot.slotId");
  nonEmptyString(value.trialId, "portfolio task slot.trialId");
  exactKeys(value.taskDefinition, ["id", "version", "digest"], "portfolio task definition");
  nonEmptyString(value.taskDefinition.id, "portfolio task definition.id");
  nonEmptyString(value.taskDefinition.version, "portfolio task definition.version");
  digestString(value.taskDefinition.digest, "portfolio task definition.digest");
  if (!Array.isArray(value.diversityValues) || value.diversityValues.length !== axes.length) {
    throw new Error("portfolio task diversity values must cover every declared axis");
  }
  const seen = new Set();
  const diversityValues = value.diversityValues.map((entry) => {
    exactKeys(entry, ["axis", "value"], "portfolio task diversity value");
    nonEmptyString(entry.axis, "portfolio task diversity value.axis");
    nonEmptyString(entry.value, "portfolio task diversity value.value");
    if (seen.has(entry.axis)) throw new Error("portfolio task contains a duplicate diversity axis");
    seen.add(entry.axis);
    return { axis: entry.axis, value: entry.value };
  }).sort((left, right) => lexical(left.axis, right.axis));
  if (canonicalJson(diversityValues.map(({ axis }) => axis)) !== canonicalJson(axes)) {
    throw new Error("portfolio task diversity axes do not match the selection rule");
  }
  return {
    slotId: value.slotId,
    trialId: value.trialId,
    taskDefinition: { ...value.taskDefinition },
    diversityValues,
  };
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains a duplicate value`);
}

export function preregisterPortfolioPlan(options = {}) {
  exactKeys(options, [
    "portfolioId",
    "profileIdentity",
    "selectionRule",
    "taskSlots",
    "registeredAt",
    "policy",
    "expectedPolicyDigest",
  ], "portfolio plan preregistration input");
  const policy = validatePortfolioPolicy({
    policy: options.policy,
    expectedPolicyDigest: options.expectedPolicyDigest,
  });
  nonEmptyString(options.portfolioId, "portfolio id");
  const identity = compileProfileIdentity(options.profileIdentity);
  const selectionRule = normalizeSelectionRule(options.selectionRule);
  if (selectionRule.diversityAxes.length < policy.minimumDiversityAxes) {
    throw new Error("portfolio selection does not meet the minimum number of diversity axes");
  }
  if (selectionRule.minimumDistinctValues.some(({ count }) =>
    count < policy.minimumDistinctValuesPerAxis)) {
    throw new Error("portfolio selection distinct minimum is below the trusted policy floor");
  }
  if (!Array.isArray(options.taskSlots)
      || options.taskSlots.length < policy.minimumCompletedTrials) {
    throw new Error("portfolio plan must preregister the minimum number of independent tasks");
  }
  const taskSlots = options.taskSlots
    .map((slot) => normalizeTaskSlot(slot, selectionRule.diversityAxes))
    .sort((left, right) => lexical(left.slotId, right.slotId));
  assertUnique(taskSlots.map(({ slotId }) => slotId), "portfolio slot ids");
  assertUnique(taskSlots.map(({ trialId }) => trialId), "portfolio trial ids");
  if (!policy.duplicateTaskDefinitionsAllowed) {
    assertUnique(
      taskSlots.map(({ taskDefinition }) => taskDefinition.digest),
      "portfolio task definition digests",
    );
  }
  for (const { axis, count } of selectionRule.minimumDistinctValues) {
    if (count > taskSlots.length) {
      throw new Error(`portfolio diversity minimum for ${axis} exceeds the task count`);
    }
    const observed = new Set(taskSlots.map((slot) =>
      slot.diversityValues.find((entry) => entry.axis === axis).value));
    if (observed.size < count) {
      throw new Error(`portfolio diversity axis ${axis} lacks distinct task values`);
    }
  }
  exactIso(options.registeredAt, "portfolio plan registeredAt");
  const body = {
    schemaVersion: 1,
    id: options.portfolioId,
    status: "preregistered",
    protocolId: PROTOCOL_ID,
    profileIdentity: structuredClone(identity),
    profileKey: profileKey(identity),
    policyDigest: options.expectedPolicyDigest,
    selectionRule,
    taskSlots,
    registeredAt: options.registeredAt,
    semanticVerificationRequired: true,
  };
  return deepFreeze({ ...body, planDigest: canonicalDigest(body) });
}

export function verifyPortfolioPlan({ plan, policy, expectedPolicyDigest } = {}) {
  exactKeys(plan, PLAN_KEYS, "portfolio plan");
  digestString(plan.planDigest, "portfolio plan digest");
  const { planDigest, ...body } = plan;
  if (canonicalDigest(body) !== planDigest) throw new Error("portfolio plan digest is invalid");
  if (plan.schemaVersion !== 1 || plan.status !== "preregistered"
      || plan.protocolId !== PROTOCOL_ID || plan.policyDigest !== expectedPolicyDigest) {
    throw new Error("portfolio plan identity or policy is invalid");
  }
  const rebuilt = preregisterPortfolioPlan({
    portfolioId: plan.id,
    profileIdentity: plan.profileIdentity,
    selectionRule: plan.selectionRule,
    taskSlots: plan.taskSlots,
    registeredAt: plan.registeredAt,
    policy,
    expectedPolicyDigest,
  });
  if (canonicalJson(rebuilt) !== canonicalJson(plan)) {
    throw new Error("portfolio plan does not match its canonical preregistration");
  }
  return deepFreeze({ valid: true, planDigest, profileKey: plan.profileKey });
}

function assertSameProfile(plan, trial) {
  if (trial.profileKey !== plan.profileKey
      || canonicalJson(compileProfileIdentity(trial.profileIdentity))
        !== canonicalJson(plan.profileIdentity)) {
    throw new Error("completed trial profile does not match the portfolio profile");
  }
}

function matchingSlot(plan, slotId) {
  nonEmptyString(slotId, "portfolio completion slotId");
  const slot = plan.taskSlots.find((candidate) => candidate.slotId === slotId);
  if (!slot) throw new Error("completed trial does not match a preregistered portfolio slot");
  return slot;
}

function compareProfile(profile, expected) {
  if (canonicalJson(profile) !== canonicalJson(expected)) {
    throw new Error("completed trial profile does not match the rederived ledger profile");
  }
}

function verifyTrustedPlanWitness({
  plan,
  planWitness,
  witnessAuthority,
  expectedWitnessTrustRootDigest,
  expectedPortfolioPolicyDigest,
}) {
  const verified = verifyPortfolioPlanWitness({
    authority: witnessAuthority,
    witness: planWitness,
    plan,
    expectedPolicyDigest: expectedPortfolioPolicyDigest,
    expectedTrustRootDigest: expectedWitnessTrustRootDigest,
  });
  if (!verified || verified.valid !== true
      || verified.planDigest !== plan.planDigest
      || verified.authorityTrustRootDigest !== expectedWitnessTrustRootDigest) {
    throw new Error("portfolio plan preregistration witness did not verify under the trusted root");
  }
  return verified;
}

function assertCompleteRows(ledger, portfolioPolicy) {
  if (ledger.rows.length !== portfolioPolicy.trialVariants.length) {
    throw new Error("completed trial ledger lacks complete variant coverage");
  }
  const variants = ledger.rows.map(({ variant }) => variant);
  assertUnique(variants, "completed trial variants");
  if (portfolioPolicy.trialVariants.some((variant) => !variants.includes(variant))) {
    throw new Error("completed trial ledger lacks a required variant");
  }
  for (const row of ledger.rows) {
    if (!portfolioPolicy.admissibleEvidenceLevels.includes(row.proofLevel)) {
      throw new Error("completed trial contains a proof level not admissible to the portfolio");
    }
  }
}

export function createCompletedTrialReceipt(options = {}) {
  exactKeys(options, [
    "plan",
    "planWitness",
    "witnessAuthority",
    "expectedWitnessTrustRootDigest",
    "slotId",
    "trial",
    "ledger",
    "profile",
    "completedAt",
    "portfolioPolicy",
    "expectedPortfolioPolicyDigest",
    "evidencePolicy",
    "expectedEvidencePolicyDigest",
  ], "completed trial receipt input");
  const portfolioPolicy = validatePortfolioPolicy({
    policy: options.portfolioPolicy,
    expectedPolicyDigest: options.expectedPortfolioPolicyDigest,
  });
  verifyPortfolioPlan({
    plan: options.plan,
    policy: portfolioPolicy,
    expectedPolicyDigest: options.expectedPortfolioPolicyDigest,
  });
  const planWitness = verifyTrustedPlanWitness({
    plan: options.plan,
    planWitness: options.planWitness,
    witnessAuthority: options.witnessAuthority,
    expectedWitnessTrustRootDigest: options.expectedWitnessTrustRootDigest,
    expectedPortfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
  });
  verifyTrialEnvelope({
    trial: options.trial,
    policy: options.evidencePolicy,
    expectedPolicyDigest: options.expectedEvidencePolicyDigest,
  });
  verifyEvidenceLedger({
    ledger: options.ledger,
    trial: options.trial,
    policy: options.evidencePolicy,
    expectedPolicyDigest: options.expectedEvidencePolicyDigest,
  });
  const slot = matchingSlot(options.plan, options.slotId);
  assertSameProfile(options.plan, options.trial);
  if (slot.trialId !== options.trial.trialId
      || slot.taskDefinition.id !== options.trial.taskDefinition.id
      || slot.taskDefinition.version !== options.trial.taskDefinition.version
      || slot.taskDefinition.digest !== options.trial.taskDefinition.digest) {
    throw new Error("completed trial id or task does not match its preregistered slot");
  }
  if (new Date(options.trial.registeredAt) <= new Date(options.plan.registeredAt)) {
    throw new Error("portfolio selection must predate every completed trial registration");
  }
  if (new Date(options.trial.registeredAt) <= new Date(planWitness.witnessedAt)) {
    throw new Error("trusted portfolio plan witness must predate every trial registration");
  }
  assertCompleteRows(options.ledger, portfolioPolicy);
  const expectedProfile = deriveActivationProfile({
    ledger: options.ledger,
    trial: options.trial,
    policy: options.evidencePolicy,
    expectedPolicyDigest: options.expectedEvidencePolicyDigest,
  });
  compareProfile(options.profile, expectedProfile);
  exactIso(options.completedAt, "completed trial completedAt");
  const latestObservation = Math.max(...options.ledger.rows.map((row) =>
    new Date(row.observedAt).valueOf()));
  if (new Date(options.completedAt).valueOf() <= latestObservation) {
    throw new Error("completed trial completedAt must be after every observation");
  }
  const raw = options.ledger.rows.find(({ variant }) => variant === "raw");
  if (!raw || raw.outcomeAgainstRaw !== "baseline") {
    throw new Error("completed trial lacks its exact raw baseline");
  }
  const variantOutcomes = portfolioPolicy.candidateVariants.map((variant) => {
    const row = options.ledger.rows.find((candidate) => candidate.variant === variant);
    if (!row || !["win", "loss", "tie"].includes(row.outcomeAgainstRaw)) {
      throw new Error(`completed trial ${variant} task outcome is invalid`);
    }
    return {
      variant,
      outcomeAgainstRaw: row.outcomeAgainstRaw,
      criticalRegression: row.criticalRegression,
      proofLevel: row.proofLevel,
      rowDigest: row.rowDigest,
      artifactDigest: row.artifactDigest,
    };
  });
  const caseEvidenceDigest = canonicalDigest(options.ledger.rows.map((row) => ({
    variant: row.variant,
    rowDigest: row.rowDigest,
    observationDigest: row.observationDigest,
    comparisons: row.comparisons,
  })));
  const body = {
    schemaVersion: 1,
    id: `${options.plan.id}:${slot.slotId}:completion`,
    status: "completed",
    protocolId: PROTOCOL_ID,
    planDigest: options.plan.planDigest,
    planWitnessDigest: planWitness.witnessDigest,
    planWitnessedAt: planWitness.witnessedAt,
    witnessAuthorityTrustRootDigest: planWitness.authorityTrustRootDigest,
    portfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
    adaptiveEvidencePolicyDigest: options.expectedEvidencePolicyDigest,
    profileIdentity: structuredClone(options.plan.profileIdentity),
    profileKey: options.plan.profileKey,
    slotId: slot.slotId,
    trialId: options.trial.trialId,
    trialDigest: options.trial.trialDigest,
    ledgerDigest: options.ledger.ledgerDigest,
    profileDigest: options.profile.profileDigest,
    taskDefinition: structuredClone(slot.taskDefinition),
    comparisonPolicyDigest: options.trial.comparisonPolicy.digest,
    rawReference: {
      rowDigest: raw.rowDigest,
      artifactDigest: raw.artifactDigest,
      criticalRegression: raw.criticalRegression,
      proofLevel: raw.proofLevel,
    },
    variantOutcomes,
    caseEvidenceDigest,
    completedAt: options.completedAt,
    semanticVerificationRequired: true,
    reportingOnly: true,
    authorityExpanded: false,
  };
  return deepFreeze({ ...body, completionDigest: canonicalDigest(body) });
}

export function verifyCompletedTrialReceipt(options = {}) {
  exactKeys(options, [
    "plan",
    "planWitness",
    "witnessAuthority",
    "expectedWitnessTrustRootDigest",
    "slotId",
    "trial",
    "ledger",
    "profile",
    "receipt",
    "portfolioPolicy",
    "expectedPortfolioPolicyDigest",
    "evidencePolicy",
    "expectedEvidencePolicyDigest",
  ], "completed trial verification input");
  exactKeys(options.receipt, COMPLETION_KEYS, "completed trial receipt");
  digestString(options.receipt.completionDigest, "completed trial receipt digest");
  const { completionDigest, ...body } = options.receipt;
  if (canonicalDigest(body) !== completionDigest) {
    throw new Error("completed trial receipt digest is invalid");
  }
  const expected = createCompletedTrialReceipt({
    plan: options.plan,
    planWitness: options.planWitness,
    witnessAuthority: options.witnessAuthority,
    expectedWitnessTrustRootDigest: options.expectedWitnessTrustRootDigest,
    slotId: options.slotId,
    trial: options.trial,
    ledger: options.ledger,
    profile: options.profile,
    completedAt: options.receipt.completedAt,
    portfolioPolicy: options.portfolioPolicy,
    expectedPortfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
    evidencePolicy: options.evidencePolicy,
    expectedEvidencePolicyDigest: options.expectedEvidencePolicyDigest,
  });
  if (canonicalJson(expected) !== canonicalJson(options.receipt)) {
    throw new Error("completed trial receipt does not match its exact evidence bundle");
  }
  return deepFreeze({
    valid: true,
    completionDigest,
    slotId: options.receipt.slotId,
    profileKey: options.receipt.profileKey,
  });
}

function validateMemberShape(member) {
  exactKeys(member, ["receipt", "trial", "ledger", "profile"], "portfolio member bundle");
  return member;
}

function roundedRatio(value, total) {
  return total === 0 ? 0 : Math.round((value / total) * 1e12) / 1e12;
}

function failedMetricGates(metric, complete, policy) {
  const failures = [];
  if (!complete) failures.push("complete-cohort");
  if (metric.completedTasks < policy.minimumCompletedTrials) failures.push("minimum-completed-trials");
  if (metric.wins < policy.taskOutcomeThreshold.minimumWins) failures.push("minimum-task-wins");
  if (metric.taskWinRate < policy.taskOutcomeThreshold.minimumWinRate) {
    failures.push("minimum-task-win-rate");
  }
  if (metric.losses > policy.taskOutcomeThreshold.maximumLosses) failures.push("maximum-task-losses");
  if (metric.criticalRegressions > policy.taskOutcomeThreshold.maximumCriticalRegressions) {
    failures.push("maximum-critical-regressions");
  }
  if (metric.worstTaskCriticalRegression) failures.push("worst-task-critical-regression");
  return failures;
}

function duplicateIdentitySets(receipts) {
  const fields = [
    "slotId",
    "trialId",
    "trialDigest",
    "ledgerDigest",
    "profileDigest",
    "completionDigest",
  ];
  for (const field of fields) assertUnique(receipts.map((receipt) => receipt[field]), `portfolio ${field}s`);
  assertUnique(
    receipts.map((receipt) => receipt.taskDefinition.digest),
    "portfolio completed task definition digests",
  );
}

export function reduceTrialPortfolio(options = {}) {
  exactKeys(options, [
    "plan",
    "planWitness",
    "witnessAuthority",
    "expectedWitnessTrustRootDigest",
    "members",
    "generatedAt",
    "portfolioPolicy",
    "expectedPortfolioPolicyDigest",
    "evidencePolicy",
    "expectedEvidencePolicyDigest",
  ], "portfolio reduction input");
  const portfolioPolicy = validatePortfolioPolicy({
    policy: options.portfolioPolicy,
    expectedPolicyDigest: options.expectedPortfolioPolicyDigest,
  });
  verifyPortfolioPlan({
    plan: options.plan,
    policy: portfolioPolicy,
    expectedPolicyDigest: options.expectedPortfolioPolicyDigest,
  });
  const planWitness = verifyTrustedPlanWitness({
    plan: options.plan,
    planWitness: options.planWitness,
    witnessAuthority: options.witnessAuthority,
    expectedWitnessTrustRootDigest: options.expectedWitnessTrustRootDigest,
    expectedPortfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
  });
  if (!Array.isArray(options.members)) throw new TypeError("portfolio members must be an array");
  const verified = options.members.map((rawMember) => {
    const member = validateMemberShape(rawMember);
    verifyCompletedTrialReceipt({
      plan: options.plan,
      planWitness: options.planWitness,
      witnessAuthority: options.witnessAuthority,
      expectedWitnessTrustRootDigest: options.expectedWitnessTrustRootDigest,
      slotId: member.receipt.slotId,
      trial: member.trial,
      ledger: member.ledger,
      profile: member.profile,
      receipt: member.receipt,
      portfolioPolicy,
      expectedPortfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
      evidencePolicy: options.evidencePolicy,
      expectedEvidencePolicyDigest: options.expectedEvidencePolicyDigest,
    });
    return member;
  });
  duplicateIdentitySets(verified.map(({ receipt }) => receipt));
  const memberBySlot = new Map(verified.map((member) => [member.receipt.slotId, member]));
  const ordered = options.plan.taskSlots
    .filter(({ slotId }) => memberBySlot.has(slotId))
    .map(({ slotId }) => memberBySlot.get(slotId));
  if (ordered.length !== verified.length) {
    throw new Error("portfolio contains an unregistered member slot");
  }
  if (ordered.some(({ receipt }) => receipt.profileKey !== options.plan.profileKey)) {
    throw new Error("portfolio contains a cross-profile member");
  }
  const missingSlotIds = options.plan.taskSlots
    .filter(({ slotId }) => !memberBySlot.has(slotId))
    .map(({ slotId }) => slotId);
  const complete = missingSlotIds.length === 0;
  exactIso(options.generatedAt, "portfolio report generatedAt");
  if (ordered.some(({ receipt }) => new Date(receipt.completedAt) >= new Date(options.generatedAt))) {
    throw new Error("portfolio report must be generated after every member completion");
  }
  const members = ordered.map(({ receipt }) => ({
    slotId: receipt.slotId,
    trialDigest: receipt.trialDigest,
    ledgerDigest: receipt.ledgerDigest,
    profileDigest: receipt.profileDigest,
    taskDefinitionDigest: receipt.taskDefinition.digest,
    completionDigest: receipt.completionDigest,
  }));
  const diversityMetrics = options.plan.selectionRule.minimumDistinctValues.map(({ axis, count }) => {
    const values = new Set(ordered.map(({ receipt }) => {
      const slot = options.plan.taskSlots.find((candidate) => candidate.slotId === receipt.slotId);
      return slot.diversityValues.find((entry) => entry.axis === axis).value;
    }));
    return {
      axis,
      requiredDistinct: count,
      observedDistinct: values.size,
      passed: complete && values.size >= count,
    };
  });
  const variantMetrics = portfolioPolicy.candidateVariants.map((variant) => {
    const outcomes = ordered.map(({ receipt }) =>
      receipt.variantOutcomes.find((candidate) => candidate.variant === variant));
    const metric = {
      variant,
      completedTasks: outcomes.length,
      wins: outcomes.filter(({ outcomeAgainstRaw }) => outcomeAgainstRaw === "win").length,
      losses: outcomes.filter(({ outcomeAgainstRaw }) => outcomeAgainstRaw === "loss").length,
      ties: outcomes.filter(({ outcomeAgainstRaw }) => outcomeAgainstRaw === "tie").length,
      criticalRegressions: outcomes.filter(({ criticalRegression }) => criticalRegression).length,
      worstTaskCriticalRegression: outcomes.some(({ criticalRegression }) => criticalRegression),
      taskWinRate: 0,
      supportingCompletionDigests: ordered.map(({ receipt }) => receipt.completionDigest),
    };
    metric.taskWinRate = roundedRatio(metric.wins, metric.completedTasks);
    const failedGates = failedMetricGates(metric, complete, portfolioPolicy);
    return {
      ...metric,
      failedGates,
      passedEvidenceGate: complete && failedGates.length === 0,
    };
  });
  const candidatesPassingEvidenceGate = variantMetrics
    .filter(({ passedEvidenceGate }) => passedEvidenceGate)
    .map(({ variant }) => variant);
  const body = {
    schemaVersion: 1,
    id: `${options.plan.id}:report`,
    status: complete ? "complete" : "incomplete",
    protocolId: PROTOCOL_ID,
    planDigest: options.plan.planDigest,
    planWitnessDigest: planWitness.witnessDigest,
    planWitnessedAt: planWitness.witnessedAt,
    witnessAuthorityTrustRootDigest: planWitness.authorityTrustRootDigest,
    portfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
    adaptiveEvidencePolicyDigest: options.expectedEvidencePolicyDigest,
    profileIdentity: structuredClone(options.plan.profileIdentity),
    profileKey: options.plan.profileKey,
    requiredTaskCount: options.plan.taskSlots.length,
    completedTaskCount: ordered.length,
    missingSlotIds,
    members,
    diversityMetrics,
    variantMetrics,
    candidatesPassingEvidenceGate,
    caseComparisonAggregationAllowed: false,
    semanticVerificationRequired: true,
    reportingOnly: true,
    profilePromotionAllowed: false,
    lifecycleActionAllowed: false,
    activationRequestAllowed: false,
    authorityExpanded: false,
    generatedAt: options.generatedAt,
  };
  return deepFreeze({ ...body, reportDigest: canonicalDigest(body) });
}

export function verifyPortfolioReport(options = {}) {
  exactKeys(options, [
    "plan",
    "planWitness",
    "witnessAuthority",
    "expectedWitnessTrustRootDigest",
    "members",
    "report",
    "generatedAt",
    "portfolioPolicy",
    "expectedPortfolioPolicyDigest",
    "evidencePolicy",
    "expectedEvidencePolicyDigest",
  ], "portfolio report verification input");
  exactKeys(options.report, REPORT_KEYS, "portfolio report");
  digestString(options.report.reportDigest, "portfolio report digest");
  const { reportDigest, ...body } = options.report;
  if (canonicalDigest(body) !== reportDigest) throw new Error("portfolio report digest is invalid");
  const expected = reduceTrialPortfolio({
    plan: options.plan,
    planWitness: options.planWitness,
    witnessAuthority: options.witnessAuthority,
    expectedWitnessTrustRootDigest: options.expectedWitnessTrustRootDigest,
    members: options.members,
    generatedAt: options.generatedAt,
    portfolioPolicy: options.portfolioPolicy,
    expectedPortfolioPolicyDigest: options.expectedPortfolioPolicyDigest,
    evidencePolicy: options.evidencePolicy,
    expectedEvidencePolicyDigest: options.expectedEvidencePolicyDigest,
  });
  if (canonicalJson(expected) !== canonicalJson(options.report)) {
    throw new Error("portfolio report does not match its exact member evidence");
  }
  return deepFreeze({ valid: true, reportDigest, status: options.report.status });
}

const digestSchema = () => ({ type: "string", pattern: "^[a-f0-9]{64}$" });
const stringSchema = () => ({ type: "string", minLength: 1 });
const timestampSchema = () => ({ type: "string", format: "date-time" });
const closedObject = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  required,
  properties,
});
const profileIdentitySchema = () => closedObject({
  capabilityId: stringSchema(),
  taskClass: stringSchema(),
  modelFamily: stringSchema(),
  reasoningTier: stringSchema(),
  consequenceClass: stringSchema(),
  capabilityVersion: digestSchema(),
  environmentId: digestSchema(),
});
const taskDefinitionSchema = () => closedObject({
  id: stringSchema(),
  version: stringSchema(),
  digest: digestSchema(),
});

export function buildPortfolioSchemas() {
  const diversityValue = closedObject({ axis: stringSchema(), value: stringSchema() });
  const minimumDistinct = closedObject({
    axis: stringSchema(),
    count: { type: "integer", minimum: 2 },
  });
  const taskSlot = closedObject({
    slotId: stringSchema(),
    trialId: stringSchema(),
    taskDefinition: taskDefinitionSchema(),
    diversityValues: {
      type: "array",
      minItems: 2,
      uniqueItems: true,
      items: diversityValue,
    },
  });
  const selectionRule = closedObject({
    mode: { const: "exact-preregistered-set" },
    diversityAxes: { type: "array", minItems: 2, uniqueItems: true, items: stringSchema() },
    minimumDistinctValues: {
      type: "array",
      minItems: 2,
      uniqueItems: true,
      items: minimumDistinct,
    },
  });
  const plan = closedObject({
    schemaVersion: { const: 1 },
    id: stringSchema(),
    status: { const: "preregistered" },
    protocolId: { const: PROTOCOL_ID },
    profileIdentity: profileIdentitySchema(),
    profileKey: digestSchema(),
    policyDigest: digestSchema(),
    selectionRule,
    taskSlots: { type: "array", minItems: 2, uniqueItems: true, items: taskSlot },
    registeredAt: timestampSchema(),
    semanticVerificationRequired: { const: true },
    planDigest: digestSchema(),
  });
  const outcome = (variant) => closedObject({
    variant: { const: variant },
    outcomeAgainstRaw: { enum: ["win", "loss", "tie"] },
    criticalRegression: { type: "boolean" },
    proofLevel: { enum: [...ADMISSIBLE_EVIDENCE_LEVELS] },
    rowDigest: digestSchema(),
    artifactDigest: digestSchema(),
  });
  const completion = closedObject({
    schemaVersion: { const: 1 },
    id: stringSchema(),
    status: { const: "completed" },
    protocolId: { const: PROTOCOL_ID },
    planDigest: digestSchema(),
    planWitnessDigest: digestSchema(),
    planWitnessedAt: timestampSchema(),
    witnessAuthorityTrustRootDigest: digestSchema(),
    portfolioPolicyDigest: digestSchema(),
    adaptiveEvidencePolicyDigest: digestSchema(),
    profileIdentity: profileIdentitySchema(),
    profileKey: digestSchema(),
    slotId: stringSchema(),
    trialId: stringSchema(),
    trialDigest: digestSchema(),
    ledgerDigest: digestSchema(),
    profileDigest: digestSchema(),
    taskDefinition: taskDefinitionSchema(),
    comparisonPolicyDigest: digestSchema(),
    rawReference: closedObject({
      rowDigest: digestSchema(),
      artifactDigest: digestSchema(),
      criticalRegression: { type: "boolean" },
      proofLevel: { enum: [...ADMISSIBLE_EVIDENCE_LEVELS] },
    }),
    variantOutcomes: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      prefixItems: CANDIDATE_VARIANTS.map((variant) => outcome(variant)),
      items: false,
    },
    caseEvidenceDigest: digestSchema(),
    completedAt: timestampSchema(),
    semanticVerificationRequired: { const: true },
    reportingOnly: { const: true },
    authorityExpanded: { const: false },
    completionDigest: digestSchema(),
  });
  const memberReference = closedObject({
    slotId: stringSchema(),
    trialDigest: digestSchema(),
    ledgerDigest: digestSchema(),
    profileDigest: digestSchema(),
    taskDefinitionDigest: digestSchema(),
    completionDigest: digestSchema(),
  });
  const diversityMetric = closedObject({
    axis: stringSchema(),
    requiredDistinct: { type: "integer", minimum: 1 },
    observedDistinct: { type: "integer", minimum: 0 },
    passed: { type: "boolean" },
  });
  const variantMetric = (variant) => closedObject({
    variant: { const: variant },
    completedTasks: { type: "integer", minimum: 0 },
    wins: { type: "integer", minimum: 0 },
    losses: { type: "integer", minimum: 0 },
    ties: { type: "integer", minimum: 0 },
    criticalRegressions: { type: "integer", minimum: 0 },
    worstTaskCriticalRegression: { type: "boolean" },
    taskWinRate: { type: "number", minimum: 0, maximum: 1 },
    supportingCompletionDigests: { type: "array", uniqueItems: true, items: digestSchema() },
    failedGates: { type: "array", uniqueItems: true, items: stringSchema() },
    passedEvidenceGate: { type: "boolean" },
  });
  const report = closedObject({
    schemaVersion: { const: 1 },
    id: stringSchema(),
    status: { enum: ["incomplete", "complete"] },
    protocolId: { const: PROTOCOL_ID },
    planDigest: digestSchema(),
    planWitnessDigest: digestSchema(),
    planWitnessedAt: timestampSchema(),
    witnessAuthorityTrustRootDigest: digestSchema(),
    portfolioPolicyDigest: digestSchema(),
    adaptiveEvidencePolicyDigest: digestSchema(),
    profileIdentity: profileIdentitySchema(),
    profileKey: digestSchema(),
    requiredTaskCount: { type: "integer", minimum: 2 },
    completedTaskCount: { type: "integer", minimum: 0 },
    missingSlotIds: { type: "array", uniqueItems: true, items: stringSchema() },
    members: { type: "array", items: memberReference },
    diversityMetrics: { type: "array", minItems: 1, items: diversityMetric },
    variantMetrics: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      prefixItems: CANDIDATE_VARIANTS.map((variant) => variantMetric(variant)),
      items: false,
    },
    candidatesPassingEvidenceGate: {
      type: "array",
      uniqueItems: true,
      items: { enum: [...CANDIDATE_VARIANTS] },
    },
    caseComparisonAggregationAllowed: { const: false },
    semanticVerificationRequired: { const: true },
    reportingOnly: { const: true },
    profilePromotionAllowed: { const: false },
    lifecycleActionAllowed: { const: false },
    activationRequestAllowed: { const: false },
    authorityExpanded: { const: false },
    generatedAt: timestampSchema(),
    reportDigest: digestSchema(),
  });
  report.allOf = [
    {
      if: {
        properties: { status: { const: "complete" } },
        required: ["status"],
      },
      then: {
        properties: { missingSlotIds: { maxItems: 0 } },
      },
    },
    {
      if: {
        properties: { status: { const: "incomplete" } },
        required: ["status"],
      },
      then: {
        properties: {
          missingSlotIds: { minItems: 1 },
          candidatesPassingEvidenceGate: { maxItems: 0 },
          variantMetrics: {
            not: {
              contains: {
                type: "object",
                properties: { passedEvidenceGate: { const: true } },
                required: ["passedEvidenceGate"],
              },
            },
          },
        },
      },
    },
  ];
  const meta = (id, schema, comment) => deepFreeze({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://eternities.ai/schemas/adaptive-evidence-portfolio-v1/${id}.schema.json`,
    title: `Adaptive Evidence Portfolio v1 ${id}`,
    $comment: comment,
    ...schema,
  });
  return deepFreeze({
    plan: meta(
      "plan",
      plan,
      "Structural validation only. verifyPortfolioPlan is required for digest, cross-field axis, diversity, and policy semantics.",
    ),
    completion: meta(
      "completion",
      completion,
      "Structural validation only. verifyCompletedTrialReceipt is required against the exact plan, trial, ledger, profile, and policies.",
    ),
    report: meta(
      "report",
      report,
      "Structural validation only. verifyPortfolioReport is required to recompute membership, counts, gates, digests, and cross-field consistency.",
    ),
    witness: buildPortfolioWitnessSchema(),
  });
}
