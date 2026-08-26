function scoreFor(evaluation, kind) {
  const score = evaluation?.kindScores?.[kind]?.score;
  return typeof score === "number" ? score : 0;
}

function validatePolicy(policy) {
  if (policy?.schemaVersion !== 1) throw new Error("promotion policy schemaVersion must be 1");
  if (!Array.isArray(policy.improvementDimensions)) {
    throw new Error("promotion policy improvementDimensions must be an array");
  }
  if (policy.kindMinimums === null || typeof policy.kindMinimums !== "object") {
    throw new Error("promotion policy kindMinimums must be an object");
  }
}

function measuredImprovements(baseline, candidate, policy) {
  const allowed = new Set(policy.improvementDimensions);
  const improvements = new Set(
    (candidate.improvements ?? []).filter((dimension) => allowed.has(dimension)),
  );
  if (allowed.has("score") && candidate.score > baseline.score) improvements.add("score");
  if (
    allowed.has("tokenCount") &&
    Number.isInteger(candidate.tokenCount) &&
    Number.isInteger(baseline.tokenCount) &&
    candidate.tokenCount < baseline.tokenCount
  ) {
    improvements.add("tokenCount");
  }
  for (const kind of Object.keys(policy.kindMinimums)) {
    if (allowed.has(kind) && scoreFor(candidate, kind) > scoreFor(baseline, kind)) {
      improvements.add(kind);
    }
  }
  return [...improvements].sort((left, right) => left.localeCompare(right));
}

export function decidePromotion({ baseline, candidate, policy }) {
  validatePolicy(policy);
  if (candidate === null || candidate === undefined) {
    return {
      schemaVersion: 1,
      status: "experimental",
      failedGates: [],
      improvements: [],
      reasons: ["candidate evaluation is absent"],
    };
  }
  if (baseline === null || baseline === undefined) {
    return {
      schemaVersion: 1,
      status: "unverified",
      failedGates: [],
      improvements: [],
      reasons: ["executable baseline evidence is absent"],
    };
  }

  const failedGates = [];
  if (
    policy.requireAllCritical &&
    candidate.criticalPassed !== candidate.criticalTotal
  ) {
    failedGates.push("all-critical");
  }
  if (
    candidate.criticalTotal < baseline.criticalTotal ||
    candidate.criticalPassed < baseline.criticalPassed
  ) {
    failedGates.push("critical-regression");
  }
  if (typeof candidate.score !== "number" || candidate.score < policy.minimumScore) {
    failedGates.push("minimum-score");
  }
  for (const [kind, minimum] of Object.entries(policy.kindMinimums)) {
    if (scoreFor(candidate, kind) < minimum) failedGates.push(`kind:${kind}`);
  }
  if (
    !Number.isInteger(candidate.tokenCount) ||
    candidate.tokenCount > policy.maximumTokenCount
  ) {
    failedGates.push("token-budget");
  }
  if (
    policy.requireResolvedEffects &&
    (!Array.isArray(candidate.unresolvedEffects) || candidate.unresolvedEffects.length > 0)
  ) {
    failedGates.push("resolved-effects");
  }

  const improvements = measuredImprovements(baseline, candidate, policy);
  if (failedGates.length > 0) {
    return {
      schemaVersion: 1,
      status: "blocked",
      failedGates,
      improvements,
      reasons: failedGates.map((gate) => `promotion gate failed: ${gate}`),
    };
  }
  if (policy.requireImprovement && improvements.length === 0) {
    return {
      schemaVersion: 1,
      status: "unverified",
      failedGates: [],
      improvements: [],
      reasons: ["no policy-listed improvement is measured against the baseline"],
    };
  }
  return {
    schemaVersion: 1,
    status: "promoted",
    failedGates: [],
    improvements,
    reasons: ["all promotion gates passed with measured improvement"],
  };
}
