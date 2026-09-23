import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const product = new URL("../product/", import.meta.url);
const read = (path) => readFile(new URL(path, product), "utf8");

test("interatomic specialist routes to its staged scientific parent and adjacent owners", async () => {
  const skill = await read("skills/interatomic-model-validation/SKILL.md");
  const metadata = JSON.parse(await read("skills/interatomic-model-validation/skill.json"));
  const parent = JSON.parse(await read("skills/scientific-surrogate-validation/skill.json"));
  assert.equal(parent.id, "scientific-surrogate-validation");
  assert.equal(metadata.specializes, parent.id);
  for (const owner of [parent.id, "experiment-artifact-lineage", "physics-constrained-numerical-validation",
    "molecular-observable-integrity", "eternities-athena"]) {
    assert.ok(metadata.related.includes(owner));
    assert.match(skill, new RegExp(owner));
  }
  assert.doesNotMatch(skill, /[CD]:\\|D:\//);
  assert.equal(metadata.maturity, "instruction-reviewed");
});
