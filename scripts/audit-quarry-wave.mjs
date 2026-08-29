import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, sha256, writeJsonAtomic } from "../src/io.mjs";
import {
  groupRepositoryFileManifests,
  repositoryDirectoryName,
  resolveQuarryChild,
} from "../src/quarry-wave.mjs";

const auditCache = new Map();

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

export async function auditQuarryWave({ root = path.resolve(".") } = {}) {
  const cacheKey = path.resolve(root);
  if (auditCache.has(cacheKey)) return auditCache.get(cacheKey);
  const receiptPath = path.join(root, "receipts/github-skill-quarry-wave-2.json");
  const receipt = await readJson(receiptPath);
  const manifestBytes = await readFile(path.join(root, "data/github-skill-quarry-wave-2.json"));
  if (sha256(manifestBytes) !== receipt.manifestSha256) throw new Error("quarry manifest digest drift");

  const frozenPath = path.join(root, receipt.repositoryFileManifests.path);
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
    const frozenManifestExact = expectedFiles.length === row.exactFiles &&
      expectedFiles.reduce((sum, file) => sum + file.bytes, 0) === row.exactBytes;
    const expectedIdentity = `https://github.com/${repository}`.toLowerCase();
    const remote = git(destination, "remote", "get-url", "origin");
    const head = git(destination, "rev-parse", "HEAD");
    results.push({
      repository,
      verified: canonicalIdentity(remote) === expectedIdentity
        && head === row.head
        && row.verified === true
        && row.manifestComparison.equal === true
        && frozenManifestExact,
    });
  }

  if (results.length !== receipt.rows.length) throw new Error("repository count drift");
  const summary = {
    repositories: results.length,
    verifiedRepositories: results.filter((result) => result.verified).length,
    exactFiles: frozenRows.length,
    exactBytes: frozenRows.reduce((sum, row) => sum + row.bytes, 0),
  };
  const result = {
    status: summary.verifiedRepositories === summary.repositories ? "verified" : "failed",
    verificationMethod: "exact-frozen-sha256-manifest-and-receipt-reconciled-to-current-repository-identity-and-head",
    proofLimit: "Repository identity and HEAD are rechecked live. Exact file counts, bytes, and SHA-256 values are reconciled from the immutable frozen manifest and acquisition receipt. Current destination worktree cleanliness and byte equality are not re-proven by this HDD-conscious audit.",
    summary,
    receiptSha256: sha256(await readFile(receiptPath)),
    manifestSha256: sha256(manifestBytes),
    repositoryFileManifestsSha256: sha256(frozenBytes),
  };
  auditCache.set(cacheKey, result);
  return result;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invoked) {
  const result = await auditQuarryWave({ root: path.resolve(".") });
  await writeJsonAtomic(path.resolve("receipts/github-skill-quarry-wave-2-audit.json"), result);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "verified") process.exitCode = 1;
}
