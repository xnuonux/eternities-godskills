import { readFile, readdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const reviewsRoot = path.resolve("reviews/waves");
const marketingRoot = path.join(reviewsRoot, "marketing-growth");
const priorIds = new Set();
const run = promisify(execFile);

function filterReviewArray(text) {
  const marker = text.indexOf('"reviews"');
  const arrayOpen = text.indexOf("[", marker);
  if (marker < 0 || arrayOpen < 0) throw new Error("review array not found");
  const spans = [];
  let objectStart = -1;
  let objectDepth = 0;
  let inString = false;
  let escaped = false;
  let arrayClose = -1;
  for (let index = arrayOpen + 1; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{") {
      if (objectDepth === 0) objectStart = index;
      objectDepth += 1;
    } else if (character === "}") {
      objectDepth -= 1;
      if (objectDepth === 0) spans.push([objectStart, index + 1]);
    } else if (character === "]" && objectDepth === 0) {
      arrayClose = index;
      break;
    }
  }
  if (spans.length === 0 || arrayClose < 0) throw new Error("review objects not found");
  const kept = spans
    .map(([start, end]) => text.slice(start, end))
    .filter((value) => !priorIds.has(JSON.parse(value).sourceId));
  const lead = text.slice(arrayOpen + 1, spans[0][0]);
  const separator = spans.length > 1
    ? text.slice(spans[0][1], spans[1][0])
    : ",\n    ";
  const tail = text.slice(spans.at(-1)[1], arrayClose);
  return {
    text: `${text.slice(0, arrayOpen + 1)}${lead}${kept.join(separator)}${tail}${text.slice(arrayClose)}`,
    removed: spans.length - kept.length,
  };
}

for (const family of (await readdir(reviewsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== "marketing-growth")
  .map((entry) => entry.name)
  .sort()) {
  const familyRoot = path.join(reviewsRoot, family);
  for (const file of (await readdir(familyRoot)).filter((name) => name.endsWith(".json")).sort()) {
    const batch = JSON.parse(await readFile(path.join(familyRoot, file), "utf8"));
    for (const review of batch.reviews) priorIds.add(review.sourceId);
  }
}

let removed = 0;
for (const file of (await readdir(marketingRoot)).filter((name) => name.endsWith(".json")).sort()) {
  const target = path.join(marketingRoot, file);
  const relative = `reviews/waves/marketing-growth/${file}`;
  const { stdout: baseText } = await run("git", ["show", `HEAD:${relative}`], { encoding: "utf8" });
  const result = filterReviewArray(baseText);
  removed += result.removed;
  if (result.removed > 0) await writeFile(target, result.text, "utf8");
}

console.log(JSON.stringify({ removedPriorCanonicalOverlaps: removed }, null, 2));
