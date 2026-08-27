import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const excluded = new Set(process.argv.slice(3));
const stringArrayFields = [
  "provides", "requires", "negativeIntents", "effects", "authorityRequirements",
  "preconditions", "compatibleWith", "conflictsWith", "legacyAliases",
];
const skillNames = (await readdir(path.join(root, "skills"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !excluded.has(entry.name))
  .map((entry) => entry.name)
  .sort();

let count = 0;
for (const skillName of skillNames) {
  const cardPath = path.join(root, "skills", skillName, "references", "routing-card.json");
  let card;
  try {
    card = JSON.parse(await readFile(cardPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  for (const field of stringArrayFields) {
    if (Array.isArray(card[field])) card[field] = [...new Set(card[field])].sort();
  }
  for (const field of ["direct", "paraphrased", "contextual"]) {
    if (Array.isArray(card.intentExamples?.[field])) {
      card.intentExamples[field] = [...new Set(card.intentExamples[field])].sort();
    }
  }
  await writeFile(cardPath, `${JSON.stringify(card, null, 2)}\n`);
  count += 1;
}
console.log(`normalized ${count} routing cards`);
