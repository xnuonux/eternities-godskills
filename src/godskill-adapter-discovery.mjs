import { canonicalJson } from "./capability-layer-abi.mjs";
import {
  ADAPTER_SDK_HOST_FAMILIES,
  verifyCapabilityMatrix,
} from "./godskill-adapter-sdk.mjs";
import { sha256 } from "./io.mjs";

export const GODSKILL_ADAPTER_DISCOVERY_ID = "eternities-godskill-adapter-discovery-v1";
export const GODSKILL_ADAPTER_DISCOVERY_SCHEMA_VERSION = 1;

const EFFECTS = new Set(["execute", "external-write", "network", "read", "write"]);
const REASONING_TIERS = new Set(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]);
const DISCOVERY_STATUSES = new Set(["selected", "unsupported"]);
const MATRIX_STATUSES = new Set(["equivalent", "mixed", "unsupported"]);
const REASON_CODES = new Set(["selected-exact-profile", "host-profile-not-certified", "matrix-entry-unsupported"]);
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
const RESULT_UNSIGNED_KEYS = Object.freeze([
  "schemaVersion",
  "discoveryId",
  "matrixDigest",
  "matrixStatus",
  "hostProfileDigest",
  "hostFamily",
  "status",
  "reasonCodes",
  "adapterId",
  "adapterVersion",
  "descriptorDigest",
  "entryDigest",
  "projectionDigest",
  "normalizedDecisionDigest",
]);
const RESULT_KEYS = Object.freeze([...RESULT_UNSIGNED_KEYS, "digest"]);

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
  if (!Array.isArray(value) || value.length > maximum || (!allowEmpty && value.length === 0)) {
    throw new TypeError(label + " must be a bounded string array");
  }
  for (const item of value) {
    boundedString(item, label + " value");
    enumValue(item, allowed, label + " value");
  }
  const sorted = [...value].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  if (JSON.stringify(sorted) !== JSON.stringify(value)) throw new Error(label + " must be in canonical order");
  if (new Set(value).size !== value.length) throw new Error(label + " contains a duplicate");
  return value;
}

function rejectUnsafeValues(value, label = "discovery input", seen = new Set()) {
  if (typeof value === "function") throw new Error(label + " contains executable value");
  if (!value || typeof value !== "object" || seen.has(value)) return;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new Error(label + " contains non-plain data");
  seen.add(value);
  if (Array.isArray(value)) {
    for (const nested of value) rejectUnsafeValues(nested, label, seen);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (RAW_FIELD_NAMES.has(key)) throw new Error(label + " contains forbidden raw-content field " + key);
    rejectUnsafeValues(nested, label, seen);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function validateHostProfile(hostProfile) {
  exactKeys(hostProfile, HOST_KEYS, "discovery host profile");
  enumValue(hostProfile.hostFamily, new Set(ADAPTER_SDK_HOST_FAMILIES), "discovery host family");
  boundedString(hostProfile.hostVersion, "discovery host version");
  boundedString(hostProfile.modelFamily, "discovery model family");
  enumValue(hostProfile.reasoningTier, REASONING_TIERS, "discovery reasoning tier");
  integer(hostProfile.contextBudget, "discovery context budget", 1, 1000000);
  if (typeof hostProfile.reviewAvailable !== "boolean") throw new TypeError("discovery review availability must be boolean");
  sortedStringArray(hostProfile.availableEffects, "discovery available effects", EFFECTS, 5, true);
  if (typeof hostProfile.supportsPackageProtocol !== "boolean") throw new TypeError("discovery package protocol support must be boolean");
  integer(hostProfile.supportsProtocolVersion, "discovery protocol version", 0, 32);
  if (typeof hostProfile.secretsOutsidePayload !== "boolean") throw new TypeError("discovery secret isolation must be boolean");
  return hostProfile;
}

function unsignedResult(result) {
  const { digest: ignoredDigest, ...body } = result;
  void ignoredDigest;
  return body;
}

function resultDigest(result) {
  return sha256(canonicalJson(unsignedResult(result)));
}

function validateResult(result, matrix, hostProfile) {
  exactKeys(result, RESULT_KEYS, "adapter discovery result");
  rejectUnsafeValues(result, "adapter discovery result");
  if (result.schemaVersion !== GODSKILL_ADAPTER_DISCOVERY_SCHEMA_VERSION || result.discoveryId !== GODSKILL_ADAPTER_DISCOVERY_ID) {
    throw new Error("adapter discovery identity is invalid");
  }
  digest(result.matrixDigest, "discovery matrix digest");
  if (result.matrixDigest !== matrix.digest) throw new Error("discovery matrix binding drifted");
  enumValue(result.matrixStatus, MATRIX_STATUSES, "discovery matrix status");
  if (result.matrixStatus !== matrix.status) throw new Error("discovery matrix status drifted");
  digest(result.hostProfileDigest, "discovery host profile digest");
  if (result.hostProfileDigest !== sha256(canonicalJson(hostProfile))) throw new Error("discovery host profile binding drifted");
  enumValue(result.hostFamily, new Set(ADAPTER_SDK_HOST_FAMILIES), "discovery result host family");
  if (result.hostFamily !== hostProfile.hostFamily) throw new Error("discovery host family drifted");
  enumValue(result.status, DISCOVERY_STATUSES, "discovery status");
  sortedStringArray(result.reasonCodes, "discovery reason codes", REASON_CODES, 2, false);
  const matchingEntries = matrix.entries.filter((entry) => canonicalJson(entry.adapter.hostProfile) === canonicalJson(hostProfile));
  if (matchingEntries.length > 1) throw new Error("discovery matrix has ambiguous exact host profiles");
  const matchingEntry = matchingEntries[0] ?? null;
  if (result.status === "selected") {
    if (matchingEntry === null || matchingEntry.projection.status !== "conformant") throw new Error("selected discovery result has no conformant exact entry");
    if (canonicalJson(result.reasonCodes) !== canonicalJson(["selected-exact-profile"])) throw new Error("selected discovery reason is invalid");
    if (result.adapterId !== matchingEntry.adapter.adapterId
        || result.adapterVersion !== matchingEntry.adapter.adapterVersion
        || result.descriptorDigest !== matchingEntry.adapter.digest
        || result.entryDigest !== matchingEntry.digest
        || result.projectionDigest !== matchingEntry.projection.digest
        || result.normalizedDecisionDigest !== matchingEntry.projection.normalizedDecisionDigest) {
      throw new Error("selected discovery identity does not match the matrix entry");
    }
  } else {
    const expectedReason = matchingEntry === null ? "host-profile-not-certified" : "matrix-entry-unsupported";
    if (canonicalJson(result.reasonCodes) !== canonicalJson([expectedReason])) throw new Error("unsupported discovery reason is invalid");
    if (result.adapterId !== null
        || result.adapterVersion !== null
        || result.descriptorDigest !== null
        || result.entryDigest !== null
        || result.projectionDigest !== null
        || result.normalizedDecisionDigest !== null) {
      throw new Error("unsupported discovery result carries adapter identity");
    }
  }
  digest(result.digest, "discovery result digest");
  if (result.digest !== resultDigest(result)) throw new Error("discovery result digest does not match its body");
  return result;
}

export function discoverAdapter(input) {
  object(input, "adapter discovery input");
  rejectUnsafeValues(input, "adapter discovery input");
  exactKeys(input, ["matrix", "hostProfile"], "adapter discovery input");
  const { matrix, hostProfile } = input;
  verifyCapabilityMatrix(matrix);
  validateHostProfile(hostProfile);
  const matchingEntries = matrix.entries.filter((entry) => canonicalJson(entry.adapter.hostProfile) === canonicalJson(hostProfile));
  if (matchingEntries.length > 1) throw new Error("discovery matrix has ambiguous exact host profiles");
  const matchingEntry = matchingEntries[0] ?? null;
  const selected = matchingEntry !== null && matchingEntry.projection.status === "conformant";
  const body = {
    schemaVersion: GODSKILL_ADAPTER_DISCOVERY_SCHEMA_VERSION,
    discoveryId: GODSKILL_ADAPTER_DISCOVERY_ID,
    matrixDigest: matrix.digest,
    matrixStatus: matrix.status,
    hostProfileDigest: sha256(canonicalJson(hostProfile)),
    hostFamily: hostProfile.hostFamily,
    status: selected ? "selected" : "unsupported",
    reasonCodes: [selected ? "selected-exact-profile" : matchingEntry === null ? "host-profile-not-certified" : "matrix-entry-unsupported"],
    adapterId: selected ? matchingEntry.adapter.adapterId : null,
    adapterVersion: selected ? matchingEntry.adapter.adapterVersion : null,
    descriptorDigest: selected ? matchingEntry.adapter.digest : null,
    entryDigest: selected ? matchingEntry.digest : null,
    projectionDigest: selected ? matchingEntry.projection.digest : null,
    normalizedDecisionDigest: selected ? matchingEntry.projection.normalizedDecisionDigest : null,
  };
  const result = deepFreeze({ ...body, digest: resultDigest(body) });
  return deepFreeze(validateResult(result, matrix, hostProfile));
}

export function verifyAdapterDiscovery(result, options = {}) {
  rejectUnsafeValues(result, "adapter discovery verification");
  object(options, "adapter discovery verification options");
  rejectUnsafeValues(options, "adapter discovery verification options");
  exactKeys(options, ["matrix", "hostProfile"], "adapter discovery verification options");
  const expected = discoverAdapter(options);
  if (canonicalJson(result) !== canonicalJson(expected)) throw new Error("adapter discovery result does not match the verified matrix, host profile, or selection digest");
  return Object.freeze({
    valid: true,
    discoveryId: result.discoveryId,
    matrixDigest: result.matrixDigest,
    matrixStatus: result.matrixStatus,
    hostFamily: result.hostFamily,
    status: result.status,
    adapterId: result.adapterId,
    normalizedDecisionDigest: result.normalizedDecisionDigest,
    rawContentStored: false,
  });
}
