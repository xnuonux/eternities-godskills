import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildIntentCompilerV3 } from "./build-intent-compiler-v3-receipt.mjs";
import { buildRouterV7 } from "./build-router-v7-receipt.mjs";
import { compileIntentWithGapLookup } from "../src/intent-compiler.mjs";
import { loadWave2SemanticAtlas } from "../src/quarry-atlas.mjs";
import { sha256, writeJsonAtomic } from "../src/io.mjs";

function naturalRequest(requestId, text, context = {}) {
  return {
    schemaVersion: 1,
    requestId,
    text,
    context: {
      permittedEffects: ["local-read", "local-write"],
      availableAuthority: ["local-read", "local-write"],
      availablePreconditions: [],
      forbiddenCapabilities: [],
      maximumRisk: "high",
      minimumEvidenceConfidence: "medium",
      contextBudget: 4000,
      maxCompositionSize: 3,
      ...context,
    },
  };
}

function containsForbiddenSourceMaterial(value) {
  const text = JSON.stringify(value);
  return /sourceAbsolutePath|sourceBody|canonicalSourceId|sourcePath|repository/i.test(text);
}

export async function buildWave2GapRoutingReceipt({ root = path.resolve("."), write = true } = {}) {
  const [cardsBytes, atlas, compilerV3, routerV7] = await Promise.all([
    fs.readFile(path.join(root, "artifacts/routing/cards.jsonl")),
    loadWave2SemanticAtlas(root),
    buildIntentCompilerV3({ root, write: false }),
    buildRouterV7(root, { write: false }),
  ]);
  const cards = cardsBytes.toString("utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const daedalus = cards.find((card) => card.id === "eternities-daedalus");
  if (!daedalus) throw new Error("Daedalus routing card is missing");
  const coveredRequest = naturalRequest(
    "wave2-gap-covered",
    daedalus.intentExamples.direct[0],
    {
      permittedEffects: daedalus.effects,
      availableAuthority: daedalus.authorityRequirements,
      availablePreconditions: daedalus.preconditions,
      maximumRisk: daedalus.riskClass,
      minimumEvidenceConfidence: daedalus.evidenceConfidence,
    },
  );
  const uncoveredRequest = naturalRequest(
    "wave2-gap-uncovered",
    "build an Opentrons deck labware collision and liquid handling protocol",
  );
  const covered = compileIntentWithGapLookup({ request: coveredRequest, cards, semanticAtlas: atlas });
  const uncovered = compileIntentWithGapLookup({ request: uncoveredRequest, cards, semanticAtlas: atlas });
  const repeated = compileIntentWithGapLookup({ request: uncoveredRequest, cards: [...cards].reverse(), semanticAtlas: atlas });
  let staleFailedClosed = false;
  try {
    compileIntentWithGapLookup({
      request: uncoveredRequest,
      cards,
      semanticAtlas: { ...atlas, certificate: { ...atlas.certificate, stale: true } },
    });
  } catch (error) {
    staleFailedClosed = /stale/i.test(error.message);
  }
  const gates = {
    ordinaryCoveredRouteSkipsLookup:
      covered.gapLookup.invoked === false && covered.gapLookup.reason === "promoted-route-qualified",
    uncoveredConsequentialRouteInvokesLookup:
      uncovered.gapLookup.invoked === true && uncovered.gapLookup.reason === "uncovered-consequential-intent",
    resultLimitAtMostFive: uncovered.gapLookup.cards.length >= 1 && uncovered.gapLookup.cards.length <= 5,
    compactReviewedCardsOnly: !containsForbiddenSourceMaterial(uncovered.gapLookup.cards),
    sourceBodiesNeverTransported:
      uncovered.gapLookup.sourceBodiesTransported === 0 &&
      uncovered.gapLookup.cards.every((card) => card.sourceBodiesTransported === 0),
    authorityPreserved:
      uncovered.gapLookup.authorityExpanded === false &&
      JSON.stringify(uncovered.compilerReceipt.suppliedAuthority) === JSON.stringify(uncoveredRequest.context.availableAuthority),
    deterministicAcrossCardOrder: JSON.stringify(uncovered.gapLookup) === JSON.stringify(repeated.gapLookup),
    staleCertificationFailsClosed: staleFailedClosed,
    terminalRouteIsBounded: ["promoted-capability", "refinery-handoff", "unresolved-gap"].includes(uncovered.gapLookup.terminalRoute),
    historicalCompilerCertified: compilerV3.status === "certified",
    historicalRouterCertified: routerV7.status === "certified",
  };
  const status = Object.values(gates).every(Boolean) ? "certified" : "failed";
  const artifactPaths = [
    "src/intent-compiler.mjs",
    "src/quarry-atlas.mjs",
    "skills/eternities-omnibus/SKILL.md",
    "skills/eternities-omnibus/references/operating-contract.md",
    "artifacts/wave2-semantic/cluster-coverage.json",
    "artifacts/wave2-semantic/synthesis-evidence.json",
  ];
  const artifacts = {};
  for (const relative of artifactPaths) {
    const bytes = await fs.readFile(path.join(root, relative));
    artifacts[relative] = { sha256: sha256(bytes), bytes: bytes.length };
  }
  const receipt = {
    schemaVersion: 1,
    id: "wave2-automatic-gap-routing-v1",
    status,
    automaticBoundedGapLookup: true,
    maximumCards: 5,
    sourceBodiesTransported: 0,
    authorityExpansion: false,
    staleCertificationFailsClosed: true,
    semanticAtlasDigest: atlas.certificate.digest,
    historicalReceipts: {
      intentCompilerV3: sha256(JSON.stringify(compilerV3)),
      routerV7: sha256(JSON.stringify(routerV7)),
    },
    artifacts,
    fixtures: {
      covered: covered.gapLookup,
      uncovered: uncovered.gapLookup,
    },
    gates,
    activation: {
      sourceExecutions: 0,
      thirdPartyActivations: 0,
      hostProfileChanges: 0,
      externalMutations: 0,
    },
    proofLimits: [
      "deterministic-local-fixtures-only",
      "no-arbitrary-live-model-routing-proof",
      "no-source-body-execution-or-transport",
    ],
  };
  if (status !== "certified") throw new Error(`Wave 2 gap routing did not certify: ${JSON.stringify(gates)}`);
  if (write) await writeJsonAtomic(path.join(root, "receipts/wave2-automatic-gap-routing-v1.json"), receipt);
  return receipt;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  console.log(JSON.stringify(await buildWave2GapRoutingReceipt(), null, 2));
}
