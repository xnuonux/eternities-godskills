import { sha256 } from "./io.mjs";
import { validateRequestEnvelope, validateRouteReceipt, validateRoutingCard } from "./routing-contracts.mjs";

const DIFF_FIELDS = [
  "selectedIds",
  "uncoveredCapabilities",
  "availableAuthority",
  "permittedEffects",
  "selectedEffects",
  "riskClasses",
  "contextCost",
];

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function digest(value) {
  return sha256(JSON.stringify(stableValue(value)));
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a non-empty string`);
}

function exactDigest(value, label) {
  if (!/^[a-f0-9]{64}$/.test(value ?? "")) throw new Error(`${label} must be an exact sha256 digest`);
}

function sortedUnique(values) {
  return [...new Set(values)].sort(lexical);
}

export function compileMissionSkillStack(input = {}) {
  nonEmpty(input.missionId, "missionId");
  exactDigest(input.projectFingerprint, "projectFingerprint");
  const request = validateRequestEnvelope(input.requestEnvelope);
  const route = validateRouteReceipt(input.routeReceipt);
  if (route.requestId !== request.requestId || route.requestDigest !== digest(request)) {
    throw new Error("route receipt mismatch with request envelope");
  }
  if (input.missionId !== request.requestId) throw new Error("mission id does not match request id");
  if (!Array.isArray(input.cards)) throw new Error("cards must be an array");
  if (!input.entrypointDigests || typeof input.entrypointDigests !== "object" || Array.isArray(input.entrypointDigests)) {
    throw new Error("entrypointDigests must be an object");
  }
  const cardsById = new Map();
  for (const value of input.cards) {
    const card = validateRoutingCard(value);
    if (cardsById.has(card.id)) throw new Error(`duplicate routing card: ${card.id}`);
    cardsById.set(card.id, card);
  }

  const selected = route.selectedIds.map((id, index) => {
    const card = cardsById.get(id);
    if (!card) throw new Error(`selected routing card is missing: ${id}`);
    if (card.entrypoint !== route.selectedEntrypoints[index]) throw new Error(`route entrypoint mismatch: ${id}`);
    const entrypointSha256 = input.entrypointDigests[id];
    exactDigest(entrypointSha256, `entrypoint digest for ${id}`);
    for (const effect of card.effects) {
      if (effect !== "none" && !request.permittedEffects.includes(effect)) throw new Error(`selected effect exceeds authority: ${effect}`);
    }
    for (const authority of card.authorityRequirements) {
      if (!request.availableAuthority.includes(authority)) throw new Error(`selected authority is unavailable: ${authority}`);
    }
    return {
      id,
      entrypoint: card.entrypoint,
      entrypointSha256,
      cardSha256: digest(card),
      provides: [...card.provides],
      effects: [...card.effects],
      riskClass: card.riskClass,
      authorityRequirements: [...card.authorityRequirements],
      contextCost: card.contextCost,
      evidenceConfidence: card.evidenceConfidence,
    };
  });
  const provided = new Set(selected.flatMap(({ provides }) => provides));
  const receipt = {
    schemaVersion: 1,
    missionId: input.missionId,
    projectFingerprint: input.projectFingerprint,
    requestDigest: digest(request),
    routeReceiptDigest: digest(route),
    routeStatus: route.status,
    selectionKind: route.selectionKind,
    selectedIds: selected.map(({ id }) => id),
    selected,
    uncoveredCapabilities: request.requiredCapabilities.filter((capability) => !provided.has(capability)),
    availableAuthority: [...request.availableAuthority],
    permittedEffects: [...request.permittedEffects],
    selectedEffects: sortedUnique(selected.flatMap(({ effects }) => effects)),
    riskClasses: sortedUnique(selected.map(({ riskClass }) => riskClass)),
    contextCost: selected.reduce((total, card) => total + card.contextCost, 0),
    sourceBodiesTransported: 0,
    authorityExpanded: false,
  };
  return { ...receipt, stackDigest: digest(receipt) };
}

export function diffMissionSkillStacks(previous, current) {
  if (!previous || !current) throw new Error("both mission skill stacks are required");
  const fields = DIFF_FIELDS.filter((field) => digest(previous[field]) !== digest(current[field]))
    .map((field) => ({ field, previous: previous[field], current: current[field] }));
  return { changed: fields.length > 0, fields };
}
