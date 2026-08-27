import test from "node:test";
import assert from "node:assert/strict";

import { routeCapabilities } from "../src/router.mjs";

function envelope(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "request-commandless-feature",
    outcome: "deliver a consequential feature with tests, review, and proof",
    candidateFamilies: ["implementation-engineering"],
    requiredCapabilities: ["implementation", "review", "tests", "verification"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write", "repository-write"],
    availablePreconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "medium",
    contextBudget: 4000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
    ...overrides,
  };
}

function card(overrides = {}) {
  const id = overrides.id ?? "eternities-forge";
  return {
    schemaVersion: 1,
    id,
    family: "implementation-engineering",
    intent: "deliver a consequential multi-stage software change",
    successCondition: "implementation, review, and verification are evidenced",
    provides: ["implementation", "integration", "review", "tests", "verification"],
    requires: [],
    intentExamples: {
      direct: ["deliver a consequential feature across several engineering phases"],
      paraphrased: [
        "carry this approved change through implementation, review, and proof",
      ],
      contextual: ["the design is settled and now needs a verified repository delivery"],
    },
    negativeIntents: ["routine one-file edit"],
    effects: ["local-read", "local-write"],
    riskClass: "moderate",
    authorityRequirements: ["local-read", "local-write", "repository-write"],
    preconditions: ["repository-present", "settled-outcome"],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 998,
    dependencyCost: 8,
    evidenceConfidence: "verified",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: ["/forge"],
    ...overrides,
  };
}

function withoutAliases(cards) {
  return cards.map((value) => ({ ...value, legacyAliases: [] }));
}

test("router selects one complete least-effect card without consulting aliases", () => {
  const cards = [
    card({
      id: "eternities-broad-forge",
      effects: ["external-write", "local-read", "local-write"],
      contextCost: 2998,
      provides: [
        "implementation",
        "integration",
        "publication",
        "review",
        "tests",
        "verification",
      ],
    }),
    card(),
    card({
      id: "eternities-narrow-implementation",
      provides: ["implementation", "tests", "verification"],
    }),
  ];

  const receipt = routeCapabilities({ envelope: envelope(), cards });
  const aliasFree = routeCapabilities({ envelope: envelope(), cards: withoutAliases(cards) });

  assert.equal(receipt.status, "selected");
  assert.equal(receipt.selectionKind, "single");
  assert.deepEqual(receipt.candidateIds, [
    "eternities-broad-forge",
    "eternities-forge",
    "eternities-narrow-implementation",
  ]);
  assert.deepEqual(receipt.selectedIds, ["eternities-forge"]);
  assert.deepEqual(receipt.selectedEntrypoints, ["skills/eternities-forge/SKILL.md"]);
  assert.equal(receipt.selectionConfidence, "verified");
  assert.deepEqual(receipt.rejected, [
    { id: "eternities-broad-forge", reasons: ["effect-not-permitted"] },
  ]);
  assert.deepEqual(aliasFree, receipt);
});

test("single-card ranking prefers narrower coverage before context cost", () => {
  const cards = [
    card({ id: "broad", entrypoint: "skills/broad/SKILL.md", contextCost: 100 }),
    card({
      id: "exact",
      entrypoint: "skills/exact/SKILL.md",
      contextCost: 1200,
      provides: ["implementation", "review", "tests", "verification"],
    }),
  ];

  const receipt = routeCapabilities({ envelope: envelope(), cards });

  assert.deepEqual(receipt.selectedIds, ["exact"]);
});

test("unresolved user decisions pause routing before capability selection", () => {
  const receipt = routeCapabilities({
    envelope: envelope({ unresolvedDecisions: ["confirm repository write authority"] }),
    cards: [card()],
  });

  assert.equal(receipt.status, "needs-decision");
  assert.equal(receipt.selectionKind, "none");
  assert.deepEqual(receipt.selectedIds, []);
  assert.deepEqual(receipt.unresolvedDecisions, ["confirm repository write authority"]);
});

test("policy filters record authority, risk, evidence, forbidden, and family failures", () => {
  const cards = [
    card({ id: "authority", entrypoint: "skills/authority/SKILL.md" }),
    card({
      id: "evidence",
      entrypoint: "skills/evidence/SKILL.md",
      evidenceConfidence: "low",
    }),
    card({
      id: "family",
      entrypoint: "skills/family/SKILL.md",
      family: "release-publishing",
    }),
    card({
      id: "forbidden",
      entrypoint: "skills/forbidden/SKILL.md",
      provides: [
        "external-publish",
        "implementation",
        "integration",
        "review",
        "tests",
        "verification",
      ],
    }),
    card({
      id: "risk",
      entrypoint: "skills/risk/SKILL.md",
      riskClass: "high",
    }),
  ];
  const request = envelope({
    availableAuthority: ["local-read", "local-write"],
    forbiddenCapabilities: ["external-publish"],
  });

  const receipt = routeCapabilities({ envelope: request, cards });

  assert.equal(receipt.status, "no-qualified-route");
  assert.deepEqual(receipt.rejected, [
    { id: "authority", reasons: ["authority-missing"] },
    { id: "evidence", reasons: ["authority-missing", "evidence-below-minimum"] },
    { id: "family", reasons: ["authority-missing", "family-mismatch"] },
    {
      id: "forbidden",
      reasons: ["authority-missing", "forbidden-capability"],
    },
    { id: "risk", reasons: ["authority-missing", "risk-exceeds-maximum"] },
  ]);
});

test("incomplete coverage returns no qualified route instead of the nearest card", () => {
  const receipt = routeCapabilities({
    envelope: envelope(),
    cards: [
      card({
        id: "partial",
        entrypoint: "skills/partial/SKILL.md",
        provides: ["implementation", "tests", "verification"],
      }),
    ],
  });

  assert.equal(receipt.status, "no-qualified-route");
  assert.deepEqual(receipt.selectedIds, []);
  assert.deepEqual(receipt.candidateIds, ["partial"]);
  assert.deepEqual(receipt.rejected, []);
});

function compositionFixture() {
  const implementation = card({
    id: "implementation",
    entrypoint: "skills/implementation/SKILL.md",
    provides: ["implementation"],
    effects: ["local-read"],
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: ["verification"],
    contextCost: 400,
    dependencyCost: 1,
  });
  const verification = card({
    id: "verification",
    entrypoint: "skills/verification/SKILL.md",
    provides: ["verification"],
    effects: ["local-read"],
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: ["implementation"],
    contextCost: 500,
    dependencyCost: 1,
  });
  const request = envelope({
    requiredCapabilities: ["implementation", "verification"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    permittedEffects: ["local-read"],
    contextBudget: 1000,
  });
  return { implementation, verification, request };
}

test("router composes the smallest explicitly compatible set when no single qualifies", () => {
  const { implementation, verification, request } = compositionFixture();

  const receipt = routeCapabilities({ envelope: request, cards: [verification, implementation] });

  assert.equal(receipt.status, "selected");
  assert.equal(receipt.selectionKind, "composition");
  assert.deepEqual(receipt.selectedIds, ["implementation", "verification"]);
});

test("one complete card supersedes an otherwise valid composition", () => {
  const { implementation, verification, request } = compositionFixture();
  const complete = card({
    id: "complete",
    entrypoint: "skills/complete/SKILL.md",
    provides: ["implementation", "verification"],
    effects: ["local-read"],
    authorityRequirements: ["local-read"],
    preconditions: [],
    contextCost: 950,
  });

  const receipt = routeCapabilities({
    envelope: request,
    cards: [implementation, verification, complete],
  });

  assert.equal(receipt.selectionKind, "single");
  assert.deepEqual(receipt.selectedIds, ["complete"]);
});

test("composition fails closed on asymmetric compatibility or explicit conflict", () => {
  const { implementation, verification, request } = compositionFixture();
  const asymmetric = { ...verification, compatibleWith: [] };
  const conflict = { ...verification, conflictsWith: ["implementation"] };

  assert.equal(
    routeCapabilities({ envelope: request, cards: [implementation, asymmetric] }).status,
    "no-qualified-route",
  );
  assert.equal(
    routeCapabilities({ envelope: request, cards: [implementation, conflict] }).status,
    "no-qualified-route",
  );
});

test("composition obeys aggregate context and maximum-card limits", () => {
  const { implementation, verification, request } = compositionFixture();
  const overBudget = envelope({
    ...request,
    contextBudget: 800,
  });
  assert.equal(
    routeCapabilities({ envelope: overBudget, cards: [implementation, verification] }).status,
    "no-qualified-route",
  );

  const design = card({
    id: "design",
    entrypoint: "skills/design/SKILL.md",
    provides: ["design"],
    effects: ["local-read"],
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: ["implementation", "verification"],
    contextCost: 100,
    dependencyCost: 1,
  });
  const implementationForThree = {
    ...implementation,
    compatibleWith: ["design", "verification"],
  };
  const verificationForThree = {
    ...verification,
    compatibleWith: ["design", "implementation"],
  };
  const threeCapabilityRequest = envelope({
    requiredCapabilities: ["design", "implementation", "verification"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    permittedEffects: ["local-read"],
    contextBudget: 2000,
    maxCompositionSize: 2,
  });

  assert.equal(
    routeCapabilities({
      envelope: threeCapabilityRequest,
      cards: [design, implementationForThree, verificationForThree],
    }).status,
    "no-qualified-route",
  );
});

test("router rejects duplicate ids and more than 32 cold-retrieval candidates", () => {
  assert.throws(
    () => routeCapabilities({ envelope: envelope(), cards: [card(), card()] }),
    /duplicate routing card id: eternities-forge/,
  );
  const cards = Array.from({ length: 33 }, (_, index) =>
    card({
      id: `skill-${String(index).padStart(2, "0")}`,
      entrypoint: `skills/skill-${String(index).padStart(2, "0")}/SKILL.md`,
    }),
  );
  assert.throws(
    () => routeCapabilities({ envelope: envelope(), cards }),
    /router accepts at most 32 cards/,
  );
});
