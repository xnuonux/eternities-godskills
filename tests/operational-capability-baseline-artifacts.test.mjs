import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildOperationalBaselineArtifacts } from "../scripts/build-operational-capability-baselines.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));

test("all 22 operational candidates bind a separately materialized current-owner baseline", async () => {
  const rebuilt = await buildOperationalBaselineArtifacts({ root });
  const committed = JSON.parse(fs.readFileSync(path.join(root, "data/operational-capability-baselines.v1.json")));
  assert.deepEqual(rebuilt, committed);
  assert.equal(rebuilt.baselines.length, 22);
  assert.equal(new Set(rebuilt.baselines.map((row) => row.skillId)).size, 22);
  assert.ok(rebuilt.baselines.every((row) => row.baselineKind === "current-owner-entrypoint"));
  assert.ok(rebuilt.baselines.every((row) => row.ownerArtifacts.entrypoint.sha256 && row.ownerArtifacts.contract.sha256));
});
