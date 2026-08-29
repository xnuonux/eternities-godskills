import { sha256 } from "./io.mjs";

const ENTRYPOINT = /^skills\/([a-z0-9-]+)\/SKILL\.md$/;
const HOST_OR_SECRET = /(?:[A-Z]:\\|[A-Z]:\/|Users\\|sk-or-v1-|api[_-]?key|password|credential value)/i;

export function validateSelectedEntrypointPackage({ selectedIds, selectedEntrypoints, maxCompositionSize }) {
  if (!Array.isArray(selectedIds) || !Array.isArray(selectedEntrypoints) || selectedIds.length !== selectedEntrypoints.length) {
    throw new Error("selected entrypoint arrays are inconsistent");
  }
  if (!Number.isInteger(maxCompositionSize) || maxCompositionSize < 1 || selectedIds.length > maxCompositionSize) {
    throw new Error("selected entrypoint package exceeds maximum composition");
  }
  for (let index = 0; index < selectedIds.length; index += 1) {
    const match = selectedEntrypoints[index].match(ENTRYPOINT);
    if (!match || match[1] !== selectedIds[index]) throw new Error("selected entrypoint does not match its id");
  }
  return [...selectedEntrypoints];
}

export function buildPortableCapabilityManifest({ capabilities, ownerRegistries, releaseEvidence }) {
  if (!Array.isArray(capabilities) || capabilities.length !== 43) throw new Error("portable manifest requires exactly 43 capabilities");
  if (!Array.isArray(ownerRegistries) || ownerRegistries.length !== 13) throw new Error("portable manifest requires exactly 13 owner registries");
  const ids = capabilities.map((row) => row.id);
  if (new Set(ids).size !== 43) throw new Error("duplicate portable capability id");
  const topLevel = capabilities.filter((row) => row.tier === "godskill");
  const operational = capabilities.filter((row) => row.tier === "operational-skill");
  if (topLevel.length !== 21 || operational.length !== 22) throw new Error("portable capability tier counts are invalid");
  for (const row of capabilities) {
    if (row.entrypoint.path !== `skills/${row.id}/SKILL.md`) throw new Error(`entrypoint identity mismatch: ${row.id}`);
    if (row.capabilityDoesNotGrantAuthority !== true) throw new Error(`capability grants authority: ${row.id}`);
    if (row.composition.maximumSelected < 1 || row.composition.maximumSelected > 3) throw new Error(`composition bound is invalid: ${row.id}`);
  }
  const normalized = {
    schemaVersion: 1,
    manifestId: "portable-capabilities-v1",
    status: "certified-local-artifacts",
    capabilities: [...capabilities].sort((left, right) => left.id.localeCompare(right.id)),
    ownerRegistries: [...ownerRegistries].sort((left, right) => left.ownerId.localeCompare(right.ownerId)),
    releaseEvidence,
    composition: {
      maximumSelectedEntrypoints: 3,
      recursiveComposition: false,
      capabilityGrantsAuthority: false,
      selectedEntrypointPattern: "skills/<id>/SKILL.md",
    },
    activation: { sourceExecutions: 0, thirdPartyActivations: 0, hostProfileChanges: 0, externalMutations: 0 },
    proofLimits: ["local-artifact-integrity-only", "no-arbitrary-live-agent-routing-proof", "no-external-execution-safety-proof", "no-universal-domain-correctness-proof"],
  };
  const text = JSON.stringify(normalized);
  if (HOST_OR_SECRET.test(text)) throw new Error("portable manifest contains host or secret material");
  return { ...normalized, manifestDigest: sha256(text) };
}
