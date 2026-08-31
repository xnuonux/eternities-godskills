import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildAdaptiveActivationExecutableReceipt } from "../scripts/build-adaptive-activation-executable-receipt.mjs";

const REPOSITORY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ENTRYPOINT = join(REPOSITORY_ROOT, "scripts", "activation.mjs");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

const digest = (value) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function resignReceipt(receipt) {
  const unsigned = structuredClone(receipt);
  delete unsigned.receiptDigest;
  return { ...unsigned, receiptDigest: digest(unsigned) };
}

function activationRequest(trustRootDigest, overrides = {}) {
  const base = {
    schemaVersion: 1,
    protocolId: "eternities-godskills-activation-v1",
    requestId: "transport-fixture",
    trustRootDigest,
    classification: {
      taskClass: "creative-generation",
      consequenceClass: "consequential",
      reviewAvailable: true,
    },
    selected: [{ selectedId: "eternities-muse", explicitMethodRequest: false }],
    authorityProjection: {
      availableAuthority: ["local-read", "local-write"],
      permittedEffects: ["local-read", "local-write"],
      availablePreconditions: ["workspace-clean"],
      maximumRisk: "moderate",
      minimumEvidenceConfidence: "verified",
      contextBudget: 4096,
    },
  };
  return {
    ...base,
    ...overrides,
    classification: { ...base.classification, ...overrides.classification },
    authorityProjection: { ...base.authorityProjection, ...overrides.authorityProjection },
  };
}

async function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [ENTRYPOINT, ...args], {
      cwd: REPOSITORY_ROOT,
      windowsHide: true,
      shell: false,
      env: { SystemRoot: process.env.SystemRoot, WINDIR: process.env.WINDIR },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({
      code,
      signal,
      stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8"),
    }));
  });
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "activation-transport-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const receipt = await buildAdaptiveActivationExecutableReceipt({ repositoryRoot: REPOSITORY_ROOT });
  const receiptPath = join(root, "receipt.json");
  await writeFile(receiptPath, json(receipt), "utf8");
  return { root, receipt, receiptPath };
}

async function execute({ root, receiptPath, request, name = "result" }) {
  const requestPath = join(root, `${name}-request.json`);
  const outputPath = join(root, `${name}-output.json`);
  await writeFile(requestPath, json(request), "utf8");
  const processResult = await runNode([
    "--request", requestPath,
    "--output", outputPath,
    "--receipt", receiptPath,
  ]);
  return { processResult, requestPath, outputPath };
}

async function assertMissing(path) {
  await assert.rejects(access(path), /ENOENT/i);
}

test("executes native, guardrail, method, and review modes through the receipt-bound process", async (t) => {
  const { root, receipt, receiptPath } = await fixture(t);
  const cases = [
    ["review", {}],
    ["guardrail", { classification: { reviewAvailable: false } }],
    ["native", { classification: { consequenceClass: "low", reviewAvailable: false } }],
    ["method", { selected: [{ selectedId: "eternities-muse", explicitMethodRequest: true }] }],
  ];

  for (const [expectedMode, overrides] of cases) {
    const request = activationRequest(receipt.receiptDigest, {
      ...overrides,
      requestId: `transport-${expectedMode}`,
    });
    const { processResult, outputPath } = await execute({
      root,
      receiptPath,
      request,
      name: expectedMode,
    });
    assert.equal(processResult.code, 0, processResult.stderr);
    assert.equal(processResult.stdout, "");
    const result = JSON.parse(await readFile(outputPath, "utf8"));
    assert.equal(result.requestId, request.requestId);
    assert.equal(result.trustRootDigest, receipt.receiptDigest);
    assert.equal(result.decisions[0].mode, expectedMode);
    assert.deepEqual(result.decisions[0].authorityProjection, request.authorityProjection);
  }
});

test("preserves selected order, explicit intent, and byte-identical canonical output", async (t) => {
  const { root, receipt, receiptPath } = await fixture(t);
  const request = activationRequest(receipt.receiptDigest, {
    requestId: "transport-two-selected",
    classification: { consequenceClass: "low", reviewAvailable: false },
    selected: [
      { selectedId: "eternities-muse", explicitMethodRequest: false },
      { selectedId: "eternities-aegis", explicitMethodRequest: true },
    ],
  });
  const first = await execute({ root, receiptPath, request, name: "ordered-a" });
  const second = await execute({ root, receiptPath, request, name: "ordered-b" });
  assert.equal(first.processResult.code, 0, first.processResult.stderr);
  assert.equal(second.processResult.code, 0, second.processResult.stderr);
  const firstBytes = await readFile(first.outputPath);
  const secondBytes = await readFile(second.outputPath);
  assert.deepEqual(secondBytes, firstBytes);
  const result = JSON.parse(firstBytes.toString("utf8"));
  assert.deepEqual(result.decisions.map(({ selectedId, mode }) => [selectedId, mode]), [
    ["eternities-muse", "native"],
    ["eternities-aegis", "method"],
  ]);
});

test("rejects stale trust roots, stale receipt digests, and substituted policy or evidence", async (t) => {
  const { root, receipt, receiptPath } = await fixture(t);
  const attacks = [];

  attacks.push({
    name: "stale-trust-root",
    request: activationRequest("0".repeat(64)),
    receiptPath,
  });

  const staleReceipt = { ...receipt, receiptDigest: "0".repeat(64) };
  const staleReceiptPath = join(root, "stale-receipt.json");
  await writeFile(staleReceiptPath, json(staleReceipt), "utf8");
  attacks.push({
    name: "stale-receipt",
    request: activationRequest(staleReceipt.receiptDigest),
    receiptPath: staleReceiptPath,
  });

  for (const role of ["policy", "evidence"]) {
    const substituted = structuredClone(receipt);
    substituted.artifacts.find((artifact) => artifact.role === role).sha256 = "f".repeat(64);
    const forged = resignReceipt(substituted);
    const forgedPath = join(root, `substituted-${role}.json`);
    await writeFile(forgedPath, json(forged), "utf8");
    attacks.push({
      name: `substituted-${role}`,
      request: activationRequest(forged.receiptDigest),
      receiptPath: forgedPath,
    });
  }

  for (const attack of attacks) {
    const { processResult, outputPath } = await execute({
      root,
      receiptPath: attack.receiptPath,
      request: attack.request,
      name: attack.name,
    });
    assert.notEqual(processResult.code, 0, `${attack.name} unexpectedly succeeded`);
    assert.match(processResult.stderr, /activation/i);
    await assertMissing(outputPath);
  }
});

test("rejects malformed requests and never replaces output on failure", async (t) => {
  const { root, receipt, receiptPath } = await fixture(t);
  const malformed = activationRequest(receipt.receiptDigest);
  malformed.unexpected = true;
  const outputPath = join(root, "malformed-output.json");
  await writeFile(outputPath, "preserve-me\n", "utf8");
  const requestPath = join(root, "malformed-request.json");
  await writeFile(requestPath, json(malformed), "utf8");
  const processResult = await runNode([
    "--request", requestPath,
    "--output", outputPath,
    "--receipt", receiptPath,
  ]);
  assert.notEqual(processResult.code, 0);
  assert.equal(await readFile(outputPath, "utf8"), "preserve-me\n");

  const invalidJsonPath = join(root, "invalid-json-request.json");
  const absentOutput = join(root, "invalid-json-output.json");
  await writeFile(invalidJsonPath, "{", "utf8");
  const invalidJson = await runNode([
    "--request", invalidJsonPath,
    "--output", absentOutput,
    "--receipt", receiptPath,
  ]);
  assert.notEqual(invalidJson.code, 0);
  await assertMissing(absentOutput);
});

test("rejects unknown, duplicate, missing, empty, newline-bearing, and relative arguments", async (t) => {
  const { root, receipt, receiptPath } = await fixture(t);
  const requestPath = join(root, "request.json");
  const outputPath = join(root, "output.json");
  await writeFile(requestPath, json(activationRequest(receipt.receiptDigest)), "utf8");
  const valid = ["--request", requestPath, "--output", outputPath, "--receipt", receiptPath];
  const invalidArguments = [
    [...valid, "--unknown", "value"],
    [...valid, "--request", requestPath],
    ["--request", requestPath, "--output", outputPath],
    ["--request", "", "--output", outputPath, "--receipt", receiptPath],
    ["--request", `${requestPath}\n`, "--output", outputPath, "--receipt", receiptPath],
    ["--request", "relative.json", "--output", outputPath, "--receipt", receiptPath],
  ];
  for (const args of invalidArguments) {
    const result = await runNode(args);
    assert.notEqual(result.code, 0, `invalid arguments unexpectedly succeeded: ${JSON.stringify(args)}`);
    assert.match(result.stderr, /activation/i);
  }
});
