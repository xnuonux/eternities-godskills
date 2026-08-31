import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

async function trustRoot() {
  try {
    return await import("../src/static-module-closure.mjs");
  } catch (error) {
    assert.fail(`static module closure is unavailable: ${error.message}`);
  }
}

async function receiptBuilder() {
  try {
    return await import("../scripts/build-adaptive-activation-executable-receipt.mjs");
  } catch (error) {
    assert.fail(`activation executable receipt builder is unavailable: ${error.message}`);
  }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

const digest = (value) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function put(root, relative, value) {
  const path = join(root, ...relative.split("/"));
  await mkdir(dirname(path), { recursive: true });
  const body = typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, body, "utf8");
  return path;
}

function parentReceipt() {
  const unsigned = {
    schemaVersion: 1,
    id: "adaptive-activation-v1",
    status: "experimental",
    inputs: { compilerSha256: "a".repeat(64) },
    proofLimits: ["fixture-only"],
  };
  return { ...unsigned, receiptDigest: digest(unsigned) };
}

async function createFixture(t, prefix = "activation-trust-root-") {
  const root = await mkdtemp(join(tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all([
    put(root, "scripts/fixture-activation.mjs", [
      "import { compile } from \"../src/adaptive-activation.mjs\";",
      "import { validate } from \"../src/adaptive-activation-protocol.mjs\";",
      "export const run = () => validate(compile());",
      "",
    ].join("\n")),
    put(root, "src/adaptive-activation.mjs", [
      "import { sha256 } from \"./io.mjs\";",
      "export const compile = () => sha256(\"compile\");",
      "",
    ].join("\n")),
    put(root, "src/adaptive-activation-protocol.mjs", [
      "export { sha256 as validate } from \"./io.mjs\";",
      "",
    ].join("\n")),
    put(root, "src/io.mjs", "export const sha256 = (value) => value;\n"),
    put(root, "schemas/adaptive-activation-request.v1.schema.json", { schemaVersion: 1, kind: "request" }),
    put(root, "schemas/adaptive-activation-result.v1.schema.json", { schemaVersion: 1, kind: "result" }),
    put(root, "policies/adaptive-activation.v1.json", { schemaVersion: 1, id: "adaptive-activation-policy-v1" }),
    put(root, "artifacts/adaptive-activation/evidence.v1.json", { schemaVersion: 1, id: "adaptive-activation-evidence-v1" }),
    put(root, "artifacts/adaptive-activation/neutral-contract.json", { schemaVersion: 1, id: "adaptive-amplification-v1" }),
    put(root, "receipts/adaptive-activation-v1.json", parentReceipt()),
  ]);
  return root;
}

test("discovers a complete unique local module closure in canonical path order", async (t) => {
  const root = await createFixture(t);
  const { discoverLocalModuleClosure } = await trustRoot();
  const rows = await discoverLocalModuleClosure({
    repositoryRoot: root,
    roots: ["scripts/fixture-activation.mjs", "src/adaptive-activation.mjs"],
  });

  assert.deepEqual(rows.map(({ path }) => path), [
    "scripts/fixture-activation.mjs",
    "src/adaptive-activation-protocol.mjs",
    "src/adaptive-activation.mjs",
    "src/io.mjs",
  ]);
  assert.equal(rows.every(({ sha256: value, bytes }) => /^[a-f0-9]{64}$/.test(value) && bytes > 0), true);
});

test("rejects ambiguous, unresolved, external, duplicate, and escaping module graphs", async (t) => {
  const { discoverLocalModuleClosure } = await trustRoot();

  const duplicate = await createFixture(t, "activation-duplicate-");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: duplicate,
    roots: ["scripts/fixture-activation.mjs", "scripts/fixture-activation.mjs"],
  }), /duplicate root/i);

  const unresolved = await createFixture(t, "activation-unresolved-");
  await put(unresolved, "scripts/fixture-activation.mjs", "import \"../src/missing.mjs\";\n");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: unresolved,
    roots: ["scripts/fixture-activation.mjs"],
  }), /unresolved|missing/i);

  const dynamic = await createFixture(t, "activation-dynamic-");
  await put(dynamic, "scripts/fixture-activation.mjs", "export const run = () => import(\"../src/io.mjs\");\n");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: dynamic,
    roots: ["scripts/fixture-activation.mjs"],
  }), /dynamic/i);

  const bare = await createFixture(t, "activation-bare-");
  await put(bare, "scripts/fixture-activation.mjs", "import value from \"unbound-package\";\nexport default value;\n");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: bare,
    roots: ["scripts/fixture-activation.mjs"],
  }), /bare|external/i);

  const escaped = await createFixture(t, "activation-escaped-");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: escaped,
    roots: ["../outside.mjs"],
  }), /repository-relative|escape/i);

  const junction = await createFixture(t, "activation-junction-");
  const outside = await mkdtemp(join(tmpdir(), "activation-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await put(outside, "escape.mjs", "export const escaped = true;\n");
  await symlink(outside, join(junction, "src", "linked"), "junction");
  await put(junction, "scripts/fixture-activation.mjs", "import \"../src/linked/escape.mjs\";\n");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: junction,
    roots: ["scripts/fixture-activation.mjs"],
  }), /escape|outside/i);

  const alias = await createFixture(t, "activation-symlink-alias-");
  await mkdir(join(alias, "internal"), { recursive: true });
  await put(alias, "internal/aliased.mjs", "export const aliased = true;\n");
  await symlink(join(alias, "internal"), join(alias, "src", "linked"), "junction");
  await put(alias, "scripts/fixture-activation.mjs", "import \"../src/linked/aliased.mjs\";\n");
  await assert.rejects(discoverLocalModuleClosure({
    repositoryRoot: alias,
    roots: ["scripts/fixture-activation.mjs"],
  }), /alias|symlink|canonical/i);
});

test("builds a relocation-independent executable receipt from exact fixture bytes", async (t) => {
  const firstRoot = await createFixture(t, "activation-relocation-a-");
  const secondRoot = await createFixture(t, "activation-relocation-b-");
  const { buildAdaptiveActivationExecutableReceipt } = await receiptBuilder();
  const first = await buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: firstRoot,
    entrypointPath: "scripts/fixture-activation.mjs",
  });
  const second = await buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: secondRoot,
    entrypointPath: "scripts/fixture-activation.mjs",
  });

  assert.equal(first.schemaVersion, 1);
  assert.equal(first.id, "adaptive-activation-executable-v1");
  assert.equal(first.status, "verified-build");
  assert.equal(first.protocolId, "eternities-godskills-activation-v1");
  assert.equal(first.parentReceipt.receiptDigest, parentReceipt().receiptDigest);
  assert.deepEqual(first.dependencyClosure.roots, [
    "scripts/fixture-activation.mjs",
    "src/adaptive-activation.mjs",
  ]);
  assert.deepEqual(first.dependencyClosure.localModules, [
    "scripts/fixture-activation.mjs",
    "src/adaptive-activation-protocol.mjs",
    "src/adaptive-activation.mjs",
    "src/io.mjs",
  ]);
  assert.equal(first.dependencyClosure.complete, true);
  assert.equal(first.artifacts.find(({ role }) => role === "policy").logicalDigest,
    digest({ schemaVersion: 1, id: "adaptive-activation-policy-v1" }));
  assert.equal(first.artifacts.some(({ path }) => /^[A-Za-z]:|^\//.test(path)), false);
  const unsigned = structuredClone(first);
  delete unsigned.receiptDigest;
  assert.equal(first.receiptDigest, digest(unsigned));
  assert.equal(second.receiptDigest, first.receiptDigest);
  assert.deepEqual(second, first);
});

test("rejects stale parent identity and missing declared data before issuing a receipt", async (t) => {
  const { buildAdaptiveActivationExecutableReceipt } = await receiptBuilder();
  const stale = await createFixture(t, "activation-stale-parent-");
  const receiptPath = join(stale, "receipts", "adaptive-activation-v1.json");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  receipt.receiptDigest = "0".repeat(64);
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await assert.rejects(buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: stale,
    entrypointPath: "scripts/fixture-activation.mjs",
  }), /parent receipt digest/i);

  const missing = await createFixture(t, "activation-missing-data-");
  await rm(join(missing, "policies", "adaptive-activation.v1.json"));
  await assert.rejects(buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: missing,
    entrypointPath: "scripts/fixture-activation.mjs",
  }), /policy|missing|ENOENT/i);
});

test("binds every declared executable artifact and every discovered dependency", async (t) => {
  const { buildAdaptiveActivationExecutableReceipt } = await receiptBuilder();
  const mutations = [
    ["src/adaptive-activation.mjs", "export const changed = true;\n"],
    ["schemas/adaptive-activation-request.v1.schema.json", { schemaVersion: 1, kind: "changed-request" }],
    ["schemas/adaptive-activation-result.v1.schema.json", { schemaVersion: 1, kind: "changed-result" }],
    ["policies/adaptive-activation.v1.json", { schemaVersion: 1, id: "changed-policy" }],
    ["artifacts/adaptive-activation/evidence.v1.json", { schemaVersion: 1, id: "changed-evidence" }],
    ["artifacts/adaptive-activation/neutral-contract.json", { schemaVersion: 1, id: "changed-contract" }],
  ];

  for (const [relativePath, replacement] of mutations) {
    const root = await createFixture(t, `activation-mutated-${relativePath.replaceAll("/", "-")}-`);
    const before = await buildAdaptiveActivationExecutableReceipt({
      repositoryRoot: root,
      entrypointPath: "scripts/fixture-activation.mjs",
    });
    await put(root, relativePath, replacement);
    const after = await buildAdaptiveActivationExecutableReceipt({
      repositoryRoot: root,
      entrypointPath: "scripts/fixture-activation.mjs",
    });
    assert.notEqual(after.receiptDigest, before.receiptDigest, `${relativePath} must affect the receipt`);
    assert.notDeepEqual(after.artifacts.find(({ path }) => path === relativePath),
      before.artifacts.find(({ path }) => path === relativePath));
  }

  const parentRoot = await createFixture(t, "activation-mutated-parent-");
  const beforeParent = await buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: parentRoot,
    entrypointPath: "scripts/fixture-activation.mjs",
  });
  const changedParent = parentReceipt();
  changedParent.proofLimits = ["fixture-only", "changed"];
  delete changedParent.receiptDigest;
  changedParent.receiptDigest = digest(changedParent);
  await put(parentRoot, "receipts/adaptive-activation-v1.json", changedParent);
  const afterParent = await buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: parentRoot,
    entrypointPath: "scripts/fixture-activation.mjs",
  });
  assert.notEqual(afterParent.receiptDigest, beforeParent.receiptDigest);
  assert.notDeepEqual(afterParent.parentReceipt, beforeParent.parentReceipt);

  const extraRoot = await createFixture(t, "activation-extra-dependency-");
  const beforeExtra = await buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: extraRoot,
    entrypointPath: "scripts/fixture-activation.mjs",
  });
  await put(extraRoot, "src/new-dependency.mjs", "export const newDependency = true;\n");
  await put(extraRoot, "scripts/fixture-activation.mjs", [
    "import { compile } from \"../src/adaptive-activation.mjs\";",
    "import { validate } from \"../src/adaptive-activation-protocol.mjs\";",
    "import { newDependency } from \"../src/new-dependency.mjs\";",
    "export const run = () => validate(compile()) && newDependency;",
    "",
  ].join("\n"));
  const afterExtra = await buildAdaptiveActivationExecutableReceipt({
    repositoryRoot: extraRoot,
    entrypointPath: "scripts/fixture-activation.mjs",
  });
  assert.equal(afterExtra.dependencyClosure.localModules.includes("src/new-dependency.mjs"), true);
  assert.equal(afterExtra.artifacts.some(({ path }) => path === "src/new-dependency.mjs"), true);
  assert.notEqual(afterExtra.receiptDigest, beforeExtra.receiptDigest);
});
