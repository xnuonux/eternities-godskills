import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

const targetPath = process.env.TARGET_MODULE;
if (!targetPath) {
  throw new Error('TARGET_MODULE must hold the absolute path of the module under test');
}

const { coalesce } = await import(pathToFileURL(targetPath).href);

// Invalid input signals TypeError (rejected promise or throw) and yields no value at all.
async function expectTypeError(input, label) {
  let outcome;
  try {
    outcome = { returned: true, value: await coalesce(input) };
  } catch (error) {
    outcome = { returned: false, error };
  }
  assert.equal(outcome.returned, false, label + ': invalid input must not produce a result');
  assert.ok(
    outcome.error instanceof TypeError,
    label + ': expected TypeError, received ' + String(outcome.error)
  );
}

// Each row must be an object whose only own properties are id and amount.
function readRows(result) {
  assert.ok(Array.isArray(result), 'result must be an array');
  return result.map((row) => {
    assert.ok(row !== null && typeof row === 'object', 'each row must be an object');
    assert.deepEqual(
      Reflect.ownKeys(row).sort(),
      ['amount', 'id'],
      'a row must contain only id and amount'
    );
    return { id: row.id, amount: row.amount };
  });
}

test('exports coalesce', () => {
  assert.equal(typeof coalesce, 'function');
});

test('empty input returns a fresh empty array', async () => {
  const items = [];
  const result = await coalesce(items);
  assert.deepEqual(result, []);
  assert.notStrictEqual(result, items);
});

test('aggregates by exact case-sensitive id in first-seen order', async () => {
  const result = await coalesce([
    { id: 'b', amount: 2 },
    { id: 'a', amount: 1 },
    { id: 'B', amount: 4 },
    { id: 'b', amount: -1 },
    { id: 'a', amount: 3 },
    { id: ' ', amount: 6 },
  ]);
  assert.deepEqual(readRows(result), [
    { id: 'b', amount: 1 },
    { id: 'a', amount: 4 },
    { id: 'B', amount: 4 },
    { id: ' ', amount: 6 },
  ]);
});

test('zero and negative amounts are valid values', async () => {
  assert.deepEqual(readRows(await coalesce([{ id: 'z', amount: 0 }])), [{ id: 'z', amount: 0 }]);
  assert.deepEqual(
    readRows(await coalesce([{ id: 'x', amount: -2 }, { id: 'x', amount: 0 }, { id: 'x', amount: 5 }])),
    [{ id: 'x', amount: 3 }]
  );
});

test('sums in input order with ordinary number addition', async () => {
  // 1e16 + 1 rounds back to 1e16 in IEEE-754, so the hand-derived total is 0.
  const result = await coalesce([
    { id: 'n', amount: 1e16 },
    { id: 'n', amount: 1 },
    { id: 'n', amount: -1e16 },
  ]);
  assert.deepEqual(readRows(result), [{ id: 'n', amount: 0 }]);
});

test('returns fresh id/amount rows and never mutates or references input objects', async () => {
  const items = [
    { id: 'a', amount: 1, label: 'first', meta: { tag: 'x' } },
    { id: 'a', amount: 2, label: 'second' },
    { id: 'b', amount: -3 },
  ];
  const result = await coalesce(items);

  assert.deepEqual(
    items,
    [
      { id: 'a', amount: 1, label: 'first', meta: { tag: 'x' } },
      { id: 'a', amount: 2, label: 'second' },
      { id: 'b', amount: -3 },
    ],
    'input array and objects must be unchanged'
  );
  assert.notStrictEqual(result, items);
  for (const row of result) {
    for (const item of items) {
      assert.notStrictEqual(row, item, 'result rows must be fresh objects');
    }
  }
  const expected = [{ id: 'a', amount: 3 }, { id: 'b', amount: -3 }];
  assert.deepEqual(readRows(result), expected, 'optional fields are ignored');

  items[0].amount = 100;
  items[0].meta.tag = 'changed';
  items[2].id = 'changed';
  assert.deepEqual(readRows(result), expected, 'result rows must not retain input references');
});

test("'__proto__', 'constructor', and 'toString' are ordinary ids", async () => {
  const result = await coalesce([
    { id: '__proto__', amount: 1 },
    { id: 'constructor', amount: 2 },
    { id: '__proto__', amount: 3 },
    { id: 'constructor', amount: -2 },
    { id: 'toString', amount: 1 },
    { id: 'toString', amount: 2 },
  ]);
  assert.deepEqual(readRows(result), [
    { id: '__proto__', amount: 4 },
    { id: 'constructor', amount: 0 },
    { id: 'toString', amount: 3 },
  ]);
});

test('rejects non-array inputs with TypeError', async () => {
  const cases = [
    ['undefined', undefined],
    ['null', null],
    ['number', 42],
    ['string', 'items'],
    ['array-like object', { 0: { id: 'a', amount: 1 }, length: 1 }],
    ['Map', new Map()],
  ];
  for (const [label, input] of cases) {
    await expectTypeError(input, label);
  }
});

test('rejects invalid elements with TypeError and never returns partial results', async () => {
  const badRows = [
    ['null element', null],
    ['undefined element', undefined],
    ['primitive element', 'x'],
    ['empty id', { id: '', amount: 1 }],
    ['non-string id', { id: 7, amount: 1 }],
    ['null id', { id: null, amount: 1 }],
    ['numeric-string amount', { id: 'bad', amount: '1' }],
    ['null amount', { id: 'bad', amount: null }],
    ['boolean amount', { id: 'bad', amount: true }],
    ['bigint amount', { id: 'bad', amount: 1n }],
    ['NaN amount', { id: 'bad', amount: NaN }],
    ['Infinity amount', { id: 'bad', amount: Infinity }],
    ['-Infinity amount', { id: 'bad', amount: -Infinity }],
  ];
  for (const [label, badRow] of badRows) {
    // A leading valid row ensures any partial result would be observable.
    await expectTypeError([{ id: 'ok', amount: 1 }, badRow], label);
  }
});
