import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { validateSelectedEntrypointPackage } from "../src/portable-capability-manifest.mjs";

const root = path.resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const manifestBytes = fs.readFileSync(path.join(root, "artifacts/portable-capabilities/manifest.v1.json"));
const manifest = JSON.parse(manifestBytes);
const receipt = JSON.parse(fs.readFileSync(path.join(root, "receipts/portable-capability-manifest-v1.json")));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

test("portable manifest contains 21 immutable owners and 22 operational delegates", () => {
  assert.equal(manifest.capabilities.length, 43);
  assert.equal(manifest.capabilities.filter((row) => row.tier === "godskill").length, 21);
  assert.equal(manifest.capabilities.filter((row) => row.tier === "operational-skill").length, 22);
  assert.equal(new Set(manifest.capabilities.map((row) => row.id)).size, 43);
  assert.equal(manifest.ownerRegistries.length, 13);
  assert.equal(manifest.ownerRegistries.reduce((sum, row) => sum + row.extensionCount, 0), 26);
});

test("every capability binds exact relative entrypoint contract and promotion bytes", () => {
  for (const row of manifest.capabilities) {
    for (const artifact of [row.entrypoint, row.contract, row.promotionReceipt]) {
      const bytes = fs.readFileSync(path.join(root, artifact.path));
      assert.equal(sha256(bytes), artifact.sha256, `${row.id}:${artifact.path}`);
    }
    assert.equal(row.entrypoint.path, `skills/${row.id}/SKILL.md`);
    assert.equal(row.capabilityDoesNotGrantAuthority, true);
    assert.ok(row.composition.maximumSelected >= 1 && row.composition.maximumSelected <= 3);
  }
});

test("manifest is content addressed deterministic and contains no host or secret material", () => {
  const { manifestDigest, ...body } = manifest;
  assert.equal(manifestDigest, sha256(JSON.stringify(body)));
  assert.equal(receipt.manifest.sha256, sha256(manifestBytes));
  const text = manifestBytes.toString("utf8");
  assert.doesNotMatch(text, /(?:[A-Z]:\\|C:\/|D:\/|Users\\|sk-or-v1-|api[_-]?key|password|credential value)/i);
  assert.doesNotMatch(text, /lunari|luna-specific|product authority/i);
  assert.equal(manifest.activation.sourceExecutions, 0);
  assert.equal(manifest.activation.externalMutations, 0);
});

test("selected entrypoint package matches the Godagents adapter boundary", () => {
  const selected = manifest.capabilities.filter((row) => ["eternities-daedalus", "bounded-service-shutdown"].includes(row.id));
  assert.deepEqual(validateSelectedEntrypointPackage({
    selectedIds: selected.map((row) => row.id),
    selectedEntrypoints: selected.map((row) => row.entrypoint.path),
    maxCompositionSize: 3,
  }), selected.map((row) => row.entrypoint.path));
  assert.throws(() => validateSelectedEntrypointPackage({
    selectedIds: ["eternities-daedalus"],
    selectedEntrypoints: ["skills/other/SKILL.md"],
    maxCompositionSize: 3,
  }), /does not match its id/);
  assert.throws(() => validateSelectedEntrypointPackage({
    selectedIds: ["a", "b", "c", "d"],
    selectedEntrypoints: ["skills/a/SKILL.md", "skills/b/SKILL.md", "skills/c/SKILL.md", "skills/d/SKILL.md"],
    maxCompositionSize: 3,
  }), /exceeds maximum composition/);
});
