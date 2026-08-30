import { execFileSync } from "node:child_process";
import path from "node:path";

import { sha256 } from "./io.mjs";
import {
  buildExactFileManifest,
  groupExactDuplicates,
  repositoryDirectoryName,
  resolveQuarryChild,
} from "./quarry-wave.mjs";

function git(repository, ...args) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function canonicalRemote(value) {
  return value.trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//i, "https://github.com/")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError("wave manifest must be an object");
  }
  if (manifest.schemaVersion !== 1) throw new Error("wave manifest schemaVersion must be 1");
  if (!Number.isInteger(manifest.expectedSkillBodies) || manifest.expectedSkillBodies < 0) {
    throw new Error("wave manifest expectedSkillBodies must be a non-negative integer");
  }
  if (manifest.policy?.executeThirdPartyCode !== false || manifest.policy?.activateSkills !== false) {
    throw new Error("wave manifest must keep third-party execution and activation disabled");
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error("wave manifest entries must not be empty");
  }
  const names = new Set();
  for (const entry of manifest.entries) {
    repositoryDirectoryName(entry?.fullName);
    if (names.has(entry.fullName)) throw new Error(`duplicate repository: ${entry.fullName}`);
    names.add(entry.fullName);
    if (!/^[a-f0-9]{40}$/.test(entry.head ?? "")) {
      throw new Error(`invalid expected head: ${entry.fullName}`);
    }
    if (typeof entry.license !== "string" || entry.license.trim() === "") {
      throw new Error(`missing license signal: ${entry.fullName}`);
    }
    if (!['acquire', 'acquire-pattern-only', 'adjacent-pattern-only'].includes(entry.disposition)) {
      throw new Error(`invalid disposition: ${entry.fullName}`);
    }
  }
  return manifest;
}

function fileManifestBody(rows) {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}${rows.length ? "\n" : ""}`;
}

async function inspectRepository(entry, repositoryRoot) {
  const directoryName = repositoryDirectoryName(entry.fullName);
  const repository = resolveQuarryChild(repositoryRoot, directoryName);
  const expectedRemote = `https://github.com/${entry.fullName}`.toLowerCase();
  const actualRemote = canonicalRemote(git(repository, "remote", "get-url", "origin"));
  if (actualRemote !== expectedRemote) throw new Error(`remote mismatch: ${entry.fullName}`);
  const actualHead = git(repository, "rev-parse", "HEAD");
  if (actualHead !== entry.head) throw new Error(`head mismatch: ${entry.fullName}`);
  if (git(repository, "status", "--porcelain=v1") !== "") {
    throw new Error(`dirty repository: ${entry.fullName}`);
  }

  let fileManifest;
  try {
    fileManifest = await buildExactFileManifest(repository);
  } catch (error) {
    throw new Error(`file manifest failed: ${entry.fullName}: ${error.message}`, { cause: error });
  }
  const licenseFiles = fileManifest
    .map(({ path: filePath }) => filePath)
    .filter((filePath) => !filePath.includes("/") && /^(license|licence|copying|notice)/i.test(filePath));
  const skillRows = fileManifest.filter(({ path: filePath, type }) =>
    type === "file" && /(^|\/)skill\.md$/i.test(filePath));
  return {
    row: {
      fullName: entry.fullName,
      repository,
      expectedRemote,
      actualRemote,
      head: actualHead,
      branch: git(repository, "branch", "--show-current"),
      licenseSignal: entry.license,
      licenseFiles,
      disposition: entry.disposition,
      exactFiles: fileManifest.length,
      exactBytes: fileManifest.reduce((sum, file) => sum + file.bytes, 0),
      skillFiles: skillRows.length,
      fileManifestSha256: sha256(fileManifestBody(fileManifest)),
      verified: true,
    },
    sourceRecords: skillRows.map((file) => ({
      schemaVersion: 1,
      id: `${entry.fullName}@${actualHead}:${file.path}`,
      repository: entry.fullName,
      head: actualHead,
      sourcePath: file.path,
      sourceAbsolutePath: path.join(repository, ...file.path.split("/")),
      bodyBytes: file.bytes,
      bodySha256: file.sha256,
      licenseSignal: entry.license,
      disposition: entry.disposition,
      inert: true,
    })),
    repositoryFiles: fileManifest.map((file) => ({
      repository: entry.fullName,
      head: actualHead,
      ...file,
    })),
  };
}

export async function buildQuarrySnapshot({ manifest, repositoryRoot }) {
  validateManifest(manifest);
  const root = path.resolve(repositoryRoot ?? manifest.warehouseRoot);
  const inspected = [];
  for (const entry of manifest.entries) inspected.push(await inspectRepository(entry, root));

  const rows = inspected.map(({ row }) => row)
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
  const sourceRecords = inspected.flatMap(({ sourceRecords }) => sourceRecords)
    .sort((left, right) => left.id.localeCompare(right.id));
  const repositoryFileRows = inspected.flatMap(({ repositoryFiles }) => repositoryFiles)
    .sort((left, right) => left.repository.localeCompare(right.repository) || left.path.localeCompare(right.path));
  if (sourceRecords.length !== manifest.expectedSkillBodies) {
    throw new Error(`skill body count mismatch: expected ${manifest.expectedSkillBodies}, received ${sourceRecords.length}`);
  }
  const duplicateGroups = groupExactDuplicates(sourceRecords);
  return {
    rows,
    sourceRecords,
    repositoryFileRows,
    duplicateGroups,
    summary: {
      repositories: rows.length,
      verifiedRepositories: rows.filter(({ verified }) => verified).length,
      exactFiles: rows.reduce((sum, row) => sum + row.exactFiles, 0),
      exactBytes: rows.reduce((sum, row) => sum + row.exactBytes, 0),
      skillBodies: sourceRecords.length,
      exactDuplicateGroups: duplicateGroups.length,
    },
  };
}
