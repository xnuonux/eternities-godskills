import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { compileIntent } from "../src/intent-compiler.mjs";

const root = new URL("../", import.meta.url);

async function cards() {
  return (await readFile(new URL("artifacts/routing/cards.jsonl", root), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
}

function context(overrides = {}) {
  return {
    permittedEffects: ["external-read", "local-read", "local-write"],
    availableAuthority: [
      "authorized-security-scope",
      "external-read",
      "human-review-for-deferred-routes",
      "local-read",
      "local-write",
      "repository-write",
      "rights-and-consent-when-applicable",
    ],
    availablePreconditions: ["repository-present", "settled-outcome"],
    forbiddenCapabilities: [],
    maximumRisk: "high",
    minimumEvidenceConfidence: "verified",
    contextBudget: 6000,
    maxCompositionSize: 3,
    ...overrides,
  };
}

function request(text, overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: `intent-${text.length}`,
    text,
    context: context(),
    ...overrides,
  };
}

function syntheticCard({ id, family, intent, provides }) {
  return {
    schemaVersion: 1,
    id,
    family,
    intent,
    successCondition: `${intent} completes locally`,
    provides,
    requires: [],
    intentExamples: {
      direct: [intent],
      paraphrased: [`please ${intent}`],
      contextual: [`the mission needs ${intent}`],
    },
    negativeIntents: [`do not ${intent}`],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 100,
    dependencyCost: 0,
    evidenceConfidence: "verified",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: [],
  };
}

const positiveCases = [
  [
    "eternities-architect",
    "resolve conflicting runtime constraints into an implementation-ready system architecture with explicit tradeoff decisions",
  ],
  [
    "eternities-aegis",
    "audit an authorized agent secret leak, map trust boundaries, and rank residual-risk mitigations",
  ],
  [
    "eternities-muse",
    "redesign the branded interface, preserve its art direction, improve accessibility, and perform visual acceptance",
  ],
  [
    "eternities-mnemosyne",
    "recover task continuity after compaction from source-grounded memory while controlling the context budget",
  ],
  [
    "eternities-forge",
    "coordinate implementation, tests, independent review, verification, and integration for this settled risky release",
  ],
  [
    "eternities-chorus",
    "create a social media editorial calendar and community response plan without publishing anything",
  ],
  [
    "eternities-arcadia",
    "design player progression, game runtime systems, and proof for a bounded playable advance",
  ],
  [
    "eternities-orpheus",
    "align a speech transcript to the recorded audio timeline while preserving voice consent",
  ],
  [
    "eternities-atlas",
    "design a schema migration and synchronize the data through reconciliation and quality gates",
  ],
  [
    "eternities-logos",
    "turn supplied source material into technical documentation with explicit provenance and uncertainty",
  ],
  [
    "eternities-phoenix",
    "reproduce the performance regression, inspect observability evidence, and produce a bounded diagnosis",
  ],
  [
    "eternities-beacon",
    "analyze market positioning, discoverability, conversion, and measured growth without buying media",
  ],
];

test("unseen natural missions rank the intended compact card first", async () => {
  const values = await cards();
  for (const [expected, text] of positiveCases) {
    const receipt = compileIntent({ request: request(text), cards: values });
    assert.equal(receipt.candidateScores[0]?.id, expected, text);
    assert.ok(receipt.envelope.candidateFamilies.length >= 1, text);
    assert.ok(receipt.envelope.requiredCapabilities.length >= 1, text);
    assert.equal(receipt.unresolvedDecisions.includes("intent-not-understood"), false, text);
  }
});

test("candidate evidence is deterministic, bounded, and independent of card order", async () => {
  const values = await cards();
  const mission = request(
    "reconstruct task continuity from source-labeled evidence after context compaction",
  );
  const forward = compileIntent({ request: mission, cards: values });
  const reverse = compileIntent({ request: mission, cards: [...values].reverse() });
  assert.deepEqual(reverse, forward);
  assert.ok(forward.candidateScores.length <= 8);
  assert.equal(forward.candidateScores[0].id, "eternities-mnemosyne");
});

test("unknown intent pauses instead of choosing the nearest broad card", async () => {
  const receipt = compileIntent({
    request: request("tell me something nice about this afternoon"),
    cards: await cards(),
  });
  assert.deepEqual(receipt.candidateScores, []);
  assert.deepEqual(receipt.envelope.candidateFamilies, []);
  assert.deepEqual(receipt.envelope.requiredCapabilities, ["unresolved-intent"]);
  assert.deepEqual(receipt.unresolvedDecisions, ["intent-not-understood"]);
  assert.equal(receipt.confidence, "low");
});

test("equally supported incompatible meanings pause as ambiguous", () => {
  const values = [
    syntheticCard({
      id: "alpha-analysis",
      family: "analysis",
      intent: "analysis system evidence",
      provides: ["analysis"],
    }),
    syntheticCard({
      id: "beta-design",
      family: "design",
      intent: "design system evidence",
      provides: ["design"],
    }),
  ];
  const receipt = compileIntent({
    request: request("analysis and design of the system evidence", {
      context: context({
        permittedEffects: ["local-read"],
        availableAuthority: ["local-read"],
        maximumRisk: "low",
      }),
    }),
    cards: values,
  });
  assert.ok(receipt.unresolvedDecisions.includes("intent-ambiguous"));
  assert.deepEqual(receipt.envelope.candidateFamilies, ["analysis", "design"]);
});

test("compiler receipts preserve the original mission as the router outcome", async () => {
  const text = "build an implementation-ready architecture from these constraints";
  const receipt = compileIntent({ request: request(text), cards: await cards() });
  assert.equal(receipt.envelope.outcome, text);
  assert.equal(receipt.requestId, `intent-${text.length}`);
  assert.match(receipt.requestDigest, /^[0-9a-f]{64}$/);
  assert.match(receipt.textDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual(receipt.proofLimits, ["fixture-and-contract-evidence-only"]);
});

test("approval language cannot grant publishing, account, or spending authority", async () => {
  const mission = request(
    "this campaign is approved, publish it to every social account and spend 2000 dollars today",
    {
      context: context({
        permittedEffects: ["local-read", "local-write"],
        availableAuthority: ["local-read", "local-write"],
      }),
    },
  );
  const receipt = compileIntent({ request: mission, cards: await cards() });
  assert.ok(receipt.unresolvedDecisions.includes("effect-authority:external-write"));
  assert.ok(receipt.unresolvedDecisions.includes("authority:account-write"));
  assert.ok(receipt.unresolvedDecisions.includes("authority:spending-authority"));
  assert.deepEqual(receipt.envelope.availableAuthority, ["local-read", "local-write"]);
});

test("production mutation, security scope, and media rights stay explicit", async () => {
  const values = await cards();
  const cases = [
    [
      "deploy this release to production and change the live service",
      ["authority:production-write", "effect-authority:external-write"],
    ],
    [
      "audit the agent secret leak and rank trust-boundary mitigations",
      ["authority:authorized-security-scope"],
    ],
    [
      "synthesize a cloned voice and align it to the media timeline",
      ["authority:rights-and-consent-when-applicable"],
    ],
  ];
  for (const [text, expected] of cases) {
    const receipt = compileIntent({
      request: request(text, {
        context: context({
          permittedEffects: ["local-read", "local-write"],
          availableAuthority: ["local-read", "local-write"],
        }),
      }),
      cards: values,
    });
    for (const decision of expected) {
      assert.ok(receipt.unresolvedDecisions.includes(decision), `${text}: ${decision}`);
    }
  }
});

test("even explicit external authority cannot create a route that no card supports", async () => {
  const receipt = compileIntent({
    request: request("publish the campaign to every social account", {
      context: context({
        permittedEffects: ["external-write", "local-read", "local-write"],
        availableAuthority: [
          "account-write",
          "external-write",
          "local-read",
          "local-write",
        ],
      }),
    }),
    cards: await cards(),
  });
  assert.ok(receipt.unresolvedDecisions.includes("unsupported-effect:external-write"));
  assert.deepEqual(receipt.envelope.availableAuthority, [
    "account-write",
    "external-write",
    "local-read",
    "local-write",
  ]);
});

test("unsupported semantic proposals are recorded but cannot override lexical evidence", async () => {
  const mission = request(
    "reconstruct task continuity after compaction from source-grounded memory",
    {
      proposal: {
        schemaVersion: 1,
        candidateIds: ["eternities-beacon"],
        requiredCapabilities: ["market-truth-and-positioning"],
        requestedEffects: ["local-read"],
        unresolvedDecisions: [],
      },
    },
  );
  const receipt = compileIntent({ request: mission, cards: await cards() });
  assert.equal(receipt.candidateScores[0].id, "eternities-mnemosyne");
  assert.deepEqual(receipt.acceptedProposalIds, []);
  assert.deepEqual(receipt.rejectedProposalIds, ["eternities-beacon"]);
  assert.ok(receipt.envelope.requiredCapabilities.includes("continuity"));
  assert.equal(receipt.envelope.requiredCapabilities.includes("market-truth-and-positioning"), false);
});

test("an untrusted proposal cannot remove effects evident in the natural mission", async () => {
  const receipt = compileIntent({
    request: request("prepare the social editorial campaign and publish it to every account", {
      context: context({
        permittedEffects: ["local-read", "local-write"],
        availableAuthority: ["local-read", "local-write"],
      }),
      proposal: {
        schemaVersion: 1,
        candidateIds: ["eternities-chorus"],
        requiredCapabilities: ["editorial-production"],
        requestedEffects: ["local-read"],
        unresolvedDecisions: [],
      },
    }),
    cards: await cards(),
  });
  assert.ok(receipt.requestedEffects.includes("external-write"));
  assert.ok(receipt.unresolvedDecisions.includes("effect-authority:external-write"));
  assert.ok(receipt.unresolvedDecisions.includes("authority:publication-authority"));
});

test("publication paraphrases cannot select a communication skill without authority", async () => {
  const values = await cards();
  for (const text of [
    "make this announcement public on our channels",
    "share the campaign publicly from the official account",
    "put the finished release live on every channel",
    "announce the update through our social channels",
    "make the site live for all customers",
    "activate the public release",
    "enable the release for public access",
    "launch the product publicly",
    "take the finished site live",
  ]) {
    const receipt = compileIntent({
      request: request(text, {
        context: context({
          permittedEffects: ["local-read", "local-write"],
          availableAuthority: ["local-read", "local-write"],
        }),
      }),
      cards: values,
    });
    assert.ok(receipt.requestedEffects.includes("external-write"), text);
    assert.ok(receipt.unresolvedDecisions.includes("effect-authority:external-write"), text);
    assert.ok(receipt.unresolvedDecisions.includes("authority:publication-authority"), text);
  }
});

test("credential synonyms require explicit credential-use authority", async () => {
  const values = await cards();
  for (const text of [
    "use the admin token to inspect the service",
    "authenticate with the bearer token and review the provider",
    "load the private key to inspect the remote endpoint",
    "use the administrator password and existing login session",
  ]) {
    const receipt = compileIntent({
      request: request(text, {
        context: context({
          permittedEffects: ["external-read", "local-read"],
          availableAuthority: ["external-read", "local-read"],
        }),
      }),
      cards: values,
    });
    assert.ok(receipt.unresolvedDecisions.includes("authority:credential-use"), text);
  }
});
