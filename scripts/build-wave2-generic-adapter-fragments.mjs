import fs from "node:fs/promises";
import path from "node:path";

import {
  APPROVED_EMPTY_RUBE_TEMPLATE_DIGESTS,
  buildGenericRubeAdapterReview,
  inspectGenericRubeAdapterBody,
} from "../src/wave2-generic-adapter-review.mjs";
import { validateWave2ReviewBatch } from "../src/wave2-semantic-refinery.mjs";

const PACKET_ROOT = "artifacts/wave2-semantic/packets";
const OUTPUT = "artifacts/wave2-semantic/generic-rube-review-fragments.json";

async function filesUnder(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const child = path.join(root, entry.name);
      return entry.isDirectory() ? filesUnder(child) : [child];
    }),
  );
  return nested.flat();
}

async function mapConcurrent(values, concurrency, mapper) {
  const output = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return output;
}

const packets = await Promise.all(
  (await filesUnder(PACKET_ROOT))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map(async (file) => ({
      file,
      relative: path.relative(PACKET_ROOT, file).replaceAll("\\", "/"),
      packet: JSON.parse(await fs.readFile(file, "utf8")),
    })),
);
const candidates = packets.flatMap(({ relative, packet }) =>
  packet.cards
    .filter((card) => card.canonicalSourceId.startsWith("ComposioHQ/awesome-claude-skills@"))
    .map((card) => ({ relative, card })),
);

const inspected = await mapConcurrent(candidates, 32, async ({ relative, card }) => {
  const body = await fs.readFile(card.sourceAbsolutePath, "utf8");
  try {
    const evidence = inspectGenericRubeAdapterBody(card, body);
    return {
      packet: relative,
      templateDigest: evidence.templateDigest,
      review: buildGenericRubeAdapterReview(card, body),
    };
  } catch {
    return null;
  }
});
const fragments = inspected
  .filter(Boolean)
  .sort((left, right) => left.review.facetId.localeCompare(right.review.facetId));
const parseJsonLines = (text) => text.split("\n").filter(Boolean).map(JSON.parse);
const facets = parseJsonLines(await fs.readFile("artifacts/quarry-infusion/facets.jsonl", "utf8"));
const bodyEvidence = parseJsonLines(
  await fs.readFile("artifacts/quarry-infusion/body-structures.jsonl", "utf8"),
);
for (const packetName of new Set(fragments.map((row) => row.packet))) {
  const packetFragments = fragments.filter((row) => row.packet === packetName);
  const familyId = packetName.split("/")[0];
  validateWave2ReviewBatch(
    {
      schemaVersion: 1,
      waveId: "github-wave-2-semantic-refinery",
      familyId,
      reviewer: "codex exact-template semantic adjudicator",
      reviewMethod:
        "exact body digest and byte verification followed by fail-closed comparison with the approved empty Rube adapter template; provider-specific execution remains rejected",
      reviews: packetFragments.map((row) => row.review),
    },
    facets,
    bodyEvidence,
  );
}
const artifact = {
  schemaVersion: 1,
  evidenceMode: "exact-body-approved-empty-template",
  approvedTemplateDigests: [...APPROVED_EMPTY_RUBE_TEMPLATE_DIGESTS],
  fragmentCount: fragments.length,
  fragments,
};

if (process.argv.includes("--write")) {
  await fs.writeFile(OUTPUT, `${JSON.stringify(artifact, null, 2)}\n`);
}
process.stdout.write(
  `${JSON.stringify({ output: OUTPUT, fragmentCount: fragments.length, packetCount: new Set(fragments.map((row) => row.packet)).size }, null, 2)}\n`,
);
