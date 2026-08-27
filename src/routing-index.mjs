import {
  EVIDENCE_LEVELS,
  validateRequestEnvelope,
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

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

export function buildRoutingIndex(cards) {
  if (!Array.isArray(cards)) throw new TypeError("routing cards must be an array");
  const ordered = cards.map(validateRoutingCard).sort((left, right) =>
    lexicalCompare(left.id, right.id),
  );
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index - 1].id === ordered[index].id) {
      throw new Error(`duplicate routing card id: ${ordered[index].id}`);
    }
  }

  const families = new Map();
  const capabilities = new Map();
  const cardsById = {};
  for (const card of ordered) {
    cardsById[card.id] = card;
    const family = families.get(card.family) ?? { cardIds: [], provides: [] };
    family.cardIds.push(card.id);
    family.provides.push(...card.provides);
    families.set(card.family, family);
    for (const capability of card.provides) {
      const ids = capabilities.get(capability) ?? [];
      ids.push(card.id);
      capabilities.set(capability, ids);
    }
  }

  const familyMap = [...families.entries()]
    .sort(([left], [right]) => lexicalCompare(left, right))
    .map(([id, value]) => ({
      id,
      cardCount: value.cardIds.length,
      provides: sorted(value.provides),
      cardIds: sorted(value.cardIds),
    }));
  const capabilityIndex = Object.fromEntries(
    [...capabilities.entries()]
      .sort(([left], [right]) => lexicalCompare(left, right))
      .map(([capability, ids]) => [capability, sorted(ids)]),
  );

  return {
    schemaVersion: 1,
    cardCount: ordered.length,
    familyMap,
    capabilityIndex,
    cardsById,
  };
}

function validateIndex(index) {
  object(index, "routingIndex");
  if (index.schemaVersion !== 1) throw new Error("routingIndex.schemaVersion must be 1");
  if (!Number.isInteger(index.cardCount) || index.cardCount < 0) {
    throw new Error("routingIndex.cardCount must be a non-negative integer");
  }
  if (!Array.isArray(index.familyMap)) throw new Error("routingIndex.familyMap must be an array");
  object(index.capabilityIndex, "routingIndex.capabilityIndex");
  object(index.cardsById, "routingIndex.cardsById");
  if (Object.keys(index.cardsById).length !== index.cardCount) {
    throw new Error("routingIndex.cardCount does not match cardsById");
  }
  return index;
}

function unionInto(target, values) {
  for (const value of values) target.add(value);
}

function matchingCount(card, required) {
  const available = new Set(card.provides);
  return required.filter((capability) => available.has(capability)).length;
}

function compareCards(left, right, required) {
  const leftMatches = matchingCount(left, required);
  const rightMatches = matchingCount(right, required);
  const leftComplete = leftMatches === required.length ? 0 : 1;
  const rightComplete = rightMatches === required.length ? 0 : 1;
  return (
    leftComplete - rightComplete ||
    rightMatches - leftMatches ||
    left.contextCost - right.contextCost ||
    EVIDENCE_LEVELS.indexOf(left.evidenceConfidence) -
      EVIDENCE_LEVELS.indexOf(right.evidenceConfidence) ||
    lexicalCompare(left.id, right.id)
  );
}

export function shortlistRoutingCards(index, envelope, { limit = 32 } = {}) {
  const validatedIndex = validateIndex(index);
  const request = validateRequestEnvelope(envelope);
  if (!Number.isInteger(limit) || limit < 1 || limit > 32) {
    throw new Error("limit must be an integer from 1 to 32");
  }

  const familyIds = new Set();
  for (const family of validatedIndex.familyMap) {
    if (request.candidateFamilies.includes(family.id)) {
      unionInto(familyIds, family.cardIds);
    }
  }
  const capabilityIds = new Set();
  for (const capability of request.requiredCapabilities) {
    unionInto(capabilityIds, validatedIndex.capabilityIndex[capability] ?? []);
  }

  let candidateIds;
  if (familyIds.size > 0 && capabilityIds.size > 0) {
    candidateIds = [...familyIds].filter((id) => capabilityIds.has(id));
  } else if (familyIds.size > 0) {
    candidateIds = [...familyIds];
  } else {
    candidateIds = [...capabilityIds];
  }

  return candidateIds
    .map((id) => validatedIndex.cardsById[id])
    .filter(Boolean)
    .sort((left, right) => compareCards(left, right, request.requiredCapabilities))
    .slice(0, limit);
}
