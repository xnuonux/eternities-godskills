import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

const ALLOWED_AUTHORITY = ["local-read", "repository-write"];
const FORBIDDEN_EFFECTS = ["credential-use", "external-write", "production-mutation"];

export async function buildGodskillExtensionEvidence({ root, write = false } = {}) {
  const repositoryRoot = path.resolve(root ?? fileURLToPath(new URL("../", import.meta.url)));
  const definitions = JSON.parse(await readFile(path.join(repositoryRoot, "data/godskill-extensions.v1.json"), "utf8"));
  const ownerIds = [...new Set(definitions.extensions.map((row) => row.categoricalOwnerId))].sort();
  if (ownerIds.length !== 13 || definitions.extensions.length !== 26) {
    throw new Error("extension evidence requires exactly 13 owners and 26 extensions");
  }
  const owners = [];
  for (const ownerId of ownerIds) {
    const skillPath = `skills/${ownerId}/SKILL.md`;
    const contractPath = `skills/${ownerId}/references/capability-contract.json`;
    const [skillBytes, contractBytes] = await Promise.all([
      readFile(path.join(repositoryRoot, skillPath)),
      readFile(path.join(repositoryRoot, contractPath)),
    ]);
    const contract = JSON.parse(contractBytes);
    owners.push({
      ownerId,
      ownerSkill: { path: skillPath, sha256: sha256(skillBytes), bytes: skillBytes.byteLength },
      ownerContract: { path: contractPath, sha256: sha256(contractBytes), bytes: contractBytes.byteLength },
      allowedEffects: [...contract.effects].sort(),
      allowedAuthority: [...ALLOWED_AUTHORITY],
      forbiddenEffects: [...FORBIDDEN_EFFECTS],
    });
  }
  const policyBody = {
    schemaVersion: 1,
    policySetId: "godskill-owner-policies-v1",
    status: "bound-to-immutable-owner-artifacts",
    owners,
  };
  const policies = { ...policyBody, policySetDigest: sha256(JSON.stringify(policyBody)) };

  const extensions = definitions.extensions.map((extension) => ({
    extensionId: extension.id,
    cases: [
      {
        id: "positive-owner-policy",
        expected: "selected",
        requestFeatures: {
          keywords: extension.triggerKeywords.slice(0, 2),
          allowedEffects: [...extension.requiredEffects],
          grantedAuthority: [...extension.requiredAuthority],
        },
      },
      {
        id: "denied-missing-authority",
        expected: "denied",
        requestFeatures: {
          keywords: extension.triggerKeywords.slice(0, 2),
          allowedEffects: [...extension.requiredEffects],
          grantedAuthority: extension.requiredAuthority.slice(0, -1),
        },
      },
      {
        id: "denied-missing-effect",
        expected: "denied",
        requestFeatures: {
          keywords: extension.triggerKeywords.slice(0, 2),
          allowedEffects: extension.requiredEffects.slice(0, -1),
          grantedAuthority: [...extension.requiredAuthority],
        },
      },
    ],
  })).sort((left, right) => left.extensionId.localeCompare(right.extensionId));
  const fixtureBody = {
    schemaVersion: 1,
    fixtureSetId: "godskill-extension-policy-fixtures-v1",
    status: "independent-positive-and-denied-policy-fixtures",
    extensions,
  };
  const fixtures = { ...fixtureBody, fixtureSetDigest: sha256(JSON.stringify(fixtureBody)) };

  if (write) {
    await writeJsonAtomic(path.join(repositoryRoot, "data/godskill-owner-policies.v1.json"), policies);
    await writeJsonAtomic(path.join(repositoryRoot, "data/godskill-extension-evaluation-fixtures.v1.json"), fixtures);
  }
  return { policies, fixtures };
}

async function main() {
  const result = await buildGodskillExtensionEvidence({ write: process.argv.includes("--write") });
  process.stdout.write(`${JSON.stringify({
    ownerCount: result.policies.owners.length,
    extensionFixtureCount: result.fixtures.extensions.length,
    policySetDigest: result.policies.policySetDigest,
    fixtureSetDigest: result.fixtures.fixtureSetDigest,
  }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
