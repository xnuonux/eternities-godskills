import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildPortableCapabilityManifest } from "../src/portable-capability-manifest.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

const OPERATIONAL_RECEIPT = "receipts/operational-capabilities-v1.json";
const EXTENSION_RECEIPT = "receipts/godskill-extensions-v1.json";
const SYSTEM_RECEIPT = "receipts/godskills-system-certification-v3.json";

async function artifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath.replaceAll("\\", "/"), sha256: sha256(bytes), bytes: bytes.byteLength };
}

function vocabulary(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))].sort();
}

export async function buildPortableManifestArtifacts({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const operationalSet = JSON.parse(await readFile(path.join(repositoryRoot, "data/operational-capabilities.v1.json"), "utf8"));
  const operationalIds = new Set(operationalSet.records.map((record) => record.id));
  const allSkillIds = (await readdir(path.join(repositoryRoot, "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const topLevelIds = allSkillIds.filter((id) => !operationalIds.has(id));
  if (topLevelIds.length !== 22) throw new Error(`expected 22 top-level skills, received ${topLevelIds.length}`);
  const capabilities = [];

  for (const id of [...topLevelIds, ...operationalIds].sort()) {
    const operational = operationalIds.has(id);
    const entrypoint = await artifact(repositoryRoot, `skills/${id}/SKILL.md`);
    const contractPath = operational
      ? `skills/${id}/references/capability-contract.json`
      : id === "sovereign-skill-refinery"
        ? `skills/${id}/references/contract-template.json`
        : `skills/${id}/references/capability-contract.json`;
    const contractArtifact = await artifact(repositoryRoot, contractPath);
    const contract = JSON.parse(await readFile(path.join(repositoryRoot, contractPath), "utf8"));
    const promotionPath = operational ? `receipts/operational/${id}.json` : SYSTEM_RECEIPT;
    const promotionReceipt = await artifact(repositoryRoot, promotionPath);
    const sourceMode = contract.sourceEvidence?.mode ?? "receipt-bound-first-party";
    capabilities.push({
      schemaVersion: 1,
      id,
      tier: operational ? "operational-skill" : "godskill",
      ownerGodskillId: operational ? contract.ownerGodskillId : id,
      invocation: operational ? "direct-or-owner-delegated" : "direct-categorical-owner",
      entrypoint,
      contract: contractArtifact,
      promotionReceipt,
      capabilityVocabulary: vocabulary([...(contract.operations ?? []), ...(contract.routes ?? []).flatMap((route) => route.capabilities ?? [])]),
      effectVocabulary: vocabulary(contract.effects),
      riskVocabulary: vocabulary([...(contract.negativeTriggers ?? []), ...(contract.failureModes ?? [])]),
      evidenceVocabulary: vocabulary([sourceMode, "contract-digest", "promotion-receipt"]),
      preconditionVocabulary: vocabulary(contract.preconditions ?? contract.inputs),
      composition: { maximumSelected: operational ? 1 : 3, recursive: false },
      terminationConditions: vocabulary(contract.terminationConditions ?? [contract.successCondition]),
      capabilityDoesNotGrantAuthority: true,
    });
  }

  const extensionAggregate = JSON.parse(await readFile(path.join(repositoryRoot, EXTENSION_RECEIPT), "utf8"));
  const ownerRegistries = await Promise.all(extensionAggregate.owners.map(async (owner) => ({
    ownerId: owner.id,
    extensionCount: owner.extensionCount,
    registry: await artifact(repositoryRoot, owner.registryPath),
    extensionReceiptDigest: extensionAggregate.aggregateDigest,
    maximumSelected: 3,
  })));
  const releaseEvidence = {
    topLevelSystem: await artifact(repositoryRoot, SYSTEM_RECEIPT),
    operationalCapabilities: await artifact(repositoryRoot, OPERATIONAL_RECEIPT),
    godskillExtensions: await artifact(repositoryRoot, EXTENSION_RECEIPT),
  };
  const manifest = buildPortableCapabilityManifest({ capabilities, ownerRegistries, releaseEvidence });
  const manifestPath = "artifacts/portable-capabilities/manifest.v1.json";
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const receiptBody = {
    schemaVersion: 1,
    receiptId: "portable-capability-manifest-v1",
    status: "certified-local-artifacts",
    manifest: { path: manifestPath, sha256: sha256(manifestText), bytes: Buffer.byteLength(manifestText), manifestDigest: manifest.manifestDigest },
    counts: { capabilities: 44, topLevelGodskills: 22, operationalSkills: 22, ownerRegistries: 13, extensions: 26 },
    selectedEntrypointBoundary: { pattern: "skills/<id>/SKILL.md", maximumComposition: 3, authorityExpansion: false, effectExpansion: false },
    activation: manifest.activation,
    proofLimits: manifest.proofLimits,
  };
  const receipt = { ...receiptBody, receiptDigest: sha256(JSON.stringify(receiptBody)) };
  if (write) {
    await writeJsonAtomic(path.join(repositoryRoot, manifestPath), manifest);
    await writeJsonAtomic(path.join(repositoryRoot, "receipts/portable-capability-manifest-v1.json"), receipt);
  }
  return { manifest, receipt };
}

async function main() {
  const { manifest, receipt } = await buildPortableManifestArtifacts({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify({ capabilityCount: manifest.capabilities.length, ownerRegistryCount: manifest.ownerRegistries.length, manifestDigest: manifest.manifestDigest, receiptDigest: receipt.receiptDigest }, null, 2)}\n`);
}
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
