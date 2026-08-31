import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { canonicalJson as capabilityCanonicalFile } from "../src/capability-layer-abi.mjs";
import {
  buildAdaptiveEvidenceSchemas,
  canonicalDigest,
  canonicalFile,
  validateAdaptiveEvidencePolicy,
} from "../src/adaptive-evidence-contracts.mjs";
import {
  appendEvidenceRow,
  compileLifecycleDecision,
  createEvidenceLedger,
  deriveActivationProfile,
  evaluateProfileFreshness,
  verifyEvidenceLedger,
} from "../src/adaptive-evidence-ledger.mjs";
import {
  compileActivationDecisionV2,
  compileShadowDecision,
  createObservationProposal,
  importHistoricalEvidence,
  preregisterTrial,
} from "../src/adaptive-evidence-trials.mjs";
import { sha256 } from "../src/io.mjs";
import { commitGeneratedFiles } from "./build-capability-layer-abi.mjs";

const POLICY_PATH = "policies/adaptive-evidence.v2.json";
const PHASE1_RECEIPT_PATH = "receipts/capability-layer-abi-v1.json";
const PHASE1_CERTIFICATION_PATH = "docs/capability-layer-abi-v1-certification.md";
const HISTORICAL_PATH = "artifacts/adaptive-activation/evidence.v1.json";
const RECEIPT_PATH = "receipts/adaptive-evidence-v2.json";
const REPORT_PATH = "docs/adaptive-evidence-v2-report.md";

const TRUSTED_POLICY_DIGEST = "2f0e8c6b68c13be56b8a7ec2332402f4a3939368a162c31bde0fac3ef3ae7260";
const TRUSTED_PHASE1_RECEIPT_DIGEST = "1c19271951abb00e93529656a35e8fb52dccc2f3cf0b6208bcee6821361ab788";
const TRUSTED_PHASE1_CERTIFICATION_SHA256 = "8ea4099b6b044697d1cbc4d8c7c150e38ff558d8e3b646c2779ef7504bfad93f";
const TRUSTED_HISTORICAL_DIGEST = "9a14d4296158c65c3929938c5c54b5f7f4b6a5ffeb5b0a827b3f8b25814f5e07";

const CANARY_IDS = Object.freeze([
  "eternities-aegis",
  "eternities-forge",
  "eternities-muse",
]);
const ENGINE_SOURCE_PATHS = Object.freeze([
  "scripts/build-adaptive-evidence-v2.mjs",
  "src/adaptive-evidence-contracts.mjs",
  "src/adaptive-evidence-ledger.mjs",
  "src/adaptive-evidence-trials.mjs",
]);
const VARIANT_FIXTURES = Object.freeze({
  raw: Object.freeze({ score: 10, matched: 0, wins: 0, losses: 0, ties: 0, bytes: 1000 }),
  guardrail: Object.freeze({ score: 12, matched: 3, wins: 2, losses: 1, ties: 0, bytes: 1100 }),
  method: Object.freeze({ score: 14, matched: 3, wins: 3, losses: 0, ties: 0, bytes: 1250 }),
  reviewer: Object.freeze({ score: 13, matched: 3, wins: 2, losses: 0, ties: 1, bytes: 1200 }),
  combined: Object.freeze({ score: 14, matched: 3, wins: 2, losses: 0, ties: 1, bytes: 1350 }),
});

async function loadInput(root, relative, { json = false } = {}) {
  const bytes = await readFile(new URL(relative, root));
  return {
    path: relative,
    bytes,
    sha256: sha256(bytes),
    value: json ? JSON.parse(bytes) : bytes.toString("utf8"),
  };
}

function inputReceipt(input, extra = {}) {
  return {
    path: input.path,
    sha256: input.sha256,
    bytes: input.bytes.length,
    ...extra,
  };
}

function verifyPhase1Receipt(input) {
  const receipt = input.value;
  const { receiptDigest, ...body } = receipt;
  if (receiptDigest !== TRUSTED_PHASE1_RECEIPT_DIGEST
      || sha256(capabilityCanonicalFile(body)) !== receiptDigest
      || receipt.id !== "capability-layer-abi-v1"
      || receipt.computedGates?.exactCanaryCount !== true
      || receipt.computedGates?.capabilityGrantsAuthority !== false) {
    throw new Error("phase 1 receipt does not match its external trust root");
  }
  return receipt;
}

function verifyPhase1Certification(input) {
  if (input.sha256 !== TRUSTED_PHASE1_CERTIFICATION_SHA256
      || !input.value.includes("disposition: `certified-structural-canary`")
      || !input.value.includes(TRUSTED_PHASE1_RECEIPT_DIGEST)) {
    throw new Error("phase 1 certification digest does not match the trusted boundary");
  }
}

async function loadCanaries(root, phase1Receipt) {
  const canaries = [];
  for (const capabilityId of CANARY_IDS) {
    const relative = `artifacts/capability-layers/${capabilityId}/manifest.v1.json`;
    const input = await loadInput(root, relative, { json: true });
    const trusted = phase1Receipt.canaries?.find((candidate) =>
      candidate.capabilityId === capabilityId);
    if (!trusted || input.sha256 !== trusted.manifest?.sha256
        || input.bytes.length !== trusted.manifest?.bytes
        || input.value.bundleDigest !== trusted.manifest?.bundleDigest
        || input.value.capabilityId !== capabilityId
        || input.value.capabilityGrantsAuthority !== false) {
      throw new Error(`canary manifest does not match certified phase 1: ${capabilityId}`);
    }
    canaries.push({
      capabilityId,
      manifest: input.value,
      receipt: inputReceipt(input, { bundleDigest: input.value.bundleDigest }),
    });
  }
  if (canaries.length !== 3) throw new Error("phase 1 canary count is not exact");
  return canaries;
}

function canary(canaries, capabilityId) {
  const found = canaries.find((candidate) => candidate.capabilityId === capabilityId);
  if (!found) throw new Error(`required canary is absent: ${capabilityId}`);
  return found;
}

function buildShadow({ canaries, policy, expectedPolicyDigest }) {
  const muse = canary(canaries, "eternities-muse");
  const environment = {
    id: "adaptive-evidence-v2-structural-fixture",
    modelFamily: "fixture-only",
    reasoningTier: "high",
    externalTools: [],
    selectedBodies: [],
  };
  const identity = {
    capabilityId: muse.capabilityId,
    taskClass: "creative-generation",
    modelFamily: environment.modelFamily,
    reasoningTier: environment.reasoningTier,
    consequenceClass: "low",
    capabilityVersion: muse.manifest.bundleDigest,
    environmentId: canonicalDigest(environment),
  };
  const activationDecision = compileActivationDecisionV2({
    selectedId: muse.capabilityId,
    task: {
      taskClass: identity.taskClass,
      consequenceClass: identity.consequenceClass,
      authorityProjection: { availableAuthority: [], permittedEffects: [] },
    },
    profileIdentity: identity,
    explicitMethodRequest: false,
    reviewAvailable: false,
    profile: null,
    policy,
    expectedPolicyDigest,
  });
  return compileShadowDecision({ activationDecision, policy, expectedPolicyDigest });
}

function buildFixture({ canaries, policy, expectedPolicyDigest }) {
  const aegis = canary(canaries, "eternities-aegis");
  const environment = {
    id: "adaptive-evidence-v2-fixture-environment",
    modelFamily: "fixture-only",
    reasoningTier: "high",
    hostPolicy: "no-tools-no-external-effects",
    externalTools: [],
  };
  const profileIdentity = {
    capabilityId: aegis.capabilityId,
    taskClass: "security-review",
    modelFamily: environment.modelFamily,
    reasoningTier: environment.reasoningTier,
    consequenceClass: "consequential",
    capabilityVersion: aegis.manifest.bundleDigest,
    environmentId: canonicalDigest(environment),
  };
  const taskDefinition = {
    id: "adaptive-evidence-v2-fixture-security-review",
    version: "1",
    mission: "exercise the closed adaptive evidence records without invoking a model",
    artifactContract: "digest-bound fixture JSON with no external effects",
  };
  const comparisonPolicy = {
    id: "adaptive-evidence-v2-fixture-comparison",
    version: "1",
    baseline: "raw",
    variants: [...policy.trialVariants],
    metrics: ["validity", "coverage", "critical-regression", "overhead"],
    stopConditions: ["five-fixture-artifacts-recorded", "critical-regression"],
  };
  const trial = preregisterTrial({
    trialId: "adaptive-evidence-v2-fixture-001",
    profileIdentity,
    capabilityManifestDigest: aegis.manifest.bundleDigest,
    taskDefinition,
    comparisonPolicy,
    artifactBoundary: { mediaType: "application/json", required: true },
    evaluator: {
      kind: "deterministic-verifier",
      id: "adaptive-evidence-v2-fixture-verifier",
      digest: canonicalDigest({ id: "adaptive-evidence-v2-fixture-verifier", version: 1 }),
    },
    producerId: "adaptive-evidence-v2-fixture-builder",
    registeredAt: "2026-08-31T07:00:00.000Z",
    policy,
    expectedPolicyDigest,
  });
  let ledger = createEvidenceLedger({
    trial,
    createdAt: "2026-08-31T07:00:10.000Z",
    policy,
    expectedPolicyDigest,
  });
  let rawArtifactDigest = null;
  for (const [index, variant] of policy.trialVariants.entries()) {
    const fixture = VARIANT_FIXTURES[variant];
    const artifactText = canonicalFile({
      schemaVersion: 2,
      fixtureOnly: true,
      trialId: trial.trialId,
      variant,
      score: fixture.score,
    });
    const artifactDigest = sha256(artifactText);
    if (variant === "raw") rawArtifactDigest = artifactDigest;
    const producedAt = `2026-08-31T07:0${index + 1}:00.000Z`;
    const observedAt = `2026-08-31T07:0${index + 1}:30.000Z`;
    const proposal = createObservationProposal({
      trial,
      expectedTrialDigest: trial.trialDigest,
      variant,
      artifact: {
        sha256: artifactDigest,
        bytes: Buffer.byteLength(artifactText),
        mediaType: "application/json",
        producedAt,
      },
      observation: {
        score: fixture.score,
        outcomeAgainstRaw: variant === "raw" ? "baseline" : "win",
        criticalRegression: false,
        baselineArtifactDigest: variant === "raw" ? null : rawArtifactDigest,
        comparisons: {
          matched: fixture.matched,
          wins: fixture.wins,
          losses: fixture.losses,
          ties: fixture.ties,
        },
        reasonCodes: [variant === "raw" ? "fixture-baseline" : "fixture-comparison"],
      },
      cost: {
        bytes: fixture.bytes,
        tokens: null,
        latencyMs: null,
        monetaryCost: null,
      },
      proofLevel: "fixture",
      producerId: `adaptive-evidence-v2-fixture-${variant}`,
      evaluatorId: trial.evaluator.id,
      observedAt,
      policy,
      expectedPolicyDigest,
    });
    ledger = appendEvidenceRow({ ledger, trial, proposal, policy, expectedPolicyDigest });
  }
  const ledgerVerification = verifyEvidenceLedger({
    ledger,
    trial,
    policy,
    expectedPolicyDigest,
  });
  const profile = deriveActivationProfile({
    ledger,
    trial,
    policy,
    expectedPolicyDigest,
  });
  const authorization = {
    actorId: "external-fixture-maintainer",
    grants: [policy.lifecycleGrants.promote],
    scopeDigest: profile.profileDigest,
    issuedAt: "2026-08-31T07:10:00.000Z",
  };
  const lifecycle = compileLifecycleDecision({
    profile,
    expectedProfileDigest: profile.profileDigest,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    actorId: authorization.actorId,
    authorization,
    expectedAuthorizationDigest: canonicalDigest(authorization),
    currentIdentity: profile.profileIdentity,
    currentBindings: profile.boundDigests,
    policy,
    expectedPolicyDigest,
  });
  const staleIdentity = {
    ...profile.profileIdentity,
    environmentId: "0".repeat(64),
  };
  const staleEvaluation = evaluateProfileFreshness({
    profile,
    currentIdentity: staleIdentity,
    currentBindings: profile.boundDigests,
    policy,
    expectedPolicyDigest,
  });
  return { trial, ledger, ledgerVerification, profile, lifecycle, staleEvaluation };
}

function outputRows(files) {
  return Object.entries(files)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([relative, text]) => ({
      path: relative,
      sha256: sha256(text),
      bytes: Buffer.byteLength(text),
    }));
}

function buildReport({ fixture, historical }) {
  return [
    "# adaptive evidence v2 report",
    "",
    "status: `experimental-canary`",
    "",
    "## fixture mechanics",
    "",
    `the deterministic fixture admitted ${fixture.ledgerVerification.rowCount} digest-bound rows across raw, guardrail, method, reviewer, and combined conditions.`,
    `its profile remains \`${fixture.profile.lifecycleState}\` with \`${fixture.profile.promotableEvidenceRows}\` promotable rows, and the lifecycle request is \`${fixture.lifecycle.status}\`.`,
    "fixture scores exercise mechanics only. they are not model-quality evidence and cannot promote activation.",
    "",
    "## historical real evidence",
    "",
    `the reviewed Muse bridge retains ${historical.observedComparisons} prior comparisons from commit \`${historical.sourceCommit}\`.`,
    `its status is \`${historical.status}\` because v2 preregistration, exact environment identity, and isolated five-condition coverage were absent.`,
    "historical evidence remains useful context but is not retroactive preregistration.",
    "",
    "## fresh model evidence",
    "",
    "the preregistered Aegis model matrix is pending. no method or review promotion is claimed.",
    "",
    "## boundaries",
    "",
    "this report proves deterministic structural and fixture engine behavior only. it does not prove universal behavior, cross-model equivalence, global activation, or external authority.",
    "activation v1 remains the rollback path.",
    "",
  ].join("\n");
}

function buildReceipt({
  policyInput,
  phase1ReceiptInput,
  phase1CertificationInput,
  canaries,
  historicalInput,
  sourceInputs,
  files,
  shadow,
  fixture,
  historical,
}) {
  const body = {
    schemaVersion: 2,
    id: "adaptive-evidence-v2",
    status: "experimental-canary",
    inputs: {
      policy: inputReceipt(policyInput, { policyDigest: TRUSTED_POLICY_DIGEST }),
      phase1Receipt: inputReceipt(phase1ReceiptInput, {
        receiptDigest: TRUSTED_PHASE1_RECEIPT_DIGEST,
      }),
      phase1Certification: inputReceipt(phase1CertificationInput, {
        disposition: "certified-structural-canary",
      }),
      canaries: canaries.map((candidate) => candidate.receipt),
      historicalEvidence: inputReceipt(historicalInput, {
        evidenceDigest: TRUSTED_HISTORICAL_DIGEST,
      }),
      engineSources: sourceInputs.map((input) => inputReceipt(input)),
    },
    outputs: outputRows(files),
    computedGates: {
      phase1Certified: true,
      exactCanaryCount: canaries.length === 3,
      exactTrialVariantCount: fixture.ledgerVerification.rowCount === 5,
      shadowBodyFiles: shadow.disclosedLayerBodies.length,
      fixturePromotions: fixture.lifecycle.status === "applied" ? 1 : 0,
      historicalPromotions: historical.promotable ? 1 : 0,
      authorityExpansions: [fixture.lifecycle.authorityExpanded].filter(Boolean).length,
      appendOnlyLedgerValid: fixture.ledgerVerification.valid,
      staleProfilesEligible: fixture.staleEvaluation.current ? 1 : 0,
    },
    unresolvedGates: {
      freshModelMatrix: "pending",
      independentReview: "pending",
      universalBehavior: "not-claimed",
    },
    proofLimits: [
      "structural-and-fixture-engine-integrity",
      "historical-evidence-is-not-retroactive-preregistration",
      "no-model-quality-promotion-without-a-fresh-matrix",
      "no-global-activation",
      "no-external-authority",
    ],
  };
  return { ...body, receiptDigest: canonicalDigest(body) };
}

export async function rebuildAdaptiveEvidenceV2({
  root = new URL("../", import.meta.url),
} = {}) {
  const [
    policyInput,
    phase1ReceiptInput,
    phase1CertificationInput,
    historicalInput,
    ...sourceInputs
  ] = await Promise.all([
    loadInput(root, POLICY_PATH, { json: true }),
    loadInput(root, PHASE1_RECEIPT_PATH, { json: true }),
    loadInput(root, PHASE1_CERTIFICATION_PATH),
    loadInput(root, HISTORICAL_PATH, { json: true }),
    ...ENGINE_SOURCE_PATHS.map((relative) => loadInput(root, relative)),
  ]);
  validateAdaptiveEvidencePolicy({
    policy: policyInput.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const phase1Receipt = verifyPhase1Receipt(phase1ReceiptInput);
  verifyPhase1Certification(phase1CertificationInput);
  const canaries = await loadCanaries(root, phase1Receipt);
  if (canonicalDigest(historicalInput.value) !== TRUSTED_HISTORICAL_DIGEST) {
    throw new Error("trusted historical evidence digest does not match its body");
  }
  const historical = importHistoricalEvidence({
    evidence: historicalInput.value,
    sourceDigest: TRUSTED_HISTORICAL_DIGEST,
    policy: policyInput.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const shadow = buildShadow({
    canaries,
    policy: policyInput.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const fixture = buildFixture({
    canaries,
    policy: policyInput.value,
    expectedPolicyDigest: TRUSTED_POLICY_DIGEST,
  });
  const schemas = buildAdaptiveEvidenceSchemas();
  const files = {};
  for (const [name, schema] of Object.entries(schemas)) {
    files[`schemas/adaptive-evidence-v2/${name}`] = canonicalFile(schema);
  }
  Object.assign(files, {
    "artifacts/adaptive-evidence-v2/shadow-muse.v2.json": canonicalFile(shadow),
    "artifacts/adaptive-evidence-v2/fixture-trial.v2.json": canonicalFile(fixture.trial),
    "artifacts/adaptive-evidence-v2/fixture-ledger.v2.json": canonicalFile(fixture.ledger),
    "artifacts/adaptive-evidence-v2/fixture-profile.v2.json": canonicalFile(fixture.profile),
    "artifacts/adaptive-evidence-v2/fixture-lifecycle.v2.json": canonicalFile(fixture.lifecycle),
    "artifacts/adaptive-evidence-v2/historical-muse-bridge.v2.json": canonicalFile(historical),
  });
  const report = buildReport({ fixture, historical });
  const filesAndReport = { ...files, [REPORT_PATH]: report };
  const receipt = buildReceipt({
    policyInput,
    phase1ReceiptInput,
    phase1CertificationInput,
    canaries,
    historicalInput,
    sourceInputs,
    files: filesAndReport,
    shadow,
    fixture,
    historical,
  });
  return Object.freeze({
    files: Object.freeze(files),
    receipt: Object.freeze(receipt),
    receiptText: canonicalFile(receipt),
    report,
  });
}

export async function writeAdaptiveEvidenceV2({
  root = new URL("../", import.meta.url),
  renameFile,
} = {}) {
  const result = await rebuildAdaptiveEvidenceV2({ root });
  await commitGeneratedFiles({
    rootPath: fileURLToPath(root),
    writes: {
      ...result.files,
      [REPORT_PATH]: result.report,
      [RECEIPT_PATH]: result.receiptText,
    },
    renameFile,
  });
  return result;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await writeAdaptiveEvidenceV2();
  process.stdout.write(JSON.stringify({
    status: result.receipt.status,
    outputs: result.receipt.outputs.length,
    receiptDigest: result.receipt.receiptDigest,
  }) + "\n");
}
