import fs from "node:fs/promises";
import path from "node:path";

import { assemblePacketReviews } from "../src/wave2-review-assembly.mjs";
import { validateWave2ReviewBatch } from "../src/wave2-semantic-refinery.mjs";

const [familyId, rawSequence] = process.argv.slice(2).filter((value) => value !== "--write");
if (!familyId || !rawSequence) {
  throw new Error("usage: node scripts/assemble-wave2-review-packet.mjs <family> <sequence> [--write]");
}
const sequence = rawSequence.padStart(3, "0");
const relative = `${familyId}/${sequence}.json`;
const packet = JSON.parse(
  await fs.readFile(path.join("artifacts/wave2-semantic/packets", relative), "utf8"),
);
const manual = JSON.parse(
  await fs.readFile(path.join("data/wave2-semantic-manual-reviews", relative), "utf8"),
);
const generatedArtifact = JSON.parse(
  await fs.readFile("artifacts/wave2-semantic/generic-rube-review-fragments.json", "utf8"),
);
const generated = generatedArtifact.fragments
  .filter((fragment) => fragment.packet === relative)
  .map((fragment) => fragment.review);
const cardsById = new Map(packet.cards.map((card) => [card.facetId, card]));
const manualReviews = manual.reviews.map((review) => {
  const card = cardsById.get(review.facetId);
  if (!card) throw new Error(`manual review does not belong to packet: ${review.facetId}`);
  if (review.canonicalSourceId && review.canonicalSourceId !== card.canonicalSourceId) {
    throw new Error(`manual canonical source mismatch: ${review.facetId}`);
  }
  if (review.bodySha256 && review.bodySha256 !== card.bodySha256) {
    throw new Error(`manual body digest mismatch: ${review.facetId}`);
  }
  return {
    ...review,
    canonicalSourceId: card.canonicalSourceId,
    bodySha256: card.bodySha256,
  };
});
const reviews = assemblePacketReviews(packet, generated, manualReviews);
const batch = {
  schemaVersion: 1,
  waveId: "github-wave-2-semantic-refinery",
  familyId,
  reviewer: manual.reviewer,
  reviewMethod: `${manual.reviewMethod}; exact empty-adapter template rows were merged from ${generatedArtifact.evidenceMode}`,
  reviews,
};
const parseJsonLines = (text) => text.split("\n").filter(Boolean).map(JSON.parse);
const facets = parseJsonLines(await fs.readFile("artifacts/quarry-infusion/facets.jsonl", "utf8"));
const bodies = parseJsonLines(
  await fs.readFile("artifacts/quarry-infusion/body-structures.jsonl", "utf8"),
);
const validated = validateWave2ReviewBatch(batch, facets, bodies);
if (validated.length !== packet.cards.length) {
  throw new Error(`validated count mismatch: ${validated.length} !== ${packet.cards.length}`);
}
const output = path.join("data/wave2-semantic-reviews", relative);
if (process.argv.includes("--write")) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(batch, null, 2)}\n`);
}
process.stdout.write(
  `${JSON.stringify({ output, manualReviews: manual.reviews.length, generatedReviews: generated.length, validatedReviews: validated.length }, null, 2)}\n`,
);
