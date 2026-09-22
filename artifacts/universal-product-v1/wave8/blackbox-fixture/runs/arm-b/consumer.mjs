import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const target = process.env.TARGET_MODULE;
assert.ok(target, 'TARGET_MODULE must be set');
const { coalesce } = await import(pathToFileURL(target).href);
assert.equal(typeof coalesce, 'function', 'module must export coalesce');

async function rejects(input) {
  const call = coalesce(input);
  assert.ok(call instanceof Promise, 'invalid input must reject, not return');
  await assert.rejects(call, TypeError);
}

test('non-array inputs reject with TypeError', async () => {
  for (const input of [null, undefined, {}, 'items', 5, true, () => {}]) {
    await rejects(input);
  }
});

test('null or non-object elements reject atomically', async () => {
  for (const bad of [null, undefined, 'x', 5, true]) {
    await rejects([{ id: 'ok', amount: 1 }, bad]);
    await rejects([bad]);
  }
});

test('empty or non-string ids reject', async () => {
  for (const item of [{ id: '', amount: 1 }, { id: 7, amount: 1 }, { id: null, amount: 1 }, { amount: 1 }, { id: '', amount: 0 }]) {
    await rejects([item]);
    await rejects([{ id: 'fine', amount: 1 }, item]);
  }
});

test('non-number or non-finite amounts reject; numeric strings are invalid', async () => {
  for (const item of [
    { id: 'a', amount: '5' },
    { id: 'a', amount: NaN },
    { id: 'a', amount: Infinity },
    { id: 'a', amount: -Infinity },
    { id: 'a', amount: null },
    { id: 'a' },
  ]) {
    await rejects([item]);
    await rejects([{ id: 'b', amount: 1 }, item]);
  }
});

test('empty input returns a fresh empty array', async () => {
  const input = [];
  const out = await coalesce(input);
  assert.ok(Array.isArray(out));
  assert.notEqual(out, input);
  assert.deepEqual(out, []);
});

test('aggregates by exact case-sensitive id in first-appearance order', async () => {
  const out = await coalesce([
    { id: 'b', amount: 2 },
    { id: 'A', amount: 1 },
    { id: 'b', amount: -2 },
    { id: 'a', amount: 0 },
    { id: 'A', amount: 4 },
  ]);
  assert.deepEqual(out, [
    { id: 'b', amount: 0 },
    { id: 'A', amount: 5 },
    { id: 'a', amount: 0 },
  ]);
});

test('sums with ordinary addition in input order', async () => {
  const out = await coalesce([
    { id: 'x', amount: 0.1 },
    { id: 'x', amount: 0.2 },
    { id: 'x', amount: 0.3 },
  ]);
  assert.equal(out[0].amount, 0.1 + 0.2 + 0.3);

  const reversed = await coalesce([
    { id: 'x', amount: 0.3 },
    { id: 'x', amount: 0.2 },
    { id: 'x', amount: 0.1 },
  ]);
  assert.equal(reversed[0].amount, 0.3 + 0.2 + 0.1);
});

test('returns fresh objects with only id and amount and never mutates input', async () => {
  const items = [
    { id: 'a', amount: 1, note: 'extra', nested: { keep: true } },
    { id: 'a', amount: 2 },
  ];
  const before = structuredClone(items);
  const out = await coalesce(items);

  assert.deepEqual(items, before, 'input must not be mutated');
  assert.notEqual(out, items);
  assert.equal(out.length, 1);
  assert.notEqual(out[0], items[0]);
  assert.notEqual(out[0], items[1]);
  assert.deepEqual(Object.keys(out[0]).sort(), ['amount', 'id']);
  assert.deepEqual(out[0], { id: 'a', amount: 3 });

  out[0].amount = 99;
  assert.equal(items[0].amount, 1, 'output must not share state with input');
});

test("'__proto__' and 'constructor' are ordinary ids", async () => {
  const out = await coalesce([
    { id: '__proto__', amount: 1 },
    { id: 'constructor', amount: 2 },
    { id: '__proto__', amount: 3 },
  ]);
  assert.deepEqual(out, [
    { id: '__proto__', amount: 4 },
    { id: 'constructor', amount: 2 },
  ]);
  assert.equal(({}).amount, undefined);
  assert.equal(Object.prototype.amount, undefined);
});
