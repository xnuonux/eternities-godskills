import { Buffer } from 'node:buffer';

const MAX_PAYLOAD_BYTES = 4096;
const KNOWN_TRANSPORTS = new Set([
  'complete',
  'streaming',
  'refused',
  'unavailable',
  'cancelled',
]);

const COMPLETE_FIELDS = ['version', 'requestId', 'revision', 'outcome', 'records'];
const ABSTAINED_FIELDS = ['version', 'requestId', 'revision', 'outcome', 'reason'];
const RECORD_FIELDS = ['id', 'enabled', 'score'];

function invalid(reason) {
  return { status: 'invalid', reason };
}

function isObjectRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  const actualKeys = Object.keys(value);
  const expected = new Set(expectedKeys);

  if (actualKeys.some((key) => !expected.has(key))) {
    return 'unknown-field';
  }
  if (expectedKeys.some((key) => !Object.hasOwn(value, key))) {
    return 'missing-field';
  }
  return null;
}

function validContext(context) {
  if (!isObjectRecord(context)) {
    return false;
  }
  if (!Object.hasOwn(context, 'requestId') || !Object.hasOwn(context, 'revision')) {
    return false;
  }
  if (!Array.isArray(context.allowedIds)) {
    return false;
  }

  const ids = new Set();
  for (const id of context.allowedIds) {
    if (typeof id !== 'string' || ids.has(id)) {
      return false;
    }
    ids.add(id);
  }
  return true;
}

function validateBinding(payload, context) {
  if (payload.version !== 1 || !Number.isInteger(payload.version)) {
    return 'version-mismatch';
  }
  if (!Object.is(payload.requestId, context.requestId)) {
    return 'request-mismatch';
  }
  if (!Object.is(payload.revision, context.revision)) {
    return 'revision-mismatch';
  }
  return null;
}

function validateRecord(record, allowedIds, seenIds) {
  if (!isObjectRecord(record)) {
    return 'record-shape';
  }

  const fieldError = hasExactKeys(record, RECORD_FIELDS);
  if (fieldError) {
    return `record-${fieldError}`;
  }
  if (typeof record.id !== 'string') {
    return 'record-id-type';
  }
  if (!allowedIds.has(record.id)) {
    return 'unknown-record-id';
  }
  if (seenIds.has(record.id)) {
    return 'duplicate-record-id';
  }
  if (typeof record.enabled !== 'boolean') {
    return 'record-enabled-type';
  }
  if (
    record.score !== null &&
    (typeof record.score !== 'number' ||
      !Number.isFinite(record.score) ||
      record.score < 0 ||
      record.score > 1)
  ) {
    return 'record-score-invalid';
  }

  seenIds.add(record.id);
  return null;
}

function validateComplete(payload, context) {
  const fieldError = hasExactKeys(payload, COMPLETE_FIELDS);
  if (fieldError) {
    return invalid(fieldError);
  }

  const bindingError = validateBinding(payload, context);
  if (bindingError) {
    return invalid(bindingError);
  }
  if (payload.outcome !== 'complete') {
    return invalid('outcome-mismatch');
  }
  if (!Array.isArray(payload.records)) {
    return invalid('records-type');
  }

  const allowedIds = new Set(context.allowedIds);
  const seenIds = new Set();
  for (const record of payload.records) {
    const recordError = validateRecord(record, allowedIds, seenIds);
    if (recordError) {
      return invalid(recordError);
    }
  }
  return { status: 'accepted', records: payload.records };
}

function validateAbstained(payload, context) {
  const fieldError = hasExactKeys(payload, ABSTAINED_FIELDS);
  if (fieldError) {
    return invalid(fieldError);
  }

  const bindingError = validateBinding(payload, context);
  if (bindingError) {
    return invalid(bindingError);
  }
  if (payload.outcome !== 'abstained') {
    return invalid('outcome-mismatch');
  }
  if (typeof payload.reason !== 'string' || payload.reason.length === 0) {
    return invalid('abstention-reason-invalid');
  }
  return { status: 'unavailable', reason: payload.reason };
}

function validatePayload(payload, context) {
  if (typeof payload !== 'string') {
    return invalid('payload-not-string');
  }
  if (Buffer.byteLength(payload, 'utf8') > MAX_PAYLOAD_BYTES) {
    return invalid('payload-too-large');
  }

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return invalid('malformed-json');
  }

  if (!isObjectRecord(parsed)) {
    return invalid('payload-shape');
  }
  if (!Object.hasOwn(parsed, 'outcome')) {
    return invalid('missing-field');
  }
  if (parsed.outcome === 'complete') {
    return validateComplete(parsed, context);
  }
  if (parsed.outcome === 'abstained') {
    return validateAbstained(parsed, context);
  }
  return invalid('unknown-outcome');
}

/**
 * Consume a transport event without performing I/O, retries, or operations.
 *
 * @param {unknown} event
 * @param {unknown} context
 * @returns {{status: string, reason?: string, records?: Array<unknown>}}
 */
export function consume(event, context) {
  try {
    if (!isObjectRecord(event) || hasExactKeys(event, ['transport', 'payload'])) {
      return invalid('invalid-event');
    }
    if (typeof event.transport !== 'string' || !KNOWN_TRANSPORTS.has(event.transport)) {
      return invalid('invalid-event');
    }

    if (event.transport === 'streaming') {
      return { status: 'pending' };
    }
    if (event.transport === 'refused') {
      return { status: 'unavailable', reason: 'provider-refused' };
    }
    if (event.transport === 'unavailable') {
      return { status: 'unavailable', reason: 'provider-unavailable' };
    }
    if (event.transport === 'cancelled') {
      return { status: 'unavailable', reason: 'request-cancelled' };
    }

    if (!validContext(context)) {
      return invalid('invalid-context');
    }
    return validatePayload(event.payload, context);
  } catch {
    return invalid('invalid-input');
  }
}

export default consume;
