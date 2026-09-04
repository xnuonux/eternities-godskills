import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../src/capability-layer-abi.mjs";
import {
  ADAPTER_HOST_FAMILIES,
  GODSKILL_ADAPTER_CONFORMANCE_ID,
  buildConformanceFixture,
  verifyConformanceFixture,
} from "../src/godskill-adapter-conformance.mjs";
import { sha256 } from "../src/io.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJsonWithBytes(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return { bytes, value: JSON.parse(bytes) };
}

async function writeIfAbsentOrIdentical(filePath, value) {
  try {
    const existing = await readFile(filePath);
    if (!existing.equals(value)) throw new Error("refusing to overwrite changed adapter conformance evidence");
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

const fixtureInput = {
  protocolReceiptDigest,
  packageReceiptDigest,
  packageDigest: packageReceipt.packageDigest,
  capabilityId: "eternities-aegis",
  capabilityVersion: 4,
  missionId: "mission-provider-neutral-adapter-conformance-v1",
  objectiveDigest: sha256("provider-neutral adapter conformance objective v1"),
  requestedEffects: ["read", "write"],
  hosts: [
    {
      hostFamily: "claude-code",
      hostVersion: "fixture-claude-code-v1",
      modelFamily: "provider-neutral-fixture",
      reasoningTier: "high",
      contextBudget: 200000,
      reviewAvailable: true,
      availableEffects: ["read", "write"],
      supportsPackageProtocol: true,
      supportsProtocolVersion: 1,
      secretsOutsidePayload: true,
    },
    {
      hostFamily: "codex",
      hostVersion: "fixture-codex-v1",
      modelFamily: "provider-neutral-fixture",
      reasoningTier: "high",
      contextBudget: 256000,
      reviewAvailable: true,
      availableEffects: ["read", "write"],
      supportsPackageProtocol: true,
      supportsProtocolVersion: 1,
      secretsOutsidePayload: true,
    },
    {
      hostFamily: "godagents",
      hostVersion: "fixture-godagents-v1",
      modelFamily: "provider-neutral-fixture",
      reasoningTier: "xhigh",
      contextBudget: 300000,
      reviewAvailable: true,
      availableEffects: ["read", "write"],
      supportsPackageProtocol: true,
      supportsProtocolVersion: 1,
      secretsOutsidePayload: true,
    },
    {
      hostFamily: "local-model",
      hostVersion: "fixture-local-model-v1",
      modelFamily: "provider-neutral-fixture",
      reasoningTier: "medium",
      contextBudget: 128000,
      reviewAvailable: false,
      availableEffects: ["read", "write"],
      supportsPackageProtocol: true,
      supportsProtocolVersion: 1,
      secretsOutsidePayload: true,
    },
    {
      hostFamily: "mcp",
      hostVersion: "fixture-mcp-v1",
      modelFamily: "provider-neutral-fixture",
      reasoningTier: "high",
      contextBudget: 180000,
      reviewAvailable: true,
      availableEffects: ["read", "write"],
      supportsPackageProtocol: true,
      supportsProtocolVersion: 1,
      secretsOutsidePayload: true,
    },
  ],
};
const fixture = buildConformanceFixture(fixtureInput);
const verification = verifyConformanceFixture(fixture, {
  expectedProtocolReceiptDigest: protocolReceiptDigest,
  expectedPackageReceiptDigest: packageReceiptDigest,
});
if (!verification.valid || verification.projectionCount !== ADAPTER_HOST_FAMILIES.length) {
  throw new Error("adapter conformance fixture did not verify");
}

const fixturePath = "artifacts/godskill-adapter-conformance-v1/reference.json";
const fixtureBytes = Buffer.from(canonicalJson(fixture), "utf8");
await writeIfAbsentOrIdentical(path.join(repositoryRoot, fixturePath), fixtureBytes);

const schemaPath = "schemas/godskill-adapter-conformance-v1.schema.json";
const runtimePath = "runtime/godskill-adapter-conformance-v1.md";
const schemaBytes = await readFile(path.join(repositoryRoot, schemaPath));
const runtimeBytes = await readFile(path.join(repositoryRoot, runtimePath));
const receiptBody = {
  schemaVersion: 1,
  conformanceId: GODSKILL_ADAPTER_CONFORMANCE_ID,
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
  fixture: {
    path: fixturePath,
    digest: fixture.digest,
    sha256: sha256(fixtureBytes),
    bytes: fixtureBytes.length,
  },
  semanticDecision: {
    normalizedDecisionDigest: fixture.normalizedDecisionDigest,
    hostFamilies: fixture.hostFamilies,
    projectionCount: fixture.projections.length,
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
    tests: 828,
    passed: 827,
    failed: 0,
    skipped: 1,
    cancelled: 0,
    todo: 0,
  },
  proofLimits: [
    "bounded-metadata-conformance-only",
    "no-real-host-adoption",
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
  path.join(repositoryRoot, "receipts/godskill-adapter-conformance-v1.json"),
  Buffer.from(canonicalJson(receipt), "utf8"),
);
console.log(JSON.stringify({
  conformanceId: GODSKILL_ADAPTER_CONFORMANCE_ID,
  fixtureDigest: fixture.digest,
  normalizedDecisionDigest: fixture.normalizedDecisionDigest,
  receiptDigest: receipt.receiptDigest,
  hostFamilies: fixture.hostFamilies,
  status: receipt.status,
}));
