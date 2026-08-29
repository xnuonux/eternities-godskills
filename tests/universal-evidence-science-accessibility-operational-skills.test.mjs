import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const records = JSON.parse(fs.readFileSync(new URL("../data/operational-capabilities.v1.json", import.meta.url))).records;
const ids = [
  "approval-bound-private-session-mining",
  "confirmed-destructive-reconstruction",
  "diagnostic-statistical-model-inference",
  "docx-package-redline-and-render-verification",
  "genomic-coordinate-assembly-and-variant-gates",
  "interface-localization-and-bidirectionality",
  "physics-constrained-numerical-validation",
];

test("the seven evidence science document and accessibility delegates are exact", () => {
  assert.deepEqual(records.filter((record) => ids.includes(record.id)).map((record) => record.id).sort(), ids);
});

test("high-risk delegates state their domain-specific hard stop", () => {
  const boundaries = new Map([
    ["approval-bound-private-session-mining", /approval|private|scope/i],
    ["confirmed-destructive-reconstruction", /backup|confirm|destructive/i],
    ["diagnostic-statistical-model-inference", /causal|diagnostic|assumption/i],
    ["docx-package-redline-and-render-verification", /external link|package|relationship/i],
    ["genomic-coordinate-assembly-and-variant-gates", /assembly|coordinate|reference build/i],
    ["interface-localization-and-bidirectionality", /human review|publish|translation/i],
    ["physics-constrained-numerical-validation", /hardware|physical|simulation|units/i],
  ]);
  for (const [id, pattern] of boundaries) {
    const record = records.find((candidate) => candidate.id === id);
    assert.match([...record.preconditions, ...record.failureBehavior, ...record.exclusions].join(" "), pattern, id);
    assert.equal(record.allowedEffects.includes("external-write"), false);
  }
});

test("every high-risk delegate has authority effect failure and termination cases", () => {
  for (const id of ids) {
    const record = records.find((candidate) => candidate.id === id);
    const kinds = new Set(record.evaluationCases.map((entry) => entry.kind));
    for (const kind of ["authority", "effect", "failure", "termination"]) assert.ok(kinds.has(kind), `${id}:${kind}`);
  }
});
