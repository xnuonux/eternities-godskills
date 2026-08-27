import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { sha256 } from "../src/io.mjs";
import { buildRoutingIndex, shortlistRoutingCards } from "../src/routing-index.mjs";
import { routeCapabilities } from "../src/router.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

const repositoryRoot = new URL("../", import.meta.url);

async function json(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, repositoryRoot), "utf8"));
}

async function promotedCards() {
  const root = new URL("receipts/promotions/", repositoryRoot);
  const names = (await readdir(root)).filter((name) => name.endsWith(".json")).sort();
  const receipts = await Promise.all(names.map((name) => json(`receipts/promotions/${name}`)));
  const ids = receipts
    .filter(({ decision }) => decision?.status === "promoted")
    .map(({ skillName }) => skillName)
    .sort();
  return Promise.all(
    ids.map(async (id) => validateRoutingCard(await json(`skills/${id}/references/routing-card.json`))),
  );
}

const cases = [
  {
    expected: "eternities-agora",
    family: "agency-client-services",
    required: ["account-operations", "client-deliverables", "client-service-governance", "evidence-traceability", "prospect-assessment"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
    outcomes: [
      "reconcile prospect assessment account state and client deliverables from authorized evidence",
      "turn opportunity records and client findings into traceable operational and delivery artifacts",
      "several client service stages disagree so their evidence and artifacts need one bounded workflow",
    ],
  },
  {
    expected: "eternities-aegis",
    family: "governance-security",
    required: ["authorization", "findings", "mitigation", "residual-risk", "trust-boundaries"],
    effects: ["local-read", "local-write"],
    authority: ["authorized-security-scope", "local-read", "local-write"],
    preconditions: ["authorized-target"],
    maximumRisk: "high",
    outcomes: [
      "audit an authorized agent tool chain and rank mitigations by residual risk",
      "map the tool chain's trust boundaries and prioritize defensible risk reductions",
      "permissions changed across several tools, so authorization and remaining risk need review",
    ],
  },
  {
    expected: "eternities-architect",
    family: "architecture-specification",
    required: ["architecture", "decision", "handoff", "interfaces", "requirements"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
    outcomes: [
      "decide the interfaces and tradeoffs for a consequential new system",
      "turn these constraints into one implementation-ready system decision",
      "downstream construction is blocked until boundaries, failure behavior, and acceptance are settled",
    ],
  },
  {
    expected: "eternities-forge",
    family: "implementation-engineering",
    required: ["implementation", "integration", "review", "tests", "verification"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write", "repository-write"],
    preconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "moderate",
    outcomes: [
      "deliver a consequential feature with tests, review, proof, and integration",
      "carry this approved cross-component change through a verified handoff",
      "the design is settled and now needs coordinated construction, regression proof, and integration",
    ],
  },
  {
    expected: "eternities-mnemosyne",
    family: "knowledge-memory-context",
    required: ["continuity", "provenance", "retrieval-audit"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
    outcomes: [
      "recover the smallest reliable cross-session state and audit its provenance",
      "reconstruct a compact trustworthy handoff from conflicting task history",
      "frequent compaction is losing continuity, so retained state and retrieval evidence need reconciliation",
    ],
  },
  {
    expected: "eternities-muse",
    family: "visual-interface-narrative-media",
    required: ["accessibility", "art-direction", "motion-story", "visual-acceptance"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
    outcomes: [
      "reconcile visual identity, motion, accessibility, and deterministic acceptance",
      "shape one testable visual language across interface imagery and narrative movement",
      "the brand-critical experience has drifting art, motion, and accessibility systems that need one direction",
    ],
  },
  {
    expected: "eternities-oracle",
    family: "repository-research",
    required: ["local-evidence", "official-evidence", "provenance", "research", "synthesis"],
    effects: ["external-read", "local-read"],
    authority: ["external-read", "local-read"],
    preconditions: [],
    maximumRisk: "low",
    outcomes: [
      "reconcile local repository evidence with current official documentation",
      "determine whether our implementation agrees with the authoritative current contract",
      "a costly decision depends on evidence split between local files and drift-prone official sources",
    ],
  },
  {
    expected: "sovereign-skill-refinery",
    family: "skill-refinery",
    required: ["capability-contract", "evaluation", "promotion-decision", "source-synthesis"],
    effects: ["local-read", "local-write"],
    authority: ["local-read", "local-write"],
    preconditions: [],
    maximumRisk: "moderate",
    outcomes: [
      "synthesize overlapping workflow sources into an evaluated first-party capability",
      "combine competing methods without weakening their proven behavior and test the successor",
      "the workflow quarry is reviewed and now needs one independently authored candidate with a promotion verdict",
    ],
  },
];

function envelope(item, outcome, suffix, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `cert-${item.expected}-${suffix}`,
    outcome,
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
    ...overrides,
  };
}

function syntheticCard(index) {
  const suffix = String(index).padStart(4, "0");
  const capability = `synthetic-capability-${suffix}`;
  const id = `synthetic-${suffix}`;
  return {
    schemaVersion: 1,
    id,
    family: `synthetic-family-${String(index % 100).padStart(3, "0")}`,
    intent: `provide ${capability} from bounded evidence`,
    successCondition: `${capability} completes without expanded authority`,
    provides: [capability],
    requires: [],
    intentExamples: {
      direct: [`complete ${capability}`],
      paraphrased: [`handle the ${capability} outcome`],
      contextual: [`the mission requires ${capability}`],
    },
    negativeIntents: [`skip ${capability} for an unrelated request`],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 100,
    dependencyCost: 1,
    evidenceConfidence: "high",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: [],
  };
}

test("twenty-four unnamed outcome envelopes select the exact smallest capability", async () => {
  const cards = await promotedCards();
  const aliasFree = cards.map((card) => ({ ...card, legacyAliases: [] }));
  let caseCount = 0;

  for (const item of cases) {
    const selectedIds = [];
    for (const [index, outcome] of item.outcomes.entries()) {
      assert.equal(outcome.includes("/"), false);
      assert.equal(outcome.toLowerCase().includes("eternities"), false);
      const request = envelope(item, outcome, index);
      const receipt = routeCapabilities({ envelope: request, cards });
      const aliasFreeReceipt = routeCapabilities({ envelope: request, cards: aliasFree });
      assert.deepEqual(receipt.selectedIds, [item.expected]);
      assert.equal(receipt.selectionKind, "single");
      assert.deepEqual(aliasFreeReceipt, receipt);
      const serialized = JSON.stringify(receipt);
      for (const card of cards) {
        assert.equal(serialized.includes(card.entrypoint), card.id === item.expected);
      }
      selectedIds.push(receipt.selectedIds);
      caseCount += 1;
    }
    assert.deepEqual(selectedIds, [[item.expected], [item.expected], [item.expected]]);
  }

  assert.equal(caseCount, 24);
});

test("progressive disclosure remains bounded across five thousand compact cards", async () => {
  const promoted = await promotedCards();
  const cards = [
    ...promoted,
    ...Array.from({ length: 5000 - promoted.length }, (_, index) => syntheticCard(index)),
  ];
  const index = buildRoutingIndex(cards);
  const item = cases.find(({ expected }) => expected === "eternities-forge");
  const request = envelope(item, item.outcomes[0], "bounded");
  const shortlist = shortlistRoutingCards(index, request, { limit: 32 });
  const receipt = routeCapabilities({ envelope: request, cards: shortlist });

  assert.equal(index.cardCount, 5000);
  assert.ok(shortlist.length <= 32);
  assert.deepEqual(receipt.selectedIds, ["eternities-forge"]);
});

test("authority, effect, risk, and unresolved decisions fail closed", async () => {
  const cards = await promotedCards();
  const aegis = cards.find(({ id }) => id === "eternities-aegis");
  const aegisCase = cases.find(({ expected }) => expected === "eternities-aegis");
  const riskDenied = routeCapabilities({
    envelope: envelope(aegisCase, aegisCase.outcomes[0], "risk", { maximumRisk: "moderate" }),
    cards: [aegis],
  });
  assert.equal(riskDenied.status, "no-qualified-route");
  assert.deepEqual(riskDenied.rejected[0].reasons, ["risk-exceeds-maximum"]);

  const externalWriter = validateRoutingCard({
    ...aegis,
    id: "external-publisher",
    family: "external-publication",
    intent: "publish an approved artifact to an external destination",
    successCondition: "the approved artifact is externally published with a receipt",
    provides: ["publication"],
    intentExamples: {
      direct: ["publish the approved artifact"],
      paraphrased: ["send the finished artifact to its public destination"],
      contextual: ["the artifact is approved and awaits external publication"],
    },
    negativeIntents: ["draft an artifact without publishing"],
    effects: ["external-write"],
    riskClass: "moderate",
    authorityRequirements: ["external-write"],
    preconditions: [],
    compatibleWith: [],
    entrypoint: "skills/external-publisher/SKILL.md",
  });
  const effectDenied = routeCapabilities({
    envelope: {
      ...envelope(aegisCase, "publish an approved artifact", "effect"),
      candidateFamilies: ["external-publication"],
      requiredCapabilities: ["publication"],
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read"],
      availablePreconditions: [],
      maximumRisk: "moderate",
    },
    cards: [externalWriter],
  });
  assert.equal(effectDenied.status, "no-qualified-route");
  assert.deepEqual(effectDenied.rejected[0].reasons, ["authority-missing", "effect-not-permitted"]);

  const forgeCase = cases.find(({ expected }) => expected === "eternities-forge");
  const unresolved = routeCapabilities({
    envelope: envelope(forgeCase, forgeCase.outcomes[0], "unresolved", {
      unresolvedDecisions: ["repository-write-authority"],
    }),
    cards,
  });
  assert.equal(unresolved.status, "needs-decision");
  assert.deepEqual(unresolved.selectedIds, []);
});

test("Agora cannot cross its external, risk, or local-write authority boundary", async () => {
  const cards = await promotedCards();
  const agora = cards.find(({ id }) => id === "eternities-agora");
  const item = cases.find(({ expected }) => expected === "eternities-agora");

  const external = routeCapabilities({
    envelope: envelope(item, item.outcomes[0], "external", {
      permittedEffects: ["external-write"],
      availableAuthority: ["external-write"],
    }),
    cards: [agora],
  });
  assert.equal(external.status, "no-qualified-route");

  const lowRisk = routeCapabilities({
    envelope: envelope(item, item.outcomes[0], "low-risk", { maximumRisk: "low" }),
    cards: [agora],
  });
  assert.equal(lowRisk.status, "no-qualified-route");
  assert.deepEqual(lowRisk.rejected[0].reasons, ["risk-exceeds-maximum"]);

  const missingAuthority = routeCapabilities({
    envelope: envelope(item, item.outcomes[0], "missing-write", {
      availableAuthority: ["local-read"],
    }),
    cards: [agora],
  });
  assert.equal(missingAuthority.status, "no-qualified-route");
  assert.deepEqual(missingAuthority.rejected[0].reasons, ["authority-missing"]);
});

test("the certification receipt reconciles exact deterministic routing artifacts", async () => {
  const receipt = await json("receipts/agent-native-router-v2.json");
  const manifestText = await readFile(new URL("artifacts/routing/manifest.json", repositoryRoot), "utf8");
  const cardsText = await readFile(new URL("artifacts/routing/cards.jsonl", repositoryRoot), "utf8");
  const familyMapText = await readFile(new URL("artifacts/routing/family-map.json", repositoryRoot), "utf8");
  const manifest = JSON.parse(manifestText);

  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.id, "agent-native-router-v2");
  assert.equal(receipt.status, "certified");
  assert.equal(receipt.immutableGitBase, "b217591a91d3c5b96b5c7b7af0aabc16776de847");
  assert.deepEqual(receipt.inputs, manifest.inputs);
  assert.deepEqual(receipt.artifacts, {
    cardsSha256: sha256(cardsText),
    familyMapSha256: sha256(familyMapText),
    manifestSha256: sha256(manifestText),
  });
  assert.equal(receipt.artifacts.cardsSha256, manifest.outputs.cardsSha256);
  assert.equal(receipt.artifacts.familyMapSha256, manifest.outputs.familyMapSha256);
  assert.deepEqual(receipt.counts, {
    aliasRemovalCases: 24,
    cardCount: 8,
    commandlessCases: 24,
    familyCount: 8,
    maximumComposition: 3,
    maximumShortlist: 32,
  });
  assert.deepEqual(receipt.gates, {
    aliasRemovalEquality: true,
    authorityPreserved: true,
    deterministicArtifacts: true,
    effectsPreserved: true,
    progressiveDisclosureBounded: true,
    selectedEntrypointsOnly: true,
    unnamedOutcomeRouting: true,
    unresolvedDecisionsFailClosed: true,
  });
  assert.equal(receipt.proofLimits.liveModelNaturalLanguageInterpretation, "adapter-evaluation-required");
  assert.equal(JSON.stringify(receipt).includes("timestamp"), false);
});
