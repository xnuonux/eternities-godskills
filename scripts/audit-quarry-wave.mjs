import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { readJson, sha256 } from "../src/io.mjs";
import {
  buildExactFileManifest,
  compareExactFileManifests,
  groupRepositoryFileManifests,
  repositoryDirectoryName,
  resolveQuarryChild,
} from "../src/quarry-wave.mjs";

function git(repository, ...args) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function canonicalIdentity(remote) {
  return remote.trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//i, "https://github.com/")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

async function main() {
  const receiptPath = path.resolve("receipts/github-skill-quarry-wave-2.json");
  const receipt = await readJson(receiptPath);
  const manifestBytes = await readFile(path.resolve("data/github-skill-quarry-wave-2.json"));
  if (sha256(manifestBytes) !== receipt.manifestSha256) throw new Error("quarry manifest digest drift");

  const frozenPath = path.resolve(receipt.repositoryFileManifests.path);
  const frozenBytes = await readFile(frozenPath);
  if (sha256(frozenBytes) !== receipt.repositoryFileManifests.sha256) {
    throw new Error("repository file manifest digest drift");
  }
  const frozenRows = frozenBytes.toString("utf8").trim().split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  if (frozenRows.length !== receipt.repositoryFileManifests.rows) {
    throw new Error("repository file manifest row-count drift");
  }
  const frozenByRepository = groupRepositoryFileManifests(frozenRows);
  const receiptByRepository = new Map(receipt.rows.map((row) => [row.fullName, row]));
  const results = [];

  for (const [repository, expectedFiles] of frozenByRepository) {
    const row = receiptByRepository.get(repository);
    if (!row) throw new Error(`missing receipt row: ${repository}`);
    if (expectedFiles.some((file) => file.head !== row.head)) {
      throw new Error(`frozen head drift: ${repository}`);
    }
    const directoryName = repositoryDirectoryName(repository);
    const destination = resolveQuarryChild(receipt.destinationRoot, directoryName);
    const actualFiles = await buildExactFileManifest(destination);
    const comparison = compareExactFileManifests(expectedFiles, actualFiles);
    const expectedIdentity = `https://github.com/${repository}`.toLowerCase();
    const remote = git(destination, "remote", "get-url", "origin");
    const head = git(destination, "rev-parse", "HEAD");
    const clean = git(destination, "status", "--porcelain=v1") === "";
    results.push({
      repository,
      verified: canonicalIdentity(remote) === expectedIdentity
        && head === row.head
        && clean
        && comparison.equal,
    });
  }

  if (results.length !== receipt.rows.length) throw new Error("repository count drift");
  const summary = {
    repositories: results.length,
    verifiedRepositories: results.filter((result) => result.verified).length,
    exactFiles: frozenRows.length,
    exactBytes: frozenRows.reduce((sum, row) => sum + row.bytes, 0),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.verifiedRepositories !== summary.repositories) process.exitCode = 1;
}

await main();
