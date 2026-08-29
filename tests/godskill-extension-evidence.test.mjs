import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildGodskillExtensionEvidence } from "../scripts/build-godskill-extension-evidence.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));

test("extension evaluation evidence is separately materialized and covers positive and denied host policy", async () => {
  const rebuilt = await buildGodskillExtensionEvidence({ root });
  const policies = JSON.parse(fs.readFileSync(path.join(root, "data/godskill-owner-policies.v1.json")));
  const fixtures = JSON.parse(fs.readFileSync(path.join(root, "data/godskill-extension-evaluation-fixtures.v1.json")));
  assert.deepEqual(rebuilt.policies, policies);
  assert.deepEqual(rebuilt.fixtures, fixtures);
  assert.equal(policies.owners.length, 13);
  assert.equal(fixtures.extensions.length, 26);
  for (const row of fixtures.extensions) {
    assert.equal(row.cases.filter((entry) => entry.expected === "selected").length, 1);
    assert.equal(row.cases.filter((entry) => entry.expected === "denied").length, 2);
  }
});
