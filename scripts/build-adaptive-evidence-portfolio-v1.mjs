import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildPortfolioSchemas,
  createCompletedTrialReceipt,
  preregisterPortfolioPlan,
  reduceTrialPortfolio,
} from "../src/adaptive-evidence-portfolio.mjs";
import {
  appendEvidenceRow,
  createEvidenceLedger,
  deriveActivationProfile,
} from "../src/adaptive-evidence-ledger.mjs";
import {
  canonicalDigest,
  canonicalFile,
} from "../src/adaptive-evidence-contracts.mjs";
import {
  createObservationProposal,
  preregisterTrial,
} from "../src/adaptive-evidence-trials.mjs";
import { sha256 } from "../src/io.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";
import {
  attestFixturePortfolioPlan,
  createFixturePortfolioWitnessAuthority,
  fixturePortfolioWitnessProofLimit,
} from "./adaptive-evidence-portfolio-fixture-witness.mjs";

const PROTOCOL_ID = "eternities-godskills-cross-trial-portfolio-v1";
const PORTFOLIO_POLICY_PATH = "policies/adaptive-evidence-portfolio.v1.json";
const EVIDENCE_POLICY_PATH = "policies/adaptive-evidence.v2.json";
const EVIDENCE_PARENT_PATH = "receipts/adaptive-evidence-v2.json";
const EVALUATOR_PARENT_PATH = "receipts/adaptive-evaluator-packages-v1.json";
const RECEIPT_PATH = "receipts/adaptive-evidence-portfolio-v1.json";
const REPORT_PATH = "docs/adaptive-evidence-portfolio-v1-report.md";
const ARTIFACT_ROOT = "artifacts/adaptive-evidence-portfolio-v1";
const TRUSTED_PARENTS = Object.freeze({
  adaptiveEvidenceV2: Object.freeze({
    path: EVIDENCE_PARENT_PATH,
    id: "adaptive-evidence-v2",
    status: "experimental-canary",
    receiptDigest: "2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d",
    sha256: "7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a",
    bytes: 14138,
  }),
  adaptiveEvaluatorPackagesV1: Object.freeze({
    path: EVALUATOR_PARENT_PATH,
    id: "adaptive-evaluator-packages-v1",
    status: "verified-retrospective-shadow",
    receiptDigest: "a7649453504001333f103521d4dfe1e016de7041b70c6d910507c7d1734f1334",
    sha256: "ae7ded06bbed4aa0e2dea32dad9f841c1427f9abade57b86ad19c25b261bd519",
    bytes: 9578,
  }),
});
const SCHEMA_PATHS = Object.freeze({
  plan: "schemas/adaptive-evidence-portfolio-v1/plan.schema.json",
  completion: "schemas/adaptive-evidence-portfolio-v1/completion.schema.json",
  report: "schemas/adaptive-evidence-portfolio-v1/report.schema.json",
  witness: "schemas/adaptive-evidence-portfolio-v1/witness.schema.json",
});
const SOURCE_PATHS = Object.freeze([
  "docs/superpowers/plans/2026-08-31-cross-trial-portfolio-v1.md",
  "docs/superpowers/specs/2026-08-31-cross-trial-portfolio-v1-design.md",
  "package-lock.json",
  "package.json",
  "scripts/adaptive-evidence-portfolio-fixture-witness.mjs",
  "scripts/build-adaptive-evidence-portfolio-v1.mjs",
  "scripts/build-capability-layer-abi.mjs",
  "src/adaptive-evidence-contracts.mjs",
  "src/adaptive-evidence-ledger.mjs",
  "src/adaptive-evidence-portfolio.mjs",
  "src/adaptive-evidence-portfolio-witness.mjs",
  "src/adaptive-evidence-trials.mjs",
  "src/io.mjs",
  "tests/adaptive-evidence-portfolio-receipt.test.mjs",
  "tests/adaptive-evidence-portfolio.test.mjs",
  "tests/adaptive-evidence-portfolio-witness.test.mjs",
]);
const CANDIDATE_VARIANTS = Object.freeze(["guardrail", "method", "reviewer", "combined"]);
const ALL_VARIANTS = Object.freeze(["raw", ...CANDIDATE_VARIANTS]);
const FIXTURE_TASKS = Object.freeze([
  Object.freeze({
    slotId: "fixture-filesystem-alias",
    trialId: "fixture-aegis-filesystem-alias-001",
    taskDefinition: Object.freeze({
      id: "fixture-aegis-filesystem-boundary",
      version: "1",
      mission: "review an inert filesystem boundary for alias escapes",
      artifactContract: "closed security finding list",
    }),
    diversityValues: Object.freeze([
      Object.freeze({ axis: "surface", value: "filesystem-boundary" }),
      Object.freeze({ axis: "failure-mode", value: "path-alias" }),
    ]),
    caseCount: 3,
    outcomes: Object.freeze({
      guardrail: "win",
      method: "win",
      reviewer: "win",
      combined: "win",
    }),
    critical: Object.freeze({}),
  }),
  Object.freeze({
    slotId: "fixture-provider-confusion",
    trialId: "fixture-aegis-provider-confusion-001",
    taskDefinition: Object.freeze({
      id: "fixture-aegis-provider-boundary",
      version: "1",
      mission: "review an inert provider boundary for identity confusion",
      artifactContract: "closed security finding list",
    }),
    diversityValues: Object.freeze([
      Object.freeze({ axis: "surface", value: "provider-boundary" }),
      Object.freeze({ axis: "failure-mode", value: "identity-confusion" }),
    ]),
    caseCount: 3000,
    outcomes: Object.freeze({
      guardrail: "win",
      method: "win",
      reviewer: "tie",
      combined: "loss",
    }),
    critical: Object.freeze({ method: true }),
  }),
]);

const profileIdentity = Object.freeze({
  capabilityId: "eternities-aegis",
  taskClass: "security-review",
  modelFamily: "fixture-model-not-quality-evidence",
  reasoningTier: "high",
  consequenceClass: "consequential",
  capabilityVersion: "06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9",
  environmentId: canonicalDigest({
    id: "adaptive-evidence-portfolio-v1-structural-fixture-environment",
    qualityEvidence: false,
  }),
});

const comparisonPolicy = Object.freeze({
  id: "portfolio-structural-fixture-five-condition-comparison",
  version: "1",
  baseline: "raw",
  variants: ALL_VARIANTS,
  metrics: Object.freeze(["validity", "coverage", "unsupported-claims"]),
  stopConditions: Object.freeze(["five-artifacts-recorded", "critical-regression"]),
});

function asRootUrl(root) {
  if (root instanceof URL) return root;
  if (typeof root !== "string" || root.trim() === "") {
    throw new TypeError("portfolio builder root must be a file URL or path");
  }
  return pathToFileURL(`${path.resolve(root)}${path.sep}`);
}

async function loadInput(root, relativePath, { json = false } = {}) {
  const bytes = await readFile(new URL(relativePath, root));
  const input = { path: relativePath, bytes, sha256: sha256(bytes) };
  if (json) {
    try {
      input.value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${relativePath} is invalid JSON`, { cause: error });
    }
  }
  return input;
}

function inputRecord(input, additions = {}) {
  return { path: input.path, sha256: input.sha256, bytes: input.bytes.length, ...additions };
}

function withoutDigest(value) {
  const copy = { ...value };
  delete copy.receiptDigest;
  return copy;
}

function verifyParent(input, trusted) {
  const value = input.value;
  if (input.sha256 !== trusted.sha256 || input.bytes.length !== trusted.bytes
      || value.id !== trusted.id || value.status !== trusted.status
      || value.receiptDigest !== trusted.receiptDigest
      || canonicalDigest(withoutDigest(value)) !== value.receiptDigest) {
    throw new Error(`${trusted.path} does not match the frozen parent trust root`);
  }
  return {
    path: trusted.path,
    receiptDigest: trusted.receiptDigest,
    sha256: trusted.sha256,
    bytes: trusted.bytes,
  };
}

function iso(base, offsetSeconds) {
  return new Date(new Date(base).valueOf() + offsetSeconds * 1000).toISOString();
}

function caseComparisons(outcome, count) {
  if (outcome === "baseline") return { matched: 0, wins: 0, losses: 0, ties: 0 };
  return {
    matched: count,
    wins: outcome === "win" ? count : 0,
    losses: outcome === "loss" ? count : 0,
    ties: outcome === "tie" ? count : 0,
  };
}

function buildPlan({ portfolioPolicy, portfolioPolicyDigest }) {
  return preregisterPortfolioPlan({
    portfolioId: "adaptive-evidence-portfolio-v1-structural-fixture",
    profileIdentity,
    selectionRule: {
      mode: "exact-preregistered-set",
      diversityAxes: ["surface", "failure-mode"],
      minimumDistinctValues: [
        { axis: "surface", count: 2 },
        { axis: "failure-mode", count: 2 },
      ],
    },
    taskSlots: FIXTURE_TASKS.map((task) => ({
      slotId: task.slotId,
      trialId: task.trialId,
      taskDefinition: {
        id: task.taskDefinition.id,
        version: task.taskDefinition.version,
        digest: canonicalDigest(task.taskDefinition),
      },
      diversityValues: task.diversityValues.map((entry) => ({ ...entry })),
    })),
    registeredAt: "2026-08-31T14:00:00.000Z",
    policy: portfolioPolicy,
    expectedPolicyDigest: portfolioPolicyDigest,
  });
}

function buildFixtureMember({
  task,
  taskIndex,
  plan,
  planWitness,
  witnessAuthority,
  portfolioPolicy,
  portfolioPolicyDigest,
  evidencePolicy,
  evidencePolicyDigest,
}) {
  const slot = plan.taskSlots.find(({ slotId }) => slotId === task.slotId);
  const registeredAt = iso(plan.registeredAt, 60 + taskIndex * 600);
  const trial = preregisterTrial({
    trialId: slot.trialId,
    profileIdentity,
    capabilityManifestDigest: profileIdentity.capabilityVersion,
    taskDefinition: task.taskDefinition,
    comparisonPolicy,
    artifactBoundary: { mediaType: "application/json", required: true },
    evaluator: {
      kind: "deterministic-verifier",
      id: `portfolio-structural-fixture-evaluator-${task.slotId}`,
      digest: canonicalDigest({ id: task.slotId, role: "structural-fixture-evaluator" }),
    },
    producerId: `portfolio-structural-fixture-host-${task.slotId}`,
    registeredAt,
    policy: evidencePolicy,
    expectedPolicyDigest: evidencePolicyDigest,
  });
  let ledger = createEvidenceLedger({
    trial,
    createdAt: iso(registeredAt, 10),
    policy: evidencePolicy,
    expectedPolicyDigest: evidencePolicyDigest,
  });
  let baselineArtifactDigest = null;
  for (const [variantIndex, variant] of ALL_VARIANTS.entries()) {
    const outcome = variant === "raw" ? "baseline" : task.outcomes[variant];
    const artifactDigest = canonicalDigest({
      fixture: "adaptive-evidence-portfolio-v1",
      slotId: task.slotId,
      variant,
    });
    if (variant === "raw") baselineArtifactDigest = artifactDigest;
    const proposal = createObservationProposal({
      trial,
      expectedTrialDigest: trial.trialDigest,
      variant,
      artifact: {
        sha256: artifactDigest,
        bytes: 1024 + variantIndex,
        mediaType: "application/json",
        producedAt: iso(registeredAt, 20 + variantIndex * 10),
      },
      observation: {
        score: outcome === "loss" ? 1 : outcome === "tie" ? 5 : 10,
        outcomeAgainstRaw: outcome,
        criticalRegression: task.critical[variant] ?? false,
        baselineArtifactDigest: variant === "raw" ? null : baselineArtifactDigest,
        comparisons: caseComparisons(outcome, variant === "raw" ? 0 : task.caseCount),
        reasonCodes: [`structural-fixture-${outcome}`],
      },
      cost: {
        bytes: 1024 + variantIndex,
        tokens: null,
        latencyMs: null,
        monetaryCost: null,
      },
      proofLevel: "model",
      producerId: `portfolio-structural-fixture-producer-${task.slotId}-${variant}`,
      evaluatorId: trial.evaluator.id,
      observedAt: iso(registeredAt, 21 + variantIndex * 10),
      policy: evidencePolicy,
      expectedPolicyDigest: evidencePolicyDigest,
    });
    ledger = appendEvidenceRow({
      ledger,
      trial,
      proposal,
      policy: evidencePolicy,
      expectedPolicyDigest: evidencePolicyDigest,
    });
  }
  const profile = deriveActivationProfile({
    ledger,
    trial,
    policy: evidencePolicy,
    expectedPolicyDigest: evidencePolicyDigest,
  });
  const completion = createCompletedTrialReceipt({
    plan,
    planWitness,
    witnessAuthority,
    expectedWitnessTrustRootDigest: witnessAuthority.trustRootDigest,
    slotId: task.slotId,
    trial,
    ledger,
    profile,
    completedAt: iso(registeredAt, 90),
    portfolioPolicy,
    expectedPortfolioPolicyDigest: portfolioPolicyDigest,
    evidencePolicy,
    expectedEvidencePolicyDigest: evidencePolicyDigest,
  });
  return Object.freeze({ trial, ledger, profile, completion });
}

function buildHumanReport({ plan, planWitness, witnessAuthority, members, report }) {
  const lines = [
    "# Adaptive Evidence Portfolio v1 Structural Report",
    "",
    "## disposition",
    "",
    "The cross-trial portfolio protocol reduced two separately verified ledgers into one task-level report. This is a structural fixture, not model-quality evidence and not an activation decision.",
    "",
    `- plan: \`${plan.planDigest}\``,
    `- preregistration witness: \`${planWitness.witnessDigest}\``,
    `- witness trust root: \`${witnessAuthority.trustRootDigest}\``,
    `- report: \`${report.reportDigest}\``,
    `- preregistered tasks: ${plan.taskSlots.length}`,
    `- completed tasks: ${report.completedTaskCount}`,
    `- independent ledger digests: ${new Set(members.map(({ ledger }) => ledger.ledgerDigest)).size}`,
    `- candidate variants passing the structural evidence gate: ${report.candidatesPassingEvidenceGate.join(", ") || "none"}`,
    "",
    "## task granularity",
    "",
    "The fixture ledgers contain 3 and 3000 internal oracle cases. The portfolio report contains exactly two outcomes per candidate variant. Internal case counts are digest-bound but are not copied into or summed by the reducer.",
    "",
    "## worst-task gate",
    "",
    "The method fixture wins both task-level comparisons but carries one critical regression. Its worst-task gate therefore fails. This proves that aggregate wins cannot hide one catastrophic task.",
    "",
    "## authority boundary",
    "",
    "The report is reporting-only. It emits no profile promotion, lifecycle action, activation request, Godagents change, or authority expansion. The committed fixture key proves deterministic verifier behavior only. Production chronology requires a separately operated witness authority whose trust root is pinned by the host and whose clock and refusal policy are trusted.",
    "",
  ];
  return lines.join("\n");
}

function outputRecord(relativePath, text) {
  return {
    path: relativePath,
    sha256: sha256(text),
    bytes: Buffer.byteLength(text),
  };
}

function memberWrites(members) {
  const writes = {};
  for (const member of members) {
    const root = `${ARTIFACT_ROOT}/members/${member.completion.slotId}`;
    writes[`${root}/trial.json`] = canonicalFile(member.trial);
    writes[`${root}/ledger.json`] = canonicalFile(member.ledger);
    writes[`${root}/profile.json`] = canonicalFile(member.profile);
    writes[`${root}/completion.json`] = canonicalFile(member.completion);
  }
  return writes;
}

function buildReceipt({
  parents,
  portfolioPolicyInput,
  evidencePolicyInput,
  sourceInputs,
  plan,
  planWitness,
  witnessAuthority,
  members,
  report,
  generatedWrites,
}) {
  const method = report.variantMetrics.find(({ variant }) => variant === "method");
  const body = {
    schemaVersion: 1,
    id: "adaptive-evidence-portfolio-v1",
    status: "verified-structural-protocol",
    protocolId: PROTOCOL_ID,
    parents,
    inputs: {
      policies: [
        inputRecord(portfolioPolicyInput, {
          policyDigest: canonicalDigest(portfolioPolicyInput.value),
        }),
        inputRecord(evidencePolicyInput, {
          policyDigest: canonicalDigest(evidencePolicyInput.value),
        }),
      ].sort((left, right) => left.path.localeCompare(right.path)),
      sources: sourceInputs.map((input) => inputRecord(input)),
    },
    fixture: {
      planDigest: plan.planDigest,
      planWitnessDigest: planWitness.witnessDigest,
      witnessAuthorityTrustRoot: witnessAuthority.trustRoot,
      profileKey: plan.profileKey,
      completionDigests: members.map(({ completion }) => completion.completionDigest),
      reportDigest: report.reportDigest,
    },
    computedGates: {
      exactPreregisteredTaskCount: plan.taskSlots.length,
      exactCompletedTaskCount: report.completedTaskCount,
      hostPinnedPreregistrationWitnessVerified:
        report.planWitnessDigest === planWitness.witnessDigest
        && report.witnessAuthorityTrustRootDigest === witnessAuthority.trustRootDigest,
      independentLedgerCount: new Set(members.map(({ ledger }) => ledger.ledgerDigest)).size,
      taskOutcomesPerCandidate: report.variantMetrics[0].completedTasks,
      internalCaseCountsExcluded: report.caseComparisonAggregationAllowed === false
        && report.variantMetrics.every((metric) => !("matchedComparisons" in metric)),
      worstTaskCriticalRegressionGateExercised: method.wins === 2
        && method.worstTaskCriticalRegression && !method.passedEvidenceGate,
      completeCohortRequired: true,
      profilePromotionAllowed: false,
      lifecycleActionAllowed: false,
      activationRequestAllowed: false,
      authorityExpansions: 0,
    },
    outputs: Object.entries(generatedWrites)
      .map(([relativePath, text]) => outputRecord(relativePath, text))
      .sort((left, right) => left.path.localeCompare(right.path)),
    proofLimits: [
      "structural-protocol-and-deterministic-fixtures-only",
      "fixtures-are-not-model-quality-evidence",
      "no-historical-trial-retroactive-admission",
      "no-cross-task-quality-claim",
      "no-pooled-activation-profile",
      "no-lifecycle-action",
      "no-activation-request",
      "no-godagents-activation",
      "no-authority-expansion",
      "witness-authority-clock-and-refusal-integrity-remains-an-external-trust-assumption",
      "diversity-label-materiality-requires-independent-domain-review",
      fixturePortfolioWitnessProofLimit,
    ],
    reportingOnly: true,
    semanticVerificationRequired: true,
    profilePromotionAllowed: false,
    lifecycleActionAllowed: false,
    activationRequestAllowed: false,
    authorityExpanded: false,
  };
  return Object.freeze({ ...body, receiptDigest: canonicalDigest(body) });
}

export async function rebuildAdaptiveEvidencePortfolioV1({
  root = new URL("../", import.meta.url),
} = {}) {
  const rootUrl = asRootUrl(root);
  const [portfolioPolicyInput, evidencePolicyInput, evidenceParentInput,
    evaluatorParentInput, ...sourceInputs] = await Promise.all([
    loadInput(rootUrl, PORTFOLIO_POLICY_PATH, { json: true }),
    loadInput(rootUrl, EVIDENCE_POLICY_PATH, { json: true }),
    loadInput(rootUrl, EVIDENCE_PARENT_PATH, { json: true }),
    loadInput(rootUrl, EVALUATOR_PARENT_PATH, { json: true }),
    ...SOURCE_PATHS.map((relativePath) => loadInput(rootUrl, relativePath)),
  ]);
  const parents = {
    adaptiveEvidenceV2: verifyParent(evidenceParentInput, TRUSTED_PARENTS.adaptiveEvidenceV2),
    adaptiveEvaluatorPackagesV1: verifyParent(
      evaluatorParentInput,
      TRUSTED_PARENTS.adaptiveEvaluatorPackagesV1,
    ),
  };
  const portfolioPolicy = portfolioPolicyInput.value;
  const evidencePolicy = evidencePolicyInput.value;
  const portfolioPolicyDigest = canonicalDigest(portfolioPolicy);
  const evidencePolicyDigest = canonicalDigest(evidencePolicy);
  const schemas = buildPortfolioSchemas();
  const plan = buildPlan({ portfolioPolicy, portfolioPolicyDigest });
  const witnessAuthority = createFixturePortfolioWitnessAuthority();
  const planWitness = attestFixturePortfolioPlan({
    plan,
    witnessedAt: "2026-08-31T14:00:10.000Z",
  });
  witnessAuthority.verifyPlanWitness({
    witness: planWitness,
    plan,
    expectedPolicyDigest: portfolioPolicyDigest,
  });
  const members = FIXTURE_TASKS.map((task, taskIndex) => buildFixtureMember({
    task,
    taskIndex,
    plan,
    planWitness,
    witnessAuthority,
    portfolioPolicy,
    portfolioPolicyDigest,
    evidencePolicy,
    evidencePolicyDigest,
  }));
  const report = reduceTrialPortfolio({
    plan,
    planWitness,
    witnessAuthority,
    expectedWitnessTrustRootDigest: witnessAuthority.trustRootDigest,
    members: members.map(({ trial, ledger, profile, completion }) => ({
      trial,
      ledger,
      profile,
      receipt: completion,
    })),
    generatedAt: "2026-08-31T16:00:00.000Z",
    portfolioPolicy,
    expectedPortfolioPolicyDigest: portfolioPolicyDigest,
    evidencePolicy,
    expectedEvidencePolicyDigest: evidencePolicyDigest,
  });
  const humanReport = buildHumanReport({
    plan,
    planWitness,
    witnessAuthority,
    members,
    report,
  });
  const schemaWrites = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [
    SCHEMA_PATHS[name],
    canonicalFile(schema),
  ]));
  const generatedWrites = {
    ...schemaWrites,
    [`${ARTIFACT_ROOT}/plan.json`]: canonicalFile(plan),
    [`${ARTIFACT_ROOT}/plan-witness.json`]: canonicalFile(planWitness),
    ...memberWrites(members),
    [`${ARTIFACT_ROOT}/report.json`]: canonicalFile(report),
    [REPORT_PATH]: humanReport,
  };
  const receipt = buildReceipt({
    parents,
    portfolioPolicyInput,
    evidencePolicyInput,
    sourceInputs,
    plan,
    planWitness,
    witnessAuthority,
    members,
    report,
    generatedWrites,
  });
  const writes = Object.freeze({
    ...generatedWrites,
    [RECEIPT_PATH]: canonicalFile(receipt),
  });
  return Object.freeze({
    schemas,
    plan,
    planWitness,
    witnessTrustRoot: witnessAuthority.trustRoot,
    members: Object.freeze(members),
    report,
    humanReport,
    receipt,
    writes,
  });
}

export async function writeAdaptiveEvidencePortfolioV1({
  root = new URL("../", import.meta.url),
  renameFile,
} = {}) {
  const rootUrl = asRootUrl(root);
  const result = await rebuildAdaptiveEvidencePortfolioV1({ root: rootUrl });
  await commitGeneratedFiles({
    rootPath: fileURLToPath(rootUrl),
    writes: result.writes,
    renameFile,
  });
  return result;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await writeAdaptiveEvidencePortfolioV1();
  process.stdout.write(JSON.stringify({
    status: result.receipt.status,
    planDigest: result.plan.planDigest,
    reportDigest: result.report.reportDigest,
    receiptDigest: result.receipt.receiptDigest,
    outputs: result.receipt.outputs.length,
  }) + "\n");
}
