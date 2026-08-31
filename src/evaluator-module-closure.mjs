import { readFile as nativeReadFile, realpath as nativeRealpath } from "node:fs/promises";
import path from "node:path";

import { parse } from "acorn";

import { sha256 } from "./io.mjs";

const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const normalizedPath = (value) => value.replaceAll("\\", "/");

function pathIdentity(value) {
  const normalized = path.resolve(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function assertRelativeModulePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)
      || value.includes("\\") || value.split("/").includes("..") || /[?#]/.test(value)) {
    throw new Error(`${label} must be a repository-relative module path`);
  }
}

function assertContained(root, target) {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error("module dependency escaped repository root");
}

function staticSource(node) {
  if (!["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"]
    .includes(node.type)) return null;
  return typeof node.source?.value === "string" ? node.source.value : null;
}

function propertyName(member) {
  if (member.type !== "MemberExpression") return null;
  if (!member.computed && member.property.type === "Identifier") return member.property.name;
  if (member.computed && member.property.type === "Literal"
      && typeof member.property.value === "string") return member.property.value;
  return null;
}

function directDynamicLoader(node) {
  if (node.type !== "CallExpression") return false;
  if (node.callee.type === "Identifier") {
    return ["require", "createRequire", "getBuiltinModule"].includes(node.callee.name);
  }
  return ["require", "createRequire", "getBuiltinModule"].includes(propertyName(node.callee));
}

function moduleSpecifiers(source, relativePath) {
  let program;
  try {
    program = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
    });
  } catch (error) {
    throw new Error(`evaluator module syntax is unsupported: ${relativePath}`, { cause: error });
  }

  const specifiers = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value === null || typeof value !== "object") return;
    if (value.type === "ImportExpression") {
      throw new Error("dynamic local module loading is unsupported");
    }
    if (directDynamicLoader(value)) {
      throw new Error("dynamic CommonJS or host module loading is unsupported");
    }
    const specifier = staticSource(value);
    if (specifier !== null) specifiers.push(specifier);
    for (const [key, child] of Object.entries(value)) {
      if (["start", "end", "loc", "range", "source"].includes(key)) continue;
      visit(child);
    }
  };
  visit(program);
  return [...new Set(specifiers)];
}

async function containedFile(root, relativePath, io) {
  assertRelativeModulePath(relativePath, "module path");
  const lexicalPath = path.resolve(root, ...relativePath.split("/"));
  assertContained(root, lexicalPath);
  let actual;
  try {
    actual = await io.realpath(lexicalPath);
  } catch (error) {
    throw new Error(`module dependency is unresolved or missing: ${relativePath}`, { cause: error });
  }
  assertContained(root, actual);
  return { bytes: await io.readFile(actual), actual };
}

function resolveSpecifier(root, importer, specifier) {
  if (specifier.includes("%")) {
    throw new Error(`percent-encoded module specifier is unsupported: ${specifier}`);
  }
  if (specifier.startsWith("node:")) return null;
  if (!specifier.startsWith(".")) {
    throw new Error(`bare or external module dependency is unsupported: ${specifier}`);
  }
  if (/[?#]/.test(specifier)) {
    throw new Error(`module dependency query or fragment is unsupported: ${specifier}`);
  }
  const target = path.resolve(root, path.dirname(importer), specifier);
  assertContained(root, target);
  const relative = normalizedPath(path.relative(root, target));
  assertRelativeModulePath(relative, "module dependency");
  if (![".mjs", ".js", ".json"].includes(path.extname(relative))) {
    throw new Error(`module dependency requires an explicit supported extension: ${specifier}`);
  }
  return relative;
}

export async function discoverEvaluatorModuleClosure({ repositoryRoot, roots, io = {} } = {}) {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new TypeError("evaluator module closure repository root is required");
  }
  if (!Array.isArray(roots) || roots.length === 0) {
    throw new TypeError("evaluator module closure roots are required");
  }
  roots.forEach((value) => assertRelativeModulePath(value, "module closure root"));
  if (new Set(roots).size !== roots.length) {
    throw new Error("evaluator module closure contains a duplicate root");
  }
  const fs = {
    readFile: io.readFile ?? nativeReadFile,
    realpath: io.realpath ?? nativeRealpath,
  };
  const root = await fs.realpath(path.resolve(repositoryRoot));
  const queue = [...roots];
  const found = new Map();
  while (queue.length > 0) {
    const relativePath = queue.shift();
    if (found.has(relativePath)) continue;
    const { bytes, actual } = await containedFile(root, relativePath, fs);
    if (pathIdentity(actual) !== pathIdentity(path.resolve(root, ...relativePath.split("/")))) {
      throw new Error(`module path is a symlink or non-canonical alias: ${relativePath}`);
    }
    found.set(relativePath, Object.freeze({
      path: relativePath,
      sha256: sha256(bytes),
      bytes: bytes.length,
    }));
    if (path.extname(relativePath) === ".json") continue;
    const dependencies = moduleSpecifiers(bytes.toString("utf8"), relativePath)
      .map((specifier) => resolveSpecifier(root, relativePath, specifier))
      .filter((value) => value !== null)
      .sort(lexical);
    queue.push(...dependencies);
  }
  return Object.freeze([...found.values()].sort((left, right) => lexical(left.path, right.path)));
}
