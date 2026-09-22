import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const load = async (rel) => (await import(pathToFileURL(path.join(root, rel)).href)).coalesce;
const ref = await load("reference.mjs");

// Literal contract assertions against the reference.
assert.throws(() => ref(null), TypeError);
assert.throws(() => ref({}), TypeError);
assert.throws(() => ref([null]), TypeError);
assert.throws(() => ref([1]), TypeError);
assert.throws(() => ref([{ id: "", amount: 1 }]), TypeError);
assert.throws(() => ref([{ id: 7, amount: 1 }]), TypeError);
assert.throws(() => ref([{ id: "a", amount: "2" }]), TypeError);
assert.throws(() => ref([{ id: "a", amount: NaN }]), TypeError);
assert.throws(() => ref([{ id: "a", amount: Infinity }]), TypeError);
assert.throws(() => ref([{ id: "a", amount: 1 }, { id: "bad", amount: "2" }]), TypeError);
assert.deepEqual(ref([]), []);
assert.deepEqual(ref([{ id: "b", amount: 1 }, { id: "a", amount: 2 }, { id: "b", amount: 3 }]), [{ id: "b", amount: 4 }, { id: "a", amount: 2 }]);
assert.deepEqual(ref([{ id: "A", amount: 1 }, { id: "a", amount: 2 }, { id: "A", amount: 3 }]), [{ id: "A", amount: 4 }, { id: "a", amount: 2 }]);
assert.equal(ref([{ id: "f", amount: 0.1 }, { id: "f", amount: 0.2 }])[0].amount, 0.1 + 0.2);
assert.deepEqual(ref([{ id: "z", amount: 0 }, { id: "n", amount: -2 }, { id: "n", amount: 5 }]), [{ id: "z", amount: 0 }, { id: "n", amount: 3 }]);
const input = [{ id: "x", amount: 1, extra: "keep" }, { id: "x", amount: 2 }];
const output = ref(input);
assert.deepEqual(output, [{ id: "x", amount: 3 }]);
assert.notEqual(output[0], input[0]);
assert.deepEqual(Object.keys(output[0]).sort(), ["amount", "id"]);
assert.deepEqual(input[0], { id: "x", amount: 1, extra: "keep" });
assert.deepEqual(ref([{ id: "__proto__", amount: 1 }, { id: "constructor", amount: 2 }, { id: "__proto__", amount: 3 }]), [{ id: "__proto__", amount: 4 }, { id: "constructor", amount: 2 }]);

// Each entry asserts the observable defect of one opaque variant.
const violations = [
  ["variants/mutant-01.mjs", (fn) => assert.doesNotThrow(() => fn([{ id: "n", amount: "2" }])), "numeric strings must be rejected"],
  ["variants/mutant-02.mjs", (fn) => assert.throws(() => fn([{ id: "z", amount: 0 }]), TypeError), "zero must be accepted"],
  ["variants/mutant-03.mjs", (fn) => assert.throws(() => fn([{ id: "n", amount: -1 }]), TypeError), "negatives must be accepted"],
  ["variants/mutant-04.mjs", (fn) => assert.deepEqual(fn([{ id: "A", amount: 1 }, { id: "a", amount: 2 }]), [{ id: "A", amount: 3 }]), "ids are case-sensitive"],
  ["variants/mutant-05.mjs", (fn) => assert.deepEqual(fn([{ id: "b", amount: 1 }, { id: "a", amount: 2 }]).map((x) => x.id), ["a", "b"]), "order is first-seen"],
  ["variants/mutant-06.mjs", (fn) => { const src = [{ id: "x", amount: 1, extra: 1 }, { id: "x", amount: 2 }]; const out = fn(src); assert.equal(src[0].amount, 3); assert.equal(out[0], src[0]); }, "fresh objects, no input mutation"],
  ["variants/mutant-07.mjs", (fn) => assert.deepEqual(fn([{ id: "__proto__", amount: 1 }]), []), "'__proto__' is ordinary"],
  ["variants/mutant-08.mjs", (fn) => assert.doesNotThrow(() => fn([{ id: "ok", amount: 1 }, { id: "bad", amount: "2" }])), "later records are validated"],
];
for (const [rel, check] of violations) check(await load(rel));
console.log(`selftest ok: reference contract + ${violations.length} intended variant violations`);
