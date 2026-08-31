import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { verifyRoutingExecutableReceipt } from "./build-routing-executable-receipt.mjs";
import { compilePreferenceRequestFile } from "./intent-preference.mjs";
import { compileRequestFile } from "./intent.mjs";

const FLAGS = Object.freeze(["--mode", "--request", "--output", "--receipt"]);
const MODES = new Set(["default", "specialist"]);
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argumentPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || /[\0\r\n]/.test(value) || !path.isAbsolute(value)) {
    throw new Error(`routing ${label} must be an absolute single-line path`);
  }
  if (value.split(/[\\/]/).some((segment) => segment === "." || segment === "..")) {
    throw new Error(`routing ${label} absolute path contains aliased segments`);
  }
  return path.resolve(value);
}

export function parseRoutingArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== FLAGS.length * 2) {
    throw new Error("routing arguments are incomplete or contain unknown values");
  }
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!FLAGS.includes(flag)) throw new Error(`routing argument is unknown: ${flag}`);
    if (values.has(flag)) throw new Error(`routing argument is duplicated: ${flag}`);
    values.set(flag, value);
  }
  if (values.size !== FLAGS.length) throw new Error("routing arguments are incomplete");
  const mode = values.get("--mode");
  if (!MODES.has(mode)) throw new Error("routing mode is invalid");
  const requestPath = argumentPath(values.get("--request"), "request");
  const outputPath = argumentPath(values.get("--output"), "output");
  const receiptPath = argumentPath(values.get("--receipt"), "receipt");
  const identities = [requestPath, outputPath, receiptPath]
    .map((value) => process.platform === "win32" ? value.toLowerCase() : value);
  if (new Set(identities).size !== identities.length) {
    throw new Error("routing request, output, and receipt paths must be distinct");
  }
  return Object.freeze({ mode, requestPath, outputPath, receiptPath });
}

function parseReceipt(bytes) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error("routing executable receipt is invalid JSON", { cause: error });
  }
}

export async function runRouting(argv = process.argv.slice(2)) {
  const { mode, requestPath, outputPath, receiptPath } = parseRoutingArguments(argv);
  const receiptBytes = await readFile(receiptPath);
  const candidate = parseReceipt(receiptBytes);
  const verified = await verifyRoutingExecutableReceipt({
    repositoryRoot: REPOSITORY_ROOT,
    candidate,
  });
  const canonicalReceipt = `${JSON.stringify(verified, null, 2)}\n`;
  if (!receiptBytes.equals(Buffer.from(canonicalReceipt, "utf8"))) {
    throw new Error("routing executable receipt bytes are not canonical");
  }
  const cardsPath = path.join(REPOSITORY_ROOT, "artifacts", "routing", "cards.jsonl");
  if (mode === "specialist") {
    return compilePreferenceRequestFile({ requestPath, cardsPath, outputPath });
  }
  return compileRequestFile({ requestPath, cardsPath, outputPath });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runRouting()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => {
      process.stderr.write(`routing executable failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
