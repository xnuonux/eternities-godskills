import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  appendCheckpoint,
  attestCheckpoint,
  createCheckpoint,
  estimateTokens,
  recoverContinuity,
  verifyCheckpointEnvelope,
} from "../src/continuity-packets.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

const SOURCE_ID = "OthmanAdi/planning-with-files@9e94390e5912b1ff296556505cd999ff84838160:skills/planning-with-files/SKILL.md";
const SOURCE_DIGEST = "d57fd5bd607a15b3669b7d53b54b201994eb7dbe68f80ffc33ea0d7e53122f84";
const ARTIFACTS = {
  module: "src/continuity-packets.mjs",
  tests: "tests/continuity-packets.test.mjs",
  mnemosyne: "skills/eternities-mnemosyne/SKILL.md",
  mnemosyneContract: "skills/eternities-mnemosyne/references/capability-contract.json",
  continuityContract: "skills/eternities-mnemosyne/references/attested-continuity.md",
  forge: "skills/eternities-forge/SKILL.md",
  forgeContract: "skills/eternities-forge/references/capability-contract.json",
  design: "docs/superpowers/specs/2026-08-28-attested-task-continuity-design.md",
};

async function artifact(root, relativePath) {
  return { path: relativePath, sha256: sha256(await readFile(path.join(root, relativePath))) };
}

function input(overrides = {}) {
  return {
    taskRef: "certification-task",
    sessionRef: "certification-session-a",
    revision: 1,
    parentDigest: null,
    createdAt: "2026-08-28T21:00:00.000Z",
    objective: "certify task-scoped continuity",
    provenState: ["source evidence is exact", "task authority is bounded"],
    completedWork: ["packet contract implemented"],
    openWork: ["independent review"],
    blockers: [],
    authority: { available: ["local-read", "repository-write"], excluded: ["external-write"] },
    evidencePointers: [{ id: "source", locator: "artifacts/github-wave-2/source-records.jsonl", digest: SOURCE_DIGEST }],
    nextAction: "request independent review of the committed continuity implementation",
    status: "active",
    contextBudget: 700,
    ...overrides,
  };
}

async function evaluateMechanism() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const trustedKeys = new Map([["certification-key", publicKey]]);
  const first = createCheckpoint(input());
  const firstEnvelope = attestCheckpoint(first, { keyId: "certification-key", privateKey });
  const signatureVerified = verifyCheckpointEnvelope(firstEnvelope, { trustedKeys, expectedTaskRef: first.taskRef }).packetDigest === first.packetDigest;
  const root = await mkdtemp(path.join(os.tmpdir(), "eternities-continuity-cert-"));
  try {
    const logPath = path.join(root, "certification-task.jsonl");
    await writeFile(`${logPath}.lock`, JSON.stringify({ schemaVersion: 1, pid: 2147483647, host: os.hostname(), createdAt: "2020-01-01T00:00:00.000Z" }));
    await appendCheckpoint({ logPath, envelope: firstEnvelope, trustedKeys });
    const second = createCheckpoint(input({
      sessionRef: "certification-session-b",
      revision: 2,
      parentDigest: first.packetDigest,
      createdAt: "2026-08-28T21:30:00.000Z",
      provenState: [...first.provenState, "focused verification passes"],
      completedWork: [...first.completedWork, "focused verification completed"],
      openWork: ["independent review"],
    }));
    await appendCheckpoint({ logPath, envelope: attestCheckpoint(second, { keyId: "certification-key", privateKey }), trustedKeys });
    const recovered = await recoverContinuity({
      logPath,
      trustedKeys,
      expectedTaskRef: first.taskRef,
      maxTokens: 700,
      now: "2026-08-28T21:31:00.000Z",
      maxAgeMs: 60 * 60 * 1000,
    });
    let authorityExpansionRejected = false;
    try {
      const expanded = createCheckpoint(input({
        sessionRef: "certification-session-c",
        revision: 3,
        parentDigest: second.packetDigest,
        createdAt: "2026-08-28T21:35:00.000Z",
        authority: { available: ["external-write", "local-read", "repository-write"], excluded: [] },
        nextAction: "perform external write",
      }));
      await appendCheckpoint({ logPath, envelope: attestCheckpoint(expanded, { keyId: "certification-key", privateKey }), trustedKeys });
    } catch { authorityExpansionRejected = true; }
    let crossTaskRejected = false;
    try {
      await recoverContinuity({ logPath, trustedKeys, expectedTaskRef: "other-task", maxTokens: 700 });
    } catch { crossTaskRejected = true; }
    let tamperRejected = false;
    const tampered = structuredClone(firstEnvelope);
    tampered.packet.nextAction = "perform an unauthorized external action";
    try { verifyCheckpointEnvelope(tampered, { trustedKeys, expectedTaskRef: first.taskRef }); } catch { tamperRejected = true; }
    const futurePath = path.join(root, "future-task.jsonl");
    const future = createCheckpoint(input({ createdAt: "2099-01-01T00:00:00.000Z" }));
    await appendCheckpoint({ logPath: futurePath, envelope: attestCheckpoint(future, { keyId: "certification-key", privateKey }), trustedKeys });
    let futureTimeRejected = false;
    try {
      await recoverContinuity({ logPath: futurePath, trustedKeys, expectedTaskRef: future.taskRef, maxTokens: 700, now: "2026-08-28T21:31:00.000Z", allowedClockSkewMs: 1000 });
    } catch { futureTimeRejected = true; }
    const logText = await readFile(logPath, "utf8");
    const declaredBaselinePerToolTokens = 90;
    const declaredBaselineToolCalls = 20;
    const syntheticBaselineTokens = declaredBaselinePerToolTokens * declaredBaselineToolCalls;
    return {
      signatureVerified,
      parentChainVerified: recovered.packet.parentDigest === first.packetDigest && recovered.packet.revision === 2,
      latestOnlyRecovered: !("history" in recovered) && recovered.packet.sessionRef === "certification-session-b",
      crossTaskRejected,
      tamperRejected,
      authorityExpansionRejected,
      futureTimeRejected,
      deadOwnerLockRecovered: !(await readFile(`${logPath}.lock`, "utf8").then(() => true).catch(() => false)),
      atomicSnapshotComplete: logText.endsWith("\n") && logText.trim().split(/\r?\n/).length === 2,
      estimatedCandidateRecoveryTokens: recovered.recoveryTokens,
      declaredBaselinePerToolTokens,
      declaredBaselineToolCalls,
      syntheticBaselineTokens,
      estimatedContextReductionTokens: syntheticBaselineTokens - recovered.recoveryTokens,
      estimatedContextRatio: recovered.recoveryTokens / syntheticBaselineTokens,
      packetEstimatedTokens: estimateTokens(recovered.packet),
    };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

export async function buildAttestedContinuityReceipt({ root = path.resolve("."), write = true } = {}) {
  const rows = (await readFile(path.join(root, "artifacts/github-wave-2/source-records.jsonl"), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse);
  const source = rows.find(({ id }) => id === SOURCE_ID);
  if (!source || source.inert !== true || source.bodySha256 !== SOURCE_DIGEST) throw new Error("continuity source record is absent or stale");
  if (sha256(await readFile(source.sourceAbsolutePath)) !== SOURCE_DIGEST) throw new Error("continuity source bytes are stale");
  const metrics = await evaluateMechanism();
  const gates = {
    exactInertSource: true,
    trustedSignatureRequired: metrics.signatureVerified && metrics.tamperRejected,
    parentBoundAppendOnlyChain: metrics.parentChainVerified,
    taskIsolation: metrics.crossTaskRejected,
    latestPacketOnly: metrics.latestOnlyRecovered,
    authorityCannotExpand: metrics.authorityExpansionRejected,
    futureTimeRejected: metrics.futureTimeRejected,
    atomicSnapshotCommit: metrics.atomicSnapshotComplete,
    deadOwnerLockRecovery: metrics.deadOwnerLockRecovered,
    lowerEstimatedContextCostThanDeclaredPerToolBaseline: metrics.estimatedContextReductionTokens > 0,
    perToolPromptInjectionInstalled: false,
    slashCommandRequired: false,
    hostActivationPerformed: false,
  };
  const certified = Object.entries(gates).every(([key, value]) =>
    ["perToolPromptInjectionInstalled", "slashCommandRequired", "hostActivationPerformed"].includes(key) ? value === false : value === true);
  const artifacts = Object.fromEntries(await Promise.all(
    Object.entries(ARTIFACTS).map(async ([name, relativePath]) => [name, await artifact(root, relativePath)]),
  ));
  const receipt = {
    schemaVersion: 1,
    id: "attested-task-continuity-v1",
    status: certified ? "certified" : "failed",
    purpose: "task-scoped-compaction-and-handoff-continuity",
    source: {
      id: SOURCE_ID,
      bodySha256: SOURCE_DIGEST,
      inert: true,
      disposition: "independent-pattern-adaptation",
      copiedSourceProse: false,
      copiedImplementation: false,
      targetCodeExecuted: false,
      excludedMechanisms: ["always-on tool hooks", "full plan injection before each tool call", "slash-command dependence", "stop-loop enforcement"],
    },
    artifacts,
    metrics,
    gates,
    verification: {
      focusedCommand: "node --test tests/continuity-packets.test.mjs tests/attested-continuity-certification.test.mjs",
      fullCommand: "npm test",
    },
    proofLimits: {
      fixtureTrustRoot: "local-generated-key-only",
      hostKeyCustody: "not-proven",
      hostActivation: "not-performed",
      arbitraryAgentRecovery: "not-proven",
      productionOperation: "not-performed",
      powerLossDurability: "fsync-and-atomic-replace-used-but-platform-filesystem-guarantees-not-proven",
      contextCostComparison: "synthetic-source-declared-estimate-not-production-measurement",
    },
  };
  if (write) await writeJsonAtomic(path.join(root, "receipts/promotions/attested-task-continuity.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const receipt = await buildAttestedContinuityReceipt({ root: path.resolve("."), write: true });
  console.log(JSON.stringify({ status: receipt.status, metrics: receipt.metrics, gates: receipt.gates }, null, 2));
}
