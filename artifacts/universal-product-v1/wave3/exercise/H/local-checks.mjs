import test from 'node:test';
import assert from 'node:assert/strict';

const identity = {
  data: 'data-1',
  split: 'split-1',
  preprocess: 'preprocess-1',
  code: 'code-1',
  architecture: 'architecture-1',
  environment: 'environment-1',
};

const completeState = {
  model: true,
  optimizer: true,
  scheduler: true,
  rng: true,
  sampler: true,
  scaler: true,
};

function makeRequest(operation, overrides = {}) {
  return {
    operation,
    identity: { ...identity, ...(overrides.identity ?? {}) },
    requiredState: overrides.requiredState ?? ['model', 'optimizer'],
    evaluationIds: overrides.evaluationIds ?? ['eval-1'],
  };
}

function makeArtifact(kind, overrides = {}) {
  return {
    kind,
    status: 'complete',
    verified: true,
    identity: { ...identity, ...(overrides.identity ?? {}) },
    dependsOn: ['data', 'split', 'preprocess', 'code'],
    state: { ...completeState },
    fitIds: ['train-1'],
    path: 'untrusted/locator.bin',
    label: 'untrusted human label',
    ...overrides,
  };
}

let assessReuse;
let importError;
try {
  ({ assessReuse } = await import('./guard.mjs'));
} catch (error) {
  importError = error;
}

function guard() {
  assert.equal(importError, undefined, `guard.mjs could not be imported: ${importError?.message}`);
  return assessReuse;
}

test('reuses a complete verified cache when every declared dependency matches', () => {
  const result = guard()(makeRequest('cache'), makeArtifact('cache'));

  assert.equal(result.decision, 'reuse');
  assert.ok(result.reasons.length > 0);
});

test('rebuilds a well-formed cache when a declared dependency identity changed', () => {
  const result = guard()(makeRequest('cache', { identity: { code: 'code-2' } }), makeArtifact('cache'));

  assert.equal(result.decision, 'rebuild');
  assert.ok(result.reasons.some((reason) => reason.includes('code')));
});

test('resumes a checkpoint only when all requested state and identities match', () => {
  const result = guard()(makeRequest('resume'), makeArtifact('checkpoint'));

  assert.equal(result.decision, 'resume');
  assert.ok(result.reasons.length > 0);
});

test('blocks a resume identity mismatch instead of silently warm-starting', () => {
  const result = guard()(makeRequest('resume', { identity: { data: 'data-2' } }), makeArtifact('checkpoint'));

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('identity')));
});

test('warm-starts from verified model weights with compatible architecture', () => {
  const result = guard()(
    makeRequest('warm-start'),
    makeArtifact('checkpoint', {
      identity: {
        data: 'old-data',
        split: 'old-split',
        preprocess: 'old-preprocess',
        code: 'old-code',
        architecture: 'architecture-1',
        environment: 'old-environment',
      },
      state: { model: true },
    }),
  );

  assert.equal(result.decision, 'warm-start');
  assert.ok(result.reasons.length > 0);
});

test('blocks an artifact that would train on a current evaluation sample', () => {
  const result = guard()(
    makeRequest('cache'),
    makeArtifact('cache', { fitIds: ['train-1', 'eval-1'] }),
  );

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('holdout')));
});

test('blocks when fit membership is unknown rather than authorizing reuse', () => {
  const artifact = makeArtifact('cache');
  delete artifact.fitIds;

  const result = guard()(makeRequest('cache'), artifact);

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('fit')));
});

test('blocks an incomplete or unverified artifact', () => {
  const result = guard()(
    makeRequest('resume'),
    makeArtifact('checkpoint', { status: 'partial', verified: false }),
  );

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('complete')));
});

test('blocks a cache with missing mandatory dependency declarations', () => {
  const result = guard()(
    makeRequest('cache'),
    makeArtifact('cache', { dependsOn: ['data', 'split', 'preprocess'] }),
  );

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('depend')));
});

test('does not authorize warm-start when architecture or model weights are unavailable', () => {
  const result = guard()(
    makeRequest('warm-start'),
    makeArtifact('checkpoint', {
      identity: { architecture: 'architecture-2' },
      state: { model: false },
    }),
  );

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('architecture') || reason.includes('model')));
});

test('does not mutate either manifest while assessing reuse', () => {
  const request = makeRequest('resume');
  const artifact = makeArtifact('checkpoint');
  const beforeRequest = structuredClone(request);
  const beforeArtifact = structuredClone(artifact);

  guard()(request, artifact);

  assert.deepEqual(request, beforeRequest);
  assert.deepEqual(artifact, beforeArtifact);
});
