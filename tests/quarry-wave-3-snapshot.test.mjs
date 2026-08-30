import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildWaveThreeSnapshot } from "../scripts/build-quarry-wave-3.mjs";
import { buildQuarrySnapshot } from "../src/quarry-snapshot.mjs";

function git(repository, ...args) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

async function repository(root, fullName, files) {
  const directory = path.join(root, fullName.replace("/", "__"));
  await mkdir(directory, { recursive: true });
  git(directory, "init", "--quiet");
  git(directory, "config", "user.email", "fixture@example.invalid");
  git(directory, "config", "user.name", "fixture");
  for (const [relativePath, body] of Object.entries(files)) {
    const target = path.join(directory, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, "utf8");
  }
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "fixture");
  git(directory, "remote", "add", "origin", `https://github.com/${fullName}.git`);
  return { directory, head: git(directory, "rev-parse", "HEAD") };
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-wave3-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const alpha = await repository(root, "owner/alpha", {
    "skills/one/SKILL.md": "---\nname: one\ndescription: first\n---\n",
    "skills/two/SKILL.md": "---\nname: two\ndescription: second\n---\n",
  });
  const beta = await repository(root, "owner/beta", {
    "SKILL.md": "---\nname: root\ndescription: root skill\n---\n",
  });
  const manifest = {
    schemaVersion: 1,
    warehouseRoot: root,
    expectedSkillBodies: 3,
    policy: { executeThirdPartyCode: false, activateSkills: false },
    entries: [
      { fullName: "owner/alpha", head: alpha.head, license: "MIT", disposition: "acquire" },
      { fullName: "owner/beta", head: beta.head, license: "NOASSERTION", disposition: "acquire-pattern-only" },
    ],
  };
  return { root, alpha, beta, manifest };
}

test("snapshot binds exact remote head and every skill body", async (t) => {
  const { root, manifest } = await fixture(t);
  const result = await buildQuarrySnapshot({ manifest, repositoryRoot: root });

  assert.deepEqual(result.summary, {
    repositories: 2,
    verifiedRepositories: 2,
    exactFiles: 3,
    exactBytes: result.summary.exactBytes,
    skillBodies: 3,
    exactDuplicateGroups: 0,
  });
  assert.equal(result.sourceRecords.length, 3);
  assert.deepEqual(result.sourceRecords.map(({ sourcePath }) => sourcePath), [
    "skills/one/SKILL.md",
    "skills/two/SKILL.md",
    "SKILL.md",
  ]);
  assert.ok(result.sourceRecords.every(({ inert }) => inert === true));
  assert.ok(result.rows.every(({ verified }) => verified === true));
});

test("snapshot fails on dirty checkout and head drift", async (t) => {
  const { root, alpha, manifest } = await fixture(t);
  await writeFile(path.join(alpha.directory, "dirty.txt"), "dirty\n", "utf8");
  await assert.rejects(
    () => buildQuarrySnapshot({ manifest, repositoryRoot: root }),
    /dirty repository: owner\/alpha/,
  );

  await rm(path.join(alpha.directory, "dirty.txt"));
  const stale = structuredClone(manifest);
  stale.entries[0].head = "f".repeat(40);
  await assert.rejects(
    () => buildQuarrySnapshot({ manifest: stale, repositoryRoot: root }),
    /head mismatch: owner\/alpha/,
  );
});

test("snapshot rejects remote substitution and skill-count drift", async (t) => {
  const { root, beta, manifest } = await fixture(t);
  git(beta.directory, "remote", "set-url", "origin", "https://github.com/other/repository.git");
  await assert.rejects(
    () => buildQuarrySnapshot({ manifest, repositoryRoot: root }),
    /remote mismatch: owner\/beta/,
  );

  git(beta.directory, "remote", "set-url", "origin", "https://github.com/owner/beta.git");
  const drift = structuredClone(manifest);
  drift.expectedSkillBodies = 4;
  await assert.rejects(
    () => buildQuarrySnapshot({ manifest: drift, repositoryRoot: root }),
    /skill body count mismatch: expected 4, received 3/,
  );
});

test("wave snapshot receipt is deterministic and binds every output", async (t) => {
  const { root, manifest } = await fixture(t);
  const first = await buildWaveThreeSnapshot({
    manifest,
    repositoryRoot: root,
    write: false,
  });
  const second = await buildWaveThreeSnapshot({
    manifest,
    repositoryRoot: root,
    write: false,
  });

  assert.deepEqual(first.receipt, second.receipt);
  assert.equal(Object.hasOwn(first.receipt, "generatedAt"), false);
  assert.equal(first.receipt.status, "verified");
  assert.equal(first.receipt.summary.skillBodies, 3);
  assert.match(first.receipt.outputs.sourceRecords.sha256, /^[a-f0-9]{64}$/);
  assert.match(first.receipt.outputs.repositoryFileManifests.sha256, /^[a-f0-9]{64}$/);
  assert.match(first.receipt.outputs.duplicateGroups.sha256, /^[a-f0-9]{64}$/);
});
