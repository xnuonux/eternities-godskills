import { sha256 } from './io.mjs';
import { validateNaturalRequest } from './intent-contracts.mjs';
import { ROUTING_EFFECTS } from './routing-contracts.mjs';

const PROTOCOL = 'eternities-requested-effects-v1';
const CONTEXT_FIELDS = [
  'permittedEffects', 'availableAuthority', 'availablePreconditions',
  'forbiddenCapabilities', 'maximumRisk', 'minimumEvidenceConfidence',
  'contextBudget', 'maxCompositionSize',
];

// This pure boundary accepts JSON data, not objects with hidden state or
// serialization hooks. Reject values that JSON.stringify would silently drop.
function assertWire(value, label, parents = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)) return;
  if (typeof value !== 'object' || parents.has(value) || parents.size >= 64) {
    throw new TypeError(`${label} must be finite acyclic JSON data`);
  }
  const array = Array.isArray(value);
  const proto = Object.getPrototypeOf(value);
  if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) {
    throw new TypeError(`${label} must be a plain JSON object or array`);
  }
  const keys = Reflect.ownKeys(value).filter(key => !array || key !== 'length');
  if (array && (keys.length !== value.length ||
    keys.some((key, i) => key !== String(i)))) {
    throw new TypeError(`${label} must be a dense JSON array`);
  }
  parents.add(value);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label} must contain only enumerable JSON data fields`);
    }
    assertWire(descriptor.value, `${label}.${key}`, parents);
  }
  parents.delete(value);
}

function exactFields(value, fields, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const keys = Object.keys(value);
  if (keys.length !== fields.length || fields.some(key => !Object.hasOwn(value, key))) {
    throw new Error(`${label} must contain exactly: ${fields.join(', ')}`);
  }
}

function digest(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 digest`);
  }
}

function strings(value, label) {
  if (!Array.isArray(value) || value.some((s, i) => typeof s !== 'string' ||
    s.length === 0 || s.trim() !== s || (i > 0 && value[i - 1] >= s))) {
    throw new Error(`${label} must be sorted unique nonempty strings`);
  }
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value) { return sha256(canonical(value)); }

function validateInput(request, expectedSource) {
  assertWire(request, 'request');
  exactFields(request, ['schemaVersion','requestId','text','context','routeMode','effectAssessment'], 'request');
  if (request.schemaVersion !== 2 || request.routeMode !== 'effect-only') {
    throw new Error('request requires schemaVersion 2 and explicit effect-only routeMode');
  }
  exactFields(request.context, CONTEXT_FIELDS, 'request.context');
  // Validation projection only: no v1 classification, route or dispatch.
  validateNaturalRequest({schemaVersion:1, requestId:request.requestId, text:request.text, context:request.context});
  const a = request.effectAssessment;
  exactFields(a, ['protocolId','subjectDigest','state','requestedEffects','unresolvedDecisions','producerDescriptorDigest'], 'effectAssessment');
  if (a.protocolId !== PROTOCOL) throw new Error('unsupported assessment protocolId');
  if (!['known','unknown','conflicting'].includes(a.state)) throw new Error('unsupported assessment state');
  digest(a.subjectDigest, 'effectAssessment.subjectDigest');
  digest(a.producerDescriptorDigest, 'effectAssessment.producerDescriptorDigest');
  strings(a.requestedEffects, 'effectAssessment.requestedEffects');
  strings(a.unresolvedDecisions, 'effectAssessment.unresolvedDecisions');
  if (a.requestedEffects.some(effect => !ROUTING_EFFECTS.includes(effect)) ||
    (a.requestedEffects.includes('none') && a.requestedEffects.length !== 1)) {
    throw new Error('invalid assessment requestedEffects');
  }
  if (a.state === 'known' ? a.requestedEffects.length === 0 || a.unresolvedDecisions.length !== 0
    : a.unresolvedDecisions.length === 0) {
    throw new Error('assessment state and effect/reason completeness disagree');
  }
  assertWire(expectedSource, 'expectedSource');
  exactFields(expectedSource, ['subjectDigest','producerDescriptorDigest','requestDigest'], 'expectedSource');
  for (const field of Object.keys(expectedSource)) digest(expectedSource[field], `expectedSource.${field}`);
  if (expectedSource.subjectDigest !== a.subjectDigest ||
    expectedSource.producerDescriptorDigest !== a.producerDescriptorDigest ||
    expectedSource.requestDigest !== hash(request)) {
    throw new Error('effect-only source binding mismatch');
  }
}

/**
 * Pure consistency consumer, not producer authentication or execution authority.
 * expectedSource MUST be supplied by separately verified trusted ingress. The
 * host owns whole-subject S verification, pinned producer policy, artifact-root
 * restrictions and any subsequent native admission. Do not derive that trust
 * from labels or digest values inside an arbitrary untrusted request.
 */
export function compileAndRouteEffectOnlyV2({request, expectedSource}) {
  validateInput(request, expectedSource);
  const a = request.effectAssessment;
  const context = request.context;
  const decisions = new Set(a.unresolvedDecisions);
  if (a.state !== 'known') decisions.add(`effect-intent-${a.state}`);
  for (const effect of a.requestedEffects) {
    if (effect === 'none') continue;
    if (!context.permittedEffects.includes(effect)) decisions.add(`effect-not-permitted:${effect}`);
    if (!context.availableAuthority.includes(effect)) decisions.add(`authority-missing:${effect}`);
    if (effect.startsWith('external-')) decisions.add(`unsupported-effect-only-scope:${effect}`);
  }
  const unresolvedDecisions = [...decisions].sort();
  const binding = {
    protocolId: a.protocolId,
    subjectDigest: a.subjectDigest,
    state: a.state,
    assessmentDigest: hash(a),
    producerDescriptorDigest: a.producerDescriptorDigest,
  };
  const envelope = {
    schemaVersion: 2,
    requestId: request.requestId,
    outcome: request.text,
    candidateFamilies: [],
    requiredCapabilities: [],
    ...structuredClone(context),
    unresolvedDecisions: [...unresolvedDecisions],
    routeMode: 'effect-only',
    requestedEffects: [...a.requestedEffects],
    assessmentBinding: {...binding},
  };
  const compilerReceipt = {
    schemaVersion: 2,
    requestId: request.requestId,
    requestDigest: hash(request),
    textDigest: sha256(request.text),
    mode: 'effect-only',
    candidateScores: [],
    acceptedProposalIds: [],
    rejectedProposalIds: [],
    requestedEffects: [...a.requestedEffects],
    suppliedAuthority: [...context.availableAuthority],
    unresolvedDecisions: [...unresolvedDecisions],
    confidence: 'low',
    envelope,
    proofLimits: [
      'does-not-authenticate-producer-origin',
      'does-not-execute-or-authorize-native-dispatch',
      'does-not-prove-arbitrary-natural-language-understanding',
      'local-only-explicit-structured-workflow',
    ],
    assessmentBinding: {...binding},
  };
  const routeReceipt = {
    schemaVersion: 2,
    requestId: request.requestId,
    requestDigest: hash(envelope),
    requestFeatures: {
      candidateFamilies: [],
      requiredCapabilities: [],
      permittedEffects: [...context.permittedEffects],
      maximumRisk: context.maximumRisk,
      minimumEvidenceConfidence: context.minimumEvidenceConfidence,
      contextBudget: context.contextBudget,
      routeMode: 'effect-only',
      requestedEffects: [...a.requestedEffects],
      assessmentBinding: {...binding},
    },
    candidateIds: [],
    rejected: [],
    unresolvedDecisions: [...unresolvedDecisions],
    decisionPolicy: 'effect-only-v2',
    status: unresolvedDecisions.length ? 'needs-decision' : 'no-qualified-route',
    selectionKind: 'none',
    selectedIds: [],
    selectedEntrypoints: [],
    selectionConfidence: null,
    reasonCode: unresolvedDecisions.length ? 'effect-only-needs-decision' : 'effect-only-no-skill-requested',
    assessmentBinding: {...binding},
  };
  return {compilerReceipt, routeReceipt};
}

/** Exact request-bound verification of persisted/returned receipts, without I/O. */
export function verifyEffectOnlyV2Result({request, expectedSource, result}) {
  const expected = compileAndRouteEffectOnlyV2({request, expectedSource});
  assertWire(result, 'result');
  if (canonical(result) !== canonical(expected)) throw new Error('effect-only result mismatch');
  return result;
}
