import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { readJson, writeJsonAtomic } from "../src/io.mjs";
import { buildRoutingIndex, shortlistRoutingCards } from "../src/routing-index.mjs";
import { routeCapabilities } from "../src/router.mjs";

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

function reconcileFamilyMap(familyMap, index) {
  const expected = {
    schemaVersion: 1,
    cardCount: index.cardCount,
    familyCount: index.familyMap.length,
    families: index.familyMap,
    capabilityIndex: index.capabilityIndex,
  };
  if (!isDeepStrictEqual(familyMap, expected)) {
    throw new Error("family map does not reconcile with compact cards");
  }
}

export async function routeRequest({ requestPath, cardsPath, outputPath = null }) {
  const canonicalRequestPath = path.resolve(requestPath);
  const canonicalCardsPath = path.resolve(cardsPath);
  const familyMapPath = path.join(path.dirname(canonicalCardsPath), "family-map.json");
  const [request, cardsText, familyMap] = await Promise.all([
    readJson(canonicalRequestPath),
    readFile(canonicalCardsPath, "utf8"),
    readJson(familyMapPath),
  ]);
  const index = buildRoutingIndex(parseCards(cardsText));
  reconcileFamilyMap(familyMap, index);
  const cards = shortlistRoutingCards(index, request, { limit: 32 });
  const receipt = routeCapabilities({ envelope: request, cards });
  if (outputPath !== null) await writeJsonAtomic(path.resolve(outputPath), receipt);
  return receipt;
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
  const receipt = await routeRequest(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(receipt, null, 2));
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) await main();
