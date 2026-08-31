import { readFile as nativeReadFile, realpath as nativeRealpath } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "./io.mjs";

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizedPath(value) {
  return value.replaceAll("\\", "/");
}

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

function stripComments(source) {
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
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        result += source[index] === "\n" ? "\n" : " ";
        index += 1;
      }
      if (index >= source.length) throw new Error("unterminated module comment");
      result += "  ";
      index += 2;
      continue;
    }
    result += current;
    index += 1;
  }
  return result;
}

function moduleSpecifiers(source) {
  const text = stripComments(source);
  if (/\b(?:eval|Function|AsyncFunction|GeneratorFunction|AsyncGeneratorFunction)\b/m.test(text)
      || /\b(?:globalThis|getBuiltinModule|createRequire)\b/m.test(text)
      || /(?:\.|\[\s*["'])constructor\b/m.test(text)) {
    throw new Error("runtime code generation is unsupported by the static module closure");
  }
  if (/\bimport\s*\(/m.test(text)) {
    throw new Error("dynamic local module loading is unsupported");
  }
  if (/\b(?:require|module\.require)\s*\(/m.test(text)) {
    throw new Error("dynamic CommonJS module loading is unsupported");
  }
  const values = [];
  const sideEffect = /(?:^|[;\n])\s*import\s*(["'])([^"']+)\1/gm;
  const from = /(?:^|[;\n])\s*(?:import|export)\s+[\s\S]*?\bfrom\s*(["'])([^"']+)\1/gm;
  for (const match of text.matchAll(sideEffect)) values.push(match[2]);
  for (const match of text.matchAll(from)) values.push(match[2]);
  return [...new Set(values)];
}

async function containedFile(root, relativePath, io) {
  assertRelativeModulePath(relativePath, "module path");
  const lexical = path.resolve(root, ...relativePath.split("/"));
  assertContained(root, lexical);
  let actual;
  try {
    actual = await io.realpath(lexical);
  } catch (error) {
    throw new Error(`module dependency is unresolved or missing: ${relativePath}`, { cause: error });
  }
  assertContained(root, actual);
  const bytes = await io.readFile(actual);
  return { bytes, actual };
}

function resolveSpecifier(root, importer, specifier) {
  if (specifier.startsWith("node:")) return null;
  if (!specifier.startsWith(".")) throw new Error(`bare or external module dependency is unsupported: ${specifier}`);
  if (/[?#]/.test(specifier)) throw new Error(`module dependency query or fragment is unsupported: ${specifier}`);
  const target = path.resolve(root, path.dirname(importer), specifier);
  assertContained(root, target);
  const relative = normalizedPath(path.relative(root, target));
  assertRelativeModulePath(relative, "module dependency");
  if (![".mjs", ".js", ".json"].includes(path.extname(relative))) {
    throw new Error(`module dependency requires an explicit supported extension: ${specifier}`);
  }
  return relative;
}

export async function discoverLocalModuleClosure({ repositoryRoot, roots, io = {} } = {}) {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new TypeError("module closure repository root is required");
  }
  if (!Array.isArray(roots) || roots.length === 0) throw new TypeError("module closure roots are required");
  roots.forEach((value) => assertRelativeModulePath(value, "module closure root"));
  if (new Set(roots).size !== roots.length) throw new Error("module closure contains a duplicate root");
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
    const dependencies = moduleSpecifiers(bytes.toString("utf8"))
      .map((specifier) => resolveSpecifier(root, relativePath, specifier))
      .filter((value) => value !== null)
      .sort(lexical);
    queue.push(...dependencies);
  }
  return Object.freeze([...found.values()].sort((left, right) => lexical(left.path, right.path)));
}
