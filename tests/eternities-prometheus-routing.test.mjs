import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const root = new URL("../", import.meta.url);
const card = async () => validateRoutingCard(JSON.parse(await readFile(new URL("skills/eternities-prometheus/references/routing-card.json", root), "utf8")));
const envelope = (outcome, overrides = {}) => ({ schemaVersion: 1, requestId: "prometheus-test", outcome, candidateFamilies: ["product-operations"], requiredCapabilities: ["commercial-analytics"], forbiddenCapabilities: [], permittedEffects: ["local-read", "local-write"], availableAuthority: ["local-read", "local-write"], availablePreconditions: [], maximumRisk: "moderate", minimumEvidenceConfidence: "verified", contextBudget: 4000, maxCompositionSize: 3, unresolvedDecisions: [], ...overrides });

test("Prometheus routes unnamed direct, paraphrased, and contextual requests", async () => {
  const value = await card();
  for (const outcome of [
    "route growth questions to the narrowest customer, sales, revenue, or proposal analysis",
    "analyze supplied pricing pipeline forecast and efficiency measures",
    "turn customer evidence into bounded themes and learning decisions",
    "qualify early users from public evidence without contacting them",
    "construct a learner progression with checkpoints and adaptation",
    "frame demand decisions dependencies and capacity into a plan",
    "select a focused project delivery lens with handoffs and checkpoints",
  ]) {
    const result = routeCapabilities({ envelope: envelope(outcome), cards: [value] });
    assert.deepEqual(result.selectedIds, ["eternities-prometheus"]);
  }
});

test("Prometheus fails closed on effects, authority, unresolved decisions, and specialist boundaries", async () => {
  const value = await card();
  for (const overrides of [
    { permittedEffects: ["external-write"], availableAuthority: ["external-write"] },
    { requiredCapabilities: ["procurement"] },
    { requiredCapabilities: ["private-data-acquisition"] },
    { forbiddenCapabilities: ["commercial-analytics"] },
  ]) assert.equal(routeCapabilities({ envelope: envelope("operate on the customer account", overrides), cards: [value] }).status, "no-qualified-route");
  assert.equal(routeCapabilities({ envelope: envelope("analyze a pricing change", { unresolvedDecisions: ["commercial-policy"] }), cards: [value] }).status, "needs-decision");
});
