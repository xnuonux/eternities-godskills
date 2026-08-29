const DIGEST = /^[a-f0-9]{64}$/;

function string(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function strings(values, field) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${field} must be a non-empty array`);
  const normalized = values.map((value) => string(value, field));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} contains duplicates`);
  return normalized;
}

function optionalStrings(values, field) {
  if (values === undefined) return [];
  if (!Array.isArray(values)) throw new Error(`${field} must be an array`);
  const normalized = values.map((value) => string(value, field));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} contains duplicates`);
  return normalized;
}

function digests(values, field) {
  const normalized = strings(values, field).sort();
  if (normalized.some((value) => !DIGEST.test(value))) throw new Error(`${field} must contain SHA-256 digests`);
  return normalized;
}

function exact(left, right, message) {
  if (JSON.stringify(left) !== JSON.stringify(right)) throw new Error(message);
}

function validateExtension(extension, target, ownerPolicy) {
  if (extension?.schemaVersion !== 1) throw new Error("extension schemaVersion must be 1");
  const id = string(extension.id, "extension.id");
  if (id !== target.clusterId) throw new Error(`extension id does not match target: ${id}`);
  const categoricalOwnerId = string(extension.categoricalOwnerId, "extension.categoricalOwnerId");
  if (categoricalOwnerId !== target.categoricalOwnerId) throw new Error(`extension owner does not match target: ${id}`);
  const delegateId = string(extension.delegateId, "extension.delegateId");
  if (delegateId !== target.implementationOwnerId) throw new Error(`extension delegate does not match target: ${id}`);
  if (extension.capabilityDoesNotGrantAuthority !== true) throw new Error(`capability must not grant authority: ${id}`);
  const binding = extension.sourceBinding;
  if (binding?.targetId !== target.targetId) throw new Error(`target id does not match target: ${id}`);
  if (binding?.clusterDigest !== target.clusterDigest) throw new Error(`cluster digest does not match target: ${id}`);
  if (binding?.overlapDigest !== target.overlapDigest) throw new Error(`overlap digest does not match target: ${id}`);
  exact(digests(binding.reviewDigests, "sourceBinding.reviewDigests"), [...target.reviewDigests].sort(), `review digests do not match target: ${id}`);
  exact(digests(binding.comparisonDigests, "sourceBinding.comparisonDigests"), [...target.comparisonDigests].sort(), `comparison digests do not match target: ${id}`);
  if (!ownerPolicy || ownerPolicy.ownerId !== categoricalOwnerId) throw new Error(`owner policy is missing: ${id}`);
  if (extension.handoffOwnerIds !== undefined) throw new Error(`legacy routable owner handoff is forbidden: ${id}`);
  const terminalEscalationOwnerIds = optionalStrings(extension.terminalEscalationOwnerIds, "extension.terminalEscalationOwnerIds").sort();
  const routableHandoffOwnerIds = optionalStrings(extension.routableHandoffOwnerIds, "extension.routableHandoffOwnerIds").sort();
  if (routableHandoffOwnerIds.includes(categoricalOwnerId)) throw new Error(`recursive owner handoff graph: ${id}`);
  const allowedEffects = strings(extension.allowedEffects, "extension.allowedEffects").sort();
  const requiredEffects = strings(extension.requiredEffects, "extension.requiredEffects").sort();
  if (requiredEffects.some((effect) => !allowedEffects.includes(effect))) throw new Error(`required effect is not allowed: ${id}`);
  if (allowedEffects.some((effect) => !ownerPolicy.allowedEffects.includes(effect))) throw new Error(`extension exceeds owner effect policy: ${id}`);
  const requiredAuthority = strings(extension.requiredAuthority, "extension.requiredAuthority").sort();
  if (requiredAuthority.some((grant) => !ownerPolicy.allowedAuthority.includes(grant))) throw new Error(`extension exceeds owner authority policy: ${id}`);
  const forbiddenEffects = strings(extension.forbiddenEffects, "extension.forbiddenEffects").sort();
  if (requiredEffects.some((effect) => forbiddenEffects.includes(effect) || ownerPolicy.forbiddenEffects.includes(effect))) {
    throw new Error(`extension required effect intersects forbidden policy: ${id}`);
  }
  return {
    schemaVersion: 1,
    id,
    targetId: target.targetId,
    categoricalOwnerId,
    delegateId,
    intent: string(extension.intent, "extension.intent"),
    triggerKeywords: strings(extension.triggerKeywords, "extension.triggerKeywords").map((value) => value.toLowerCase()).sort(),
    negativeKeywords: strings(extension.negativeKeywords, "extension.negativeKeywords").map((value) => value.toLowerCase()).sort(),
    requiredEvidence: strings(extension.requiredEvidence, "extension.requiredEvidence"),
    outputs: strings(extension.outputs, "extension.outputs"),
    allowedEffects,
    requiredEffects,
    requiredAuthority,
    forbiddenEffects,
    terminalEscalationOwnerIds,
    routableHandoffOwnerIds,
    ownerPolicyBinding: {
      ownerId: ownerPolicy.ownerId,
      ownerSkillSha256: ownerPolicy.ownerSkill.sha256,
      ownerContractSha256: ownerPolicy.ownerContract.sha256,
    },
    terminationCondition: string(extension.terminationCondition, "extension.terminationCondition"),
    capabilityDoesNotGrantAuthority: true,
    sourceBinding: {
      targetId: binding.targetId,
      clusterDigest: binding.clusterDigest,
      overlapDigest: binding.overlapDigest,
      reviewDigests: [...binding.reviewDigests].sort(),
      comparisonDigests: [...binding.comparisonDigests].sort(),
    },
    sourceProvenance: {
      sourceProseCopied: false,
      sourceInstructionsExecuted: false,
      independentlyWritten: true,
    },
  };
}

function assertAcyclicOwnerHandoffs(registries) {
  const graph = new Map(Object.keys(registries).map((ownerId) => [ownerId, new Set()]));
  for (const registry of Object.values(registries)) {
    for (const extension of registry.extensions) {
      for (const ownerId of extension.routableHandoffOwnerIds) {
        if (graph.has(ownerId)) graph.get(registry.ownerId).add(ownerId);
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(ownerId) {
    if (visiting.has(ownerId)) throw new Error("recursive owner handoff graph contains a cycle");
    if (visited.has(ownerId)) return;
    visiting.add(ownerId);
    for (const next of graph.get(ownerId) ?? []) visit(next);
    visiting.delete(ownerId);
    visited.add(ownerId);
  }
  for (const ownerId of graph.keys()) visit(ownerId);
}

export function buildGodskillExtensionRegistries({ wave, definitions, ownerPolicies, evaluationFixtures }) {
  const targets = wave?.targets?.filter((target) => target.kind === "godskill-extension") ?? [];
  if (targets.length !== 26 || definitions?.extensions?.length !== 26) throw new Error("extension construction requires exactly 26 extensions and targets");
  const targetById = new Map(targets.map((target) => [target.clusterId, target]));
  if (targetById.size !== 26) throw new Error("duplicate extension target");
  const seen = new Set();
  const registries = {};
  if (ownerPolicies?.owners?.length !== 13) throw new Error("extension construction requires exactly 13 owner policies");
  if (evaluationFixtures?.extensions?.length !== 26) throw new Error("extension construction requires exactly 26 evaluation fixtures");
  const policyByOwner = new Map(ownerPolicies.owners.map((row) => [row.ownerId, row]));
  const fixtureByExtension = new Map(evaluationFixtures.extensions.map((row) => [row.extensionId, row]));
  if (policyByOwner.size !== 13 || fixtureByExtension.size !== 26) throw new Error("duplicate owner policy or extension fixture");
  for (const extension of definitions.extensions) {
    if (seen.has(extension.id)) throw new Error(`duplicate extension id: ${extension.id}`);
    seen.add(extension.id);
    const target = targetById.get(extension.id);
    if (!target) throw new Error(`extension has no certified target: ${extension.id}`);
    const normalized = validateExtension(extension, target, policyByOwner.get(extension.categoricalOwnerId));
    const registry = registries[normalized.categoricalOwnerId] ??= {
      schemaVersion: 1,
      registryId: `${normalized.categoricalOwnerId}-wave2-extensions-v1`,
      ownerId: normalized.categoricalOwnerId,
      maximumSelection: 3,
      extensions: [],
    };
    registry.extensions.push(normalized);
  }
  for (const registry of Object.values(registries)) registry.extensions.sort((left, right) => left.id.localeCompare(right.id));
  assertAcyclicOwnerHandoffs(registries);
  return {
    schemaVersion: 1,
    extensionCount: seen.size,
    ownerCount: Object.keys(registries).length,
    registries,
    fixtures: Object.fromEntries([...fixtureByExtension.entries()].sort(([left], [right]) => left.localeCompare(right))),
  };
}

export function selectOwnerExtension({ ownerId, requestFeatures = {}, registries }) {
  const registry = registries?.[ownerId];
  if (!registry) throw new Error(`unknown owner registry: ${ownerId}`);
  const keywords = new Set((requestFeatures.keywords ?? []).map((value) => String(value).toLowerCase()));
  const effects = new Set(requestFeatures.allowedEffects ?? []);
  const authority = new Set(requestFeatures.grantedAuthority ?? []);
  return registry.extensions
    .filter((extension) => extension.requiredEffects.every((effect) => effects.has(effect)))
    .filter((extension) => extension.requiredAuthority.every((grant) => authority.has(grant)))
    .map((extension) => ({
      ...extension,
      matchScore: extension.triggerKeywords.filter((keyword) => keywords.has(keyword)).length,
      conflictScore: extension.negativeKeywords.filter((keyword) => keywords.has(keyword)).length,
    }))
    .filter((extension) => extension.matchScore > 0 && extension.conflictScore === 0)
    .sort((left, right) => right.matchScore - left.matchScore || left.id.localeCompare(right.id))
    .slice(0, registry.maximumSelection);
}
