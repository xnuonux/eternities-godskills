import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildGodskillExtensionRegistries, selectOwnerExtension } from "../src/godskill-extension-registry.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

export async function buildExtensionArtifacts({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const [waveBytes, definitionBytes] = await Promise.all([
    readFile(path.join(repositoryRoot, "data/universal-capability-wave.v1.json")),
    readFile(path.join(repositoryRoot, "data/godskill-extensions.v1.json")),
  ]);
  const wave = JSON.parse(waveBytes.toString("utf8"));
  const definitions = JSON.parse(definitionBytes.toString("utf8"));
  const built = buildGodskillExtensionRegistries({ wave, definitions });
  const ownerRows = [];
  const extensionRows = [];

  for (const ownerId of Object.keys(built.registries).sort()) {
    const registry = built.registries[ownerId];
    const registryPath = `skills/${ownerId}/references/wave2-capability-extensions.json`;
    const registryText = `${JSON.stringify(registry, null, 2)}\n`;
    const ownerSkillPath = path.join(repositoryRoot, "skills", ownerId, "SKILL.md");
    const ownerSkillBytes = await readFile(ownerSkillPath);
    if (write) await writeJsonAtomic(path.join(repositoryRoot, registryPath), registry);
    ownerRows.push({
      id: ownerId,
      registryPath,
      registrySha256: sha256(registryText),
      ownerSkillPath: `skills/${ownerId}/SKILL.md`,
      ownerSkillSha256: sha256(ownerSkillBytes),
      extensionCount: registry.extensions.length,
    });

    for (const extension of registry.extensions) {
      const selected = selectOwnerExtension({
        ownerId,
        requestFeatures: {
          keywords: extension.triggerKeywords,
          allowedEffects: extension.requiredEffects,
          grantedAuthority: extension.requiredAuthority,
        },
        registries: built.registries,
      });
      const selectedSelf = selected.some((row) => row.id === extension.id);
      const receiptBody = {
        schemaVersion: 1,
        receiptId: `extension-${extension.id}-promotion-v1`,
        extensionId: extension.id,
        status: selectedSelf ? "promoted" : "blocked",
        evaluationMode: "deterministic-owner-local-feature-selection",
        limitation: "This receipt proves exact local registry selection and contract gates. It does not prove arbitrary natural-language routing, live-agent interpretation, external execution safety, or domain correctness.",
        categoricalOwnerId: ownerId,
        delegateId: extension.delegateId,
        sourceBinding: extension.sourceBinding,
        artifactDigests: {
          ownerSkill: sha256(ownerSkillBytes),
          registry: sha256(registryText),
        },
        selection: {
          selected: selectedSelf,
          ownerLocal: selected.every((row) => row.categoricalOwnerId === ownerId),
          selectedIds: selected.map((row) => row.id),
          maximumSelection: registry.maximumSelection,
        },
        gates: {
          exactEvidence: true,
          capabilityDoesNotGrantAuthority: extension.capabilityDoesNotGrantAuthority,
          sourceProseCopied: false,
          sourceInstructionsExecuted: false,
          recursiveOwnerHandoff: false,
          externalActivation: false,
        },
      };
      const receipt = { ...receiptBody, receiptDigest: sha256(JSON.stringify(receiptBody)) };
      if (receipt.status !== "promoted") throw new Error(`extension selection did not promote: ${extension.id}`);
      const receiptPath = `receipts/extensions/${extension.id}.json`;
      const receiptText = `${JSON.stringify(receipt, null, 2)}\n`;
      if (write) await writeJsonAtomic(path.join(repositoryRoot, receiptPath), receipt);
      extensionRows.push({
        id: extension.id,
        ownerId,
        delegateId: extension.delegateId,
        status: receipt.status,
        receiptPath,
        receiptSha256: sha256(receiptText),
        receiptDigest: receipt.receiptDigest,
      });
    }
  }
  extensionRows.sort((left, right) => left.id.localeCompare(right.id));
  const body = {
    schemaVersion: 1,
    aggregateId: "godskill-extensions-v1",
    status: "certified-local-fixtures",
    sourceWaveDigest: wave.waveDigest,
    definitionSetSha256: sha256(definitionBytes),
    ownerCount: ownerRows.length,
    extensionCount: extensionRows.length,
    promotedCount: extensionRows.filter((row) => row.status === "promoted").length,
    owners: ownerRows,
    extensions: extensionRows,
    activation: { sourceExecutions: 0, thirdPartyActivations: 0, hostProfileChanges: 0, externalMutations: 0 },
    proofLimits: ["deterministic-owner-local-feature-selection-only", "no-arbitrary-natural-language-routing-proof", "no-external-execution-safety-proof"],
  };
  const aggregate = { ...body, aggregateDigest: sha256(JSON.stringify(body)) };
  if (write) await writeJsonAtomic(path.join(repositoryRoot, "receipts/godskill-extensions-v1.json"), aggregate);
  return aggregate;
}

async function main() {
  const result = await buildExtensionArtifacts({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify({ ownerCount: result.ownerCount, extensionCount: result.extensionCount, promotedCount: result.promotedCount, aggregateDigest: result.aggregateDigest }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
