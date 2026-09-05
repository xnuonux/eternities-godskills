import { canonicalJson } from "./capability-layer-abi.mjs";
import {
  ADAPTER_HOST_FAMILIES,
  buildHostProjection,
  normalizeConformanceDecision,
} from "./godskill-adapter-conformance.mjs";
import { sha256 } from "./io.mjs";

export const GODSKILL_ADAPTER_SDK_ID = "eternities-godskill-adapter-sdk-v1";
export const GODSKILL_ADAPTER_SDK_SCHEMA_VERSION = 1;
export const ADAPTER_SDK_PROTOCOL_ID = "eternities-godskill-protocol-v1";
export const ADAPTER_SDK_PROTOCOL_VERSION = 1;
export const ADAPTER_SDK_HOST_FAMILIES = Object.freeze([...ADAPTER_HOST_FAMILIES]);

const EFFECTS = new Set(["execute", "external-write", "network", "read", "write"]);
const REASONING_TIERS = new Set(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]);
const REVIEW_MODES = new Set(["review"]);
const MATRIX_STATUSES = new Set(["equivalent", "mixed", "unsupported"]);
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
const MISSION_KEYS = Object.freeze([
  "missionId",
  "objectiveDigest",
  "packageReceiptDigest",
  "packageDigest",
  "capabilityId",
  "capabilityVersion",
  "requestedEffects",
]);
const ADAPTER_DESCRIPTOR_UNSIGNED_KEYS = Object.freeze([
  "schemaVersion",
  "sdkId",
  "adapterId",
  "adapterVersion",
  "hostFamily",
  "protocolId",
  "protocolVersion",
  "supportedEffects",
  "supportedReasoningTiers",
  "maxContextBudget",
  "reviewModes",
  "hostProfile",
]);
const ADAPTER_DESCRIPTOR_KEYS = Object.freeze([...ADAPTER_DESCRIPTOR_UNSIGNED_KEYS, "digest"]);
const ADAPTER_PROJECTION_UNSIGNED_KEYS = Object.freeze([
  "schemaVersion",
  "sdkId",
  "adapterId",
  "adapterVersion",
  "hostFamily",
  "descriptorDigest",
  "projection",
]);
const ADAPTER_PROJECTION_KEYS = Object.freeze([...ADAPTER_PROJECTION_UNSIGNED_KEYS, "digest"]);
const MATRIX_INPUT_KEYS = Object.freeze([
  "matrixId",
  "protocolReceiptDigest",
  "packageReceiptDigest",
  "packageDigest",
  "capabilityId",
  "capabilityVersion",
  "missionId",
  "objectiveDigest",
  "requestedEffects",
  "adapters",
]);
const MATRIX_UNSIGNED_KEYS = Object.freeze([
  "schemaVersion",
  "sdkId",
  "protocolId",
  "protocolVersion",
  "matrixId",
  "protocolReceiptDigest",
  "packageReceiptDigest",
  "packageDigest",
  "capabilityId",
  "capabilityVersion",
  "missionId",
  "objectiveDigest",
  "requestedEffects",
  "adapterIds",
  "hostFamilies",
  "entries",
  "status",
  "semanticDecision",
  "normalizedDecisionDigest",
]);
const MATRIX_KEYS = Object.freeze([...MATRIX_UNSIGNED_KEYS, "digest"]);
const MATRIX_ENTRY_UNSIGNED_KEYS = Object.freeze(["adapter", "projection"]);
const MATRIX_ENTRY_KEYS = Object.freeze([...MATRIX_ENTRY_UNSIGNED_KEYS, "digest"]);

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

function rejectUnsafeValues(value, label = "adapter input", seen = new Set()) {
  if (typeof value === "function") throw new Error(label + " contains executable value");
  if (!value || typeof value !== "object" || seen.has(value)) return;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(label + " contains non-plain data");
  }
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

function validateHostProfile(host) {
  exactKeys(host, HOST_KEYS, "adapter host profile");
  enumValue(host.hostFamily, new Set(ADAPTER_SDK_HOST_FAMILIES), "adapter host family");
  boundedString(host.hostVersion, "adapter host version");
  boundedString(host.modelFamily, "adapter model family");
  enumValue(host.reasoningTier, REASONING_TIERS, "adapter host reasoning tier");
  integer(host.contextBudget, "adapter host context budget", 1, 1000000);
  if (typeof host.reviewAvailable !== "boolean") throw new TypeError("adapter review availability must be boolean");
  sortedStringArray(host.availableEffects, "adapter host available effects", EFFECTS, 5, true);
  if (typeof host.supportsPackageProtocol !== "boolean") throw new TypeError("adapter package protocol support must be boolean");
  integer(host.supportsProtocolVersion, "adapter host protocol version", 0, 32);
  if (typeof host.secretsOutsidePayload !== "boolean") throw new TypeError("adapter secret isolation must be boolean");
  return host;
}

function validateMission(mission) {
  exactKeys(mission, MISSION_KEYS, "adapter mission");
  identifier(mission.missionId, "adapter mission id");
  digest(mission.objectiveDigest, "adapter objective digest");
  digest(mission.packageReceiptDigest, "adapter package receipt digest");
  digest(mission.packageDigest, "adapter package digest");
  identifier(mission.capabilityId, "adapter capability id");
  integer(mission.capabilityVersion, "adapter capability version", 1, 32);
  sortedStringArray(mission.requestedEffects, "adapter requested effects", EFFECTS, 5, false);
  return mission;
}

function validateDescriptorBody(descriptor) {
  if (descriptor.schemaVersion !== GODSKILL_ADAPTER_SDK_SCHEMA_VERSION || descriptor.sdkId !== GODSKILL_ADAPTER_SDK_ID) {
    throw new Error("adapter descriptor identity is invalid");
  }
  identifier(descriptor.adapterId, "adapter id");
  integer(descriptor.adapterVersion, "adapter version", 1, 32);
  enumValue(descriptor.hostFamily, new Set(ADAPTER_SDK_HOST_FAMILIES), "adapter host family");
  if (descriptor.protocolId !== ADAPTER_SDK_PROTOCOL_ID) throw new Error("adapter protocol id is unsupported");
  if (descriptor.protocolVersion !== ADAPTER_SDK_PROTOCOL_VERSION) throw new Error("adapter protocol version is unsupported");
  sortedStringArray(descriptor.supportedEffects, "adapter supported effects", EFFECTS, 5, true);
  sortedStringArray(descriptor.supportedReasoningTiers, "adapter supported reasoning tiers", REASONING_TIERS, 8, false);
  integer(descriptor.maxContextBudget, "adapter context ceiling", 1, 1000000);
  sortedStringArray(descriptor.reviewModes, "adapter review modes", REVIEW_MODES, 1, true);
  validateHostProfile(descriptor.hostProfile);
  if (descriptor.hostProfile.hostFamily !== descriptor.hostFamily) throw new Error("adapter host identity drifted");
  for (const effect of descriptor.hostProfile.availableEffects) {
    if (!descriptor.supportedEffects.includes(effect)) throw new Error("adapter effect ceiling does not contain host effect");
  }
  if (!descriptor.supportedReasoningTiers.includes(descriptor.hostProfile.reasoningTier)) {
    throw new Error("adapter reasoning tier ceiling does not contain host tier");
  }
  if (descriptor.hostProfile.contextBudget > descriptor.maxContextBudget) throw new Error("adapter context ceiling is below host context");
  if (descriptor.hostProfile.reviewAvailable && !descriptor.reviewModes.includes("review")) {
    throw new Error("adapter review envelope does not include review");
  }
  return descriptor;
}

function unsignedDescriptor(descriptor) {
  const { digest: ignoredDigest, ...body } = descriptor;
  void ignoredDigest;
  return body;
}

function descriptorDigest(descriptor) {
  return sha256(canonicalJson(unsignedDescriptor(descriptor)));
}

function validateAdapterDescriptor(descriptor) {
  exactKeys(descriptor, ADAPTER_DESCRIPTOR_KEYS, "adapter descriptor");
  rejectUnsafeValues(descriptor, "adapter descriptor");
  validateDescriptorBody(descriptor);
  digest(descriptor.digest, "adapter descriptor digest");
  if (descriptor.digest !== descriptorDigest(descriptor)) throw new Error("adapter descriptor digest does not match its body");
  return descriptor;
}

function cloneDescriptorInput(input) {
  return {
    ...input,
    supportedEffects: [...input.supportedEffects],
    supportedReasoningTiers: [...input.supportedReasoningTiers],
    reviewModes: [...input.reviewModes],
    hostProfile: {
      ...input.hostProfile,
      availableEffects: [...input.hostProfile.availableEffects],
    },
  };
}

export function buildAdapterDescriptor(input) {
  object(input, "adapter descriptor input");
  rejectUnsafeValues(input, "adapter descriptor input");
  exactKeys(input, ADAPTER_DESCRIPTOR_UNSIGNED_KEYS, "adapter descriptor input");
  validateDescriptorBody(input);
  const body = cloneDescriptorInput(input);
  return deepFreeze({ ...body, digest: descriptorDigest(body) });
}

function coerceDescriptor(value) {
  object(value, "adapter descriptor");
  rejectUnsafeValues(value, "adapter descriptor");
  const keys = Object.keys(value).sort();
  if (JSON.stringify(keys) === JSON.stringify([...ADAPTER_DESCRIPTOR_UNSIGNED_KEYS].sort())) return buildAdapterDescriptor(value);
  validateAdapterDescriptor(value);
  return value;
}

function unsignedAdapterProjection(projection) {
  const { digest: ignoredDigest, ...body } = projection;
  void ignoredDigest;
  return body;
}

function adapterProjectionDigest(projection) {
  return sha256(canonicalJson(unsignedAdapterProjection(projection)));
}

function validateAdapterProjection(projection, adapter, mission) {
  exactKeys(projection, ADAPTER_PROJECTION_KEYS, "adapter projection");
  rejectUnsafeValues(projection, "adapter projection");
  if (projection.schemaVersion !== GODSKILL_ADAPTER_SDK_SCHEMA_VERSION || projection.sdkId !== GODSKILL_ADAPTER_SDK_ID) {
    throw new Error("adapter projection identity is invalid");
  }
  identifier(projection.adapterId, "adapter projection id");
  integer(projection.adapterVersion, "adapter projection version", 1, 32);
  enumValue(projection.hostFamily, new Set(ADAPTER_SDK_HOST_FAMILIES), "adapter projection host family");
  digest(projection.descriptorDigest, "adapter projection descriptor digest");
  if (projection.adapterId !== adapter.adapterId
      || projection.adapterVersion !== adapter.adapterVersion
      || projection.hostFamily !== adapter.hostFamily
      || projection.descriptorDigest !== adapter.digest) {
    throw new Error("adapter projection descriptor binding drifted");
  }
  const expected = buildHostProjection({ host: adapter.hostProfile, mission });
  if (canonicalJson(projection.projection) !== canonicalJson(expected)) throw new Error("adapter projection does not match its descriptor and mission");
  digest(projection.digest, "adapter projection digest");
  if (projection.digest !== adapterProjectionDigest(projection)) throw new Error("adapter projection digest does not match its body");
  return projection;
}

export function projectAdapterMission(input) {
  object(input, "adapter mission projection input");
  rejectUnsafeValues(input, "adapter mission projection input");
  exactKeys(input, ["adapter", "mission"], "adapter mission projection input");
  const adapter = coerceDescriptor(input.adapter);
  const mission = validateMission(input.mission);
  const projection = buildHostProjection({ host: adapter.hostProfile, mission });
  const body = {
    schemaVersion: GODSKILL_ADAPTER_SDK_SCHEMA_VERSION,
    sdkId: GODSKILL_ADAPTER_SDK_ID,
    adapterId: adapter.adapterId,
    adapterVersion: adapter.adapterVersion,
    hostFamily: adapter.hostFamily,
    descriptorDigest: adapter.digest,
    projection,
  };
  return deepFreeze({ ...body, digest: adapterProjectionDigest(body) });
}

function compareDescriptors(left, right) {
  if (left.hostFamily !== right.hostFamily) return left.hostFamily < right.hostFamily ? -1 : 1;
  if (left.adapterId !== right.adapterId) return left.adapterId < right.adapterId ? -1 : 1;
  return left.adapterVersion - right.adapterVersion;
}

function unsignedMatrix(matrix) {
  const { digest: ignoredDigest, ...body } = matrix;
  void ignoredDigest;
  return body;
}

function matrixDigest(matrix) {
  return sha256(canonicalJson(unsignedMatrix(matrix)));
}

function unsignedMatrixEntry(entry) {
  const { digest: ignoredDigest, ...body } = entry;
  void ignoredDigest;
  return body;
}

function matrixEntryDigest(entry) {
  return sha256(canonicalJson(unsignedMatrixEntry(entry)));
}

function buildMatrixEntry(adapter, mission) {
  const projected = projectAdapterMission({ adapter, mission });
  const body = { adapter, projection: projected.projection };
  return deepFreeze({ ...body, digest: matrixEntryDigest(body) });
}

function expectedMatrixSemantics(entries) {
  const statuses = entries.map((entry) => entry.projection.status);
  const conformant = entries.filter((entry) => entry.projection.status === "conformant");
  if (conformant.length === 0) return { status: "unsupported", semanticDecision: null, normalizedDecisionDigest: null };
  const normalized = new Set(conformant.map((entry) => entry.projection.normalizedDecisionDigest));
  if (conformant.length === entries.length && normalized.size === 1) {
    const semanticDecision = normalizeConformanceDecision(conformant[0].projection);
    return {
      status: "equivalent",
      semanticDecision,
      normalizedDecisionDigest: conformant[0].projection.normalizedDecisionDigest,
    };
  }
  void statuses;
  return { status: "mixed", semanticDecision: null, normalizedDecisionDigest: null };
}

function validateMatrixEntry(entry, mission) {
  exactKeys(entry, MATRIX_ENTRY_KEYS, "matrix entry descriptor/digest");
  rejectUnsafeValues(entry, "matrix entry");
  const adapter = validateAdapterDescriptor(entry.adapter);
  identifier(adapter.adapterId, "matrix adapter id");
  validateAdapterProjection({
    schemaVersion: GODSKILL_ADAPTER_SDK_SCHEMA_VERSION,
    sdkId: GODSKILL_ADAPTER_SDK_ID,
    adapterId: adapter.adapterId,
    adapterVersion: adapter.adapterVersion,
    hostFamily: adapter.hostFamily,
    descriptorDigest: adapter.digest,
    projection: entry.projection,
    digest: adapterProjectionDigest({
      schemaVersion: GODSKILL_ADAPTER_SDK_SCHEMA_VERSION,
      sdkId: GODSKILL_ADAPTER_SDK_ID,
      adapterId: adapter.adapterId,
      adapterVersion: adapter.adapterVersion,
      hostFamily: adapter.hostFamily,
      descriptorDigest: adapter.digest,
      projection: entry.projection,
    }),
  }, adapter, mission);
  digest(entry.digest, "matrix entry digest");
  if (entry.digest !== matrixEntryDigest(entry)) throw new Error("matrix entry digest does not match its body");
  return entry;
}

function deriveMatrixSemantics(matrix) {
  const expected = expectedMatrixSemantics(matrix.entries);
  if (matrix.status !== expected.status) throw new Error("capability matrix status does not match entries");
  if (canonicalJson(matrix.semanticDecision) !== canonicalJson(expected.semanticDecision)) {
    throw new Error("capability matrix semantic decision does not match entries");
  }
  if (matrix.normalizedDecisionDigest !== expected.normalizedDecisionDigest) {
    throw new Error("capability matrix normalized decision digest does not match entries");
  }
}

function validateMatrix(matrix) {
  exactKeys(matrix, MATRIX_KEYS, "capability matrix");
  rejectUnsafeValues(matrix, "capability matrix");
  if (matrix.schemaVersion !== GODSKILL_ADAPTER_SDK_SCHEMA_VERSION || matrix.sdkId !== GODSKILL_ADAPTER_SDK_ID) {
    throw new Error("capability matrix identity is invalid");
  }
  if (matrix.protocolId !== ADAPTER_SDK_PROTOCOL_ID || matrix.protocolVersion !== ADAPTER_SDK_PROTOCOL_VERSION) {
    throw new Error("capability matrix protocol identity is invalid");
  }
  identifier(matrix.matrixId, "capability matrix id");
  digest(matrix.protocolReceiptDigest, "capability matrix protocol receipt digest");
  digest(matrix.packageReceiptDigest, "capability matrix package receipt digest");
  digest(matrix.packageDigest, "capability matrix package digest");
  identifier(matrix.capabilityId, "capability matrix capability id");
  integer(matrix.capabilityVersion, "capability matrix capability version", 1, 32);
  identifier(matrix.missionId, "capability matrix mission id");
  digest(matrix.objectiveDigest, "capability matrix objective digest");
  sortedStringArray(matrix.requestedEffects, "capability matrix requested effects", EFFECTS, 5, false);
  enumValue(matrix.status, MATRIX_STATUSES, "capability matrix status");
  if (!Array.isArray(matrix.adapterIds) || matrix.adapterIds.length === 0 || matrix.adapterIds.length > 32) {
    throw new TypeError("capability matrix adapter ids must be bounded");
  }
  if (!Array.isArray(matrix.hostFamilies) || matrix.hostFamilies.length !== matrix.adapterIds.length) {
    throw new TypeError("capability matrix host families must align with adapters");
  }
  sortedStringArray(matrix.hostFamilies, "capability matrix host families", new Set(ADAPTER_SDK_HOST_FAMILIES), 32, false);
  if (!Array.isArray(matrix.entries) || matrix.entries.length !== matrix.adapterIds.length || matrix.entries.length > 32) {
    throw new TypeError("capability matrix entries must align with adapters");
  }
  const mission = {
    missionId: matrix.missionId,
    objectiveDigest: matrix.objectiveDigest,
    packageReceiptDigest: matrix.packageReceiptDigest,
    packageDigest: matrix.packageDigest,
    capabilityId: matrix.capabilityId,
    capabilityVersion: matrix.capabilityVersion,
    requestedEffects: matrix.requestedEffects,
  };
  const seenAdapters = new Set();
  const seenHosts = new Set();
  const expectedAdapterIds = [];
  const expectedHostFamilies = [];
  let previous = null;
  for (const entry of matrix.entries) {
    validateMatrixEntry(entry, mission);
    const descriptor = entry.adapter;
    if (seenAdapters.has(descriptor.adapterId)) throw new Error("capability matrix contains a duplicate adapter id");
    if (seenHosts.has(descriptor.hostFamily)) throw new Error("capability matrix contains a duplicate host family");
    if (previous !== null && compareDescriptors(previous, descriptor) > 0) throw new Error("capability matrix adapters are not in canonical order");
    previous = descriptor;
    seenAdapters.add(descriptor.adapterId);
    seenHosts.add(descriptor.hostFamily);
    expectedAdapterIds.push(descriptor.adapterId);
    expectedHostFamilies.push(descriptor.hostFamily);
    if (entry.projection.hostFamily !== descriptor.hostFamily) throw new Error("capability matrix entry host identity drifted");
  }
  if (canonicalJson(matrix.adapterIds) !== canonicalJson(expectedAdapterIds)) throw new Error("capability matrix adapter ids are not canonical");
  if (canonicalJson(matrix.hostFamilies) !== canonicalJson([...expectedHostFamilies].sort())) throw new Error("capability matrix host families are not canonical");
  deriveMatrixSemantics(matrix);
  if (matrix.normalizedDecisionDigest !== null) {
    digest(matrix.normalizedDecisionDigest, "capability matrix normalized decision digest");
  } else if (matrix.status === "equivalent") {
    throw new Error("equivalent capability matrix is missing normalized decision digest");
  }
  if (matrix.semanticDecision !== null && typeof matrix.semanticDecision !== "object") throw new TypeError("capability matrix semantic decision must be an object or null");
  digest(matrix.digest, "capability matrix digest");
  if (matrix.digest !== matrixDigest(matrix)) throw new Error("capability matrix digest does not match its body");
  return matrix;
}

export function buildCapabilityMatrix(input) {
  object(input, "capability matrix input");
  rejectUnsafeValues(input, "capability matrix input");
  exactKeys(input, MATRIX_INPUT_KEYS, "capability matrix input");
  identifier(input.matrixId, "capability matrix id");
  digest(input.protocolReceiptDigest, "capability matrix protocol receipt digest");
  digest(input.packageReceiptDigest, "capability matrix package receipt digest");
  digest(input.packageDigest, "capability matrix package digest");
  identifier(input.capabilityId, "capability matrix capability id");
  integer(input.capabilityVersion, "capability matrix capability version", 1, 32);
  identifier(input.missionId, "capability matrix mission id");
  digest(input.objectiveDigest, "capability matrix objective digest");
  sortedStringArray(input.requestedEffects, "capability matrix requested effects", EFFECTS, 5, false);
  if (!Array.isArray(input.adapters) || input.adapters.length === 0 || input.adapters.length > 32) {
    throw new TypeError("capability matrix adapters must be a bounded non-empty array");
  }
  const adapters = input.adapters.map(coerceDescriptor);
  const seenAdapterIds = new Set();
  const seenHostFamilies = new Set();
  for (const adapter of adapters) {
    if (seenAdapterIds.has(adapter.adapterId)) throw new Error("capability matrix contains a duplicate adapter id");
    if (seenHostFamilies.has(adapter.hostFamily)) throw new Error("capability matrix contains a duplicate host family");
    seenAdapterIds.add(adapter.adapterId);
    seenHostFamilies.add(adapter.hostFamily);
  }
  for (let index = 1; index < adapters.length; index += 1) {
    if (compareDescriptors(adapters[index - 1], adapters[index]) > 0) throw new Error("capability matrix adapters are not in canonical adapter order");
  }
  const mission = {
    missionId: input.missionId,
    objectiveDigest: input.objectiveDigest,
    packageReceiptDigest: input.packageReceiptDigest,
    packageDigest: input.packageDigest,
    capabilityId: input.capabilityId,
    capabilityVersion: input.capabilityVersion,
    requestedEffects: [...input.requestedEffects],
  };
  const entries = adapters.map((adapter) => buildMatrixEntry(adapter, mission));
  const semantics = expectedMatrixSemantics(entries);
  const body = {
    schemaVersion: GODSKILL_ADAPTER_SDK_SCHEMA_VERSION,
    sdkId: GODSKILL_ADAPTER_SDK_ID,
    protocolId: ADAPTER_SDK_PROTOCOL_ID,
    protocolVersion: ADAPTER_SDK_PROTOCOL_VERSION,
    matrixId: input.matrixId,
    protocolReceiptDigest: input.protocolReceiptDigest,
    packageReceiptDigest: input.packageReceiptDigest,
    packageDigest: input.packageDigest,
    capabilityId: input.capabilityId,
    capabilityVersion: input.capabilityVersion,
    missionId: input.missionId,
    objectiveDigest: input.objectiveDigest,
    requestedEffects: [...input.requestedEffects],
    adapterIds: adapters.map((adapter) => adapter.adapterId),
    hostFamilies: adapters.map((adapter) => adapter.hostFamily).sort(),
    entries,
    status: semantics.status,
    semanticDecision: semantics.semanticDecision,
    normalizedDecisionDigest: semantics.normalizedDecisionDigest,
  };
  return deepFreeze({ ...body, digest: matrixDigest(body) });
}

export function verifyCapabilityMatrix(matrix, options = {}) {
  rejectUnsafeValues(matrix, "capability matrix verification");
  validateMatrix(matrix);
  object(options, "capability matrix verification options");
  rejectUnsafeValues(options, "capability matrix verification options");
  if (Object.keys(options).some((key) => !["expectedProtocolReceiptDigest", "expectedPackageReceiptDigest"].includes(key))) {
    throw new Error("capability matrix verification options are not closed");
  }
  if (options.expectedProtocolReceiptDigest !== undefined
      && matrix.protocolReceiptDigest !== options.expectedProtocolReceiptDigest) throw new Error("capability matrix protocol root is stale");
  if (options.expectedPackageReceiptDigest !== undefined
      && matrix.packageReceiptDigest !== options.expectedPackageReceiptDigest) throw new Error("capability matrix package root is stale");
  return Object.freeze({
    valid: true,
    sdkId: matrix.sdkId,
    protocolId: matrix.protocolId,
    matrixId: matrix.matrixId,
    status: matrix.status,
    adapterIds: Object.freeze([...matrix.adapterIds]),
    hostFamilies: Object.freeze([...matrix.hostFamilies]),
    entryCount: matrix.entries.length,
    normalizedDecisionDigest: matrix.normalizedDecisionDigest,
    rawContentStored: false,
  });
}
