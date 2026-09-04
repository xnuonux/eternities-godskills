import { canonicalJson } from "./capability-layer-abi.mjs";
import { sha256 } from "./io.mjs";

export const GODSKILL_PROTOCOL_ID = "eternities-godskill-protocol-v1";
export const GODSKILL_PROTOCOL_SCHEMA_VERSION = 1;

export const PROTOCOL_MESSAGE_TYPES = Object.freeze([
  "MissionEnvelope",
  "CapabilityQuery",
  "SelectionDecision",
  "ActivationDecision",
  "AuthorityIntersection",
  "DisclosureEnvelope",
  "ArtifactObservation",
  "ReviewObservation",
  "AcceptanceVerdict",
  "EvidenceProposal",
  "LifecycleDecision",
]);

export const PROTOCOL_EFFECTS = Object.freeze([
  "execute",
  "external-write",
  "network",
  "read",
  "write",
]);

const MESSAGE_OWNERS = Object.freeze({
  MissionEnvelope: "mission",
  CapabilityQuery: "router",
  SelectionDecision: "router",
  ActivationDecision: "activator",
  AuthorityIntersection: "authority",
  DisclosureEnvelope: "discloser",
  ArtifactObservation: "observer",
  ReviewObservation: "reviewer",
  AcceptanceVerdict: "verdict",
  EvidenceProposal: "evidence",
  LifecycleDecision: "lifecycle",
});

const MESSAGE_STATUSES = Object.freeze({
  MissionEnvelope: Object.freeze(["open", "paused", "closed"]),
  CapabilityQuery: Object.freeze(["proposed", "resolved", "unresolved", "rejected"]),
  SelectionDecision: Object.freeze(["selected", "paused", "rejected"]),
  ActivationDecision: Object.freeze(["proposed", "activated", "deferred", "rejected"]),
  AuthorityIntersection: Object.freeze(["allowed", "partially-allowed", "denied"]),
  DisclosureEnvelope: Object.freeze(["prepared", "disclosed", "deferred", "refused"]),
  ArtifactObservation: Object.freeze(["observed", "incomplete", "failed"]),
  ReviewObservation: Object.freeze(["observed", "inconclusive", "rejected"]),
  AcceptanceVerdict: Object.freeze(["accepted", "rejected", "uncertain"]),
  EvidenceProposal: Object.freeze(["proposed", "eligible", "deferred", "rejected"]),
  LifecycleDecision: Object.freeze(["recorded", "rejected"]),
});

const PARENT_TYPES = Object.freeze({
  MissionEnvelope: Object.freeze([]),
  CapabilityQuery: Object.freeze(["MissionEnvelope"]),
  SelectionDecision: Object.freeze(["MissionEnvelope", "CapabilityQuery"]),
  ActivationDecision: Object.freeze(["SelectionDecision"]),
  AuthorityIntersection: Object.freeze(["ActivationDecision"]),
  DisclosureEnvelope: Object.freeze(["ActivationDecision", "AuthorityIntersection"]),
  ArtifactObservation: Object.freeze(["DisclosureEnvelope"]),
  ReviewObservation: Object.freeze(["ArtifactObservation"]),
  AcceptanceVerdict: Object.freeze(["ArtifactObservation", "ReviewObservation"]),
  EvidenceProposal: Object.freeze(["AcceptanceVerdict"]),
  LifecycleDecision: Object.freeze(["EvidenceProposal"]),
});

const MESSAGE_BODY_KEYS = Object.freeze({
  MissionEnvelope: Object.freeze([
    "objectiveDigest",
    "authorityDigest",
    "targetDigest",
    "consequenceClass",
    "contentMode",
  ]),
  CapabilityQuery: Object.freeze([
    "queryDigest",
    "requestedEffects",
    "candidateLimit",
    "hostKind",
    "acceptedProtocols",
  ]),
  SelectionDecision: Object.freeze([
    "selectedPackageDigest",
    "selectedCapabilityId",
    "selectedCapabilityVersion",
    "selectionMode",
    "reasonCodes",
    "selectedEffects",
  ]),
  ActivationDecision: Object.freeze([
    "mode",
    "capabilityId",
    "capabilityVersion",
    "packageDigest",
    "disclosurePlanDigest",
    "explicitIntent",
    "matchedEvidenceDigest",
    "authorityExpanded",
  ]),
  AuthorityIntersection: Object.freeze([
    "requestedEffects",
    "grantedEffects",
    "authorityCeilingDigest",
    "targetDigest",
    "externalMutationAllowed",
    "authorityExpanded",
    "decision",
  ]),
  DisclosureEnvelope: Object.freeze([
    "packageDigest",
    "mode",
    "layer",
    "contentDigest",
    "contentBytes",
    "artifactRequired",
  ]),
  ArtifactObservation: Object.freeze([
    "artifactDigest",
    "artifactKind",
    "artifactBytes",
    "effectObserved",
    "metrics",
    "rawContentStored",
  ]),
  ReviewObservation: Object.freeze([
    "reviewerId",
    "reviewDigest",
    "reviewedArtifactDigest",
    "verdict",
    "evidenceLevel",
    "findingsDigest",
  ]),
  AcceptanceVerdict: Object.freeze([
    "artifactDigest",
    "verdict",
    "reasonCodes",
    "qualityClaim",
    "evidenceDigest",
  ]),
  EvidenceProposal: Object.freeze([
    "evidenceDigest",
    "evidenceLevel",
    "inputDigests",
    "candidateStatus",
    "promotionEligible",
  ]),
  LifecycleDecision: Object.freeze([
    "evidenceDigest",
    "decision",
    "authorityDigest",
    "reasonCodes",
    "version",
  ]),
});

const MESSAGE_ENVELOPE_KEYS = Object.freeze([
  "schemaVersion",
  "protocolId",
  "messageType",
  "messageId",
  "missionId",
  "parentIds",
  "owner",
  "status",
  "body",
  "digest",
]);

const lexicallySorted = (values) => [...values].sort((left, right) => (
  left < right ? -1 : left > right ? 1 : 0
));

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

function boundedString(value, label, maximum = 128) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum
      || /[\r\n\0]/.test(value)) {
    throw new TypeError(label + " must be bounded text without control delimiters");
  }
  return value;
}

function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) throw new Error(label + " is unsupported");
  return value;
}

function integer(value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(label + " must be a bounded integer");
  }
  return value;
}

function nonNegativeNumberOrNull(value, label) {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
    throw new TypeError(label + " must be a non-negative number or null");
  }
  return value;
}

function stringArray(value, label, { allowEmpty = false, maximum = 64 } = {}) {
  if (!Array.isArray(value) || value.length > maximum || (!allowEmpty && value.length === 0)
      || value.some((item) => typeof item !== "string" || item.length === 0 || /[\r\n\0]/.test(item))) {
    throw new TypeError(label + " must be a bounded string array");
  }
  const sorted = lexicallySorted(value);
  if (JSON.stringify(sorted) !== JSON.stringify(value)) {
    throw new Error(label + " must be in canonical order");
  }
  if (new Set(value).size !== value.length) throw new Error(label + " contains a duplicate");
  return value;
}

function effects(value, label, { allowEmpty = false } = {}) {
  stringArray(value, label, { allowEmpty, maximum: PROTOCOL_EFFECTS.length });
  for (const effect of value) enumValue(effect, PROTOCOL_EFFECTS, label + " effect");
  return value;
}

function validateMetrics(metrics) {
  exactKeys(metrics, ["tokens", "latencyMs", "costMinorUnits"], "observation metrics");
  integer(metrics.tokens, "observation token metric", 0);
  nonNegativeNumberOrNull(metrics.latencyMs, "observation latency metric");
  nonNegativeNumberOrNull(metrics.costMinorUnits, "observation cost metric");
}

function validateBody(messageType, status, body) {
  object(body, messageType + " body");
  exactKeys(body, MESSAGE_BODY_KEYS[messageType], messageType + " body");
  switch (messageType) {
    case "MissionEnvelope":
      digest(body.objectiveDigest, "mission objective digest");
      digest(body.authorityDigest, "mission authority digest");
      digest(body.targetDigest, "mission target digest");
      enumValue(body.consequenceClass, ["low", "medium", "high", "critical"], "mission consequence class");
      enumValue(body.contentMode, ["digest-only", "user-authorized-content"], "mission content mode");
      break;
    case "CapabilityQuery":
      digest(body.queryDigest, "capability query digest");
      effects(body.requestedEffects, "capability query effects");
      integer(body.candidateLimit, "capability query candidate limit", 1, 32);
      boundedString(body.hostKind, "capability query host kind");
      stringArray(body.acceptedProtocols, "capability query protocols");
      break;
    case "SelectionDecision":
      nullableDigest(body.selectedPackageDigest, "selection package digest");
      if (body.selectedCapabilityId !== null) identifier(body.selectedCapabilityId, "selected capability id");
      if (body.selectedCapabilityVersion !== null) {
        integer(body.selectedCapabilityVersion, "selected capability version", 1);
      }
      enumValue(body.selectionMode, ["single", "composition", "none"], "selection mode");
      stringArray(body.reasonCodes, "selection reason codes");
      effects(body.selectedEffects, "selected effects", { allowEmpty: true });
      if (status === "selected") {
        if (body.selectedPackageDigest === null || body.selectedCapabilityId === null
            || body.selectedCapabilityVersion === null || body.selectionMode === "none"
            || body.selectedEffects.length === 0) {
          throw new Error("selected decision must carry a selected capability");
        }
      }
      if (status !== "selected" && body.selectionMode !== "none") {
        throw new Error("non-selected decision must use selection mode none");
      }
      break;
    case "ActivationDecision":
      enumValue(body.mode, ["native", "guardrail", "method", "review"], "activation mode");
      identifier(body.capabilityId, "activation capability id");
      integer(body.capabilityVersion, "activation capability version", 1);
      digest(body.packageDigest, "activation package digest");
      digest(body.disclosurePlanDigest, "activation disclosure plan digest");
      if (typeof body.explicitIntent !== "boolean") throw new TypeError("activation explicit intent must be boolean");
      nullableDigest(body.matchedEvidenceDigest, "activation matched evidence digest");
      if (body.authorityExpanded !== false) throw new Error("activation cannot expand authority");
      break;
    case "AuthorityIntersection":
      effects(body.requestedEffects, "authority requested effects");
      effects(body.grantedEffects, "authority granted effects", { allowEmpty: true });
      for (const effect of body.grantedEffects) {
        if (!body.requestedEffects.includes(effect)) throw new Error("authority intersection widened effects");
      }
      digest(body.authorityCeilingDigest, "authority ceiling digest");
      digest(body.targetDigest, "authority target digest");
      if (typeof body.externalMutationAllowed !== "boolean") {
        throw new TypeError("external mutation authority must be boolean");
      }
      if (body.authorityExpanded !== false) throw new Error("authority intersection cannot expand authority");
      enumValue(body.decision, ["allowed", "partially-allowed", "denied"], "authority decision");
      if (body.decision === "allowed" && body.grantedEffects.length !== body.requestedEffects.length) {
        throw new Error("allowed authority decision must grant every requested effect");
      }
      if (body.decision === "denied" && body.grantedEffects.length !== 0) {
        throw new Error("denied authority decision cannot grant effects");
      }
      break;
    case "DisclosureEnvelope":
      digest(body.packageDigest, "disclosure package digest");
      enumValue(body.mode, ["native", "guardrail", "method", "review"], "disclosure mode");
      enumValue(body.layer, ["none", "guardrails", "method", "reviewer", "contract"], "disclosure layer");
      nullableDigest(body.contentDigest, "disclosure content digest");
      integer(body.contentBytes, "disclosure content bytes", 0);
      if (typeof body.artifactRequired !== "boolean") throw new TypeError("disclosure artifact requirement must be boolean");
      break;
    case "ArtifactObservation":
      digest(body.artifactDigest, "artifact digest");
      identifier(body.artifactKind, "artifact kind");
      integer(body.artifactBytes, "artifact bytes", 0);
      enumValue(body.effectObserved, PROTOCOL_EFFECTS.concat(["none", "unknown"]), "observed effect");
      validateMetrics(body.metrics);
      if (body.rawContentStored !== false) throw new Error("raw mission content cannot be stored by default");
      break;
    case "ReviewObservation":
      identifier(body.reviewerId, "reviewer id");
      digest(body.reviewDigest, "review digest");
      digest(body.reviewedArtifactDigest, "reviewed artifact digest");
      enumValue(body.verdict, ["pass", "fail", "inconclusive"], "review verdict");
      enumValue(body.evidenceLevel, ["structural", "artifact", "model", "cross-model", "field", "universal"], "review evidence level");
      nullableDigest(body.findingsDigest, "review findings digest");
      break;
    case "AcceptanceVerdict":
      digest(body.artifactDigest, "acceptance artifact digest");
      enumValue(body.verdict, ["accepted", "rejected", "uncertain"], "acceptance verdict");
      stringArray(body.reasonCodes, "acceptance reason codes");
      enumValue(body.qualityClaim, ["none", "structural", "artifact", "model", "cross-model", "field", "universal"], "acceptance quality claim");
      nullableDigest(body.evidenceDigest, "acceptance evidence digest");
      if (body.verdict === "accepted" && (body.evidenceDigest === null || body.qualityClaim === "none")) {
        throw new Error("accepted artifact needs evidence and a bounded quality claim");
      }
      break;
    case "EvidenceProposal":
      digest(body.evidenceDigest, "evidence proposal digest");
      enumValue(body.evidenceLevel, ["structural", "artifact", "model", "cross-model", "field", "universal"], "evidence proposal level");
      stringArray(body.inputDigests, "evidence proposal inputs");
      enumValue(body.candidateStatus, ["proposed", "eligible", "deferred", "rejected"], "evidence candidate status");
      if (typeof body.promotionEligible !== "boolean") throw new TypeError("evidence promotion eligibility must be boolean");
      break;
    case "LifecycleDecision":
      digest(body.evidenceDigest, "lifecycle evidence digest");
      enumValue(body.decision, ["retain", "promote", "demote", "defer"], "lifecycle decision");
      digest(body.authorityDigest, "lifecycle authority digest");
      stringArray(body.reasonCodes, "lifecycle reason codes");
      integer(body.version, "lifecycle version", 1);
      break;
    default:
      throw new Error("unsupported protocol message type");
  }
  return body;
}

function validateParentIds(parentIds) {
  if (!Array.isArray(parentIds) || parentIds.some((parentId) => typeof parentId !== "string")) {
    throw new TypeError("protocol parent ids must be an array of identifiers");
  }
  for (const parentId of parentIds) identifier(parentId, "protocol parent id");
  if (new Set(parentIds).size !== parentIds.length) throw new Error("protocol parent ids contain a duplicate");
  if (JSON.stringify(parentIds) !== JSON.stringify(lexicallySorted(parentIds))) {
    throw new Error("protocol parent ids must be in canonical order");
  }
}

function unsignedMessage(message) {
  const { digest: ignoredDigest, ...unsigned } = message;
  void ignoredDigest;
  return unsigned;
}

function messageDigest(message) {
  return sha256(canonicalJson(unsignedMessage(message)));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function freezeMessage(message) {
  return deepFreeze({
    ...message,
    parentIds: Object.freeze([...message.parentIds]),
    body: Object.freeze({ ...message.body }),
  });
}

export function buildProtocolMessage({
  messageType,
  messageId,
  missionId,
  parentIds = [],
  status,
  body,
}) {
  if (!PROTOCOL_MESSAGE_TYPES.includes(messageType)) throw new Error("protocol message type is unsupported");
  identifier(messageId, "protocol message id");
  identifier(missionId, "protocol mission id");
  if (messageType === "MissionEnvelope" && messageId !== missionId) {
    throw new Error("mission message id must equal mission id");
  }
  validateParentIds(lexicallySorted(parentIds));
  enumValue(status, MESSAGE_STATUSES[messageType], messageType + " status");
  validateBody(messageType, status, body);
  const message = {
    schemaVersion: GODSKILL_PROTOCOL_SCHEMA_VERSION,
    protocolId: GODSKILL_PROTOCOL_ID,
    messageType,
    messageId,
    missionId,
    parentIds: lexicallySorted(parentIds),
    owner: MESSAGE_OWNERS[messageType],
    status,
    body: { ...body },
  };
  return freezeMessage({ ...message, digest: messageDigest(message) });
}

export function verifyProtocolMessage(message) {
  exactKeys(message, MESSAGE_ENVELOPE_KEYS, "protocol message");
  if (message.schemaVersion !== GODSKILL_PROTOCOL_SCHEMA_VERSION
      || message.protocolId !== GODSKILL_PROTOCOL_ID) {
    throw new Error("protocol message identity is invalid");
  }
  if (!PROTOCOL_MESSAGE_TYPES.includes(message.messageType)) {
    throw new Error("protocol message type is unsupported");
  }
  identifier(message.messageId, "protocol message id");
  identifier(message.missionId, "protocol mission id");
  if (message.messageType === "MissionEnvelope" && message.messageId !== message.missionId) {
    throw new Error("mission message id must equal mission id");
  }
  validateParentIds(message.parentIds);
  if (message.owner !== MESSAGE_OWNERS[message.messageType]) {
    throw new Error("protocol message owner is not canonical");
  }
  enumValue(message.status, MESSAGE_STATUSES[message.messageType], message.messageType + " status");
  validateBody(message.messageType, message.status, message.body);
  digest(message.digest, "protocol message digest");
  if (messageDigest(message) !== message.digest) {
    throw new Error("protocol message digest does not match its body");
  }
  return Object.freeze({
    valid: true,
    protocolId: message.protocolId,
    messageType: message.messageType,
    messageId: message.messageId,
    missionId: message.missionId,
    parentIds: Object.freeze([...message.parentIds]),
    owner: message.owner,
    status: message.status,
    digest: message.digest,
  });
}

function parentOfType(messagesById, message, parentType) {
  const parent = message.parentIds
    .map((parentId) => messagesById.get(parentId))
    .find((candidate) => candidate?.messageType === parentType);
  if (!parent) throw new Error(message.messageType + " is missing parent type " + parentType);
  return parent;
}

function assertParentShape(messagesById, message) {
  const expectedTypes = PARENT_TYPES[message.messageType];
  if (message.parentIds.length !== expectedTypes.length) {
    throw new Error(message.messageType + " has the wrong parent count");
  }
  const actualTypes = message.parentIds.map((parentId) => {
    const parent = messagesById.get(parentId);
    if (!parent) throw new Error(message.messageType + " references an unknown parent");
    return parent.messageType;
  }).sort();
  const wantedTypes = [...expectedTypes].sort();
  if (JSON.stringify(actualTypes) !== JSON.stringify(wantedTypes)) {
    throw new Error(message.messageType + " has the wrong parent types");
  }
}

function assertSubset(subset, superset, label) {
  for (const value of subset) {
    if (!superset.includes(value)) throw new Error(label + " widened a declared set");
  }
}

function assertCrossMessageRules(messagesByType, messagesById) {
  const mission = messagesByType.get("MissionEnvelope");
  const query = messagesByType.get("CapabilityQuery");
  const selection = messagesByType.get("SelectionDecision");
  const activation = messagesByType.get("ActivationDecision");
  const authority = messagesByType.get("AuthorityIntersection");
  const disclosure = messagesByType.get("DisclosureEnvelope");
  const artifact = messagesByType.get("ArtifactObservation");
  const review = messagesByType.get("ReviewObservation");
  const verdict = messagesByType.get("AcceptanceVerdict");
  const proposal = messagesByType.get("EvidenceProposal");
  const lifecycle = messagesByType.get("LifecycleDecision");

  if (mission && mission.body.contentMode !== "digest-only") {
    throw new Error("protocol mission content must remain digest-only in v1");
  }
  if (query) {
    if (!query.body.acceptedProtocols.includes("eternities-godskill-package-v1")) {
      throw new Error("capability query must accept the inert package protocol");
    }
  }
  if (selection && query) {
    assertSubset(selection.body.selectedEffects, query.body.requestedEffects, "selection effects");
    if (selection.status !== "selected" && selection.body.selectionMode !== "none") {
      throw new Error("unresolved selection cannot carry a capability");
    }
  }
  if (activation && selection) {
    if (selection.body.selectedCapabilityId === null
        || activation.body.capabilityId !== selection.body.selectedCapabilityId
        || activation.body.capabilityVersion !== selection.body.selectedCapabilityVersion
        || activation.body.packageDigest !== selection.body.selectedPackageDigest) {
      throw new Error("activation does not match the selected capability");
    }
  }
  if (authority && query) {
    assertSubset(authority.body.grantedEffects, query.body.requestedEffects, "authority effects");
    if (JSON.stringify(authority.body.requestedEffects) !== JSON.stringify(query.body.requestedEffects)) {
      throw new Error("authority intersection changed the requested effect set");
    }
  }
  if (authority && authority.body.authorityExpanded !== false) {
    throw new Error("authority intersection expanded authority");
  }
  if (disclosure && activation) {
    if (disclosure.body.packageDigest !== activation.body.packageDigest
        || disclosure.body.mode !== activation.body.mode) {
      throw new Error("disclosure does not match activation");
    }
    const expectedLayer = {
      native: "none",
      guardrail: "guardrails",
      method: "method",
      review: "reviewer",
    }[activation.body.mode];
    if (disclosure.body.layer !== expectedLayer) throw new Error("disclosure layer does not match activation mode");
    if (expectedLayer === "none"
        && (disclosure.body.contentDigest !== null || disclosure.body.contentBytes !== 0)) {
      throw new Error("native disclosure cannot carry layer content");
    }
    if (expectedLayer !== "none" && disclosure.body.contentDigest === null) {
      throw new Error("selected disclosure must carry an exact content digest");
    }
  }
  if (artifact && disclosure && artifact.parentIds.includes(disclosure.messageId) === false) {
    throw new Error("artifact observation is not bound to its disclosure");
  }
  if (review && artifact && review.body.reviewedArtifactDigest !== artifact.body.artifactDigest) {
    throw new Error("review observation is not bound to the observed artifact");
  }
  if (verdict && artifact && verdict.body.artifactDigest !== artifact.body.artifactDigest) {
    throw new Error("acceptance verdict is not bound to the observed artifact");
  }
  if (verdict && review && verdict.status === "accepted" && review.body.verdict !== "pass") {
    throw new Error("accepted verdict contradicts a failed or inconclusive review");
  }
  if (proposal && verdict) {
    if (!proposal.body.inputDigests.includes(verdict.digest)) {
      throw new Error("evidence proposal does not bind the acceptance verdict");
    }
    if (proposal.body.candidateStatus === "eligible" && proposal.body.promotionEligible !== true) {
      throw new Error("eligible evidence proposal must state its eligibility");
    }
  }
  if (lifecycle && proposal) {
    if (lifecycle.body.evidenceDigest !== proposal.body.evidenceDigest) {
      throw new Error("lifecycle decision is not bound to its evidence proposal");
    }
    if (lifecycle.body.decision === "promote"
        && (proposal.body.promotionEligible !== true || proposal.body.candidateStatus !== "eligible")) {
      throw new Error("promotion requires an eligible evidence proposal");
    }
  }
  for (const message of messagesById.values()) {
    if (message.messageType === "ActivationDecision" && message.body.authorityExpanded !== false) {
      throw new Error("activation authority expansion is forbidden");
    }
  }
}

export function verifyProtocolChain(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new TypeError("protocol chain must be a non-empty message array");
  }
  const messagesById = new Map();
  const messagesByType = new Map();
  const summaries = [];
  for (const [index, message] of messages.entries()) {
    const summary = verifyProtocolMessage(message);
    if (messagesById.has(summary.messageId)) throw new Error("protocol chain contains a duplicate message id");
    if (messagesByType.has(summary.messageType)) throw new Error("protocol chain contains a duplicate message type");
    for (const parentId of summary.parentIds) {
      if (!messagesById.has(parentId)) throw new Error("protocol chain must be topologically ordered");
    }
    if (index > 0 && summary.messageType !== PROTOCOL_MESSAGE_TYPES[index]) {
      throw new Error("protocol chain message order is not canonical");
    }
    if (index === 0 && summary.messageType !== "MissionEnvelope") {
      throw new Error("protocol chain must begin with a mission envelope");
    }
    messagesById.set(summary.messageId, message);
    messagesByType.set(summary.messageType, message);
    summaries.push(summary);
  }
  const missionId = summaries[0].missionId;
  for (const summary of summaries) {
    if (summary.missionId !== missionId) throw new Error("protocol chain crosses mission identities");
    assertParentShape(messagesById, messagesById.get(summary.messageId));
  }
  assertCrossMessageRules(messagesByType, messagesById);
  const chainDigest = sha256(canonicalJson(messages));
  return Object.freeze({
    valid: true,
    protocolId: GODSKILL_PROTOCOL_ID,
    missionId,
    messageCount: messages.length,
    complete: messages.length === PROTOCOL_MESSAGE_TYPES.length,
    lastMessageType: summaries.at(-1).messageType,
    chainDigest,
    messageDigests: Object.freeze(summaries.map((summary) => summary.digest)),
    requestedEffects: Object.freeze(
      messagesByType.get("CapabilityQuery")?.body.requestedEffects ?? [],
    ),
    grantedEffects: Object.freeze(
      messagesByType.get("AuthorityIntersection")?.body.grantedEffects ?? [],
    ),
    authorityExpanded: false,
  });
}
