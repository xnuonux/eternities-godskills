import assert from 'node:assert/strict';
import test from 'node:test';

import { consume } from './consumer.mjs';

const context = {
  requestId: 'request-17',
  revision: 4,
  allowedIds: ['alpha', 'beta', 'gamma'],
};

function payload(value) {
  return JSON.stringify(value);
}

function complete(records = []) {
  return payload({
    version: 1,
    requestId: context.requestId,
    revision: context.revision,
    outcome: 'complete',
    records,
  });
}

function abstained(reason = 'insufficient evidence') {
  return payload({
    version: 1,
    requestId: context.requestId,
    revision: context.revision,
    outcome: 'abstained',
    reason,
  });
}

test('accepts valid records, including false, zero, null, and an empty list', () => {
  const records = [
    { id: 'alpha', enabled: false, score: 0 },
    { id: 'beta', enabled: true, score: null },
  ];
  assert.deepEqual(consume({ transport: 'complete', payload: complete(records) }, context), {
    status: 'accepted',
    records,
  });
  assert.deepEqual(consume({ transport: 'complete', payload: complete() }, context), {
    status: 'accepted',
    records: [],
  });
});

test('preserves an explicit abstention as unavailable', () => {
  assert.deepEqual(consume({ transport: 'complete', payload: abstained('not enough input') }, context), {
    status: 'unavailable',
    reason: 'not enough input',
  });
});

test('handles known incomplete transport states without consuming content', () => {
  assert.deepEqual(consume({ transport: 'streaming', payload: { ignored: true } }, context), {
    status: 'pending',
  });
  assert.deepEqual(consume({ transport: 'refused', payload: null }, context), {
    status: 'unavailable',
    reason: 'provider-refused',
  });
  assert.deepEqual(consume({ transport: 'unavailable', payload: null }, context), {
    status: 'unavailable',
    reason: 'provider-unavailable',
  });
  assert.deepEqual(consume({ transport: 'cancelled', payload: null }, context), {
    status: 'unavailable',
    reason: 'request-cancelled',
  });
});

test('rejects malformed or unknown events with a category, not payload text', () => {
  const malformedEvents = [
    null,
    [],
    {},
    { transport: 'complete' },
    { transport: 'complete', payload: complete(), extra: true },
    { transport: 'unknown', payload: complete() },
  ];

  for (const event of malformedEvents) {
    const result = consume(event, context);
    assert.equal(result.status, 'invalid');
    assert.match(result.reason, /^[a-z-]+$/);
    assert.doesNotMatch(result.reason, /request-17|alpha/);
  }
});

test('rejects non-string, oversized, malformed, trailing, and non-object payloads', () => {
  const cases = [
    [{ transport: 'complete', payload: 42 }, 'payload-not-string'],
    [{ transport: 'complete', payload: '🙂'.repeat(1025) }, 'payload-too-large'],
    [{ transport: 'complete', payload: '{"version":1' }, 'malformed-json'],
    [{ transport: 'complete', payload: `${complete()} trailing` }, 'malformed-json'],
    [{ transport: 'complete', payload: '[]' }, 'payload-shape'],
    [{ transport: 'complete', payload: 'null' }, 'payload-shape'],
  ];

  for (const [event, reason] of cases) {
    assert.deepEqual(consume(event, context), { status: 'invalid', reason });
  }
});

test('accepts a valid payload at the inclusive 4096-byte limit', () => {
  const base = payload({
    version: 1,
    requestId: context.requestId,
    revision: context.revision,
    outcome: 'abstained',
    reason: '',
  });
  const value = {
    version: 1,
    requestId: context.requestId,
    revision: context.revision,
    outcome: 'abstained',
    reason: 'x'.repeat(4096 - base.length),
  };
  const exactPayload = payload(value);

  assert.equal(new TextEncoder().encode(exactPayload).byteLength, 4096);
  assert.deepEqual(consume({ transport: 'complete', payload: exactPayload }, context), {
    status: 'unavailable',
    reason: value.reason,
  });
});

test('rejects unknown, missing, wrong-type, and stale top-level fields', () => {
  const cases = [
    [{ ...JSON.parse(complete()), extra: true }, 'unknown-field'],
    [{ version: 1, requestId: context.requestId, revision: context.revision, outcome: 'complete' }, 'missing-field'],
    [{ version: '1', requestId: context.requestId, revision: context.revision, outcome: 'complete', records: [] }, 'version-mismatch'],
    [{ version: 1, requestId: 'old-request', revision: context.revision, outcome: 'complete', records: [] }, 'request-mismatch'],
    [{ version: 1, requestId: context.requestId, revision: 3, outcome: 'complete', records: [] }, 'revision-mismatch'],
    [{ version: 1, requestId: context.requestId, revision: context.revision, outcome: 'other', records: [] }, 'unknown-outcome'],
    [{ version: 1, requestId: context.requestId, revision: context.revision, outcome: 'complete', records: {} }, 'records-type'],
  ];

  for (const [value, reason] of cases) {
    assert.deepEqual(consume({ transport: 'complete', payload: payload(value) }, context), {
      status: 'invalid',
      reason,
    });
  }
});

test('rejects wrong-type bindings instead of coercing them', () => {
  const value = {
    version: 1,
    requestId: context.requestId,
    revision: String(context.revision),
    outcome: 'complete',
    records: [],
  };
  assert.deepEqual(consume({ transport: 'complete', payload: payload(value) }, context), {
    status: 'invalid',
    reason: 'revision-mismatch',
  });
});

test('rejects invalid records, unknown IDs, and duplicate IDs', () => {
  const cases = [
    [{ id: 'alpha', enabled: true, score: 0.5, extra: 1 }, 'record-unknown-field'],
    [{ id: 'alpha', enabled: true }, 'record-missing-field'],
    [{ id: 1, enabled: true, score: 0.5 }, 'record-id-type'],
    [{ id: 'delta', enabled: true, score: 0.5 }, 'unknown-record-id'],
    [
      [
        { id: 'alpha', enabled: true, score: 0.5 },
        { id: 'alpha', enabled: false, score: null },
      ],
      'duplicate-record-id',
    ],
    [{ id: 'alpha', enabled: 'true', score: 0.5 }, 'record-enabled-type'],
    [{ id: 'alpha', enabled: true, score: '0.5' }, 'record-score-invalid'],
    [{ id: 'alpha', enabled: true, score: -0.1 }, 'record-score-invalid'],
    [{ id: 'alpha', enabled: true, score: 1.1 }, 'record-score-invalid'],
  ];

  for (const [records, reason] of cases) {
    const actualRecords = Array.isArray(records) ? records : [records];
    assert.deepEqual(
      consume({ transport: 'complete', payload: complete(actualRecords) }, context),
      { status: 'invalid', reason },
    );
  }
});

test('rejects malformed abstentions and closed-object violations', () => {
  const cases = [
    [{ ...JSON.parse(abstained()), extra: true }, 'unknown-field'],
    [{ version: 1, requestId: context.requestId, revision: context.revision, outcome: 'abstained' }, 'missing-field'],
    [{ version: 1, requestId: context.requestId, revision: context.revision, outcome: 'abstained', reason: '' }, 'abstention-reason-invalid'],
    [{ version: 1, requestId: context.requestId, revision: context.revision, outcome: 'abstained', reason: 7 }, 'abstention-reason-invalid'],
  ];

  for (const [value, reason] of cases) {
    assert.deepEqual(consume({ transport: 'complete', payload: payload(value) }, context), {
      status: 'invalid',
      reason,
    });
  }
});

test('does not mutate input event or context and repeated delivery is inert', () => {
  const event = {
    transport: 'complete',
    payload: complete([{ id: 'gamma', enabled: true, score: 1 }]),
  };
  const eventBefore = { ...event };
  const contextBefore = { ...context, allowedIds: [...context.allowedIds] };

  const first = consume(event, context);
  const second = consume(event, context);

  assert.deepEqual(first, second);
  assert.deepEqual(event, eventBefore);
  assert.deepEqual(context, contextBefore);
});

test('returns invalid instead of throwing for an invalid context on a complete event', () => {
  assert.deepEqual(consume({ transport: 'complete', payload: complete() }, null), {
    status: 'invalid',
    reason: 'invalid-context',
  });
  assert.deepEqual(consume({ transport: 'complete', payload: complete() }, {
    requestId: context.requestId,
    revision: context.revision,
    allowedIds: ['alpha', 'alpha'],
  }), {
    status: 'invalid',
    reason: 'invalid-context',
  });
});
