import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildOperationalOwnerBaseline } from "../src/operational-capability-baseline.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const records = JSON.parse(fs.readFileSync(path.join(root, "data/operational-capabilities.v1.json"))).records;
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function evidence(id = "bounded-service-shutdown") {
  const record = records.find((row) => row.id === id);
  const ownerId = record.ownerGodskillId;
  const entrypointPath = `skills/${ownerId}/SKILL.md`;
  const contractPath = `skills/${ownerId}/references/capability-contract.json`;
  const entrypoint = fs.readFileSync(path.join(root, entrypointPath));
  const contract = fs.readFileSync(path.join(root, contractPath));
  return {
    record,
    owner: {
      id: ownerId,
      entrypoint: { path: entrypointPath, sha256: sha256(entrypoint), bytes: entrypoint.byteLength },
      contract: { path: contractPath, sha256: sha256(contract), bytes: contract.byteLength },
      contractBody: JSON.parse(contract),
    },
  };
}

test("current owner baseline is executable evidence rather than synthetic non-coverage", () => {
  const baseline = buildOperationalOwnerBaseline(evidence());
  assert.equal(baseline.baselineKind, "current-owner-entrypoint");
  assert.equal(baseline.ownerId, "eternities-daedalus");
  assert.equal(baseline.results.length, 9);
  assert.equal(baseline.results.find((row) => row.id === "direct").actual, "select:eternities-daedalus");
  assert.equal(baseline.results.find((row) => row.id === "authority").actual, "refuse:missing-authority");
  assert.match(baseline.ownerArtifacts.entrypoint.sha256, /^[a-f0-9]{64}$/);
  assert.match(baseline.ownerArtifacts.contract.sha256, /^[a-f0-9]{64}$/);
});

test("baseline construction fails closed without exact owner artifacts", () => {
  const missing = evidence();
  delete missing.owner.contract;
  assert.throws(() => buildOperationalOwnerBaseline(missing), /owner contract artifact/i);

  const mismatch = evidence();
  mismatch.owner.id = "eternities-aegis";
  assert.throws(() => buildOperationalOwnerBaseline(mismatch), /owner does not match/i);
});
