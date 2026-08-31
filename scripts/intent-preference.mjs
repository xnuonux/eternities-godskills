import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, writeJsonAtomic } from "../src/io.mjs";
import { compileAndRoute } from "../src/specialist-preference-runtime.mjs";

function parseCards(text) {
  const trimmed = text.trim();
  if (trimmed === "") return [];
  return trimmed.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`invalid routing card JSONL at line ${index + 1}: ${error.message}`);
    }
  });
}

export async function compilePreferenceRequestFile({
  requestPath,
  cardsPath,
  outputPath = null,
}) {
  const [request, cardsText] = await Promise.all([
    readJson(path.resolve(requestPath)),
    readFile(path.resolve(cardsPath), "utf8"),
  ]);
  const result = compileAndRoute({ request, cards: parseCards(cardsText) });
  if (outputPath !== null) await writeJsonAtomic(path.resolve(outputPath), result);
  return result;
}

function requiredValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a path`);
  return value;
}

export function parseArgs(argv) {
  const parsed = {
    requestPath: null,
    cardsPath: path.resolve("artifacts", "routing", "cards.jsonl"),
    outputPath: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--request") {
      parsed.requestPath = path.resolve(requiredValue(argv, index, value));
      index += 1;
    } else if (value === "--cards") {
      parsed.cardsPath = path.resolve(requiredValue(argv, index, value));
      index += 1;
    } else if (value === "--output") {
      parsed.outputPath = path.resolve(requiredValue(argv, index, value));
      index += 1;
    } else {
      throw new Error(`unknown argument: ${value}`);
    }
  }
  if (parsed.requestPath === null) throw new Error("--request is required");
  return parsed;
}

async function main() {
  const result = await compilePreferenceRequestFile(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
