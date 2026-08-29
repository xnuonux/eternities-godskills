import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { sha256, writeJsonAtomic } from "../src/io.mjs";

const selectedSources = [
  [".claude/skills/cc-coordination.md", "68ec043822936c741c6e1a5f928ec44250bc0aec410f3db524e24f5b73c75578", "eternities-forge"],
  [".claude/skills/diagnostic-playbook.md", "92f97dd2468e65a124ab27631c096f2ec8e6f078fb8c69e2aa486e094bad0ded", "eternities-phoenix"],
  [".claude/skills/verify-goal.md", "64d29c115d558587a59f1f034dbc23af3033ea01d45f4886a7a8dd75b3c650f4", "eternities-daedalus"],
  ["aegis/test-aegis.js", "67ebc8c5f66c7b1596e4db4ffc549ec7a632bf195ce3f76b7e42aff7f0da310b", "eternities-aegis"],
  ["docs/cinema/LUNARI-Cinema-Coherence-Night-Summary-2026-06-27.md", "7d5bd77ee77d3ac7fe85aea3c6db317c41aabffbc7c754f17595ac6a7baa47be", "eternities-forge"],
  ["docs/compass_artifact_wf-e4bdd3b1-6188-45db-886c-f72e89003b2c_text_markdown.md", "d78ab99ae90cdc4a6b77701fd78b4a48a9267506c51fc7889058e7d19866911b", "eternities-athena"],
  ["docs/extra research agents/autonomous-crew-multi-agent-architecture-blueprint.md", "1e97fcd36611ca21b00cad1066dbee5906b7c738243ec0206a863febc039f43a", "eternities-forge"],
  ["docs/extra research agents/nova-muse-craft-taxonomy-and-capability-spec.md", "5c11786d75dbe8ea1f6646d3852097dc27cad8ab9455ae6440f806ae2b3d0e82", "eternities-logos"],
  ["docs/lunari-master-bundle/lunari-master-bundle/02-tier-0-minor-fixes/README.md", "23027b898c29d30881e3a9124b07b52beff135a4ab95ceea4a3b5bfb52702eef", "eternities-herald"],
  ["docs/lunari-master-bundle/lunari-master-bundle/05-phase-3-forge-cloud/self-healing-AI-strategy.md", "31a971912dd1619ccc22b3ae871ade57fde15a41ba73581bf0d8b38f47469399", "eternities-architect"],
  ["docs/PROMETHEUS-the-imaginer-conception.md", "120961e458125211c2b8a470ebcdd17be9a59f06372249ff9653a791a83c9204", "eternities-athena"],
  ["prometheus/calibration.js", "f473c2aa6bb86897484bd21d40e8c006eabcbcf61e50146af59f731576f3eb12", "eternities-athena"],
  ["prometheus/evaluate.js", "c8101ad9a7ccd6552034857690bc11d58b31e774db9c97b33f90901ea2ea04ac", "eternities-athena"],
  ["prometheus/experiment.js", "157f6e0a151567373069fc6034a85a2435547c6154734221496d5182b73d0ecd", "eternities-athena"],
  ["prometheus/falsifiers/gauntlet.js", "a35082bbfb55c1d3a3ed36e34c01cceb4eba81671f58df09e8b211ed727e283a", "eternities-athena"],
  ["prometheus/falsifiers/prior-art.js", "6549cd9fa2451a13008cdbf756e6c1d4ecb0b2ec7285418dc14cdbed2c57d01e", "eternities-oracle"],
  ["prometheus/imagine.js", "bb07acf030d59f180692f8eead402865d0a2d8e39da9da4afb77d2f5561c7b2c", "eternities-athena"],
  ["prometheus/spec.js", "7b9111b615930e3cbd69d11649f03c2260fb1c7009c7218d08e561c7cb574315", "eternities-athena"],
].map(([sourcePath, sourceSha256, owner]) => ({ path: sourcePath, sha256: sourceSha256, owner }));

const owners = ["aegis", "architect", "athena", "daedalus", "forge", "herald", "logos", "oracle", "phoenix"];
const artifactPaths = [
  "artifacts/lunari-first-party-quarry/candidate-cards.jsonl",
  "artifacts/lunari-first-party-quarry/coverage-ledger.jsonl",
  "artifacts/lunari-first-party-quarry/coverage.json",
  "artifacts/lunari-first-party-quarry/duplicate-groups.json",
  "artifacts/lunari-first-party-quarry/owner-map.json",
  "docs/lunari-first-party-quarry-report.md",
  "scripts/build-lunari-first-party-infusion-receipt.mjs",
  "scripts/build-lunari-first-party-quarry.mjs",
  "src/first-party-quarry.mjs",
  "src/lunari-first-party-contracts.mjs",
  "tests/first-party-quarry.test.mjs",
  "tests/lunari-first-party-infusion.test.mjs",
  ...owners.flatMap((owner) => [
    `skills/eternities-${owner}/SKILL.md`,
    `skills/eternities-${owner}/references/first-party-contracts.md`,
  ]),
].sort((left, right) => left.localeCompare(right));

export async function buildLunariFirstPartyInfusionReceipt(root = path.resolve("."), { write = true } = {}) {
  const quarryRoot = path.join(root, "artifacts/lunari-first-party-quarry");
  const coverage = JSON.parse(await readFile(path.join(quarryRoot, "coverage.json"), "utf8"));
  const ledger = new Map((await readFile(path.join(quarryRoot, "coverage-ledger.jsonl"), "utf8"))
    .trim().split(/\r?\n/).map(JSON.parse).map((row) => [row.relativePath, row]));
  if (coverage.pathCount !== 5438 || coverage.unresolvedCount !== 0) throw new Error("quarry coverage is incomplete or stale");
  for (const source of selectedSources) {
    const row = ledger.get(source.path);
    if (!row || row.sha256 !== source.sha256 || row.contentInspected !== true) throw new Error(`selected source is absent or stale: ${source.path}`);
  }
  const artifacts = await Promise.all(artifactPaths.map(async (relativePath) => ({
    path: relativePath,
    sha256: sha256(await readFile(path.join(root, relativePath))),
  })));
  const receipt = {
    schemaVersion: 1,
    receiptId: "lunari-first-party-infusion-v1",
    sourceIdentity: coverage.sourceIdentity,
    evidenceLevel: "exact-inert-first-party-snapshot-and-deterministic-contracts",
    evaluationMode: "physical-coverage-ledger-plus-behavior-fixtures",
    coverage: {
      pathCount: coverage.pathCount,
      inspectedCount: coverage.inspectedCount,
      excludedCount: coverage.pathCount - coverage.inspectedCount,
      candidateCount: coverage.candidateCount,
      unresolvedCount: coverage.unresolvedCount,
      duplicateCounts: coverage.duplicateCounts,
      artifactDigests: coverage.artifactDigests,
    },
    enhancedOwners: owners.map((owner) => `eternities-${owner}`),
    selectedSources,
    artifacts,
    copiedSourceProse: false,
    copiedImplementation: false,
    archivedCodeExecuted: false,
    externalMutation: false,
    limitation: "This receipt proves exact local source and artifact bytes, deterministic physical archive coverage, inert exclusions, and fixture behavior. It does not prove live-model routing, reviewer independence, production behavior, scientific truth, security impact, or correctness beyond executed evidence.",
    decision: { status: "promoted", contractCount: 10, enhancedOwnerCount: owners.length },
  };
  if (write) await writeJsonAtomic(path.join(root, "receipts/lunari-first-party-infusion-v1.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const receipt = await buildLunariFirstPartyInfusionReceipt();
  console.log(JSON.stringify({ status: receipt.decision.status, contracts: receipt.decision.contractCount, paths: receipt.coverage.pathCount }, null, 2));
}
