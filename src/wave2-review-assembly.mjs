export function assemblePacketReviews(packet, generatedReviews, manualReviews) {
  if (!Array.isArray(packet?.cards) || packet.cards.length === 0) {
    throw new Error("packet cards are required");
  }
  const expected = new Set(packet.cards.map((card) => card.facetId));
  const assembled = new Map();
  for (const review of [...generatedReviews, ...manualReviews]) {
    if (!expected.has(review?.facetId)) {
      throw new Error(`foreign review facet: ${review?.facetId}`);
    }
    if (assembled.has(review.facetId)) {
      throw new Error(`duplicate review facet: ${review.facetId}`);
    }
    assembled.set(review.facetId, review);
  }
  const missing = [...expected].filter((facetId) => !assembled.has(facetId));
  if (missing.length > 0) {
    throw new Error(`missing review facets: ${missing.join(", ")}`);
  }
  return [...assembled.values()].sort((left, right) => left.facetId.localeCompare(right.facetId));
}
