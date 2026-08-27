import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";

import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const repositoryRoot = new URL("../", import.meta.url);

async function json(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function promotedIds() {
  const root = new URL("receipts/promotions/", repositoryRoot);
  const names = (await readdir(root)).filter((name) => name.endsWith(".json")).sort();
  const rows = await Promise.all(names.map((name) => json(new URL(name, root))));
  return rows
    .filter(({ decision }) => decision?.status === "promoted")
    .map(({ skillName }) => skillName)
    .sort();
}

async function routingCard(id) {
  return validateRoutingCard(
    await json(new URL(`skills/${id}/references/routing-card.json`, repositoryRoot)),
  );
}

const cases = [
  {
    expected: "eternities-beacon",
    outcome: "turn verified market truth into positioning offers demand lifecycle and accountable growth",
    family: "marketing-growth",
    required: ["conversion-and-lifecycle-systems", "discoverability-and-search-systems", "go-to-market-and-demand-systems", "growth-measurement-and-stewardship", "market-truth-and-positioning", "offer-and-commercial-architecture"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-chorus",
    outcome: "connect identity editorial production community stewardship and measured learning",
    family: "social-media-community",
    required: ["community-operations", "editorial-production", "identity-and-channel-strategy", "measurement-and-stewardship"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-arcadia",
    outcome: "reconcile game direction runtime systems player experience and proof into one playable advance",
    family: "game-design-development",
    required: ["game-direction", "player-experience", "proof-and-release", "runtime-systems"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-agora",
    outcome: "reconcile prospect assessment account state and client deliverables from authorized evidence",
    family: "agency-client-services",
    required: ["account-operations", "client-deliverables", "client-service-governance", "evidence-traceability", "prospect-assessment"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-aegis",
    outcome: "audit an authorized agent tool chain and rank mitigations by residual risk",
    family: "governance-security",
    required: ["authorization", "findings", "mitigation", "residual-risk", "trust-boundaries"],
    effects: ["local-read", "local-write"],
    authority: ["authorized-security-scope", "local-read", "local-write"],
    preconditions: ["authorized-target"],
    maximumRisk: "high",
  },
  {
    expected: "eternities-architect",
    outcome: "decide the interfaces and tradeoffs for a consequential new system",
    family: "architecture-specification",
    required: ["architecture", "decision", "handoff", "interfaces", "requirements"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-forge",
    outcome: "deliver a consequential feature with tests, review, proof, and integration",
    family: "implementation-engineering",
    required: ["implementation", "integration", "review", "tests", "verification"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write", "repository-write"],
    preconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-mnemosyne",
    outcome: "recover the smallest reliable cross-session state and audit its provenance",
    family: "knowledge-memory-context",
    required: ["continuity", "provenance", "retrieval-audit"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-muse",
    outcome: "reconcile visual identity, motion, accessibility, and deterministic acceptance",
    family: "visual-interface-narrative-media",
    required: ["accessibility", "art-direction", "motion-story", "visual-acceptance"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
  {
    expected: "eternities-oracle",
    outcome: "reconcile local repository evidence with current official documentation",
    family: "repository-research",
    required: ["local-evidence", "official-evidence", "provenance", "research", "synthesis"],
    effects: ["external-read", "local-read"],
    authority: ["external-read", "local-read"],
    preconditions: [],
    maximumRisk: "low",
  },
  {
    expected: "sovereign-skill-refinery",
    outcome: "synthesize overlapping workflow sources into an evaluated first-party capability",
    family: "skill-refinery",
    required: ["capability-contract", "evaluation", "promotion-decision", "source-synthesis"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
  },
];

function envelope(item) {
  return {
    schemaVersion: 1,
    requestId: `request-${item.expected}`,
    outcome: item.outcome,
    candidateFamilies: [item.family],
    requiredCapabilities: item.required,
    forbiddenCapabilities: [],
    permittedEffects: item.effects,
    availableAuthority: item.authority,
    availablePreconditions: item.preconditions,
    maximumRisk: item.maximumRisk,
    minimumEvidenceConfidence: "verified",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
  };
}

test("every promoted Eternities capability exposes one exact compact routing card", async () => {
  const ids = await promotedIds();
  assert.deepEqual(ids, [
    "eternities-aegis",
    "eternities-agora",
    "eternities-arcadia",
    "eternities-architect",
    "eternities-beacon",
    "eternities-chorus",
    "eternities-forge",
    "eternities-mnemosyne",
    "eternities-muse",
    "eternities-oracle",
    "sovereign-skill-refinery",
  ]);

  for (const id of ids) {
    const card = await routingCard(id);
    const receipt = await json(
      new URL(`receipts/promotions/${id}.json`, repositoryRoot),
    );
    assert.equal(card.id, id);
    assert.equal(card.entrypoint, `skills/${id}/SKILL.md`);
    assert.equal(card.contextCost, receipt.evidence.measuredTokenCount);
    await access(new URL(card.entrypoint, repositoryRoot));
    for (const examples of Object.values(card.intentExamples)) {
      assert.ok(examples.every((example) => !example.startsWith("/")));
    }
  }
});

test("promoted cards route from unnamed outcomes and ignore every legacy alias", async () => {
  const cards = await Promise.all((await promotedIds()).map(routingCard));
  const aliasFree = cards.map((card) => ({ ...card, legacyAliases: [] }));

  for (const item of cases) {
    assert.equal(item.outcome.includes("/"), false);
    assert.equal(item.outcome.includes("eternities"), false);
    const selected = routeCapabilities({ envelope: envelope(item), cards });
    const selectedAliasFree = routeCapabilities({
      envelope: envelope(item),
      cards: aliasFree,
    });
    assert.deepEqual(selected.selectedIds, [item.expected]);
    assert.deepEqual(selectedAliasFree, selected);
  }
});
