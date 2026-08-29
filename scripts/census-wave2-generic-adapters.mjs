import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { normalizeRubeAdapterTemplate } from "../src/wave2-generic-adapter-review.mjs";

const ROOT =
  "D:/03-ARSENAL/warehouse/hunt/agent-skills-universal-wave-2-2026-08-28/ComposioHQ__awesome-claude-skills";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

async function main() {
  const facets = (await fs.readFile("artifacts/quarry-infusion/facets.jsonl", "utf8"))
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse)
    .filter((facet) => facet.canonicalSourceId.startsWith("ComposioHQ/"));

  const rows = await mapConcurrent(facets, 32, async (facet) => {
    const sourcePath = path.join(ROOT, facet.sourcePath);
    const body = await fs.readFile(sourcePath, "utf8");
    const normalized = normalizeRubeAdapterTemplate(body, facet.name);
    return {
      facetId: facet.id,
      name: facet.name,
      sourcePath: facet.sourcePath,
      templateDigest: sha256(normalized),
      normalizedBytes: Buffer.byteLength(normalized),
    };
  });

  const groups = new Map();
  for (const row of rows) {
    const group = groups.get(row.templateDigest) || {
      templateDigest: row.templateDigest,
      count: 0,
      normalizedBytes: row.normalizedBytes,
      examples: [],
    };
    group.count += 1;
    if (group.examples.length < 8) group.examples.push(row.name);
    groups.set(row.templateDigest, group);
  }

  const report = {
    schemaVersion: 1,
    sourceCount: rows.length,
    templateCount: groups.size,
    groups: [...groups.values()].sort(
      (left, right) => right.count - left.count || left.templateDigest.localeCompare(right.templateDigest),
    ),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await main();
