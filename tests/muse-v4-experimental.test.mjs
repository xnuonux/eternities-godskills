import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildMuseV4Acceptance,
  projectMuseV4Authority,
} from "../src/muse-v4-experimental.mjs";

const root = new URL("../", import.meta.url);
const text = async (relative) => readFile(new URL(relative, root), "utf8");
const json = async (relative) => JSON.parse(await text(relative));

test("Muse v4 development evidence is inactive, exact, and held-out blind", async () => {
  const [contract, evidence] = await Promise.all([
    json("artifacts/muse-v4-experimental/neutral-contract.json"),
    json("artifacts/muse-v4-experimental/development-evidence.json"),
  ]);
  assert.equal(contract.active, false);
  assert.equal(contract.requiresExplicitAdoption, true);
  assert.deepEqual(contract.effects, ["read"]);
  assert.equal(evidence.partition, "development");
  assert.equal(evidence.reviewed, true);
  assert.equal(evidence.source.manifestSha256, "c8f4976f09f0062118923c51223eecc1d8bdffbcfccdf62788f2cbfff1d72974");
  assert.deepEqual(evidence.failureCodes, [
    "method-cost-overrun",
    "natural-motion-regularization",
    "solution-space-collapse",
    "spatial-affordance-regression",
  ]);
  const constructionBytes = `${JSON.stringify(contract)}\n${JSON.stringify(evidence)}`.toLowerCase();
  for (const heldOutIdentity of ["gravitational portal", "captive storm", "bioluminescent ecosystem"]) {
    assert.equal(constructionBytes.includes(heldOutIdentity), false, heldOutIdentity);
  }
});

test("Muse v4 preserves explicit spatial affordances without prescribing implementation", () => {
  const acceptance = buildMuseV4Acceptance({
    affordances: ["orbit", "zoom", "pause"],
    phenomenonClass: "natural",
  });
  assert.deepEqual(acceptance.preservedAffordances, ["orbit", "pause", "zoom"]);
  assert.deepEqual(acceptance.mandatedTechniques, []);
  assert.equal(acceptance.solutionSpace, "open-within-acceptance-boundary");
  assert.ok(acceptance.rejectionChecks.includes("reject-narrower-substitute-controls"));
  assert.ok(acceptance.rejectionChecks.includes("reject-front-view-only-dimensionality"));
});

test("Muse v4 rejects accidental order in natural motion and clipped luminance", () => {
  const acceptance = buildMuseV4Acceptance({
    affordances: ["inspect"],
    phenomenonClass: "natural",
  });
  assert.deepEqual(acceptance.naturalMotionChecks, [
    "multi-scale-variation",
    "phase-desynchronization",
    "multi-time-sample",
    "visible-pattern-rejection",
  ]);
  assert.ok(acceptance.rejectionChecks.includes("reject-visible-spiral-lattice-or-synchronized-pulse"));
  assert.ok(acceptance.rejectionChecks.includes("reject-bloom-clipped-internal-structure"));
});

test("Muse v4 cannot expand host authority", () => {
  assert.deepEqual(
    projectMuseV4Authority(["local-read", "local-write"], ["local-read", "local-write"]),
    ["local-read", "local-write"],
  );
  assert.throws(
    () => projectMuseV4Authority(["local-read", "external-write"], ["local-read", "local-write"]),
    /authority/i,
  );
});

test("Muse v4 package is compact, inactive, and exactly bound to candidate bytes", async () => {
  const [skill, packageRecord, cases] = await Promise.all([
    text("artifacts/muse-v4-experimental/SKILL.md"),
    json("artifacts/muse-v4-experimental/package.json"),
    json("artifacts/muse-v4-experimental/evals/cases.json"),
  ]);
  const { sha256 } = await import("../src/io.mjs");
  assert.equal(packageRecord.active, false);
  assert.equal(packageRecord.requiresExplicitAdoption, true);
  assert.equal(packageRecord.skillSha256, sha256(skill));
  assert.equal(packageRecord.skillBytes, Buffer.byteLength(skill));
  assert.ok(packageRecord.supplementBytes <= 8000);
  assert.ok(packageRecord.estimatedTokens <= 2000);
  assert.deepEqual(new Set(cases.cases.map(({ expected }) => expected)), new Set([
    "preserve:affordance",
    "reject:regularity",
    "preserve:solution-space",
    "preserve:luminance-detail",
    "require:quality-fallback",
    "refuse:authority-expansion",
  ]));
});
