import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  canonicalDigest,
  canonicalFile,
  validateAdaptiveEvidencePolicy,
} from "../src/adaptive-evidence-contracts.mjs";
import {
  appendEvidenceRow,
  createLifecycleController,
  createEvidenceLedger,
  deriveActivationProfile,
  verifyEvidenceLedger,
} from "../src/adaptive-evidence-ledger.mjs";
import { createObservationProposal } from "../src/adaptive-evidence-trials.mjs";
import { sha256 } from "../src/io.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";
import { constructAegisMatrixPrompt } from "./construct-aegis-matrix-prompt.mjs";
import { evaluateAegisMatrixArtifact } from "./evaluate-aegis-matrix.mjs";
import {
  attestAdaptiveEvidenceAuthorization,
  attestAdaptiveEvidenceLifecycleDecision,
  fixtureAuthorityOptions,
} from "./adaptive-evidence-fixture-authority.mjs";

const POLICY_PATH = "policies/adaptive-evidence.v2.json";
const MATRIX_ROOT = "evidence/adaptive-evidence-v2/aegis-matrix";
const TASK_PATH = `${MATRIX_ROOT}/task-definition.json`;
const COMPARISON_PATH = `${MATRIX_ROOT}/comparison-policy.json`;
const ENVIRONMENT_PATH = `${MATRIX_ROOT}/environment.json`;
const TRIAL_PATH = `${MATRIX_ROOT}/trial-envelope.json`;
const OUTPUT_PATHS = Object.freeze({
  authorization: `${MATRIX_ROOT}/lifecycle-authorization.json`,
  attestation: `${MATRIX_ROOT}/lifecycle-attestation.json`,
  ledger: `${MATRIX_ROOT}/ledger.json`,
  profile: `${MATRIX_ROOT}/profile.json`,
  lifecycle: `${MATRIX_ROOT}/lifecycle.json`,
});
const VARIANTS = Object.freeze(["raw", "guardrail", "method", "reviewer", "combined"]);
const VARIANT_LAYER = Object.freeze({
  raw: null,
  guardrail: "guardrails",
  method: "method",
  reviewer: "reviewer",
  combined: "reviewer",
});
const PARENT_VARIANT = Object.freeze({ reviewer: "raw", combined: "method" });
const TRUSTED_POLICY_DIGEST = "2f0e8c6b68c13be56b8a7ec2332402f4a3939368a162c31bde0fac3ef3ae7260";
const TRUSTED_ENVIRONMENT_DIGEST = "c8897601687882e423aa565150c38b8d6c18456db3d17a19d6bd6db695c572b8";
const TRUSTED_TRIAL_DIGEST = "0c19530c4e6b8ddc5588e832f82e719fbf4069a547032251234d3d9420959a76";
const TRUSTED_EXECUTABLE_RECEIPT_DIGEST = "c5a086bb131ff7e1a9508f02b95796ae9066627be3e8e1f8b7e57421220e9bd7";
const TRUSTED_EXECUTABLE_RECEIPT_SHA256 = "98ebeb63db38b67608cf71b1b511b807cfe2d96e17e9b1bc54e7dbb536f8403f";
const TRUSTED_EXECUTABLE_COMMIT = "f6b828ffbea29cf28cba751d4438e5c41a8deb2d";
const LEDGER_CREATED_AT = "2026-08-31T07:10:01.000Z";
const AUTHORIZATION_ISSUED_AT = "2026-08-31T07:45:00.000Z";
const LIFECYCLE_ACTOR = "external-aegis-matrix-maintainer";

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || JSON.stringify(Object.keys(value).sort(lexical))
        !== JSON.stringify([...expected].sort(lexical))) {
    throw new Error(`${label} keys are not closed`);
  }
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function exactIso(value, label) {
  nonEmpty(value, label);
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an exact ISO timestamp`);
  }
}

function deepExact(actual, expected, label) {
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`${label} is not exact`);
}

function verifyEnvironment(environment, trial, taskDefinitionText, comparisonPolicy) {
  const { environmentDigest, ...body } = environment;
  let taskDefinition;
  try {
    taskDefinition = JSON.parse(taskDefinitionText);
  } catch {
    throw new Error("matrix task definition is not valid JSON");
  }
  if (environmentDigest !== TRUSTED_ENVIRONMENT_DIGEST
      || trial.trialDigest !== TRUSTED_TRIAL_DIGEST
      || canonicalDigest(body) !== environmentDigest
      || trial.profileIdentity.environmentId !== environmentDigest
      || trial.profileIdentity.modelFamily !== environment.modelFamily
      || trial.profileIdentity.reasoningTier !== environment.reasoningTier
      || canonicalDigest(taskDefinition) !== trial.taskDefinition.digest
      || canonicalDigest(comparisonPolicy) !== trial.comparisonPolicy.digest
      || environment.taskDefinitionDigest !== trial.taskDefinition.digest
      || environment.comparisonPolicyDigest !== trial.comparisonPolicy.digest
      || environment.authorityExpanded !== false
      || !Array.isArray(environment.externalToolsAllowed)
      || environment.externalToolsAllowed.length !== 0) {
    throw new Error("matrix environment does not match the trusted trial identity");
  }
}

function verifyLayers(layers, environment) {
  exactKeys(layers, ["guardrails", "method", "reviewer"], "matrix layers");
  const trusted = Object.fromEntries(
    environment.capability.selectedLayers.map((layer) => [layer.name, layer]),
  );
  for (const name of ["guardrails", "method", "reviewer"]) {
    const layer = layers[name];
    exactKeys(
      layer,
      ["bytes", "mediaType", "name", "path", "sha256", "text"],
      `matrix ${name} layer`,
    );
    const { text, ...record } = layer;
    if (sha256(text) !== layer.sha256 || Buffer.byteLength(text) !== layer.bytes) {
      throw new Error(`matrix ${name} layer bytes do not match its digest`);
    }
    deepExact(record, trusted[name], `matrix ${name} layer commitment`);
  }
}

function parentEvidence(captures, variant) {
  const parentVariant = PARENT_VARIANT[variant];
  if (!parentVariant) return null;
  const capture = captures[parentVariant];
  return {
    variant: parentVariant,
    artifactText: capture.artifact.artifactText,
    expectedArtifactDigest: capture.artifact.artifactDigest,
    expectedEvaluationDigest: capture.observation.evaluation.evaluationDigest,
  };
}

function rawBaseline(captures) {
  const capture = captures.raw;
  return {
    variant: "raw",
    artifactText: capture.artifact.artifactText,
    expectedArtifactDigest: capture.artifact.artifactDigest,
    expectedEvaluationDigest: capture.observation.evaluation.evaluationDigest,
  };
}

function verifyPrompt({ variant, record, taskDefinitionText, layers, captures }) {
  exactKeys(
    record,
    ["prompt", "promptDigest", "promptBytes", "disclosedLayers", "parent"],
    `${variant} prompt record`,
  );
  const layerName = VARIANT_LAYER[variant];
  const layer = layerName === null ? null : layers[layerName];
  const expected = constructAegisMatrixPrompt({
    variant,
    taskDefinitionText,
    authorizedLayer: layer === null ? null : {
      name: layer.name,
      path: layer.path,
      text: layer.text,
      sha256: layer.sha256,
    },
    parent: parentEvidence(captures, variant),
  });
  deepExact(record, expected, `${variant} prompt reconstruction`);
  return expected;
}

function verifyArtifact({ variant, record, prompt, trial }) {
  exactKeys(record, [
    "schemaVersion", "variant", "modelFamily", "reasoningTier", "agentId",
    "promptDigest", "promptBytes", "parent", "artifactText", "artifactDigest",
    "artifactBytes", "producedAt",
  ], `${variant} artifact record`);
  if (record.schemaVersion !== 1 || record.variant !== variant
      || record.modelFamily !== trial.profileIdentity.modelFamily
      || record.reasoningTier !== trial.profileIdentity.reasoningTier
      || record.promptDigest !== prompt.promptDigest || record.promptBytes !== prompt.promptBytes
      || sha256(record.artifactText) !== record.artifactDigest
      || Buffer.byteLength(record.artifactText) !== record.artifactBytes) {
    throw new Error(`${variant} artifact digest, bytes, prompt, or model identity is invalid`);
  }
  nonEmpty(record.agentId, `${variant} artifact agentId`);
  exactIso(record.producedAt, `${variant} artifact producedAt`);
  if (new Date(record.producedAt) <= new Date(trial.registeredAt)) {
    throw new Error(`${variant} artifact predates trial registration`);
  }
  deepExact(record.parent, prompt.parent, `${variant} artifact parent`);
}

function evaluationArgs({ variant, artifactText, prompt, captures }) {
  if (variant === "raw") return { variant, artifactText };
  const args = { variant, artifactText, rawBaseline: rawBaseline(captures) };
  if (PARENT_VARIANT[variant]) {
    args.parent = parentEvidence(captures, variant);
    args.promptEvidence = prompt;
  }
  return args;
}

function verifyObservation({ variant, record, artifact, evaluation }) {
  exactKeys(
    record,
    ["schemaVersion", "variant", "evaluatorId", "artifactDigest", "observedAt", "evaluation"],
    `${variant} observation record`,
  );
  if (record.schemaVersion !== 1 || record.variant !== variant
      || record.evaluatorId !== evaluation.verifierId
      || record.artifactDigest !== artifact.artifactDigest) {
    throw new Error(`${variant} observation identity does not match its artifact or evaluator`);
  }
  exactIso(record.observedAt, `${variant} observation observedAt`);
  if (new Date(record.observedAt) <= new Date(artifact.producedAt)) {
    throw new Error(`${variant} observation does not follow artifact production`);
  }
  deepExact(record.evaluation, evaluation, `${variant} evaluation match`);
}

function proposalFor({ trial, policy, variant, prompt, artifact, observation }) {
  const evaluation = observation.evaluation;
  return createObservationProposal({
    trial,
    expectedTrialDigest: trial.trialDigest,
    variant,
    artifact: {
      sha256: artifact.artifactDigest,
      bytes: artifact.artifactBytes,
      mediaType: trial.artifactBoundary.mediaType,
      producedAt: artifact.producedAt,
    },
    observation: {
      score: evaluation.score,
      outcomeAgainstRaw: evaluation.comparison.outcomeAgainstRaw,
      criticalRegression: evaluation.criticalRegression,
      baselineArtifactDigest: evaluation.comparison.baselineArtifactDigest,
      comparisons: structuredClone(evaluation.comparison.counts),
      reasonCodes: [...evaluation.reasonCodes],
    },
    cost: {
      bytes: prompt.promptBytes + artifact.artifactBytes,
      tokens: null,
      latencyMs: null,
      monetaryCost: null,
    },
    proofLevel: "model",
    producerId: artifact.agentId,
    evaluatorId: observation.evaluatorId,
    observedAt: observation.observedAt,
    policy,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
}

export function compileAegisMatrixEvidence(input = {}) {
  exactKeys(input, [
    "policy", "trial", "environment", "taskDefinitionText", "comparisonPolicy", "layers",
    "captures",
  ], "matrix evidence compilation input");
  const {
    policy,
    trial,
    environment,
    taskDefinitionText,
    comparisonPolicy,
    layers,
    captures,
  } = input;
  validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest: TRUSTED_POLICY_DIGEST });
  verifyEnvironment(environment, trial, taskDefinitionText, comparisonPolicy);
  verifyLayers(layers, environment);
  exactKeys(captures, VARIANTS, "matrix captures");

  const verified = {};
  for (const variant of VARIANTS) {
    const capture = captures[variant];
    exactKeys(capture, ["prompt", "artifact", "observation"], `${variant} capture`);
    const prompt = verifyPrompt({
      variant,
      record: capture.prompt,
      taskDefinitionText,
      layers,
      captures,
    });
    verifyArtifact({ variant, record: capture.artifact, prompt, trial });
    const evaluation = evaluateAegisMatrixArtifact(evaluationArgs({
      variant,
      artifactText: capture.artifact.artifactText,
      prompt,
      captures,
    }));
    verifyObservation({
      variant,
      record: capture.observation,
      artifact: capture.artifact,
      evaluation,
    });
    verified[variant] = { prompt, artifact: capture.artifact, observation: capture.observation };
  }

  let ledger = createEvidenceLedger({
    trial,
    createdAt: LEDGER_CREATED_AT,
    policy,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  for (const variant of VARIANTS) {
    const proposal = proposalFor({ trial, policy, variant, ...verified[variant] });
    ledger = appendEvidenceRow({
      ledger,
      trial,
      proposal,
      policy,
      expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
    });
  }
  const verification = verifyEvidenceLedger({
    ledger,
    trial,
    policy,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const profile = deriveActivationProfile({
    ledger,
    trial,
    policy,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const authorizationRecord = {
    schemaVersion: 1,
    authorizationId: "aegis-matrix-method-promotion-attempt",
    actorId: LIFECYCLE_ACTOR,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    profileDigest: profile.profileDigest,
    bindingsDigest: canonicalDigest(profile.boundDigests),
    grant: policy.lifecycleGrants.promote,
    issuedAt: "2026-08-31T07:44:00.000Z",
    expiresAt: "2026-09-01T07:44:00.000Z",
  };
  const authorizationPackage = attestAdaptiveEvidenceAuthorization(authorizationRecord);
  const lifecycleController = createLifecycleController(
    fixtureAuthorityOptions(TRUSTED_POLICY_DIGEST),
  );
  const lifecycle = lifecycleController.compileLifecycleDecision({
    profile,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    authorizationPackage,
    decidedAt: AUTHORIZATION_ISSUED_AT,
    currentIdentity: profile.profileIdentity,
    currentBindings: profile.boundDigests,
    policy,
  });
  const lifecycleDecisionAttestation = attestAdaptiveEvidenceLifecycleDecision(lifecycle);
  const files = {
    [OUTPUT_PATHS.authorization]: canonicalFile(authorizationPackage),
    [OUTPUT_PATHS.attestation]: canonicalFile(lifecycleDecisionAttestation),
    [OUTPUT_PATHS.ledger]: canonicalFile(ledger),
    [OUTPUT_PATHS.profile]: canonicalFile(profile),
    [OUTPUT_PATHS.lifecycle]: canonicalFile(lifecycle),
  };
  return Object.freeze({
    ledger,
    verification,
    profile,
    lifecycle,
    lifecycleDecisionAttestation,
    authorizationPackage,
    files: Object.freeze(files),
  });
}

async function loadJson(root, relative) {
  return JSON.parse(await readFile(new URL(relative, root), "utf8"));
}

async function checkedHostPolicyPath(root, supplied) {
  if (supplied !== undefined) return supplied;
  const environment = await loadJson(root, ENVIRONMENT_PATH);
  return environment.hostPolicy.path;
}

async function loadCompilationInputs(root, trial, environment) {
  const [policy, taskDefinitionText, comparisonPolicy, ...captureRecords] = await Promise.all([
    loadJson(root, POLICY_PATH),
    readFile(new URL(TASK_PATH, root), "utf8"),
    loadJson(root, COMPARISON_PATH),
    ...VARIANTS.flatMap((variant) => [
      loadJson(root, `${MATRIX_ROOT}/prompts/${variant}.json`),
      loadJson(root, `${MATRIX_ROOT}/artifacts/${variant}.json`),
      loadJson(root, `${MATRIX_ROOT}/observations/${variant}.json`),
    ]),
  ]);
  const captures = {};
  for (const [index, variant] of VARIANTS.entries()) {
    captures[variant] = {
      prompt: captureRecords[index * 3],
      artifact: captureRecords[index * 3 + 1],
      observation: captureRecords[index * 3 + 2],
    };
  }
  const layers = {};
  for (const layer of environment.capability.selectedLayers) {
    layers[layer.name] = {
      ...layer,
      text: await readFile(new URL(layer.path, root), "utf8"),
    };
  }
  return { policy, trial, environment, taskDefinitionText, comparisonPolicy, layers, captures };
}

async function verifyArchivedTrustRoots(root, environment) {
  const executable = environment.executableTrustRoot;
  if (executable.canonicalCommit !== TRUSTED_EXECUTABLE_COMMIT
      || executable.receipt.receiptDigest !== TRUSTED_EXECUTABLE_RECEIPT_DIGEST
      || executable.receipt.sha256 !== TRUSTED_EXECUTABLE_RECEIPT_SHA256) {
    throw new Error("archived matrix executable trust root is invalid");
  }
  const [constructorBytes, evaluatorBytes, executableReceiptBytes] = await Promise.all([
    readFile(new URL(environment.promptConstructor.path, root)),
    readFile(new URL(environment.evaluator.path, root)),
    readFile(new URL(executable.receipt.path, root)),
  ]);
  if (sha256(constructorBytes) !== environment.promptConstructor.sha256
      || constructorBytes.length !== environment.promptConstructor.bytes
      || sha256(evaluatorBytes) !== environment.evaluator.sha256
      || evaluatorBytes.length !== environment.evaluator.bytes
      || sha256(executableReceiptBytes) !== executable.receipt.sha256
      || executableReceiptBytes.length !== executable.receipt.bytes) {
    throw new Error("archived matrix runtime bytes drifted from the frozen environment");
  }
  const executableReceipt = JSON.parse(executableReceiptBytes);
  if (executableReceipt.receiptDigest !== TRUSTED_EXECUTABLE_RECEIPT_DIGEST
      || executableReceipt.status !== "verified-build"
      || executableReceipt.protocolId !== "eternities-godskills-activation-v1") {
    throw new Error("archived matrix executable receipt is invalid");
  }
}

async function verifyCheckedFiles(root, files, label) {
  for (const [relative, expected] of Object.entries(files)) {
    const actual = await readFile(new URL(relative, root), "utf8");
    if (actual !== expected) throw new Error(`checked ${label} drifted: ${relative}`);
  }
}

export async function rebuildAegisMatrixEvidence({
  root = new URL("../", import.meta.url),
  hostPolicyPath,
  hostPolicySnapshotPath,
} = {}) {
  const resolvedHostPolicyPath = await checkedHostPolicyPath(root, hostPolicyPath);
  const { rebuildAegisMatrixPreregistration } =
    await import("./build-aegis-matrix-preregistration.mjs");
  const preregistration = await rebuildAegisMatrixPreregistration({
    root,
    hostPolicyPath: resolvedHostPolicyPath,
    hostPolicySnapshotPath,
  });
  await verifyCheckedFiles(root, preregistration.files, "Aegis preregistration");
  return compileAegisMatrixEvidence(await loadCompilationInputs(
    root,
    preregistration.trial,
    preregistration.environment,
  ));
}

export async function rebuildArchivedAegisMatrixEvidence({
  root = new URL("../", import.meta.url),
} = {}) {
  const [environment, trial] = await Promise.all([
    loadJson(root, ENVIRONMENT_PATH),
    loadJson(root, TRIAL_PATH),
  ]);
  await verifyArchivedTrustRoots(root, environment);
  const rebuilt = compileAegisMatrixEvidence(
    await loadCompilationInputs(root, trial, environment),
  );
  await verifyCheckedFiles(root, rebuilt.files, "Aegis matrix evidence");
  return rebuilt;
}

export async function verifyCheckedAegisMatrixEvidence(options = {}) {
  const root = options.root ?? new URL("../", import.meta.url);
  const rebuilt = await rebuildAegisMatrixEvidence({ ...options, root });
  await verifyCheckedFiles(root, rebuilt.files, "Aegis matrix evidence");
  return { valid: true, files: Object.keys(rebuilt.files).length };
}

export async function writeAegisMatrixEvidence(options = {}) {
  const root = options.root ?? new URL("../", import.meta.url);
  const rebuilt = await rebuildAegisMatrixEvidence({ ...options, root });
  await commitGeneratedFiles({
    rootPath: fileURLToPath(root),
    writes: rebuilt.files,
  });
  return rebuilt;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv.includes("--write")) {
    throw new Error("use --write to persist the verified Aegis matrix evidence");
  }
  const hostPolicyIndex = process.argv.indexOf("--host-policy");
  const hostPolicyPath = hostPolicyIndex >= 0 ? process.argv[hostPolicyIndex + 1] : undefined;
  const result = await writeAegisMatrixEvidence({ hostPolicyPath });
  process.stdout.write(JSON.stringify({
    rows: result.verification.rowCount,
    profile: result.profile.lifecycleState,
    lifecycle: result.lifecycle.status,
    ledgerDigest: result.ledger.ledgerDigest,
  }) + "\n");
}
