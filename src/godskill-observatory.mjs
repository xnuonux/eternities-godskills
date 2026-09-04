import { canonicalJson } from "./capability-layer-abi.mjs";
import { sha256 } from "./io.mjs";
import {
  PROTOCOL_EFFECTS,
  PROTOCOL_MESSAGE_TYPES,
  verifyProtocolChain,
  verifyProtocolMessage,
} from "./godskill-protocol.mjs";

export const GODSKILL_OBSERVATORY_ID = "eternities-godskill-observatory-v1";
export const GODSKILL_OBSERVATORY_SCHEMA_VERSION = 1;

export const OBSERVATORY_RECORD_TYPES = Object.freeze([
  "ReplayObservation",
  "CounterfactualView",
  "RawSuccessCandidate",
  "FailureClusterReport",
  "DisclosureCostEntry",
  "ObservatorySnapshot",
]);

export const OBSERVATORY_VARIANTS = Object.freeze([
  "raw",
  "guardrail",
  "method",
  "reviewer",
  "combined",
]);

const OBSERVATORY_ENVELOPE_KEYS = Object.freeze([
  "schemaVersion",
  "observatoryId",
  "recordType",
  "recordId",
  "digest",
  "body",
]);

const RECORD_BODY_KEYS = Object.freeze({
  ReplayObservation: Object.freeze([
    "protocolReceiptDigest",
    "chainDigest",
    "missionId",
    "messageCount",
    "complete",
    "lastMessageType",
    "messageDigests",
    "requestedEffects",
    "grantedEffects",
    "derivedDecisionDigest",
    "rawContentStored",
  ]),
  CounterfactualView: Object.freeze([
    "missionId",
    "identityDigest",
    "baseline",
    "candidate",
    "scoreDelta",
    "criticalRegressionDelta",
    "promotionEligible",
  ]),
  RawSuccessCandidate: Object.freeze([
    "sourceObservationDigest",
    "missionId",
    "capabilityDigest",
    "taskDigest",
    "modelProfileDigest",
    "environmentDigest",
    "candidateStatus",
    "promotionEligible",
    "trusted",
    "reason",
  ]),
  FailureClusterReport: Object.freeze([
    "reportScopeDigest",
    "clusterCount",
    "clusters",
    "rawContentStored",
  ]),
  DisclosureCostEntry: Object.freeze([
    "protocolReceiptDigest",
    "disclosureMessageDigest",
    "missionId",
    "packageDigest",
    "mode",
    "layer",
    "contentDigest",
    "contentBytes",
    "tokens",
    "latencyMs",
    "costMinorUnits",
  ]),
  ObservatorySnapshot: Object.freeze([
    "protocolReceiptDigest",
    "recordDigests",
    "recordTypes",
    "recordCount",
    "retentionPolicy",
    "rawContentStored",
  ]),
});

const RETENTION_POLICY = Object.freeze({
  mode: "digest-only",
  appendOnly: true,
  rawMissionContentStored: false,
  rawArtifactContentStored: false,
  candidateAutoPromotion: false,
});

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

const FAILURE_VARIANTS = new Set(OBSERVATORY_VARIANTS);
const EVIDENCE_LEVELS = new Set([
  "structural",
  "fixture",
  "artifact",
  "model",
  "cross-model",
  "field",
  "universal",
]);

const expectedDisclosureLayer = Object.freeze({
  native: "none",
  guardrail: "guardrails",
  method: "method",
  review: "reviewer",
});

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be an object");
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(label + " keys are not closed");
  }
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be an object");
  }
  return value;
}

function identifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    throw new TypeError(label + " must be a bounded neutral identifier");
  }
  return value;
}

function digest(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new TypeError(label + " must be a lowercase SHA-256 digest");
  }
  return value;
}

function nullableDigest(value, label) {
  if (value !== null) digest(value, label);
  return value;
}

function enumValue(value, allowed, label) {
  if (!allowed.has(value)) throw new Error(label + " is unsupported");
  return value;
}

function boundedString(value, label, maximum = 128) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum
      || /[\r\n\0]/.test(value)) {
    throw new TypeError(label + " must be bounded text without control delimiters");
  }
  return value;
}

function integer(value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(label + " must be a bounded integer");
  }
  return value;
}

function integerOrNull(value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (value !== null) integer(value, label, minimum, maximum);
  return value;
}

function numberOrNull(value, label, minimum = 0) {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < minimum)) {
    throw new TypeError(label + " must be a bounded number or null");
  }
  return value;
}

function sortedStringArray(value, label, maximum = 64) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum
      || value.some((item) => typeof item !== "string" || item.length === 0
        || /[\r\n\0]/.test(item))) {
    throw new TypeError(label + " must be a bounded non-empty string array");
  }
  const sorted = [...value].sort((left, right) => (
    left < right ? -1 : left > right ? 1 : 0
  ));
  if (JSON.stringify(sorted) !== JSON.stringify(value)) {
    throw new Error(label + " must be in canonical order");
  }
  if (new Set(value).size !== value.length) throw new Error(label + " contains a duplicate");
  return value;
}

function orderedDigestArray(value, label, maximum = 128, allowEmpty = false) {
  if (!Array.isArray(value) || value.length > maximum || (!allowEmpty && value.length === 0)) {
    throw new TypeError(label + " must be a bounded digest array");
  }
  for (const [index, item] of value.entries()) digest(item, label + "[" + index + "]");
  if (new Set(value).size !== value.length) throw new Error(label + " contains a duplicate");
  return value;
}

function orderedStringArray(value, label, maximum = 512, allowEmpty = true) {
  if (!Array.isArray(value) || value.length > maximum || (!allowEmpty && value.length === 0)) {
    throw new TypeError(label + " must be a bounded string array");
  }
  for (const [index, item] of value.entries()) boundedString(item, label + "[" + index + "]");
  return value;
}

function effects(value, label, allowEmpty = true) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.length > PROTOCOL_EFFECTS.length) {
    throw new TypeError(label + " must be a bounded effects array");
  }
  for (const effect of value) enumValue(effect, new Set(PROTOCOL_EFFECTS), label + " effect");
  const sorted = [...value].sort((left, right) => (
    left < right ? -1 : left > right ? 1 : 0
  ));
  if (JSON.stringify(sorted) !== JSON.stringify(value)) throw new Error(label + " must be canonical");
  if (new Set(value).size !== value.length) throw new Error(label + " contains a duplicate");
  return value;
}

function rejectRawFields(value, label = "observatory input", seen = new Set()) {
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

function validateIdentity(value, label) {
  exactKeys(value, [
    "missionId",
    "taskDigest",
    "capabilityDigest",
    "modelProfileDigest",
    "environmentDigest",
  ], label);
  identifier(value.missionId, label + " mission id");
  digest(value.taskDigest, label + " task digest");
  digest(value.capabilityDigest, label + " capability digest");
  digest(value.modelProfileDigest, label + " model profile digest");
  digest(value.environmentDigest, label + " environment digest");
  return value;
}

function validateCounterfactualSide(value, label) {
  exactKeys(value, [
    "variant",
    "observationDigest",
    "identityDigest",
    "score",
    "criticalRegressions",
    "artifactBytes",
    "disclosureBytes",
  ], label);
  enumValue(value.variant, new Set(OBSERVATORY_VARIANTS), label + " variant");
  digest(value.observationDigest, label + " observation digest");
  digest(value.identityDigest, label + " identity digest");
  integer(value.score, label + " score", 0, 1000);
  integer(value.criticalRegressions, label + " critical regressions", 0, 100);
  integer(value.artifactBytes, label + " artifact bytes", 0, 1000000000);
  integer(value.disclosureBytes, label + " disclosure bytes", 0, 1000000000);
  return value;
}

function validateRetentionPolicy(value) {
  exactKeys(value, Object.keys(RETENTION_POLICY), "retention policy");
  if (canonicalJson(value) !== canonicalJson(RETENTION_POLICY)) {
    throw new Error("observatory retention policy is not the fixed digest-only policy");
  }
}

function validateBody(recordType, body) {
  object(body, recordType + " body");
  exactKeys(body, RECORD_BODY_KEYS[recordType], recordType + " body");
  switch (recordType) {
    case "ReplayObservation":
      digest(body.protocolReceiptDigest, "replay protocol receipt digest");
      digest(body.chainDigest, "replay chain digest");
      identifier(body.missionId, "replay mission id");
      integer(body.messageCount, "replay message count", 1, PROTOCOL_MESSAGE_TYPES.length);
      if (typeof body.complete !== "boolean") throw new TypeError("replay completeness must be boolean");
      enumValue(body.lastMessageType, new Set(PROTOCOL_MESSAGE_TYPES), "replay last message type");
      orderedDigestArray(body.messageDigests, "replay message digests");
      if (body.messageDigests.length !== body.messageCount) throw new Error("replay message count does not match digests");
      effects(body.requestedEffects, "replay requested effects");
      effects(body.grantedEffects, "replay granted effects");
      for (const effect of body.grantedEffects) {
        if (!body.requestedEffects.includes(effect)) throw new Error("replay widened effects");
      }
      digest(body.derivedDecisionDigest, "replay derived decision digest");
      if (body.rawContentStored !== false) throw new Error("replay cannot store raw content");
      break;
    case "CounterfactualView":
      identifier(body.missionId, "counterfactual mission id");
      digest(body.identityDigest, "counterfactual identity digest");
      validateCounterfactualSide(body.baseline, "counterfactual baseline");
      validateCounterfactualSide(body.candidate, "counterfactual candidate");
      if (body.baseline.identityDigest !== body.identityDigest
          || body.candidate.identityDigest !== body.identityDigest) {
        throw new Error("counterfactual sides do not share one identity");
      }
      if (body.baseline.variant === body.candidate.variant) throw new Error("counterfactual variants must differ");
      integer(body.scoreDelta, "counterfactual score delta", -1000, 1000);
      if (body.scoreDelta !== body.candidate.score - body.baseline.score) {
        throw new Error("counterfactual score delta is not derived from its sides");
      }
      integer(body.criticalRegressionDelta, "counterfactual regression delta", -100, 100);
      if (body.criticalRegressionDelta
          !== body.candidate.criticalRegressions - body.baseline.criticalRegressions) {
        throw new Error("counterfactual regression delta is not derived from its sides");
      }
      if (body.promotionEligible !== false) throw new Error("counterfactual view cannot promote");
      break;
    case "RawSuccessCandidate":
      digest(body.sourceObservationDigest, "candidate source observation digest");
      identifier(body.missionId, "candidate mission id");
      digest(body.capabilityDigest, "candidate capability digest");
      digest(body.taskDigest, "candidate task digest");
      digest(body.modelProfileDigest, "candidate model profile digest");
      digest(body.environmentDigest, "candidate environment digest");
      if (body.candidateStatus !== "untrusted-candidate") throw new Error("candidate status must remain untrusted");
      if (body.promotionEligible !== false || body.trusted !== false) {
        throw new Error("raw-success candidate cannot become trusted or promotable");
      }
      if (body.reason !== "raw-success-observation") throw new Error("candidate reason is not canonical");
      break;
    case "FailureClusterReport":
      digest(body.reportScopeDigest, "failure report scope digest");
      integer(body.clusterCount, "failure cluster count", 0, 128);
      if (!Array.isArray(body.clusters) || body.clusters.length !== body.clusterCount) {
        throw new TypeError("failure report clusters are not bounded");
      }
      for (const [index, cluster] of body.clusters.entries()) {
        exactKeys(cluster, ["scopeDigest", "failureCode", "observationDigests", "count", "criticalCount", "variants"], "failure cluster " + index);
        digest(cluster.scopeDigest, "failure cluster scope digest");
        identifier(cluster.failureCode, "failure cluster code");
        orderedDigestArray(cluster.observationDigests, "failure cluster observations");
        integer(cluster.count, "failure cluster count", 1, 128);
        if (cluster.count !== cluster.observationDigests.length) throw new Error("failure cluster count does not match observations");
        integer(cluster.criticalCount, "failure cluster critical count", 0, cluster.count);
        sortedStringArray(cluster.variants, "failure cluster variants", OBSERVATORY_VARIANTS.length);
        for (const variant of cluster.variants) enumValue(variant, FAILURE_VARIANTS, "failure cluster variant");
      }
      if (body.rawContentStored !== false) throw new Error("failure report cannot store raw content");
      break;
    case "DisclosureCostEntry":
      digest(body.protocolReceiptDigest, "cost protocol receipt digest");
      digest(body.disclosureMessageDigest, "cost disclosure message digest");
      identifier(body.missionId, "cost mission id");
      digest(body.packageDigest, "cost package digest");
      enumValue(body.mode, new Set(Object.keys(expectedDisclosureLayer)), "cost mode");
      enumValue(body.layer, new Set(["none", "guardrails", "method", "reviewer"]), "cost layer");
      if (body.layer !== expectedDisclosureLayer[body.mode]) throw new Error("cost layer does not match mode");
      nullableDigest(body.contentDigest, "cost content digest");
      integer(body.contentBytes, "cost content bytes", 0, 1000000000);
      if (body.mode === "native" && (body.contentDigest !== null || body.contentBytes !== 0)) {
        throw new Error("native cost entry cannot carry disclosed content");
      }
      if (body.mode !== "native" && body.contentDigest === null) throw new Error("non-native cost needs content digest");
      if (body.mode !== "native" && body.contentBytes === 0) throw new Error("non-native cost needs disclosed bytes");
      integerOrNull(body.tokens, "cost token metric", 0, 1000000000);
      numberOrNull(body.latencyMs, "cost latency metric");
      numberOrNull(body.costMinorUnits, "cost monetary metric");
      break;
    case "ObservatorySnapshot":
      digest(body.protocolReceiptDigest, "snapshot protocol receipt digest");
      orderedDigestArray(body.recordDigests, "snapshot record digests", 512);
      orderedStringArray(body.recordTypes, "snapshot record types", 512);
      for (const recordType of body.recordTypes) {
        enumValue(recordType, new Set(OBSERVATORY_RECORD_TYPES.filter((type) => type !== "ObservatorySnapshot")), "snapshot record type");
      }
      integer(body.recordCount, "snapshot record count", 0, 512);
      if (body.recordCount !== body.recordDigests.length || body.recordCount !== body.recordTypes.length) {
        throw new Error("snapshot record count does not match its index");
      }
      validateRetentionPolicy(body.retentionPolicy);
      if (body.rawContentStored !== false) throw new Error("snapshot cannot store raw content");
      break;
    default:
      throw new Error("observatory record type is unsupported");
  }
  return body;
}

function unsignedRecord(record) {
  const { digest: ignoredDigest, ...unsigned } = record;
  void ignoredDigest;
  return unsigned;
}

function recordDigest(record) {
  return sha256(canonicalJson(unsignedRecord(record)));
}

function buildRecord(recordType, recordId, body) {
  if (!OBSERVATORY_RECORD_TYPES.includes(recordType)) throw new Error("observatory record type is unsupported");
  identifier(recordId, "observatory record id");
  rejectRawFields(body, recordType + " body");
  validateBody(recordType, body);
  const unsigned = {
    schemaVersion: GODSKILL_OBSERVATORY_SCHEMA_VERSION,
    observatoryId: GODSKILL_OBSERVATORY_ID,
    recordType,
    recordId,
    body: { ...body },
  };
  return deepFreeze({ ...unsigned, digest: recordDigest(unsigned) });
}

export function verifyObservatoryRecord(record) {
  exactKeys(record, OBSERVATORY_ENVELOPE_KEYS, "observatory record");
  if (record.schemaVersion !== GODSKILL_OBSERVATORY_SCHEMA_VERSION
      || record.observatoryId !== GODSKILL_OBSERVATORY_ID) {
    throw new Error("observatory record identity is invalid");
  }
  if (!OBSERVATORY_RECORD_TYPES.includes(record.recordType)) throw new Error("observatory record type is unsupported");
  identifier(record.recordId, "observatory record id");
  rejectRawFields(record.body, record.recordType + " body");
  validateBody(record.recordType, record.body);
  digest(record.digest, "observatory record digest");
  if (recordDigest(record) !== record.digest) throw new Error("observatory record digest does not match its body");
  return Object.freeze({
    valid: true,
    observatoryId: record.observatoryId,
    recordType: record.recordType,
    recordId: record.recordId,
    digest: record.digest,
  });
}

export function replayProtocolObservation(input) {
  object(input, "replay input");
  rejectRawFields(input);
  exactKeys(input, ["messages", "expectedChainDigest", "protocolReceiptDigest"], "replay input");
  const { messages, expectedChainDigest, protocolReceiptDigest } = input;
  digest(expectedChainDigest, "expected protocol chain digest");
  digest(protocolReceiptDigest, "protocol receipt digest");
  const chain = verifyProtocolChain(messages);
  if (chain.chainDigest !== expectedChainDigest) {
    throw new Error("stale protocol inputs do not match the expected chain digest");
  }
  const derivedDecisionDigest = sha256(canonicalJson({
    protocolId: chain.protocolId,
    missionId: chain.missionId,
    messageCount: chain.messageCount,
    complete: chain.complete,
    lastMessageType: chain.lastMessageType,
    messageDigests: chain.messageDigests,
    requestedEffects: chain.requestedEffects,
    grantedEffects: chain.grantedEffects,
    authorityExpanded: chain.authorityExpanded,
  }));
  return buildRecord(
    "ReplayObservation",
    "replay-" + chain.chainDigest.slice(0, 16),
    {
      protocolReceiptDigest,
      chainDigest: chain.chainDigest,
      missionId: chain.missionId,
      messageCount: chain.messageCount,
      complete: chain.complete,
      lastMessageType: chain.lastMessageType,
      messageDigests: [...chain.messageDigests],
      requestedEffects: [...chain.requestedEffects],
      grantedEffects: [...chain.grantedEffects],
      derivedDecisionDigest,
      rawContentStored: false,
    },
  );
}

export function buildCounterfactualView(input) {
  object(input, "counterfactual input");
  rejectRawFields(input);
  exactKeys(input, ["baseline", "candidate"], "counterfactual input");
  const { baseline, candidate } = input;
  validateIdentity(baseline.identity, "counterfactual baseline identity");
  validateIdentity(candidate.identity, "counterfactual candidate identity");
  if (canonicalJson(baseline.identity) !== canonicalJson(candidate.identity)) {
    throw new Error("counterfactual sides must share exact task identity");
  }
  exactKeys(baseline, ["identity", "variant", "observationDigest", "score", "criticalRegressions", "artifactBytes", "disclosureBytes"], "counterfactual baseline input");
  exactKeys(candidate, ["identity", "variant", "observationDigest", "score", "criticalRegressions", "artifactBytes", "disclosureBytes"], "counterfactual candidate input");
  const identityDigest = sha256(canonicalJson(baseline.identity));
  const normalizedBaseline = {
    variant: baseline.variant,
    observationDigest: baseline.observationDigest,
    identityDigest,
    score: baseline.score,
    criticalRegressions: baseline.criticalRegressions,
    artifactBytes: baseline.artifactBytes,
    disclosureBytes: baseline.disclosureBytes,
  };
  const normalizedCandidate = {
    variant: candidate.variant,
    observationDigest: candidate.observationDigest,
    identityDigest,
    score: candidate.score,
    criticalRegressions: candidate.criticalRegressions,
    artifactBytes: candidate.artifactBytes,
    disclosureBytes: candidate.disclosureBytes,
  };
  const body = {
    missionId: baseline.identity.missionId,
    identityDigest,
    baseline: normalizedBaseline,
    candidate: normalizedCandidate,
    scoreDelta: candidate.score - baseline.score,
    criticalRegressionDelta: candidate.criticalRegressions - baseline.criticalRegressions,
    promotionEligible: false,
  };
  return buildRecord(
    "CounterfactualView",
    "counterfactual-" + sha256(canonicalJson(body)).slice(0, 16),
    body,
  );
}

function validateRawSuccessObservation(observation) {
  exactKeys(observation, [
    "observationDigest",
    "variant",
    "verdict",
    "evidenceLevel",
    "missionId",
    "capabilityDigest",
    "taskDigest",
    "modelProfileDigest",
    "environmentDigest",
  ], "raw-success observation");
  digest(observation.observationDigest, "raw-success observation digest");
  if (observation.variant !== "raw") throw new Error("candidate extraction requires a raw observation");
  if (observation.verdict !== "success") throw new Error("candidate extraction requires a successful observation");
  if (!EVIDENCE_LEVELS.has(observation.evidenceLevel)) throw new Error("raw-success evidence level is unsupported");
  identifier(observation.missionId, "raw-success mission id");
  digest(observation.capabilityDigest, "raw-success capability digest");
  digest(observation.taskDigest, "raw-success task digest");
  digest(observation.modelProfileDigest, "raw-success model profile digest");
  digest(observation.environmentDigest, "raw-success environment digest");
  return observation;
}

export function extractRawSuccessCandidate(input) {
  object(input, "candidate input");
  rejectRawFields(input);
  exactKeys(input, ["observation"], "candidate input");
  const { observation } = input;
  validateRawSuccessObservation(observation);
  const body = {
    sourceObservationDigest: observation.observationDigest,
    missionId: observation.missionId,
    capabilityDigest: observation.capabilityDigest,
    taskDigest: observation.taskDigest,
    modelProfileDigest: observation.modelProfileDigest,
    environmentDigest: observation.environmentDigest,
    candidateStatus: "untrusted-candidate",
    promotionEligible: false,
    trusted: false,
    reason: "raw-success-observation",
  };
  return buildRecord(
    "RawSuccessCandidate",
    "candidate-" + observation.observationDigest.slice(0, 16),
    body,
  );
}

export function buildFailureClusterReport(input) {
  object(input, "failure report input");
  rejectRawFields(input);
  exactKeys(input, ["reportScopeDigest", "observations"], "failure report input");
  const { reportScopeDigest, observations } = input;
  digest(reportScopeDigest, "failure report scope digest");
  if (!Array.isArray(observations) || observations.length > 128 || observations.length === 0) {
    throw new TypeError("failure observations must be a bounded non-empty array");
  }
  const groups = new Map();
  for (const [index, observation] of observations.entries()) {
    exactKeys(observation, ["observationDigest", "scopeDigest", "failureCode", "variant", "critical"], "failure observation " + index);
    digest(observation.observationDigest, "failure observation digest");
    digest(observation.scopeDigest, "failure observation scope digest");
    identifier(observation.failureCode, "failure observation code");
    enumValue(observation.variant, FAILURE_VARIANTS, "failure observation variant");
    if (typeof observation.critical !== "boolean") throw new TypeError("failure critical flag must be boolean");
    if (groups.has(observation.observationDigest)) throw new Error("failure observations contain a duplicate");
    const key = observation.scopeDigest + "\u0000" + observation.failureCode;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(observation);
  }
  const clusters = [...groups.entries()].map(([key, members]) => {
    const [scopeDigest, failureCode] = key.split("\u0000");
    const sortedMembers = [...members].sort((left, right) => (
      left.observationDigest < right.observationDigest ? -1
        : left.observationDigest > right.observationDigest ? 1 : 0
    ));
    return {
      scopeDigest,
      failureCode,
      observationDigests: sortedMembers.map((member) => member.observationDigest),
      count: sortedMembers.length,
      criticalCount: sortedMembers.filter((member) => member.critical).length,
      variants: [...new Set(sortedMembers.map((member) => member.variant))].sort((left, right) => (
        left < right ? -1 : left > right ? 1 : 0
      )),
    };
  }).sort((left, right) => {
    const leftKey = left.scopeDigest + "\u0000" + left.failureCode;
    const rightKey = right.scopeDigest + "\u0000" + right.failureCode;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  const body = {
    reportScopeDigest,
    clusterCount: clusters.length,
    clusters,
    rawContentStored: false,
  };
  return buildRecord(
    "FailureClusterReport",
    "failures-" + sha256(canonicalJson(body)).slice(0, 16),
    body,
  );
}

export function recordDisclosureCost(input) {
  object(input, "cost input");
  rejectRawFields(input);
  exactKeys(input, ["disclosureMessage", "protocolReceiptDigest", "tokens", "latencyMs", "costMinorUnits"], "cost input");
  const {
    disclosureMessage,
    protocolReceiptDigest,
    tokens,
    latencyMs,
    costMinorUnits,
  } = input;
  digest(protocolReceiptDigest, "cost protocol receipt digest");
  verifyProtocolMessage(disclosureMessage);
  if (disclosureMessage.messageType !== "DisclosureEnvelope") {
    throw new Error("cost entry requires a disclosure envelope");
  }
  integerOrNull(tokens, "cost token metric", 0, 1000000000);
  numberOrNull(latencyMs, "cost latency metric");
  numberOrNull(costMinorUnits, "cost monetary metric");
  const { packageDigest, mode, layer, contentDigest, contentBytes } = disclosureMessage.body;
  const body = {
    protocolReceiptDigest,
    disclosureMessageDigest: disclosureMessage.digest,
    missionId: disclosureMessage.missionId,
    packageDigest,
    mode,
    layer,
    contentDigest,
    contentBytes,
    tokens,
    latencyMs,
    costMinorUnits,
  };
  return buildRecord(
    "DisclosureCostEntry",
    "cost-" + disclosureMessage.digest.slice(0, 16),
    body,
  );
}

function sortedRecordIndex(records) {
  return [...records].sort((left, right) => (
    left.digest < right.digest ? -1 : left.digest > right.digest ? 1 : 0
  ));
}

export function buildObservatorySnapshot(input) {
  object(input, "snapshot input");
  rejectRawFields(input);
  exactKeys(input, ["protocolReceiptDigest", "records"], "snapshot input");
  const { protocolReceiptDigest, records } = input;
  digest(protocolReceiptDigest, "snapshot protocol receipt digest");
  if (!Array.isArray(records) || records.length > 512) throw new TypeError("snapshot records must be bounded");
  const verified = records.map((record) => {
    const summary = verifyObservatoryRecord(record);
    if (summary.recordType === "ObservatorySnapshot") throw new Error("snapshot cannot contain another snapshot");
    return record;
  });
  const indexed = sortedRecordIndex(verified);
  const recordDigests = indexed.map((record) => record.digest);
  const recordTypes = indexed.map((record) => record.recordType);
  const body = {
    protocolReceiptDigest,
    recordDigests,
    recordTypes,
    recordCount: indexed.length,
    retentionPolicy: { ...RETENTION_POLICY },
    rawContentStored: false,
  };
  return buildRecord(
    "ObservatorySnapshot",
    "snapshot-" + sha256(canonicalJson(body)).slice(0, 16),
    body,
  );
}

export function verifyObservatorySnapshot(snapshot, options = {}) {
  object(options, "snapshot verification options");
  rejectRawFields(options, "snapshot verification options");
  if (Object.keys(options).some((key) => !["records", "expectedProtocolReceiptDigest"].includes(key))) {
    throw new Error("snapshot verification options are not closed");
  }
  const { records, expectedProtocolReceiptDigest } = options;
  const summary = verifyObservatoryRecord(snapshot);
  if (summary.recordType !== "ObservatorySnapshot") throw new Error("record is not an observatory snapshot");
  if (!Array.isArray(records)) throw new TypeError("snapshot verification requires source records");
  if (expectedProtocolReceiptDigest !== undefined
      && snapshot.body.protocolReceiptDigest !== expectedProtocolReceiptDigest) {
    throw new Error("snapshot protocol receipt root is stale");
  }
  const verified = records.map((record) => {
    const recordSummary = verifyObservatoryRecord(record);
    if (recordSummary.recordType === "ObservatorySnapshot") throw new Error("snapshot source records cannot contain a snapshot");
    return record;
  });
  const indexed = sortedRecordIndex(verified);
  const expectedDigests = indexed.map((record) => record.digest);
  const expectedTypes = indexed.map((record) => record.recordType);
  if (snapshot.body.recordCount !== indexed.length
      || canonicalJson(snapshot.body.recordDigests) !== canonicalJson(expectedDigests)
      || canonicalJson(snapshot.body.recordTypes) !== canonicalJson(expectedTypes)) {
    throw new Error("observatory snapshot does not bind its source records");
  }
  return Object.freeze({
    valid: true,
    snapshotDigest: snapshot.digest,
    protocolReceiptDigest: snapshot.body.protocolReceiptDigest,
    recordCount: indexed.length,
    retentionMode: snapshot.body.retentionPolicy.mode,
    rawContentStored: snapshot.body.rawContentStored,
  });
}
