import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { compileAndRouteEffectOnlyV2, verifyEffectOnlyV2Result } from '../src/effect-intent-v2.mjs';

// Development contract tests, not a held-out semantic study. No production
// ingress authentication, executable-root verification, provider or host is used.
const effects = ['external-read', 'external-write', 'local-read', 'local-write'];
const subsets = Array.from({ length: 16 }, (_, mask) => effects.filter((_, i) => mask & (1 << i)));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
const bind = request => ({ subjectDigest: request.effectAssessment.subjectDigest,
  producerDescriptorDigest: request.effectAssessment.producerDescriptorDigest, requestDigest: hash(request) });
function requestFor(state, requestedEffects, permittedEffects, availableAuthority) {
  return { schemaVersion: 2, requestId: 'policy-matrix', text: 'A fixed structured fixture operation.',
    context: { permittedEffects: permittedEffects.length ? [...permittedEffects] : ['none'],
      availableAuthority: [...availableAuthority], availablePreconditions: [], forbiddenCapabilities: [],
      maximumRisk: 'low', minimumEvidenceConfidence: 'low', contextBudget: 1024, maxCompositionSize: 1 },
    routeMode: 'effect-only', effectAssessment: { protocolId: 'eternities-requested-effects-v1',
      subjectDigest: 'a'.repeat(64), producerDescriptorDigest: 'b'.repeat(64), state,
      requestedEffects: [...requestedEffects], unresolvedDecisions: state === 'known' ? [] : ['fixture-unresolved'] } };
}

for (const state of ['known', 'unknown', 'conflicting']) {
  test(`finite permission matrix: ${state} stays distinct from authorization`, t => {
    let checked = 0, malformed = 0;
    for (const requested of [...subsets, ['none']]) {
      for (const permitted of subsets) for (const authority of subsets) {
        const request = requestFor(state, requested, permitted, authority);
        const original = structuredClone(request), expectedSource = bind(request);
        if (state === 'known' && requested.length === 0) {
          assert.throws(() => compileAndRouteEffectOnlyV2({ request, expectedSource }), /completeness/);
          malformed += 1; continue;
        }
        const result = compileAndRouteEffectOnlyV2({ request, expectedSource });
        const { compilerReceipt: compiler, routeReceipt: route } = result;
        // Independent truth table: acceptance requires complete knowledge, a
        // local-only request, and BOTH permission and authority for every effect.
        const accepted = state === 'known' && requested.every(effect => effect === 'none'
          || (effect.startsWith('local-') && permitted.includes(effect) && authority.includes(effect)));
        assert.equal(route.status, accepted ? 'no-qualified-route' : 'needs-decision');
        assert.equal(route.reasonCode, accepted ? 'effect-only-no-skill-requested' : 'effect-only-needs-decision');
        assert.equal(route.assessmentBinding.state, state);
        assert.deepEqual(compiler.requestedEffects, requested);
        assert.deepEqual(compiler.suppliedAuthority, authority);
        assert.deepEqual(compiler.envelope.availableAuthority, authority);
        assert.deepEqual(route.selectedIds, []);
        assert.deepEqual(route.selectedEntrypoints, []);
        assert.equal(route.selectionKind, 'none');
        assert.equal(compiler.confidence, 'low');
        for (const effect of requested.filter(effect => effect !== 'none')) {
          assert.equal(route.unresolvedDecisions.includes(`effect-not-permitted:${effect}`), !permitted.includes(effect));
          assert.equal(route.unresolvedDecisions.includes(`authority-missing:${effect}`), !authority.includes(effect));
          assert.equal(route.unresolvedDecisions.includes(`unsupported-effect-only-scope:${effect}`), effect.startsWith('external-'));
        }
        assert.equal(verifyEffectOnlyV2Result({ request, expectedSource, result }), result);
        assert.deepEqual(request, original, 'compilation and verification must not mutate the source');
        checked += 1;
      }
    }
    assert.equal(checked, state === 'known' ? 4096 : 4352);
    assert.equal(malformed, state === 'known' ? 256 : 0);
    t.diagnostic(`${checked} valid combinations; ${malformed} incomplete-known rejections`);
  });
}

const make = () => requestFor('known', ['local-read', 'local-write'], ['local-read', 'local-write'], ['local-read', 'local-write']);
const changes = {
  requestId: r => { r.requestId += '-changed'; }, text: r => { r.text += ' Changed.'; },
  routeMode: r => { r.routeMode = 'automatic'; }, version: r => { r.schemaVersion = 3; },
  permittedEffects: r => { r.context.permittedEffects = ['local-read']; },
  availableAuthority: r => { r.context.availableAuthority = ['local-read']; },
  preconditions: r => { r.context.availablePreconditions = ['new-condition']; },
  forbidden: r => { r.context.forbiddenCapabilities = ['new-capability']; },
  risk: r => { r.context.maximumRisk = 'high'; },
  evidence: r => { r.context.minimumEvidenceConfidence = 'verified'; },
  contextBudget: r => { r.context.contextBudget += 1; },
  composition: r => { r.context.maxCompositionSize = 2; },
  subject: r => { r.effectAssessment.subjectDigest = 'c'.repeat(64); },
  producer: r => { r.effectAssessment.producerDescriptorDigest = 'd'.repeat(64); },
  state: r => { r.effectAssessment.state = 'unknown'; r.effectAssessment.unresolvedDecisions = ['changed']; },
  effects: r => { r.effectAssessment.requestedEffects = ['local-read']; },
};
for (const [name, change] of Object.entries(changes)) {
  test(`stored binding refuses changed ${name} without reissuing a source pin`, () => {
    const request = make(), expectedSource = bind(request);
    const result = compileAndRouteEffectOnlyV2({ request, expectedSource });
    change(request);
    assert.throws(() => compileAndRouteEffectOnlyV2({ request, expectedSource }));
    assert.throws(() => verifyEffectOnlyV2Result({ request, expectedSource, result }));
  });
}
for (const [name, change] of Object.entries({
  status: r => { r.routeReceipt.status = 'selected'; },
  authority: r => { r.compilerReceipt.suppliedAuthority.push('external-write'); },
  selection: r => { r.routeReceipt.selectedIds.push('unrequested-skill'); },
  decisions: r => { r.routeReceipt.unresolvedDecisions.push('invented'); },
  assessment: r => { r.routeReceipt.assessmentBinding.state = 'unknown'; },
})) {
  test(`verification rejects a modified ${name} receipt`, () => {
    const request = make(), expectedSource = bind(request);
    const result = compileAndRouteEffectOnlyV2({ request, expectedSource });
    change(result);
    assert.throws(() => verifyEffectOnlyV2Result({ request, expectedSource, result }), /result mismatch/);
  });
}
for (const requested of [['none', 'local-read'], ['local-write', 'local-read'], ['local-read', 'local-read'], ['process-exec']]) {
  test(`closed effect vocabulary refuses ${JSON.stringify(requested)}`, () => {
    const request = requestFor('known', requested, effects, effects);
    assert.throws(() => compileAndRouteEffectOnlyV2({ request, expectedSource: bind(request) }));
  });
}
test('a valid blocked pair verifies as consistent, never as permission to dispatch', () => {
  const request = requestFor('known', ['external-write'], effects, effects), expectedSource = bind(request);
  const result = compileAndRouteEffectOnlyV2({ request, expectedSource });
  assert.equal(verifyEffectOnlyV2Result({ request, expectedSource, result }), result);
  assert.equal(result.routeReceipt.status, 'needs-decision');
  assert.ok(result.compilerReceipt.proofLimits.includes('does-not-execute-or-authorize-native-dispatch'));
});
