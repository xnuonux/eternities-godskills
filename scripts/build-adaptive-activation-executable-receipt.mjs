import { readFile as nativeReadFile, realpath as nativeRealpath } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "../src/io.mjs";
import { discoverLocalModuleClosure } from "../src/static-module-closure.mjs";

const PROTOCOL_ID = "eternities-godskills-activation-v1";
const COMPILER_PATH = "src/adaptive-activation.mjs";
const DECLARED_ARTIFACTS = Object.freeze([
  ["request-schema", "schemas/adaptive-activation-request.v1.schema.json", true],
  ["result-schema", "schemas/adaptive-activation-result.v1.schema.json", true],
  ["policy", "policies/adaptive-activation.v1.json", true],
  ["evidence", "artifacts/adaptive-activation/evidence.v1.json", true],
  ["contract", "artifacts/adaptive-activation/neutral-contract.json", true],
]);
const PARENT_PATH = "receipts/adaptive-activation-v1.json";

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]));
  }
  return value;
}

const digest = (value) => sha256(JSON.stringify(stable(value)));

function assertRelativePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)
      || value.includes("\\") || value.split("/").includes("..") || /[?#]/.test(value)) {
    throw new Error(`${label} must be repository-relative`);
  }
}

function assertContained(root, target) {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error("activation receipt artifact escaped repository root");
}

async function readContained(root, relativePath, io, label) {
  assertRelativePath(relativePath, label);
  const lexicalPath = path.resolve(root, ...relativePath.split("/"));
  assertContained(root, lexicalPath);
  let actual;
  try {
    actual = await io.realpath(lexicalPath);
  } catch (error) {
    throw new Error(`${label} is missing`, { cause: error });
  }
  assertContained(root, actual);
  const bytes = await io.readFile(actual);
  return bytes;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON`, { cause: error });
  }
}

function verifyParent(bytes) {
  const parent = parseJson(bytes, "adaptive activation parent receipt");
  if (parent?.schemaVersion !== 1 || parent?.id !== "adaptive-activation-v1" || parent?.status !== "experimental") {
    throw new Error("adaptive activation parent receipt identity mismatch");
  }
  if (!/^[a-f0-9]{64}$/.test(parent.receiptDigest ?? "")) {
    throw new Error("adaptive activation parent receipt digest is invalid");
  }
  const unsigned = structuredClone(parent);
  delete unsigned.receiptDigest;
  if (digest(unsigned) !== parent.receiptDigest) throw new Error("adaptive activation parent receipt digest mismatch");
  return parent;
}

export async function buildAdaptiveActivationExecutableReceipt({
  repositoryRoot,
  entrypointPath = "scripts/activation.mjs",
  io = {},
} = {}) {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new TypeError("activation executable repository root is required");
  }
  assertRelativePath(entrypointPath, "activation executable entrypoint");
  const fs = {
    readFile: io.readFile ?? nativeReadFile,
    realpath: io.realpath ?? nativeRealpath,
  };
  const root = await fs.realpath(path.resolve(repositoryRoot));
  const roots = [entrypointPath, COMPILER_PATH].sort(lexical);
  const modules = await discoverLocalModuleClosure({ repositoryRoot: root, roots, io: fs });
  const artifacts = modules.map((module) => ({
    role: module.path === entrypointPath ? "entrypoint" : module.path === COMPILER_PATH ? "compiler" : "dependency",
    ...module,
  }));
  for (const [role, relativePath, logical] of DECLARED_ARTIFACTS) {
    const bytes = await readContained(root, relativePath, fs, `activation executable ${role}`);
    const row = { role, path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
    if (logical) row.logicalDigest = digest(parseJson(bytes, `activation executable ${role}`));
    artifacts.push(row);
  }
  artifacts.sort((left, right) => lexical(left.path, right.path));
  if (new Set(artifacts.map(({ path: value }) => value)).size !== artifacts.length) {
    throw new Error("activation executable receipt contains duplicate artifact paths");
  }
  const parentBytes = await readContained(root, PARENT_PATH, fs, "adaptive activation parent receipt");
  const parent = verifyParent(parentBytes);
  const unsigned = {
    schemaVersion: 1,
    id: "adaptive-activation-executable-v1",
    status: "verified-build",
    protocolId: PROTOCOL_ID,
    parentReceipt: {
      path: PARENT_PATH,
      sha256: sha256(parentBytes),
      bytes: parentBytes.length,
      receiptDigest: parent.receiptDigest,
    },
    dependencyClosure: {
      roots,
      localModules: modules.map(({ path: value }) => value),
      complete: true,
    },
    artifacts,
    proofLimits: [
      "deterministic-executable-identity-only",
      "no-model-quality-proof",
      "no-executed-review-proof",
      "no-global-activation",
      "no-arbitrary-host-equivalence",
      "no-hostile-same-user-filesystem-isolation",
    ],
  };
  return Object.freeze({ ...unsigned, receiptDigest: digest(unsigned) });
}
