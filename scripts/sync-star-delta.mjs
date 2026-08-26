import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readJson, writeJsonAtomic } from "../src/io.mjs";
import { assertInside } from "../src/paths.mjs";

const DEFAULT_WAREHOUSE = "D:\\03-ARSENAL\\warehouse";

export function normalizeGitHubRemote(url) {
  if (typeof url !== "string") {
    throw new TypeError("GitHub remote must be a string");
  }
  const normalized = url
    .trim()
    .replace(/^git@github\.com:/i, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//i, "https://github.com/")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "");
  const match = normalized.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+)$/i);
  if (!match) {
    throw new Error(`not a canonical GitHub repository remote: ${url}`);
  }
  return match[1].toLowerCase();
}

export function destinationFor(fullName, warehouseRoot = DEFAULT_WAREHOUSE) {
  if (!/^[^/]+\/[^/]+$/.test(fullName)) {
    throw new Error(`invalid GitHub fullName: ${fullName}`);
  }
  const destination = path.win32.join(
    warehouseRoot,
    "from-stars",
    fullName.replace("/", "__"),
  );
  return assertInside(path.win32.join(warehouseRoot, "from-stars"), destination);
}

export function buildCloneCommand({ cloneUrl, destination }) {
  return ["clone", "--depth", "1", "--no-tags", cloneUrl, destination];
}

export function planStarSync(entries, inventory, warehouseRoot = DEFAULT_WAREHOUSE) {
  const occupied = new Map(
    [...inventory.entries()].map(([identity, location]) => [
      path.win32.resolve(location).toLowerCase(),
      identity,
    ]),
  );
  return entries.map((entry) => {
    const identity = normalizeGitHubRemote(entry.cloneUrl ?? `https://github.com/${entry.fullName}.git`);
    const desired = entry.fullName.toLowerCase();
    if (identity !== desired) {
      throw new Error(`manifest identity mismatch: ${entry.fullName} != ${identity}`);
    }
    if (inventory.has(identity)) {
      return {
        ...entry,
        identity,
        action: "existing",
        destination: inventory.get(identity),
        detail: "exact remote already represented",
      };
    }
    const destination = destinationFor(entry.fullName, warehouseRoot);
    const collisionIdentity = occupied.get(path.win32.resolve(destination).toLowerCase());
    if (collisionIdentity) {
      return {
        ...entry,
        identity,
        action: "conflict",
        destination,
        detail: `destination belongs to ${collisionIdentity}`,
      };
    }
    if (entry.disposition === "existing") {
      return {
        ...entry,
        identity,
        action: "conflict",
        destination: entry.existingPath ?? destination,
        detail: "manifest-declared existing repository was not verified",
      };
    }
    return {
      ...entry,
      identity,
      action: "clone",
      destination,
      detail: "approved missing origin",
    };
  });
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    timeout: options.timeout ?? 300_000,
    windowsHide: true,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim(),
    error: result.error?.message ?? "",
  };
}

function inspectRepository(repositoryPath) {
  if (!existsSync(repositoryPath)) {
    return null;
  }
  const marker = path.join(repositoryPath, ".git");
  if (!existsSync(marker)) {
    return { path: repositoryPath, identity: null, problem: "path exists without .git" };
  }
  const remoteResult = runGit(["-C", repositoryPath, "remote", "get-url", "origin"]);
  if (!remoteResult.ok) {
    return { path: repositoryPath, identity: null, problem: remoteResult.stderr || remoteResult.error };
  }
  let identity;
  try {
    identity = normalizeGitHubRemote(remoteResult.stdout);
  } catch (error) {
    return { path: repositoryPath, identity: null, problem: error.message };
  }
  return { path: repositoryPath, identity, problem: "" };
}

export function buildManifestInventory(manifest) {
  const inventory = new Map();
  for (const entry of manifest.entries) {
    const candidates = [
      entry.existingPath,
      destinationFor(entry.fullName, manifest.warehouseRoot),
    ].filter(Boolean);
    for (const candidate of new Set(candidates)) {
      const inspected = inspectRepository(candidate);
      if (!inspected) continue;
      const key = inspected.identity ?? `__occupied__:${path.win32.resolve(candidate).toLowerCase()}`;
      inventory.set(key, candidate);
    }
  }
  return inventory;
}

function licenseFiles(repositoryPath) {
  return readdirSync(repositoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^(license|licence|copying|notice)/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function verifyClone(row) {
  const remote = runGit(["-C", row.destination, "remote", "get-url", "origin"]);
  const head = runGit(["-C", row.destination, "rev-parse", "HEAD"]);
  const branch = runGit(["-C", row.destination, "branch", "--show-current"]);
  const status = runGit(["-C", row.destination, "status", "--porcelain=v1"]);
  if (!remote.ok || !head.ok || !branch.ok || !status.ok) {
    throw new Error(
      [
        remote.stderr,
        head.stderr,
        branch.stderr,
        status.stderr,
        remote.error,
        head.error,
        branch.error,
        status.error,
      ]
        .filter(Boolean)
        .join(" | "),
    );
  }
  if (status.stdout !== "") {
    throw new Error(`worktree is not clean: ${status.stdout.slice(0, 500)}`);
  }
  const actualIdentity = normalizeGitHubRemote(remote.stdout);
  if (actualIdentity !== row.identity) {
    throw new Error(`verified remote mismatch: ${actualIdentity} != ${row.identity}`);
  }
  return {
    remote: remote.stdout,
    head: head.stdout,
    branch: branch.stdout,
    licenseFiles: licenseFiles(row.destination),
  };
}

function syncReceipt(rows, apply, generatedAt, complete) {
  return {
    schemaVersion: 1,
    generatedAt,
    applied: apply,
    complete,
    rows: [...rows],
    summary: Object.fromEntries(
      [...new Set(rows.map((row) => row.status))]
        .sort()
        .map((status) => [status, rows.filter((row) => row.status === status).length]),
    ),
  };
}

export async function applyStarSync(plan, { apply = false, onProgress = async () => {} } = {}) {
  const rows = [];
  const generatedAt = new Date().toISOString();
  const record = async (row) => {
    rows.push(row);
    await onProgress(syncReceipt(rows, apply, generatedAt, false));
  };
  for (const row of plan) {
    if (row.action !== "clone") {
      try {
        const verification = row.action === "existing" ? verifyClone(row) : null;
        await record({ ...row, status: row.action, verification });
      } catch (error) {
        await record({ ...row, status: "failed-verification", error: error.message });
      }
      continue;
    }
    if (!apply) {
      await record({ ...row, status: "planned" });
      continue;
    }
    const parent = path.dirname(row.destination);
    if (!existsSync(parent) || !statSync(parent).isDirectory()) {
      throw new Error(`clone parent does not exist: ${parent}`);
    }
    const cloned = runGit(buildCloneCommand(row));
    if (!cloned.ok) {
      await record({
        ...row,
        status: "failed",
        error: cloned.stderr || cloned.error || cloned.stdout || "git clone failed",
      });
      continue;
    }
    try {
      await record({ ...row, status: "cloned", verification: verifyClone(row) });
    } catch (error) {
      await record({ ...row, status: "failed-verification", error: error.message });
    }
  }
  return syncReceipt(rows, apply, generatedAt, true);
}

function parseArgs(argv) {
  const parsed = { apply: false, manifest: "data/star-delta-2026-08-26.json", receipt: "receipts/star-sync-2026-08-26.json" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--apply") parsed.apply = true;
    else if (value === "--manifest") parsed.manifest = argv[++index];
    else if (value === "--receipt") parsed.receipt = argv[++index];
    else throw new Error(`unknown argument: ${value}`);
  }
  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = await readJson(path.resolve(args.manifest));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) {
    throw new Error("unsupported star delta manifest");
  }
  const inventory = buildManifestInventory(manifest);
  const plan = planStarSync(manifest.entries, inventory, manifest.warehouseRoot);
  const conflicts = plan.filter((row) => row.action === "conflict");
  if (conflicts.length > 0) {
    console.log(JSON.stringify({ applied: false, conflicts }, null, 2));
    process.exitCode = 2;
    return;
  }
  const receiptPath = path.resolve(args.receipt);
  const receipt = await applyStarSync(plan, {
    apply: args.apply,
    onProgress: args.apply
      ? async (snapshot) => writeJsonAtomic(receiptPath, snapshot)
      : async () => {},
  });
  if (args.apply) {
    await writeJsonAtomic(receiptPath, receipt);
  }
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.rows.some((row) => row.status.startsWith("failed"))) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  await main();
}
