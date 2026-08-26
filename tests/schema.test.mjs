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
