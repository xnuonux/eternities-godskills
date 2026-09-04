import { canonicalJson } from "./capability-layer-abi.mjs";
import { sha256 } from "./io.mjs";

export const GODSKILL_ADAPTER_CONFORMANCE_ID = "eternities-godskill-adapter-conformance-v1";
export const GODSKILL_ADAPTER_CONFORMANCE_SCHEMA_VERSION = 1;

export const ADAPTER_HOST_FAMILIES = Object.freeze([
  "claude-code",
  "codex",
  "godagents",
  "local-model",
  "mcp",
]);

const ADAPTER_REASONS = new Set([
  "protocol-equivalent",
  "effect-narrowed",
  "package-protocol-unsupported",
  "protocol-version-unsupported",
  "secrets-not-isolated",
]);
const REASON_CODES = Object.freeze([...ADAPTER_REASONS].sort());
const EFFECTS = new Set(["execute", "external-write", "network", "read", "write"]);
const REASONING_TIERS = new Set(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]);
const PROJECTION_STATUSES = new Set(["conformant", "unsupported"]);
const PROJECTION_KEYS = Object.freeze([
  "schemaVersion",
  "conformanceId",
  "hostFamily",
  "status",
  "reasonCodes",
  "hostProfile",
  "decision",
  "normalizedDecisionDigest",
  "digest",
]);
const HOST_KEYS = Object.freeze([
  "hostFamily",
  "hostVersion",
  "modelFamily",
  "reasoningTier",
  "contextBudget",
  "reviewAvailable",
  "availableEffects",
  "supportsPackageProtocol",
  "supportsProtocolVersion",
  "secretsOutsidePayload",
]);
const MISSION_KEYS = Object.freeze([
  "missionId",
  "objectiveDigest",
  "packageReceiptDigest",
  "packageDigest",
  "capabilityId",
  "capabilityVersion",
  "requestedEffects",
]);
const DECISION_KEYS = Object.freeze([
  "missionId",
  "objectiveDigest",
  "packageReceiptDigest",
  "packageDigest",
  "capabilityId",
  "capabilityVersion",
  "requestedEffects",
  "grantedEffects",
  "activationMode",
  "disclosureLayer",
  "rawContentStored",
]);
const FIXTURE_KEYS = Object.freeze([
  "schemaVersion",
  "conformanceId",
  "fixtureId",
  "protocolReceiptDigest",
  "packageReceiptDigest",
  "packageDigest",
  "capabilityId",
  "capabilityVersion",
  "missionId",
  "objectiveDigest",
  "requestedEffects",
  "hostFamilies",
  "projections",
  "semanticDecision",
  "normalizedDecisionDigest",
  "digest",
]);

const RAW_FIELD_NAMES = new Set([
  "prompt",
  "rawPrompt",
  "missionText",
  "rawMissionText",
  "content",
  "rawContent",
  "artifactBody",
  "responseBody",
  "credentials",
  "secret",
  "privateKey",
  "notes",
]);

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(label + " must be an object");
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(label + " keys are not closed");
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(label + " must be an object");
  return value;
}

function identifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    throw new TypeError(label + " must be a bounded neutral identifier");
  }
  return value;
}

function digest(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new TypeError(label + " must be a lowercase SHA-256 digest");
  return value;
}

function boundedString(value, label, maximum = 128) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum || /[\r\n\0]/.test(value)) {
    throw new TypeError(label + " must be bounded text without control delimiters");
  }
  return value;
}

function integer(value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new TypeError(label + " must be a bounded integer");
  return value;
}

function enumValue(value, allowed, label) {
  if (!allowed.has(value)) throw new Error(label + " is unsupported");
  return value;
}

function sortedStringArray(value, label, allowed, maximum = 64, allowEmpty = false) {
  if (!Array.isArray(value) || value.length > maximum || (!allowEmpty && value.length === 0)) throw new TypeError(label + " must be a bounded string array");
  for (const item of value) {
    boundedString(item, label);
    enumValue(item, allowed, label + " value");
  }
  const sorted = [...value].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  if (JSON.stringify(sorted) !== JSON.stringify(value)) throw new Error(label + " must be in canonical order");
  if (new Set(value).size !== value.length) throw new Error(label + " contains a duplicate");
  return value;
}

function rejectRawFields(value, label = "conformance input", seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const nested of value) rejectRawFields(nested, label, seen);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (RAW_FIELD_NAMES.has(key)) throw new Error(label + " contains forbidden raw-content field " + key);
    rejectRawFields(nested, label, seen);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function validateHost(host) {
  exactKeys(host, HOST_KEYS, "host profile");
  enumValue(host.hostFamily, new Set(ADAPTER_HOST_FAMILIES), "host family");
  boundedString(host.hostVersion, "host version");
  boundedString(host.modelFamily, "model family");
  enumValue(host.reasoningTier, REASONING_TIERS, "reasoning tier");
  integer(host.contextBudget, "host context budget", 1, 1000000);
  if (typeof host.reviewAvailable !== "boolean") throw new TypeError("review availability must be boolean");
  sortedStringArray(host.availableEffects, "host available effects", EFFECTS, 5, true);
  if (typeof host.supportsPackageProtocol !== "boolean") throw new TypeError("package protocol support must be boolean");
  integer(host.supportsProtocolVersion, "host protocol version", 0, 32);
  if (typeof host.secretsOutsidePayload !== "boolean") throw new TypeError("secret isolation must be boolean");
  return host;
}

function validateMission(mission) {
  exactKeys(mission, MISSION_KEYS, "mission input");
  identifier(mission.missionId, "mission id");
  digest(mission.objectiveDigest, "objective digest");
  digest(mission.packageReceiptDigest, "package receipt digest");
  digest(mission.packageDigest, "package digest");
  identifier(mission.capabilityId, "capability id");
  integer(mission.capabilityVersion, "capability version", 1);
  sortedStringArray(mission.requestedEffects, "requested effects", EFFECTS, 5, false);
  return mission;
}

function validateDecision(decision) {
  exactKeys(decision, DECISION_KEYS, "semantic decision");
  identifier(decision.missionId, "decision mission id");
  digest(decision.objectiveDigest, "decision objective digest");
  digest(decision.packageReceiptDigest, "decision package receipt digest");
  digest(decision.packageDigest, "decision package digest");
  identifier(decision.capabilityId, "decision capability id");
  integer(decision.capabilityVersion, "decision capability version", 1);
  sortedStringArray(decision.requestedEffects, "decision requested effects", EFFECTS, 5, false);
  sortedStringArray(decision.grantedEffects, "decision granted effects", EFFECTS, 5, true);
  for (const effect of decision.grantedEffects) {
    if (!decision.requestedEffects.includes(effect)) throw new Error("semantic decision widened effects");
  }
  if (decision.activationMode !== "guardrail" || decision.disclosureLayer !== "guardrails") throw new Error("decision activation is not the canonical bounded mode");
  if (decision.rawContentStored !== false) throw new Error("semantic decision cannot store raw content");
  return decision;
}

function unsignedProjection(projection) {
  const { digest: ignoredDigest, ...unsigned } = projection;
  void ignoredDigest;
  return unsigned;
}

function projectionDigest(projection) {
  return sha256(canonicalJson(unsignedProjection(projection)));
}

function validateProjection(projection) {
  exactKeys(projection, PROJECTION_KEYS, "host projection");
  if (projection.schemaVersion !== GODSKILL_ADAPTER_CONFORMANCE_SCHEMA_VERSION
      || projection.conformanceId !== GODSKILL_ADAPTER_CONFORMANCE_ID) {
    throw new Error("host projection identity is invalid");
  }
  enumValue(projection.hostFamily, new Set(ADAPTER_HOST_FAMILIES), "projection host family");
  enumValue(projection.status, PROJECTION_STATUSES, "projection status");
  sortedStringArray(projection.reasonCodes, "projection reason codes", ADAPTER_REASONS, 5, false);
  validateHost(projection.hostProfile);
  if (projection.hostProfile.hostFamily !== projection.hostFamily) throw new Error("projection host identity drifted");
  if (projection.status === "conformant") {
    validateDecision(projection.decision);
    digest(projection.normalizedDecisionDigest, "normalized decision digest");
    if (projection.normalizedDecisionDigest !== sha256(canonicalJson(projection.decision))) {
      throw new Error("normalized decision digest does not match the decision");
    }
    if (projection.reasonCodes.includes("package-protocol-unsupported")
        || projection.reasonCodes.includes("protocol-version-unsupported")
        || projection.reasonCodes.includes("secrets-not-isolated")) {
      throw new Error("unsupported host cannot be marked conformant");
    }
  } else {
    if (projection.decision !== null || projection.normalizedDecisionDigest !== null) throw new Error("unsupported projection cannot carry a decision");
  }
  digest(projection.digest, "host projection digest");
  if (projectionDigest(projection) !== projection.digest) throw new Error("host projection digest does not match its body");
  return projection;
}

export function buildHostProjection(input) {
  object(input, "host projection input");
  rejectRawFields(input);
  exactKeys(input, ["host", "mission"], "host projection input");
  const { host, mission } = input;
  validateHost(host);
  validateMission(mission);
  const unsupportedReasons = [];
  if (!host.supportsPackageProtocol) unsupportedReasons.push("package-protocol-unsupported");
  if (host.supportsProtocolVersion !== GODSKILL_ADAPTER_CONFORMANCE_SCHEMA_VERSION) unsupportedReasons.push("protocol-version-unsupported");
  if (!host.secretsOutsidePayload) unsupportedReasons.push("secrets-not-isolated");
  const grantedEffects = mission.requestedEffects.filter((effect) => host.availableEffects.includes(effect));
  const reasonCodes = [...unsupportedReasons];
  if (grantedEffects.length !== mission.requestedEffects.length) reasonCodes.push("effect-narrowed");
  if (reasonCodes.length === 0) reasonCodes.push("protocol-equivalent");
  reasonCodes.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const status = unsupportedReasons.length === 0 ? "conformant" : "unsupported";
  const decision = status === "conformant" ? {
    missionId: mission.missionId,
    objectiveDigest: mission.objectiveDigest,
    packageReceiptDigest: mission.packageReceiptDigest,
    packageDigest: mission.packageDigest,
    capabilityId: mission.capabilityId,
    capabilityVersion: mission.capabilityVersion,
    requestedEffects: [...mission.requestedEffects],
    grantedEffects,
    activationMode: "guardrail",
    disclosureLayer: "guardrails",
    rawContentStored: false,
  } : null;
  const unsigned = {
    schemaVersion: GODSKILL_ADAPTER_CONFORMANCE_SCHEMA_VERSION,
    conformanceId: GODSKILL_ADAPTER_CONFORMANCE_ID,
    hostFamily: host.hostFamily,
    status,
    reasonCodes,
    hostProfile: { ...host },
    decision,
    normalizedDecisionDigest: decision === null ? null : sha256(canonicalJson(decision)),
  };
  return deepFreeze({ ...unsigned, digest: projectionDigest(unsigned) });
}

export function normalizeConformanceDecision(projection) {
  rejectRawFields(projection, "projection normalization");
  validateProjection(projection);
  if (projection.status !== "conformant") throw new Error("unsupported projection has no semantic decision");
  return deepFreeze({ ...projection.decision });
}

function unsignedFixture(fixture) {
  const { digest: ignoredDigest, ...unsigned } = fixture;
  void ignoredDigest;
  return unsigned;
}

function fixtureDigest(fixture) {
  return sha256(canonicalJson(unsignedFixture(fixture)));
}

function validateFixture(fixture) {
  exactKeys(fixture, FIXTURE_KEYS, "conformance fixture");
  if (fixture.schemaVersion !== GODSKILL_ADAPTER_CONFORMANCE_SCHEMA_VERSION
      || fixture.conformanceId !== GODSKILL_ADAPTER_CONFORMANCE_ID) throw new Error("conformance fixture identity is invalid");
  identifier(fixture.fixtureId, "fixture id");
  digest(fixture.protocolReceiptDigest, "fixture protocol receipt digest");
  digest(fixture.packageReceiptDigest, "fixture package receipt digest");
  digest(fixture.packageDigest, "fixture package digest");
  identifier(fixture.capabilityId, "fixture capability id");
  integer(fixture.capabilityVersion, "fixture capability version", 1);
  identifier(fixture.missionId, "fixture mission id");
  digest(fixture.objectiveDigest, "fixture objective digest");
  sortedStringArray(fixture.requestedEffects, "fixture requested effects", EFFECTS, 5, false);
  if (JSON.stringify(fixture.hostFamilies) !== JSON.stringify([...ADAPTER_HOST_FAMILIES].sort())) throw new Error("fixture host families are not canonical");
  if (!Array.isArray(fixture.projections) || fixture.projections.length !== ADAPTER_HOST_FAMILIES.length) throw new TypeError("fixture projections must contain every host family");
  if (JSON.stringify(fixture.projections.map((projection) => projection.hostFamily))
      !== JSON.stringify(fixture.hostFamilies)) throw new Error("fixture projections are not in canonical host order");
  const seen = new Set();
  for (const projection of fixture.projections) {
    validateProjection(projection);
    if (seen.has(projection.hostFamily)) throw new Error("fixture contains a duplicate host family");
    seen.add(projection.hostFamily);
    if (projection.status !== "conformant") throw new Error("fixture cannot contain an unsupported host");
    if (projection.decision.missionId !== fixture.missionId
        || projection.decision.objectiveDigest !== fixture.objectiveDigest
        || projection.decision.packageReceiptDigest !== fixture.packageReceiptDigest
        || projection.decision.packageDigest !== fixture.packageDigest
        || projection.decision.capabilityId !== fixture.capabilityId
        || projection.decision.capabilityVersion !== fixture.capabilityVersion
        || canonicalJson(projection.decision.requestedEffects) !== canonicalJson(fixture.requestedEffects)) {
      throw new Error("fixture projection mission binding drifted");
    }
  }
  if (seen.size !== ADAPTER_HOST_FAMILIES.length) throw new Error("fixture is missing a host family");
  validateDecision(fixture.semanticDecision);
  digest(fixture.normalizedDecisionDigest, "fixture normalized decision digest");
  if (fixture.normalizedDecisionDigest !== sha256(canonicalJson(fixture.semanticDecision))) throw new Error("fixture normalized decision digest does not match");
  for (const projection of fixture.projections) {
    if (projection.normalizedDecisionDigest !== fixture.normalizedDecisionDigest) throw new Error("host projections are not semantically equivalent");
  }
  digest(fixture.digest, "conformance fixture digest");
  if (fixtureDigest(fixture) !== fixture.digest) throw new Error("conformance fixture digest does not match its body");
  return fixture;
}

export function buildConformanceFixture(input) {
  object(input, "conformance fixture input");
  rejectRawFields(input);
  exactKeys(input, ["protocolReceiptDigest", "packageReceiptDigest", "packageDigest", "capabilityId", "capabilityVersion", "missionId", "objectiveDigest", "requestedEffects", "hosts"], "conformance fixture input");
  const {
    protocolReceiptDigest,
    packageReceiptDigest,
    packageDigest,
    capabilityId,
    capabilityVersion,
    missionId,
    objectiveDigest,
    requestedEffects,
    hosts,
  } = input;
  digest(protocolReceiptDigest, "fixture protocol receipt digest");
  digest(packageReceiptDigest, "fixture package receipt digest");
  digest(packageDigest, "fixture package digest");
  identifier(capabilityId, "fixture capability id");
  integer(capabilityVersion, "fixture capability version", 1);
  identifier(missionId, "fixture mission id");
  digest(objectiveDigest, "fixture objective digest");
  sortedStringArray(requestedEffects, "fixture requested effects", EFFECTS, 5, false);
  if (!Array.isArray(hosts) || hosts.length !== ADAPTER_HOST_FAMILIES.length) throw new TypeError("fixture hosts must contain every host family");
  const mission = {
    missionId,
    objectiveDigest,
    packageReceiptDigest,
    packageDigest,
    capabilityId,
    capabilityVersion,
    requestedEffects: [...requestedEffects],
  };
  const projections = hosts.map((host) => buildHostProjection({ host, mission }))
    .sort((left, right) => (left.hostFamily < right.hostFamily ? -1 : left.hostFamily > right.hostFamily ? 1 : 0));
  const semanticDecision = normalizeConformanceDecision(projections[0]);
  const normalizedDecisionDigest = sha256(canonicalJson(semanticDecision));
  const unsigned = {
    schemaVersion: GODSKILL_ADAPTER_CONFORMANCE_SCHEMA_VERSION,
    conformanceId: GODSKILL_ADAPTER_CONFORMANCE_ID,
    fixtureId: "provider-neutral-five-host-reference",
    protocolReceiptDigest,
    packageReceiptDigest,
    packageDigest,
    capabilityId,
    capabilityVersion,
    missionId,
    objectiveDigest,
    requestedEffects: [...requestedEffects],
    hostFamilies: [...ADAPTER_HOST_FAMILIES].sort(),
    projections,
    semanticDecision,
    normalizedDecisionDigest,
  };
  return deepFreeze({ ...unsigned, digest: fixtureDigest(unsigned) });
}

export function verifyConformanceFixture(fixture, options = {}) {
  rejectRawFields(fixture, "conformance fixture verification");
  validateFixture(fixture);
  object(options, "conformance verification options");
  rejectRawFields(options, "conformance verification options");
  if (Object.keys(options).some((key) => !["expectedProtocolReceiptDigest", "expectedPackageReceiptDigest"].includes(key))) {
    throw new Error("conformance verification options are not closed");
  }
  if (options.expectedProtocolReceiptDigest !== undefined
      && fixture.protocolReceiptDigest !== options.expectedProtocolReceiptDigest) throw new Error("conformance protocol root is stale");
  if (options.expectedPackageReceiptDigest !== undefined
      && fixture.packageReceiptDigest !== options.expectedPackageReceiptDigest) throw new Error("conformance package root is stale");
  return Object.freeze({
    valid: true,
    conformanceId: fixture.conformanceId,
    fixtureId: fixture.fixtureId,
    hostFamilies: Object.freeze([...fixture.hostFamilies]),
    normalizedDecisionDigest: fixture.normalizedDecisionDigest,
    projectionCount: fixture.projections.length,
    rawContentStored: false,
  });
}
