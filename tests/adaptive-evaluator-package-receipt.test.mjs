import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  canonicalDigest,
  canonicalFile,
} from "../src/adaptive-evidence-contracts.mjs";
import { validateEvaluatorPackageReceipt } from "../src/adaptive-evaluator-package.mjs";

async function builder() {
  return import("../scripts/build-adaptive-evaluator-package-receipt.mjs").catch((error) =>
    assert.fail(`adaptive evaluator receipt builder is unavailable: ${error.message}`));
}

async function put(root, relativePath, value) {
  const destination = path.join(root, ...relativePath.split("/"));
  await mkdir(path.dirname(destination), { recursive: true });
  const body = typeof value === "string" ? value : canonicalFile(value);
  await writeFile(destination, body, "utf8");
  return destination;
}

async function trustedPolicy() {
  return JSON.parse(await readFile(
    new URL("../policies/adaptive-evaluator-packages.v1.json", import.meta.url),
    "utf8",
  ));
}

function descriptor(overrides = {}) {
  return {
    id: "fixture-adaptive-evaluator-v1",
    evaluatorId: "fixture-deterministic-verifier-v1",
    evaluatorKind: "deterministic-verifier",
    taskClass: "security-review",
    artifactMediaType: "application/json",
    entrypointPath: "src/entrypoint.mjs",
    policyPath: "policies/adaptive-evaluator-packages.v1.json",
    packageSchemaPath: "schemas/adaptive-evaluator-package-v1.schema.json",
    requestSchemaPath: "schemas/adaptive-evaluator-request-v1.schema.json",
    resultSchemaPath: "schemas/adaptive-evaluator-result-v1.schema.json",
    resources: [{ role: "oracle", path: "artifacts/oracle.v1.json", logical: true }],
    ...overrides,
  };
}

async function fixture(t, prefix = "adaptive-evaluator-package-") {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all([
    put(root, "src/entrypoint.mjs", [
      "import { inspect } from \"./helper.mjs\";",
      "export const evaluate = (value) => inspect(value);",
      "",
    ].join("\n")),
    put(root, "src/helper.mjs", "export const inspect = (value) => value;\n"),
    put(root, "policies/adaptive-evaluator-packages.v1.json", await trustedPolicy()),
    put(root, "artifacts/oracle.v1.json", {
      schemaVersion: 1,
      id: "fixture-oracle-v1",
      cases: ["case-a"],
    }),
  ]);
  return root;
}

test("builds one relocation-independent closed evaluator package receipt", async (t) => {
  const [firstRoot, secondRoot] = await Promise.all([
    fixture(t, "adaptive-evaluator-relocation-a-"),
    fixture(t, "adaptive-evaluator-relocation-b-"),
  ]);
  const { buildAdaptiveEvaluatorPackageReceipt } = await builder();
  const first = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: firstRoot,
    descriptor: descriptor(),
  });
  const second = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: secondRoot,
    descriptor: descriptor(),
  });

  assert.deepEqual(second, first);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.status, "verified-build");
  assert.equal(first.protocolId, "eternities-godskills-evaluator-package-v1");
  assert.equal(first.authorityExpanded, false);
  assert.deepEqual(first.dependencyClosure, {
    roots: ["src/entrypoint.mjs"],
    localModules: ["src/entrypoint.mjs", "src/helper.mjs"],
    staticImportsComplete: true,
    runtimeCodeGenerationProvenAbsent: false,
    runtimeClosureComplete: false,
  });
  assert.deepEqual(first.artifacts.map(({ path: value }) => value), [
    "artifacts/oracle.v1.json",
    "policies/adaptive-evaluator-packages.v1.json",
    "schemas/adaptive-evaluator-package-v1.schema.json",
    "schemas/adaptive-evaluator-request-v1.schema.json",
    "schemas/adaptive-evaluator-result-v1.schema.json",
    "src/entrypoint.mjs",
    "src/helper.mjs",
  ]);
  assert.equal(first.artifacts.find(({ role }) => role === "oracle").logicalDigest,
    canonicalDigest({ schemaVersion: 1, id: "fixture-oracle-v1", cases: ["case-a"] }));
  assert.equal(first.artifacts.filter(({ role }) => role.endsWith("schema")).length, 3);
  assert.equal(first.artifacts.some(({ path: value }) => path.isAbsolute(value)), false);
  assert.deepEqual(validateEvaluatorPackageReceipt(first), first);

  const duplicateRoleBody = structuredClone(first);
  delete duplicateRoleBody.receiptDigest;
  duplicateRoleBody.artifacts.find(({ role }) => role === "dependency").role = "oracle";
  assert.throws(() => validateEvaluatorPackageReceipt({
    ...duplicateRoleBody,
    receiptDigest: canonicalDigest(duplicateRoleBody),
  }), /duplicate.*role/i);
});

test("every module, resource, policy byte, and generated schema affects identity", async (t) => {
  const { buildAdaptiveEvaluatorPackageReceipt } = await builder();
  const root = await fixture(t, "adaptive-evaluator-drift-");
  const initial = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor(),
  });

  await put(root, "src/helper.mjs", "export const inspect = (value) => ({ changed: value });\n");
  const moduleChanged = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor(),
  });
  assert.notEqual(moduleChanged.receiptDigest, initial.receiptDigest);

  await put(root, "artifacts/oracle.v1.json", {
    schemaVersion: 1,
    id: "fixture-oracle-v1",
    cases: ["case-a", "case-b"],
  });
  const resourceChanged = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor(),
  });
  assert.notEqual(resourceChanged.receiptDigest, moduleChanged.receiptDigest);

  const policyPath = path.join(root, "policies", "adaptive-evaluator-packages.v1.json");
  const policyValue = await trustedPolicy();
  await writeFile(policyPath, JSON.stringify(policyValue), "utf8");
  const policyBytesChanged = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor(),
  });
  assert.notEqual(policyBytesChanged.receiptDigest, resourceChanged.receiptDigest);
});

test("rejects descriptor escape, duplicates, missing data, and oversized resources", async (t) => {
  const { buildAdaptiveEvaluatorPackageReceipt } = await builder();
  const root = await fixture(t, "adaptive-evaluator-rejections-");

  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({ entrypointPath: "../outside.mjs" }),
  }), /repository-relative|escape/i);
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({ policyPath: path.resolve(root, "policies", "adaptive-evaluator-packages.v1.json") }),
  }), /repository-relative|absolute/i);
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({
      resources: [
        { role: "oracle", path: "artifacts/oracle.v1.json", logical: true },
        { role: "copy", path: "artifacts/oracle.v1.json", logical: true },
      ],
    }),
  }), /duplicate.*path/i);
  await put(root, "artifacts/second-oracle.json", { schemaVersion: 1, id: "second" });
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({
      resources: [
        { role: "oracle", path: "artifacts/oracle.v1.json", logical: true },
        { role: "oracle", path: "artifacts/second-oracle.json", logical: true },
      ],
    }),
  }), /duplicate.*role/i);
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({
      resources: [
        { role: "entrypoint", path: "artifacts/oracle.v1.json", logical: true },
      ],
    }),
  }), /reserved.*role|role.*reserved/i);
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({
      resources: [{ role: "oracle", path: "artifacts/missing.json", logical: true }],
    }),
  }), /missing|unresolved|ENOENT/i);

  const manyResources = [];
  for (let index = 0; index < 17; index += 1) {
    const relativePath = `artifacts/resource-${String(index).padStart(2, "0")}.json`;
    await put(root, relativePath, { index });
    manyResources.push({ role: `resource-${index}`, path: relativePath, logical: true });
  }
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor({ resources: manyResources }),
  }), /maximum|sixteen|16|resources/i);
});

test("rejects dynamic, CommonJS, bare, escaping, and symlinked module closure", async (t) => {
  const { buildAdaptiveEvaluatorPackageReceipt } = await builder();

  for (const [label, source, pattern] of [
    ["dynamic", "export const evaluate = () => import('./helper.mjs');\n", /dynamic/i],
    [
      "indirect-code-generation",
      "export const evaluate = () => Function(\"return im\" + \"port('node:fs')\")();\n",
      /dynamic|code generation|Function/i,
    ],
    ["commonjs", "export const evaluate = () => require('./helper.mjs');\n", /CommonJS|require/i],
    ["bare", "import value from 'external-package'; export { value };\n", /bare|external/i],
  ]) {
    const root = await fixture(t, `adaptive-evaluator-${label}-`);
    await put(root, "src/entrypoint.mjs", source);
    await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
      repositoryRoot: root,
      descriptor: descriptor(),
    }), pattern);
  }

  const computedConstructorRoot = await fixture(t, "adaptive-evaluator-computed-constructor-");
  await put(computedConstructorRoot, "src/entrypoint.mjs", [
    "export const evaluate = () =>",
    "  ([][\"filter\"][\"con\" + \"structor\"])(",
    "    \"return im\" + \"port('node:fs')\",",
    "  )();",
    "",
  ].join("\n"));
  const computedConstructorReceipt = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: computedConstructorRoot,
    descriptor: descriptor(),
  });
  assert.equal(computedConstructorReceipt.dependencyClosure.runtimeCodeGenerationProvenAbsent,
    false);
  assert.equal(Object.hasOwn(computedConstructorReceipt.dependencyClosure,
    "codeGenerationPrimitivesRejected"), false);

  const aliasRoot = await fixture(t, "adaptive-evaluator-alias-");
  const realDirectory = path.join(aliasRoot, "internal");
  await mkdir(realDirectory, { recursive: true });
  await put(aliasRoot, "internal/aliased.mjs", "export const aliased = true;\n");
  await symlink(realDirectory, path.join(aliasRoot, "src", "linked"), "junction");
  await put(aliasRoot, "src/entrypoint.mjs", "import './linked/aliased.mjs';\n");
  await assert.rejects(buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: aliasRoot,
    descriptor: descriptor(),
  }), /alias|symlink|canonical/i);
});

test("writer publishes one validated receipt without executing its entrypoint", async (t) => {
  const root = await fixture(t, "adaptive-evaluator-writer-");
  await put(root, "src/entrypoint.mjs", "throw new Error('entrypoint executed');\n");
  const { writeAdaptiveEvaluatorPackageReceipt } = await builder();
  const outputPath = path.join(root, "receipts", "fixture-evaluator.json");
  await mkdir(path.dirname(outputPath), { recursive: true });

  const receipt = await writeAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: root,
    descriptor: descriptor(),
    outputPath,
  });
  const written = JSON.parse(await readFile(outputPath, "utf8"));
  assert.deepEqual(written, receipt);
  assert.deepEqual(validateEvaluatorPackageReceipt(written), written);
});
