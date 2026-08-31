import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildAdaptiveEvaluatorSchemas,
} from "../src/adaptive-evaluator-package.mjs";
import {
  canonicalDigest,
  canonicalFile,
} from "../src/adaptive-evidence-contracts.mjs";
import { evaluateAegisArtifactV2 } from "../src/aegis-evaluator-v2.mjs";
import { sha256 } from "../src/io.mjs";
import {
  buildAdaptiveEvaluatorPackageReceipt,
} from "./build-adaptive-evaluator-package-receipt.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";

const MATRIX_ROOT = "evidence/adaptive-evidence-v2/aegis-matrix";
const PARENT_RECEIPT_PATH = "receipts/adaptive-evidence-v2.json";
const POLICY_PATH = "policies/adaptive-evaluator-packages.v1.json";
const ORACLE_PATH = "artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json";
const TASK_PATH = `${MATRIX_ROOT}/task-definition.json`;
const TRIAL_PATH = `${MATRIX_ROOT}/trial-envelope.json`;
const PACKAGE_RECEIPT_PATH = "receipts/adaptive-evaluator-aegis-v2.json";
const SHADOW_PATH = "artifacts/adaptive-evaluators/aegis-v2/shadow-replay.v1.json";
const REPORT_PATH = "docs/adaptive-evaluator-aegis-v2-shadow-report.md";
const AGGREGATE_RECEIPT_PATH = "receipts/adaptive-evaluator-packages-v1.json";
const RUNTIME_PATH = "runtime/adaptive-evaluator-packages-v1.md";
const TRUSTED_PARENT_RECEIPT_DIGEST =
  "2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d";
const TRUSTED_PARENT_FILE_SHA256 =
  "7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a";
const VARIANTS = Object.freeze(["raw", "guardrail", "method", "reviewer", "combined"]);
const REVIEW_PARENTS = Object.freeze({ reviewer: "raw", combined: "method" });
const SCHEMA_PATHS = Object.freeze({
  "adaptive-evaluator-package-v1.schema.json":
    "schemas/adaptive-evaluator-package-v1.schema.json",
  "adaptive-evaluator-request-v1.schema.json":
    "schemas/adaptive-evaluator-request-v1.schema.json",
  "adaptive-evaluator-result-v1.schema.json":
    "schemas/adaptive-evaluator-result-v1.schema.json",
});
const SOURCE_PATHS = Object.freeze([
  "package.json",
  "scripts/build-adaptive-evaluator-package-receipt.mjs",
  "scripts/build-aegis-evaluator-v2-shadow-replay.mjs",
  "scripts/build-capability-layer-abi.mjs",
  "scripts/evaluate-aegis-matrix.mjs",
  "src/adaptive-evaluator-package.mjs",
  "src/adaptive-evidence-contracts.mjs",
  "src/aegis-evaluator-v2.mjs",
  "src/capability-layer-abi.mjs",
  "src/io.mjs",
  "src/paths.mjs",
  "src/static-module-closure.mjs",
]);

export const AEGIS_SHADOW_INPUT_PATHS = Object.freeze([
  PARENT_RECEIPT_PATH,
  POLICY_PATH,
  RUNTIME_PATH,
  ORACLE_PATH,
  TASK_PATH,
  TRIAL_PATH,
  ...VARIANTS.flatMap((variant) => [
    `${MATRIX_ROOT}/artifacts/${variant}.json`,
    `${MATRIX_ROOT}/observations/${variant}.json`,
  ]),
  ...SOURCE_PATHS,
].sort());

function asRootUrl(root) {
  if (root instanceof URL) return root;
  if (typeof root !== "string" || root.trim() === "") {
    throw new TypeError("Aegis shadow root must be a file URL or path");
  }
  return pathToFileURL(`${path.resolve(root)}${path.sep}`);
}

async function loadInput(root, relativePath, { json = false } = {}) {
  const bytes = await readFile(new URL(relativePath, root));
  const input = {
    path: relativePath,
    bytes,
    sha256: sha256(bytes),
  };
  if (json) {
    try {
      input.value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${relativePath} is invalid JSON`, { cause: error });
    }
  }
  return input;
}

function withoutDigest(value, field) {
  const clone = { ...value };
  delete clone[field];
  return clone;
}

function verifyParentReceipt(parentInput) {
  const parent = parentInput.value;
  if (parent.receiptDigest !== TRUSTED_PARENT_RECEIPT_DIGEST
      || parentInput.sha256 !== TRUSTED_PARENT_FILE_SHA256
      || canonicalDigest(withoutDigest(parent, "receiptDigest")) !== parent.receiptDigest) {
    throw new Error("adaptive evidence v2 parent receipt is not the trusted frozen parent");
  }
  if (parent.schemaVersion !== 2 || parent.status !== "experimental-canary") {
    throw new Error("adaptive evidence v2 parent receipt identity is invalid");
  }
  return parent;
}

function parentFileRecord(parent, relativePath) {
  const records = [
    ...(parent.inputs.freshModelMatrix?.files ?? []),
    ...(parent.inputs.engineSources ?? []),
  ];
  const record = records.find(({ path: candidate }) => candidate === relativePath);
  if (!record) throw new Error(`parent receipt does not bind ${relativePath}`);
  return record;
}

function verifyParentBoundInput(parent, input) {
  const record = parentFileRecord(parent, input.path);
  if (record.sha256 !== input.sha256 || record.bytes !== input.bytes.length) {
    throw new Error(`archived parent input drifted: ${input.path}`);
  }
}

function taskSource(task) {
  const separator = task.mission.indexOf("\n\n");
  if (separator === -1) throw new Error("archived Aegis task source separator is missing");
  return task.mission.slice(separator + 2);
}

function verifyArchive({ parent, trialInput, taskInput, oracleInput, archived }) {
  const trial = trialInput.value;
  const task = taskInput.value;
  const oracle = oracleInput.value;
  if (canonicalDigest(withoutDigest(trial, "trialDigest")) !== trial.trialDigest
      || trial.status !== "preregistered") {
    throw new Error("archived Aegis trial envelope is invalid");
  }
  if (parent.inputs.freshModelMatrix.trialDigest !== trial.trialDigest
      || trial.taskDefinition.digest !== canonicalDigest(task)) {
    throw new Error("archived Aegis trial or task is not bound by its parent");
  }
  verifyParentBoundInput(parent, trialInput);
  verifyParentBoundInput(parent, taskInput);
  const source = taskSource(task);
  if (sha256(source) !== oracle.taskSourceSha256
      || taskInput.sha256 !== oracle.taskDefinitionSha256) {
    throw new Error("Aegis v2 oracle does not bind the frozen task and source");
  }

  const byVariant = new Map(archived.map((entry) => [entry.variant, entry]));
  for (const variant of VARIANTS) {
    const entry = byVariant.get(variant);
    if (!entry) throw new Error(`archived Aegis variant is missing: ${variant}`);
    const { artifactInput, observationInput } = entry;
    verifyParentBoundInput(parent, artifactInput);
    verifyParentBoundInput(parent, observationInput);
    const artifact = artifactInput.value;
    const observation = observationInput.value;
    if (artifact.schemaVersion !== 1 || artifact.variant !== variant
        || artifact.artifactDigest !== sha256(artifact.artifactText)
        || artifact.artifactBytes !== Buffer.byteLength(artifact.artifactText)) {
      throw new Error(`archived ${variant} artifact envelope is invalid`);
    }
    if (observation.schemaVersion !== 1 || observation.variant !== variant
        || observation.evaluatorId !== "aegis-matrix-deterministic-verifier-v1"
        || observation.artifactDigest !== artifact.artifactDigest
        || observation.evaluation.variant !== variant
        || observation.evaluation.verifierId !== observation.evaluatorId
        || observation.evaluation.artifactDigest !== artifact.artifactDigest
        || observation.evaluation.artifactBytes !== artifact.artifactBytes
        || canonicalDigest(withoutDigest(observation.evaluation, "evaluationDigest"))
          !== observation.evaluation.evaluationDigest) {
      throw new Error(`archived ${variant} v1 observation is invalid`);
    }
    const expectedParent = REVIEW_PARENTS[variant];
    if (!expectedParent) {
      if (artifact.parent !== null || observation.evaluation.parent !== null) {
        throw new Error(`archived ${variant} unexpectedly carries a review parent`);
      }
    } else {
      const parentEntry = byVariant.get(expectedParent);
      const expected = {
        variant: expectedParent,
        artifactDigest: parentEntry.artifactInput.value.artifactDigest,
        evaluationDigest: parentEntry.observationInput.value.evaluation.evaluationDigest,
      };
      if (JSON.stringify(artifact.parent) !== JSON.stringify(expected)
          || JSON.stringify(observation.evaluation.parent) !== JSON.stringify(expected)) {
        throw new Error(`archived ${variant} review parent is substituted`);
      }
    }
  }
  return { source, byVariant };
}

function boundResult(result, artifact) {
  return {
    artifactText: artifact.artifactText,
    artifactDigest: artifact.artifactDigest,
    resultText: canonicalFile(result),
    resultDigest: result.resultDigest,
  };
}

function evaluatorRequest({ packageReceipt, task, source, variant, archived, results }) {
  const artifact = archived.get(variant).artifactInput.value;
  const rawArtifact = archived.get("raw").artifactInput.value;
  const baseline = variant === "raw" ? null : boundResult(results.get("raw"), rawArtifact);
  const parentVariant = REVIEW_PARENTS[variant];
  const parent = parentVariant ? boundResult(
    results.get(parentVariant),
    archived.get(parentVariant).artifactInput.value,
  ) : null;
  return {
    schemaVersion: 1,
    packageReceiptDigest: packageReceipt.receiptDigest,
    taskDefinitionDigest: canonicalDigest(task),
    taskSourceText: source,
    taskSourceDigest: sha256(source),
    variant,
    artifactText: artifact.artifactText,
    artifactDigest: artifact.artifactDigest,
    baseline,
    parent,
    evaluatedAt: archived.get(variant).observationInput.value.observedAt,
  };
}

function inputRow(input, { logical = false } = {}) {
  const row = {
    path: input.path,
    sha256: input.sha256,
    bytes: input.bytes.length,
  };
  if (logical) row.logicalDigest = canonicalDigest(input.value);
  return row;
}

function outputRow(relativePath, text, { logical = false } = {}) {
  const row = {
    path: relativePath,
    sha256: sha256(text),
    bytes: Buffer.byteLength(text),
  };
  if (logical) row.logicalDigest = canonicalDigest(JSON.parse(text));
  return row;
}

function buildReport({ shadowReplay }) {
  const rows = shadowReplay.variants.map((row) => {
    const v1 = row.archivedObservation;
    const v2 = row.v2Result;
    return `| ${row.variant} | ${v1.score} / ${v1.maximumScore} | ${v2.score} / ${v2.maximumScore} | ${v2.detectedCases} | ${v2.criticalRegression ? "yes" : "no"} |`;
  });
  return [
    "# Aegis evaluator v2 retrospective shadow report",
    "",
    "status: `retrospective-shadow-ineligible`",
    "",
    `evaluator package: \`${shadowReplay.packageReceiptDigest}\``,
    `shadow replay: \`${shadowReplay.replayDigest}\``,
    `source trial: \`${shadowReplay.sourceTrialDigest}\``,
    "",
    "| variant | archived v1 score | v2 score | v2 detected cases | v2 critical regression |",
    "|---|---:|---:|---:|---|",
    ...rows,
    "",
    "this is a deterministic replay of already-produced artifacts. it repairs evaluator",
    "interpretation only. it is not a preregistered v2 trial, creates no model observation,",
    "and cannot enter a ledger, promote a profile, trigger lifecycle action, or activate",
    "godagents. no historical v1 byte is rewritten.",
    "",
  ].join("\n");
}

function buildAggregateReceipt({
  parentInput,
  packageReceipt,
  shadowReplay,
  schemaTexts,
  packageText,
  shadowText,
  report,
  runtimeInput,
  sourceInputs,
  taskInput,
  oracleInput,
  archived,
}) {
  const outputs = [
    ...Object.entries(schemaTexts).map(([relativePath, text]) =>
      outputRow(relativePath, text, { logical: true })),
    outputRow(PACKAGE_RECEIPT_PATH, packageText, { logical: true }),
    outputRow(SHADOW_PATH, shadowText, { logical: true }),
    outputRow(REPORT_PATH, report),
  ].sort((left, right) => left.path.localeCompare(right.path));
  const archiveInputs = VARIANTS.flatMap((variant) => {
    const entry = archived.get(variant);
    return [inputRow(entry.artifactInput, { logical: true }),
      inputRow(entry.observationInput, { logical: true })];
  });
  const body = {
    schemaVersion: 1,
    id: "adaptive-evaluator-packages-v1",
    status: "verified-retrospective-shadow",
    parent: {
      ...inputRow(parentInput, { logical: true }),
      receiptDigest: parentInput.value.receiptDigest,
    },
    evaluatorPackage: {
      ...outputRow(PACKAGE_RECEIPT_PATH, packageText, { logical: true }),
      receiptDigest: packageReceipt.receiptDigest,
    },
    shadowReplay: {
      ...outputRow(SHADOW_PATH, shadowText, { logical: true }),
      replayDigest: shadowReplay.replayDigest,
    },
    runtime: inputRow(runtimeInput),
    taskDefinition: inputRow(taskInput, { logical: true }),
    oracle: inputRow(oracleInput, { logical: true }),
    sources: sourceInputs.map((input) => inputRow(input)),
    archivedInputs: archiveInputs.sort((left, right) => left.path.localeCompare(right.path)),
    outputs,
    computedGates: {
      exactVariantCount: shadowReplay.variants.length === 5,
      everyExpectedCaseDetected: shadowReplay.variants.every(
        ({ v2Result }) => v2Result.detectedCases === 3,
      ),
      v2CriticalRegressions: shadowReplay.variants.filter(
        ({ v2Result }) => v2Result.criticalRegression,
      ).length,
      historicalFilesModified: 0,
      ledgerRowsCreated: 0,
      profilesPromoted: 0,
      lifecycleActionsAuthorized: 0,
      godagentsActivationsAuthorized: 0,
    },
    proofLimits: [
      "retrospective-only",
      "no-ledger-admission",
      "no-profile-promotion",
      "no-lifecycle-action",
      "no-model-quality-proof",
      "no-godagents-activation",
      "no-authority-expansion",
    ],
  };
  return { ...body, receiptDigest: canonicalDigest(body) };
}

export async function rebuildAegisEvaluatorV2Shadow({
  root = new URL("../", import.meta.url),
} = {}) {
  const rootUrl = asRootUrl(root);
  const [
    parentInput,
    taskInput,
    trialInput,
    oracleInput,
    runtimeInput,
    ...sourceInputs
  ] = await Promise.all([
    loadInput(rootUrl, PARENT_RECEIPT_PATH, { json: true }),
    loadInput(rootUrl, TASK_PATH, { json: true }),
    loadInput(rootUrl, TRIAL_PATH, { json: true }),
    loadInput(rootUrl, ORACLE_PATH, { json: true }),
    loadInput(rootUrl, RUNTIME_PATH),
    ...SOURCE_PATHS.map((relativePath) => loadInput(rootUrl, relativePath)),
  ]);
  const archived = await Promise.all(VARIANTS.map(async (variant) => {
    const [artifactInput, observationInput] = await Promise.all([
      loadInput(rootUrl, `${MATRIX_ROOT}/artifacts/${variant}.json`, { json: true }),
      loadInput(rootUrl, `${MATRIX_ROOT}/observations/${variant}.json`, { json: true }),
    ]);
    return { variant, artifactInput, observationInput };
  }));
  const parent = verifyParentReceipt(parentInput);
  const { source, byVariant } = verifyArchive({
    parent,
    trialInput,
    taskInput,
    oracleInput,
    archived,
  });

  const schemas = buildAdaptiveEvaluatorSchemas();
  const packageReceipt = await buildAdaptiveEvaluatorPackageReceipt({
    repositoryRoot: fileURLToPath(rootUrl),
    descriptor: {
      id: "adaptive-evaluator-aegis-v2",
      evaluatorId: "aegis-deterministic-verifier-v2",
      evaluatorKind: "deterministic-verifier",
      taskClass: "security-review",
      artifactMediaType: "application/json",
      entrypointPath: "src/aegis-evaluator-v2.mjs",
      policyPath: POLICY_PATH,
      packageSchemaPath: SCHEMA_PATHS["adaptive-evaluator-package-v1.schema.json"],
      requestSchemaPath: SCHEMA_PATHS["adaptive-evaluator-request-v1.schema.json"],
      resultSchemaPath: SCHEMA_PATHS["adaptive-evaluator-result-v1.schema.json"],
      resources: [
        { role: "oracle", path: ORACLE_PATH, logical: true },
        { role: "task-definition", path: TASK_PATH, logical: true },
      ],
    },
  });

  const results = new Map();
  for (const variant of VARIANTS) {
    const result = evaluateAegisArtifactV2({
      request: evaluatorRequest({
        packageReceipt,
        task: taskInput.value,
        source,
        variant,
        archived: byVariant,
        results,
      }),
      packageReceipt,
      oracle: oracleInput.value,
    });
    if (result.detectedCases !== 3 || result.criticalRegression) {
      throw new Error(`Aegis v2 shadow replay did not clear ${variant}`);
    }
    results.set(variant, result);
  }

  const shadowBody = {
    schemaVersion: 1,
    id: "aegis-v2-archived-matrix-shadow-replay",
    status: "retrospective-shadow-ineligible",
    ledgerAdmissionAllowed: false,
    profilePromotionAllowed: false,
    lifecycleActionAllowed: false,
    godagentsActivationAllowed: false,
    sourceTrialDigest: trialInput.value.trialDigest,
    packageReceiptDigest: packageReceipt.receiptDigest,
    taskDefinition: {
      ...inputRow(taskInput, { logical: true }),
      sourceSha256: sha256(source),
    },
    oracle: inputRow(oracleInput, { logical: true }),
    variants: VARIANTS.map((variant) => {
      const entry = byVariant.get(variant);
      const artifact = entry.artifactInput.value;
      const observation = entry.observationInput.value;
      return {
        variant,
        archivedArtifact: {
          ...inputRow(entry.artifactInput, { logical: true }),
          artifactDigest: artifact.artifactDigest,
          artifactBytes: artifact.artifactBytes,
          producedAt: artifact.producedAt,
        },
        archivedObservation: {
          ...inputRow(entry.observationInput, { logical: true }),
          evaluatorId: observation.evaluatorId,
          evaluationDigest: observation.evaluation.evaluationDigest,
          score: observation.evaluation.score,
          maximumScore: observation.evaluation.maximumScore,
          criticalRegression: observation.evaluation.criticalRegression,
          observedAt: observation.observedAt,
        },
        v2Result: results.get(variant),
      };
    }),
  };
  const shadowReplay = {
    ...shadowBody,
    replayDigest: canonicalDigest(shadowBody),
  };
  const report = buildReport({ shadowReplay });
  const schemaTexts = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [
    SCHEMA_PATHS[name],
    canonicalFile(schema),
  ]));
  const packageText = canonicalFile(packageReceipt);
  const shadowText = canonicalFile(shadowReplay);
  const aggregateReceipt = buildAggregateReceipt({
    parentInput,
    packageReceipt,
    shadowReplay,
    schemaTexts,
    packageText,
    shadowText,
    report,
    runtimeInput,
    sourceInputs,
    taskInput,
    oracleInput,
    archived: byVariant,
  });
  return Object.freeze({
    schemas: Object.freeze(schemas),
    packageReceipt: Object.freeze(packageReceipt),
    shadowReplay: Object.freeze(shadowReplay),
    report,
    aggregateReceipt: Object.freeze(aggregateReceipt),
  });
}

export async function writeAegisEvaluatorV2Shadow({
  root = new URL("../", import.meta.url),
  renameFile,
} = {}) {
  const rootUrl = asRootUrl(root);
  const result = await rebuildAegisEvaluatorV2Shadow({ root: rootUrl });
  const schemaWrites = Object.fromEntries(Object.entries(result.schemas).map(([name, schema]) => [
    SCHEMA_PATHS[name],
    canonicalFile(schema),
  ]));
  await commitGeneratedFiles({
    rootPath: fileURLToPath(rootUrl),
    writes: {
      ...schemaWrites,
      [PACKAGE_RECEIPT_PATH]: canonicalFile(result.packageReceipt),
      [SHADOW_PATH]: canonicalFile(result.shadowReplay),
      [REPORT_PATH]: result.report,
      [AGGREGATE_RECEIPT_PATH]: canonicalFile(result.aggregateReceipt),
    },
    renameFile,
  });
  return result;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await writeAegisEvaluatorV2Shadow();
  process.stdout.write(JSON.stringify({
    status: result.aggregateReceipt.status,
    packageReceiptDigest: result.packageReceipt.receiptDigest,
    replayDigest: result.shadowReplay.replayDigest,
    receiptDigest: result.aggregateReceipt.receiptDigest,
  }) + "\n");
}
