import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = new URL("../artifacts/universal-product-v1/wave13-molecular/repair-r1/", import.meta.url);
const read = async (name) => readFile(new URL(name, base), "utf8");

test("interatomic specialist repair declares narrow ownership and routes general validation", async () => {
  const skill = await read("interatomic-model-validation/SKILL.md");
  const metadata = JSON.parse(await read("interatomic-model-validation/skill.json"));
  assert.equal(metadata.id, "interatomic-model-validation");
  assert.equal(metadata.specializes, "scientific-surrogate-validation");
  assert.equal(metadata.maturity, "draft");
  for (const id of ["scientific-surrogate-validation", "experiment-artifact-lineage",
    "physics-constrained-numerical-validation", "molecular-observable-integrity", "eternities-athena"]) {
    assert.match(skill, new RegExp(id));
    assert.ok(metadata.related.includes(id));
  }
  for (const phrase of ["energy", "force", "stress", "surface", "reference", "decision-time",
    "calibration", "checkpoint", "trajectory", "untested"]) assert.match(skill.toLowerCase(), new RegExp(phrase));
  assert.ok(metadata.provenance.some((x) => x.kind === "pattern-reference"
    && /^SFETNI\/Deep-Matter-Chem-Skills@[a-f0-9]{40}:/.test(x.source)
    && /^[a-f0-9]{64}$/.test(x.bodySha256)));
});

test("routing cases distinguish material-specific review from adjacent owner methods", async () => {
  const cases = JSON.parse(await read("routing-cases.json"));
  assert.equal(cases.schema, "godskills-wave13-interatomic-routing-v1");
  const routes = new Map(cases.cases.map((item) => [item.id, item.owner]));
  assert.equal(routes.size, cases.cases.length);
  assert.equal(routes.get("surface-transfer"), "interatomic-model-validation");
  assert.equal(routes.get("general-leakage"), "scientific-surrogate-validation");
  assert.equal(routes.get("checkpoint-reuse"), "experiment-artifact-lineage");
  assert.equal(routes.get("solver-convergence"), "physics-constrained-numerical-validation");
  assert.equal(routes.get("trajectory-observable"), "molecular-observable-integrity");
  assert.equal(routes.get("electrochemistry-experiment"), "outside-this-skill");
});
