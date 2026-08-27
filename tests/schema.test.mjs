import test from "node:test";
import assert from "node:assert/strict";

import { assertInside } from "../src/paths.mjs";
import {
  validateCapabilityContract,
  validateEvaluation,
  validateProfileLock,
  validateSourceRecord,
} from "../src/schema.mjs";

test("assertInside rejects a resolved path outside its canonical parent", () => {
  assert.throws(
    () => assertInside("D:\\03-ARSENAL\\warehouse", "C:\\escape"),
    /outside canonical root/,
  );
});

test("assertInside returns a normalized child path", () => {
  const result = assertInside(
    "D:\\03-ARSENAL\\warehouse",
    "D:\\03-ARSENAL\\warehouse\\from-stars\\owner__repo",
  );
  assert.equal(
    result.toLowerCase(),
    "d:\\03-arsenal\\warehouse\\from-stars\\owner__repo",
  );
});

function completeContract(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "cap-x",
    category: "research",
    intent: "inspect evidence",
    successCondition: "return a verified receipt",
    inputs: ["question"],
    outputs: ["receipt"],
    operations: ["inspect"],
    effects: ["read"],
    positiveTriggers: ["inspect source evidence"],
    negativeTriggers: ["simple factual answer"],
    failureModes: ["source unavailable"],
    dependencies: [],
    sourceIds: ["source-a"],
    ...overrides,
  };
}

const clusterEvidence = {
  mode: "cluster-review-v1",
  clusterSetId: "agency-client-services-clusters-v1",
  clusters: [
    {
      id: "agency-operational-state",
      digest: "bc995745d1abe8130b6e70e0de497f05a5d8a93600a79611fddeff30dc3c841d",
    },
    {
      id: "client-deliverable-construction",
      digest: "438c10e4d01b0da3a784137822e72efb4ebab3201acc96335b67760513946d8b",
    },
    {
      id: "prospect-assessment-depth",
      digest: "1648c19ae0c7229dc71bd0d5f2674da11e8b65e36860ab9052c8f56a3b393dd2",
    },
  ],
};

test("capability contracts require negative triggers", () => {
  assert.throws(
    () => validateCapabilityContract(completeContract({ negativeTriggers: undefined })),
    /negativeTriggers/,
  );
});

test("capability contracts require at least one declared effect", () => {
  assert.throws(
    () => validateCapabilityContract(completeContract({ effects: [] })),
    /effects must not be empty/,
  );
});

test("capability contracts accept exact cluster-review evidence", () => {
  assert.doesNotThrow(() =>
    validateCapabilityContract(completeContract({ sourceEvidence: clusterEvidence })),
  );
});

test("cluster-review evidence rejects unknown modes, unstable ids, and invalid digests", () => {
  assert.throws(
    () => validateCapabilityContract(completeContract({
      sourceEvidence: { ...clusterEvidence, mode: "generated-summary" },
    })),
    /unknown source evidence mode/,
  );
  assert.throws(
    () => validateCapabilityContract(completeContract({
      sourceEvidence: {
        ...clusterEvidence,
        clusters: [clusterEvidence.clusters[1], clusterEvidence.clusters[0]],
      },
    })),
    /lexically sorted/,
  );
  assert.throws(
    () => validateCapabilityContract(completeContract({
      sourceEvidence: {
        ...clusterEvidence,
        clusters: [clusterEvidence.clusters[0], clusterEvidence.clusters[0]],
      },
    })),
    /duplicate cluster id/,
  );
  assert.throws(
    () => validateCapabilityContract(completeContract({
      sourceEvidence: {
        ...clusterEvidence,
        clusters: [{ ...clusterEvidence.clusters[0], digest: "not-a-digest" }],
      },
    })),
    /lowercase SHA-256/,
  );
  assert.throws(
    () => validateCapabilityContract(completeContract({
      sourceEvidence: { ...clusterEvidence, clusters: [] },
    })),
    /clusters must not be empty/,
  );
});

test("validators accept complete release-one records", () => {
  const source = validateSourceRecord({
    schemaVersion: 1,
    id: "source-a",
    name: "source a",
    description: "reads source evidence",
    sourcePath: "from-stars\\owner__repo\\SKILL.md",
    repositoryRoot: "from-stars\\owner__repo",
    remote: "https://github.com/owner/repo.git",
    gitHead: "a".repeat(40),
    licenseClass: "permissive",
    extractionMode: "independent-implementation",
  });
  const contract = validateCapabilityContract({
    schemaVersion: 1,
    id: "cap-a",
    category: "research",
    intent: "find exact source evidence",
    successCondition: "return verified evidence",
    inputs: ["research question"],
    outputs: ["evidence receipt"],
    operations: ["search", "inspect", "verify"],
    effects: ["read"],
    positiveTriggers: ["mine repository evidence"],
    negativeTriggers: ["simple factual answer"],
    failureModes: ["source unavailable"],
    dependencies: [],
    sourceIds: [source.id],
  });
  const lock = validateProfileLock({
    schemaVersion: 1,
    name: "eternities-core",
    skills: [
      {
        name: "eternities-oracle",
        source: "skills\\eternities-oracle",
        promotionReceipt: "receipts\\promotions\\eternities-oracle.json",
      },
    ],
  });

  assert.equal(source.id, "source-a");
  assert.equal(contract.effects[0], "read");
  assert.equal(lock.skills[0].name, "eternities-oracle");
});

test("profile locks reject duplicate destination names", () => {
  const skill = {
    name: "eternities-oracle",
    source: "skills\\eternities-oracle",
    promotionReceipt: "receipts\\promotions\\eternities-oracle.json",
  };
  assert.throws(
    () =>
      validateProfileLock({
        schemaVersion: 1,
        name: "duplicate-profile",
        skills: [skill, { ...skill }],
      }),
    /duplicate skill name/,
  );
});

test("evaluations reject impossible pass counts", () => {
  assert.throws(
    () =>
      validateEvaluation({
        schemaVersion: 1,
        status: "evaluated",
        total: 2,
        passed: 3,
        criticalTotal: 1,
        criticalPassed: 1,
        score: 1,
        tokenCount: 100,
      }),
    /passed cannot exceed total/,
  );
});
