import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";

const SOURCE_ID = "trailofbits/skills@d1f1575cff97816e5cc08af66cd2506099c681d3:plugins/agentic-actions-auditor/skills/agentic-actions-auditor/SKILL.md";
const SOURCE_BODY_SHA256 = "2bf244d5684f139d14e6787ece0bcbfb5ba14ed12143a10b3922c40a2e6b45ed";
const PATHS = {
  skill: "skills/eternities-aegis/SKILL.md",
  operatingContract: "skills/eternities-aegis/references/operating-contract.md",
  agenticCiContract: "skills/eternities-aegis/references/agentic-ci-audit.md",
  capabilityContract: "skills/eternities-aegis/references/capability-contract.json",
  routingCard: "skills/eternities-aegis/references/routing-card.json",
  evalSuite: "skills/eternities-aegis/evals/cases.json",
  synthesis: "artifacts/aegis/agentic-ci-synthesis.v1.json",
  priorReceipt: "receipts/promotions/eternities-aegis-v3.json",
  priorSynthesis: "history/syntheses/eternities-aegis.v3.json",
  wave3Receipt: "receipts/github-skill-quarry-wave-3.json",
  wave3Sources: "artifacts/github-wave-3/source-records.jsonl",
  policy: "policies/promotion.v1.json",
};
const RECEIPT_PATH = "receipts/promotions/eternities-aegis-v4.json";

function evidence(relativePath, bytes) {
  return { path: relativePath, sha256: sha256(bytes), bytes: bytes.length };
}

function parseJsonl(bytes, label) {
  return bytes.toString("utf8").split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`${label} line ${index + 1}: ${error.message}`); }
  });
}

export async function buildAegisAgenticCiReceipt({ root = path.resolve("."), write = true } = {}) {
  const bytes = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async ([key, relativePath]) => [
    key,
    await readFile(path.join(root, relativePath)),
  ])));
  const suite = JSON.parse(bytes.evalSuite);
  const synthesis = JSON.parse(bytes.synthesis);
  const priorReceipt = JSON.parse(bytes.priorReceipt);
  const wave3Receipt = JSON.parse(bytes.wave3Receipt);
  const policy = JSON.parse(bytes.policy);
  if (priorReceipt.decision?.status !== "promoted") throw new Error("prior Aegis evidence is not promoted");
  if (wave3Receipt.status !== "verified") throw new Error("wave 3 evidence is not verified");
  const sourceBinding = wave3Receipt.outputs?.sourceRecords;
  if (sourceBinding?.path !== PATHS.wave3Sources || sourceBinding.sha256 !== sha256(bytes.wave3Sources)) {
    throw new Error("wave 3 source binding mismatch");
  }
  const source = parseJsonl(bytes.wave3Sources, PATHS.wave3Sources).find(({ id }) => id === SOURCE_ID);
  if (!source || source.bodySha256 !== SOURCE_BODY_SHA256 || source.inert !== true) {
    throw new Error("agentic CI provenance source mismatch");
  }
  if (
    synthesis.status !== "promoted" ||
    synthesis.provenance?.sourceId !== SOURCE_ID ||
    synthesis.provenance?.sourceBodySha256 !== SOURCE_BODY_SHA256 ||
    synthesis.provenance?.sourceProseCopied !== false ||
    synthesis.provenance?.targetCodeExecuted !== false
  ) throw new Error("agentic CI synthesis provenance mismatch");

  const priorAegis = evaluateSuite(suite.cases, suite.candidate.results);
  const baseline = {
    ...evaluateSuite(suite.agenticCiCases, []),
    tokenCount: 7600,
  };
  const candidate = {
    ...evaluateSuite(suite.agenticCiCases, suite.agenticCiCandidate.results),
    tokenCount: Math.ceil(bytes.skill.length / 4),
    improvements: ["sourceCoverage"],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  if (
    decision.status !== "promoted" ||
    priorAegis.criticalPassed !== priorAegis.criticalTotal ||
    candidate.criticalPassed !== candidate.criticalTotal
  ) throw new Error("agentic CI promotion gates did not pass");

  const artifacts = Object.fromEntries(
    Object.entries(PATHS)
      .filter(([key]) => !["wave3Sources", "policy"].includes(key))
      .map(([key, relativePath]) => [key, evidence(relativePath, bytes[key])]),
  );
  const receipt = {
    schemaVersion: 1,
    skillName: "eternities-aegis",
    version: 4,
    evidenceLevel: "agentic-ci-source-to-sink-candidate-certified",
    evaluationMode: "deterministic-fixtures-inert-provenance-and-prior-route-regression",
    limitation: "This receipt proves exact inert provenance, deterministic route fixtures, prior Aegis regression, and current artifact bytes. It does not prove arbitrary workflow coverage, safe runtime behavior, remote action internals, platform behavior, or authority for mutation.",
    evidence: {
      sourceId: SOURCE_ID,
      sourceBodySha256: SOURCE_BODY_SHA256,
      licenseSignal: source.licenseSignal,
      sourceProseCopied: false,
      targetCodeExecuted: false,
      sourceInstructionsActivated: false,
      externalMutation: false,
      wave3SourceRecordsSha256: sourceBinding.sha256,
    },
    baseline,
    candidate,
    priorAegis,
    decision: {
      ...decision,
      reasons: [
        ...decision.reasons,
        "all earlier Aegis critical fixtures remain exact",
        "configuration amplifiers remain distinct from proven source-to-sink findings",
        "remote and runtime evidence gaps fail closed",
      ],
    },
    artifacts,
  };
  if (write) await writeJsonAtomic(path.join(root, RECEIPT_PATH), receipt);
  return { receipt, synthesis };
}

async function main() {
  const { receipt } = await buildAegisAgenticCiReceipt();
  console.log(JSON.stringify({ status: receipt.decision.status, candidate: `${receipt.candidate.criticalPassed}/${receipt.candidate.criticalTotal}`, priorAegis: `${receipt.priorAegis.criticalPassed}/${receipt.priorAegis.criticalTotal}` }, null, 2));
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) await main();
