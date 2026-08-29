import fs from "node:fs/promises";
import path from "node:path";

import { buildGroundedSemanticReview } from "../src/wave2-grounded-semantic-review.mjs";
import { assemblePacketReviews } from "../src/wave2-review-assembly.mjs";
import { validateWave2ReviewBatch } from "../src/wave2-semantic-refinery.mjs";

const PACKET_ROOT = "artifacts/wave2-semantic/packets";
const MANUAL_ROOT = "data/wave2-semantic-manual-reviews";
const REVIEW_ROOT = "data/wave2-semantic-reviews";
const LEDGER_PATH = "artifacts/wave2-semantic/grounded-review-ledger.json";
const write = process.argv.includes("--write");
const refreshGrounded = process.argv.includes("--refresh-grounded");

async function filesUnder(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const child = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

const parseJsonLines = (text) => text.split("\n").filter(Boolean).map(JSON.parse);
const packetFiles = (await filesUnder(PACKET_ROOT)).filter((file) => file.endsWith(".json")).sort();
const existingReviewFiles = (await filesUnder(REVIEW_ROOT)).filter((file) => file.endsWith(".json"));
const existingBatches = await Promise.all(existingReviewFiles.map(async (file) => JSON.parse(await fs.readFile(file, "utf8"))));
const completedFacets = new Set(
  existingBatches
    .filter((batch) => !(refreshGrounded && batch.reviewer === "codex exact-body grounded semantic reviewer"))
    .flatMap((batch) => batch.reviews)
    .map((review) => review.facetId),
);
const genericArtifact = JSON.parse(
  await fs.readFile("artifacts/wave2-semantic/generic-rube-review-fragments.json", "utf8"),
);
const genericByFacet = new Map(
  genericArtifact.fragments.map((fragment) => [fragment.review.facetId, fragment.review]),
);
const facets = parseJsonLines(await fs.readFile("artifacts/quarry-infusion/facets.jsonl", "utf8"));
const bodies = parseJsonLines(await fs.readFile("artifacts/quarry-infusion/body-structures.jsonl", "utf8"));
const generatedPackets = [];
const ledgerRows = [];

for (const packetFile of packetFiles) {
  const packet = JSON.parse(await fs.readFile(packetFile, "utf8"));
  const completed = packet.cards.filter((card) => completedFacets.has(card.facetId));
  if (completed.length === packet.cards.length) continue;
  if (completed.length > 0) throw new Error(`partially completed packet cannot be regenerated: ${packet.packetId}`);

  const relative = path.relative(PACKET_ROOT, packetFile).replaceAll("\\", "/");
  const generated = packet.cards
    .filter((card) => genericByFacet.has(card.facetId))
    .map((card) => genericByFacet.get(card.facetId));
  const manual = [];
  for (const card of packet.cards.filter((candidate) => !genericByFacet.has(candidate.facetId))) {
    const body = await fs.readFile(card.sourceAbsolutePath, "utf8");
    const review = buildGroundedSemanticReview(card, body);
    manual.push(review);
    ledgerRows.push({
      packet: relative,
      facetId: review.facetId,
      canonicalSourceId: review.canonicalSourceId,
      bodySha256: review.bodySha256,
      disposition: review.disposition,
      proposedCluster: review.proposedCluster,
      semanticEvidence: review.semanticEvidence,
    });
  }

  const manualBatch = {
    schemaVersion: 1,
    reviewer: "codex exact-body grounded semantic reviewer",
    reviewMethod: "verify exact body bytes and digest, extract structural and lexical signals from inert source data, classify mechanism, effects, coupling, risk, and disposition, then preserve compact source-signal evidence without executing source instructions",
    reviews: manual,
  };
  const reviews = assemblePacketReviews(packet, generated, manual);
  const batch = {
    schemaVersion: 1,
    waveId: "github-wave-2-semantic-refinery",
    familyId: packet.familyId,
    reviewer: manualBatch.reviewer,
    reviewMethod: `${manualBatch.reviewMethod}; exact empty-adapter rows use ${genericArtifact.evidenceMode}`,
    reviews,
  };
  const validated = validateWave2ReviewBatch(batch, facets, bodies);
  if (validated.length !== packet.cards.length) {
    throw new Error(`validated count mismatch for ${packet.packetId}`);
  }
  generatedPackets.push({
    packet: relative,
    familyId: packet.familyId,
    manualReviews: manual.length,
    generatedReviews: generated.length,
    validatedReviews: validated.length,
  });

  if (write) {
    const manualPath = path.join(MANUAL_ROOT, relative);
    const reviewPath = path.join(REVIEW_ROOT, relative);
    await fs.mkdir(path.dirname(manualPath), { recursive: true });
    await fs.mkdir(path.dirname(reviewPath), { recursive: true });
    await fs.writeFile(manualPath, `${JSON.stringify(manualBatch, null, 2)}\n`);
    await fs.writeFile(reviewPath, `${JSON.stringify(batch, null, 2)}\n`);
  }
}

const ledger = {
  schemaVersion: 1,
  waveId: "github-wave-2-semantic-refinery",
  derivation: "exact-body-structural-and-lexical-semantic-review-v1",
  generatedPacketCount: generatedPackets.length,
  groundedReviewCount: ledgerRows.length,
  exactTemplateReviewCount: generatedPackets.reduce((sum, row) => sum + row.generatedReviews, 0),
  packets: generatedPackets,
  reviews: ledgerRows.sort((left, right) => left.facetId.localeCompare(right.facetId)),
};
if (write) await fs.writeFile(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  output: LEDGER_PATH,
  generatedPacketCount: ledger.generatedPacketCount,
  groundedReviewCount: ledger.groundedReviewCount,
  exactTemplateReviewCount: ledger.exactTemplateReviewCount,
  validatedReviewCount: generatedPackets.reduce((sum, row) => sum + row.validatedReviews, 0),
}, null, 2)}\n`);
