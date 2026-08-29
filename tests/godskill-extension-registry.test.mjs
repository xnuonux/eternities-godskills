import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildGodskillExtensionRegistries,
  selectOwnerExtension,
} from "../src/godskill-extension-registry.mjs";

const wave = JSON.parse(fs.readFileSync(new URL("../data/universal-capability-wave.v1.json", import.meta.url)));
const definitions = JSON.parse(fs.readFileSync(new URL("../data/godskill-extensions.v1.json", import.meta.url)));
const expected = wave.targets.filter((target) => target.kind === "godskill-extension");

test("all 26 certified extensions appear exactly once under a current categorical owner", () => {
  const result = buildGodskillExtensionRegistries({ wave, definitions });
  assert.equal(result.extensionCount, 26);
  assert.equal(result.ownerCount, 13);
  const rows = Object.values(result.registries).flatMap((registry) => registry.extensions);
  assert.equal(new Set(rows.map((row) => row.id)).size, 26);
  assert.deepEqual(rows.map((row) => row.targetId).sort(), expected.map((row) => row.targetId).sort());
  for (const [ownerId, registry] of Object.entries(result.registries)) {
    assert.ok(fs.existsSync(new URL(`../skills/${ownerId}/SKILL.md`, import.meta.url)));
    assert.ok(registry.extensions.every((row) => row.categoricalOwnerId === ownerId));
  }
});

test("extension selection is deterministic bounded and owner-local", () => {
  const { registries } = buildGodskillExtensionRegistries({ wave, definitions });
  const request = {
    keywords: ["graphql", "typed", "resolver", "contract"],
    allowedEffects: ["read", "write"],
    grantedAuthority: ["local-read", "repository-write"],
  };
  const first = selectOwnerExtension({ ownerId: "eternities-daedalus", requestFeatures: request, registries });
  const second = selectOwnerExtension({ ownerId: "eternities-daedalus", requestFeatures: request, registries });
  assert.deepEqual(first, second);
  assert.equal(first[0].id, "bounded-typed-graphql-contract-and-execution");
  assert.ok(first.length <= 3);
  assert.equal(first.some((row) => row.categoricalOwnerId !== "eternities-daedalus"), false);
});

test("selection fails closed on authority effects and recursive ownership", () => {
  const { registries } = buildGodskillExtensionRegistries({ wave, definitions });
  assert.deepEqual(selectOwnerExtension({
    ownerId: "eternities-daedalus",
    requestFeatures: { keywords: ["graphql", "typed"], allowedEffects: ["read"], grantedAuthority: ["local-read"] },
    registries,
  }), []);
  assert.throws(() => selectOwnerExtension({ ownerId: "unknown", requestFeatures: {}, registries }), /unknown owner registry/);

  const changed = structuredClone(definitions);
  changed.extensions[0].handoffOwnerIds = [changed.extensions[0].categoricalOwnerId];
  assert.throws(() => buildGodskillExtensionRegistries({ wave, definitions: changed }), /recursive owner handoff/);
});

test("missing duplicate stale and authority-expanding extensions fail closed", () => {
  const missing = { ...definitions, extensions: definitions.extensions.slice(1) };
  assert.throws(() => buildGodskillExtensionRegistries({ wave, definitions: missing }), /requires exactly 26 extensions/);
  const duplicate = { ...definitions, extensions: [...definitions.extensions, definitions.extensions[0]] };
  assert.throws(() => buildGodskillExtensionRegistries({ wave, definitions: duplicate }), /requires exactly 26 extensions/);
  const stale = structuredClone(definitions);
  stale.extensions[0].sourceBinding.clusterDigest = "f".repeat(64);
  assert.throws(() => buildGodskillExtensionRegistries({ wave, definitions: stale }), /cluster digest does not match target/);
  const authority = structuredClone(definitions);
  authority.extensions[0].capabilityDoesNotGrantAuthority = false;
  assert.throws(() => buildGodskillExtensionRegistries({ wave, definitions: authority }), /capability must not grant authority/);
});
