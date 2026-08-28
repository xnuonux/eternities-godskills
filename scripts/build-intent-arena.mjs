import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, writeJsonAtomic } from "../src/io.mjs";

export async function buildIntentArena({
  sourcePath = path.resolve("data", "intent-arena-source.v1.json"),
  outputPath = path.resolve("data", "intent-arena.v1.json"),
} = {}) {
  const source = await readJson(sourcePath);
  if (source.schemaVersion !== 1) throw new Error("intent arena source schemaVersion must be 1");
  const cases = [];
  for (const group of source.positiveGroups) {
    for (const [index, text] of group.missions.entries()) {
      cases.push({
        id: `positive-${group.id}-${String(index + 1).padStart(2, "0")}`,
        kind: "positive",
        text,
        context: "broad-local",
        expectedStatus: "selected",
        allowedIds: [group.id],
        forbiddenIds: [],
        requiredDecisionPrefixes: [],
      });
    }
  }
  for (const entry of source.adversarialCases) {
    cases.push({
      id: entry.id,
      kind: entry.kind,
      text: entry.text,
      context: entry.kind === "ambiguous" ? "broad-local" : "restricted-local",
      expectedStatus: "needs-decision",
      allowedIds: [],
      forbiddenIds: [],
      requiredDecisionPrefixes: [...entry.requiredDecisionPrefixes].sort(),
    });
  }
  for (const [index, text] of source.unknownMissions.entries()) {
    cases.push({
      id: `unknown-${String(index + 1).padStart(2, "0")}`,
      kind: "ambiguous",
      text,
      context: "restricted-local",
      expectedStatus: "needs-decision",
      allowedIds: [],
      forbiddenIds: [],
      requiredDecisionPrefixes: ["intent-not-understood"],
    });
  }
  const arena = {
    schemaVersion: 1,
    contexts: source.contexts,
    cases: cases.sort((left, right) => left.id.localeCompare(right.id)),
  };
  await writeJsonAtomic(outputPath, arena);
  return arena;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const arena = await buildIntentArena();
  console.log(JSON.stringify({ caseCount: arena.cases.length }, null, 2));
}
