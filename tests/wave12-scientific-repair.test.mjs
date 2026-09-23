import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = new URL("../artifacts/universal-product-v1/wave12-ml-audio/repair-r1/", import.meta.url);
const skill = () => readFileSync(new URL("proposed-product/skills/scientific-surrogate-validation/SKILL.md", base), "utf8");

test("decision-time feature availability is an explicit prerequisite", () => {
  const text = skill();
  assert.match(text, /feature origin and availability time/i);
  assert.match(text, /target-derived/i);
  assert.match(text, /post-outcome/i);
  assert.match(text, /repeat the validation/i);
});

test("uncertainty calibration and final scoring are separated", () => {
  const text = skill();
  assert.match(text, /calibration.*training.*fold/is);
  assert.match(text, /freeze.*interval.*before.*final scor/is);
  assert.match(text, /outer holdout.*influenced.*withhold/is);
});

test("partially observed candidate pools cannot support a full-pool claim by default", () => {
  const text = skill();
  assert.match(text, /labeled and unlabeled counts by.*strat/is);
  assert.match(text, /observation.*selection mechanism/is);
  assert.match(text, /representative audit sample|defensible weighting/is);
  assert.match(text, /restrict.*observed subset/is);
});

test("repair remains a portable draft with adversarial F1-F3 cases", () => {
  const text = skill();
  assert.doesNotMatch(text, /[A-Z]:[\\/]|API_KEY|must install/i);
  assert.match(text, /does not train a model/i);
  const metadata = JSON.parse(readFileSync(new URL("proposed-product/skills/scientific-surrogate-validation/skill.json", base)));
  assert.equal(metadata.maturity, "draft");
  assert.deepEqual(metadata.provenance.map((row) => row.source.slice(0, 5)).sort(), ["r0146", "r0164"]);
  const cases = JSON.parse(readFileSync(new URL("adversarial-cases.json", base)));
  assert.deepEqual(cases.cases.map((row) => row.id).sort(), ["F1-target-derived", "F2-holdout-calibration", "F3-biased-partial-pool"]);
  for (const row of cases.cases) {
    assert.ok(row.request.length > 20 && row.expectedBoundary.length > 20);
  }
});
