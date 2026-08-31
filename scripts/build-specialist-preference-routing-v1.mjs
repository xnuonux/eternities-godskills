import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalDigest,
  canonicalFile,
} from "../src/adaptive-evidence-contracts.mjs";
import { sha256 } from "../src/io.mjs";
import { compileAndRoute } from "../src/specialist-preference-runtime.mjs";
import {
  buildPreferenceRoutingShortlist,
  buildRoutingIndex,
  shortlistRoutingCards,
} from "../src/specialist-preference-routing-index.mjs";
import { routeCapabilities } from "../src/specialist-preference-router.mjs";
import { discoverLocalModuleClosure } from "../src/static-module-closure.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROTOCOL_ID = "eternities-godskills-specialist-preference-v1";
const FIXTURE_PATH = "artifacts/specialist-preference-routing-v1/fixture.json";
const RECEIPT_PATH = "receipts/specialist-preference-routing-v1.json";
const PARENTS = Object.freeze([
  Object.freeze({
    path: "receipts/agent-native-router-v8.json",
    sha256: "b32500d810ba66539334cbe3ae5ef31223dbf712197a061779fc21f75048ebf3",
    bytes: 7284,
    identityKey: "id",
    identity: "agent-native-router-v8",
    status: "certified",
  }),
  Object.freeze({
    path: "receipts/godskills-system-certification-v3.json",
    sha256: "228ba0a63d252f0c37178ff3de8c1278d0ea878e9abeb173e7faea699f28fb57",
    bytes: 4446,
    identityKey: "id",
    identity: "eternities-godskills-system-v3",
    status: "certified",
  }),
  Object.freeze({
    path: "receipts/intent-compiler-v3.json",
    sha256: "1ca40ec9138c1d0583068ee4dc3db58f0b77b07f631a2b38d9c47eb28ccce49a",
    bytes: 3661,
    identityKey: "id",
    identity: "intent-compiler-v3",
    status: "certified",
  }),
  Object.freeze({
    path: "receipts/portable-capability-manifest-v1.json",
    sha256: "f78f6aded5198e8db1591af49fe97285307427d93396b34c78dd6e5f2466f33d",
    bytes: 1128,
    identityKey: "receiptId",
    identity: "portable-capability-manifest-v1",
    status: "certified-local-artifacts",
  }),
]);
const DECLARED_SOURCES = Object.freeze([
  "docs/superpowers/plans/2026-08-31-specialist-preference-routing-v1.md",
  "docs/superpowers/specs/2026-08-31-specialist-preference-routing-v1-design.md",
  "scripts/build-specialist-preference-routing-v1.mjs",
  "scripts/intent.mjs",
  "tests/specialist-preference-routing-receipt.test.mjs",
  "tests/specialist-preference-routing.test.mjs",
]);
const ROUTING_ARTIFACTS = Object.freeze([
  "artifacts/routing/cards.jsonl",
  "artifacts/routing/family-map.json",
]);

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertContained(root, target, label) {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error(`${label} escaped repository root`);
}

async function readBoundFile(root, relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.length === 0
      || path.isAbsolute(relativePath) || relativePath.includes("\\")
      || relativePath.split("/").includes("..")) {
    throw new Error(`${label} path is not repository-relative`);
  }
  const expected = path.resolve(root, ...relativePath.split("/"));
  assertContained(root, expected, label);
  const actual = await realpath(expected);
  assertContained(root, actual, label);
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`${label} is a symlink or non-canonical alias`);
  }
  return readFile(actual);
}

async function bindFile(root, relativePath, label = "bound file") {
  const bytes = await readBoundFile(root, relativePath, label);
  return Object.freeze({
    path: relativePath,
    sha256: sha256(bytes),
    bytes: bytes.length,
  });
}

async function bindAndVerifyParents(root) {
  const rows = [];
  for (const expected of PARENTS) {
    const bytes = await readBoundFile(root, expected.path, "preference routing parent");
    const actualHash = sha256(bytes);
    if (actualHash !== expected.sha256 || bytes.length !== expected.bytes) {
      throw new Error(`preference routing parent drifted: ${expected.path}`);
    }
    let value;
    try {
      value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`preference routing parent is invalid JSON: ${expected.path}`, {
        cause: error,
      });
    }
    if (value?.schemaVersion !== 1
        || value?.[expected.identityKey] !== expected.identity
        || value?.status !== expected.status) {
      throw new Error(`preference routing parent identity mismatch: ${expected.path}`);
    }
    rows.push(Object.freeze({
      path: expected.path,
      sha256: actualHash,
      bytes: bytes.length,
    }));
  }
  return Object.freeze(rows);
}

function card(id, overrides = {}) {
  return Object.freeze({
    schemaVersion: 1,
    id,
    family: "preference-fixture",
    intent: "perform one exact verified operation",
    successCondition: "the operation is verified",
    provides: ["operation"],
    requires: [],
    intentExamples: {
      direct: ["perform the operation"],
      paraphrased: ["complete the exact operation"],
      contextual: ["this mission requires the operation"],
    },
    negativeIntents: ["skip the operation"],
    effects: ["local-read"],
    riskClass: "low",
    authorityRequirements: ["local-read"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 100,
    dependencyCost: 1,
    evidenceConfidence: "verified",
    entrypoint: `skills/${id}/SKILL.md`,
    legacyAliases: [],
    ...overrides,
  });
}

function naturalRequest({ requestId, preferredCapabilities, unresolvedDecisions = [] }) {
  const context = {
    permittedEffects: ["local-read"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    forbiddenCapabilities: [],
    maximumRisk: "low",
    minimumEvidenceConfidence: "verified",
    contextBudget: 1000,
    maxCompositionSize: 1,
  };
  if (preferredCapabilities !== undefined) context.preferredCapabilities = preferredCapabilities;
  return {
    schemaVersion: 1,
    requestId,
    text: "perform the operation",
    context,
    proposal: {
      schemaVersion: 1,
      candidateIds: ["alpha-operation", "beta-operation"],
      requiredCapabilities: ["operation"],
      requestedEffects: ["local-read"],
      unresolvedDecisions,
    },
  };
}

function routeFixture({ requestId, cards, preferredCapabilities, unresolvedDecisions }) {
  return compileAndRoute({
    request: naturalRequest({ requestId, preferredCapabilities, unresolvedDecisions }),
    cards,
  });
}

function selectedAuthorityExpansions(compilation, cards) {
  const { compilerReceipt, routeReceipt } = compilation;
  const byId = new Map(cards.map((value) => [value.id, value]));
  const available = new Set(compilerReceipt.envelope.availableAuthority);
  return routeReceipt.selectedIds.flatMap((id) => byId.get(id)?.authorityRequirements ?? [])
    .filter((authority) => !available.has(authority));
}

function expectFailure(action, pattern, label) {
  try {
    action();
  } catch (error) {
    if (pattern.test(error.message)) return true;
    throw new Error(`${label} failed for an unexpected reason: ${error.message}`, { cause: error });
  }
  throw new Error(`${label} unexpectedly succeeded`);
}

function buildFixture() {
  const alpha = card("alpha-operation");
  const beta = card("beta-operation");
  const equalCards = [beta, alpha];
  const legacy = routeFixture({
    requestId: "preference-release-legacy",
    cards: equalCards,
  });
  const equalTie = routeFixture({
    requestId: "preference-release-equal-tie",
    cards: equalCards,
    preferredCapabilities: ["beta-operation"],
  });
  const strongerCards = [beta, card("alpha-operation", { contextCost: 50 })];
  const strongerNonpreferred = routeFixture({
    requestId: "preference-release-stronger-nonpreferred",
    cards: strongerCards,
    preferredCapabilities: ["beta-operation"],
  });
  const rejectedCards = [
    card("beta-operation", { riskClass: "high" }),
    card("alpha-operation", { contextCost: 50 }),
  ];
  const rejectedPreference = routeFixture({
    requestId: "preference-release-rejected",
    cards: rejectedCards,
    preferredCapabilities: ["beta-operation"],
  });
  const unresolved = routeFixture({
    requestId: "preference-release-unresolved",
    cards: equalCards,
    preferredCapabilities: ["beta-operation"],
    unresolvedDecisions: ["user-choice"],
  });

  const dependencyCards = [
    card("alpha-a", {
      provides: ["alpha-extra", "part-a"],
      compatibleWith: ["alpha-b", "alpha-c"],
    }),
    card("alpha-b", {
      provides: ["part-b"],
      compatibleWith: ["alpha-a", "alpha-c"],
    }),
    card("alpha-c", {
      provides: ["part-c"],
      compatibleWith: ["alpha-a", "alpha-b"],
    }),
    card("beta-a", {
      provides: ["part-a", "part-b"],
      requires: ["support"],
      compatibleWith: ["beta-b", "beta-support"],
    }),
    card("beta-b", {
      provides: ["part-c"],
      compatibleWith: ["beta-a", "beta-support"],
    }),
    card("beta-support", {
      provides: ["support"],
      compatibleWith: ["beta-a", "beta-b"],
    }),
  ];
  const dependencyEnvelope = {
    schemaVersion: 1,
    requestId: "preference-release-semantic-isolation",
    outcome: "perform the three-part operation",
    candidateFamilies: ["preference-fixture"],
    requiredCapabilities: ["part-a", "part-b", "part-c"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    maximumRisk: "low",
    minimumEvidenceConfidence: "verified",
    contextBudget: 1000,
    maxCompositionSize: 3,
    unresolvedDecisions: [],
    preferredCapabilities: ["beta-support"],
  };
  const dependencyShortlist = buildPreferenceRoutingShortlist(
    buildRoutingIndex(dependencyCards),
    dependencyEnvelope,
  );
  const semanticIsolation = routeCapabilities({
    envelope: dependencyEnvelope,
    cards: dependencyShortlist.cards,
    semanticCandidateIds: dependencyShortlist.semanticCandidateIds,
  });

  const unknownPreferenceRejected = expectFailure(() => routeFixture({
    requestId: "preference-release-unknown",
    cards: equalCards,
    preferredCapabilities: ["unknown-operation"],
  }), /unknown.*preferred|preferred.*unknown/i, "unknown preference gate");

  const manyCards = Array.from({ length: 33 }, (_, index) => card(
    `skill-${String(index).padStart(2, "0")}`,
    index === 32
      ? {}
      : {
          family: "other-family",
          provides: [`other-${String(index).padStart(2, "0")}`],
        },
  ));
  const manyIndex = buildRoutingIndex(manyCards);
  const overflowEnvelope = {
    schemaVersion: 1,
    requestId: "preference-release-overflow",
    outcome: "perform the operation",
    candidateFamilies: ["preference-fixture"],
    requiredCapabilities: ["operation"],
    forbiddenCapabilities: [],
    permittedEffects: ["local-read"],
    availableAuthority: ["local-read"],
    availablePreconditions: [],
    maximumRisk: "low",
    minimumEvidenceConfidence: "verified",
    contextBudget: 1000,
    maxCompositionSize: 1,
    unresolvedDecisions: [],
    preferredCapabilities: manyCards.slice(0, 32).map(({ id }) => id).sort(lexical),
  };
  const shortlistOverflowRejected = expectFailure(
    () => shortlistRoutingCards(manyIndex, overflowEnvelope, { limit: 32 }),
    /shortlist.*32|bounded.*32|overflow/i,
    "preference shortlist overflow gate",
  );

  const routesAndCards = [
    [legacy, equalCards],
    [equalTie, equalCards],
    [strongerNonpreferred, strongerCards],
    [rejectedPreference, rejectedCards],
    [unresolved, equalCards],
  ];
  const authorityExpansions = routesAndCards.flatMap(([compilation, cards]) =>
    selectedAuthorityExpansions(compilation, cards)).length;

  const fixture = Object.freeze({
    schemaVersion: 1,
    protocolId: PROTOCOL_ID,
    legacy: legacy.routeReceipt,
    equalTie: equalTie.routeReceipt,
    strongerNonpreferred: strongerNonpreferred.routeReceipt,
    rejectedPreference: rejectedPreference.routeReceipt,
    unresolved: unresolved.routeReceipt,
    semanticIsolation,
  });
  const computedGates = Object.freeze({
    legacyShapePreserved:
      !("preferredCapabilities" in legacy.compilerReceipt.envelope)
      && !("preference" in legacy.routeReceipt),
    equalQualityTieBreakApplied:
      equalTie.routeReceipt.preference.applied === true
      && equalTie.routeReceipt.preference.reason === "equal-quality-tie-break"
      && equalTie.routeReceipt.preference.baselineSelectedIds[0] === "alpha-operation"
      && equalTie.routeReceipt.selectedIds[0] === "beta-operation",
    strongerNonpreferredPreserved:
      strongerNonpreferred.routeReceipt.selectedIds[0] === "alpha-operation"
      && strongerNonpreferred.routeReceipt.preference.applied === false,
    rejectedPreferenceNotQualified:
      rejectedPreference.routeReceipt.preference.qualifiedIds.length === 0
      && rejectedPreference.routeReceipt.rejected.some(({ id }) => id === "beta-operation"),
    unresolvedDecisionPreserved:
      unresolved.routeReceipt.status === "needs-decision"
      && unresolved.routeReceipt.preference.reason === "unresolved-decision",
    preferenceOnlyDependencyBlocked:
      semanticIsolation.selectedIds.join("+") === "alpha-a+alpha-b+alpha-c"
      && semanticIsolation.preference.reason === "preference-not-semantic-candidate"
      && !semanticIsolation.preference.semanticCandidateIds.includes("beta-support"),
    unknownPreferenceRejected,
    shortlistOverflowRejected,
    authorityExpansions,
  });
  for (const [gate, passed] of Object.entries(computedGates)) {
    if (gate === "authorityExpansions" ? passed !== 0 : passed !== true) {
      throw new Error(`specialist preference computed gate failed: ${gate}`);
    }
  }
  return { fixture, computedGates };
}

export async function rebuildSpecialistPreferenceRoutingV1({
  repositoryRoot = REPOSITORY_ROOT,
} = {}) {
  const root = await realpath(path.resolve(repositoryRoot));
  const parents = await bindAndVerifyParents(root);
  const runtimeModules = await discoverLocalModuleClosure({
    repositoryRoot: root,
    roots: ["scripts/intent-preference.mjs"],
  });
  const sourcePaths = [...new Set([
    ...runtimeModules.map(({ path: relativePath }) => relativePath),
    ...DECLARED_SOURCES,
  ])].sort(lexical);
  const sources = await Promise.all(sourcePaths.map((relativePath) =>
    bindFile(root, relativePath, "preference routing source")));
  const routingArtifacts = await Promise.all(ROUTING_ARTIFACTS.map((relativePath) =>
    bindFile(root, relativePath, "preference routing artifact")));

  const { fixture, computedGates } = buildFixture();
  const fixtureText = canonicalFile(fixture);
  const outputs = Object.freeze([Object.freeze({
    path: FIXTURE_PATH,
    sha256: sha256(fixtureText),
    bytes: Buffer.byteLength(fixtureText),
    logicalDigest: canonicalDigest(fixture),
  })]);
  const body = {
    schemaVersion: 1,
    id: "specialist-preference-routing-v1",
    status: "verified-structural-protocol",
    protocolId: PROTOCOL_ID,
    authorityExpanded: false,
    parents,
    dependencyClosure: {
      roots: ["scripts/intent-preference.mjs"],
      localModules: runtimeModules.map(({ path: relativePath }) => relativePath),
      complete: true,
    },
    inputs: {
      sources,
      routingArtifacts,
    },
    outputs,
    computedGates,
    proofLimits: [
      "deterministic-structural-fixtures-only",
      "no-specialist-quality-superiority-claim",
      "no-eligibility-or-authority-change",
      "no-model-selection-or-provider-proof",
      "no-unseen-mission-generalization-proof",
      "standalone-receipt-validation-does-not-recompute-card-policy",
      "exact-executable-and-parent-bytes-required-for-host-trust",
    ],
  };
  const receipt = Object.freeze({ ...body, receiptDigest: canonicalDigest(body) });
  const writes = Object.freeze({
    [FIXTURE_PATH]: fixtureText,
    [RECEIPT_PATH]: canonicalFile(receipt),
  });
  return Object.freeze({ fixture, receipt, writes });
}

export async function writeSpecialistPreferenceRoutingV1({
  repositoryRoot = REPOSITORY_ROOT,
} = {}) {
  const root = await realpath(path.resolve(repositoryRoot));
  const result = await rebuildSpecialistPreferenceRoutingV1({ repositoryRoot: root });
  await commitGeneratedFiles({ rootPath: root, writes: result.writes });
  return result;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  writeSpecialistPreferenceRoutingV1()
    .then(({ receipt }) => process.stdout.write(`${receipt.receiptDigest}\n`))
    .catch((error) => {
      process.stderr.write(`specialist preference routing build failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
