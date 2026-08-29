import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const records = JSON.parse(fs.readFileSync(new URL("../data/operational-capabilities.v1.json", import.meta.url))).records;
const ids = [
  "bounded-verified-object-ingestion",
  "columnar-ingestion-rollup-and-query-layout-design",
  "lazy-tabular-transformation-and-validation",
  "measured-paid-creative-iteration",
  "performance-release-gating",
  "release-script-safety",
  "venture-falsification-and-planning",
];

test("the seven data product and release delegates are exact", () => {
  assert.deepEqual(records.filter((record) => ids.includes(record.id)).map((record) => record.id).sort(), ids);
});

test("data product and release delegates keep external effects behind adapters", () => {
  const forbidden = [
    "unconfirmed-storage-mutation",
    "database-installation",
    "arbitrary-file-read",
    "advertising-spend",
    "financial-commitment",
    "external-deployment",
    "external-load-generation",
  ];
  for (const id of ids) {
    const record = records.find((candidate) => candidate.id === id);
    assert.deepEqual(forbidden.filter((effect) => !record.forbiddenEffects.includes(effect)), [], id);
    assert.equal(record.allowedEffects.includes("external-write"), false);
  }
});

test("paid creative and release gates do not convert analysis into authority", () => {
  const paid = records.find((record) => record.id === "measured-paid-creative-iteration");
  const release = records.find((record) => record.id === "performance-release-gating");
  assert.match([...paid.exclusions, ...paid.failureBehavior].join(" "), /spend|budget|authorization/i);
  assert.match([...release.exclusions, ...release.failureBehavior].join(" "), /deploy|load|authorization/i);
});
