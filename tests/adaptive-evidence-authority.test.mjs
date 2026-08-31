import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";

async function authorityModule() {
  return import("../src/adaptive-evidence-authority.mjs").catch((error) =>
    assert.fail(`adaptive evidence authority module is unavailable: ${error.message}`));
}

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    authorizationId: "fixture-promote-method",
    actorId: "external-lifecycle-maintainer",
    action: "promote",
    requestedMode: "method",
    currentMode: "native",
    profileDigest: "a".repeat(64),
    bindingsDigest: "b".repeat(64),
    grant: "adaptive-evidence:promote",
    issuedAt: "2026-08-31T06:00:00.000Z",
    expiresAt: "2026-09-01T06:00:00.000Z",
    ...overrides,
  };
}

test("authority verifier closes one externally pinned Ed25519 trust root", async () => {
  const {
    authorizationAttestationMessage,
    authorizationRecordDigest,
    createAdaptiveEvidenceAuthority,
    lifecycleDecisionAttestationMessage,
  } = await authorityModule();
  const trusted = generateKeyPairSync("ed25519");
  const attacker = generateKeyPairSync("ed25519");
  const authority = createAdaptiveEvidenceAuthority({
    trustRootId: "fixture-authority-root",
    trustedKeys: new Map([["fixture-authority", trusted.publicKey]]),
  });
  const authorization = record();
  const subjectDigest = authorizationRecordDigest(authorization);
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-lifecycle-authorization",
    subjectDigest,
    keyId: "fixture-authority",
  };
  const authorizationPackage = {
    record: authorization,
    attestation: {
      ...unsigned,
      signature: sign(
        null,
        authorizationAttestationMessage(unsigned),
        trusted.privateKey,
      ).toString("base64"),
    },
  };
  const expected = {
    profileDigest: authorization.profileDigest,
    bindingsDigest: authorization.bindingsDigest,
    action: authorization.action,
    requestedMode: authorization.requestedMode,
    currentMode: authorization.currentMode,
    grant: authorization.grant,
    decidedAt: "2026-08-31T06:10:00.000Z",
  };
  const verified = authority.verifyAuthorizationPackage({ authorizationPackage, expected });
  assert.equal(verified.authorizationDigest, subjectDigest);
  assert.equal(verified.authorityKeyId, "fixture-authority");
  assert.equal(verified.authorityTrustRootDigest, authority.trustRootDigest);
  assert.match(authority.trustRootDigest, /^[a-f0-9]{64}$/);

  const forged = structuredClone(authorizationPackage);
  forged.attestation.signature = sign(
    null,
    authorizationAttestationMessage(unsigned),
    attacker.privateKey,
  ).toString("base64");
  assert.throws(
    () => authority.verifyAuthorizationPackage({ authorizationPackage: forged, expected }),
    /signature|trusted/i,
  );
  assert.throws(
    () => authority.verifyAuthorizationPackage({
      authorizationPackage,
      expected: { ...expected, profileDigest: "c".repeat(64) },
    }),
    /profile|binding|authorization/i,
  );
  assert.throws(
    () => authority.verifyAuthorizationPackage({
      authorizationPackage,
      expected: { ...expected, decidedAt: "2026-09-02T06:00:00.000Z" },
    }),
    /expired|validity|time/i,
  );

  const decisionDigest = "d".repeat(64);
  const decisionUnsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-lifecycle-decision",
    subjectDigest: decisionDigest,
    keyId: "fixture-authority",
  };
  const decisionAttestation = {
    ...decisionUnsigned,
    signature: sign(
      null,
      lifecycleDecisionAttestationMessage(decisionUnsigned),
      trusted.privateKey,
    ).toString("base64"),
  };
  const verifiedDecision = authority.verifyLifecycleDecisionAttestation({
    attestation: decisionAttestation,
    expectedDecisionDigest: decisionDigest,
  });
  assert.equal(verifiedDecision.decisionDigest, decisionDigest);
  assert.equal(verifiedDecision.authorityKeyId, "fixture-authority");
  assert.throws(
    () => authority.verifyLifecycleDecisionAttestation({
      attestation: decisionAttestation,
      expectedDecisionDigest: "e".repeat(64),
    }),
    /subject|bound/i,
  );
});

test("trust-root identity is stable across key order and changes with key material", async () => {
  const { createAdaptiveEvidenceAuthority } = await authorityModule();
  const one = generateKeyPairSync("ed25519");
  const two = generateKeyPairSync("ed25519");
  const left = createAdaptiveEvidenceAuthority({
    trustRootId: "ordered-root",
    trustedKeys: new Map([["two", two.publicKey], ["one", one.publicKey]]),
  });
  const right = createAdaptiveEvidenceAuthority({
    trustRootId: "ordered-root",
    trustedKeys: new Map([["one", one.publicKey], ["two", two.publicKey]]),
  });
  const attacker = createAdaptiveEvidenceAuthority({
    trustRootId: "ordered-root",
    trustedKeys: new Map([["one", one.publicKey], ["two", generateKeyPairSync("ed25519").publicKey]]),
  });
  assert.equal(left.trustRootDigest, right.trustRootDigest);
  assert.notEqual(left.trustRootDigest, attacker.trustRootDigest);
});
