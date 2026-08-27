import test from "node:test";
import assert from "node:assert/strict";
import { lstat, mkdir, mkdtemp, readFile, readlink, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  activateProfile,
  planProfile,
  removeProfile,
  verifyProfile,
} from "../src/profile.mjs";
import { sha256 } from "../src/io.mjs";

async function fixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "godskills-profile-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourceRoot = path.join(root, "sources");
  const destination = path.join(root, "project", ".agents", "skills");
  const receiptRoot = path.join(root, "promotions");
  await Promise.all([
    mkdir(path.join(sourceRoot, "oracle"), { recursive: true }),
    mkdir(path.join(sourceRoot, "refinery"), { recursive: true }),
    mkdir(destination, { recursive: true }),
    mkdir(receiptRoot, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(sourceRoot, "oracle", "SKILL.md"), "oracle\n", "utf8"),
    writeFile(path.join(sourceRoot, "refinery", "SKILL.md"), "refinery\n", "utf8"),
    writeFile(
      path.join(receiptRoot, "oracle.json"),
      JSON.stringify({ schemaVersion: 1, decision: { status: "promoted" } }),
      "utf8",
    ),
    writeFile(
      path.join(receiptRoot, "refinery.json"),
      JSON.stringify({ schemaVersion: 1, decision: { status: "promoted" } }),
      "utf8",
    ),
  ]);
  return {
    root,
    destination,
    lock: {
      schemaVersion: 1,
      name: "test-core",
      skills: [
        {
          name: "eternities-oracle",
          source: path.join(sourceRoot, "oracle"),
          promotionReceipt: path.join(receiptRoot, "oracle.json"),
        },
        {
          name: "sovereign-skill-refinery",
          source: path.join(sourceRoot, "refinery"),
          promotionReceipt: path.join(receiptRoot, "refinery.json"),
        },
      ],
    },
  };
}

test("profile refuses to overwrite an unrelated destination", async (context) => {
  const { lock, destination } = await fixture(context);
  await mkdir(path.join(destination, "eternities-oracle"));

  await assert.rejects(() => planProfile(lock, destination), /collision/);
});

test("profile refuses an unresolved promotion receipt", async (context) => {
  const { lock, destination } = await fixture(context);
  await writeFile(
    lock.skills[0].promotionReceipt,
    JSON.stringify({ schemaVersion: 1, decision: { status: "unverified" } }),
    "utf8",
  );

  await assert.rejects(() => planProfile(lock, destination), /not promoted/);
});

test("profile entrypoint digests are stable across checkout line endings", async (context) => {
  const { lock, destination } = await fixture(context);
  await writeFile(path.join(lock.skills[0].source, "SKILL.md"), "oracle\r\n", "utf8");

  const plan = await planProfile(lock, destination);
  assert.equal(plan.operations[0].entrypointSha256, sha256("oracle\n"));
});

test("activation creates exact directory links and replanning is idempotent", async (context) => {
  const { lock, destination } = await fixture(context);
  const plan = await planProfile(lock, destination);
  assert.deepEqual(plan.summary, { add: 2, existing: 0 });

  const receipt = await activateProfile(plan);
  assert.equal(receipt.links.filter(({ createdByProfile }) => createdByProfile).length, 2);
  for (const link of receipt.links) {
    assert.equal((await lstat(link.destination)).isSymbolicLink(), true);
    assert.equal(
      path.resolve(await readlink(link.destination)).toLowerCase(),
      path.resolve(link.source).toLowerCase(),
    );
  }

  const second = await planProfile(lock, destination);
  assert.deepEqual(second.summary, { add: 0, existing: 2 });
  const repeatedReceipt = await activateProfile(second, { previousReceipt: receipt });
  assert.equal(
    repeatedReceipt.links.filter(({ createdByProfile }) => createdByProfile).length,
    2,
  );
});

test("profile removal deletes only links recorded as created by its receipt", async (context) => {
  const { lock, destination } = await fixture(context);
  const unrelated = path.join(destination, "unrelated-skill");
  await mkdir(unrelated);
  const receipt = await activateProfile(await planProfile(lock, destination));
  receipt.links.push({
    name: "unrelated-skill",
    source: unrelated,
    destination: unrelated,
    linkTarget: unrelated,
    createdByProfile: false,
  });

  const preview = await removeProfile(receipt, { dryRun: true });
  assert.equal(preview.removed.length, 0);
  assert.equal(preview.planned.length, 2);
  const result = await removeProfile(receipt, { dryRun: false });
  assert.equal(result.removed.length, 2);
  assert.deepEqual(result.preserved, ["unrelated-skill"]);
  assert.equal((await lstat(unrelated)).isDirectory(), true);
});

test("prompt verification requires core names and rejects cold or explicit-only payloads", () => {
  const receipt = {
    links: [
      { name: "eternities-oracle" },
      { name: "sovereign-skill-refinery" },
    ],
  };
  const clean = verifyProfile(
    receipt,
    "available: eternities-oracle, sovereign-skill-refinery",
  );
  assert.equal(clean.valid, true);

  const leaked = verifyProfile(
    receipt,
    "eternities-oracle sovereign-skill-refinery eternities-pantheon source-records.jsonl",
  );
  assert.equal(leaked.valid, false);
  assert.ok(leaked.forbidden.includes("eternities-pantheon"));
  assert.ok(leaked.forbidden.includes("source-records.jsonl"));
});

test("engineering profile contains exactly six promoted skills", async () => {
  const profilePath = new URL(
    "../profiles/eternities-engineering.lock.json",
    import.meta.url,
  );
  const lock = JSON.parse(await readFile(profilePath, "utf8"));
  const expected = [
    "eternities-aegis",
    "eternities-architect",
    "eternities-forge",
    "eternities-mnemosyne",
    "eternities-oracle",
    "sovereign-skill-refinery",
  ];

  assert.equal(lock.name, "eternities-engineering");
  assert.deepEqual(
    lock.skills.map(({ name }) => name).sort(),
    expected,
  );
  for (const skill of lock.skills) {
    const receiptPath = new URL(skill.promotionReceipt, profilePath);
    const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    assert.equal(receipt.skillName, skill.name);
    assert.equal(receipt.decision.status, "promoted");
  }
});
