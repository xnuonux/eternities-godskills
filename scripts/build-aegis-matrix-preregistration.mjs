import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalDigest,
  canonicalFile,
  validateAdaptiveEvidencePolicy,
} from "../src/adaptive-evidence-contracts.mjs";
import { canonicalJson as capabilityCanonicalFile } from "../src/capability-layer-abi.mjs";
import { preregisterTrial, verifyTrialEnvelope } from "../src/adaptive-evidence-trials.mjs";
import { sha256 } from "../src/io.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";
import { AEGIS_MATRIX_VERIFIER_ID } from "./evaluate-aegis-matrix.mjs";

const POLICY_PATH = "policies/adaptive-evidence.v2.json";
const TASK_PATH = "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json";
const COMPARISON_PATH = "evidence/adaptive-evidence-v2/aegis-matrix/comparison-policy.json";
const MANIFEST_PATH = "artifacts/capability-layers/eternities-aegis/manifest.v1.json";
const PROMPT_PATH = "scripts/construct-aegis-matrix-prompt.mjs";
const EVALUATOR_PATH = "scripts/evaluate-aegis-matrix.mjs";
const ENVIRONMENT_PATH = "evidence/adaptive-evidence-v2/aegis-matrix/environment.json";
const TRIAL_PATH = "evidence/adaptive-evidence-v2/aegis-matrix/trial-envelope.json";
const TRUSTED_POLICY_DIGEST = "2f0e8c6b68c13be56b8a7ec2332402f4a3939368a162c31bde0fac3ef3ae7260";
const REGISTERED_AT = "2026-08-31T07:10:00.000Z";
const LIMITATION = "global-system-instructions-beyond-the-user-global-policy-file-are-not-byte-observable";

async function loadInput(root, relative, { json = false } = {}) {
  const bytes = await readFile(new URL(relative, root));
  return {
    path: relative,
    bytes,
    sha256: sha256(bytes),
    value: json ? JSON.parse(bytes) : bytes.toString("utf8"),
  };
}

function inputRecord(input, extra = {}) {
  return {
    path: input.path,
    sha256: input.sha256,
    bytes: input.bytes.length,
    ...extra,
  };
}

async function loadAegisBundle(root) {
  const manifest = await loadInput(root, MANIFEST_PATH, { json: true });
  const { bundleDigest, ...manifestBody } = manifest.value;
  if (manifest.value.capabilityId !== "eternities-aegis"
      || manifest.value.capabilityGrantsAuthority !== false
      || sha256(capabilityCanonicalFile(manifestBody)) !== bundleDigest) {
    throw new Error("Aegis capability manifest is not internally valid");
  }

  const selected = {};
  for (const name of ["guardrails", "method", "reviewer"]) {
    const descriptor = manifest.value.layers?.[name];
    if (!descriptor) throw new Error(`Aegis ${name} layer is absent`);
    const relative = `artifacts/capability-layers/eternities-aegis/${descriptor.path}`;
    const input = await loadInput(root, relative);
    if (input.sha256 !== descriptor.sha256 || input.bytes.length !== descriptor.bytes) {
      throw new Error(`Aegis ${name} layer does not match its manifest`);
    }
    selected[name] = inputRecord(input, { name, mediaType: descriptor.mediaType });
  }
  return {
    manifest: inputRecord(manifest, { bundleDigest }),
    capabilityId: manifest.value.capabilityId,
    capabilityVersion: bundleDigest,
    layers: selected,
  };
}

function disclosures(layers) {
  return [
    { variant: "raw", layers: [] },
    { variant: "guardrail", layers: [layers.guardrails] },
    { variant: "method", layers: [layers.method] },
    { variant: "reviewer", layers: [layers.reviewer] },
    { variant: "combined", layers: [layers.reviewer] },
  ];
}

function buildEnvironment({
  hostPolicyPath,
  hostPolicyBytes,
  prompt,
  evaluator,
  taskDefinition,
  comparisonPolicy,
  aegis,
}) {
  const body = {
    schemaVersion: 2,
    id: "aegis-terra-five-condition-environment-v1",
    modelFamily: "gpt-5.6-terra",
    reasoningTier: "high",
    runner: "codex-multi-agent-v1",
    externalToolsAllowed: [],
    authorityExpanded: false,
    hostPolicy: {
      path: hostPolicyPath,
      sha256: sha256(hostPolicyBytes),
      bytes: hostPolicyBytes.length,
    },
    promptConstructor: inputRecord(prompt),
    evaluator: inputRecord(evaluator, { id: AEGIS_MATRIX_VERIFIER_ID }),
    taskDefinitionDigest: canonicalDigest(taskDefinition.value),
    comparisonPolicyDigest: canonicalDigest(comparisonPolicy.value),
    capability: {
      id: aegis.capabilityId,
      version: aegis.capabilityVersion,
      manifest: aegis.manifest,
      selectedLayers: [
        aegis.layers.guardrails,
        aegis.layers.method,
        aegis.layers.reviewer,
      ],
    },
    disclosures: disclosures(aegis.layers),
    hostContextLimitations: [LIMITATION],
  };
  return { ...body, environmentDigest: canonicalDigest(body) };
}

export async function rebuildAegisMatrixPreregistration({
  root = new URL("../", import.meta.url),
  hostPolicyPath,
} = {}) {
  if (typeof hostPolicyPath !== "string" || hostPolicyPath.trim() === "") {
    throw new TypeError("hostPolicyPath must be a non-empty absolute path");
  }
  const [policy, taskDefinition, comparisonPolicy, prompt, evaluator, hostPolicyBytes, aegis] =
    await Promise.all([
      loadInput(root, POLICY_PATH, { json: true }),
      loadInput(root, TASK_PATH, { json: true }),
      loadInput(root, COMPARISON_PATH, { json: true }),
      loadInput(root, PROMPT_PATH),
      loadInput(root, EVALUATOR_PATH),
      readFile(hostPolicyPath),
      loadAegisBundle(root),
    ]);

  validateAdaptiveEvidencePolicy({
    policy: policy.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  if (!comparisonPolicy.value.metrics.includes(`evaluator-sha256:${evaluator.sha256}`)) {
    throw new Error("comparison policy does not bind the exact evaluator bytes");
  }
  const environment = buildEnvironment({
    hostPolicyPath,
    hostPolicyBytes,
    prompt,
    evaluator,
    taskDefinition,
    comparisonPolicy,
    aegis,
  });
  const trial = preregisterTrial({
    trialId: "aegis-terra-five-condition-001",
    profileIdentity: {
      capabilityId: aegis.capabilityId,
      taskClass: "security-review",
      modelFamily: environment.modelFamily,
      reasoningTier: environment.reasoningTier,
      consequenceClass: "consequential",
      capabilityVersion: aegis.capabilityVersion,
      environmentId: environment.environmentDigest,
    },
    capabilityManifestDigest: aegis.capabilityVersion,
    taskDefinition: taskDefinition.value,
    comparisonPolicy: comparisonPolicy.value,
    artifactBoundary: { mediaType: "application/json", required: true },
    evaluator: {
      kind: "deterministic-verifier",
      id: AEGIS_MATRIX_VERIFIER_ID,
      digest: evaluator.sha256,
    },
    producerId: "codex-multi-agent-v1",
    registeredAt: REGISTERED_AT,
    policy: policy.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  verifyTrialEnvelope({
    trial,
    policy: policy.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const files = {
    [ENVIRONMENT_PATH]: canonicalFile(environment),
    [TRIAL_PATH]: canonicalFile(trial),
  };
  return Object.freeze({
    environment: Object.freeze(environment),
    trial,
    files: Object.freeze(files),
  });
}

export async function verifyCheckedAegisMatrixPreregistration(options = {}) {
  const root = options.root ?? new URL("../", import.meta.url);
  const rebuilt = await rebuildAegisMatrixPreregistration({ ...options, root });
  for (const [relative, expected] of Object.entries(rebuilt.files)) {
    const actual = await readFile(new URL(relative, root), "utf8");
    if (actual !== expected) throw new Error(`checked Aegis preregistration drifted: ${relative}`);
  }
  return { valid: true, files: Object.keys(rebuilt.files).length };
}

export async function writeAegisMatrixPreregistration(options = {}) {
  const root = options.root ?? new URL("../", import.meta.url);
  const rebuilt = await rebuildAegisMatrixPreregistration({ ...options, root });
  await commitGeneratedFiles({
    rootPath: fileURLToPath(root),
    writes: rebuilt.files,
  });
  return rebuilt;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv.includes("--write")) {
    throw new Error("use --write to freeze the Aegis matrix preregistration");
  }
  const hostPolicyIndex = process.argv.indexOf("--host-policy");
  const hostPolicyPath = hostPolicyIndex >= 0 ? process.argv[hostPolicyIndex + 1] : null;
  const result = await writeAegisMatrixPreregistration({ hostPolicyPath });
  process.stdout.write(JSON.stringify({
    environmentDigest: result.environment.environmentDigest,
    trialDigest: result.trial.trialDigest,
    files: Object.keys(result.files).length,
  }) + "\n");
}
