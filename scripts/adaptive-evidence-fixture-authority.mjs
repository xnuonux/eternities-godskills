import { sign } from "node:crypto";

import {
  authorizationAttestationMessage,
  authorizationRecordDigest,
  lifecycleDecisionAttestationMessage,
} from "../src/adaptive-evidence-authority.mjs";

export const FIXTURE_AUTHORITY_TRUST_ROOT_ID = "adaptive-evidence-v2-fixture-authority";
export const FIXTURE_AUTHORITY_KEY_ID = "fixture-lifecycle-authority";
export const FIXTURE_AUTHORITY_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEADpSaN1GSuPZht3k4IKWfMbTu4QrLdxXfVRfZK2B1w+Y=
-----END PUBLIC KEY-----
`;
const FIXTURE_AUTHORITY_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEICISdaSjX+NlBQyed031txlTBri8T7o5SsgvX/rnyk4I
-----END PRIVATE KEY-----
`;

export function fixtureAuthorityOptions(expectedPolicyDigest) {
  return {
    trustRootId: FIXTURE_AUTHORITY_TRUST_ROOT_ID,
    trustedKeys: new Map([[FIXTURE_AUTHORITY_KEY_ID, FIXTURE_AUTHORITY_PUBLIC_KEY]]),
    expectedPolicyDigest,
  };
}

export function attestAdaptiveEvidenceAuthorization(record) {
  const subjectDigest = authorizationRecordDigest(record);
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-lifecycle-authorization",
    subjectDigest,
    keyId: FIXTURE_AUTHORITY_KEY_ID,
  };
  return {
    record,
    attestation: {
      ...unsigned,
      signature: sign(
        null,
        authorizationAttestationMessage(unsigned),
        FIXTURE_AUTHORITY_PRIVATE_KEY,
      ).toString("base64"),
    },
  };
}

export function attestAdaptiveEvidenceLifecycleDecision(decision) {
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-lifecycle-decision",
    subjectDigest: decision.decisionDigest,
    keyId: FIXTURE_AUTHORITY_KEY_ID,
  };
  return {
    ...unsigned,
    signature: sign(
      null,
      lifecycleDecisionAttestationMessage(unsigned),
      FIXTURE_AUTHORITY_PRIVATE_KEY,
    ).toString("base64"),
  };
}

export const fixtureAuthorityProofLimit =
  "the committed private key authenticates deterministic adaptive-evidence fixtures only and is not a production trust root";
