import { randomUUID } from "node:crypto";
import { readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildAdaptiveActivationExecutableReceipt } from "./build-adaptive-activation-executable-receipt.mjs";
import { compileActivationDecision } from "../src/adaptive-activation.mjs";
import { buildActivationResult, validateActivationRequest } from "../src/adaptive-activation-protocol.mjs";
import { sha256 } from "../src/io.mjs";

const FLAGS = Object.freeze(["--request", "--output", "--receipt"]);
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]));
  }
  return value;
}

const canonical = (value) => JSON.stringify(stable(value));
const logicalDigest = (value) => sha256(canonical(value));

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON`, { cause: error });
  }
}

function argumentPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || /[\0\r\n]/.test(value) || !path.isAbsolute(value)) {
    throw new Error(`activation ${label} must be an absolute single-line path`);
  }
  return path.resolve(value);
}

export function parseActivationArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== FLAGS.length * 2) {
    throw new Error("activation arguments are incomplete or contain unknown values");
  }
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!FLAGS.includes(flag)) throw new Error(`activation argument is unknown: ${flag}`);
    if (values.has(flag)) throw new Error(`activation argument is duplicated: ${flag}`);
    values.set(flag, argumentPath(value, flag.slice(2)));
  }
  if (values.size !== FLAGS.length) throw new Error("activation arguments are incomplete");
  const requestPath = values.get("--request");
  const outputPath = values.get("--output");
  const receiptPath = values.get("--receipt");
  const identities = [requestPath, outputPath, receiptPath]
    .map((value) => process.platform === "win32" ? value.toLowerCase() : value);
  if (new Set(identities).size !== identities.length) {
    throw new Error("activation request, output, and receipt paths must be distinct");
  }
  return Object.freeze({ requestPath, outputPath, receiptPath });
}

function artifactFor(receipt, role) {
  const matches = receipt.artifacts.filter((artifact) => artifact.role === role);
  if (matches.length !== 1) throw new Error(`activation receipt must contain one ${role} artifact`);
  return matches[0];
}

function assertContained(root, target, label) {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return;
  throw new Error(`activation ${label} escaped the repository root`);
}

async function readBoundArtifact(root, artifact) {
  const lexicalPath = path.resolve(root, ...artifact.path.split("/"));
  assertContained(root, lexicalPath, artifact.role);
  const actual = await realpath(lexicalPath);
  assertContained(root, actual, artifact.role);
  const bytes = await readFile(actual);
  if (bytes.length !== artifact.bytes || sha256(bytes) !== artifact.sha256) {
    throw new Error(`activation ${artifact.role} bytes do not match the executable receipt`);
  }
  const value = parseJson(bytes, `activation ${artifact.role}`);
  if (logicalDigest(value) !== artifact.logicalDigest) {
    throw new Error(`activation ${artifact.role} logical digest does not match the executable receipt`);
  }
  return value;
}

async function verifyExecutableReceipt(receiptPath) {
  const candidate = parseJson(await readFile(receiptPath), "activation executable receipt");
  const expected = await buildAdaptiveActivationExecutableReceipt({ repositoryRoot: REPOSITORY_ROOT });
  if (canonical(candidate) !== canonical(expected)) {
    throw new Error("activation executable receipt does not match the current verified build");
  }
  return expected;
}

async function writeCanonicalAtomically(outputPath, value) {
  const temporaryPath = `${outputPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(stable(value), null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function runActivation(argv = process.argv.slice(2)) {
  const { requestPath, outputPath, receiptPath } = parseActivationArguments(argv);
  const receipt = await verifyExecutableReceipt(receiptPath);
  const request = validateActivationRequest(parseJson(await readFile(requestPath), "activation request"));
  if (request.trustRootDigest !== receipt.receiptDigest) {
    throw new Error("activation request trust root does not match the executable receipt");
  }

  const policyArtifact = artifactFor(receipt, "policy");
  const evidenceArtifact = artifactFor(receipt, "evidence");
  const policy = await readBoundArtifact(REPOSITORY_ROOT, policyArtifact);
  const evidence = await readBoundArtifact(REPOSITORY_ROOT, evidenceArtifact);
  const task = {
    taskClass: request.classification.taskClass,
    consequenceClass: request.classification.consequenceClass,
    authorityProjection: request.authorityProjection,
  };
  const decisions = request.selected.map(({ selectedId, explicitMethodRequest }) =>
    compileActivationDecision({
      selectedId,
      task,
      explicitMethodRequest,
      reviewAvailable: request.classification.reviewAvailable,
      policy,
      evidence,
    }));
  const result = buildActivationResult({
    request,
    decisions,
    policyDigest: policyArtifact.logicalDigest,
    evidenceDigest: evidenceArtifact.logicalDigest,
  });
  await writeCanonicalAtomically(outputPath, result);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runActivation().catch((error) => {
    process.stderr.write(`adaptive activation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
