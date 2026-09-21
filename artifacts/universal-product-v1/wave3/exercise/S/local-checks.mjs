import test from 'node:test';
import assert from 'node:assert/strict';

let assessReuse;
let loadError;

try {
  ({ assessReuse } = await import('./guard.mjs'));
} catch (error) {
  loadError = error;
}

function getAssessReuse() {
  assert.equal(loadError, undefined, `guard.mjs should load: ${loadError?.message}`);
  assert.equal(typeof assessReuse, 'function');
  return assessReuse;
}

const identity = {
  data: 'data-v1',
  split: 'split-v1',
  preprocess: 'prep-v1',
  code: 'code-v1',
  architecture: 'arch-v1',
  environment: 'env-v1',
};

function cacheRequest(overrides = {}) {
  return {
    operation: 'cache',
    identity: { ...identity },
    evaluationIds: ['eval-1'],
    ...overrides,
  };
}

function cacheArtifact(overrides = {}) {
  return {
    kind: 'cache',
    status: 'complete',
    verified: true,
    identity: { ...identity },
    dependsOn: ['data', 'split', 'preprocess', 'code'],
    fitIds: ['train-1'],
    path: 'renamed/location/cache.bin',
    label: 'same-cache-label',
    ...overrides,
  };
}

function resumeRequest(overrides = {}) {
  return {
    operation: 'resume',
    identity: { ...identity },
    requiredState: ['model', 'optimizer', 'scheduler', 'rng', 'sampler', 'scaler'],
    evaluationIds: ['eval-1'],
    ...overrides,
  };
}

function checkpoint(overrides = {}) {
  return {
    kind: 'checkpoint',
    status: 'complete',
    verified: true,
    identity: { ...identity },
    state: {
      model: true,
      optimizer: true,
      scheduler: true,
      rng: true,
      sampler: true,
      scaler: true,
    },
    fitIds: ['train-1'],
    ...overrides,
  };
}

test('reuses a verified cache when declared dependencies and holdout are preserved', () => {
  const assess = getAssessReuse();
  assert.equal(assess(cacheRequest(), cacheArtifact()).decision, 'reuse');
});

test('rebuilds a well-formed cache when a declared dependency changes', () => {
  const assess = getAssessReuse();
  const request = cacheRequest({ identity: { ...identity, code: 'code-v2' } });
  const result = assess(request, cacheArtifact());

  assert.equal(result.decision, 'rebuild');
  assert.ok(result.reasons.some((reason) => reason.includes('code')));
});

test('resumes only when all requested training state is present', () => {
  const assess = getAssessReuse();
  assert.equal(assess(resumeRequest(), checkpoint()).decision, 'resume');
});

test('blocks a resume when a required state component is missing', () => {
  const assess = getAssessReuse();
  const artifact = checkpoint({ state: { ...checkpoint().state, optimizer: false } });
  const result = assess(resumeRequest(), artifact);

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('optimizer')));
});

test('uses verified model weights for an explicit compatible warm-start', () => {
  const assess = getAssessReuse();
  const request = {
    operation: 'warm-start',
    identity: { ...identity, data: 'new-data', code: 'new-code' },
    evaluationIds: ['new-eval'],
  };
  const artifact = checkpoint({
    identity: { ...identity, data: 'old-data', code: 'old-code' },
    fitIds: ['old-train'],
  });

  assert.equal(assess(request, artifact).decision, 'warm-start');
});

test('blocks reuse that would leak a fit sample into the current holdout', () => {
  const assess = getAssessReuse();
  const result = assess(cacheRequest(), cacheArtifact({ fitIds: ['eval-1'] }));

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('holdout')));
});

test('blocks when fit membership is unknown rather than treating it as empty', () => {
  const assess = getAssessReuse();
  const result = assess(cacheRequest(), cacheArtifact({ fitIds: undefined }));

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('fit')));
});

test('blocks partial or unverified artifacts', () => {
  const assess = getAssessReuse();
  assert.equal(assess(cacheRequest(), cacheArtifact({ status: 'partial' })).decision, 'block');
  assert.equal(assess(cacheRequest(), cacheArtifact({ verified: false })).decision, 'block');
});

test('blocks malformed dependency declarations and unsupported operations', () => {
  const assess = getAssessReuse();
  assert.equal(
    assess(cacheRequest(), cacheArtifact({ dependsOn: ['data', 'split', 'preprocess'] })).decision,
    'block',
  );
  assert.equal(
    assess({ ...cacheRequest(), operation: 'resume' }, cacheArtifact()).decision,
    'block',
  );
});

test('blocks a missing current holdout declaration', () => {
  const assess = getAssessReuse();
  const result = assess(cacheRequest({ evaluationIds: undefined }), cacheArtifact());

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('evaluationIds')));
});

test('never converts an incompatible resume into a warm-start', () => {
  const assess = getAssessReuse();
  const result = assess(
    resumeRequest({ identity: { ...identity, code: 'code-v2' } }),
    checkpoint(),
  );

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('resume identity mismatch')));
});

test('blocks a warm-start when model architecture differs', () => {
  const assess = getAssessReuse();
  const result = assess(
    { operation: 'warm-start', identity: { ...identity, architecture: 'arch-v2' }, evaluationIds: [] },
    checkpoint({ fitIds: [] }),
  );

  assert.equal(result.decision, 'block');
  assert.ok(result.reasons.some((reason) => reason.includes('architecture')));
});

test('treats a changed irrelevant identity as reusable when the cache omits it', () => {
  const assess = getAssessReuse();
  const request = cacheRequest({ identity: { ...identity, environment: 'env-v2' } });

  assert.equal(assess(request, cacheArtifact()).decision, 'reuse');
});

test('returns block rather than throwing for a malformed checkpoint manifest', () => {
  const assess = getAssessReuse();

  assert.equal(assess(resumeRequest(), undefined).decision, 'block');
});

test('does not mutate request or artifact manifests', () => {
  const assess = getAssessReuse();
  const request = cacheRequest();
  const artifact = cacheArtifact();
  const requestBefore = JSON.stringify(request);
  const artifactBefore = JSON.stringify(artifact);

  assess(request, artifact);

  assert.equal(JSON.stringify(request), requestBefore);
  assert.equal(JSON.stringify(artifact), artifactBefore);
});
