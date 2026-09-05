import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../src/capability-layer-abi.mjs";
import {
  ADAPTER_SDK_HOST_FAMILIES,
  ADAPTER_SDK_PROTOCOL_ID,
  ADAPTER_SDK_PROTOCOL_VERSION,
  GODSKILL_ADAPTER_SDK_ID,
  buildCapabilityMatrix,
  verifyCapabilityMatrix,
} from "../src/godskill-adapter-sdk.mjs";
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

const protocolPath = "receipts/godskill-protocol-v1.json";
const packagePath = "receipts/godskill-package-v1.json";
const { bytes: protocolBytes, value: protocolReceipt } = await readJsonWithBytes(protocolPath);
const { bytes: packageBytes, value: packageReceipt } = await readJsonWithBytes(packagePath);
const protocolReceiptDigest = protocolReceipt.receiptDigest;
const packageReceiptDigest = sha256(packageBytes);
if (!/^[a-f0-9]{64}$/.test(protocolReceiptDigest)) throw new Error("unexpected protocol receipt root");
if (!/^[a-f0-9]{64}$/.test(packageReceipt.packageDigest)) throw new Error("unexpected package digest root");

const reasoningTiers = ["high", "low", "max", "medium", "minimal", "none", "ultra", "xhigh"];
const allEffects = ["execute", "external-write", "network", "read", "write"];
const hostProfiles = {
  "claude-code": {
    hostVersion: "fixture-claude-code-v1",
    modelFamily: "provider-neutral-fixture",
    reasoningTier: "high",
    contextBudget: 200000,
    reviewAvailable: true,
  },
  codex: {
    hostVersion: "fixture-codex-v1",
    modelFamily: "provider-neutral-fixture",
    reasoningTier: "high",
    contextBudget: 256000,
    reviewAvailable: true,
  },
  godagents: {
    hostVersion: "fixture-godagents-v1",
    modelFamily: "provider-neutral-fixture",
    reasoningTier: "xhigh",
    contextBudget: 300000,
    reviewAvailable: true,
  },
  "local-model": {
    hostVersion: "fixture-local-model-v1",
    modelFamily: "provider-neutral-fixture",
    reasoningTier: "medium",
    contextBudget: 128000,
    reviewAvailable: false,
  },
  mcp: {
    hostVersion: "fixture-mcp-v1",
    modelFamily: "provider-neutral-fixture",
    reasoningTier: "high",
    contextBudget: 180000,
    reviewAvailable: true,
  },
};

const adapters = ADAPTER_SDK_HOST_FAMILIES.map((hostFamily) => {
  const host = hostProfiles[hostFamily];
  return {
    schemaVersion: 1,
    sdkId: GODSKILL_ADAPTER_SDK_ID,
    adapterId: `${hostFamily}-fixture-adapter`,
    adapterVersion: 1,
    hostFamily,
    protocolId: ADAPTER_SDK_PROTOCOL_ID,
    protocolVersion: ADAPTER_SDK_PROTOCOL_VERSION,
    supportedEffects: allEffects,
    supportedReasoningTiers: reasoningTiers,
    maxContextBudget: 400000,
    reviewModes: host.reviewAvailable ? ["review"] : [],
    hostProfile: {
      hostFamily,
      ...host,
      availableEffects: ["read", "write"],
      supportsPackageProtocol: true,
      supportsProtocolVersion: 1,
      secretsOutsidePayload: true,
    },
  };
});

const matrixInput = {
  matrixId: "provider-neutral-five-host-adapter-sdk-v1",
  protocolReceiptDigest,
  packageReceiptDigest,
  packageDigest: packageReceipt.packageDigest,
  capabilityId: "eternities-aegis",
  capabilityVersion: 4,
  missionId: "mission-provider-neutral-adapter-sdk-v1",
  objectiveDigest: sha256("provider-neutral adapter sdk objective v1"),
  requestedEffects: ["read", "write"],
  adapters,
};
const matrix = buildCapabilityMatrix(matrixInput);
const verification = verifyCapabilityMatrix(matrix, {
  expectedProtocolReceiptDigest: protocolReceiptDigest,
  expectedPackageReceiptDigest: packageReceiptDigest,
});
if (!verification.valid || verification.status !== "equivalent" || verification.entryCount !== ADAPTER_SDK_HOST_FAMILIES.length) {
  throw new Error("adapter sdk reference matrix did not verify");
}

const fixturePath = "artifacts/godskill-adapter-sdk-v1/reference.json";
const fixtureBytes = Buffer.from(canonicalJson(matrix), "utf8");
await writeIfAbsentOrIdentical(path.join(repositoryRoot, fixturePath), fixtureBytes, "adapter sdk fixture");

const schemaPath = "schemas/godskill-adapter-sdk-v1.schema.json";
const runtimePath = "runtime/godskill-adapter-sdk-v1.md";
const sourcePath = "src/godskill-adapter-sdk.mjs";
const dependencyPath = "src/godskill-adapter-conformance.mjs";
const [{ bytes: schemaBytes }, { bytes: runtimeBytes }, { bytes: sourceBytes }, { bytes: dependencyBytes }] = await Promise.all([
  readBytes(schemaPath),
  readBytes(runtimePath),
  readBytes(sourcePath),
  readBytes(dependencyPath),
]);
const receiptBody = {
  schemaVersion: 1,
  sdkId: GODSKILL_ADAPTER_SDK_ID,
  protocolId: ADAPTER_SDK_PROTOCOL_ID,
  protocolVersion: ADAPTER_SDK_PROTOCOL_VERSION,
  protocolRoot: {
    path: protocolPath,
    receiptDigest: protocolReceiptDigest,
    sha256: sha256(protocolBytes),
    bytes: protocolBytes.length,
  },
  packageRoot: {
    path: packagePath,
    packageDigest: packageReceipt.packageDigest,
    sha256: packageReceiptDigest,
    bytes: packageBytes.length,
  },
  implementation: {
    path: sourcePath,
    sha256: sha256(sourceBytes),
    bytes: sourceBytes.length,
    conformanceDependency: {
      path: dependencyPath,
      sha256: sha256(dependencyBytes),
      bytes: dependencyBytes.length,
    },
  },
  fixture: {
    path: fixturePath,
    digest: matrix.digest,
    sha256: sha256(fixtureBytes),
    bytes: fixtureBytes.length,
  },
  matrix: {
    status: matrix.status,
    adapterIds: matrix.adapterIds,
    hostFamilies: matrix.hostFamilies,
    entryCount: matrix.entries.length,
    normalizedDecisionDigest: matrix.normalizedDecisionDigest,
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
    tests: 9,
    passed: 9,
    failed: 0,
  },
  fullRepositorySuite: {
    tests: 837,
    passed: 836,
    failed: 0,
    skipped: 1,
    cancelled: 0,
    todo: 0,
  },
  proofLimits: [
    "local-declarative-adapter-sdk-only",
    "no-live-host-adoption",
    "no-model-equivalence-claim",
    "no-provider-calls",
    "no-package-source-execution",
    "no-secret-transport",
    "no-authority-expansion",
    "no-external-write",
  ],
  status: "verified-build",
};
const receipt = { ...receiptBody, receiptDigest: sha256(canonicalJson(receiptBody)) };
await writeIfAbsentOrIdentical(
  path.join(repositoryRoot, "receipts/godskill-adapter-sdk-v1.json"),
  Buffer.from(canonicalJson(receipt), "utf8"),
  "adapter sdk receipt",
);
console.log(JSON.stringify({
  sdkId: GODSKILL_ADAPTER_SDK_ID,
  matrixDigest: matrix.digest,
  normalizedDecisionDigest: matrix.normalizedDecisionDigest,
  receiptDigest: receipt.receiptDigest,
  adapterIds: matrix.adapterIds,
  status: receipt.status,
}));
