import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { readJson, writeJsonAtomic } from "../src/io.mjs";
import {
  activateProfile,
  planProfile,
  removeProfile,
  verifyProfile,
} from "../src/profile.mjs";

function resolveLock(lockPath, lock) {
  const root = path.dirname(lockPath);
  return {
    ...lock,
    skills: lock.skills.map((skill) => ({
      ...skill,
      source: path.resolve(root, skill.source),
      promotionReceipt: path.resolve(root, skill.promotionReceipt),
    })),
  };
}

async function loadPlan(lockArgument) {
  const lockPath = path.resolve(lockArgument);
  const raw = await readJson(lockPath);
  const lock = resolveLock(lockPath, raw);
  return {
    raw,
    lockPath,
    plan: await planProfile(lock, raw.destinationRoot),
    receiptPath: path.resolve(path.dirname(lockPath), raw.receipt),
  };
}

async function main() {
  const [command, target, ...flags] = process.argv.slice(2);
  if (!command || !target) {
    throw new Error("usage: profile.mjs <preview|activate|remove|verify> <lock-or-receipt>");
  }
  if (command === "preview") {
    console.log(JSON.stringify((await loadPlan(target)).plan, null, 2));
    return;
  }
  if (command === "activate") {
    const loaded = await loadPlan(target);
    if (!flags.includes("--apply")) {
      console.log(JSON.stringify({ applied: false, plan: loaded.plan }, null, 2));
      return;
    }
    const previousReceipt = existsSync(loaded.receiptPath)
      ? await readJson(loaded.receiptPath)
      : null;
    const receipt = await activateProfile(loaded.plan, { previousReceipt });
    await writeJsonAtomic(loaded.receiptPath, receipt);
    console.log(JSON.stringify({ applied: true, receiptPath: loaded.receiptPath, receipt }, null, 2));
    return;
  }
  if (command === "remove") {
    const receipt = await readJson(path.resolve(target));
    const result = await removeProfile(receipt, { dryRun: !flags.includes("--apply") });
    console.log(JSON.stringify(result, null, 2));
    if (result.refused.length > 0) process.exitCode = 2;
    return;
  }
  if (command === "verify") {
    const receipt = await readJson(path.resolve(target));
    const promptText = process.env.CODEX_PROMPT_INPUT ?? "";
    const result = verifyProfile(receipt, promptText);
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 2;
    return;
  }
  throw new Error(`unknown profile command: ${command}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) await main();
