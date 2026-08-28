import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson } from "../src/io.mjs";
import { evaluateIntentArena } from "../src/intent-arena.mjs";

export async function evaluateArenaFiles({
  arenaPath = path.resolve("data", "intent-arena.v1.json"),
  cardsPath = path.resolve("artifacts", "routing", "cards.jsonl"),
} = {}) {
  const [arena, cardsText] = await Promise.all([
    readJson(arenaPath),
    readFile(cardsPath, "utf8"),
  ]);
  const cards = cardsText.trim().split(/\r?\n/).map(JSON.parse);
  return evaluateIntentArena({ arena, cards });
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  console.log(JSON.stringify(await evaluateArenaFiles(), null, 2));
}
