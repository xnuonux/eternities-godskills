import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  loadClusterEvidence,
  validateClusterBatch,
} from "../src/refinery-clusters.mjs";
import { buildCoverageRows } from "../src/coverage.mjs";

const source = {
  id: "skill-a",
  name: "Agency Client",
  sourcePath: "repo\\agency-client\\SKILL.md",
  contentDigest: "a".repeat(64),
  families: ["agency-client-services"],
  licenseClass: "permissive",
  confidence: "high",
};
const body = {
  schemaVersion: 1,
  sourceId: "skill-a",
  status: "inspected",
  present: true,
  bodySha256: "b".repeat(64),
  byteSize: 100,
  lineCount: 5,
};
const review = {
  schemaVersion: 1,
  sourceId: "skill-a",
  bodySha256: "b".repeat(64),
  reviewDigest: "c".repeat(64),
  familyId: "agency-client-services",
};

function batch(memberOverrides = {}, clusterOverrides = {}) {
  return {
    schemaVersion: 1,
    clusterSetId: "agency-client-services-clusters-v1",
    familyId: "agency-client-services",
    clusters: [
      {
        id: "client-account-governance",
        intent: "Reconcile one client account from verified evidence.",
        relationship: "canonical-with-variants",
        synthesisDecision: "candidate",
        rationale: "The reviewed source contributes one distinct account-state operation.",
        members: [
          {
            sourceId: "skill-a",
            reviewDigest: "c".repeat(64),
            role: "canonical",
            ...memberOverrides,
          },
        ],
        ...clusterOverrides,
      },
    ],
  };
}

test("exact cluster evidence advances only reviewed sources to clustered", () => {
  const clusters = validateClusterBatch(batch(), [review]);
  const rows = buildCoverageRows([source], [body], [], [review], clusters);

  assert.equal(clusters.length, 1);
  assert.equal(rows[0].evidence.cardReviewed, true);
  assert.equal(rows[0].evidence.clustered, true);
  assert.equal(rows[0].evidence.synthesized, false);
  assert.equal(rows[0].evidence.evaluated, false);
  assert.equal(rows[0].evidence.promoted, false);
});

test("cluster evidence rejects missing and stale reviews", () => {
  assert.throws(() => validateClusterBatch(batch(), []), /unknown reviewed source: skill-a/);
  assert.throws(
    () => validateClusterBatch(batch({ reviewDigest: "d".repeat(64) }), [review]),
    /stale review digest for skill-a/,
  );
});

test("cluster evidence rejects duplicate membership and unknown policy values", () => {
  const duplicate = batch({}, {
    members: [batch().clusters[0].members[0], batch().clusters[0].members[0]],
  });
  assert.throws(() => validateClusterBatch(duplicate, [review]), /duplicate clustered source: skill-a/);
  assert.throws(
    () => validateClusterBatch(batch({}, { synthesisDecision: "promoted" }), [review]),
    /unknown synthesis decision/,
  );
  assert.throws(
    () => validateClusterBatch(batch({ role: "owner" }), [review]),
    /unknown cluster member role/,
  );
});

test("cluster evidence loading is deterministic and rejects cross-batch membership", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-clusters-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "nested"));
  await writeFile(
    path.join(root, "nested", "wave-b.json"),
    `${JSON.stringify(batch())}\n`,
    "utf8",
  );

  const first = await loadClusterEvidence(root, [review]);
  const second = await loadClusterEvidence(root, [review]);
  assert.deepEqual(second, first);
  assert.deepEqual(first.map(({ id }) => id), ["client-account-governance"]);

  const duplicate = batch({}, { id: "second-cluster" });
  duplicate.clusterSetId = "agency-client-services-clusters-v2";
  await writeFile(path.join(root, "wave-a.json"), `${JSON.stringify(duplicate)}\n`, "utf8");
  await assert.rejects(
    loadClusterEvidence(root, [review]),
    /duplicate clustered source across batches: skill-a/,
  );
});
