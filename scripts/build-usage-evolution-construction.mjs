import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { configureEvolutionTrust, createDevelopmentManifest, mineRecurringFailures, reviewSubjectDigest } from "../src/skill-evolution.mjs";
import { attestReview, EVALUATOR_PUBLIC_KEY, REVIEW_KEY_ID, REVIEW_PUBLIC_KEY, fixtureKeyProofLimit } from "./evolution-fixture-keys.mjs";

const BASE_COMMIT = "9392df6b1e7fdb3f460c0a6494ca87c8edae69ee";
const TARGET = "skills/sovereign-skill-refinery/SKILL.md";

export async function buildConstruction(root = path.resolve(".")) {
  const developmentPath = path.join(root, "data/evals/usage-evolution-development.json");
  const developmentBytes = await readFile(developmentPath);
  const development = JSON.parse(developmentBytes);
  const baselineText = execFileSync("git", ["show", `${BASE_COMMIT}:${TARGET}`], { cwd: root, encoding: "utf8" });
  const candidateText = await readFile(path.join(root, TARGET), "utf8");
  const developmentManifest = createDevelopmentManifest(development.traces, { reviewAuthority: development.reviewAuthority, reviewLedgerDigest: sha256(developmentBytes) });
  const miningReceipt = mineRecurringFailures(developmentManifest, { minimumOccurrences: 2, maximumClusters: 8 });
  const reviewAttestation = attestReview(reviewSubjectDigest(developmentManifest));
  const authority = configureEvolutionTrust({ reviewPublicKeys: { [REVIEW_KEY_ID]: REVIEW_PUBLIC_KEY }, evaluatorPublicKeys: { "fixture-evaluator": EVALUATOR_PUBLIC_KEY } });
  const proposal = authority.stageProposal({
    targetSkillId: "sovereign-skill-refinery",
    baselineText,
    candidateText,
    edits: [
      { operation: "replace-section", sectionId: "required-evidence", rationaleCode: "missing-receipt-binding" },
      { operation: "append-boundary", sectionId: "usage-driven-evolution", rationaleCode: "unsafe-auto-adoption" }
    ],
    miningReceipt,
    developmentManifest,
    reviewAttestation,
    maximumEdits: 2,
  });
  return { schemaVersion: 1, developmentManifest, miningReceipt, proposal, authority: { reviewKeyId: REVIEW_KEY_ID, algorithm: "ed25519" }, proofLimits: [development.proofLimit, fixtureKeyProofLimit] };
}

const root = path.resolve(".");
await writeJsonAtomic(path.join(root, "artifacts/usage-evolution/construction.json"), await buildConstruction(root));
