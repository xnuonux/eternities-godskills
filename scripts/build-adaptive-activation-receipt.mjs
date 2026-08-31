import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { compileActivationDecision } from "../src/adaptive-activation.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]));
  }
  return value;
}

const digest = (value) => sha256(JSON.stringify(stable(value)));

function task(consequenceClass) {
  return {
    taskClass: "creative-generation",
    consequenceClass,
    authorityProjection: {
      availableAuthority: ["local-read", "local-write"],
      permittedEffects: ["local-read", "local-write"],
    },
  };
}

async function input(root, relative) {
  const bytes = await readFile(new URL(relative, root));
  return { bytes, sha256: sha256(bytes) };
}

export async function rebuildAdaptiveActivationReceipt({ root = new URL("../", import.meta.url) } = {}) {
  const [contractInput, policyInput, evidenceInput, compilerInput] = await Promise.all([
    input(root, "artifacts/adaptive-activation/neutral-contract.json"),
    input(root, "policies/adaptive-activation.v1.json"),
    input(root, "artifacts/adaptive-activation/evidence.v1.json"),
    input(root, "src/adaptive-activation.mjs"),
  ]);
  const policy = JSON.parse(policyInput.bytes.toString("utf8"));
  const evidence = JSON.parse(evidenceInput.bytes.toString("utf8"));
  const decisions = {
    museWithReview: compileActivationDecision({
      selectedId: "eternities-muse",
      task: task("consequential"),
      reviewAvailable: true,
      policy,
      evidence,
    }),
    museWithoutReview: compileActivationDecision({
      selectedId: "eternities-muse",
      task: task("consequential"),
      reviewAvailable: false,
      policy,
      evidence,
    }),
    museLowConsequence: compileActivationDecision({
      selectedId: "eternities-muse",
      task: task("low"),
      reviewAvailable: false,
      policy,
      evidence,
    }),
  };
  const unsigned = {
    schemaVersion: 1,
    id: "adaptive-activation-v1",
    status: "experimental",
    inputs: {
      contractSha256: contractInput.sha256,
      policySha256: policyInput.sha256,
      evidenceSha256: evidenceInput.sha256,
      compilerSha256: compilerInput.sha256,
    },
    decisions,
    gates: {
      selectionSeparatedFromActivation: true,
      preInferenceMuseBodyLoads: 0,
      authorityExpansions: 0,
      museMethodEligible: false,
      explicitAdoptionRequired: true,
    },
    proofLimits: [
      "deterministic-policy-and-reviewed-development-evidence-only",
      "model-quality-on-unseen-missions",
      "review-mode-does-not-prove-review-execution",
      "no-global-activation-by-this-receipt",
    ],
  };
  return { ...unsigned, receiptDigest: digest(unsigned) };
}

async function main() {
  const root = new URL("../", import.meta.url);
  const receipt = await rebuildAdaptiveActivationReceipt({ root });
  await writeJsonAtomic(fileURLToPath(new URL("receipts/adaptive-activation-v1.json", root)), receipt);
  process.stdout.write(`${JSON.stringify({ status: receipt.status, receiptDigest: receipt.receiptDigest })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
