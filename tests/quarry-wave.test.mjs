import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildExactFileManifest,
  compareExactFileManifests,
  groupExactDuplicates,
  groupRepositoryFileManifests,
  repositoryDirectoryName,
  resolveQuarryChild,
} from "../src/quarry-wave.mjs";

test("exact manifests are path ordered and exclude git internals", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-quarry-"));
  t.after(async () => {
    const { rm } = await import("node:fs/promises");
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, ".git"), { recursive: true });
  await mkdir(path.join(root, "nested"), { recursive: true });
  await writeFile(path.join(root, "nested", "b.txt"), "beta\n");
  await writeFile(path.join(root, "a.txt"), "alpha\n");
  await writeFile(path.join(root, ".git", "config"), "ignored\n");

  const manifest = await buildExactFileManifest(root);

  assert.deepEqual(manifest.map((row) => row.path), ["a.txt", "nested/b.txt"]);
  assert.ok(manifest.every((row) => /^[a-f0-9]{64}$/.test(row.sha256)));
});

test("manifest comparison reports missing extra and changed files", () => {
  const expected = [
    { path: "a", bytes: 1, sha256: "a".repeat(64) },
    { path: "b", bytes: 2, sha256: "b".repeat(64) },
  ];
  const actual = [
    { path: "a", bytes: 1, sha256: "c".repeat(64) },
    { path: "c", bytes: 3, sha256: "d".repeat(64) },
  ];

  assert.deepEqual(compareExactFileManifests(expected, actual), {
    equal: false,
    missing: ["b"],
    extra: ["c"],
    changed: ["a"],
  });
});

test("exact duplicate groups retain only hashes with multiple source ids", () => {
  const rows = [
    { id: "one", bodySha256: "a".repeat(64) },
    { id: "two", bodySha256: "a".repeat(64) },
    { id: "three", bodySha256: "b".repeat(64) },
  ];

  assert.deepEqual(groupExactDuplicates(rows), [
    { bodySha256: "a".repeat(64), sourceIds: ["one", "two"] },
  ]);
});

test("frozen repository file rows group deterministically and reject duplicate paths", () => {
  const rows = [
    { repository: "two/repo", path: "b", bytes: 2, sha256: "b".repeat(64), type: "file" },
    { repository: "one/repo", path: "a", bytes: 1, sha256: "a".repeat(64), type: "file" },
    { repository: "two/repo", path: "a", bytes: 1, sha256: "a".repeat(64), type: "file" },
  ];

  const grouped = groupRepositoryFileManifests(rows);
  assert.deepEqual([...grouped.keys()], ["one/repo", "two/repo"]);
  assert.deepEqual(grouped.get("two/repo").map((row) => row.path), ["a", "b"]);
  assert.throws(
    () => groupRepositoryFileManifests([...rows, rows[0]]),
    /duplicate manifest path/,
  );
});

test("repository identities cannot escape either quarry root", () => {
  assert.equal(repositoryDirectoryName("Owner/repo-1.js"), "Owner__repo-1.js");
  assert.throws(() => repositoryDirectoryName("owner/repo/../../escape"), /invalid GitHub repository identity/);
  assert.throws(() => repositoryDirectoryName("owner\\repo"), /invalid GitHub repository identity/);
  assert.equal(
    resolveQuarryChild("C:\\quarry", "Owner__repo"),
    path.resolve("C:\\quarry", "Owner__repo"),
  );
  assert.throws(() => resolveQuarryChild("C:\\quarry", "..\\escape"), /escapes quarry root/);
});
