import { sign } from "node:crypto";

import {
  createPortfolioWitnessAuthority,
  portfolioWitnessAttestationMessage,
  portfolioWitnessRecordDigest,
} from "../src/adaptive-evidence-portfolio-witness.mjs";
import { canonicalDigest } from "../src/adaptive-evidence-contracts.mjs";

export const FIXTURE_PORTFOLIO_WITNESS_TRUST_ROOT_ID =
  "adaptive-evidence-portfolio-v1-fixture-witness-root";
export const FIXTURE_PORTFOLIO_WITNESS_REGISTRY_ID =
  "adaptive-evidence-portfolio-v1-fixture-log";
export const FIXTURE_PORTFOLIO_WITNESS_KEY_ID = "fixture-portfolio-witness";
export const FIXTURE_PORTFOLIO_WITNESS_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAEozhP3FcqNQ7rRpSIhyCh81G/wxr/FmSECt19BjlbgY=
-----END PUBLIC KEY-----
`;
const FIXTURE_PORTFOLIO_WITNESS_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIDGP5wkc/KsWqySnR359TgQOJDPgaDwZ8/HbcT2BOzhR
-----END PRIVATE KEY-----
`;

export function createFixturePortfolioWitnessAuthority() {
  return createPortfolioWitnessAuthority({
    trustRootId: FIXTURE_PORTFOLIO_WITNESS_TRUST_ROOT_ID,
    registryId: FIXTURE_PORTFOLIO_WITNESS_REGISTRY_ID,
    trustedKeys: new Map([[
      FIXTURE_PORTFOLIO_WITNESS_KEY_ID,
      FIXTURE_PORTFOLIO_WITNESS_PUBLIC_KEY,
    ]]),
  });
}

export function attestFixturePortfolioPlan({
  plan,
  witnessedAt,
  sequence = 0,
  previousWitnessDigest = null,
} = {}) {
  const authority = createFixturePortfolioWitnessAuthority();
  const record = {
    schemaVersion: 1,
    id: `${plan.id}-witness`,
    purpose: "adaptive-evidence-portfolio-preregistration",
    registryId: authority.registryId,
    sequence,
    previousWitnessDigest,
    planDigest: plan.planDigest,
    portfolioPolicyDigest: plan.policyDigest,
    authorityTrustRootDigest: authority.trustRootDigest,
    witnessedAt,
    dispatchNotStarted: true,
  };
  const subjectDigest = portfolioWitnessRecordDigest(record);
  const unsigned = {
    algorithm: "ed25519",
    purpose: "adaptive-evidence-portfolio-preregistration",
    subjectDigest,
    keyId: FIXTURE_PORTFOLIO_WITNESS_KEY_ID,
  };
  const attestation = {
    ...unsigned,
    signature: sign(
      null,
      portfolioWitnessAttestationMessage(unsigned),
      FIXTURE_PORTFOLIO_WITNESS_PRIVATE_KEY,
    ).toString("base64"),
  };
  const body = {
    record,
    attestation,
    semanticVerificationRequired: true,
  };
  return Object.freeze({ ...body, witnessDigest: canonicalDigest(body) });
}

export const fixturePortfolioWitnessProofLimit =
  "the committed witness private key authenticates deterministic portfolio fixtures only and is not a production trust root";
