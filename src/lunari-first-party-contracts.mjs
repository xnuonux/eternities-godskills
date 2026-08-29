function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function result(reasons, extra = {}) {
  return { valid: reasons.length === 0, reasons, ...extra };
}

export function assessCoordinationLease({
  leases = [],
  key,
  owner,
  now,
  integrationStateAgeMs = 0,
  maxStateAgeMs = Number.POSITIVE_INFINITY,
} = {}) {
  const reasons = [];
  if (!nonEmpty(key)) reasons.push("missing-key");
  if (!nonEmpty(owner)) reasons.push("missing-owner");
  if (!Number.isFinite(now)) reasons.push("invalid-time");
  if (integrationStateAgeMs > maxStateAgeMs) reasons.push("stale-integration-state");
  const conflict = leases.find((lease) =>
    lease?.key === key
    && lease?.owner !== owner
    && Number.isFinite(lease?.expiresAt)
    && lease.expiresAt >= now);
  if (conflict) reasons.push("active-key-lease");
  return { accepted: reasons.length === 0, reasons, conflictOwner: conflict?.owner ?? null };
}

export function validateDelegationEnvelope(envelope = {}, { allowedEffects = [] } = {}) {
  const reasons = [];
  if (envelope.version !== 1) reasons.push("unsupported-version");
  for (const field of ["parentTraceId", "objective", "outputSchema", "termination"]) {
    if (!nonEmpty(envelope[field])) reasons.push(`missing-${field}`);
  }
  for (const field of ["inputArtifacts", "allowedEffects", "boundaries"]) {
    if (!nonEmptyArray(envelope[field])) reasons.push(`missing-${field}`);
  }
  if (!envelope.budget || typeof envelope.budget !== "object" || Array.isArray(envelope.budget)) reasons.push("missing-budget");
  const allowed = new Set(allowedEffects);
  for (const effect of envelope.allowedEffects ?? []) {
    if (!allowed.has(effect)) reasons.push(`over-authorized:${effect}`);
  }
  return result(reasons, { receiptParentTraceId: reasons.length === 0 ? envelope.parentTraceId : null });
}

export function validateDiagnosticState(packet = {}) {
  const reasons = [];
  if (!nonEmptyArray(packet.verifiedFoundations)) reasons.push("missing-verified-foundations");
  if (!Array.isArray(packet.eliminated)) reasons.push("missing-elimination-ledger");
  if (Array.isArray(packet.current) || !packet.current || typeof packet.current !== "object") {
    reasons.push("current-check-cardinality");
  } else {
    if (!nonEmpty(packet.current.hypothesisId) || !nonEmpty(packet.current.check)) reasons.push("incomplete-current-check");
    if ((packet.eliminated ?? []).some((row) => row?.hypothesisId === packet.current.hypothesisId)) reasons.push("eliminated-hypothesis-retried");
  }
  for (const row of packet.eliminated ?? []) {
    if (!nonEmpty(row?.hypothesisId) || !nonEmpty(row?.evidenceRef)) reasons.push("unbound-elimination");
  }
  return result([...new Set(reasons)]);
}

export function validateStaticRuleEvidence(proof = {}) {
  const reasons = [];
  if (proof.positiveDetected !== true) reasons.push("positive-fixture-not-detected");
  if (proof.cleanControlFlagged !== false) reasons.push("clean-control-not-clean");
  if (proof.outOfScopeRejected !== true) reasons.push("scope-boundary-unproved");
  if (proof.tamperDetected !== true) reasons.push("integrity-boundary-unproved");
  if (proof.outputIsolated !== true) reasons.push("output-isolation-unproved");
  return result(reasons);
}

export function assessPriorArt(finding = {}) {
  if (finding.overlapFound === true) {
    const proven = nonEmpty(finding.evidenceRecord) && nonEmpty(finding.locator);
    return { disposition: proven ? "refuted" : "inconclusive", reasons: proven ? [] : ["missing-exact-overlap-evidence"] };
  }
  const floorMet = Number.isFinite(finding.retrievalAttempts)
    && Number.isFinite(finding.retrievalFloor)
    && finding.retrievalAttempts >= finding.retrievalFloor;
  const sufficient = floorMet && finding.finalCorpusReviewed === true;
  return {
    disposition: sufficient ? "not-yet-refuted" : "inconclusive",
    reasons: sufficient ? [] : [!floorMet ? "retrieval-floor-not-met" : "final-corpus-not-reviewed"],
  };
}

export function assessExperimentClaim(claim = {}) {
  const criteria = [claim.independentMeasure, claim.intervention, claim.control, claim.errorAccounting];
  const calibrated = criteria.every((value) => value === true);
  return {
    disposition: calibrated ? "calibrated" : "inconclusive",
    reasons: calibrated ? [] : [claim.selfReport ? "self-report-is-not-criterion-evidence" : "criterion-validity-incomplete"],
  };
}

export function resolveRunState(run = {}) {
  if (Number.isFinite(run.toolRate) && Number.isFinite(run.toolRateLimit) && run.toolRate > run.toolRateLimit) {
    return { state: "paused", reason: "tool-rate-limit-exceeded" };
  }
  if (run.agentReportedComplete === true && run.verifierPassed !== true) {
    return { state: "errored", reason: "independent-verifier-failed" };
  }
  if (run.agentReportedComplete === true && run.verifierPassed === true) return { state: "complete", reason: null };
  return { state: "running", reason: null };
}

export function validateWritingPacket(packet = {}) {
  const reasons = [];
  if (!nonEmptyArray(packet.sourceLedger)) reasons.push("missing-source-ledger");
  if (!nonEmptyArray(packet.voiceConstraints)) reasons.push("missing-voice-constraints");
  if (!nonEmptyArray(packet.blueprint)) reasons.push("missing-blueprint");
  const requiredOrder = ["structure", "support", "voice", "provenance"];
  if (!Array.isArray(packet.revisionStages)
      || requiredOrder.some((stage, index) => packet.revisionStages[index] !== stage)) reasons.push("invalid-revision-order");
  for (const row of packet.sourceLedger ?? []) {
    if (!nonEmpty(row?.sourceId) || !nonEmpty(row?.claim)) reasons.push("unbound-source-claim");
  }
  return result([...new Set(reasons)]);
}

export function validateGoalProofLedger(ledger = []) {
  const reasons = [];
  if (!nonEmptyArray(ledger)) reasons.push("empty-claim-ledger");
  for (const claim of ledger ?? []) {
    if (!nonEmpty(claim?.claimId)) reasons.push("missing-claim-id");
    if (claim?.state === "complete" && (claim?.probe?.passed !== true || !nonEmpty(claim?.probe?.evidenceRef))) {
      reasons.push(`unproved-completion:${claim?.claimId ?? "unknown"}`);
    }
    if (claim?.coverage?.bounded === true && !nonEmpty(claim?.coverage?.limit)) {
      reasons.push(`undeclared-coverage-limit:${claim?.claimId ?? "unknown"}`);
    }
  }
  return result(reasons);
}

export function validateReleaseManifest(manifest = {}) {
  const reasons = [];
  if (!nonEmptyArray(manifest.items)) return result(["empty-release"]);
  const ids = new Set(manifest.items.map((item) => item?.id).filter(nonEmpty));
  for (const item of manifest.items) {
    if (!nonEmpty(item?.id) || !nonEmpty(item?.version)) reasons.push("incomplete-release-item");
    if (!nonEmpty(item?.verificationRef)) reasons.push(`unverified-item:${item?.id ?? "unknown"}`);
    if (!nonEmpty(item?.rollbackRef)) reasons.push(`missing-rollback:${item?.id ?? "unknown"}`);
    for (const dependency of item?.dependsOn ?? []) {
      if (!ids.has(dependency)) reasons.push(`unsatisfied-dependency:${item?.id ?? "unknown"}:${dependency}`);
    }
  }
  return result(reasons);
}
