import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  authorizationAttestationMessage,
  authorizationRecordDigest,
  lifecycleDecisionAttestationMessage,
} from "../src/adaptive-evidence-authority.mjs";
import { canonicalDigest, profileKey } from "../src/adaptive-evidence-contracts.mjs";

const root = new URL("../", import.meta.url);

function eligibleProfile(policyDigest) {
  const profileIdentity = {
    capabilityId: "eternities-aegis",
    taskClass: "security-review",
    modelFamily: "fixture-terra",
    reasoningTier: "high",
    consequenceClass: "consequential",
    capabilityVersion: "1".repeat(64),
    environmentId: "2".repeat(64),
  };
  const metric = (variant, overrides = {}) => ({
    variant,
    matchedComparisons: variant === "raw" ? 0 : 3,
    wins: variant === "raw" ? 0 : 2,
    losses: variant === "raw" ? 0 : 1,
    ties: 0,
    criticalRegressions: 0,
    maximumOverheadRatio: variant === "raw" ? 1 : 1.2,
    evidenceLevels: ["model"],
    rowDigests: [canonicalDigest({ variant })],
    ...overrides,
  });
  const body = {
    schemaVersion: 2,
    profileIdentity,
    profileKey: profileKey(profileIdentity),
    lifecycleState: "eligible",
    recommendedMode: "method",
    variantMetrics: [
      metric("raw", { evidenceLevels: [], rowDigests: [] }),
      metric("guardrail"),
      metric("method", { wins: 3, losses: 0 }),
      metric("reviewer"),
      metric("combined"),
    ],
    evidenceRowDigests: [canonicalDigest({ row: 1 })],
    participantIds: {
      producers: ["terra-subject"],
      evaluators: ["independent-verifier"],
    },
    promotableEvidenceRows: 4,
    failedGates: [],
    boundDigests: {
      policyDigest,
      taskDefinitionDigest: "3".repeat(64),
      comparisonPolicyDigest: "4".repeat(64),
      trialDigest: "5".repeat(64),
      ledgerDigest: "6".repeat(64),
    },
  };
  return { ...body, profileDigest: canonicalDigest(body) };
}

function authorizationPackage(record, privateKey, keyId) {
  const subjectDigest = authorizationRecordDigest(record);
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-lifecycle-authorization",
    subjectDigest,
    keyId,
  };
  return {
    record,
    attestation: {
      ...unsigned,
      signature: sign(null, authorizationAttestationMessage(unsigned), privateKey)
        .toString("base64"),
    },
  };
}

function lifecycleAttestation(decision, privateKey, keyId) {
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-lifecycle-decision",
    subjectDigest: decision.decisionDigest,
    keyId,
  };
  return {
    ...unsigned,
    signature: sign(null, lifecycleDecisionAttestationMessage(unsigned), privateKey)
      .toString("base64"),
  };
}

test("trusted lifecycle and activation compilers reject caller-forged promotion roots", async () => {
  const [ledger, trials, policy] = await Promise.all([
    import("../src/adaptive-evidence-ledger.mjs"),
    import("../src/adaptive-evidence-trials.mjs"),
    readFile(new URL("policies/adaptive-evidence.v2.json", root), "utf8").then(JSON.parse),
  ]);
  const expectedPolicyDigest = canonicalDigest(policy);
  const profile = eligibleProfile(expectedPolicyDigest);
  const currentBindings = structuredClone(profile.boundDigests);
  const bindingsDigest = canonicalDigest(currentBindings);
  const trusted = generateKeyPairSync("ed25519");
  const attacker = generateKeyPairSync("ed25519");
  const trustOptions = {
    trustRootId: "trusted-lifecycle-authority",
    trustedKeys: new Map([["trusted-maintainer", trusted.publicKey]]),
    expectedPolicyDigest,
  };
  const record = {
    schemaVersion: 1,
    authorizationId: "trusted-method-promotion",
    actorId: "external-maintainer",
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    profileDigest: profile.profileDigest,
    bindingsDigest,
    grant: policy.lifecycleGrants.promote,
    issuedAt: "2026-08-31T06:00:00.000Z",
    expiresAt: "2026-09-01T06:00:00.000Z",
  };
  const signed = authorizationPackage(record, trusted.privateKey, "trusted-maintainer");
  const lifecycleController = ledger.createLifecycleController(trustOptions);
  const lifecycleDecision = lifecycleController.compileLifecycleDecision({
    profile,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    authorizationPackage: signed,
    decidedAt: "2026-08-31T06:10:00.000Z",
    currentIdentity: profile.profileIdentity,
    currentBindings,
    policy,
  });
  assert.equal(lifecycleDecision.status, "applied");
  assert.equal(lifecycleDecision.authorityTrustRootDigest, lifecycleController.trustRootDigest);

  const activationCompiler = trials.createActivationCompilerV2(trustOptions);
  const lifecycleDecisionAttestation = lifecycleAttestation(
    lifecycleDecision,
    trusted.privateKey,
    "trusted-maintainer",
  );
  const task = {
    taskClass: "security-review",
    consequenceClass: "consequential",
    authorityProjection: { availableAuthority: [], permittedEffects: [] },
  };
  const activated = activationCompiler.compileActivationDecisionV2({
    selectedId: "eternities-aegis",
    task,
    profileIdentity: profile.profileIdentity,
    explicitMethodRequest: false,
    reviewAvailable: false,
    profile,
    currentBindings,
    lifecycleDecision,
    lifecycleDecisionAttestation,
    policy,
  });
  assert.equal(activated.mode, "method");
  assert.equal(activated.profileFresh, true);
  assert.equal(activated.lifecycleDecisionDigest, lifecycleDecision.decisionDigest);

  const forgedProfileBody = {
    ...profile,
    boundDigests: { ...profile.boundDigests, ledgerDigest: "9".repeat(64) },
  };
  delete forgedProfileBody.profileDigest;
  const forgedProfile = {
    ...forgedProfileBody,
    profileDigest: canonicalDigest(forgedProfileBody),
  };
  const direct = trials.compileActivationDecisionV2({
    selectedId: "eternities-aegis",
    task,
    profileIdentity: forgedProfile.profileIdentity,
    explicitMethodRequest: false,
    reviewAvailable: false,
    profile: forgedProfile,
    policy,
    expectedPolicyDigest,
  });
  assert.equal(direct.mode, "guardrail");
  assert.equal(direct.profileFresh, false);
  assert.ok(direct.reasonCodes.includes("profile-untrusted"));

  const attackerPackage = authorizationPackage(record, attacker.privateKey, "trusted-maintainer");
  assert.throws(() => lifecycleController.compileLifecycleDecision({
    profile,
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    authorizationPackage: attackerPackage,
    decidedAt: "2026-08-31T06:10:00.000Z",
    currentIdentity: profile.profileIdentity,
    currentBindings,
    policy,
  }), /signature|trusted/i);
  assert.throws(() => activationCompiler.compileActivationDecisionV2({
    selectedId: "eternities-aegis",
    task,
    profileIdentity: profile.profileIdentity,
    explicitMethodRequest: false,
    reviewAvailable: false,
    profile,
    currentBindings,
    lifecycleDecision,
    lifecycleDecisionAttestation: lifecycleAttestation(
      lifecycleDecision,
      attacker.privateKey,
      "trusted-maintainer",
    ),
    policy,
  }), /signature|trusted/i);

  assert.equal(ledger.compileLifecycleDecision, undefined);
});
