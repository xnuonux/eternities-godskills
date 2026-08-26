import { lstat, readFile, readlink, rm, symlink } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "./io.mjs";
import { assertInside } from "./paths.mjs";
import { validateProfileLock } from "./schema.mjs";

const GLOBAL_SKILL_ROOT = "C:\\Users\\Dom\\.agents\\skills";
const FORBIDDEN_PROMPT_PAYLOADS = [
  "eternities-pantheon",
  "source-records.jsonl",
  "duplicate-groups.json",
  "source-ledger.jsonl",
  "skill-index.json",
  "skill-vectors",
];

async function statOrNull(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function allowedDestination(destinationRoot) {
  const resolved = path.win32.resolve(destinationRoot);
  const folded = resolved.toLowerCase();
  if (folded === path.win32.resolve(GLOBAL_SKILL_ROOT).toLowerCase()) return resolved;
  if (folded.endsWith("\\.agents\\skills")) return resolved;
  throw new Error(`profile destination is not an allowed skill root: ${resolved}`);
}

function samePath(left, right) {
  return path.win32.resolve(left).toLowerCase() === path.win32.resolve(right).toLowerCase();
}

async function verifiedLinkTarget(destination) {
  const stat = await statOrNull(destination);
  if (!stat) return null;
  if (!stat.isSymbolicLink()) return false;
  return path.resolve(path.dirname(destination), await readlink(destination));
}

export async function planProfile(lock, destinationRoot) {
  validateProfileLock(lock);
  const canonicalRoot = allowedDestination(destinationRoot);
  const operations = [];
  for (const skill of lock.skills) {
    const source = path.resolve(skill.source);
    const promotionReceipt = path.resolve(skill.promotionReceipt);
    const sourceStat = await statOrNull(source);
    if (!sourceStat?.isDirectory()) throw new Error(`skill source is not a directory: ${source}`);
    const receipt = JSON.parse(await readFile(promotionReceipt, "utf8"));
    if (receipt?.schemaVersion !== 1 || receipt?.decision?.status !== "promoted") {
      throw new Error(`skill is not promoted: ${skill.name}`);
    }
    const destination = assertInside(canonicalRoot, path.join(canonicalRoot, skill.name));
    const currentTarget = await verifiedLinkTarget(destination);
    let action;
    if (currentTarget === null) action = "add";
    else if (currentTarget !== false && samePath(currentTarget, source)) action = "existing";
    else throw new Error(`profile collision at ${destination}`);
    const entrypoint = await readFile(path.join(source, "SKILL.md"), "utf8");
    operations.push({
      name: skill.name,
      action,
      source,
      destination,
      promotionReceipt,
      linkTarget: source,
      entrypointSha256: sha256(entrypoint.replaceAll("\r\n", "\n")),
    });
  }
  return {
    schemaVersion: 1,
    name: lock.name,
    destinationRoot: canonicalRoot,
    operations,
    summary: {
      add: operations.filter(({ action }) => action === "add").length,
      existing: operations.filter(({ action }) => action === "existing").length,
    },
  };
}

export async function activateProfile(plan, { previousReceipt = null } = {}) {
  const destinationRoot = allowedDestination(plan.destinationRoot);
  const links = [];
  for (const operation of plan.operations) {
    assertInside(destinationRoot, operation.destination);
    const currentTarget = await verifiedLinkTarget(operation.destination);
    if (operation.action === "existing") {
      if (currentTarget === false || currentTarget === null || !samePath(currentTarget, operation.source)) {
        throw new Error(`existing profile link changed before activation: ${operation.destination}`);
      }
      const previous = previousReceipt?.links?.find(
        (link) =>
          samePath(link.destination, operation.destination) &&
          samePath(link.linkTarget, operation.linkTarget),
      );
      links.push({
        ...operation,
        priorState: previous?.priorState ?? "same-link",
        createdByProfile: previous?.createdByProfile === true,
      });
      continue;
    }
    if (currentTarget !== null) throw new Error(`profile collision during activation: ${operation.destination}`);
    await symlink(operation.source, operation.destination, "junction");
    links.push({ ...operation, priorState: "absent", createdByProfile: true });
  }
  const receipt = {
    schemaVersion: 1,
    profile: plan.name,
    destinationRoot,
    links,
    removalCommand: `node scripts/profile.mjs remove receipts/profile-${plan.name}.json --apply`,
  };
  if (previousReceipt?.verification) receipt.verification = previousReceipt.verification;
  return receipt;
}

export async function removeProfile(receipt, { dryRun = true } = {}) {
  const destinationRoot = allowedDestination(receipt.destinationRoot);
  const planned = [];
  const removed = [];
  const preserved = [];
  const refused = [];
  for (const link of receipt.links ?? []) {
    if (!link.createdByProfile) {
      preserved.push(link.name);
      continue;
    }
    const destination = assertInside(destinationRoot, link.destination);
    const currentTarget = await verifiedLinkTarget(destination);
    if (currentTarget === null) {
      preserved.push(link.name);
      continue;
    }
    if (currentTarget === false || !samePath(currentTarget, link.linkTarget)) {
      refused.push(link.name);
      continue;
    }
    if (dryRun) planned.push(link.name);
    else {
      await rm(destination, { force: true });
      removed.push(link.name);
    }
  }
  return { schemaVersion: 1, dryRun, planned, removed, preserved, refused };
}

export function verifyProfile(receipt, promptText) {
  const folded = String(promptText).toLowerCase();
  const required = (receipt.links ?? []).map(({ name }) => name.toLowerCase());
  const missing = required.filter((name) => !folded.includes(name));
  const forbidden = FORBIDDEN_PROMPT_PAYLOADS.filter((value) => folded.includes(value));
  return {
    schemaVersion: 1,
    valid: missing.length === 0 && forbidden.length === 0,
    required,
    missing,
    forbidden,
  };
}
