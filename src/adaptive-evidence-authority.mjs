import { createPublicKey, verify as verifySignature } from "node:crypto";

import {
  canonicalDigest,
  deepFreeze,
  digestString,
  exactKeys,
  nonEmptyString,
} from "./adaptive-evidence-contracts.mjs";
import { sha256 } from "./io.mjs";

const AUTHORIZATION_PURPOSE = "adaptive-evidence-lifecycle-authorization";
const LIFECYCLE_DECISION_PURPOSE = "adaptive-evidence-lifecycle-decision";
const TRUST_ROOT_PURPOSE = "adaptive-evidence-lifecycle-governance";
const IDENTIFIER = /^[a-z0-9][a-z0-9-]{0,127}$/;
const ACTIONS = new Set(["promote", "demote", "quarantine", "invalidate"]);
const MODES = new Set(["native", "guardrail", "method", "review"]);
const RECORD_KEYS = Object.freeze([
  "schemaVersion",
  "authorizationId",
  "actorId",
  "action",
  "requestedMode",
  "currentMode",
  "profileDigest",
  "bindingsDigest",
  "grant",
  "issuedAt",
  "expiresAt",
]);

function identifier(value, label) {
  nonEmptyString(value, label);
  if (!IDENTIFIER.test(value)) throw new Error(`${label} must be a bounded lowercase identifier`);
  return value;
}

function exactIso(value, label) {
  nonEmptyString(value, label);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be an exact ISO timestamp`);
  }
  return value;
}

function validateRecord(record) {
  exactKeys(record, RECORD_KEYS, "lifecycle authorization record");
  if (record.schemaVersion !== 1) throw new Error("lifecycle authorization version is invalid");
  identifier(record.authorizationId, "lifecycle authorization id");
  identifier(record.actorId, "lifecycle authorization actor");
  if (!ACTIONS.has(record.action)) throw new Error("lifecycle authorization action is invalid");
  if (!MODES.has(record.requestedMode) || !MODES.has(record.currentMode)) {
    throw new Error("lifecycle authorization mode is invalid");
  }
  digestString(record.profileDigest, "lifecycle authorization profile digest");
  digestString(record.bindingsDigest, "lifecycle authorization bindings digest");
  nonEmptyString(record.grant, "lifecycle authorization grant");
  exactIso(record.issuedAt, "lifecycle authorization issuedAt");
  exactIso(record.expiresAt, "lifecycle authorization expiresAt");
  if (new Date(record.expiresAt) <= new Date(record.issuedAt)) {
    throw new Error("lifecycle authorization validity interval is invalid");
  }
  return record;
}

export function authorizationRecordDigest(record) {
  return canonicalDigest(validateRecord(record));
}

export function authorizationAttestationMessage({
  algorithm,
  purpose,
  subjectDigest,
  keyId,
} = {}) {
  if (algorithm !== "ed25519") throw new Error("authority attestation algorithm is invalid");
  if (purpose !== AUTHORIZATION_PURPOSE) {
    throw new Error("authority attestation purpose is invalid");
  }
  digestString(subjectDigest, "authority attestation subject digest");
  identifier(keyId, "authority attestation key id");
  return Buffer.from(
    `eternities-adaptive-evidence-authority-v1\n${purpose}\n${subjectDigest}\n${keyId}\n`,
    "utf8",
  );
}

export function lifecycleDecisionAttestationMessage({
  algorithm,
  purpose,
  subjectDigest,
  keyId,
} = {}) {
  if (algorithm !== "ed25519") throw new Error("authority attestation algorithm is invalid");
  if (purpose !== LIFECYCLE_DECISION_PURPOSE) {
    throw new Error("lifecycle decision attestation purpose is invalid");
  }
  digestString(subjectDigest, "lifecycle decision attestation subject digest");
  identifier(keyId, "lifecycle decision attestation key id");
  return Buffer.from(
    `eternities-adaptive-evidence-authority-v1\n${purpose}\n${subjectDigest}\n${keyId}\n`,
    "utf8",
  );
}

function compileTrustRoot(trustRootId, trustedKeys) {
  identifier(trustRootId, "authority trust root id");
  if (!(trustedKeys instanceof Map) || trustedKeys.size === 0 || trustedKeys.size > 32) {
    throw new TypeError("authority trustedKeys must be a non-empty Map of at most 32 keys");
  }
  const keys = [];
  const usable = new Map();
  for (const [keyId, supplied] of [...trustedKeys.entries()]
    .sort(([left], [right]) => left.localeCompare(right))) {
    identifier(keyId, "authority trusted key id");
    const publicKey = supplied?.type === "public" ? supplied : createPublicKey(supplied);
    if (publicKey.asymmetricKeyType !== "ed25519") {
      throw new Error(`authority trusted key ${keyId} is not Ed25519`);
    }
    const publicKeyBytes = publicKey.export({ type: "spki", format: "der" });
    keys.push({
      keyId,
      algorithm: "ed25519",
      publicKeySha256: sha256(publicKeyBytes),
    });
    usable.set(keyId, publicKey);
  }
  const body = {
    schemaVersion: 1,
    id: trustRootId,
    purpose: TRUST_ROOT_PURPOSE,
    keys,
  };
  return {
    trustRoot: deepFreeze({ ...body, trustRootDigest: canonicalDigest(body) }),
    usable,
  };
}

function validateExpected(expected) {
  exactKeys(expected, [
    "profileDigest",
    "bindingsDigest",
    "action",
    "requestedMode",
    "currentMode",
    "grant",
    "decidedAt",
  ], "expected lifecycle authorization");
  digestString(expected.profileDigest, "expected profile digest");
  digestString(expected.bindingsDigest, "expected bindings digest");
  if (!ACTIONS.has(expected.action)) throw new Error("expected lifecycle action is invalid");
  if (!MODES.has(expected.requestedMode) || !MODES.has(expected.currentMode)) {
    throw new Error("expected lifecycle mode is invalid");
  }
  nonEmptyString(expected.grant, "expected lifecycle grant");
  exactIso(expected.decidedAt, "lifecycle decidedAt");
  return expected;
}

export function createAdaptiveEvidenceAuthority(options = {}) {
  exactKeys(options, ["trustRootId", "trustedKeys"], "adaptive evidence authority input");
  const { trustRoot, usable } = compileTrustRoot(options.trustRootId, options.trustedKeys);

  function verifyAttestation(attestation, expectedPurpose, expectedSubjectDigest) {
    exactKeys(
      attestation,
      ["algorithm", "purpose", "subjectDigest", "keyId", "signature"],
      "authority attestation",
    );
    if (attestation.purpose !== expectedPurpose
        || attestation.subjectDigest !== expectedSubjectDigest) {
      throw new Error("authority attestation is not bound to the expected subject and purpose");
    }
    const publicKey = usable.get(attestation.keyId);
    if (!publicKey) throw new Error("authority attestation key is not trusted");
    if (typeof attestation.signature !== "string"
        || !/^[A-Za-z0-9+/]{86}==$/.test(attestation.signature)) {
      throw new Error("authority attestation signature is not canonical base64");
    }
    const signature = Buffer.from(attestation.signature, "base64");
    const message = expectedPurpose === AUTHORIZATION_PURPOSE
      ? authorizationAttestationMessage(attestation)
      : lifecycleDecisionAttestationMessage(attestation);
    if (signature.length !== 64 || signature.toString("base64") !== attestation.signature
        || !verifySignature(null, message, publicKey, signature)) {
      throw new Error("authority attestation signature is invalid");
    }
    return attestation.keyId;
  }

  function verifyAuthorizationPackage(input = {}) {
    exactKeys(input, ["authorizationPackage", "expected"], "authorization verification input");
    const { authorizationPackage, expected } = input;
    exactKeys(authorizationPackage, ["record", "attestation"], "authorization package");
    const record = validateRecord(authorizationPackage.record);
    const trustedExpected = validateExpected(expected);
    const subjectDigest = authorizationRecordDigest(record);
    const attestation = authorizationPackage.attestation;
    const authorityKeyId = verifyAttestation(
      attestation,
      AUTHORIZATION_PURPOSE,
      subjectDigest,
    );
    const expectedFields = [
      "profileDigest",
      "bindingsDigest",
      "action",
      "requestedMode",
      "currentMode",
      "grant",
    ];
    const mismatch = expectedFields.find((field) => record[field] !== trustedExpected[field]);
    if (mismatch) throw new Error(`lifecycle authorization ${mismatch} does not match`);
    const decidedAt = new Date(trustedExpected.decidedAt);
    if (decidedAt < new Date(record.issuedAt) || decidedAt > new Date(record.expiresAt)) {
      throw new Error("lifecycle authorization is outside its validity interval or expired");
    }
    return deepFreeze({
      record: structuredClone(record),
      authorizationDigest: subjectDigest,
      authorityKeyId,
      authorityTrustRootDigest: trustRoot.trustRootDigest,
    });
  }

  function verifyLifecycleDecisionAttestation(input = {}) {
    exactKeys(
      input,
      ["attestation", "expectedDecisionDigest"],
      "lifecycle decision attestation verification input",
    );
    digestString(input.expectedDecisionDigest, "expected lifecycle decision digest");
    const authorityKeyId = verifyAttestation(
      input.attestation,
      LIFECYCLE_DECISION_PURPOSE,
      input.expectedDecisionDigest,
    );
    return deepFreeze({
      decisionDigest: input.expectedDecisionDigest,
      authorityKeyId,
      authorityTrustRootDigest: trustRoot.trustRootDigest,
    });
  }

  return Object.freeze({
    trustRoot,
    trustRootDigest: trustRoot.trustRootDigest,
    verifyAuthorizationPackage,
    verifyLifecycleDecisionAttestation,
  });
}
