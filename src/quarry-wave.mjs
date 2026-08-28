import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readdir, readlink } from "node:fs/promises";
import path from "node:path";

export function repositoryDirectoryName(fullName) {
  const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]+)$/.exec(fullName ?? "");
  if (!match || match[2] === "." || match[2] === "..") {
    throw new Error(`invalid GitHub repository identity: ${fullName}`);
  }
  return `${match[1]}__${match[2]}`;
}

export function resolveQuarryChild(root, directoryName) {
  const resolvedRoot = path.resolve(root);
  const child = path.resolve(resolvedRoot, directoryName);
  const relative = path.relative(resolvedRoot, child);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`path escapes quarry root: ${directoryName}`);
  }
  return child;
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function visit(root, directory, rows) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (entry.isDirectory()) {
      await visit(root, absolute, rows);
      continue;
    }
    const stats = await lstat(absolute);
    if (stats.isSymbolicLink()) {
      const target = await readlink(absolute);
      rows.push({
        path: relative,
        bytes: Buffer.byteLength(target),
        sha256: createHash("sha256").update(`symlink:${target}`).digest("hex"),
        type: "symlink",
      });
      continue;
    }
    if (!stats.isFile()) continue;
    rows.push({
      path: relative,
      bytes: stats.size,
      sha256: await hashFile(absolute),
      type: "file",
    });
  }
}

export async function buildExactFileManifest(root) {
  const rows = [];
  await visit(path.resolve(root), path.resolve(root), rows);
  return rows.sort((left, right) => left.path.localeCompare(right.path));
}

export function compareExactFileManifests(expected, actual) {
  const expectedByPath = new Map(expected.map((row) => [row.path, row]));
  const actualByPath = new Map(actual.map((row) => [row.path, row]));
  const missing = [...expectedByPath.keys()]
    .filter((filePath) => !actualByPath.has(filePath))
    .sort();
  const extra = [...actualByPath.keys()]
    .filter((filePath) => !expectedByPath.has(filePath))
    .sort();
  const changed = [...expectedByPath.keys()]
    .filter((filePath) => {
      const expectedRow = expectedByPath.get(filePath);
      const actualRow = actualByPath.get(filePath);
      return actualRow
        && (expectedRow.bytes !== actualRow.bytes
          || expectedRow.sha256 !== actualRow.sha256
          || expectedRow.type !== actualRow.type);
    })
    .sort();
  return {
    equal: missing.length === 0 && extra.length === 0 && changed.length === 0,
    missing,
    extra,
    changed,
  };
}

export function groupExactDuplicates(rows) {
  const groups = new Map();
  for (const row of rows) {
    const ids = groups.get(row.bodySha256) ?? [];
    ids.push(row.id);
    groups.set(row.bodySha256, ids);
  }
  return [...groups.entries()]
    .filter(([, sourceIds]) => sourceIds.length > 1)
    .map(([bodySha256, sourceIds]) => ({
      bodySha256,
      sourceIds: sourceIds.sort(),
    }))
    .sort((left, right) => left.bodySha256.localeCompare(right.bodySha256));
}

export function groupRepositoryFileManifests(rows) {
  if (!Array.isArray(rows)) throw new TypeError("repository manifest rows must be an array");
  const repositories = new Map();
  for (const row of rows) {
    if (!row || typeof row.repository !== "string" || typeof row.path !== "string") {
      throw new TypeError("repository manifest row requires repository and path");
    }
    const repository = repositories.get(row.repository) ?? new Map();
    if (repository.has(row.path)) {
      throw new Error(`duplicate manifest path: ${row.repository}:${row.path}`);
    }
    const { repository: _repository, ...fileRow } = row;
    repository.set(row.path, fileRow);
    repositories.set(row.repository, repository);
  }
  return new Map(
    [...repositories.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([repository, files]) => [
        repository,
        [...files.values()].sort((left, right) => left.path.localeCompare(right.path)),
      ]),
  );
}
