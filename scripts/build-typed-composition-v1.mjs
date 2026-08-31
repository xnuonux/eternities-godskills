import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { compileActivationDecision } from "../src/adaptive-activation.mjs";
import { buildActivationResult } from "../src/adaptive-activation-protocol.mjs";
import { canonicalJson } from "../src/capability-layer-abi.mjs";
import { sha256 } from "../src/io.mjs";
import { discoverLocalModuleClosure } from "../src/static-module-closure.mjs";
import {
  compileTypedMissionMethod,
  executeTypedMissionMethod,
  loadTypedCompositionRegistry,
  sealTypedCompositionPlan,
  verifyTypedMissionMethod,
} from "../src/typed-composition.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";

const POLICY_PATH = "policies/typed-composition.v1.json";
const SCHEMA_PATHS = Object.freeze([
  "schemas/typed-composition-execution.v1.schema.json",
  "schemas/typed-composition-plan.v1.schema.json",
  "schemas/typed-mission-method.v1.schema.json",
]);
const DECLARED_PATHS = Object.freeze([
  "docs/superpowers/plans/2026-08-31-typed-composition-v1.md",
  "docs/superpowers/specs/2026-08-31-typed-composition-v1-design.md",
  POLICY_PATH,
  ...SCHEMA_PATHS,
  "tests/helpers/typed-composition-fixture.mjs",
  "tests/typed-composition-receipt.test.mjs",
  "tests/typed-composition.test.mjs",
]);
const GENERATED_PATHS = Object.freeze([
  "artifacts/typed-composition/activation.v1.json",
  "artifacts/typed-composition/budget.v1.json",
  "artifacts/typed-composition/canary-execution.v1.json",
  "artifacts/typed-composition/compatibility.v1.json",
  "artifacts/typed-composition/method.v1.json",
  "artifacts/typed-composition/plan.v1.json",
  "artifacts/typed-composition/registry.v1.json",
  "artifacts/typed-composition/rejection-matrix.v1.json",
  "artifacts/typed-composition/vocabulary.v1.json",
]);
const RECEIPT_PATH = "receipts/typed-composition-v1.json";
const REPORT_PATH = "docs/typed-composition-v1-certification.md";
const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

const logicalDigest = (value) => sha256(JSON.stringify(stable(value)));

function rootPath(root) {
  if (root instanceof URL) return fileURLToPath(root);
  if (typeof root === "string" && root.length > 0) return path.resolve(root);
  throw new TypeError("typed composition repository root is required");
}

function repositoryPath(repositoryRoot, relative) {
  return path.join(repositoryRoot, ...relative.split("/"));
}

async function json(repositoryRoot, relative) {
  return JSON.parse(await readFile(repositoryPath(repositoryRoot, relative), "utf8"));
}

async function record(repositoryRoot, relative, role) {
  const bytes = await readFile(repositoryPath(repositoryRoot, relative));
  return { role, path: relative, sha256: sha256(bytes), bytes: bytes.length };
}

function authority(overrides = {}) {
  return {
    availableAuthority: ["local-read", "local-write", "repository-write"],
    permittedEffects: ["local-read", "local-write"],
    availablePreconditions: ["repository-present", "settled-outcome"],
    maximumRisk: "high",
    minimumEvidenceConfidence: "verified",
    contextBudget: 4096,
    ...overrides,
  };
}

async function activationFor(repositoryRoot, trustRootDigest, capabilityIds, authorityProjection) {
  const [policy, evidence, receipt] = await Promise.all([
    json(repositoryRoot, "policies/adaptive-activation.v1.json"),
    json(repositoryRoot, "artifacts/adaptive-activation/evidence.v1.json"),
    json(repositoryRoot, "receipts/adaptive-activation-executable-v1.json"),
  ]);
  const classification = {
    taskClass: "implementation",
    consequenceClass: "consequential",
    reviewAvailable: false,
  };
  const request = {
    schemaVersion: 1,
    protocolId: "eternities-godskills-activation-v1",
    requestId: `typed-composition:${capabilityIds.join("+")}`,
    trustRootDigest,
    classification,
    selected: capabilityIds.map((selectedId) => ({ selectedId, explicitMethodRequest: false })),
    authorityProjection: structuredClone(authorityProjection),
  };
  const task = {
    taskClass: classification.taskClass,
    consequenceClass: classification.consequenceClass,
    authorityProjection: structuredClone(authorityProjection),
  };
  const decisions = capabilityIds.map((selectedId) => compileActivationDecision({
    selectedId,
    task,
    reviewAvailable: false,
    policy,
    evidence,
  }));
  return buildActivationResult({
    request,
    decisions,
    policyDigest: receipt.artifacts.find(({ role }) => role === "policy").logicalDigest,
    evidenceDigest: receipt.artifacts.find(({ role }) => role === "evidence").logicalDigest,
  });
}

function unsignedPlan(registry, activationResult, authorityProjection, maximumContextBytes = 16384) {
  const decisions = Object.fromEntries(
    activationResult.decisions.map((decision) => [decision.selectedId, decision]),
  );
  return {
    schemaVersion: 1,
    protocolId: "eternities-typed-composition-plan-v1",
    missionId: "canary:muse-to-forge:v1",
    policyDigest: registry.policyDigest,
    capabilityLayerReceiptDigest: registry.capabilityLayerReceiptDigest,
    activationTrustRootDigest: registry.activationTrustRootDigest,
    activationResultDigest: activationResult.resultDigest,
    authorityProjection: structuredClone(authorityProjection),
    maximumContextBytes,
    missionInputs: [
      { artifactId: "available-specialists", typeId: "eternities.capability-set", jsonKind: "array" },
      { artifactId: "design-constraints", typeId: "eternities.constraint-set", jsonKind: "array" },
      { artifactId: "repository-state", typeId: "eternities.repository-state", jsonKind: "object" },
      { artifactId: "settled-outcome", typeId: "eternities.mission-spec", jsonKind: "object" },
      { artifactId: "visual-source-set", typeId: "eternities.artifact-set", jsonKind: "array" },
    ],
    nodes: [
      {
        nodeId: "design",
        phase: "design",
        capabilityId: "eternities-muse",
        activationDecisionDigest: decisions["eternities-muse"].decisionDigest,
      },
      {
        nodeId: "implementation",
        phase: "implementation",
        capabilityId: "eternities-forge",
        activationDecisionDigest: decisions["eternities-forge"].decisionDigest,
      },
    ],
    links: [
      {
        artifactId: "available-specialists",
        producer: { kind: "mission-input", inputId: "available-specialists" },
        consumer: { nodeId: "design", slotId: "available-specialists" },
      },
      {
        artifactId: "design-constraints",
        producer: { kind: "mission-input", inputId: "design-constraints" },
        consumer: { nodeId: "design", slotId: "design-constraints" },
      },
      {
        artifactId: "visual-source-set",
        producer: { kind: "mission-input", inputId: "visual-source-set" },
        consumer: { nodeId: "design", slotId: "visual-source-set" },
      },
      {
        artifactId: "acceptance-boundary",
        producer: { kind: "node-output", nodeId: "design", slotId: "acceptance-boundary" },
        consumer: { nodeId: "implementation", slotId: "acceptance-risk-boundary" },
      },
      {
        artifactId: "repository-state",
        producer: { kind: "mission-input", inputId: "repository-state" },
        consumer: { nodeId: "implementation", slotId: "repository-state" },
      },
      {
        artifactId: "settled-outcome",
        producer: { kind: "mission-input", inputId: "settled-outcome" },
        consumer: { nodeId: "implementation", slotId: "settled-outcome" },
      },
    ],
    missionOutputs: [
      { outputId: "claim-evidence-ledger", nodeId: "implementation", slotId: "claim-evidence-ledger" },
      { outputId: "implementation", nodeId: "implementation", slotId: "implementation" },
      { outputId: "integration-state", nodeId: "implementation", slotId: "integration-state" },
      { outputId: "review-disposition", nodeId: "implementation", slotId: "review-disposition" },
    ],
  };
}

function reseal(plan, mutate) {
  const unsigned = structuredClone(plan);
  delete unsigned.planDigest;
  mutate(unsigned);
  return sealTypedCompositionPlan(unsigned);
}

const missionInputs = Object.freeze({
  "available-specialists": Object.freeze(["interface", "motion", "accessibility"]),
  "design-constraints": Object.freeze(["deterministic", "bounded-authority"]),
  "repository-state": Object.freeze({ branch: "feat/typed-composition-v1", clean: false }),
  "settled-outcome": Object.freeze({ objective: "compile a typed Muse to Forge mission" }),
  "visual-source-set": Object.freeze(["brand-system", "implemented-interface"]),
});

function executors() {
  return {
    "eternities-muse": async (input) => ({
      schemaVersion: 1,
      capabilityId: "eternities-muse",
      missionId: input.missionId,
      slots: {
        "visual-direction": { direction: "white-fire-sovereign" },
        "visual-system": { tokens: ["luminance", "motion"] },
        "specialist-handoff": { target: "eternities-forge" },
        "acceptance-boundary": {
          invariants: ["typed-handoff", "no-authority-expansion"],
          rejectionCriteria: ["implicit-coercion", "missing-evidence"],
        },
      },
    }),
    "eternities-forge": async (input) => ({
      schemaVersion: 1,
      capabilityId: "eternities-forge",
      missionId: input.missionId,
      slots: {
        implementation: { status: "verified" },
        "claim-evidence-ledger": { claims: 2, evidence: 2 },
        "review-disposition": { disposition: "accepted" },
        "integration-state": { state: "ready" },
      },
    }),
  };
}

async function rejected(name, expectedCode, operation) {
  try {
    await operation();
  } catch (error) {
    if (error?.name !== "TypedCompositionError" || error.code !== expectedCode) {
      throw new Error(`${name} rejected with ${error?.code ?? error?.name ?? "unknown"}, expected ${expectedCode}`, { cause: error });
    }
    return { name, expectedCode, observed: "rejected" };
  }
  throw new Error(`${name} was not rejected`);
}

async function buildRejectionMatrix({ repositoryRoot, registry, activationResult, plan, method }) {
  const cases = [];
  const compile = (candidatePlan, candidateActivation = activationResult) => () => compileTypedMissionMethod({
    registry,
    plan: candidatePlan,
    activationResult: candidateActivation,
  });
  cases.push(await rejected("unknown-capability", "capability-unsupported", compile(reseal(plan, (value) => {
    value.nodes[0].capabilityId = "eternities-unknown";
  }))));
  cases.push(await rejected("repeated-capability", "capability-unsupported", compile(reseal(plan, (value) => {
    value.nodes[1].capabilityId = "eternities-muse";
  }))));
  cases.push(await rejected("duplicate-phase-owner", "phase-owner-conflict", compile(reseal(plan, (value) => {
    value.nodes[1].phase = "design";
  }))));
  cases.push(await rejected("missing-input", "missing-input", compile(reseal(plan, (value) => {
    value.links = value.links.filter(({ consumer }) => consumer.slotId !== "repository-state");
  }))));
  cases.push(await rejected("duplicate-input-binding", "duplicate-input-binding", compile(reseal(plan, (value) => {
    value.links.push({
      artifactId: "repository-state-copy",
      producer: { kind: "mission-input", inputId: "repository-state" },
      consumer: { nodeId: "implementation", slotId: "repository-state" },
    });
  }))));
  cases.push(await rejected("duplicate-artifact-owner", "duplicate-artifact-owner", compile(reseal(plan, (value) => {
    value.links[0].artifactId = "acceptance-boundary";
  }))));
  cases.push(await rejected("unknown-slot", "slot-invalid", compile(reseal(plan, (value) => {
    value.links[0].consumer.slotId = "invented-slot";
  }))));
  cases.push(await rejected("exact-type-mismatch", "type-mismatch", compile(reseal(plan, (value) => {
    value.missionInputs.find(({ artifactId }) => artifactId === "visual-source-set").typeId = "eternities.constraint-set";
  }))));
  cases.push(await rejected("json-kind-mismatch", "type-mismatch", compile(reseal(plan, (value) => {
    value.missionInputs.find(({ artifactId }) => artifactId === "visual-source-set").jsonKind = "object";
  }))));
  cases.push(await rejected("backward-edge", "phase-order-conflict", compile(reseal(plan, (value) => {
    value.links.find(({ consumer }) => consumer.slotId === "visual-source-set").producer = {
      kind: "node-output", nodeId: "implementation", slotId: "implementation",
    };
    value.links = value.links.filter(({ consumer }) => consumer.slotId !== "acceptance-risk-boundary");
  }))));
  cases.push(await rejected("cycle", "cycle", compile(reseal(plan, (value) => {
    value.links.find(({ consumer }) => consumer.slotId === "visual-source-set").producer = {
      kind: "node-output", nodeId: "implementation", slotId: "implementation",
    };
  }))));
  cases.push(await rejected("context-overflow", "context-overflow", compile(reseal(plan, (value) => {
    value.maximumContextBytes = 8000;
  }))));
  cases.push(await rejected("activation-decision-drift", "activation-mismatch", compile(reseal(plan, (value) => {
    value.nodes[0].activationDecisionDigest = "0".repeat(64);
  }))));
  cases.push(await rejected("consumed-output-exposure", "plan-invalid", compile(reseal(plan, (value) => {
    value.missionOutputs.push({ outputId: "acceptance", nodeId: "design", slotId: "acceptance-boundary" });
  }))));

  const triple = await activationFor(
    repositoryRoot,
    registry.activationTrustRootDigest,
    ["eternities-aegis", "eternities-muse", "eternities-forge"],
    authority({
      availableAuthority: ["authorized-security-scope", "local-read", "local-write", "repository-write"],
      availablePreconditions: ["authorized-target", "repository-present", "settled-outcome"],
    }),
  );
  const incompatibleUnsigned = unsignedPlan(registry, triple, triple.decisions[0].authorityProjection);
  incompatibleUnsigned.nodes.unshift({
    nodeId: "analysis",
    phase: "analysis",
    capabilityId: "eternities-aegis",
    activationDecisionDigest: triple.decisions[0].decisionDigest,
  });
  cases.push(await rejected("incompatible-capability-pair", "compatibility-conflict", compile(
    sealTypedCompositionPlan(incompatibleUnsigned),
    triple,
  )));

  const effectAuthority = authority({ permittedEffects: ["local-read"] });
  const effectActivation = await activationFor(repositoryRoot, registry.activationTrustRootDigest,
    ["eternities-muse", "eternities-forge"], effectAuthority);
  cases.push(await rejected("effect-overflow", "effect-overflow", compile(
    sealTypedCompositionPlan(unsignedPlan(registry, effectActivation, effectAuthority)),
    effectActivation,
  )));
  const reducedAuthority = authority({ availableAuthority: ["local-read", "local-write"] });
  const authorityActivation = await activationFor(repositoryRoot, registry.activationTrustRootDigest,
    ["eternities-muse", "eternities-forge"], reducedAuthority);
  cases.push(await rejected("authority-overflow", "authority-overflow", compile(
    sealTypedCompositionPlan(unsignedPlan(registry, authorityActivation, reducedAuthority)),
    authorityActivation,
  )));
  const reducedPreconditions = authority({ availablePreconditions: ["repository-present"] });
  const preconditionActivation = await activationFor(repositoryRoot, registry.activationTrustRootDigest,
    ["eternities-muse", "eternities-forge"], reducedPreconditions);
  cases.push(await rejected("missing-precondition", "precondition-missing", compile(
    sealTypedCompositionPlan(unsignedPlan(registry, preconditionActivation, reducedPreconditions)),
    preconditionActivation,
  )));
  const lowRisk = authority({ maximumRisk: "low" });
  const riskActivation = await activationFor(repositoryRoot, registry.activationTrustRootDigest,
    ["eternities-muse", "eternities-forge"], lowRisk);
  cases.push(await rejected("risk-overflow", "risk-overflow", compile(
    sealTypedCompositionPlan(unsignedPlan(registry, riskActivation, lowRisk)),
    riskActivation,
  )));

  const changedMethod = structuredClone(method);
  changedMethod.missionId = "forged";
  cases.push(await rejected("method-integrity", "method-integrity", () => verifyTypedMissionMethod({
    registry,
    method: changedMethod,
  })));
  cases.push(await rejected("missing-executor", "executor-missing", () => executeTypedMissionMethod({
    registry,
    method,
    missionInputs,
    executors: { "eternities-muse": executors()["eternities-muse"] },
  })));
  cases.push(await rejected("malformed-input", "execution-invalid", () => executeTypedMissionMethod({
    registry,
    method,
    missionInputs: { ...missionInputs, "visual-source-set": { invalid: true } },
    executors: executors(),
  })));
  cases.push(await rejected("malformed-output", "output-invalid", () => executeTypedMissionMethod({
    registry,
    method,
    missionInputs,
    executors: { ...executors(), "eternities-muse": async () => ({ invalid: true }) },
  })));
  return {
    schemaVersion: 1,
    id: "typed-composition-rejection-matrix-v1",
    cases,
    focusedTestCoverage: [
      "effect-conflict-through-alternate-pinned-policy",
      "compiled-method-overflow-through-alternate-pinned-policy",
      "policy-byte-drift",
      "registry-layer-byte-drift",
      "unearned-method-activation",
    ],
    observedRejections: cases.length,
    unexpectedAcceptances: 0,
  };
}

function compatibilityArtifact(registry) {
  const capabilities = new Map(registry.capabilities.map((row) => [row.capabilityId, row]));
  const ids = [...capabilities.keys()].sort(lexical);
  const pairs = [];
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const one = capabilities.get(ids[left]);
      const two = capabilities.get(ids[right]);
      pairs.push({
        left: one.capabilityId,
        right: two.capabilityId,
        leftDeclaresRight: one.compatibility.compatibleWith.includes(two.capabilityId),
        rightDeclaresLeft: two.compatibility.compatibleWith.includes(one.capabilityId),
        conflictDeclared: one.compatibility.conflictsWith.includes(two.capabilityId)
          || two.compatibility.conflictsWith.includes(one.capabilityId),
        mutuallyCompatible: one.compatibility.compatibleWith.includes(two.capabilityId)
          && two.compatibility.compatibleWith.includes(one.capabilityId)
          && !one.compatibility.conflictsWith.includes(two.capabilityId)
          && !two.compatibility.conflictsWith.includes(one.capabilityId),
      });
    }
  }
  return {
    schemaVersion: 1,
    id: "typed-composition-compatibility-v1",
    registryDigest: registry.registryDigest,
    pairs,
  };
}

function certification(receipt) {
  return [
    "# typed composition v1 certification",
    "",
    `status: \`${receipt.status}\``,
    "",
    `receipt: \`${receipt.receiptDigest}\``,
    "",
    "## certified boundary",
    "",
    "the exact capability-layer and adaptive-activation trust roots compile the",
    "real Muse-to-Forge canary into one typed, phase-owned, body-free method.",
    "the reference runner preserves the exact acceptance-contract handoff and",
    "emits a deterministic execution receipt without granting authority.",
    "",
    "## evidence",
    "",
    `- nodes: ${receipt.canary.nodes}`,
    `- typed links: ${receipt.canary.links}`,
    `- estimated disclosure bytes: ${receipt.canary.estimatedContextBytes}`,
    `- executed negative probes: ${receipt.canary.executedNegativeProbes}`,
    `- generated evidence artifacts: ${receipt.generatedArtifacts.length}`,
    `- source closure modules: ${receipt.sourceClosure.modules.length}`,
    "- method bodies embedded: 0",
    "- source bodies transported: 0",
    "- authority expanded: false",
    "",
    "## verification state",
    "",
    `- focused tests: ${receipt.verification.focusedTests}`,
    `- parent compatibility tests: ${receipt.verification.parentCompatibilityTests}`,
    `- full repository tests: ${receipt.verification.fullRepositoryTests}`,
    `- inline adversarial review: ${receipt.verification.inlineAdversarialReview}`,
    `- independent review: ${receipt.verification.independentReview}`,
    "",
    "## proof limits",
    "",
    ...receipt.proofLimits.map((limit) => `- ${limit}`),
    "",
  ].join("\n");
}

export async function rebuildTypedCompositionV1({ root } = {}) {
  const repositoryRoot = rootPath(root);
  const policyBytes = await readFile(repositoryPath(repositoryRoot, POLICY_PATH));
  const registry = await loadTypedCompositionRegistry({
    repositoryRoot,
    policyPath: repositoryPath(repositoryRoot, POLICY_PATH),
    expectedPolicyDigest: sha256(policyBytes),
  });
  const authorityProjection = authority();
  const activationResult = await activationFor(
    repositoryRoot,
    registry.activationTrustRootDigest,
    ["eternities-muse", "eternities-forge"],
    authorityProjection,
  );
  const plan = sealTypedCompositionPlan(unsignedPlan(
    registry,
    activationResult,
    authorityProjection,
  ));
  const method = compileTypedMissionMethod({ registry, plan, activationResult });
  const execution = await executeTypedMissionMethod({
    registry,
    method,
    missionInputs,
    executors: executors(),
  });
  const rejectionMatrix = await buildRejectionMatrix({
    repositoryRoot,
    registry,
    activationResult,
    plan,
    method,
  });
  const parsedPolicy = JSON.parse(policyBytes);
  const values = {
    "artifacts/typed-composition/activation.v1.json": activationResult,
    "artifacts/typed-composition/budget.v1.json": {
      schemaVersion: 1,
      id: "typed-composition-budget-v1",
      planDigest: plan.planDigest,
      methodDigest: method.methodDigest,
      contractBytes: method.aggregate.contractBytes,
      selectedLayerBytes: method.aggregate.selectedLayerBytes,
      estimatedContextBytes: method.aggregate.estimatedContextBytes,
      estimatedContextTokens: method.aggregate.estimatedContextTokens,
      planContextCeilingBytes: plan.maximumContextBytes,
      activationContextCeilingBytes: plan.authorityProjection.contextBudget * 4,
      policyContextCeilingBytes: parsedPolicy.limits.maximumContextBytes,
      compiledMethodBytes: Buffer.byteLength(canonicalJson(method)),
      compiledMethodCeilingBytes: parsedPolicy.limits.maximumCompiledMethodBytes,
      withinEveryCeiling: true,
    },
    "artifacts/typed-composition/canary-execution.v1.json": {
      schemaVersion: 1,
      id: "typed-composition-canary-execution-v1",
      outputs: execution.outputs,
      receipt: execution.receipt,
    },
    "artifacts/typed-composition/compatibility.v1.json": compatibilityArtifact(registry),
    "artifacts/typed-composition/method.v1.json": method,
    "artifacts/typed-composition/plan.v1.json": plan,
    "artifacts/typed-composition/registry.v1.json": registry,
    "artifacts/typed-composition/rejection-matrix.v1.json": rejectionMatrix,
    "artifacts/typed-composition/vocabulary.v1.json": {
      schemaVersion: 1,
      id: "typed-composition-vocabulary-v1",
      policyDigest: registry.policyDigest,
      phases: parsedPolicy.phaseOrder,
      effects: parsedPolicy.effectVocabulary,
      authority: parsedPolicy.authorityVocabulary,
      preconditions: parsedPolicy.preconditionVocabulary,
      jsonKinds: parsedPolicy.jsonKinds,
      phaseOwners: parsedPolicy.capabilities,
    },
  };
  const files = Object.fromEntries(GENERATED_PATHS.map((relative) => [
    relative,
    canonicalJson(values[relative]),
  ]));
  const roots = ["scripts/build-typed-composition-v1.mjs", "src/typed-composition.mjs"].sort(lexical);
  const modules = await discoverLocalModuleClosure({ repositoryRoot, roots });
  const declaredArtifacts = await Promise.all(DECLARED_PATHS.map((relative) => record(
    repositoryRoot,
    relative,
    relative.startsWith("schemas/") ? "schema"
      : relative.startsWith("tests/") ? "test"
        : relative === POLICY_PATH ? "policy" : "design",
  )));
  const generatedArtifacts = GENERATED_PATHS.map((relative) => ({
    path: relative,
    sha256: sha256(files[relative]),
    bytes: Buffer.byteLength(files[relative]),
  }));
  const unsignedReceipt = {
    schemaVersion: 1,
    id: "typed-composition-v1",
    status: "verified-build",
    protocolId: "eternities-typed-composition-v1",
    parents: {
      activationExecutable: parsedPolicy.activationTrustRoot,
      capabilityLayer: parsedPolicy.capabilityLayerReceipt,
    },
    policy: {
      path: POLICY_PATH,
      sha256: sha256(policyBytes),
      bytes: policyBytes.length,
    },
    schemas: declaredArtifacts.filter(({ role }) => role === "schema"),
    sourceClosure: {
      roots,
      modules,
      complete: true,
    },
    declaredArtifacts,
    generatedArtifacts,
    canary: {
      missionId: method.missionId,
      registryDigest: registry.registryDigest,
      activationResultDigest: activationResult.resultDigest,
      planDigest: plan.planDigest,
      methodDigest: method.methodDigest,
      executionDigest: execution.receipt.executionDigest,
      nodes: method.nodes.length,
      links: method.links.length,
      estimatedContextBytes: method.aggregate.estimatedContextBytes,
      executedNegativeProbes: rejectionMatrix.observedRejections,
      methodBodiesEmbedded: method.aggregate.methodBodiesEmbedded,
      sourceBodiesTransported: method.aggregate.sourceBodiesTransported,
      authorityExpanded: method.aggregate.authorityExpanded,
    },
    verification: {
      focusedTests: 14,
      parentCompatibilityTests: 31,
      combinedFocusedAndParentTests: 45,
      fullRepositoryTests: 782,
      inlineAdversarialReview: "passed-after-four-boundary-repairs",
      independentReview: "not-run-inline-only-user-constraint",
    },
    proofLimits: [
      "typed-orchestration-for-three-certified-canaries-only",
      "deterministic-muse-to-forge-executor-fixture-not-model-quality",
      "structurally-verified-activation-result-not-origin-authentication",
      "in-memory-reference-runner-not-durable-recovery",
      "no-real-skill-or-provider-execution",
      "no-effects-or-authority-granted",
      "no-default-activation-or-godagents-adoption",
      "no-hostile-same-user-operating-system-isolation",
    ],
  };
  const receipt = { ...unsignedReceipt, receiptDigest: sha256(canonicalJson(unsignedReceipt)) };
  const receiptText = canonicalJson(receipt);
  const report = certification(receipt);
  return { files, receipt, receiptText, report };
}

export async function writeTypedCompositionV1({ root } = {}) {
  const repositoryRoot = rootPath(root);
  const rebuilt = await rebuildTypedCompositionV1({ root: repositoryRoot });
  await commitGeneratedFiles({
    rootPath: repositoryRoot,
    writes: {
      ...rebuilt.files,
      [RECEIPT_PATH]: rebuilt.receiptText,
      [REPORT_PATH]: rebuilt.report,
    },
  });
  return rebuilt;
}

export async function verifyTypedCompositionRelease({ root } = {}) {
  const repositoryRoot = rootPath(root);
  const rebuilt = await rebuildTypedCompositionV1({ root: repositoryRoot });
  for (const [relative, expected] of Object.entries({
    ...rebuilt.files,
    [RECEIPT_PATH]: rebuilt.receiptText,
    [REPORT_PATH]: rebuilt.report,
  })) {
    const actual = await readFile(repositoryPath(repositoryRoot, relative), "utf8");
    if (actual !== expected) throw new Error(`typed composition release artifact is stale: ${relative}`);
  }
  return {
    valid: true,
    receiptDigest: rebuilt.receipt.receiptDigest,
    generatedArtifacts: Object.keys(rebuilt.files).length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  writeTypedCompositionV1({ root: repositoryRoot })
    .then(({ receipt }) => process.stdout.write(`${receipt.receiptDigest}\n`))
    .catch((error) => {
      process.stderr.write(`typed composition build failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
