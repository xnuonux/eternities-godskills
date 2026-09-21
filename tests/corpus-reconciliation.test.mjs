import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildCorpusReconciliation,
  reconcileCorpus,
} from "../src/corpus-reconciliation.mjs";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);
const CONTENT_DIGEST_ONLY = "d".repeat(64);

async function temporary(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-corpus-reconciliation-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function put(root, relativePath, value) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  const text = typeof value === "string"
    ? value
    : `${JSON.stringify(value)}\n`;
  await writeFile(target, text, "utf8");
}

function jsonl(rows) {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

async function outputFiles(outputPath) {
  const names = [
    "manifest.json",
    "source-records.jsonl",
    "ledger-observations.jsonl",
    "body-groups.jsonl",
    "identity-conflicts.jsonl",
  ];
  return Object.fromEntries(
    await Promise.all(names.map(async (name) => [
      name,
      await readFile(path.join(outputPath, name), "utf8"),
    ])),
  );
}

test("reconciles exact body aliases without using contentDigest as bodySha256", async (context) => {
  const root = await temporary(context);
  const outputPath = path.join(root, "out");

  await put(root, "artifacts/release-one/source-records.jsonl", jsonl([
    {
      schemaVersion: 1,
      id: "canonical-a",
      name: "A",
      sourcePath: "owners\\a\\SKILL.md",
      contentDigest: CONTENT_DIGEST_ONLY,
      bodySha256: HASH_A,
      disposition: "acquire",
      inert: true,
    },
    {
      schemaVersion: 1,
      id: "changed-snapshot",
      sourcePath: "owners\\changed\\SKILL.md",
      bodySha256: HASH_B,
      disposition: "acquire",
      inert: true,
    },
  ]));
  await put(root, "artifacts/corpus/coverage-ledger.jsonl", jsonl([
    {
      schemaVersion: 1,
      sourceId: "alias-b",
      sourcePath: "owners\\b\\SKILL.md",
      bodySha256: HASH_A,
      contentDigest: CONTENT_DIGEST_ONLY,
      families: ["family-b"],
      evidence: { bodyInspected: true },
    },
    {
      schemaVersion: 1,
      sourceId: "changed-snapshot",
      sourcePath: "owners\\changed\\SKILL.md",
      bodySha256: HASH_C,
      families: ["family-c"],
      evidence: { bodyInspected: true },
    },
  ]));
  await put(root, "provenance/source-ledger.jsonl", jsonl([
    {
      schemaVersion: 1,
      sourceId: "canonical-a",
      sourcePath: "owners\\a\\SKILL.md",
      contentDigest: CONTENT_DIGEST_ONLY,
      disposition: "independent-implementation",
      proseCopied: false,
    },
    {
      schemaVersion: 1,
      sourceId: "missing-body",
      sourcePath: "owners\\missing\\SKILL.md",
      contentDigest: CONTENT_DIGEST_ONLY,
      disposition: "pattern-reference",
      proseCopied: false,
    },
  ]));
  await put(root, "data/quarry-intake-snapshot-a/sources.jsonl", jsonl([
    {
      sourceId: "changed-snapshot",
      repository: "owner/repo",
      path: "owners/changed/SKILL.md",
      bodySha256: HASH_B,
      reviewStatus: "historical",
    },
  ]));
  await put(root, "data/quarry-intake-snapshot-b/sources.jsonl", jsonl([
    {
      sourceId: "changed-snapshot",
      repository: "owner/repo",
      path: "owners/changed/SKILL.md",
      bodySha256: HASH_C,
      reviewStatus: "newer-snapshot",
    },
  ]));
  await put(root, "data/quarry-intake-snapshot-b/facets.jsonl", jsonl([
    {
      sourceId: "alias-b",
      bodySha256: HASH_A,
      reviewStatus: "unqualified-model-classification",
      facets: { research: { value: "unknown" } },
    },
  ]));
  await put(root, "data/quarry-intake-snapshot-b/source-cards.json", [
    {
      sourceId: "card-only",
      repository: "owner/cards",
      path: "skills/card-only/SKILL.md",
      bodySha256: null,
      reviewStatus: "unreviewed",
    },
  ]);
  await put(root, "data/github-skill-quarry-wave-2.json", {
    schemaVersion: 1,
    entries: [{ fullName: "owner/repo" }],
    expectedSkillBodies: 999,
  });

  const first = await buildCorpusReconciliation({ repositoryRoot: root, outputPath });
  const firstFiles = await outputFiles(outputPath);
  const second = await buildCorpusReconciliation({ repositoryRoot: root, outputPath });
  const secondFiles = await outputFiles(outputPath);

  assert.deepEqual(first, second);
  assert.deepEqual(firstFiles, secondFiles);
  assert.equal(first.counts.sourceRecordCount, 5);
  assert.equal(first.counts.uniquePrimarySourceIdentities, 3);
  assert.equal(first.counts.uniqueKnownBodies, 3);
  assert.equal(first.counts.missingBodyHashRecordCount, 3);
  assert.equal(first.counts.conflictingHashIdentityCount, 1);
  assert.equal(first.counts.conflictingHashDeclarationCount, 4);
  assert.equal(first.counts.contentDigestOnlyRecordCount, 2);

  const bodyGroups = firstFiles["body-groups.jsonl"]
    .trim()
    .split("\n")
    .map(JSON.parse);
  const groupA = bodyGroups.find((row) => row.bodySha256 === HASH_A);
  assert.deepEqual(groupA.sourceIdentities, ["alias-b", "canonical-a"]);
  assert.equal(bodyGroups.some((row) => row.bodySha256 === CONTENT_DIGEST_ONLY), false);

  const conflicts = firstFiles["identity-conflicts.jsonl"]
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.deepEqual(conflicts.map(({ sourceIdentity }) => sourceIdentity), ["changed-snapshot"]);
  assert.deepEqual(conflicts[0].bodySha256Values, [HASH_B, HASH_C]);
  assert.deepEqual(
    conflicts[0].declarations.flatMap(({ origins }) => origins).map(({ inputPath }) => inputPath).sort(),
    [
      "artifacts/corpus/coverage-ledger.jsonl",
      "artifacts/release-one/source-records.jsonl",
      "data/quarry-intake-snapshot-a/sources.jsonl",
      "data/quarry-intake-snapshot-b/sources.jsonl",
    ],
  );

  const sourceRecords = firstFiles["source-records.jsonl"]
    .trim()
    .split("\n")
    .map(JSON.parse);
  const changed = sourceRecords.filter(({ sourceIdentity }) => sourceIdentity === "changed-snapshot");
  assert.equal(changed.length, 3);
  assert.deepEqual(
    changed.map(({ sourcePath }) => sourcePath),
    ["owners\\changed\\SKILL.md", "owners/changed/SKILL.md", "owners/changed/SKILL.md"],
  );
  const observations = firstFiles["ledger-observations.jsonl"]
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.equal(
    observations.find(({ sourceIdentity, origins }) =>
      sourceIdentity === "alias-b" && origins.some(({ inputPath }) => inputPath.endsWith("facets.jsonl"))).classification.reviewStatus,
    "unqualified-model-classification",
  );

  const exclusions = first.exclusions.map(({ inputPath, reason }) => ({ inputPath, reason }));
  assert.deepEqual(exclusions, [
    {
      inputPath: "data/github-skill-quarry-wave-2.json",
      reason: "repository-manifest-not-skill-record",
    },
  ]);
  assert.match(first.manifestSha256, /^[a-f0-9]{64}$/);
  assert.match(first.inputs.find(({ inputPath }) => inputPath === "artifacts/corpus/coverage-ledger.jsonl").fileSha256, /^[a-f0-9]{64}$/);
});

test("derived infusion records retain provenance but do not inflate raw source counts", () => {
  const result = reconcileCorpus({
    inputs: [
      {
        inputPath: "artifacts/github-wave-2/source-records.jsonl",
        role: "raw-source-records",
        primary: true,
        fileSha256: "1".repeat(64),
        byteSize: 10,
        records: [{ id: "wave-2-a", sourcePath: "owners\\a\\SKILL.md", bodySha256: HASH_A }],
      },
      {
        inputPath: "artifacts/quarry-infusion/canonical-sources.jsonl",
        role: "derived-source-grouping",
        primary: false,
        fileSha256: "2".repeat(64),
        byteSize: 20,
        records: [{
          canonicalSourceId: "wave-2-a",
          aliasSourceIds: ["wave-2-alias"],
          bodySha256: HASH_A,
          disposition: "canonical-facet",
        }],
      },
      {
        inputPath: "artifacts/quarry-infusion/body-structures.jsonl",
        role: "derived-body-structure",
        primary: false,
        fileSha256: "3".repeat(64),
        byteSize: 30,
        records: [{ canonicalSourceId: "wave-2-a", bodySha256: HASH_A, structure: { headings: [] } }],
      },
    ],
    exclusions: [{
      inputPath: "data/github-skill-quarry-wave-2.json",
      reason: "repository-manifest-not-skill-record",
    }],
  });

  assert.equal(result.counts.sourceRecordCount, 1);
  assert.equal(result.counts.derivedRecordCount, 2);
  assert.equal(result.counts.uniqueKnownBodies, 1);
  assert.equal(result.sourceRecords[0].origin.lineNumber, 1);
  assert.equal(result.bodyGroups[0].bodySha256, HASH_A);
  assert.deepEqual(result.bodyGroups[0].sourceIdentities, ["wave-2-a", "wave-2-alias"]);
  assert.equal(
    result.inputs.find(({ inputPath }) => inputPath.endsWith("canonical-sources.jsonl")).role,
    "derived-source-grouping",
  );
  assert.equal(result.exclusions[0].reason, "repository-manifest-not-skill-record");
});

test("does not merge distinct identities when paths or content digests collide", () => {
  const result = reconcileCorpus({
    inputs: [{
      inputPath: "artifacts/release-one/source-records.jsonl",
      role: "raw-source-records",
      primary: true,
      records: [
        {
          id: "source-a",
          sourcePath: "shared/SKILL.md",
          bodySha256: HASH_A,
          contentDigest: HASH_B,
        },
        {
          id: "source-b",
          sourcePath: "shared/SKILL.md",
          bodySha256: HASH_B,
          contentDigest: HASH_A,
        },
      ],
    }],
  });

  assert.equal(result.counts.uniquePrimarySourceIdentities, 2);
  assert.equal(result.counts.uniqueKnownBodies, 2);
  assert.equal(result.conflicts.length, 0);
  assert.deepEqual(
    result.bodyGroups.map(({ bodySha256, sourceIdentities }) => ({ bodySha256, sourceIdentities })),
    [
      { bodySha256: HASH_A, sourceIdentities: ["source-a"] },
      { bodySha256: HASH_B, sourceIdentities: ["source-b"] },
    ],
  );
  assert.deepEqual(
    result.sourceRecords.map(({ sourceIdentity, sourcePath, bodySha256, contentDigest }) => ({
      sourceIdentity,
      sourcePath,
      bodySha256,
      contentDigest,
    })),
    [
      {
        sourceIdentity: "source-a",
        sourcePath: "shared/SKILL.md",
        bodySha256: HASH_A,
        contentDigest: HASH_B,
      },
      {
        sourceIdentity: "source-b",
        sourcePath: "shared/SKILL.md",
        bodySha256: HASH_B,
        contentDigest: HASH_A,
      },
    ],
  );
});

test("counts missing and invalid hashes without an identity and preserves anonymous known bodies", () => {
  const invalidHash = "not-a-sha256";
  const result = reconcileCorpus({
    inputs: [{
      inputPath: "artifacts/release-one/source-records.jsonl",
      role: "raw-source-records",
      primary: true,
      records: [
        { id: "missing", sourcePath: "missing/SKILL.md" },
        { bodySha256: invalidHash, contentDigest: HASH_A },
        { bodySha256: HASH_B, contentDigest: HASH_A },
      ],
    }],
  });

  assert.equal(result.counts.sourceRecordCount, 3);
  assert.equal(result.counts.missingBodyHashRecordCount, 2);
  assert.equal(result.counts.sourceRecordMissingBodyHashRecordCount, 2);
  assert.equal(result.counts.invalidBodyHashRecordCount, 1);
  assert.equal(result.counts.contentDigestOnlyRecordCount, 1);
  assert.equal(result.counts.uniqueKnownBodies, 1);
  assert.equal(result.counts.bodyGroupCount, 1);
  assert.deepEqual(result.bodyGroups[0].sourceIdentities, []);
  assert.equal(result.bodyGroups[0].anonymousDeclarationCount, 1);
  assert.deepEqual(result.bodyGroups[0].anonymousInputPaths, [
    "artifacts/release-one/source-records.jsonl",
  ]);

  const invalid = result.sourceRecords.find(({ bodyHashStatus }) => bodyHashStatus === "invalid");
  assert.equal(invalid.declaredBodySha256, invalidHash);
  assert.equal(invalid.bodySha256, null);
  assert.equal(result.sourceRecords.find(({ sourceIdentity }) => sourceIdentity === "missing").bodyHashStatus, "missing");
});

test("persists conflicting valid hash declarations without promoting malformed or missing values", () => {
  const invalidHash = "also-not-a-sha256";
  const result = reconcileCorpus({
    inputs: [{
      inputPath: "artifacts/release-one/source-records.jsonl",
      role: "raw-source-records",
      primary: true,
      records: [
        { id: "same-source", bodySha256: HASH_A },
        { id: "same-source", bodySha256: invalidHash },
        { id: "same-source", bodySha256: HASH_B },
        { id: "same-source" },
      ],
    }],
  });

  assert.equal(result.conflicts.length, 1);
  assert.deepEqual(result.conflicts[0].bodySha256Values, [HASH_A, HASH_B]);
  assert.equal(result.conflicts[0].declarations.reduce((total, row) => total + row.declarationCount, 0), 2);
  assert.equal(result.counts.conflictingHashDeclarationCount, 2);
  assert.deepEqual(
    result.sourceRecords.map(({ bodyHashStatus, bodySha256, declaredBodySha256 }) => ({
      bodyHashStatus,
      bodySha256,
      declaredBodySha256,
    })),
    [
      { bodyHashStatus: "known", bodySha256: HASH_A, declaredBodySha256: undefined },
      { bodyHashStatus: "invalid", bodySha256: null, declaredBodySha256: invalidHash },
      { bodyHashStatus: "known", bodySha256: HASH_B, declaredBodySha256: undefined },
      { bodyHashStatus: "missing", bodySha256: null, declaredBodySha256: undefined },
    ],
  );
  assert.equal(Object.hasOwn(result.sourceRecords[0], "declaredBodySha256"), false);
  assert.equal(Object.hasOwn(result.sourceRecords[1], "declaredBodySha256"), true);
});

test("keeps exclusions deterministic and does not mutate source ledgers", async (context) => {
  const root = await temporary(context);
  const outputA = path.join(root, "out-a");
  const outputB = path.join(root, "out-b");
  const sourcePath = path.join(root, "artifacts/release-one/source-records.jsonl");
  const sourceText = jsonl([{ id: "kept", bodySha256: HASH_A, sourcePath: "kept/SKILL.md" }]);

  await put(root, "artifacts/release-one/source-records.jsonl", sourceText);
  await put(root, "artifacts/release-one/duplicate-groups.json", { groups: [] });
  await put(root, "artifacts/corpus/candidate-evidence.jsonl", jsonl([{ id: "candidate" }]));
  await put(root, "artifacts/corpus/cluster-evidence.jsonl", jsonl([{ id: "cluster" }]));
  await put(root, "artifacts/github-wave-2/repository-file-manifests.jsonl", jsonl([{ path: "SKILL.md" }]));
  await put(root, "artifacts/lunari-first-party-quarry/coverage.json", { rows: 1 });
  await put(root, "data/github-skill-quarry-wave-2.json", { entries: [{ fullName: "owner/repo" }] });

  const before = await readFile(sourcePath, "utf8");
  const first = await buildCorpusReconciliation({ repositoryRoot: root, outputPath: outputA });
  const second = await buildCorpusReconciliation({ repositoryRoot: root, outputPath: outputB });
  const firstFiles = await outputFiles(outputA);
  const secondFiles = await outputFiles(outputB);

  assert.equal(before, sourceText);
  assert.equal(await readFile(sourcePath, "utf8"), sourceText);
  assert.deepEqual(firstFiles, secondFiles);
  assert.deepEqual(first.manifest, second.manifest);
  assert.deepEqual(
    first.exclusions.map(({ inputPath, reason }) => ({ inputPath, reason })),
    [
      {
        inputPath: "artifacts/corpus/candidate-evidence.jsonl",
        reason: "derived-synthesis-target-not-raw-source",
      },
      {
        inputPath: "artifacts/corpus/cluster-evidence.jsonl",
        reason: "derived-synthesis-target-not-raw-source",
      },
      {
        inputPath: "artifacts/github-wave-2/repository-file-manifests.jsonl",
        reason: "repository-manifest-not-skill-record",
      },
      {
        inputPath: "artifacts/lunari-first-party-quarry/coverage.json",
        reason: "unsupported-non-skill-source-schema",
      },
      {
        inputPath: "artifacts/release-one/duplicate-groups.json",
        reason: "unsupported-source-bearing-schema",
      },
      {
        inputPath: "data/github-skill-quarry-wave-2.json",
        reason: "repository-manifest-not-skill-record",
      },
    ],
  );
  assert.equal(first.counts.sourceRecordCount, 1);
  assert.equal(first.counts.ledgerRecordCount, 1);
});

test("ignores a preserved local reconciliation output when writing to another target", async (context) => {
  const root = await temporary(context);
  const outputPath = path.join(root, "warehouse-output");

  await put(root, "artifacts/release-one/source-records.jsonl", jsonl([
    { id: "kept", bodySha256: HASH_A, sourcePath: "kept/SKILL.md" },
  ]));
  await put(root, "data/corpus-reconciliation-v1/source-records.jsonl", jsonl([
    { id: "stale-output", bodySha256: HASH_B, sourcePath: "stale/SKILL.md" },
  ]));

  const result = await buildCorpusReconciliation({ repositoryRoot: root, outputPath });

  assert.equal(result.counts.sourceRecordCount, 1);
  assert.equal(result.counts.uniqueKnownBodies, 1);
  assert.equal(result.exclusions.some(({ inputPath }) =>
    inputPath.startsWith("data/corpus-reconciliation-v1/")), false);
  assert.equal(result.inputs.some(({ inputPath }) =>
    inputPath.startsWith("data/corpus-reconciliation-v1/")), false);
});
