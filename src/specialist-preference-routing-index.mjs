import {
  buildRoutingIndex as buildHistoricalRoutingIndex,
  shortlistRoutingCards as shortlistHistoricalRoutingCards,
} from "./routing-index.mjs";
import { splitPreferenceEnvelope } from "./specialist-preference-contracts.mjs";

export const buildRoutingIndex = buildHistoricalRoutingIndex;

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function buildPreferenceRoutingShortlist(index, envelope, { limit = 32 } = {}) {
  const { baseEnvelope, preferredCapabilities } = splitPreferenceEnvelope(envelope);
  const historical = shortlistHistoricalRoutingCards(index, baseEnvelope, { limit });
  const semanticCandidateIds = historical.map(({ id }) => id).sort(lexical);
  if (preferredCapabilities === undefined) {
    return Object.freeze({
      cards: Object.freeze([...historical]),
      semanticCandidateIds: Object.freeze(semanticCandidateIds),
    });
  }
  const preferred = [];
  for (const id of preferredCapabilities) {
    const card = index?.cardsById?.[id];
    if (!card) throw new Error(`unknown preferred capability id: ${id}`);
    preferred.push(card);
  }
  const union = new Map(historical.map((card) => [card.id, card]));
  for (const card of preferred) union.set(card.id, card);
  if (union.size > limit) {
    throw new Error(`preference-aware shortlist exceeds bounded limit ${limit}`);
  }
  return Object.freeze({
    cards: Object.freeze([...union.values()].sort((left, right) => lexical(left.id, right.id))),
    semanticCandidateIds: Object.freeze(semanticCandidateIds),
  });
}

export function shortlistRoutingCards(index, envelope, options = {}) {
  return buildPreferenceRoutingShortlist(index, envelope, options).cards;
}
