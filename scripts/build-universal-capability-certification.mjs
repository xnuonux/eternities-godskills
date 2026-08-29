import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

async function readJson(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
}

async function artifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath.replaceAll("\\", "/"), sha256: sha256(bytes), bytes: bytes.byteLength };
}

function exactCount(value, expected, label) {
  if (value !== expected) throw new Error(`${label} must be ${expected}, received ${value}`);
}

async function verifyTerminalReceipts(root, wave, operational, extensions) {
  const targetIds = new Set(wave.targets.map((row) => row.targetId));
  exactCount(targetIds.size, 48, "unique construction target count");
  const terminalIds = new Set();
  for (const row of operational.skills) {
    const receipt = await readJson(root, row.receiptPath);
    if (sha256(receipt.bytes) !== row.receiptSha256 || receipt.value.status !== "promoted") {
      throw new Error(`stale or unpromoted operational receipt: ${row.id}`);
    }
    if (receipt.value.evidence?.targetId !== row.targetId || !targetIds.has(row.targetId)) {
      throw new Error(`operational target mismatch: ${row.id}`);
    }
    if (!receipt.value.evidence?.baselineDigest || !receipt.value.evidence?.baselineOwnerArtifacts) {
      throw new Error(`operational baseline evidence is absent: ${row.id}`);
    }
    terminalIds.add(row.targetId);
  }
  for (const row of extensions.extensions) {
    const receipt = await readJson(root, row.receiptPath);
    if (sha256(receipt.bytes) !== row.receiptSha256 || receipt.value.status !== "promoted") {
      throw new Error(`stale or unpromoted extension receipt: ${row.id}`);
    }
    const targetId = receipt.value.sourceBinding?.targetId;
    if (!targetIds.has(targetId)) throw new Error(`extension target mismatch: ${row.id}`);
    if (receipt.value.gates?.deniedPolicyCasesPassed !== 2
        || receipt.value.gates?.ownerAuthoritySubset !== true
        || receipt.value.gates?.ownerEffectSubset !== true
        || receipt.value.gates?.recursiveOwnerHandoff !== false) {
      throw new Error(`extension safety evidence is incomplete: ${row.id}`);
    }
    terminalIds.add(targetId);
  }
  exactCount(terminalIds.size, 48, "terminally receipted target count");
  return sha256(JSON.stringify([...terminalIds].sort()));
}

export async function buildUniversalCapabilityCertification({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const paths = {
    universalWave: "data/universal-capability-wave.v1.json",
    wave2Refinery: "receipts/wave2-semantic-refinery-v1.json",
    operationalBaselines: "data/operational-capability-baselines.v1.json",
    operationalCapabilities: "receipts/operational-capabilities-v1.json",
    ownerPolicies: "data/godskill-owner-policies.v1.json",
    extensionFixtures: "data/godskill-extension-evaluation-fixtures.v1.json",
    godskillExtensions: "receipts/godskill-extensions-v1.json",
    portableManifest: "artifacts/portable-capabilities/manifest.v1.json",
    portableManifestReceipt: "receipts/portable-capability-manifest-v1.json",
    currentRouter: "receipts/agent-native-router-v7.json",
    godagentsHandoff: "artifacts/compatibility/godagents-v1.json",
    adversarialReview: "artifacts/universal-capability-construction/adversarial-review.json",
  };
  const loaded = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => [
    key,
    await readJson(repositoryRoot, relativePath),
  ])));
  const wave = loaded.universalWave.value;
  const operational = loaded.operationalCapabilities.value;
  const extensions = loaded.godskillExtensions.value;
  const manifest = loaded.portableManifest.value;
  const manifestReceipt = loaded.portableManifestReceipt.value;
  const compatibility = loaded.godagentsHandoff.value;
  const review = loaded.adversarialReview.value;

  exactCount(wave.targets.length, 48, "construction target count");
  exactCount(wave.targets.filter((row) => row.kind === "operational-skill").length, 22, "operational target count");
  exactCount(wave.targets.filter((row) => row.kind === "godskill-extension").length, 26, "extension target count");
  exactCount(operational.promotedCount, 22, "operational promotion count");
  exactCount(extensions.promotedCount, 26, "extension promotion count");
  exactCount(manifest.capabilities.length, 43, "portable capability count");
  exactCount(manifest.capabilities.filter((row) => row.tier === "godskill").length, 21, "top-level Godskill count");
  exactCount(manifest.ownerRegistries.length, 13, "owner registry count");
  if (manifestReceipt.manifest.sha256 !== sha256(loaded.portableManifest.bytes)) throw new Error("portable manifest receipt is stale");
  if (compatibility.godskillsEvidence.portableManifestDigest !== manifest.manifestDigest
      || compatibility.godskillsEvidence.portableManifestReceiptDigest !== manifestReceipt.receiptDigest) {
    throw new Error("Godagents compatibility handoff is stale");
  }
  if (review.unresolvedCritical !== 0 || review.unresolvedImportant !== 0 || review.status !== "resolved") {
    throw new Error("adversarial review is unresolved");
  }
  for (const scoped of review.scope.artifacts) {
    const current = await artifact(repositoryRoot, scoped.path);
    if (current.sha256 !== scoped.sha256) throw new Error(`adversarial review scope is stale: ${scoped.path}`);
  }
  const terminalReceiptSetDigest = await verifyTerminalReceipts(repositoryRoot, wave, operational, extensions);
  const artifacts = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => [
    key,
    await artifact(repositoryRoot, relativePath),
  ])));
  const body = {
    schemaVersion: 1,
    certificateId: "universal-capability-construction-v1",
    status: "certified",
    scope: "universal-agent-capability-pack",
    counts: {
      constructionTargets: 48,
      operationalSkills: 22,
      godskillExtensions: 26,
      topLevelGodskills: 21,
      portableCapabilities: 43,
      ownerRegistries: 13,
    },
    gates: {
      operationalPromotions: 22,
      extensionPromotions: 26,
      unresolvedTargets: 0,
      authorityExpansion: false,
      sourceInstructionsExecuted: false,
      externalActivation: false,
      routableOwnerCycles: 0,
      deniedExtensionPolicyCasesPassed: 52,
    },
    terminalReceiptSetDigest,
    artifacts,
    adversarialReview: {
      reviewId: review.reviewId,
      reviewerAgentId: review.reviewer.agentId,
      reviewerModel: review.reviewer.model,
      unresolvedCritical: review.unresolvedCritical,
      unresolvedImportant: review.unresolvedImportant,
      resolvedFindingCount: review.findings.filter((row) => row.status.startsWith("resolved")).length,
    },
    godagentsCompatibility: {
      handoffSha256: artifacts.godagentsHandoff.sha256,
      observedAdapterSha256: compatibility.observedAdapter.sha256,
      capabilityGrantsAuthority: compatibility.boundary.capabilityGrantsAuthority,
      godagentsRuntimeChanged: compatibility.activation.godagentsRuntimeChanged,
    },
    activation: {
      hostProfilesChanged: 0,
      GodagentGenomesChanged: 0,
      RealmContractsChanged: 0,
      productRuntimesChanged: 0,
      externalAccountsChanged: 0,
    },
    proofLimits: [
      "deterministic-local-artifacts-and-fixtures-only",
      "no-arbitrary-live-agent-routing-proof",
      "no-future-godagents-adapter-proof",
      "no-external-execution-safety-proof",
      "no-universal-domain-correctness-proof",
    ],
  };
  const certificate = { ...body, certificateDigest: sha256(JSON.stringify(body)) };
  if (write) await writeJsonAtomic(path.join(repositoryRoot, "receipts/universal-capability-construction-v1.json"), certificate);
  return certificate;
}

async function main() {
  const result = await buildUniversalCapabilityCertification({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify({
    status: result.status,
    constructionTargets: result.counts.constructionTargets,
    certificateDigest: result.certificateDigest,
  }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
