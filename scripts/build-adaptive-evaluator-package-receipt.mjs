import { randomUUID } from "node:crypto";
import {
  readFile as nativeReadFile,
  realpath as nativeRealpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  buildAdaptiveEvaluatorSchemas,
  validateAdaptiveEvaluatorPackagePolicy,
  validateEvaluatorPackageReceipt,
} from "../src/adaptive-evaluator-package.mjs";
import {
  canonicalDigest,
  canonicalFile,
  exactKeys,
  nonEmptyString,
} from "../src/adaptive-evidence-contracts.mjs";
import { sha256 } from "../src/io.mjs";
import { discoverLocalModuleClosure } from "../src/static-module-closure.mjs";

const DESCRIPTOR_KEYS = Object.freeze([
  "id",
  "evaluatorId",
  "evaluatorKind",
  "taskClass",
  "artifactMediaType",
  "entrypointPath",
  "policyPath",
  "packageSchemaPath",
  "requestSchemaPath",
  "resultSchemaPath",
  "resources",
]);
const RESOURCE_KEYS = Object.freeze(["role", "path", "logical"]);
const SCHEMA_PATHS = Object.freeze({
  packageSchemaPath: "schemas/adaptive-evaluator-package-v1.schema.json",
  requestSchemaPath: "schemas/adaptive-evaluator-request-v1.schema.json",
  resultSchemaPath: "schemas/adaptive-evaluator-result-v1.schema.json",
});
const SCHEMA_ROLES = Object.freeze({
  "adaptive-evaluator-package-v1.schema.json": "package-schema",
  "adaptive-evaluator-request-v1.schema.json": "request-schema",
  "adaptive-evaluator-result-v1.schema.json": "result-schema",
});
const RESERVED_RESOURCE_ROLES = new Set([
  "entrypoint",
  "dependency",
  "policy",
  ...Object.values(SCHEMA_ROLES),
]);

const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;

function pathIdentity(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function assertRelativePath(value, label) {
  nonEmptyString(value, label);
  if (path.isAbsolute(value) || value.includes("\\") || value.split("/").includes("..")
      || /[?#]/.test(value)) {
    throw new Error(`${label} must be repository-relative`);
  }
}

function assertContained(root, target, label) {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error(`${label} escaped repository root`);
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON`, { cause: error });
  }
}

async function readContained(root, relativePath, io, label) {
  assertRelativePath(relativePath, label);
  const lexicalPath = path.resolve(root, ...relativePath.split("/"));
  assertContained(root, lexicalPath, label);
  let actual;
  try {
    actual = await io.realpath(lexicalPath);
  } catch (error) {
    throw new Error(`${label} is missing or unresolved`, { cause: error });
  }
  assertContained(root, actual, label);
  if (pathIdentity(actual) !== pathIdentity(lexicalPath)) {
    throw new Error(`${label} is a symlink or non-canonical alias`);
  }
  return io.readFile(actual);
}

function validateDescriptor(descriptor) {
  exactKeys(descriptor, DESCRIPTOR_KEYS, "evaluator package descriptor");
  for (const field of ["id", "evaluatorId", "evaluatorKind", "taskClass", "artifactMediaType"]) {
    nonEmptyString(descriptor[field], `evaluator package descriptor.${field}`);
  }
  for (const field of [
    "entrypointPath",
    "policyPath",
    "packageSchemaPath",
    "requestSchemaPath",
    "resultSchemaPath",
  ]) {
    assertRelativePath(descriptor[field], `evaluator package descriptor.${field}`);
  }
  for (const [field, expected] of Object.entries(SCHEMA_PATHS)) {
    if (descriptor[field] !== expected) {
      throw new Error(`evaluator package ${field} does not name the required generated schema`);
    }
  }
  if (!Array.isArray(descriptor.resources)) {
    throw new TypeError("evaluator package resources must be an array");
  }
  const paths = new Set();
  const roles = new Set();
  for (const resource of descriptor.resources) {
    exactKeys(resource, RESOURCE_KEYS, "evaluator package resource");
    nonEmptyString(resource.role, "evaluator package resource.role");
    assertRelativePath(resource.path, "evaluator package resource.path");
    if (typeof resource.logical !== "boolean") {
      throw new TypeError("evaluator package resource.logical must be boolean");
    }
    if (RESERVED_RESOURCE_ROLES.has(resource.role)) {
      throw new Error("evaluator package resource uses a reserved role");
    }
    if (roles.has(resource.role)) throw new Error("evaluator package contains a duplicate resource role");
    if (paths.has(resource.path)) throw new Error("evaluator package contains a duplicate resource path");
    roles.add(resource.role);
    paths.add(resource.path);
  }
  return descriptor;
}

function artifactRow({ role, relativePath, bytes, logical = false }) {
  const row = {
    role,
    path: relativePath,
    sha256: sha256(bytes),
    bytes: bytes.length,
  };
  if (logical) row.logicalDigest = canonicalDigest(parseJson(bytes, `evaluator package ${role}`));
  return row;
}

function regexLiteralMayStart(sanitizedSource) {
  const prefix = sanitizedSource.trimEnd();
  if (prefix === "") return true;
  if (/=>$/u.test(prefix)) return true;
  if (/[([{=,:;!?&|+\-*%~^<>]$/u.test(prefix)) return true;
  return /\b(?:return|throw|case|delete|void|typeof|instanceof|in|of|new|yield|await|else|do)$/u
    .test(prefix);
}

function consumeRegexLiteral(source, start) {
  let index = start + 1;
  let inCharacterClass = false;
  let escaped = false;
  while (index < source.length) {
    const current = source[index];
    if (current === "\n" || current === "\r") {
      throw new Error("unterminated evaluator module regex literal");
    }
    if (escaped) {
      escaped = false;
    } else if (current === "\\") {
      escaped = true;
    } else if (current === "[") {
      inCharacterClass = true;
    } else if (current === "]" && inCharacterClass) {
      inCharacterClass = false;
    } else if (current === "/" && !inCharacterClass) {
      index += 1;
      while (index < source.length && /[a-z]/iu.test(source[index])) index += 1;
      return index;
    }
    index += 1;
  }
  throw new Error("unterminated evaluator module regex literal");
}

function stripModuleComments(source) {
  let result = "";
  let index = 0;
  let quote = null;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    if (quote !== null) {
      result += current;
      if (current === "\\") {
        index += 1;
        if (index < source.length) result += source[index];
      } else if (current === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }
    if (current === "\"" || current === "'" || current === "`") {
      quote = current;
      result += current;
      index += 1;
      continue;
    }
    if (current === "/" && next !== "/" && next !== "*"
        && regexLiteralMayStart(result)) {
      const end = consumeRegexLiteral(source, index);
      result += " ".repeat(end - index);
      index = end;
      continue;
    }
    if (current === "/" && next === "/") {
      result += "  ";
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        result += " ";
        index += 1;
      }
      continue;
    }
    if (current === "/" && next === "*") {
      result += "  ";
      index += 2;
      while (index < source.length
          && !(source[index] === "*" && source[index + 1] === "/")) {
        result += source[index] === "\n" ? "\n" : " ";
        index += 1;
      }
      if (index >= source.length) throw new Error("unterminated evaluator module comment");
      result += "  ";
      index += 2;
      continue;
    }
    result += current;
    index += 1;
  }
  return result;
}

async function applyLexicalRuntimeHardening(root, modules, io) {
  for (const module of modules) {
    const bytes = await readContained(
      root,
      module.path,
      io,
      `evaluator package module ${module.path}`,
    );
    if (bytes.length !== module.bytes || sha256(bytes) !== module.sha256) {
      throw new Error(`evaluator package module bytes drifted while screening: ${module.path}`);
    }
    if (path.posix.extname(module.path) === ".json") continue;
    const source = stripModuleComments(bytes.toString("utf8"));
    if (/\b(?:eval|Function|AsyncFunction|GeneratorFunction|AsyncGeneratorFunction)\b/m.test(source)
        || /\b(?:globalThis|getBuiltinModule|createRequire)\b/m.test(source)
        || /(?:\.|\[\s*["'])constructor\b/m.test(source)) {
      throw new Error("evaluator package contains a recognized runtime code generation pattern");
    }
  }
}

export async function buildAdaptiveEvaluatorPackageReceipt({
  repositoryRoot,
  descriptor,
  io = {},
} = {}) {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new TypeError("evaluator package repository root is required");
  }
  validateDescriptor(descriptor);
  const fs = {
    readFile: io.readFile ?? nativeReadFile,
    realpath: io.realpath ?? nativeRealpath,
  };
  const root = await fs.realpath(path.resolve(repositoryRoot));
  const policyBytes = await readContained(root, descriptor.policyPath, fs, "evaluator package policy");
  const policy = parseJson(policyBytes, "evaluator package policy");
  validateAdaptiveEvaluatorPackagePolicy({
    policy,
    expectedPolicyDigest: canonicalDigest(policy),
  });
  if (!policy.evaluatorKinds.includes(descriptor.evaluatorKind)) {
    throw new Error("evaluator package descriptor kind is not allowed by policy");
  }
  if (!policy.taskClasses.includes(descriptor.taskClass)) {
    throw new Error("evaluator package descriptor task class is not allowed by policy");
  }
  if (!policy.artifactMediaTypes.includes(descriptor.artifactMediaType)) {
    throw new Error("evaluator package descriptor media type is not allowed by policy");
  }
  if (descriptor.resources.length > policy.maximumDeclaredResources) {
    throw new Error("evaluator package exceeds the maximum of 16 declared resources");
  }

  const modules = await discoverLocalModuleClosure({
    repositoryRoot: root,
    roots: [descriptor.entrypointPath],
    io: fs,
  });
  await applyLexicalRuntimeHardening(root, modules, fs);
  const artifacts = modules.map((module) => ({
    role: module.path === descriptor.entrypointPath ? "entrypoint" : "dependency",
    ...module,
  }));
  artifacts.push(artifactRow({
    role: "policy",
    relativePath: descriptor.policyPath,
    bytes: policyBytes,
    logical: true,
  }));

  const schemas = buildAdaptiveEvaluatorSchemas();
  for (const relativePath of Object.values(SCHEMA_PATHS)) {
    const name = path.posix.basename(relativePath);
    const bytes = Buffer.from(canonicalFile(schemas[name]), "utf8");
    artifacts.push(artifactRow({
      role: SCHEMA_ROLES[name],
      relativePath,
      bytes,
      logical: true,
    }));
  }
  for (const resource of descriptor.resources) {
    const bytes = await readContained(
      root,
      resource.path,
      fs,
      `evaluator package resource ${resource.role}`,
    );
    artifacts.push(artifactRow({
      role: resource.role,
      relativePath: resource.path,
      bytes,
      logical: resource.logical,
    }));
  }
  artifacts.sort((left, right) => lexical(left.path, right.path));
  if (new Set(artifacts.map(({ path: value }) => value)).size !== artifacts.length) {
    throw new Error("evaluator package receipt contains a duplicate artifact path");
  }
  const unsigned = {
    schemaVersion: 1,
    id: descriptor.id,
    status: "verified-build",
    protocolId: policy.protocolId,
    evaluatorId: descriptor.evaluatorId,
    evaluatorKind: descriptor.evaluatorKind,
    taskClass: descriptor.taskClass,
    artifactMediaType: descriptor.artifactMediaType,
    authorityExpanded: false,
    dependencyClosure: {
      roots: [descriptor.entrypointPath],
      localModules: modules.map(({ path: value }) => value),
      staticImportsComplete: true,
      runtimeCodeGenerationProvenAbsent: false,
      runtimeClosureComplete: false,
    },
    artifacts,
    proofLimits: [
      "deterministic-package-identity-only",
      "no-model-quality-proof",
      "no-receipt-selected-code-execution",
      "static-import-closure-only",
      "runtime-code-generation-absence-not-proven",
      "runtime-isolation-still-required",
      "no-authority-expansion",
      "no-global-activation",
    ],
  };
  return validateEvaluatorPackageReceipt({
    ...unsigned,
    receiptDigest: canonicalDigest(unsigned),
  });
}

export async function writeAdaptiveEvaluatorPackageReceipt({
  repositoryRoot,
  descriptor,
  outputPath,
} = {}) {
  const root = await nativeRealpath(path.resolve(repositoryRoot));
  const target = path.resolve(outputPath);
  assertContained(root, target, "evaluator package receipt output");
  const receipt = await buildAdaptiveEvaluatorPackageReceipt({ repositoryRoot: root, descriptor });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, canonicalFile(receipt), { encoding: "utf8", flag: "wx" });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
  return receipt;
}
