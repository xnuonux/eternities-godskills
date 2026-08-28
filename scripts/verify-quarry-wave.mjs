import { execFileSync } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { readJson, sha256, writeJsonAtomic } from "../src/io.mjs";
import {
  buildExactFileManifest,
  compareExactFileManifests,
  groupExactDuplicates,
  repositoryDirectoryName,
  resolveQuarryChild,
} from "../src/quarry-wave.mjs";

function parseArgs(argv) {
  const args = {
    manifest: "data/github-skill-quarry-wave-2.json",
    sourceRoot: "C:\\dev\\.skill-quarry-stage",
    receipt: "receipts/github-skill-quarry-wave-2.json",
    records: "artifacts/github-wave-2/source-records.jsonl",
    duplicates: "artifacts/github-wave-2/duplicate-groups.json",
    fileManifests: "artifacts/github-wave-2/repository-file-manifests.jsonl",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--manifest") args.manifest = argv[++index];
    else if (value === "--source-root") args.sourceRoot = argv[++index];
    else if (value === "--destination-root") args.destinationRoot = argv[++index];
    else if (value === "--receipt") args.receipt = argv[++index];
    else if (value === "--records") args.records = argv[++index];
    else if (value === "--duplicates") args.duplicates = argv[++index];
    else if (value === "--file-manifests") args.fileManifests = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  return args;
}

function git(repository, ...args) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function canonicalIdentity(remote) {
  return remote
    .trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//i, "https://github.com/")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

async function writeJsonlAtomic(filePath, rows) {
  const resolved = path.resolve(filePath);
  const temporary = path.join(
    path.dirname(resolved),
    `.${path.basename(resolved)}.${process.pid}.${Date.now()}.tmp`,
  );
  await mkdir(path.dirname(resolved), { recursive: true });
  try {
    const body = rows.map((row) => JSON.stringify(row)).join("\n");
    await writeFile(temporary, `${body}${body ? "\n" : ""}`, "utf8");
    await rename(temporary, resolved);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function jsonlBody(rows) {
  const body = rows.map((row) => JSON.stringify(row)).join("\n");
  return `${body}${body ? "\n" : ""}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await readJson(path.resolve(args.manifest));
  const destinationRoot = path.resolve(
    args.destinationRoot
      ?? path.win32.join(manifest.warehouseRoot, manifest.lane),
  );
  const sourceRoot = path.resolve(args.sourceRoot);
  const rows = [];
  const sourceRecords = [];
  const repositoryFileRows = [];

  for (const entry of manifest.entries) {
    const directoryName = repositoryDirectoryName(entry.fullName);
    const source = resolveQuarryChild(sourceRoot, directoryName);
    const destination = resolveQuarryChild(destinationRoot, directoryName);
    const sourceRemote = git(source, "remote", "get-url", "origin");
    const destinationRemote = git(destination, "remote", "get-url", "origin");
    const expectedIdentity = `https://github.com/${entry.fullName}`.toLowerCase();
    const sourceHead = git(source, "rev-parse", "HEAD");
    const destinationHead = git(destination, "rev-parse", "HEAD");
    const sourceStatus = git(source, "status", "--porcelain=v1");
    const destinationStatus = git(destination, "status", "--porcelain=v1");
    const sourceManifest = await buildExactFileManifest(source);
    const destinationManifest = await buildExactFileManifest(destination);
    const comparison = compareExactFileManifests(sourceManifest, destinationManifest);
    const licenseFiles = sourceManifest
      .map((row) => row.path)
      .filter((filePath) => !filePath.includes("/") && /^(license|licence|copying|notice)/i.test(filePath));
    const skillRows = sourceManifest.filter((row) => /(^|\/)skill\.md$/i.test(row.path));

    const verified = canonicalIdentity(sourceRemote) === expectedIdentity
      && canonicalIdentity(destinationRemote) === expectedIdentity
      && sourceHead === destinationHead
      && sourceStatus === ""
      && destinationStatus === ""
      && comparison.equal;

    for (const fileRow of sourceManifest) {
      repositoryFileRows.push({
        repository: entry.fullName,
        head: sourceHead,
        ...fileRow,
      });
    }

    rows.push({
      fullName: entry.fullName,
      source,
      destination,
      expectedIdentity,
      sourceRemote,
      destinationRemote,
      head: sourceHead,
      branch: git(destination, "branch", "--show-current"),
      licenseSignal: entry.license,
      licenseFiles,
      exactFiles: sourceManifest.length,
      exactBytes: sourceManifest.reduce((sum, row) => sum + row.bytes, 0),
      skillFiles: skillRows.length,
      manifestComparison: comparison,
      verified,
    });

    for (const skillRow of skillRows) {
      sourceRecords.push({
        schemaVersion: 1,
        id: `${entry.fullName}@${sourceHead}:${skillRow.path}`,
        repository: entry.fullName,
        head: sourceHead,
        sourcePath: skillRow.path,
        sourceAbsolutePath: path.join(destination, ...skillRow.path.split("/")),
        bodyBytes: skillRow.bytes,
        bodySha256: skillRow.sha256,
        licenseSignal: entry.license,
        disposition: entry.disposition,
        inert: true,
      });
    }
  }

  sourceRecords.sort((left, right) => left.id.localeCompare(right.id));
  repositoryFileRows.sort((left, right) =>
    left.repository.localeCompare(right.repository) || left.path.localeCompare(right.path));
  const duplicateGroups = groupExactDuplicates(sourceRecords);
  const repositoryFileManifestBody = jsonlBody(repositoryFileRows);
  const receipt = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    manifestSha256: sha256(await import("node:fs/promises").then(({ readFile }) => readFile(path.resolve(args.manifest)))),
    sourceRoot,
    destinationRoot,
    repositoryFileManifests: {
      path: args.fileManifests.split(path.sep).join("/"),
      sha256: sha256(repositoryFileManifestBody),
      rows: repositoryFileRows.length,
    },
    complete: rows.every((row) => row.verified),
    rows,
    summary: {
      repositories: rows.length,
      verifiedRepositories: rows.filter((row) => row.verified).length,
      exactFiles: rows.reduce((sum, row) => sum + row.exactFiles, 0),
      exactBytes: rows.reduce((sum, row) => sum + row.exactBytes, 0),
      skillBodies: sourceRecords.length,
      exactDuplicateGroups: duplicateGroups.length,
    },
  };

  await writeJsonAtomic(path.resolve(args.receipt), receipt);
  await writeJsonlAtomic(path.resolve(args.records), sourceRecords);
  await writeJsonlAtomic(path.resolve(args.fileManifests), repositoryFileRows);
  await writeJsonAtomic(path.resolve(args.duplicates), {
    schemaVersion: 1,
    generatedAt: receipt.generatedAt,
    groups: duplicateGroups,
  });
  console.log(JSON.stringify(receipt.summary, null, 2));
  if (!receipt.complete) process.exitCode = 1;
}

await main();
