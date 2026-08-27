import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { sha256 } from "../src/io.mjs";
import { buildRoutingIndex } from "../src/routing-index.mjs";
import { validateRoutingCard } from "../src/routing-contracts.mjs";

function lexicalCompare(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(lexicalCompare)
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function canonicalJsonLine(value) {
  return JSON.stringify(stableValue(value));
}

async function writeTextAtomic(filePath, text) {
  const directory = path.dirname(filePath);
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function cardSources(skillsRoot) {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  entries.sort((left, right) => lexicalCompare(left.name, right.name));
  const rows = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const cardPath = path.join(skillsRoot, entry.name, "references", "routing-card.json");
    let stat;
    try {
      stat = await lstat(cardPath);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`routing card must be a regular file: ${cardPath}`);
    }
    const raw = await readFile(cardPath, "utf8");
    const card = validateRoutingCard(JSON.parse(raw));
    if (card.id !== entry.name) {
      throw new Error(`routing card id does not match skill directory: ${entry.name}`);
    }
    if (card.entrypoint !== `skills/${card.id}/SKILL.md`) {
      throw new Error(`routing card entrypoint does not match skill id: ${card.id}`);
    }
    rows.push({
      card,
      input: {
        id: card.id,
        path: path
          .relative(skillsRoot, cardPath)
          .replaceAll("\\", "/"),
        sha256: sha256(raw),
      },
    });
  }
  return rows;
}

export async function buildRoutingArtifacts({ skillsRoot, outputPath }) {
  const canonicalSkillsRoot = path.resolve(skillsRoot);
  const canonicalOutputPath = path.resolve(outputPath);
  const sources = await cardSources(canonicalSkillsRoot);
  const index = buildRoutingIndex(sources.map(({ card }) => card));
  const familyMap = {
    schemaVersion: 1,
    cardCount: index.cardCount,
    familyCount: index.familyMap.length,
    families: index.familyMap,
    capabilityIndex: index.capabilityIndex,
  };
  const familyMapText = canonicalJson(familyMap);
  const cardsText = `${sources
    .map(({ card }) => canonicalJsonLine(card))
    .join("\n")}${sources.length > 0 ? "\n" : ""}`;
  const summary = {
    cardCount: index.cardCount,
    familyCount: index.familyMap.length,
    cardsSha256: sha256(cardsText),
    familyMapSha256: sha256(familyMapText),
  };
  const manifest = {
    schemaVersion: 1,
    cardCount: summary.cardCount,
    familyCount: summary.familyCount,
    inputs: sources.map(({ input }) => input),
    outputs: {
      cardsSha256: summary.cardsSha256,
      familyMapSha256: summary.familyMapSha256,
    },
  };
  await Promise.all([
    writeTextAtomic(path.join(canonicalOutputPath, "family-map.json"), familyMapText),
    writeTextAtomic(path.join(canonicalOutputPath, "cards.jsonl"), cardsText),
    writeTextAtomic(
      path.join(canonicalOutputPath, "manifest.json"),
      canonicalJson(manifest),
    ),
  ]);
  return summary;
}

function parseArgs(argv) {
  const parsed = {
    skillsRoot: path.resolve("skills"),
    outputPath: path.resolve("artifacts", "routing"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--skills") parsed.skillsRoot = path.resolve(argv[++index]);
    else if (value === "--output") parsed.outputPath = path.resolve(argv[++index]);
    else throw new Error(`unknown argument: ${value}`);
  }
  return parsed;
}

async function main() {
  const summary = await buildRoutingArtifacts(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(summary, null, 2));
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) await main();
