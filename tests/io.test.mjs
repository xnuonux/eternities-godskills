import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { canonicalText, readJson, sha256, writeJsonAtomic } from "../src/io.mjs";

test("canonicalText removes checkout-specific line endings", () => {
  assert.equal(canonicalText("alpha\r\nbeta\r\n"), "alpha\nbeta\n");
  assert.equal(canonicalText("alpha\nbeta\n"), "alpha\nbeta\n");
});

test("sha256 returns the standard lowercase digest", () => {
  assert.equal(
    sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("atomic JSON writes are deterministic and readable", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "godskills-io-"));
  const target = path.join(root, "nested", "record.json");
  try {
    await writeJsonAtomic(target, { z: 1, a: ["x"] });
    assert.deepEqual(await readJson(target), { z: 1, a: ["x"] });
    assert.equal(
      await readFile(target, "utf8"),
      '{\n  "z": 1,\n  "a": [\n    "x"\n  ]\n}\n',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

