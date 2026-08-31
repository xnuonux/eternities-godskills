import { sha256 } from "./io.mjs";

const EXPECTED_MODES = ["native", "guardrail", "method", "review"];
const DISCLOSURE = Object.freeze({
  native: "none",
  guardrail: "guardrails-only",
  method: "entrypoint-and-contract",
  review: "none",
});

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]));
  }
  return value;
}

function digest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
}

function finiteInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
}

function validatePolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy) || policy.schemaVersion !== 1) {
    throw new TypeError("activation policy must use schema version 1");
  }
  if (JSON.stringify(policy.modes) !== JSON.stringify(EXPECTED_MODES)) {
    throw new Error("activation policy mode set is invalid");
  }
  const threshold = policy.methodEvidence;
  if (!threshold || !Number.isInteger(threshold.minimumMatchedEvaluations)
      || !Number.isInteger(threshold.minimumWins)
      || typeof threshold.minimumWinRate !== "number"
      || !Number.isInteger(threshold.maximumCriticalRegressions)
      || typeof threshold.maximumOverheadRatio !== "number") {
    throw new TypeError("activation policy method evidence thresholds are invalid");
  }
  return policy;
}

function validateTask(task, policy) {
  if (!task || typeof task !== "object" || Array.isArray(task)) throw new TypeError("activation task is required");
  if (!policy.taskClasses.includes(task.taskClass)) throw new Error(`activation task class is invalid: ${task.taskClass}`);
  if (!policy.consequenceClasses.includes(task.consequenceClass)) {
    throw new Error(`activation consequence class is invalid: ${task.consequenceClass}`);
  }
  const authority = task.authorityProjection;
  if (!authority || !Array.isArray(authority.availableAuthority) || !Array.isArray(authority.permittedEffects)) {
    throw new TypeError("activation authority projection is incomplete");
  }
  return task;
}

function profileFor(evidence, selectedId, taskClass) {
  if (evidence === null || evidence === undefined) return { evidence: null, profile: null };
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || evidence.reviewed !== true) {
    throw new Error("activation evidence must be reviewed");
  }
  if (!Array.isArray(evidence.profiles)) throw new TypeError("activation evidence profiles must be an array");
  const matches = evidence.profiles.filter((profile) =>
    profile.capabilityId === selectedId && profile.taskClass === taskClass);
  if (matches.length > 1) throw new Error("activation evidence contains duplicate matching profiles");
  return { evidence, profile: matches[0] ?? null };
}

function evaluateMethod(profile, threshold) {
  if (!profile) {
    return {
      eligible: false,
      matchedEvaluations: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      criticalRegressions: 0,
      overheadRatio: null,
      failedGates: ["reviewed-task-class-evidence"],
    };
  }
  for (const field of ["matchedEvaluations", "wins", "losses", "ties", "criticalRegressions"]) {
    finiteInteger(profile[field], `profile.${field}`);
  }
  if (profile.wins + profile.losses + profile.ties !== profile.matchedEvaluations) {
    throw new Error("activation evidence profile totals are contradictory");
  }
  const overhead = profile.maximumObservedOverheadRatio;
  if (overhead !== null && (typeof overhead !== "number" || !Number.isFinite(overhead) || overhead <= 0)) {
    throw new TypeError("profile.maximumObservedOverheadRatio must be null or a positive number");
  }
  const winRate = profile.matchedEvaluations === 0 ? 0 : profile.wins / profile.matchedEvaluations;
  const gates = {
    matchedEvaluations: profile.matchedEvaluations >= threshold.minimumMatchedEvaluations,
    wins: profile.wins >= threshold.minimumWins,
    winRate: winRate >= threshold.minimumWinRate,
    criticalRegressions: profile.criticalRegressions <= threshold.maximumCriticalRegressions,
    overhead: overhead !== null && overhead <= threshold.maximumOverheadRatio,
  };
  const failedGates = Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => name);
  const eligible = failedGates.length === 0;
  if (typeof profile.methodEligible !== "boolean" || profile.methodEligible !== eligible) {
    throw new Error("activation evidence profile method eligibility is contradictory");
  }
  if (!EXPECTED_MODES.includes(profile.preferredMode)) throw new Error("activation evidence preferred mode is invalid");
  return {
    eligible,
    matchedEvaluations: profile.matchedEvaluations,
    wins: profile.wins,
    losses: profile.losses,
    ties: profile.ties,
    winRate,
    criticalRegressions: profile.criticalRegressions,
    overheadRatio: overhead,
    failedGates,
  };
}

export function compileActivationDecision({
  selectedId,
  task,
  explicitMethodRequest = false,
  reviewAvailable = false,
  profile: legacyProfile,
  policy,
  evidence = null,
} = {}) {
  nonEmpty(selectedId, "selectedId");
  validatePolicy(policy);
  validateTask(task, policy);
  if (typeof explicitMethodRequest !== "boolean" || typeof reviewAvailable !== "boolean") {
    throw new TypeError("activation flags must be boolean");
  }
  if (legacyProfile !== undefined) throw new Error("pass reviewed evidence rather than an unbound profile");

  const selectedEvidence = profileFor(evidence, selectedId, task.taskClass);
  const methodEvidence = evaluateMethod(selectedEvidence.profile, policy.methodEvidence);
  let mode;
  const reasonCodes = [];
  if (explicitMethodRequest) {
    mode = "method";
    reasonCodes.push("explicit-method-request");
  } else if (methodEvidence.eligible) {
    mode = "method";
    reasonCodes.push("matched-method-advantage");
  } else if (selectedEvidence.profile?.preferredMode === "review" && reviewAvailable) {
    mode = "review";
    reasonCodes.push("mixed-evidence-native-first", "review-phase-available");
  } else if (task.consequenceClass !== "low") {
    mode = "guardrail";
    reasonCodes.push(reviewAvailable ? "insufficient-method-evidence" : "review-unavailable", "consequence-guardrails");
  } else {
    mode = "native";
    reasonCodes.push(selectedEvidence.profile ? "native-floor-preferred" : "no-reviewed-method-advantage");
  }

  const unsigned = {
    schemaVersion: 1,
    selectedId,
    taskClass: task.taskClass,
    consequenceClass: task.consequenceClass,
    mode,
    reasonCodes,
    preInferenceDisclosure: DISCLOSURE[mode],
    deferredReview: mode === "review",
    methodEvidence,
    policyDigest: digest(policy),
    evidenceDigest: selectedEvidence.evidence ? digest(selectedEvidence.evidence) : null,
    authorityProjection: structuredClone(task.authorityProjection),
    authorityExpanded: false,
  };
  return deepFreeze({ ...unsigned, decisionDigest: digest(unsigned) });
}
