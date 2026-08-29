import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildGodskillExtensionRegistries, selectOwnerExtension } from "../src/godskill-extension-registry.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

export async function buildExtensionArtifacts({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const [waveBytes, definitionBytes, policyBytes, fixtureBytes] = await Promise.all([
    readFile(path.join(repositoryRoot, "data/universal-capability-wave.v1.json")),
    readFile(path.join(repositoryRoot, "data/godskill-extensions.v1.json")),
    readFile(path.join(repositoryRoot, "data/godskill-owner-policies.v1.json")),
    readFile(path.join(repositoryRoot, "data/godskill-extension-evaluation-fixtures.v1.json")),
  ]);
  const wave = JSON.parse(waveBytes.toString("utf8"));
  const definitions = JSON.parse(definitionBytes.toString("utf8"));
  const ownerPolicies = JSON.parse(policyBytes.toString("utf8"));
  const evaluationFixtures = JSON.parse(fixtureBytes.toString("utf8"));
  for (const policy of ownerPolicies.owners) {
    const [ownerSkill, ownerContract] = await Promise.all([
      readFile(path.join(repositoryRoot, policy.ownerSkill.path)),
      readFile(path.join(repositoryRoot, policy.ownerContract.path)),
    ]);
    if (sha256(ownerSkill) !== policy.ownerSkill.sha256) throw new Error(`stale owner skill policy: ${policy.ownerId}`);
    if (sha256(ownerContract) !== policy.ownerContract.sha256) throw new Error(`stale owner contract policy: ${policy.ownerId}`);
  }
  const built = buildGodskillExtensionRegistries({ wave, definitions, ownerPolicies, evaluationFixtures });
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
      const fixture = built.fixtures[extension.id];
      const evaluatedCases = fixture.cases.map((entry) => {
        const selected = selectOwnerExtension({ ownerId, requestFeatures: entry.requestFeatures, registries: built.registries });
        const selectedSelf = selected.some((row) => row.id === extension.id);
        return {
          id: entry.id,
          expected: entry.expected,
          actual: selectedSelf ? "selected" : "denied",
          selectedIds: selected.map((row) => row.id),
        };
      });
      const fixturePassed = evaluatedCases.every((entry) => entry.actual === entry.expected);
      const positive = evaluatedCases.find((entry) => entry.expected === "selected");
      const denied = evaluatedCases.filter((entry) => entry.expected === "denied");
      const receiptBody = {
        schemaVersion: 1,
        receiptId: `extension-${extension.id}-promotion-v1`,
        extensionId: extension.id,
        status: fixturePassed ? "promoted" : "blocked",
        evaluationMode: "independent-positive-and-denied-host-policy-fixtures",
        limitation: "This receipt proves exact owner-policy subsets and separately materialized local positive and denial fixtures. It does not prove arbitrary natural-language routing, live-agent interpretation, external execution safety, or universal domain correctness.",
        categoricalOwnerId: ownerId,
        delegateId: extension.delegateId,
        sourceBinding: extension.sourceBinding,
        artifactDigests: {
          ownerSkill: sha256(ownerSkillBytes),
          registry: sha256(registryText),
          ownerPolicySet: sha256(policyBytes),
          evaluationFixtureSet: sha256(fixtureBytes),
        },
        selection: {
          selected: positive?.actual === "selected",
          ownerLocal: evaluatedCases.flatMap((row) => row.selectedIds).every((id) =>
            registry.extensions.some((extensionRow) => extensionRow.id === id)),
          selectedIds: positive?.selectedIds ?? [],
          maximumSelection: registry.maximumSelection,
          evaluatedCases,
        },
        gates: {
          exactEvidence: true,
          capabilityDoesNotGrantAuthority: extension.capabilityDoesNotGrantAuthority,
          sourceProseCopied: false,
          sourceInstructionsExecuted: false,
          recursiveOwnerHandoff: false,
          ownerAuthoritySubset: true,
          ownerEffectSubset: true,
          forbiddenEffectDisjoint: true,
          deniedPolicyCasesPassed: denied.filter((entry) => entry.actual === "denied").length,
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
    ownerPolicySetSha256: sha256(policyBytes),
    ownerPolicySetDigest: ownerPolicies.policySetDigest,
    evaluationFixtureSetSha256: sha256(fixtureBytes),
    evaluationFixtureSetDigest: evaluationFixtures.fixtureSetDigest,
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
