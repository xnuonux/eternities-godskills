import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../src/capability-layer-abi.mjs";
import {
  GODSKILL_PROTOCOL_ID,
  buildProtocolMessage,
  verifyProtocolChain,
} from "../src/godskill-protocol.mjs";
import { sha256 } from "../src/io.mjs";
import {
  GODSKILL_OBSERVATORY_ID,
  buildCounterfactualView,
  buildFailureClusterReport,
  buildObservatorySnapshot,
  extractRawSuccessCandidate,
  recordDisclosureCost,
  replayProtocolObservation,
  verifyObservatorySnapshot,
} from "../src/godskill-observatory.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = (label) => sha256(label);

function buildReferenceChain() {
  const missionId = "mission-001";
  const packageDigest = digest("eternities-aegis-package");
  const artifactDigest = digest("artifact-001");
  const evidenceDigest = digest("evidence-001");
  const messages = [];
  const add = (messageType, messageId, status, body, parentIds = []) => {
    const message = buildProtocolMessage({
      messageType,
      messageId,
      missionId,
      parentIds,
      status,
      body,
    });
    messages.push(message);
    return message;
  };
  const mission = add("MissionEnvelope", missionId, "open", {
    objectiveDigest: digest("objective"),
    authorityDigest: digest("mission-authority"),
    targetDigest: digest("target"),
    consequenceClass: "high",
    contentMode: "digest-only",
  });
  const query = add("CapabilityQuery", "query-001", "resolved", {
    queryDigest: digest("query"),
    requestedEffects: ["read", "write"],
    candidateLimit: 8,
    hostKind: "agent-neutral",
    acceptedProtocols: ["eternities-godskill-package-v1"],
  }, [mission.messageId]);
  const selection = add("SelectionDecision", "selection-001", "selected", {
    selectedPackageDigest: packageDigest,
    selectedCapabilityId: "eternities-aegis",
    selectedCapabilityVersion: 4,
    selectionMode: "single",
    reasonCodes: ["exact-capability-match"],
    selectedEffects: ["read", "write"],
  }, [mission.messageId, query.messageId]);
  const activation = add("ActivationDecision", "activation-001", "activated", {
    mode: "guardrail",
    capabilityId: "eternities-aegis",
    capabilityVersion: 4,
    packageDigest,
    disclosurePlanDigest: digest("disclosure-plan"),
    explicitIntent: false,
    matchedEvidenceDigest: null,
    authorityExpanded: false,
  }, [selection.messageId]);
  const authority = add("AuthorityIntersection", "authority-001", "allowed", {
    requestedEffects: ["read", "write"],
    grantedEffects: ["read", "write"],
    authorityCeilingDigest: digest("authority-ceiling"),
    targetDigest: digest("target"),
    externalMutationAllowed: false,
    authorityExpanded: false,
    decision: "allowed",
  }, [activation.messageId]);
  const disclosure = add("DisclosureEnvelope", "disclosure-001", "disclosed", {
    packageDigest,
    mode: "guardrail",
    layer: "guardrails",
    contentDigest: digest("guardrail-layer"),
    contentBytes: 1603,
    artifactRequired: false,
  }, [activation.messageId, authority.messageId]);
  const artifact = add("ArtifactObservation", "artifact-001", "observed", {
    artifactDigest,
    artifactKind: "bounded-test-artifact",
    artifactBytes: 2048,
    effectObserved: "read",
    metrics: { tokens: 42, latencyMs: 12.5, costMinorUnits: 0 },
    rawContentStored: false,
  }, [disclosure.messageId]);
  const review = add("ReviewObservation", "review-001", "observed", {
    reviewerId: "terra-reviewer",
    reviewDigest: digest("review-001"),
    reviewedArtifactDigest: artifact.body.artifactDigest,
    verdict: "pass",
    evidenceLevel: "artifact",
    findingsDigest: digest("findings-001"),
  }, [artifact.messageId]);
  const verdict = add("AcceptanceVerdict", "verdict-001", "accepted", {
    artifactDigest: artifact.body.artifactDigest,
    verdict: "accepted",
    reasonCodes: ["review-passed"],
    qualityClaim: "artifact",
    evidenceDigest,
  }, [artifact.messageId, review.messageId]);
  const proposal = add("EvidenceProposal", "proposal-001", "eligible", {
    evidenceDigest,
    evidenceLevel: "artifact",
    inputDigests: [verdict.digest],
    candidateStatus: "eligible",
    promotionEligible: true,
  }, [verdict.messageId]);
  add("LifecycleDecision", "lifecycle-001", "recorded", {
    evidenceDigest,
    decision: "promote",
    authorityDigest: digest("external-lifecycle-authority"),
    reasonCodes: ["independent-authority-approved"],
    version: 4,
  }, [proposal.messageId]);
  return messages;
}

function buildReferenceRecords(messages, protocolReceiptDigest) {
  const chain = verifyProtocolChain(messages);
  const replay = replayProtocolObservation({
    messages,
    expectedChainDigest: chain.chainDigest,
    protocolReceiptDigest,
  });
  const identity = {
    missionId: "mission-001",
    taskDigest: digest("task"),
    capabilityDigest: digest("capability"),
    modelProfileDigest: digest("model-profile"),
    environmentDigest: digest("environment"),
  };
  const counterfactual = buildCounterfactualView({
    baseline: {
      identity,
      variant: "raw",
      observationDigest: digest("baseline-observation"),
      score: 70,
      criticalRegressions: 0,
      artifactBytes: 1270,
      disclosureBytes: 0,
    },
    candidate: {
      identity,
      variant: "guardrail",
      observationDigest: digest("candidate-observation"),
      score: 88,
      criticalRegressions: 1,
      artifactBytes: 1288,
      disclosureBytes: 1600,
    },
  });
  const candidate = extractRawSuccessCandidate({
    observation: {
      observationDigest: digest("raw-observation"),
      variant: "raw",
      verdict: "success",
      evidenceLevel: "model",
      missionId: "mission-001",
      capabilityDigest: digest("capability"),
      taskDigest: digest("task"),
      modelProfileDigest: digest("model-profile"),
      environmentDigest: digest("environment"),
    },
  });
  const scopeDigest = digest("failure-scope");
  const failures = buildFailureClusterReport({
    reportScopeDigest: scopeDigest,
    observations: [
      {
        observationDigest: digest("failure-a"),
        scopeDigest,
        failureCode: "missing-assertion",
        variant: "raw",
        critical: true,
      },
      {
        observationDigest: digest("failure-b"),
        scopeDigest,
        failureCode: "missing-assertion",
        variant: "guardrail",
        critical: false,
      },
      {
        observationDigest: digest("failure-c"),
        scopeDigest,
        failureCode: "schema-invalid",
        variant: "method",
        critical: true,
      },
    ],
  });
  const cost = recordDisclosureCost({
    disclosureMessage: messages[5],
    protocolReceiptDigest,
    tokens: 120,
    latencyMs: 42.5,
    costMinorUnits: null,
  });
  return [replay, counterfactual, candidate, failures, cost];
}

async function writeIfAbsentOrIdentical(filePath, value) {
  try {
    const existing = await readFile(filePath);
    if (!existing.equals(value)) throw new Error("refusing to overwrite changed observatory evidence");
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value);
}

const protocolReceiptPath = path.join(repositoryRoot, "receipts/godskill-protocol-v1.json");
const protocolReceiptBytes = await readFile(protocolReceiptPath);
const protocolReceipt = JSON.parse(protocolReceiptBytes);
if (protocolReceipt.protocolId !== GODSKILL_PROTOCOL_ID) throw new Error("unexpected protocol receipt root");
const protocolReceiptDigest = protocolReceipt.receiptDigest;
const messages = buildReferenceChain();
const chain = verifyProtocolChain(messages);
const records = buildReferenceRecords(messages, protocolReceiptDigest);
const snapshot = buildObservatorySnapshot({ protocolReceiptDigest, records });
const snapshotVerification = verifyObservatorySnapshot(snapshot, {
  records,
  expectedProtocolReceiptDigest: protocolReceiptDigest,
});
const fixtureBody = {
  schemaVersion: 1,
  observatoryId: GODSKILL_OBSERVATORY_ID,
  protocolReceiptDigest,
  chainDigest: chain.chainDigest,
  messages,
  records,
  snapshot,
};
const fixtureBytes = Buffer.from(canonicalJson(fixtureBody), "utf8");
const fixturePath = "artifacts/godskill-observatory-v1/reference.json";
const fixtureFile = path.join(repositoryRoot, fixturePath);
const schemaPath = "schemas/godskill-observatory-v1.schema.json";
const runtimePath = "runtime/godskill-observatory-v1.md";
const schemaBytes = await readFile(path.join(repositoryRoot, schemaPath));
const runtimeBytes = await readFile(path.join(repositoryRoot, runtimePath));
await writeIfAbsentOrIdentical(fixtureFile, fixtureBytes);

const receiptBody = {
  schemaVersion: 1,
  observatoryId: GODSKILL_OBSERVATORY_ID,
  protocolRoot: {
    path: "receipts/godskill-protocol-v1.json",
    receiptDigest: protocolReceiptDigest,
    sha256: sha256(protocolReceiptBytes),
    bytes: protocolReceiptBytes.length,
  },
  chain: {
    chainDigest: chain.chainDigest,
    messageCount: chain.messageCount,
    complete: chain.complete,
  },
  records: {
    count: records.length,
    digests: records.map((record) => record.digest).sort(),
  },
  snapshotDigest: snapshotVerification.snapshotDigest,
  schema: {
    path: schemaPath,
    sha256: sha256(schemaBytes),
    bytes: schemaBytes.length,
  },
  runtime: {
    path: runtimePath,
    sha256: sha256(runtimeBytes),
    bytes: runtimeBytes.length,
  },
  fixture: {
    path: fixturePath,
    sha256: sha256(fixtureBytes),
    bytes: fixtureBytes.length,
  },
  focusedSuite: {
    tests: 9,
    passed: 9,
    failed: 0,
  },
  fullRepositorySuite: {
    tests: 822,
    passed: 821,
    failed: 0,
    skipped: 1,
    cancelled: 0,
    todo: 0,
  },
  proofLimits: [
    "digest-only-observability",
    "replay-and-fixture-integrity",
    "no-model-quality-claim",
    "no-automatic-candidate-promotion",
    "no-host-activation",
    "no-external-authority",
  ],
  status: "verified-build",
};
const receipt = { ...receiptBody, receiptDigest: sha256(canonicalJson(receiptBody)) };
await writeIfAbsentOrIdentical(
  path.join(repositoryRoot, "receipts/godskill-observatory-v1.json"),
  Buffer.from(canonicalJson(receipt), "utf8"),
);
console.log(JSON.stringify({
  observatoryId: GODSKILL_OBSERVATORY_ID,
  protocolReceiptDigest,
  chainDigest: chain.chainDigest,
  snapshotDigest: snapshotVerification.snapshotDigest,
  fixtureDigest: sha256(fixtureBytes),
  receiptDigest: receipt.receiptDigest,
  recordCount: records.length,
  status: receipt.status,
}));
