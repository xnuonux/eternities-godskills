import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function builderModule() {
  try {
    return await import("../scripts/build-routing-executable-receipt.mjs");
  } catch (error) {
    assert.fail(`routing executable receipt builder is unavailable: ${error.message}`);
  }
}

async function executableModule() {
  try {
    return await import("../scripts/routing.mjs");
  } catch (error) {
    assert.fail(`routing executable is unavailable: ${error.message}`);
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function naturalRequest({ specialist = false } = {}) {
  const context = {
    permittedEffects: ["local-read", "local-write"],
    availableAuthority: ["local-read", "local-write", "repository-write"],
    availablePreconditions: ["repository-present", "settled-outcome"],
    forbiddenCapabilities: [],
    maximumRisk: "moderate",
    minimumEvidenceConfidence: "verified",
    contextBudget: 4000,
    maxCompositionSize: 3,
  };
  if (specialist) context.preferredCapabilities = ["eternities-forge"];
  return {
    schemaVersion: 1,
    requestId: specialist ? "routing-executable-specialist" : "routing-executable-default",
    text: "coordinate implementation tests review verification and integration for the settled release",
    context,
  };
}

async function workspace(t, prefix = "routing-executable-") {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("builds one deterministic complete routing executable trust root", async () => {
  const { buildRoutingExecutableReceipt } = await builderModule();
  const first = await buildRoutingExecutableReceipt({ repositoryRoot });
  const second = await buildRoutingExecutableReceipt({ repositoryRoot });
  const checkedBytes = await readFile(path.join(repositoryRoot, "receipts/routing-executable-v1.json"));
  const checked = JSON.parse(checkedBytes.toString("utf8"));

  assert.deepEqual(second, first);
  assert.deepEqual(checked, first);
  assert.equal(checkedBytes.toString("utf8"), `${JSON.stringify(first, null, 2)}\n`);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.id, "routing-executable-v1");
  assert.equal(first.status, "verified-build");
  assert.equal(first.protocolId, "eternities-godskills-routing-executable-v1");
  assert.deepEqual(first.dependencyClosure.roots, ["scripts/routing.mjs"]);
  assert.equal(first.dependencyClosure.complete, true);
  assert.equal(new Set(first.dependencyClosure.localModules).size, first.dependencyClosure.localModules.length);
  for (const required of [
    "scripts/routing.mjs",
    "scripts/build-routing-executable-receipt.mjs",
    "scripts/intent.mjs",
    "scripts/intent-preference.mjs",
    "src/intent-runtime.mjs",
    "src/specialist-preference-runtime.mjs",
    "src/router.mjs",
    "src/static-module-closure.mjs",
  ]) assert.equal(first.dependencyClosure.localModules.includes(required), true, required);
  assert.deepEqual(first.modes, [
    { mode: "default", entrypoint: "scripts/intent.mjs" },
    { mode: "specialist", entrypoint: "scripts/intent-preference.mjs" },
  ]);
  assert.deepEqual(first.routingArtifacts.map(({ role }) => role), ["cards", "family-map", "manifest"]);
  assert.deepEqual(first.parents.map(({ role }) => role), [
    "godskills-system",
    "intent-compiler",
    "portable-capabilities",
    "router",
    "specialist-preference",
  ]);
  for (const parent of first.parents) assert.match(parent.logicalDigest, /^[a-f0-9]{64}$/);
  assert.equal(
    first.parents.find(({ role }) => role === "portable-capabilities").receiptDigestAlgorithm,
    "json-insertion-order-v1",
  );
  assert.equal(first.artifacts.some(({ path: value }) => path.isAbsolute(value)), false);
  assert.match(first.receiptDigest, /^[a-f0-9]{64}$/);
});

test("exact module, routing artifact, and parent bytes are bound before execution", async () => {
  const {
    buildRoutingExecutableReceipt,
    verifyRoutingExecutableReceipt,
  } = await builderModule();
  const candidate = await buildRoutingExecutableReceipt({ repositoryRoot });
  assert.deepEqual(await verifyRoutingExecutableReceipt({ repositoryRoot, candidate }), candidate);

  for (const relativePath of [
    "src/router.mjs",
    "artifacts/routing/cards.jsonl",
    "receipts/agent-native-router-v8.json",
  ]) {
    const target = path.resolve(repositoryRoot, ...relativePath.split("/"));
    const changed = Buffer.concat([await readFile(target), Buffer.from("\n")]);
    const io = {
      async readFile(value) {
        return path.resolve(value) === target ? changed : readFile(value);
      },
    };
    await assert.rejects(
      verifyRoutingExecutableReceipt({ repositoryRoot, candidate, io }),
      /routing|receipt|parent|artifact|digest|bytes/i,
      relativePath,
    );
  }
});

test("closed arguments reject unknown, missing, duplicate, relative, and colliding paths", async () => {
  const { parseRoutingArguments } = await executableModule();
  const request = path.resolve("request.json");
  const output = path.resolve("output.json");
  const receipt = path.resolve("receipt.json");
  const aliasedRequest = `${path.dirname(request)}${path.sep}nested${path.sep}..${path.sep}${path.basename(request)}`;
  assert.deepEqual(parseRoutingArguments([
    "--mode", "default",
    "--request", request,
    "--output", output,
    "--receipt", receipt,
  ]), { mode: "default", requestPath: request, outputPath: output, receiptPath: receipt });

  for (const argv of [
    [],
    ["--mode", "unknown", "--request", request, "--output", output, "--receipt", receipt],
    ["--mode", "default", "--request", "relative.json", "--output", output, "--receipt", receipt],
    ["--mode", "default", "--request", aliasedRequest, "--output", output, "--receipt", receipt],
    ["--mode", "default", "--request", request, "--request", request, "--output", output, "--receipt", receipt],
    ["--mode", "default", "--request", request, "--output", request, "--receipt", receipt],
    ["--mode", "default", "--request", request, "--output", output, "--receipt", receipt, "--apply", "yes"],
  ]) assert.throws(() => parseRoutingArguments(argv), /argument|mode|absolute|distinct|duplicate|unknown/i);
});

test("self-verified default and specialist modes execute the real fixed routing paths", async (t) => {
  const root = await workspace(t);
  const requestPath = path.join(root, "request.json");
  const outputPath = path.join(root, "output.json");
  const receiptPath = path.join(root, "receipt.json");
  const { buildRoutingExecutableReceipt } = await builderModule();
  const { runRouting } = await executableModule();
  const receipt = await buildRoutingExecutableReceipt({ repositoryRoot });
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

  const outputs = [];
  for (const mode of ["default", "specialist"]) {
    const request = naturalRequest({ specialist: mode === "specialist" });
    await writeFile(requestPath, `${JSON.stringify(request, null, 2)}\n`, "utf8");
    const first = await runRouting([
      "--mode", mode,
      "--request", requestPath,
      "--output", outputPath,
      "--receipt", receiptPath,
    ]);
    const firstBytes = await readFile(outputPath);
    const second = await runRouting([
      "--mode", mode,
      "--request", requestPath,
      "--output", outputPath,
      "--receipt", receiptPath,
    ]);
    const secondBytes = await readFile(outputPath);
    assert.deepEqual(second, first);
    assert.equal(sha256(secondBytes), sha256(firstBytes));
    assert.ok(["selected", "needs-decision", "no-qualified-route"].includes(first.routeReceipt.status));
    if (mode === "specialist") {
      assert.equal(first.routeReceipt.preference.protocolId, "eternities-godskills-specialist-preference-v1");
    }
    outputs.push(sha256(firstBytes));
  }
  assert.notEqual(outputs[0], outputs[1]);
});

test("a stale executable receipt is rejected before request parsing or output publication", async (t) => {
  const root = await workspace(t, "routing-executable-stale-");
  const requestPath = path.join(root, "request.json");
  const outputPath = path.join(root, "output.json");
  const receiptPath = path.join(root, "receipt.json");
  const { buildRoutingExecutableReceipt } = await builderModule();
  const { runRouting } = await executableModule();
  const receipt = structuredClone(await buildRoutingExecutableReceipt({ repositoryRoot }));
  receipt.receiptDigest = "0".repeat(64);
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await writeFile(requestPath, "{", "utf8");

  await assert.rejects(runRouting([
    "--mode", "default",
    "--request", requestPath,
    "--output", outputPath,
    "--receipt", receiptPath,
  ]), /receipt|verified build|digest/i);
  await assert.rejects(readFile(outputPath), /ENOENT/i);
});

test("certification binds the reviewed source, checked receipt, and honest proof boundary", async () => {
  const certification = await readFile(
    path.join(repositoryRoot, "docs/routing-executable-v1-certification.md"),
    "utf8",
  );
  for (const value of [
    "62b43e55c8bb77a4c42d838c5783bca99f4ca1c2",
    "30ca5eb79e8935d8701f2fb466a22dd0007fc370f587c191fe03d065a930ff28",
    "27cd2bc10ab225f62916f684bd5a621a3ffeaec43ef93c36d8b5b53188193c7d",
    "768 passed, 0 failed",
    "this is not an independent-review claim",
    "Godagents adapter correctness",
  ]) assert.match(certification, new RegExp(value, "i"));
});
