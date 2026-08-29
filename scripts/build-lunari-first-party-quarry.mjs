import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { lstat, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildFirstPartyEvidence, classifyArchivePath } from "../src/first-party-quarry.mjs";
import { canonicalText, sha256 } from "../src/io.mjs";

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 128 * 1024 * 1024;

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--source") options.sourceRoot = argv[++index];
    else if (value === "--output") options.outputRoot = argv[++index];
    else if (value === "--existing-root") options.existingRoot = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  if (!options.sourceRoot || !options.outputRoot || !options.existingRoot) {
    throw new Error("--source, --output, and --existing-root are required");
  }
  return options;
}

async function runGit(sourceRoot, args, { encoding = "utf8", timeout = 30_000 } = {}) {
  const safeRoot = path.resolve(sourceRoot).replaceAll("\\", "/");
  const { stdout } = await execFileAsync(
    "git",
    ["-c", `safe.directory=${safeRoot}`, ...args],
    { cwd: sourceRoot, encoding, maxBuffer: MAX_BUFFER, windowsHide: true, timeout },
  );
  return stdout;
}

function splitNull(value) {
  return String(value).split("\0").filter(Boolean);
}

function parseHeadTree(value) {
  const records = new Map();
  for (const entry of splitNull(value)) {
    const tab = entry.indexOf("\t");
    if (tab === -1) continue;
    const metadata = entry.slice(0, tab).trim().split(/\s+/);
    const relativePath = entry.slice(tab + 1).replaceAll("\\", "/");
    if (metadata[1] !== "blob") continue;
    records.set(relativePath, {
      mode: metadata[0],
      objectId: metadata[2],
      byteSize: metadata[3] === "-" ? null : Number(metadata[3]),
    });
  }
  return records;
}

async function presentFileRows(sourceRoot, paths, excludedRoot) {
  const rows = new Map();
  const ordered = [...paths].sort((left, right) => left.localeCompare(right));
  for (let offset = 0; offset < ordered.length; offset += 128) {
    const batch = ordered.slice(offset, offset + 128);
    const results = await Promise.all(batch.map(async (relativePath) => {
      const absolutePath = path.resolve(sourceRoot, relativePath);
      if (excludedRoot && (absolutePath === excludedRoot || absolutePath.startsWith(`${excludedRoot}${path.sep}`))) {
        return null;
      }
      try {
        const metadata = await lstat(absolutePath);
        if (metadata.isSymbolicLink()) {
          return { relativePath, absolutePath, byteSize: metadata.size, forceExcludeReason: "symbolic-link" };
        }
        if (!metadata.isFile()) return null;
        return { relativePath, absolutePath, byteSize: metadata.size, forceExcludeReason: null };
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    }));
    for (const row of results) if (row) rows.set(row.relativePath, row);
  }
  return rows;
}

async function inventorySource(sourceRoot, outputRoot, onProgress) {
  onProgress({ phase: "git-inventory", completed: 0, total: 1 });
  const [head, treeText, untrackedText, modifiedText, deletedText] = await Promise.all([
    runGit(sourceRoot, ["rev-parse", "HEAD"]),
    runGit(sourceRoot, ["ls-tree", "-r", "-l", "-z", "--full-tree", "HEAD"]),
    runGit(sourceRoot, ["ls-files", "-o", "--exclude-standard", "-z"]),
    runGit(sourceRoot, ["ls-files", "-m", "-z"]),
    runGit(sourceRoot, ["ls-files", "-d", "-z"]),
  ]);
  const headTree = parseHeadTree(treeText);
  const untracked = new Set(splitNull(untrackedText).map((value) => value.replaceAll("\\", "/")));
  const modified = new Set(splitNull(modifiedText).map((value) => value.replaceAll("\\", "/")));
  const deleted = new Set(splitNull(deletedText).map((value) => value.replaceAll("\\", "/")));
  const mutablePaths = new Set([...untracked, ...modified].filter((value) => !deleted.has(value)));
  const absoluteOutput = path.resolve(outputRoot);
  const outputInsideSource = path.relative(path.resolve(sourceRoot), absoluteOutput);
  const excludedRoot = outputInsideSource === "" || (!outputInsideSource.startsWith("..") && !path.isAbsolute(outputInsideSource))
    ? absoluteOutput
    : null;
  const present = await presentFileRows(sourceRoot, mutablePaths, excludedRoot);
  onProgress({ phase: "git-inventory", completed: 1, total: 1 });
  const union = [...new Set([...headTree.keys(), ...present.keys()])].sort((left, right) => left.localeCompare(right));

  const records = union.map((relativePath) => {
    const headRow = headTree.get(relativePath);
    const workingRow = present.get(relativePath);
    const state = headRow && deleted.has(relativePath)
      ? "head-only"
      : !headRow && workingRow
        ? "working-only"
        : headRow && modified.has(relativePath)
          ? "modified"
          : "both";
    const headSymlink = headRow?.mode === "120000";
    const forceExcludeReason = workingRow?.forceExcludeReason ?? (headSymlink ? "symbolic-link" : null);
    const classification = forceExcludeReason
      ? { inspectContent: false }
      : classifyArchivePath(relativePath);
    const workingPath = workingRow?.absolutePath ?? (state === "both" ? path.resolve(sourceRoot, relativePath) : null);
    return {
      relativePath,
      state,
      byteSize: workingRow?.byteSize ?? headRow?.byteSize ?? null,
      headObjectId: headRow?.objectId ?? null,
      forceExcludeReason,
      defaultReadSource: state === "head-only" ? "head" : "working",
      read: async () => {
        if (!classification.inspectContent) throw new Error(`inert source read attempted: ${relativePath}`);
        if (workingPath) {
          try {
            const bytes = await readFile(workingPath, { signal: AbortSignal.timeout(15_000) });
            return { bytes, readSource: "working" };
          } catch (error) {
            if (!headRow) throw error;
            const bytes = await runGit(sourceRoot, ["cat-file", "blob", headRow.objectId], { encoding: "buffer", timeout: 15_000 });
            return { bytes: Buffer.from(bytes), readSource: "head-fallback" };
          }
        }
        const bytes = await runGit(sourceRoot, ["cat-file", "blob", headRow.objectId], { encoding: "buffer", timeout: 15_000 });
        return { bytes: Buffer.from(bytes), readSource: "head" };
      },
    };
  });
  return { gitHead: head.trim(), records };
}

async function walkFiles(root) {
  const rows = [];
  async function visit(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) rows.push(target);
    }
  }
  await visit(root);
  return rows;
}

async function loadExistingEvidence(existingRoot) {
  const corpusDigests = new Set();
  const canonicalPath = path.join(existingRoot, "artifacts", "quarry-infusion", "canonical-sources.jsonl");
  try {
    const lines = canonicalText(await readFile(canonicalPath, "utf8")).split("\n").filter(Boolean);
    for (const line of lines) {
      const row = JSON.parse(line);
      if (typeof row.bodySha256 === "string") corpusDigests.add(row.bodySha256);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const godskillDigestPaths = new Map();
  const skillsRoot = path.join(existingRoot, "skills");
  for (const filePath of await walkFiles(skillsRoot)) {
    const bytes = await readFile(filePath);
    const digest = sha256(bytes);
    const values = godskillDigestPaths.get(digest) ?? [];
    values.push(path.relative(existingRoot, filePath).replaceAll("\\", "/"));
    godskillDigestPaths.set(digest, values);
  }
  return { corpusDigests, godskillDigestPaths };
}

function jsonLines(rows) {
  return rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
}

async function writeTextAtomic(filePath, text) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.tmp`);
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) counts[row[field]] = (counts[row[field]] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

export async function buildArchiveArtifacts({ sourceRoot, outputRoot, existingRoot, onProgress = () => {} }) {
  const resolvedSource = path.resolve(sourceRoot);
  const resolvedOutput = path.resolve(outputRoot);
  const { gitHead, records } = await inventorySource(resolvedSource, resolvedOutput, onProgress);
  const sourceIdentity = `lunari-claude-archive@${gitHead}+working-snapshot`;
  const existing = await loadExistingEvidence(path.resolve(existingRoot));
  const evidence = await buildFirstPartyEvidence(records, { sourceIdentity, ...existing, onProgress });

  const ledgerText = jsonLines(evidence.ledger);
  const cardsText = jsonLines(evidence.cards);
  const duplicatesText = `${JSON.stringify({ schemaVersion: 1, ...evidence.duplicates }, null, 2)}\n`;
  const ownerMapValue = { schemaVersion: 1, sourceIdentity, candidates: evidence.ownerMap };
  const ownerMapText = `${JSON.stringify(ownerMapValue, null, 2)}\n`;
  const coverage = {
    schemaVersion: 1,
    sourceIdentity,
    gitHead,
    pathCount: evidence.ledger.length,
    inspectedCount: evidence.ledger.filter((row) => row.contentInspected).length,
    candidateCount: evidence.cards.length,
    unresolvedCount: evidence.ledger.filter((row) => row.disposition === "unresolved").length,
    stateCounts: countBy(evidence.ledger, "state"),
    dispositionCounts: countBy(evidence.ledger, "disposition"),
    reasonCounts: countBy(evidence.ledger, "reason"),
    ownerCounts: countBy(evidence.ownerMap, "owner"),
    duplicateCounts: {
      internalGroups: evidence.duplicates.internal.length,
      corpusMatches: evidence.duplicates.corpusMatches.length,
      godskillMatches: evidence.duplicates.godskillMatches.length,
    },
    artifactDigests: {
      coverageLedgerSha256: sha256(ledgerText),
      candidateCardsSha256: sha256(cardsText),
      duplicateGroupsSha256: sha256(duplicatesText),
      ownerMapSha256: sha256(ownerMapText),
    },
  };
  const artifacts = new Map([
    ["coverage-ledger.jsonl", ledgerText],
    ["candidate-cards.jsonl", cardsText],
    ["duplicate-groups.json", duplicatesText],
    ["owner-map.json", ownerMapText],
    ["coverage.json", `${JSON.stringify(coverage, null, 2)}\n`],
  ]);
  for (const [name, text] of artifacts) await writeTextAtomic(path.join(resolvedOutput, name), text);
  return {
    coverage,
    artifactPaths: [...artifacts.keys()].sort().map((name) => path.join(resolvedOutput, name)),
  };
}

async function main() {
  let lastReported = -1;
  const result = await buildArchiveArtifacts({
    ...parseArgs(process.argv.slice(2)),
    onProgress(progress) {
      if (progress.phase === "git-inventory" || progress.completed === progress.total || progress.completed - lastReported >= 512) {
        process.stderr.write(`[lunari-quarry] ${progress.phase} ${progress.completed}/${progress.total}\n`);
        lastReported = progress.completed;
      }
    },
  });
  process.stdout.write(`${JSON.stringify(result.coverage, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
