import test from "node:test";
import assert from "node:assert/strict";

import {
  validateCompilerReceipt,
  validateNaturalRequest,
  validateSemanticProposal,
} from "../src/intent-contracts.mjs";

function context(overrides = {}) {
  return {
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write"],
    availablePreconditions: [],
    forbiddenCapabilities: [],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "verified",
    contextBudget: 4000,
    maxCompositionSize: 3,
    ...overrides,
  };
}

function naturalRequest(overrides = {}) {
  return {
    schemaVersion: 1,
    requestId: "natural-architecture-1",
    text: "turn conflicting product notes into an implementation-ready architecture",
    context: context(),
    ...overrides,
  };
}

function card() {
  return {
    schemaVersion: 1,
    id: "eternities-architect",
    family: "architecture-specification",
    intent: "Convert a consequential system question into an evidenced architecture decision.",
    successCondition: "An implementation-ready handoff exists.",
    provides: ["architecture", "handoff"],
    requires: [],
    intentExamples: {
      direct: ["design the system architecture"],
      paraphrased: ["turn these constraints into a technical blueprint"],
      contextual: ["conflicting requirements need an implementation-ready decision"],
    },
    negativeIntents: ["implement a settled architecture"],
    effects: ["local-read", "local-write"],
    riskClass: "moderate",
    authorityRequirements: ["local-read", "local-write"],
    preconditions: [],
    compatibleWith: [],
    conflictsWith: [],
    contextCost: 800,
    dependencyCost: 0,
    evidenceConfidence: "verified",
    entrypoint: "skills/eternities-architect/SKILL.md",
    legacyAliases: [],
  };
}

test("natural requests preserve text while validating explicit host context", () => {
  const value = naturalRequest();
  assert.equal(validateNaturalRequest(value), value);
  assert.equal(value.text, "turn conflicting product notes into an implementation-ready architecture");
});

test("natural requests reject authority and effect arrays that are not canonical", () => {
  assert.throws(
    () => validateNaturalRequest(naturalRequest({
      context: context({ availableAuthority: ["local-write", "local-read"] }),
    })),
    /availableAuthority must be lexically sorted/,
  );
  assert.throws(
    () => validateNaturalRequest(naturalRequest({
      context: context({ permittedEffects: ["external-write", "external-write"] }),
    })),
    /permittedEffects must not contain duplicates/,
  );
});

test("semantic proposals can suggest intent but cannot carry authority", () => {
  const proposal = {
    schemaVersion: 1,
    candidateIds: ["eternities-architect"],
    requiredCapabilities: ["architecture"],
    requestedEffects: ["local-write"],
    unresolvedDecisions: [],
  };
  assert.equal(validateSemanticProposal(proposal, [card()]), proposal);
  assert.throws(
    () => validateSemanticProposal({
      ...proposal,
      availableAuthority: ["repository-write"],
    }, [card()]),
    /unknown field: availableAuthority/,
  );
});

test("semantic proposals reject unknown cards and capabilities", () => {
  const proposal = {
    schemaVersion: 1,
    candidateIds: ["invented-godskill"],
    requiredCapabilities: ["architecture"],
    requestedEffects: ["local-write"],
    unresolvedDecisions: [],
  };
  assert.throws(
    () => validateSemanticProposal(proposal, [card()]),
    /unknown candidate id: invented-godskill/,
  );
  assert.throws(
    () => validateSemanticProposal({
      ...proposal,
      candidateIds: ["eternities-architect"],
      requiredCapabilities: ["telepathy"],
    }, [card()]),
    /unknown capability: telepathy/,
  );
});

test("compiler receipts reject authority expansion beyond the embedded envelope", () => {
  const receipt = {
    schemaVersion: 1,
    requestId: "natural-architecture-1",
    requestDigest: "a".repeat(64),
    textDigest: "b".repeat(64),
    mode: "deterministic",
    candidateScores: [{
      id: "eternities-architect",
      score: 42,
      evidence: ["intent-token:architecture"],
    }],
    acceptedProposalIds: [],
    rejectedProposalIds: [],
    requestedEffects: ["local-write"],
    suppliedAuthority: ["local-read"],
    unresolvedDecisions: ["authority:local-write"],
    confidence: "high",
    envelope: {
      schemaVersion: 1,
      requestId: "natural-architecture-1",
      outcome: "turn conflicting product notes into an implementation-ready architecture",
      candidateFamilies: ["architecture-specification"],
      requiredCapabilities: ["architecture"],
      forbiddenCapabilities: [],
      permittedEffects: ["local-read"],
      availableAuthority: ["local-read", "repository-write"],
      availablePreconditions: [],
      maximumRisk: "moderate",
      minimumEvidenceConfidence: "verified",
      contextBudget: 4000,
      maxCompositionSize: 3,
      unresolvedDecisions: ["authority:local-write"],
    },
    proofLimits: ["fixture-and-contract-evidence-only"],
  };
  assert.throws(
    () => validateCompilerReceipt(receipt),
    /envelope authority exceeds supplied authority/,
  );
});
