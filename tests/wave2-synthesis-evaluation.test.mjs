import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWave2SynthesisPlan,
  evaluateWave2SynthesisPlan,
} from "../src/wave2-synthesis-evaluation.mjs";

const digest = (letter) => letter.repeat(64);
function cluster(id, disposition = "candidate") {
  return {
    familyId: "implementation-engineering",
    id,
    clusterDigest: digest(id.at(-1)),
    synthesisDecision: disposition,
    members: [{ facetId: `facet-${id}`, reviewDigest: digest("a"), role: "canonical" }],
  };
}
function overlap(id, disposition, owner = "eternities-daedalus") {
  return {
    familyId: "implementation-engineering",
    clusterId: id,
    clusterDigest: digest(id.at(-1)),
    overlapDigest: digest(disposition.at(0)),
    targetSkillId: owner,
    disposition,
    intendedTier: disposition === "covered-stronger" ? "none" : "godskill-extension",
    comparedAgainst: [{ kind: "godskill", id: owner, digest: digest("c") }],
  };
}

test("builds one evidence-exact synthesis action for every candidate", () => {
  const clusters = [cluster("one"), cluster("two")];
  const overlaps = [overlap("one", "covered-stronger"), overlap("two", "extend-existing")];
  const plan = buildWave2SynthesisPlan(clusters, overlaps);
  assert.equal(plan.entries.length, 2);
  assert.equal(plan.entries[0].action, "retain-existing");
  assert.equal(plan.entries[0].mechanismIds.length, 0);
  assert.equal(plan.entries[1].action, "extend-existing");
  assert.equal(plan.entries[1].mechanismIds.length, 1);
});

test("retains receipt-proven owners and defers unimplemented synthesis without promotion theater", () => {
  const clusters = [cluster("one"), cluster("two")];
  const overlaps = [overlap("one", "covered-stronger"), overlap("two", "extend-existing")];
  const plan = buildWave2SynthesisPlan(clusters, overlaps);
  const receipts = new Map([["eternities-daedalus", {
    id: "eternities-daedalus",
    digest: digest("d"),
    path: "receipts/promotions/eternities-daedalus.json",
    status: "promoted",
    testsPassed: true,
  }]]);
  const rows = evaluateWave2SynthesisPlan(plan, receipts);
  assert.deepEqual(rows.map((row) => row.status), ["promoted", "deferred"]);
  assert.equal(rows[0].testsPassed, true);
  assert.equal(rows[1].testsPassed, false);
  assert.equal(rows[1].artifactCreated, false);
  assert.equal(rows.every((row) => row.sourceCodeExecuted === false), true);
});

test("covered mechanisms fail closed to deferred when the current owner receipt is absent", () => {
  const plan = buildWave2SynthesisPlan(
    [cluster("one")],
    [overlap("one", "covered-stronger")],
  );
  const [row] = evaluateWave2SynthesisPlan(plan, new Map());
  assert.equal(row.status, "deferred");
  assert.equal(row.testsPassed, false);
  assert.match(row.reason, /current passing owner receipt/i);
});
