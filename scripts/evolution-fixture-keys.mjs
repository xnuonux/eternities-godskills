import { sign } from "node:crypto";

import { attestationMessage } from "../src/skill-evolution.mjs";

export const REVIEW_KEY_ID = "fixture-review";
export const EVALUATOR_KEY_ID = "fixture-evaluator";
export const REVIEW_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEALf9Rc+C4Pfrj//AcDhzWZGyhSBJ1zds/9/KjEy2JGo4=\n-----END PUBLIC KEY-----\n`;
const REVIEW_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEILn7IuIyd1I7LADFGPq6s+ID3q8G07LVzPr0fr/GpD72\n-----END PRIVATE KEY-----\n`;
export const EVALUATOR_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA7aLQEjHeKlIgB/MfUANYUKRW69DD1kRu4HJKnQXiFpQ=\n-----END PUBLIC KEY-----\n`;
const EVALUATOR_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDe+1ltFT1fAVS34ToG6Ti+VMOaAONscykgAtV4cGmrh\n-----END PRIVATE KEY-----\n`;

function attest(purpose, subjectDigest, keyId, privateKey) {
  const unsigned = { algorithm: "ed25519", purpose, subjectDigest, keyId };
  return { ...unsigned, signature: sign(null, attestationMessage(unsigned), privateKey).toString("base64") };
}

export function attestReview(subjectDigest) { return attest("reviewed-development", subjectDigest, REVIEW_KEY_ID, REVIEW_PRIVATE_KEY); }
export function attestEvaluation(purpose, subjectDigest) { return attest(purpose, subjectDigest, EVALUATOR_KEY_ID, EVALUATOR_PRIVATE_KEY); }

export const fixtureKeyProofLimit = "the committed private keys authenticate deterministic certification fixtures only and are not production trust roots";
