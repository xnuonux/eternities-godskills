import { sha256 } from "./io.mjs";
import {
  DECISION_POLICY,
  EVIDENCE_LEVELS,
  effectCost,
  evidenceAtLeast,
  riskAtMost,
  validateRequestEnvelope,
  validateRouteReceipt,
  validateRoutingCard,
} from "./routing-contracts.mjs";

function lexicalCompare(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sorted(values) {
  return [...new Set(values)].sort(lexicalCompare);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(lexicalCompare)
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function requestDigest(request) {
  return sha256(JSON.stringify(stableValue(request)));
}

function requestFeatures(request) {
  return {
    candidateFamilies: [...request.candidateFamilies],
    requiredCapabilities: [...request.requiredCapabilities],
    permittedEffects: [...request.permittedEffects],
    maximumRisk: request.maximumRisk,
    minimumEvidenceConfidence: request.minimumEvidenceConfidence,
    contextBudget: request.contextBudget,
  };
}

function covers(provides, requirements) {
  const available = new Set(provides);
  return requirements.every((requirement) => available.has(requirement));
}

function policyReasons(request, card) {
  const reasons = [];
  if (
    request.candidateFamilies.length > 0 &&
    !request.candidateFamilies.includes(card.family)
  ) {
    reasons.push("family-mismatch");
  }
  if (card.provides.some((capability) => request.forbiddenCapabilities.includes(capability))) {
    reasons.push("forbidden-capability");
  }
  if (
    card.effects.some(
      (effect) => effect !== "none" && !request.permittedEffects.includes(effect),
    )
  ) {
    reasons.push("effect-not-permitted");
  }
  if (!riskAtMost(card.riskClass, request.maximumRisk)) {
    reasons.push("risk-exceeds-maximum");
  }
  if (!evidenceAtLeast(card.evidenceConfidence, request.minimumEvidenceConfidence)) {
    reasons.push("evidence-below-minimum");
  }
  if (
    card.authorityRequirements.some(
      (authority) => !request.availableAuthority.includes(authority),
    )
  ) {
    reasons.push("authority-missing");
  }
  if (
    card.preconditions.some(
      (precondition) => !request.availablePreconditions.includes(precondition),
    )
  ) {
    reasons.push("precondition-missing");
  }
  if (card.contextCost > request.contextBudget) reasons.push("context-budget-exceeded");
  return sorted(reasons);
}

function filterCards(request, cards) {
  const qualified = [];
  const rejected = [];
  for (const card of cards) {
    const reasons = policyReasons(request, card);
    if (reasons.length === 0) qualified.push(card);
    else rejected.push({ id: card.id, reasons });
  }
  rejected.sort((left, right) => lexicalCompare(left.id, right.id));
  return { qualified, rejected };
}

function compatiblePair(left, right) {
  return (
    left.compatibleWith.includes(right.id) &&
    right.compatibleWith.includes(left.id) &&
    !left.conflictsWith.includes(right.id) &&
    !right.conflictsWith.includes(left.id)
  );
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
  const ordered = [...cards].sort((left, right) => lexicalCompare(left.id, right.id));
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
  const index = Math.max(
    ...cards.map(({ evidenceConfidence }) => EVIDENCE_LEVELS.indexOf(evidenceConfidence)),
  );
  return EVIDENCE_LEVELS[index];
}

function selection(cards, request) {
  const ordered = [...cards].sort((left, right) => lexicalCompare(left.id, right.id));
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
    idKey: ordered.map(({ id }) => id).join("+"),
    confidence: confidenceFor(ordered),
  };
}

export function compareSelections(left, right) {
  return (
    left.uncoveredCount - right.uncoveredCount ||
    left.cards.length - right.cards.length ||
    left.extraCapabilityCount - right.extraCapabilityCount ||
    left.effectCost - right.effectCost ||
    left.contextCost - right.contextCost ||
    left.dependencyCost - right.dependencyCost ||
    left.evidencePenalty - right.evidencePenalty ||
    lexicalCompare(left.idKey, right.idKey)
  );
}

function receiptBase(request, cards, rejected) {
  return {
    schemaVersion: 1,
    requestId: request.requestId,
    requestDigest: requestDigest(request),
    requestFeatures: requestFeatures(request),
    candidateIds: cards.map(({ id }) => id),
    rejected,
    unresolvedDecisions: [...request.unresolvedDecisions],
    decisionPolicy: DECISION_POLICY,
  };
}

function needsDecisionReceipt(request, cards) {
  return validateRouteReceipt({
    ...receiptBase(request, cards, []),
    status: "needs-decision",
    selectionKind: "none",
    selectedIds: [],
    selectedEntrypoints: [],
    selectionConfidence: null,
  });
}

function noRouteReceipt(request, cards, rejected) {
  return validateRouteReceipt({
    ...receiptBase(request, cards, rejected),
    status: "no-qualified-route",
    selectionKind: "none",
    selectedIds: [],
    selectedEntrypoints: [],
    selectionConfidence: null,
  });
}

function selectedReceipt(request, cards, rejected, chosen) {
  return validateRouteReceipt({
    ...receiptBase(request, cards, rejected),
    status: "selected",
    selectionKind: chosen.cards.length === 1 ? "single" : "composition",
    selectedIds: chosen.cards.map(({ id }) => id),
    selectedEntrypoints: chosen.cards.map(({ entrypoint }) => entrypoint),
    selectionConfidence: chosen.confidence,
  });
}

export function routeCapabilities({ envelope, cards }) {
  const request = validateRequestEnvelope(envelope);
  if (!Array.isArray(cards)) throw new TypeError("cards must be an array");
  const candidates = cards.map(validateRoutingCard).sort((left, right) =>
    lexicalCompare(left.id, right.id),
  );
  if (candidates.length > 32) throw new Error("router accepts at most 32 cards");
  for (let index = 1; index < candidates.length; index += 1) {
    if (candidates[index - 1].id === candidates[index].id) {
      throw new Error(`duplicate routing card id: ${candidates[index].id}`);
    }
  }
  if (request.unresolvedDecisions.length > 0) {
    return needsDecisionReceipt(request, candidates);
  }

  const { qualified, rejected } = filterCards(request, candidates);
  const singles = qualified
    .filter(
      (card) =>
        covers(card.provides, request.requiredCapabilities) &&
        requirementsSatisfied([card]),
    )
    .map((card) => selection([card], request));
  const selections = singles.length > 0
    ? singles
    : compatibleCompositions(qualified, request).map((values) => selection(values, request));
  if (selections.length === 0) return noRouteReceipt(request, candidates, rejected);
  selections.sort(compareSelections);
  return selectedReceipt(request, candidates, rejected, selections[0]);
}
