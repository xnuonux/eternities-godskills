import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildGodskillExtensionRegistries,
  selectOwnerExtension,
} from "../src/godskill-extension-registry.mjs";
import { buildUniversalExtensionDefinitions } from "../src/universal-extension-definitions.mjs";

const wave = JSON.parse(fs.readFileSync(new URL("../data/universal-capability-wave.v1.json", import.meta.url)));
const definitions = JSON.parse(fs.readFileSync(new URL("../data/godskill-extensions.v1.json", import.meta.url)));
const ownerPolicies = JSON.parse(fs.readFileSync(new URL("../data/godskill-owner-policies.v1.json", import.meta.url)));
const evaluationFixtures = JSON.parse(fs.readFileSync(new URL("../data/godskill-extension-evaluation-fixtures.v1.json", import.meta.url)));
const expected = wave.targets.filter((target) => target.kind === "godskill-extension");

const build = (changed = definitions) => buildGodskillExtensionRegistries({
  wave,
  definitions: changed,
  ownerPolicies,
  evaluationFixtures,
});

test("definition rebuild encodes advisory escalation without routable legacy handoffs", () => {
  const rebuilt = buildUniversalExtensionDefinitions(wave);
  assert.ok(rebuilt.extensions.every((row) => Array.isArray(row.terminalEscalationOwnerIds)));
  assert.ok(rebuilt.extensions.every((row) => row.handoffOwnerIds === undefined));
});

test("all 26 certified extensions appear exactly once under a current categorical owner", () => {
  const result = build();
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
  const { registries } = build();
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
  const { registries } = build();
  assert.deepEqual(selectOwnerExtension({
    ownerId: "eternities-daedalus",
    requestFeatures: { keywords: ["graphql", "typed"], allowedEffects: ["read"], grantedAuthority: ["local-read"] },
    registries,
  }), []);
  assert.throws(() => selectOwnerExtension({ ownerId: "unknown", requestFeatures: {}, registries }), /unknown owner registry/);

  const changed = structuredClone(definitions);
  changed.extensions[0].routableHandoffOwnerIds = [changed.extensions[1].categoricalOwnerId];
  changed.extensions[1].routableHandoffOwnerIds = [changed.extensions[0].categoricalOwnerId];
  assert.throws(() => build(changed), /recursive owner handoff graph/);
});

test("missing duplicate stale and authority-expanding extensions fail closed", () => {
  const missing = { ...definitions, extensions: definitions.extensions.slice(1) };
  assert.throws(() => build(missing), /requires exactly 26 extensions/);
  const duplicate = { ...definitions, extensions: [...definitions.extensions, definitions.extensions[0]] };
  assert.throws(() => build(duplicate), /requires exactly 26 extensions/);
  const stale = structuredClone(definitions);
  stale.extensions[0].sourceBinding.clusterDigest = "f".repeat(64);
  assert.throws(() => build(stale), /cluster digest does not match target/);
  const authority = structuredClone(definitions);
  authority.extensions[0].capabilityDoesNotGrantAuthority = false;
  assert.throws(() => build(authority), /capability must not grant authority/);

  const expanded = structuredClone(definitions);
  expanded.extensions[0].requiredAuthority.push("credential-use");
  assert.throws(() => build(expanded), /owner authority policy/);
});
