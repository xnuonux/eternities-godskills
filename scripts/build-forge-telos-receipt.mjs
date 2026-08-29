import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateSuite } from "../src/evaluate.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";
import { decidePromotion } from "../src/promote.mjs";

const files = {
  skill: "skills/eternities-forge/SKILL.md",
  capabilityContract: "skills/eternities-forge/references/capability-contract.json",
  closureContract: "skills/eternities-forge/references/telos-closure.md",
  provenance: "skills/eternities-forge/references/telos-provenance.json",
  evaluation: "skills/eternities-forge/evals/cases.json",
};

async function artifact(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return { path: relativePath, sha256: sha256(bytes) };
}

export async function buildForgeTelos(root = path.resolve("."), { write = true } = {}) {
  const suite = JSON.parse(await readFile(path.join(root, files.evaluation), "utf8"));
  const policy = JSON.parse(await readFile(path.join(root, "policies/promotion.v1.json"), "utf8"));
  const skillBytes = await readFile(path.join(root, files.skill));
  const provenance = JSON.parse(await readFile(path.join(root, files.provenance), "utf8"));
  const canonical = provenance.sources.find(({ disposition }) => disposition === "canonical-first-party-source");
  if (canonical?.repository !== "xnuonux/eternities-canon" || canonical.blobSha !== "28e704971b47c70788d12223a94861d42d52316c") {
    throw new Error("canonical perfection-loop evidence is absent or stale");
  }

  const baseline = { ...evaluateSuite(suite.cases, suite.baseline.results), tokenCount: suite.baseline.tokenCount };
  const candidate = {
    ...evaluateSuite(suite.cases, suite.candidate.results),
    tokenCount: Math.ceil(skillBytes.length / 4),
    improvements: ["sourceCoverage"],
  };
  const decision = decidePromotion({ baseline, candidate, policy });
  if (decision.status !== "promoted") throw new Error(`Forge Telos did not clear promotion: ${decision.status}`);

  const artifacts = Object.fromEntries(
    await Promise.all(Object.entries(files).map(async ([name, relativePath]) => [name, await artifact(root, relativePath)])),
  );
  const receipt = {
    schemaVersion: 1,
    skillName: "eternities-forge",
    capability: "telos-closure",
    version: 1,
    evidenceLevel: "exact-first-party-source-and-deterministic-contract",
    evaluationMode: "deterministic-route-and-boundary-fixture",
    limitation: "This receipt proves exact local artifact bytes, bounded route fixtures, and source dispositions. It does not prove literal perfection, arbitrary live-model judgment, reviewer independence, or correctness beyond executed evidence.",
    evidence: {
      canonicalRepository: canonical.repository,
      canonicalPath: canonical.path,
      canonicalCommitSha: canonical.commitSha,
      canonicalBlobSha: canonical.blobSha,
      copiedSourceProse: provenance.copiedSourceProse,
      copiedImplementation: provenance.copiedImplementation,
      externalMutation: false,
    },
    artifacts,
    baseline,
    candidate,
    decision,
  };
  if (write) await writeJsonAtomic(path.join(root, "receipts/promotions/eternities-forge-telos-v1.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const receipt = await buildForgeTelos();
  console.log(JSON.stringify({ status: receipt.decision.status, cases: receipt.candidate.total }, null, 2));
}
