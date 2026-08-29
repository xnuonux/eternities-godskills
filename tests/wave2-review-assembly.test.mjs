import assert from "node:assert/strict";
import test from "node:test";

import { assemblePacketReviews } from "../src/wave2-review-assembly.mjs";

const packet = { cards: [{ facetId: "facet-a" }, { facetId: "facet-b" }] };

test("assembles generated and manual reviews into exact packet membership", () => {
  const reviews = assemblePacketReviews(
    packet,
    [{ facetId: "facet-b", source: "generated" }],
    [{ facetId: "facet-a", source: "manual" }],
  );
  assert.deepEqual(reviews.map((review) => review.facetId), ["facet-a", "facet-b"]);
});

test("fails closed on missing, duplicate, or foreign review membership", () => {
  assert.throws(() => assemblePacketReviews(packet, [], [{ facetId: "facet-a" }]), /missing/);
  assert.throws(
    () =>
      assemblePacketReviews(
        packet,
        [{ facetId: "facet-a" }],
        [{ facetId: "facet-a" }, { facetId: "facet-b" }],
      ),
    /duplicate/,
  );
  assert.throws(
    () => assemblePacketReviews(packet, [{ facetId: "facet-b" }], [{ facetId: "facet-x" }]),
    /foreign/,
  );
});
