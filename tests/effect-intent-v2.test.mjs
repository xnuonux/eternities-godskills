import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compileAndRouteEffectOnlyV2, verifyEffectOnlyV2Result } from '../src/effect-intent-v2.mjs';
import { validateNaturalRequest } from '../src/intent-contracts.mjs';
import { validateRequestEnvelope } from '../src/routing-contracts.mjs';

const vector = JSON.parse(readFileSync(new URL('../data/effect-only-golden-vector-v2.json', import.meta.url)));
const expectedResult = JSON.parse(readFileSync(new URL('../data/effect-only-result-v2.json', import.meta.url)));
const canonical = (v) => JSON.stringify(v, function (_key, value) {
  return value && !Array.isArray(value) && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]])) : value;
});
const hash = v => createHash('sha256').update(canonical(v)).digest('hex');
const fresh = () => structuredClone({request: vector.request, expectedSource: vector.expectedSource});
// Test-only trusted-source preparation. Mutation tests that model tampering
// deliberately keep the ORIGINAL expectedSource instead of calling this.
const bind = request => ({request, expectedSource: {
  subjectDigest: request.effectAssessment.subjectDigest,
  producerDescriptorDigest: request.effectAssessment.producerDescriptorDigest,
  requestDigest: hash(request),
}});

test('independently reviewed full wire vector stays interoperable', () => {
  assert.deepEqual(compileAndRouteEffectOnlyV2(fresh()), expectedResult);
  assert.equal(expectedResult.routeReceipt.requestDigest,
    '314a64cdf75866bb1bce22c4dd11cd727d14b2e4e751a14c93e23e5c8ceb2349');
});

test('independent host golden input produces understood no-skill receipts with exact acyclic bindings', () => {
  const before = fresh();
  const result = compileAndRouteEffectOnlyV2(before);
  const {compilerReceipt: c, routeReceipt: r} = result;
  assert.deepEqual(before, fresh());
  assert.equal(hash(vector.subject), 'f82be214b317cd90a4b4ea060f0d5b7322fd2088878e8e9af9eb5b58a4616655');
  assert.equal(hash(vector.producerDescriptor), 'bd00071f046bd5f8612a65cfe674d417b8b21c3fb25bad41634bb734b08bfc26');
  assert.equal(c.requestDigest, 'a8e6adad64894409b3b5aee6a57f37abc7333b990b05cc4f04dc487a7c20a11a');
  assert.equal(c.assessmentBinding.assessmentDigest, '2d996007d2fd5692e3760aede8b28f6a018723785bdc7148282bd75d64a2918d');
  assert.equal(c.textDigest, createHash('sha256').update(vector.request.text).digest('hex'));
  assert.equal(c.mode, 'effect-only');
  assert.equal(c.confidence, 'low');
  assert.equal(c.schemaVersion, 2);
  assert.equal(c.envelope.schemaVersion, 2);
  assert.equal(c.envelope.routeMode, 'effect-only');
  assert.equal(c.envelope.outcome, vector.request.text);
  assert.deepEqual(c.requestedEffects, ['local-read', 'local-write']);
  assert.deepEqual(c.envelope.requiredCapabilities, []);
  assert.deepEqual(c.envelope.candidateFamilies, []);
  assert.deepEqual(c.candidateScores, []);
  assert.deepEqual(c.acceptedProposalIds, []);
  assert.deepEqual(c.rejectedProposalIds, []);
  assert.deepEqual(c.suppliedAuthority, ['local-read', 'local-write']);
  assert.deepEqual(c.envelope.availableAuthority, c.suppliedAuthority);
  assert.equal(r.schemaVersion, 2);
  assert.equal(r.status, 'no-qualified-route');
  assert.equal(r.reasonCode, 'effect-only-no-skill-requested');
  assert.equal(r.decisionPolicy, 'effect-only-v2');
  assert.equal(r.requestDigest, hash(c.envelope));
  assert.notEqual(r.requestDigest, c.requestDigest);
  assert.deepEqual(r.assessmentBinding, c.assessmentBinding);
  assert.deepEqual(r.requestFeatures.requestedEffects, ['local-read', 'local-write']);
  assert.deepEqual(r.requestFeatures.assessmentBinding, c.assessmentBinding);
  assert.deepEqual(r.unresolvedDecisions, []);
  assert.deepEqual(r.selectedIds, []);
  assert.deepEqual(r.candidateIds, []);
  assert.deepEqual(r.selectedEntrypoints, []);
  assert.deepEqual(r.rejected, []);
  assert.equal(r.selectionKind, 'none');
  assert.equal(r.selectionConfidence, null);
  assert.equal(verifyEffectOnlyV2Result({...before, result}), result);
});

for (const [field, values, reasons] of [
  ['permittedEffects', ['local-read'], ['effect-not-permitted:local-write']],
  ['availableAuthority', ['local-read'], ['authority-missing:local-write']],
  ['availableAuthority', ['local-read', 'realm:write'], ['authority-missing:local-write']],
]) test(`known effect survives denied ${field} ${values}`, () => {
  const {request} = fresh();
  request.context[field] = values;
  const {compilerReceipt: c, routeReceipt: r} = compileAndRouteEffectOnlyV2(bind(request));
  assert.equal(r.status, 'needs-decision');
  assert.equal(r.reasonCode, 'effect-only-needs-decision');
  assert.deepEqual(r.unresolvedDecisions, reasons);
  assert.deepEqual(c.requestedEffects, ['local-read', 'local-write']);
  assert.equal(c.assessmentBinding.state, 'known');
  assert.deepEqual(c.envelope[field], values);
});

test('both missing permissions are reported without intersection erasure', () => {
  const {request} = fresh();
  request.context.permittedEffects = ['none'];
  request.context.availableAuthority = [];
  const result = compileAndRouteEffectOnlyV2(bind(request));
  assert.deepEqual(result.routeReceipt.unresolvedDecisions, [
    'authority-missing:local-read', 'authority-missing:local-write',
    'effect-not-permitted:local-read', 'effect-not-permitted:local-write',
  ]);
  assert.deepEqual(result.compilerReceipt.requestedEffects, ['local-read', 'local-write']);
});

for (const state of ['unknown', 'conflicting']) {
  for (const requestedEffects of [[], ['local-write']]) test(`${state} preserves ${JSON.stringify(requestedEffects)} and never admits native route`, () => {
    const {request} = fresh();
    Object.assign(request.effectAssessment, {state, requestedEffects, unresolvedDecisions: ['producer-needs-input']});
    const {compilerReceipt: c, routeReceipt: r} = compileAndRouteEffectOnlyV2(bind(request));
    assert.equal(r.status, 'needs-decision');
    assert.deepEqual(c.requestedEffects, requestedEffects);
    assert.deepEqual(r.unresolvedDecisions, [`effect-intent-${state}`, 'producer-needs-input']);
  });
}

for (const effect of ['external-read', 'external-write']) test(`authorized ${effect} remains unsupported in local-only mode`, () => {
  const {request} = fresh();
  request.effectAssessment.requestedEffects = [effect];
  request.context.permittedEffects = [effect];
  request.context.availableAuthority = [effect];
  const {routeReceipt} = compileAndRouteEffectOnlyV2(bind(request));
  assert.equal(routeReceipt.status, 'needs-decision');
  assert.deepEqual(routeReceipt.unresolvedDecisions, [`unsupported-effect-only-scope:${effect}`]);
});

test('explicit known none needs no phantom permission or capability', () => {
  const {request} = fresh();
  request.effectAssessment.requestedEffects = ['none'];
  request.context.permittedEffects = ['none'];
  request.context.availableAuthority = [];
  const {routeReceipt} = compileAndRouteEffectOnlyV2(bind(request));
  assert.equal(routeReceipt.status, 'no-qualified-route');
  assert.deepEqual(routeReceipt.requestFeatures.requestedEffects, ['none']);
});

const malformed = [
  ['old version', r => {r.schemaVersion = 1;}],
  ['future version', r => {r.schemaVersion = 3;}],
  ['missing explicit mode', r => {delete r.routeMode;}],
  ['different mode', r => {r.routeMode = 'default';}],
  ['proposal injection', r => {r.proposal = {};}],
  ['preference override', r => {r.context.preferredCapabilities = [];}],
  ['unknown context field', r => {r.context.origin = 'host';}],
  ['invalid context budget', r => {r.context.contextBudget = 0;}],
  ['future protocol', r => {r.effectAssessment.protocolId = 'eternities-requested-effects-v2';}],
  ['missing assessment field', r => {delete r.effectAssessment.unresolvedDecisions;}],
  ['unknown assessment field', r => {r.effectAssessment.origin = 'host';}],
  ['unknown state', r => {r.effectAssessment.state = 'probably';}],
  ['empty known effects', r => {r.effectAssessment.requestedEffects = [];}],
  ['none mixed with effect', r => {r.effectAssessment.requestedEffects = ['local-read', 'none'];}],
  ['unknown effect', r => {r.effectAssessment.requestedEffects = ['realm:write'];}],
  ['duplicate effects', r => {r.effectAssessment.requestedEffects = ['local-read', 'local-read'];}],
  ['unordered effects', r => {r.effectAssessment.requestedEffects.reverse();}],
  ['known unresolved', r => {r.effectAssessment.unresolvedDecisions = ['why'];}],
  ['unknown no reasons', r => {r.effectAssessment.state = 'unknown';}],
  ['conflicting no reasons', r => {r.effectAssessment.state = 'conflicting';}],
  ['empty reason', r => {Object.assign(r.effectAssessment, {state:'unknown', unresolvedDecisions:['']});}],
  ['unordered reasons', r => {Object.assign(r.effectAssessment, {state:'unknown', unresolvedDecisions:['z','a']});}],
  ['duplicate reasons', r => {Object.assign(r.effectAssessment, {state:'unknown', unresolvedDecisions:['a','a']});}],
  ['invalid digest', r => {r.effectAssessment.subjectDigest = 'fake';}],
  ['uppercase digest', r => {r.effectAssessment.producerDescriptorDigest = 'A'.repeat(64);}],
];
for (const [label, mutate] of malformed) test(`rejects ${label} before producing receipt`, () => {
  const {request} = fresh();
  mutate(request);
  assert.throws(() => compileAndRouteEffectOnlyV2(bind(request)));
});

for (const [label, mutate] of [
  ['text with reused S', r => {r.text += ' and publish remotely';}],
  ['context with reused S', r => {r.context.availableAuthority.push('realm:write');}],
  ['assessment with reused S', r => {r.effectAssessment.requestedEffects = ['none'];}],
  ['subject substitution', r => {r.effectAssessment.subjectDigest = 'a'.repeat(64);}],
  ['producer substitution', r => {r.effectAssessment.producerDescriptorDigest = 'b'.repeat(64);}],
]) test(`original trusted source rejects ${label}`, () => {
  const input = fresh();
  mutate(input.request);
  assert.throws(() => compileAndRouteEffectOnlyV2(input), /binding|mismatch/);
});

for (const field of ['subjectDigest','producerDescriptorDigest','requestDigest']) test(`expected source requires exact ${field}`, () => {
  const input = fresh();
  input.expectedSource[field] = '0'.repeat(64);
  assert.throws(() => compileAndRouteEffectOnlyV2(input), /binding|mismatch/);
  delete input.expectedSource[field];
  assert.throws(() => compileAndRouteEffectOnlyV2(input));
});

test('source required separately, unknown source labels rejected', () => {
  const input = fresh();
  assert.throws(() => compileAndRouteEffectOnlyV2({request:input.request}));
  input.expectedSource.origin = 'host';
  assert.throws(() => compileAndRouteEffectOnlyV2(input));
});

for (const [label, mutate] of [
  ['status', x => {x.routeReceipt.status = 'selected';}],
  ['route digest confused with R', x => {x.routeReceipt.requestDigest = x.compilerReceipt.requestDigest;}],
  ['effects', x => {x.compilerReceipt.requestedEffects = ['none'];}],
  ['binding', x => {x.routeReceipt.assessmentBinding.subjectDigest = '0'.repeat(64);}],
  ['extra result field', x => {x.allowed = true;}],
  ['extra receipt field', x => {x.routeReceipt.allowed = true;}],
  ['missing receipt field', x => {delete x.compilerReceipt.textDigest;}],
  ['feature omission', x => {delete x.routeReceipt.requestFeatures.assessmentBinding;}],
  ['authority escalation', x => {x.compilerReceipt.envelope.availableAuthority.push('realm:write');}],
]) test(`exact verification rejects persisted ${label} mutation`, () => {
  const input = fresh();
  const result = compileAndRouteEffectOnlyV2(input);
  mutate(result);
  assert.throws(() => verifyEffectOnlyV2Result({...input,result}), /mismatch/);
});

test('v1 validators still reject v2 and empty capabilities', () => {
  const input = fresh();
  assert.throws(() => validateNaturalRequest(input.request), /must be 1/);
  const {compilerReceipt} = compileAndRouteEffectOnlyV2(input);
  assert.throws(() => validateRequestEnvelope(compilerReceipt.envelope), /must be 1/);
  assert.throws(() => validateRequestEnvelope({
    schemaVersion:1, requestId:'legacy', outcome:'unchanged', candidateFamilies:[], requiredCapabilities:[],
    ...vector.request.context, unresolvedDecisions:[],
  }), /must not be empty/);
});

test('request and returned receipts have independent snapshots', () => {
  const input = fresh();
  const result = compileAndRouteEffectOnlyV2(input);
  result.routeReceipt.assessmentBinding.state = 'unknown';
  result.routeReceipt.requestFeatures.requestedEffects.length = 0;
  assert.equal(result.compilerReceipt.assessmentBinding.state, 'known');
  assert.deepEqual(input, fresh());
  input.request.context.availableAuthority.length = 0;
  assert.deepEqual(result.compilerReceipt.suppliedAuthority, ['local-read','local-write']);
});

test('JSON-equivalent key order is accepted, not mistaken for tampering', () => {
  const input = fresh();
  const result = JSON.parse(canonical(compileAndRouteEffectOnlyV2(input)));
  assert.equal(verifyEffectOnlyV2Result({...input,result}), result);
});

for (const [label, mutate] of [
  ['undefined field', r => {r.extra = undefined;}],
  ['nonfinite number', r => {r.context.contextBudget = Infinity;}],
  ['inherited context', r => {r.context = Object.create(r.context);}],
  ['toJSON coercion', r => {r.toJSON = () => vector.request;}],
  ['sparse effects', r => {r.effectAssessment.requestedEffects = new Array(1);}],
  ['custom array prototype', r => {Object.setPrototypeOf(r.effectAssessment.requestedEffects, Object.create(Array.prototype));}],
]) test(`rejects non-wire input ${label}`, () => {
  const input = fresh();
  mutate(input.request);
  assert.throws(() => compileAndRouteEffectOnlyV2(input));
});

test('undefined extra result cannot disappear during comparison', () => {
  const input = fresh();
  const result = compileAndRouteEffectOnlyV2(input);
  result.extra = undefined;
  assert.throws(() => verifyEffectOnlyV2Result({...input,result}));
});
