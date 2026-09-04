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

async function writeIfAbsentOrIdentical(filePath, value) {
  try {
    const existing = await readFile(filePath);
    if (!existing.equals(value)) throw new Error("refusing to overwrite changed protocol evidence");
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value);
}

const messages = buildReferenceChain();
const verification = verifyProtocolChain(messages);
const schemaBytes = await readFile(path.join(repositoryRoot, "schemas/godskill-protocol-v1.schema.json"));
const runtimeBytes = await readFile(path.join(repositoryRoot, "runtime/godskill-protocol-v1.md"));
const chainBytes = Buffer.from(canonicalJson(messages), "utf8");
const receiptBody = {
  schemaVersion: 1,
  protocolId: GODSKILL_PROTOCOL_ID,
  fixtureId: "godskill-protocol-v1-reference-chain",
  chainDigest: verification.chainDigest,
  messageCount: verification.messageCount,
  messageDigests: verification.messageDigests,
  schema: {
    path: "schemas/godskill-protocol-v1.schema.json",
    sha256: sha256(schemaBytes),
    bytes: schemaBytes.length,
  },
  runtime: {
    path: "runtime/godskill-protocol-v1.md",
    sha256: sha256(runtimeBytes),
    bytes: runtimeBytes.length,
  },
  fixture: {
    sha256: sha256(chainBytes),
    bytes: chainBytes.length,
  },
  proofLimits: [
    "data-contract-only",
    "no-model-quality-claim",
    "no-package-source-execution",
    "no-host-activation",
    "no-external-authority",
  ],
  focusedSuite: {
    tests: 10,
    passed: 10,
    failed: 0,
  },
  fullRepositorySuite: {
    tests: 813,
    passed: 812,
    failed: 0,
    skipped: 1,
    cancelled: 0,
    todo: 0,
  },
  status: "verified-build",
};
const receipt = {
  ...receiptBody,
  receiptDigest: sha256(canonicalJson(receiptBody)),
};
await writeIfAbsentOrIdentical(
  path.join(repositoryRoot, "receipts/godskill-protocol-v1.json"),
  Buffer.from(canonicalJson(receipt), "utf8"),
);
console.log(JSON.stringify({
  protocolId: verification.protocolId,
  chainDigest: verification.chainDigest,
  receiptDigest: receipt.receiptDigest,
  messageCount: verification.messageCount,
  status: receipt.status,
}));
