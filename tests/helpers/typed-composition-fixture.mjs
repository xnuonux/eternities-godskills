import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileActivationDecision } from "../../src/adaptive-activation.mjs";
import { buildActivationResult } from "../../src/adaptive-activation-protocol.mjs";
import {
  loadTypedCompositionRegistry,
  sealTypedCompositionPlan,
} from "../../src/typed-composition.mjs";

export const root = new URL("../../", import.meta.url);
export const rootPath = fileURLToPath(root);

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

export const canonicalJson = (value) => `${JSON.stringify(stable(value), null, 2)}\n`;
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const logicalDigest = (value) => sha256(JSON.stringify(stable(value)));

export async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

export const defaultAuthority = Object.freeze({
  availableAuthority: Object.freeze(["local-read", "local-write", "repository-write"]),
  permittedEffects: Object.freeze(["local-read", "local-write"]),
  availablePreconditions: Object.freeze(["repository-present", "settled-outcome"]),
  maximumRisk: "high",
  minimumEvidenceConfidence: "verified",
  contextBudget: 4096,
});

export async function buildActivation({
  capabilityIds = ["eternities-muse", "eternities-forge"],
  authorityProjection = defaultAuthority,
  trustRootDigest,
} = {}) {
  const [policy, evidence, executableReceipt] = await Promise.all([
    json("policies/adaptive-activation.v1.json"),
    json("artifacts/adaptive-activation/evidence.v1.json"),
    json("receipts/adaptive-activation-executable-v1.json"),
  ]);
  const policyRow = executableReceipt.artifacts.find(({ role }) => role === "policy");
  const evidenceRow = executableReceipt.artifacts.find(({ role }) => role === "evidence");
  const classification = {
    taskClass: "implementation",
    consequenceClass: "consequential",
    reviewAvailable: false,
  };
  const authority = structuredClone(authorityProjection);
  const request = {
    schemaVersion: 1,
    protocolId: "eternities-godskills-activation-v1",
    requestId: `typed-composition:${capabilityIds.join("+")}`,
    trustRootDigest: trustRootDigest ?? executableReceipt.receiptDigest,
    classification,
    selected: capabilityIds.map((selectedId) => ({
      selectedId,
      explicitMethodRequest: false,
    })),
    authorityProjection: authority,
  };
  const task = {
    taskClass: classification.taskClass,
    consequenceClass: classification.consequenceClass,
    authorityProjection: authority,
  };
  const decisions = capabilityIds.map((selectedId) => compileActivationDecision({
    selectedId,
    task,
    reviewAvailable: false,
    policy,
    evidence,
  }));
  const result = buildActivationResult({
    request,
    decisions,
    policyDigest: policyRow.logicalDigest,
    evidenceDigest: evidenceRow.logicalDigest,
  });
  return { request, result, executableReceipt };
}

export function unsignedPositivePlan({
  registry,
  activationResult,
  authorityProjection = defaultAuthority,
  maximumContextBytes = 16384,
} = {}) {
  const decision = Object.fromEntries(
    activationResult.decisions.map((row) => [row.selectedId, row]),
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
        activationDecisionDigest: decision["eternities-muse"].decisionDigest,
      },
      {
        nodeId: "implementation",
        phase: "implementation",
        capabilityId: "eternities-forge",
        activationDecisionDigest: decision["eternities-forge"].decisionDigest,
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

export async function buildFixture(t, {
  mutatePolicy,
  authorityProjection = defaultAuthority,
  maximumContextBytes = 16384,
  read,
} = {}) {
  const canonicalPolicy = await json("policies/typed-composition.v1.json");
  const policy = structuredClone(canonicalPolicy);
  mutatePolicy?.(policy);
  const policyBytes = Buffer.from(canonicalJson(policy));
  let policyPath = fileURLToPath(new URL("policies/typed-composition.v1.json", root));
  if (mutatePolicy) {
    const directory = await mkdtemp(path.join(tmpdir(), "typed-composition-policy-"));
    policyPath = path.join(directory, "policy.json");
    await writeFile(policyPath, policyBytes);
    t?.after(() => rm(directory, { recursive: true, force: true }));
  }
  const registry = await loadTypedCompositionRegistry({
    repositoryRoot: rootPath,
    policyPath,
    expectedPolicyDigest: sha256(policyBytes),
    ...(read ? { read } : {}),
  });
  const { result: activationResult, executableReceipt } = await buildActivation({
    authorityProjection,
    trustRootDigest: registry.activationTrustRootDigest,
  });
  const plan = sealTypedCompositionPlan(unsignedPositivePlan({
    registry,
    activationResult,
    authorityProjection,
    maximumContextBytes,
  }));
  return {
    policy,
    policyBytes,
    registry,
    activationResult,
    executableReceipt,
    plan,
  };
}

export function reseal(plan, mutate) {
  const unsigned = structuredClone(plan);
  delete unsigned.planDigest;
  mutate(unsigned);
  return sealTypedCompositionPlan(unsigned);
}

export const missionInputs = Object.freeze({
  "available-specialists": Object.freeze(["interface", "motion", "accessibility"]),
  "design-constraints": Object.freeze(["deterministic", "bounded-authority"]),
  "repository-state": Object.freeze({ branch: "feat/typed-composition-v1", clean: false }),
  "settled-outcome": Object.freeze({ objective: "compile a typed Muse to Forge mission" }),
  "visual-source-set": Object.freeze(["brand-system", "implemented-interface"]),
});

export function canaryExecutors({ observed } = {}) {
  const acceptanceBoundary = {
    invariants: ["typed-handoff", "no-authority-expansion"],
    rejectionCriteria: ["implicit-coercion", "missing-evidence"],
  };
  return {
    acceptanceBoundary,
    executors: {
      "eternities-muse": async (input) => {
        observed?.push({ capabilityId: "eternities-muse", input });
        return {
          schemaVersion: 1,
          capabilityId: "eternities-muse",
          missionId: input.missionId,
          slots: {
            "visual-direction": { direction: "white-fire-sovereign" },
            "visual-system": { tokens: ["luminance", "motion"] },
            "specialist-handoff": { target: "eternities-forge" },
            "acceptance-boundary": acceptanceBoundary,
          },
        };
      },
      "eternities-forge": async (input) => {
        observed?.push({ capabilityId: "eternities-forge", input });
        return {
          schemaVersion: 1,
          capabilityId: "eternities-forge",
          missionId: input.missionId,
          slots: {
            implementation: { status: "verified" },
            "claim-evidence-ledger": { claims: 2, evidence: 2 },
            "review-disposition": { disposition: "accepted" },
            "integration-state": { state: "ready" },
          },
        };
      },
    },
  };
}
