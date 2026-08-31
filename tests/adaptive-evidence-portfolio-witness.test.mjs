import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";

import {
  buildPortfolioWitnessSchema,
  createPortfolioWitnessAuthority,
  portfolioWitnessAttestationMessage,
  portfolioWitnessRecordDigest,
} from "../src/adaptive-evidence-portfolio-witness.mjs";
import { canonicalDigest } from "../src/adaptive-evidence-contracts.mjs";

const purpose = "adaptive-evidence-portfolio-preregistration";

function plan() {
  return {
    planDigest: "a".repeat(64),
    policyDigest: "b".repeat(64),
    registeredAt: "2026-08-31T12:00:00.000Z",
  };
}

function record(authority, overrides = {}) {
  return {
    schemaVersion: 1,
    id: "portfolio-plan-witness-001",
    purpose,
    registryId: "portfolio-preregistration-log",
    sequence: 0,
    previousWitnessDigest: null,
    planDigest: plan().planDigest,
    portfolioPolicyDigest: plan().policyDigest,
    authorityTrustRootDigest: authority.trustRootDigest,
    witnessedAt: "2026-08-31T12:00:01.000Z",
    dispatchNotStarted: true,
    ...overrides,
  };
}

function witness(
  authority,
  privateKey,
  keyId = "witness-key",
  overrides = {},
  unsafeRecord = false,
) {
  const witnessRecord = record(authority, overrides);
  const subjectDigest = unsafeRecord
    ? canonicalDigest(witnessRecord)
    : portfolioWitnessRecordDigest(witnessRecord);
  const unsigned = {
    algorithm: "ed25519",
    purpose,
    subjectDigest,
    keyId,
  };
  const attestation = {
    ...unsigned,
    signature: sign(
      null,
      portfolioWitnessAttestationMessage(unsigned),
      privateKey,
    ).toString("base64"),
  };
  const body = { record: witnessRecord, attestation, semanticVerificationRequired: true };
  return { ...body, witnessDigest: canonicalDigest(body) };
}

test("host-pinned Ed25519 authority verifies an exact pre-dispatch plan witness", () => {
  const trusted = generateKeyPairSync("ed25519");
  const authority = createPortfolioWitnessAuthority({
    trustRootId: "portfolio-witness-root",
    registryId: "portfolio-preregistration-log",
    trustedKeys: new Map([["witness-key", trusted.publicKey]]),
  });
  const signed = witness(authority, trusted.privateKey);
  const result = authority.verifyPlanWitness({
    witness: signed,
    plan: plan(),
    expectedPolicyDigest: plan().policyDigest,
  });
  assert.equal(result.valid, true);
  assert.equal(result.witnessDigest, signed.witnessDigest);
  assert.equal(result.authorityTrustRootDigest, authority.trustRootDigest);
  assert.equal(result.witnessedAt, signed.record.witnessedAt);
  assert.equal(signed.semanticVerificationRequired, true);
  assert.equal(authority.trustRoot.purpose, "adaptive-evidence-portfolio-preregistration-witness");
  const schema = buildPortfolioWitnessSchema();
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.semanticVerificationRequired.const, true);
  assert.match(schema.$comment, /verifyPlanWitness.*required/i);
});

test("witness verification rejects caller keys, altered plans, and forged chronology", () => {
  const trusted = generateKeyPairSync("ed25519");
  const attacker = generateKeyPairSync("ed25519");
  const authority = createPortfolioWitnessAuthority({
    trustRootId: "portfolio-witness-root",
    registryId: "portfolio-preregistration-log",
    trustedKeys: new Map([["witness-key", trusted.publicKey]]),
  });
  const attackerSigned = witness(authority, attacker.privateKey);
  assert.throws(() => authority.verifyPlanWitness({
    witness: attackerSigned,
    plan: plan(),
    expectedPolicyDigest: plan().policyDigest,
  }), /signature|trusted/i);

  const signed = witness(authority, trusted.privateKey);
  assert.throws(() => authority.verifyPlanWitness({
    witness: signed,
    plan: { ...plan(), planDigest: "c".repeat(64) },
    expectedPolicyDigest: plan().policyDigest,
  }), /plan|subject/i);

  const backdated = witness(authority, trusted.privateKey, "witness-key", {
    witnessedAt: "2026-08-31T11:59:59.000Z",
  });
  assert.throws(() => authority.verifyPlanWitness({
    witness: backdated,
    plan: plan(),
    expectedPolicyDigest: plan().policyDigest,
  }), /witness.*after|chronology|registered/i);

  const dispatched = witness(authority, trusted.privateKey, "witness-key", {
    dispatchNotStarted: false,
  }, true);
  assert.throws(() => authority.verifyPlanWitness({
    witness: dispatched,
    plan: plan(),
    expectedPolicyDigest: plan().policyDigest,
  }), /dispatch/i);
});

test("witness records are closed, hash chained, and canonically signed", () => {
  const trusted = generateKeyPairSync("ed25519");
  const authority = createPortfolioWitnessAuthority({
    trustRootId: "portfolio-witness-root",
    registryId: "portfolio-preregistration-log",
    trustedKeys: new Map([["witness-key", trusted.publicKey]]),
  });
  const wrongChain = record(authority, { sequence: 1, previousWitnessDigest: null });
  assert.throws(() => portfolioWitnessRecordDigest(wrongChain), /previous|sequence|chain/i);
  assert.throws(() => portfolioWitnessRecordDigest({ ...record(authority), extra: true }), /keys|closed/i);

  const signed = witness(authority, trusted.privateKey);
  const changed = structuredClone(signed);
  changed.attestation.signature = changed.attestation.signature.slice(0, -2) + "AA";
  changed.witnessDigest = canonicalDigest({
    record: changed.record,
    attestation: changed.attestation,
    semanticVerificationRequired: true,
  });
  assert.throws(() => authority.verifyPlanWitness({
    witness: changed,
    plan: plan(),
    expectedPolicyDigest: plan().policyDigest,
  }), /signature|base64/i);
});
