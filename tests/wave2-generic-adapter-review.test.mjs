import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  buildGenericRubeAdapterReview,
  inspectGenericRubeAdapterBody,
  normalizeRubeAdapterTemplate,
} from "../src/wave2-generic-adapter-review.mjs";

const body = `---
name: alpha-automation
description: "Automate Alpha tasks via Rube MCP (Composio)."
---

# Alpha Automation via Rube MCP

Automate Alpha operations through an adapter.
`;

const equivalentBody = body
  .replaceAll("alpha-automation", "beta-automation")
  .replaceAll("Alpha", "Beta");

function cardFor(value, name = "alpha-automation") {
  return {
    facetId: "facet-test",
    canonicalSourceId: `ComposioHQ/awesome-claude-skills@commit:composio-skills/${name}/SKILL.md`,
    bodySha256: createHash("sha256").update(value).digest("hex"),
    bodyBytes: Buffer.byteLength(value),
    name,
  };
}

test("normalizes toolkit substitutions without erasing added behavior", () => {
  assert.equal(
    normalizeRubeAdapterTemplate(body, "alpha-automation"),
    normalizeRubeAdapterTemplate(equivalentBody, "beta-automation"),
  );
  assert.notEqual(
    normalizeRubeAdapterTemplate(`${body}\n## Domain operation\nCreate a record.\n`),
    normalizeRubeAdapterTemplate(body),
  );
});

test("inspection fails closed on stale evidence and unapproved templates", () => {
  const digest = createHash("sha256")
    .update(normalizeRubeAdapterTemplate(body, "alpha-automation"))
    .digest("hex");
  const card = cardFor(body);
  assert.throws(
    () => inspectGenericRubeAdapterBody({ ...card, bodyBytes: card.bodyBytes + 1 }, body, [digest]),
    /byte count mismatch/,
  );
  assert.throws(
    () => inspectGenericRubeAdapterBody(card, body.replace("Alpha", "Omega"), [digest]),
    /body digest mismatch/,
  );
  assert.throws(
    () => inspectGenericRubeAdapterBody(card, body, ["0".repeat(64)]),
    /template digest is not approved/,
  );
});

test("builds a provider-specific rejected review only for an approved empty template", () => {
  const digest = createHash("sha256")
    .update(normalizeRubeAdapterTemplate(body, "alpha-automation"))
    .digest("hex");
  const review = buildGenericRubeAdapterReview(cardFor(body), body, [digest]);
  assert.equal(review.disposition, "rejected");
  assert.equal(review.proposedCluster, "generic-unbounded-rube-adapter-bootstrap");
  assert.equal(review.providerCoupling, "provider-bound");
  assert.match(review.neutralCapabilitySummary, /Alpha/);
  assert.ok(review.operations.every((operation) => operation.includes("Alpha")));
  assert.equal(review.copiedSourceProse, false);
  assert.equal(review.promotionClaim, false);
});
