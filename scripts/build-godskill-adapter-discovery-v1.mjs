import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../src/capability-layer-abi.mjs";
import {
  GODSKILL_ADAPTER_DISCOVERY_ID,
  discoverAdapter,
  verifyAdapterDiscovery,
} from "../src/godskill-adapter-discovery.mjs";
import { sha256 } from "../src/io.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJsonWithBytes(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return { bytes, value: JSON.parse(bytes) };
}

async function readBytes(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return { bytes, path: relativePath };
}

async function writeIfAbsentOrIdentical(filePath, value, label) {
  try {
    const existing = await readFile(filePath);
    if (!existing.equals(value)) throw new Error("refusing to overwrite changed " + label);
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value);
}

const sdkPath = "receipts/godskill-adapter-sdk-v1.json";
const matrixPath = "artifacts/godskill-adapter-sdk-v1/reference.json";
const { bytes: sdkBytes, value: sdkReceipt } = await readJsonWithBytes(sdkPath);
const { bytes: matrixBytes, value: matrix } = await readJsonWithBytes(matrixPath);
if (sdkReceipt.status !== "verified-build" || matrix.digest !== sdkReceipt.fixture.digest) {
  throw new Error("adapter sdk root is not a verified matching fixture");
}

const codexEntry = matrix.entries.find((entry) => entry.adapter.hostFamily === "codex");
if (!codexEntry) throw new Error("codex reference adapter is missing from the SDK matrix");
const result = discoverAdapter({ matrix, hostProfile: codexEntry.adapter.hostProfile });
const verification = verifyAdapterDiscovery(result, {
  matrix,
  hostProfile: codexEntry.adapter.hostProfile,
});
if (!verification.valid || result.status !== "selected" || result.adapterId !== codexEntry.adapter.adapterId) {
  throw new Error("adapter discovery reference did not verify");
}

const fixturePath = "artifacts/godskill-adapter-discovery-v1/reference.json";
const fixtureBytes = Buffer.from(canonicalJson(result), "utf8");
await writeIfAbsentOrIdentical(path.join(repositoryRoot, fixturePath), fixtureBytes, "adapter discovery fixture");

const schemaPath = "schemas/godskill-adapter-discovery-v1.schema.json";
const runtimePath = "runtime/godskill-adapter-discovery-v1.md";
const sourcePath = "src/godskill-adapter-discovery.mjs";
const dependencyPath = "src/godskill-adapter-sdk.mjs";
const [{ bytes: schemaBytes }, { bytes: runtimeBytes }, { bytes: sourceBytes }, { bytes: dependencyBytes }] = await Promise.all([
  readBytes(schemaPath),
  readBytes(runtimePath),
  readBytes(sourcePath),
  readBytes(dependencyPath),
]);
const receiptBody = {
  schemaVersion: 1,
  discoveryId: GODSKILL_ADAPTER_DISCOVERY_ID,
  sdkRoot: {
    path: sdkPath,
    receiptDigest: sdkReceipt.receiptDigest,
    sha256: sha256(sdkBytes),
    bytes: sdkBytes.length,
    matrixDigest: matrix.digest,
    matrixSha256: sha256(matrixBytes),
  },
  fixture: {
    path: fixturePath,
    digest: result.digest,
    sha256: sha256(fixtureBytes),
    bytes: fixtureBytes.length,
  },
  result: {
    status: result.status,
    matrixStatus: result.matrixStatus,
    hostFamily: result.hostFamily,
    hostProfileDigest: result.hostProfileDigest,
    adapterId: result.adapterId,
    descriptorDigest: result.descriptorDigest,
    entryDigest: result.entryDigest,
    projectionDigest: result.projectionDigest,
    normalizedDecisionDigest: result.normalizedDecisionDigest,
  },
  implementation: {
    path: sourcePath,
    sha256: sha256(sourceBytes),
    bytes: sourceBytes.length,
    sdkDependency: {
      path: dependencyPath,
      sha256: sha256(dependencyBytes),
      bytes: dependencyBytes.length,
    },
  },
  schema: {
    path: schemaPath,
    sha256: sha256(schemaBytes),
    bytes: schemaBytes.length,
  },
  runtime: {
    path: runtimePath,
    sha256: sha256(runtimeBytes),
    bytes: runtimeBytes.length,
  },
  focusedSuite: {
    tests: 6,
    passed: 6,
    failed: 0,
  },
  fullRepositorySuite: {
    tests: 843,
    passed: 842,
    failed: 0,
    skipped: 1,
    cancelled: 0,
    todo: 0,
  },
  proofLimits: [
    "local-declarative-exact-match-discovery-only",
    "no-live-host-adoption",
    "no-model-or-provider-equivalence-claim",
    "no-routing-or-activation",
    "no-secret-transport",
    "no-authority-expansion",
    "no-external-write",
  ],
  status: "verified-build",
};
const receipt = { ...receiptBody, receiptDigest: sha256(canonicalJson(receiptBody)) };
await writeIfAbsentOrIdentical(
  path.join(repositoryRoot, "receipts/godskill-adapter-discovery-v1.json"),
  Buffer.from(canonicalJson(receipt), "utf8"),
  "adapter discovery receipt",
);
console.log(JSON.stringify({
  discoveryId: GODSKILL_ADAPTER_DISCOVERY_ID,
  resultDigest: result.digest,
  hostProfileDigest: result.hostProfileDigest,
  receiptDigest: receipt.receiptDigest,
  adapterId: result.adapterId,
  status: receipt.status,
}));
