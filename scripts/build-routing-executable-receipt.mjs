import { randomUUID } from "node:crypto";
import {
  readFile as nativeReadFile,
  realpath as nativeRealpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256 } from "../src/io.mjs";
import { discoverLocalModuleClosure } from "../src/static-module-closure.mjs";

const PROTOCOL_ID = "eternities-godskills-routing-executable-v1";
const ENTRYPOINT_PATH = "scripts/routing.mjs";
const DIGEST = /^[a-f0-9]{64}$/;

const MODES = Object.freeze([
  Object.freeze({ mode: "default", entrypoint: "scripts/intent.mjs" }),
  Object.freeze({ mode: "specialist", entrypoint: "scripts/intent-preference.mjs" }),
]);

const ROUTING_ARTIFACTS = Object.freeze([
  Object.freeze({
    role: "cards",
    path: "artifacts/routing/cards.jsonl",
    sha256: "4f50424440d64c14b98f85e9b50603c05d14c2ede9fa37c2c8d48c8cd0b09733",
    format: "jsonl",
  }),
  Object.freeze({
    role: "family-map",
    path: "artifacts/routing/family-map.json",
    sha256: "1245d8cf4d28885c55b7602e545e892f7155b5eca8c6b9969e2dff71d913c2e0",
    format: "json",
  }),
  Object.freeze({
    role: "manifest",
    path: "artifacts/routing/manifest.json",
    sha256: "726371ba42663d489e3fd12bd88972cff51ef57d9fa49ee6647fad7a2acc2fc2",
    format: "json",
  }),
]);

const PARENTS = Object.freeze([
  Object.freeze({
    role: "godskills-system",
    path: "receipts/godskills-system-certification-v3.json",
    sha256: "228ba0a63d252f0c37178ff3de8c1278d0ea878e9abeb173e7faea699f28fb57",
    identityField: "id",
    identity: "eternities-godskills-system-v3",
    status: "certified",
  }),
  Object.freeze({
    role: "intent-compiler",
    path: "receipts/intent-compiler-v3.json",
    sha256: "1ca40ec9138c1d0583068ee4dc3db58f0b77b07f631a2b38d9c47eb28ccce49a",
    identityField: "id",
    identity: "intent-compiler-v3",
    status: "certified",
  }),
  Object.freeze({
    role: "portable-capabilities",
    path: "receipts/portable-capability-manifest-v1.json",
    sha256: "f78f6aded5198e8db1591af49fe97285307427d93396b34c78dd6e5f2466f33d",
    identityField: "receiptId",
    identity: "portable-capability-manifest-v1",
    status: "certified-local-artifacts",
    digestAlgorithm: "json-insertion-order-v1",
  }),
  Object.freeze({
    role: "router",
    path: "receipts/agent-native-router-v8.json",
    sha256: "b32500d810ba66539334cbe3ae5ef31223dbf712197a061779fc21f75048ebf3",
    identityField: "id",
    identity: "agent-native-router-v8",
    status: "certified",
  }),
  Object.freeze({
    role: "specialist-preference",
    path: "receipts/specialist-preference-routing-v1.json",
    sha256: "3b5164b41aa498ad637def561ff38df76d22a8f95b694a8c37f29ffa363718e7",
    identityField: "id",
    identity: "specialist-preference-routing-v1",
    status: "verified-structural-protocol",
  }),
]);

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

const canonical = (value) => JSON.stringify(stable(value));
const logicalDigest = (value) => sha256(canonical(value));

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON`, { cause: error });
  }
}

function parseJsonl(bytes, label) {
  const text = bytes.toString("utf8").trim();
  if (text === "") return [];
  return text.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${label} line ${index + 1} is invalid JSON`, { cause: error });
    }
  });
}

function assertRelativePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)
      || value.includes("\\") || value.split("/").includes("..") || /[?#]/.test(value)) {
    throw new Error(`${label} must be repository-relative`);
  }
}

function assertContained(root, target, label) {
  const relation = path.relative(root, target);
  if (relation === "" || (!relation.startsWith("..") && !path.isAbsolute(relation))) return;
  throw new Error(`${label} escaped the repository root`);
}

function pathIdentity(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

async function readContained(root, relativePath, io, label) {
  assertRelativePath(relativePath, label);
  const lexicalPath = path.resolve(root, ...relativePath.split("/"));
  assertContained(root, lexicalPath, label);
  let actual;
  try {
    actual = await io.realpath(lexicalPath);
  } catch (error) {
    throw new Error(`${label} is missing`, { cause: error });
  }
  assertContained(root, actual, label);
  if (pathIdentity(actual) !== pathIdentity(lexicalPath)) {
    throw new Error(`${label} is a symlink or non-canonical alias`);
  }
  return io.readFile(actual);
}

function verifyInternalReceiptDigest(value, label, algorithm = "canonical-json-v1") {
  if (value.receiptDigest === undefined) return null;
  if (typeof value.receiptDigest !== "string" || !DIGEST.test(value.receiptDigest)) {
    throw new Error(`${label} receipt digest is invalid`);
  }
  const unsigned = structuredClone(value);
  delete unsigned.receiptDigest;
  const expected = algorithm === "canonical-json-v1"
    ? logicalDigest(unsigned)
    : algorithm === "json-insertion-order-v1"
      ? sha256(JSON.stringify(unsigned))
      : null;
  if (expected === null) throw new Error(`${label} receipt digest algorithm is unsupported`);
  if (expected !== value.receiptDigest) {
    throw new Error(`${label} receipt digest mismatch`);
  }
  return value.receiptDigest;
}

async function bindParent(root, definition, io) {
  const bytes = await readContained(root, definition.path, io, `routing parent ${definition.role}`);
  if (sha256(bytes) !== definition.sha256) {
    throw new Error(`routing parent ${definition.role} bytes changed`);
  }
  const value = parseJson(bytes, `routing parent ${definition.role}`);
  if (value?.schemaVersion !== 1 || value?.[definition.identityField] !== definition.identity
      || value?.status !== definition.status) {
    throw new Error(`routing parent ${definition.role} identity mismatch`);
  }
  const receiptDigest = verifyInternalReceiptDigest(
    value,
    `routing parent ${definition.role}`,
    definition.digestAlgorithm,
  );
  return Object.freeze({
    role: definition.role,
    path: definition.path,
    sha256: definition.sha256,
    bytes: bytes.length,
    logicalDigest: logicalDigest(value),
    identity: definition.identity,
    status: definition.status,
    ...(receiptDigest === null ? {} : {
      receiptDigest,
      receiptDigestAlgorithm: definition.digestAlgorithm ?? "canonical-json-v1",
    }),
  });
}

async function bindRoutingArtifact(root, definition, io) {
  const bytes = await readContained(root, definition.path, io, `routing artifact ${definition.role}`);
  if (sha256(bytes) !== definition.sha256) {
    throw new Error(`routing artifact ${definition.role} bytes changed`);
  }
  const parsed = definition.format === "json"
    ? parseJson(bytes, `routing artifact ${definition.role}`)
    : parseJsonl(bytes, `routing artifact ${definition.role}`);
  return Object.freeze({
    role: definition.role,
    path: definition.path,
    sha256: definition.sha256,
    bytes: bytes.length,
    logicalDigest: logicalDigest(parsed),
  });
}

export async function buildRoutingExecutableReceipt({ repositoryRoot, io = {} } = {}) {
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new TypeError("routing executable repository root is required");
  }
  const fs = {
    readFile: io.readFile ?? nativeReadFile,
    realpath: io.realpath ?? nativeRealpath,
  };
  const root = await fs.realpath(path.resolve(repositoryRoot));
  const modules = await discoverLocalModuleClosure({
    repositoryRoot: root,
    roots: [ENTRYPOINT_PATH],
    io: fs,
  });
  const [routingArtifacts, parents] = await Promise.all([
    Promise.all(ROUTING_ARTIFACTS.map((definition) => bindRoutingArtifact(root, definition, fs))),
    Promise.all(PARENTS.map((definition) => bindParent(root, definition, fs))),
  ]);
  const unsigned = {
    schemaVersion: 1,
    id: "routing-executable-v1",
    status: "verified-build",
    protocolId: PROTOCOL_ID,
    modes: MODES.map((value) => ({ ...value })),
    dependencyClosure: {
      roots: [ENTRYPOINT_PATH],
      localModules: modules.map(({ path: value }) => value),
      complete: true,
    },
    artifacts: modules.map((module) => ({
      role: module.path === ENTRYPOINT_PATH ? "entrypoint" : "dependency",
      ...module,
    })),
    routingArtifacts,
    parents,
    proofLimits: [
      "deterministic-executable-identity-only",
      "no-host-environment-timeout-or-durable-transport-proof",
      "no-live-model-or-provider-proof",
      "no-unseen-mission-routing-quality-proof",
      "no-global-activation",
      "no-hostile-same-user-filesystem-isolation",
    ],
  };
  return Object.freeze({ ...unsigned, receiptDigest: logicalDigest(unsigned) });
}

export async function verifyRoutingExecutableReceipt({ repositoryRoot, candidate, io = {} } = {}) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new TypeError("routing executable receipt candidate is required");
  }
  const expected = await buildRoutingExecutableReceipt({ repositoryRoot, io });
  if (canonical(candidate) !== canonical(expected)) {
    throw new Error("routing executable receipt does not match the current verified build");
  }
  return expected;
}

export async function writeRoutingExecutableReceipt({
  repositoryRoot,
  outputPath = path.join(repositoryRoot, "receipts", "routing-executable-v1.json"),
} = {}) {
  const receipt = await buildRoutingExecutableReceipt({ repositoryRoot });
  const target = path.resolve(outputPath);
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  writeRoutingExecutableReceipt({ repositoryRoot })
    .then(({ receiptDigest }) => process.stdout.write(`${receiptDigest}\n`))
    .catch((error) => {
      process.stderr.write(`routing executable receipt failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
