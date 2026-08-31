import { routeCapabilities as routeHistoricalCapabilities } from "./router.mjs";
import {
  EVIDENCE_LEVELS,
  effectCost,
  validateRoutingCard,
} from "./routing-contracts.mjs";
import {
  PREFERENCE_DECISION_POLICY,
  PREFERENCE_PROTOCOL_ID,
  preferenceDigest,
  splitPreferenceEnvelope,
  validatePreferenceRouteReceipt,
} from "./specialist-preference-contracts.mjs";

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sorted(values) {
  return [...new Set(values)].sort(lexical);
}

function covers(provides, requirements) {
  const available = new Set(provides);
  return requirements.every((requirement) => available.has(requirement));
}

function compatiblePair(left, right) {
  return left.compatibleWith.includes(right.id)
    && right.compatibleWith.includes(left.id)
    && !left.conflictsWith.includes(right.id)
    && !right.conflictsWith.includes(left.id);
}

function mutuallyCompatible(cards) {
  for (let left = 0; left < cards.length; left += 1) {
    for (let right = left + 1; right < cards.length; right += 1) {
      if (!compatiblePair(cards[left], cards[right])) return false;
    }
  }
  return true;
}

function requirementsSatisfied(cards) {
  const provided = new Set(cards.flatMap(({ provides }) => provides));
  return cards.every(({ requires }) => requires.every((value) => provided.has(value)));
}

function combinations(values, size, start = 0, prefix = [], output = []) {
  if (prefix.length === size) {
    output.push(prefix);
    return output;
  }
  const remaining = size - prefix.length;
  for (let index = start; index <= values.length - remaining; index += 1) {
    combinations(values, size, index + 1, [...prefix, values[index]], output);
  }
  return output;
}

function compatibleCompositions(cards, request) {
  const ordered = [...cards].sort((left, right) => lexical(left.id, right.id));
  const results = [];
  const maximum = Math.min(request.maxCompositionSize, ordered.length);
  for (let size = 2; size <= maximum; size += 1) {
    for (const candidate of combinations(ordered, size)) {
      if (!mutuallyCompatible(candidate) || !requirementsSatisfied(candidate)) continue;
      const provided = sorted(candidate.flatMap(({ provides }) => provides));
      if (!covers(provided, request.requiredCapabilities)) continue;
      const totalContext = candidate.reduce((sum, card) => sum + card.contextCost, 0);
      if (totalContext > request.contextBudget) continue;
      results.push(candidate);
    }
  }
  return results;
}

function confidenceFor(cards) {
  return EVIDENCE_LEVELS[Math.max(
    ...cards.map(({ evidenceConfidence }) => EVIDENCE_LEVELS.indexOf(evidenceConfidence)),
  )];
}

function selection(cards, request, preferred) {
  const ordered = [...cards].sort((left, right) => lexical(left.id, right.id));
  const provided = sorted(ordered.flatMap(({ provides }) => provides));
  const effects = sorted(ordered.flatMap(({ effects }) => effects));
  const required = new Set(request.requiredCapabilities);
  return {
    cards: ordered,
    uncoveredCount: request.requiredCapabilities.filter(
      (capability) => !provided.includes(capability),
    ).length,
    extraCapabilityCount: provided.filter((capability) => !required.has(capability)).length,
    effectCost: effectCost(effects),
    contextCost: ordered.reduce((sum, card) => sum + card.contextCost, 0),
    dependencyCost: ordered.reduce((sum, card) => sum + card.dependencyCost, 0),
    evidencePenalty: ordered.reduce(
      (sum, card) => sum + EVIDENCE_LEVELS.indexOf(card.evidenceConfidence),
      0,
    ),
    preferencePenalty: ordered.filter(({ id }) => !preferred.has(id)).length,
    idKey: ordered.map(({ id }) => id).join("+"),
    confidence: confidenceFor(ordered),
  };
}

function compareQuality(left, right) {
  return left.uncoveredCount - right.uncoveredCount
    || left.cards.length - right.cards.length
    || left.extraCapabilityCount - right.extraCapabilityCount
    || left.effectCost - right.effectCost
    || left.contextCost - right.contextCost
    || left.dependencyCost - right.dependencyCost
    || left.evidencePenalty - right.evidencePenalty;
}

function compareHistorical(left, right) {
  return compareQuality(left, right) || lexical(left.idKey, right.idKey);
}

function comparePreferred(left, right) {
  return compareQuality(left, right)
    || left.preferencePenalty - right.preferencePenalty
    || lexical(left.idKey, right.idKey);
}

function idsFor(candidate) {
  return candidate?.cards.map(({ id }) => id) ?? [];
}

function preferenceRecord({
  preferredCapabilities,
  qualified,
  chosen,
  baseline,
  status,
  selections,
  semanticCandidateIds,
}) {
  const suppliedIds = [...preferredCapabilities];
  const supplied = new Set(suppliedIds);
  const qualifiedIds = qualified.map(({ id }) => id)
    .filter((id) => supplied.has(id))
    .sort(lexical);
  const selectedIds = idsFor(chosen);
  const baselineSelectedIds = idsFor(baseline);
  const semantic = new Set(semanticCandidateIds);
  const changed = selectedIds.length !== baselineSelectedIds.length
    || selectedIds.some((id, index) => id !== baselineSelectedIds[index]);
  const routeCapablePreference = selections.some(({ cards }) =>
    cards.some(({ id }) => supplied.has(id)));
  let reason;
  if (status === "needs-decision") reason = "unresolved-decision";
  else if (status === "no-qualified-route") reason = "no-selection";
  else if (changed) reason = "equal-quality-tie-break";
  else if (selectedIds.some((id) => supplied.has(id))) reason = "selected-without-effect";
  else if (routeCapablePreference) reason = "stronger-nonpreferred-selection";
  else if (qualifiedIds.length > 0 && !qualifiedIds.some((id) => semantic.has(id))) {
    reason = "preference-not-semantic-candidate";
  }
  else if (qualifiedIds.length > 0) reason = "preference-not-route-capable";
  else reason = "no-qualified-preference";
  return {
    protocolId: PREFERENCE_PROTOCOL_ID,
    suppliedIds,
    qualifiedIds,
    selectedIds,
    baselineSelectedIds,
    semanticCandidateIds: [...semanticCandidateIds],
    applied: changed,
    reason,
  };
}

function extendReceipt({
  baseReceipt,
  envelope,
  preferredCapabilities,
  qualified,
  chosen = null,
  baseline = null,
  selections = [],
  semanticCandidateIds,
}) {
  const receipt = {
    ...baseReceipt,
    requestDigest: preferenceDigest(envelope),
    requestFeatures: {
      ...baseReceipt.requestFeatures,
      preferredCapabilities: [...preferredCapabilities],
    },
    decisionPolicy: PREFERENCE_DECISION_POLICY,
  };
  if (chosen !== null) {
    receipt.selectionKind = chosen.cards.length === 1 ? "single" : "composition";
    receipt.selectedIds = idsFor(chosen);
    receipt.selectedEntrypoints = chosen.cards.map(({ entrypoint }) => entrypoint);
    receipt.selectionConfidence = chosen.confidence;
  }
  receipt.preference = preferenceRecord({
    preferredCapabilities,
    qualified,
    chosen,
    baseline,
    status: receipt.status,
    selections,
    semanticCandidateIds,
  });
  return validatePreferenceRouteReceipt(receipt);
}

function validateSemanticCandidateIds(value, candidates) {
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) {
    throw new Error("semanticCandidateIds must be an array of strings");
  }
  if (new Set(value).size !== value.length
      || value.some((id, index) => index > 0 && value[index - 1] >= id)) {
    throw new Error("semanticCandidateIds must be sorted and unique");
  }
  const known = new Set(candidates.map(({ id }) => id));
  for (const id of value) {
    if (!known.has(id)) throw new Error(`unknown semantic candidate id: ${id}`);
  }
  return value;
}

export function routeCapabilities({ envelope, cards, semanticCandidateIds = undefined }) {
  const { baseEnvelope, preferredCapabilities } = splitPreferenceEnvelope(envelope);
  if (preferredCapabilities === undefined) {
    if (semanticCandidateIds !== undefined) {
      throw new Error("semanticCandidateIds require a preference-aware request");
    }
    return routeHistoricalCapabilities({ envelope: baseEnvelope, cards });
  }
  if (!Array.isArray(cards)) throw new TypeError("cards must be an array");
  const candidates = cards.map(validateRoutingCard).sort((left, right) => lexical(left.id, right.id));
  if (candidates.length > 32) throw new Error("router accepts at most 32 cards");
  for (let index = 1; index < candidates.length; index += 1) {
    if (candidates[index - 1].id === candidates[index].id) {
      throw new Error(`duplicate routing card id: ${candidates[index].id}`);
    }
  }
  const candidateIds = new Set(candidates.map(({ id }) => id));
  for (const id of preferredCapabilities) {
    if (!candidateIds.has(id)) throw new Error(`unknown preferred capability id: ${id}`);
  }

  const semanticIds = semanticCandidateIds === undefined
    ? candidates.map(({ id }) => id)
    : [...validateSemanticCandidateIds(semanticCandidateIds, candidates)];
  const semanticSet = new Set(semanticIds);
  const routingCandidates = candidates.filter(({ id }) => semanticSet.has(id));

  const historicalReceipt = routeHistoricalCapabilities({
    envelope: baseEnvelope,
    cards: routingCandidates,
  });
  const qualificationReceipt = semanticIds.length === candidates.length
    ? historicalReceipt
    : routeHistoricalCapabilities({ envelope: baseEnvelope, cards: candidates });
  const receiptBasis = {
    ...historicalReceipt,
    candidateIds: candidates.map(({ id }) => id),
    rejected: qualificationReceipt.rejected,
  };
  if (historicalReceipt.status === "needs-decision") {
    return extendReceipt({
      baseReceipt: receiptBasis,
      envelope,
      preferredCapabilities,
      qualified: [],
      semanticCandidateIds: semanticIds,
    });
  }
  const rejected = new Set(qualificationReceipt.rejected.map(({ id }) => id));
  const qualified = candidates.filter(({ id }) => !rejected.has(id));
  if (historicalReceipt.status === "no-qualified-route") {
    return extendReceipt({
      baseReceipt: receiptBasis,
      envelope,
      preferredCapabilities,
      qualified,
      semanticCandidateIds: semanticIds,
    });
  }

  const preferred = new Set(preferredCapabilities);
  const routingQualified = qualified.filter(({ id }) => semanticSet.has(id));
  const singles = routingQualified
    .filter((card) => covers(card.provides, baseEnvelope.requiredCapabilities)
      && requirementsSatisfied([card]))
    .map((card) => selection([card], baseEnvelope, preferred));
  const selections = singles.length > 0
    ? singles
    : compatibleCompositions(routingQualified, baseEnvelope)
      .map((values) => selection(values, baseEnvelope, preferred));
  if (selections.length === 0) {
    throw new Error("preference router diverged from historical selected route");
  }
  const baseline = [...selections].sort(compareHistorical)[0];
  const baselineIds = idsFor(baseline);
  if (baselineIds.length !== historicalReceipt.selectedIds.length
      || baselineIds.some((id, index) => id !== historicalReceipt.selectedIds[index])) {
    throw new Error("preference router historical baseline mismatch");
  }
  const chosen = [...selections].sort(comparePreferred)[0];
  return extendReceipt({
    baseReceipt: receiptBasis,
    envelope,
    preferredCapabilities,
    qualified,
    chosen,
    baseline,
    selections,
    semanticCandidateIds: semanticIds,
  });
}
