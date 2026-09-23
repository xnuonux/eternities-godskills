import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { searchCatalog } from "../product/lib/product.mjs";

const catalogUrl = new URL("../product/catalog.json", import.meta.url);
const metadataUrl = new URL("../product/skills/scientific-surrogate-validation/skill.json", import.meta.url);
const skillUrl = new URL("../product/skills/scientific-surrogate-validation/SKILL.md", import.meta.url);

test("scientific surrogate validation has a portable, source-bound reviewed entrypoint", async () => {
  const metadata = JSON.parse(await readFile(metadataUrl, "utf8"));
  const skill = await readFile(skillUrl, "utf8");
  assert.equal(metadata.id, "scientific-surrogate-validation");
  assert.equal(metadata.maturity, "instruction-reviewed");
  assert.equal(metadata.specializes, "eternities-athena");
  assert.deepEqual(metadata.provenance.map((row) => row.source.slice(0, 5)).sort(), ["r0146", "r0164"]);
  for (const boundary of [
    "feature origin and availability time",
    "outer holdout influenced calibration",
    "labeled and unlabeled counts by pool stratum",
    "does not train a model",
  ]) assert.ok(skill.includes(boundary), boundary);
  assert.ok(!/[A-Z]:[\\/]|\/Users\/|\/home\//.test(skill));
});

test("surrogate validation discovery routes the scientific task, not neighboring owners", async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
  const positive = searchCatalog(catalog, "validate scientific surrogate model generalization", { limit: 20 });
  assert.ok(positive.results.some((row) => row.id === "scientific-surrogate-validation"));
  for (const negativeQuery of [
    "reuse or resume a model checkpoint or feature cache",
    "compare agent skill prompt or harness variants",
    "choose inference hardware runtime or serving configuration",
  ]) {
    const negative = searchCatalog(catalog, negativeQuery, { limit: 20 });
    assert.ok(!negative.results.some((row) => row.id === "scientific-surrogate-validation"), negativeQuery);
    assert.equal(negative.authority, "none");
    assert.equal(negative.activation, "none");
  }
  assert.equal(positive.authority, "none");
  assert.equal(positive.activation, "none");
});
