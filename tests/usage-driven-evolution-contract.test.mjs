import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { canonicalText, sha256 } from "../src/io.mjs";

const root = path.resolve(".");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

test("the evolution contract is neutral, inert, and bound to exact quarry evidence", async () => {
  const contract = await readJson("data/usage-driven-skill-evolution-contract.json");
  const records = (await readFile(path.join(root, "artifacts/github-wave-2/source-records.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);

  assert.equal(contract.authority.targetCodeExecuted, false);
  assert.equal(contract.authority.liveSkillMutation, false);
  assert.equal(contract.authority.automaticAdoption, false);
  assert.equal(contract.copiedSourceProse, false);
  assert.equal(contract.copiedImplementation, false);
  assert.equal(contract.provenance.length, 2);
  for (const source of contract.provenance) {
    const record = records.find(({ id }) => id === source.sourceId);
    assert.ok(record, source.sourceId);
    assert.equal(record.inert, true);
    assert.equal(record.bodySha256, source.bodySha256);
    assert.equal(sha256(await readFile(record.sourceAbsolutePath)), source.bodySha256);
  }
});

test("the refinery entrypoint makes evolution staged and explicit-only", async () => {
  const body = canonicalText(await readFile(path.join(root, "skills/sovereign-skill-refinery/SKILL.md"), "utf8"));
  assert.match(body, /reviewed, redacted trace records/i);
  assert.match(body, /development` partition/i);
  assert.match(body, /seal held-out identities/i);
  assert.match(body, /eligible`, never `adopted`/i);
  assert.match(body, /separate explicit adoption action/i);
});
