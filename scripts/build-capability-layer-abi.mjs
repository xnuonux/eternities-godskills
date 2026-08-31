import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalJson,
  compileCapabilityLayerBundle,
  LAYER_FILES,
  verifyCapabilityLayerBundle,
} from "../src/capability-layer-abi.mjs";
import { sha256 } from "../src/io.mjs";
import { assertInside } from "../src/paths.mjs";

const POLICY_PATH = "policies/capability-layer-abi.v1.json";
const LEGACY_MANIFEST_PATH = "artifacts/portable-capabilities/manifest.v1.json";
const RECEIPT_PATH = "receipts/capability-layer-abi-v1.json";
const REPORT_PATH = "docs/capability-layer-abi-v1-report.md";

async function readCanarySources({ root, canary }) {
  return Object.fromEntries(await Promise.all(
    Object.entries(canary.sources).map(async ([name, relative]) => [
      name,
      { path: relative, bytes: await readFile(new URL(relative, root)) },
    ]),
  ));
}

function artifactPath(capabilityId, name) {
  return "artifacts/capability-layers/" + capabilityId + "/" + name;
}

function checkedLayerRows(bundle) {
  return Object.entries(bundle.manifest.layers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, row]) => ({
      name,
      path: artifactPath(bundle.capabilityId, row.path),
      sha256: row.sha256,
      bytes: row.bytes,
      disclosureModes: row.disclosureModes,
    }));
}

function buildAggregateReceipt({
  policyBytes,
  legacyManifestBytes,
  legacyManifest,
  bundles,
}) {
  const canaries = bundles.map((bundle) => {
    const manifestText = bundle.files["manifest.v1.json"];
    return {
      capabilityId: bundle.capabilityId,
      manifest: {
        path: artifactPath(bundle.capabilityId, "manifest.v1.json"),
        sha256: sha256(manifestText),
        bytes: Buffer.byteLength(manifestText),
        bundleDigest: bundle.manifest.bundleDigest,
      },
      sources: bundle.manifest.sources,
      layers: checkedLayerRows(bundle),
    };
  });
  let legacyEntrypointsModified = 0;
  for (const bundle of bundles) {
    const legacy = legacyManifest.capabilities?.find(
      ({ id }) => id === bundle.capabilityId,
    );
    const current = bundle.manifest.sources.entrypoint;
    if (!legacy || legacy.entrypoint?.path !== current.path
        || legacy.entrypoint?.sha256 !== current.sha256) {
      legacyEntrypointsModified += 1;
    }
  }
  if (legacyEntrypointsModified !== 0) {
    throw new Error("canary entrypoint bytes drifted from the portable manifest");
  }
  const allLayers = canaries.flatMap(({ layers }) => layers);
  const nativeBodyFiles = allLayers.filter(({ disclosureModes }) =>
    disclosureModes.includes("native")).length;
  const reviewerRequiresArtifact = bundles.every((bundle) =>
    bundle.files["reviewer.v1.md"].includes("artifact-required: true"));
  const verifierClaimsExecution = bundles.some((bundle) => {
    const verifier = JSON.parse(bundle.files["verifier.v1.json"]);
    return verifier.status !== "declared-not-executed"
      || verifier.executedChecks !== 0
      || verifier.observations.length !== 0
      || Object.hasOwn(verifier, "passed");
  });
  const capabilityGrantsAuthority = bundles.some(
    ({ manifest }) => manifest.capabilityGrantsAuthority !== false,
  );
  const body = {
    schemaVersion: 1,
    id: "capability-layer-abi-v1",
    status: "experimental-canary",
    policy: {
      path: POLICY_PATH,
      sha256: sha256(policyBytes),
      bytes: policyBytes.length,
    },
    legacyManifest: {
      path: LEGACY_MANIFEST_PATH,
      sha256: sha256(legacyManifestBytes),
      bytes: legacyManifestBytes.length,
      manifestDigest: legacyManifest.manifestDigest,
    },
    canaries,
    totals: {
      canaries: canaries.length,
      sourceRecords: canaries.reduce(
        (sum, canary) => sum + Object.keys(canary.sources).length,
        0,
      ),
      layerFiles: allLayers.length,
      layerBytes: allLayers.reduce((sum, layer) => sum + layer.bytes, 0),
    },
    computedGates: {
      exactCanaryCount: canaries.length === 3,
      exactSourceCount: canaries.every(
        (canary) => Object.keys(canary.sources).length === 4,
      ),
      exactLayerCount: canaries.every((canary) => canary.layers.length === 7),
      allSourcesDigestBound: canaries.every((canary) =>
        Object.values(canary.sources).every((source) => /^[a-f0-9]{64}$/.test(source.sha256))),
      allLayersDigestBound: allLayers.every((layer) => /^[a-f0-9]{64}$/.test(layer.sha256)),
      nativeBodyFiles,
      reviewerRequiresArtifact,
      verifierClaimsExecution,
      capabilityGrantsAuthority,
      legacyEntrypointsModified,
    },
    unresolvedGates: {
      historicalFullSuite: "pending",
      independentReview: "pending",
      modelQuality: "not-claimed",
      globalActivation: "not-authorized",
    },
    proofLimits: [
      "structural-layer-integrity-only",
      "no-model-quality-claim",
      "no-global-activation",
      "no-external-authority",
    ],
  };
  return { ...body, receiptDigest: sha256(canonicalJson(body)) };
}

function metric(bytes) {
  return bytes + " / " + Math.ceil(bytes / 4);
}

function buildCostReport({ bundles, receipt }) {
  const rows = bundles.map((bundle) => {
    const layer = bundle.manifest.layers;
    return "| " + bundle.capabilityId
      + " | " + metric(0)
      + " | " + metric(layer.guardrails.bytes)
      + " | " + metric(layer.method.bytes)
      + " | " + metric(0)
      + " | " + metric(layer.reviewer.bytes)
      + " |";
  });
  return [
    "# capability layer ABI v1 cost report",
    "",
    "status: `experimental-canary`",
    "",
    "build receipt: `" + receipt.receiptDigest + "`",
    "",
    "values are `bytes / estimated tokens`.",
    "",
    "| capability | native | guardrail | method | review before artifact | review after artifact |",
    "|---|---:|---:|---:|---:|---:|",
    ...rows,
    "",
    "token counts use `Math.ceil(bytes / 4)` and are not tokenizer output.",
    "smaller context is not evidence of higher model quality. these bundles",
    "remain local, additive, and experimental. no default activation, external",
    "authority, Godagents runtime, or Lunari integration changes are made.",
    "",
  ].join("\n");
}

export async function rebuildCapabilityLayerAbi({
  root = new URL("../", import.meta.url),
} = {}) {
  const policyBytes = await readFile(new URL(POLICY_PATH, root));
  const policy = JSON.parse(policyBytes);
  const legacyManifestBytes = await readFile(new URL(LEGACY_MANIFEST_PATH, root));
  const legacyManifest = JSON.parse(legacyManifestBytes);
  const bundles = [];
  const files = {};
  for (const canary of policy.canaries) {
    const sources = await readCanarySources({ root, canary });
    const bundle = compileCapabilityLayerBundle({
      policy,
      policySource: { path: POLICY_PATH, bytes: policyBytes },
      canary,
      sources,
    });
    verifyCapabilityLayerBundle({
      bundle,
      policy,
      policySource: { path: POLICY_PATH, bytes: policyBytes },
      canary,
      sources,
    });
    bundles.push(bundle);
    for (const name of LAYER_FILES) {
      files[artifactPath(canary.capabilityId, name)] = bundle.files[name];
    }
  }
  const receipt = buildAggregateReceipt({
    policyBytes,
    legacyManifestBytes,
    legacyManifest,
    bundles,
  });
  return Object.freeze({
    bundles: Object.freeze(bundles),
    files: Object.freeze(files),
    receipt: Object.freeze(receipt),
    receiptText: canonicalJson(receipt),
    report: buildCostReport({ bundles, receipt }),
  });
}

async function pathState(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function validateOutputRelative(relative) {
  if (typeof relative !== "string" || relative.trim() === ""
      || relative.includes("\\") || relative.startsWith("/")
      || /^[a-z]:/i.test(relative) || path.posix.normalize(relative) !== relative
      || relative.split("/").includes("..")) {
    throw new Error("generated output is not a contained output path: " + relative);
  }
}

export async function commitGeneratedFiles({
  rootPath,
  writes,
  renameFile = rename,
}) {
  if (typeof rootPath !== "string" || rootPath.trim() === ""
      || !writes || typeof writes !== "object" || Array.isArray(writes)
      || typeof renameFile !== "function") {
    throw new TypeError("generated file transaction options are invalid");
  }
  const canonicalRoot = await realpath(rootPath);
  const entries = Object.entries(writes).sort(([left], [right]) =>
    left.localeCompare(right));
  if (entries.length === 0) throw new Error("generated file transaction is empty");
  const destinations = [];
  const folded = new Set();
  for (const [relative, text] of entries) {
    validateOutputRelative(relative);
    if (typeof text !== "string") {
      throw new TypeError("generated output must be UTF-8 text: " + relative);
    }
    const destination = assertInside(
      canonicalRoot,
      path.resolve(canonicalRoot, ...relative.split("/")),
    );
    const identity = destination.toLowerCase();
    if (folded.has(identity)) throw new Error("duplicate generated output path: " + relative);
    folded.add(identity);
    destinations.push({ relative, text, destination });
  }

  const transactionRoot = await mkdtemp(
    path.join(canonicalRoot, ".capability-layer-abi-txn-"),
  );
  assertInside(canonicalRoot, transactionRoot);
  const stagedRoot = path.join(transactionRoot, "staged");
  const backupRoot = path.join(transactionRoot, "backups");
  const applied = [];
  try {
    for (const entry of destinations) {
      const staged = assertInside(
        transactionRoot,
        path.resolve(stagedRoot, ...entry.relative.split("/")),
      );
      await mkdir(path.dirname(staged), { recursive: true });
      await writeFile(staged, entry.text, "utf8");
      const stagedBytes = await readFile(staged);
      if (sha256(stagedBytes) !== sha256(entry.text)
          || stagedBytes.length !== Buffer.byteLength(entry.text)) {
        throw new Error("staged generated output does not match: " + entry.relative);
      }
      entry.staged = staged;
    }

    for (const entry of destinations) {
      await mkdir(path.dirname(entry.destination), { recursive: true });
      const realParent = await realpath(path.dirname(entry.destination));
      assertInside(canonicalRoot, realParent);
      assertInside(canonicalRoot, path.join(realParent, path.basename(entry.destination)));
      const existing = await pathState(entry.destination);
      if (existing && (!existing.isFile() || existing.isSymbolicLink())) {
        throw new Error("generated output destination is not a regular file: " + entry.relative);
      }
      const backup = assertInside(
        transactionRoot,
        path.resolve(backupRoot, ...entry.relative.split("/")),
      );
      const state = {
        destination: entry.destination,
        backup,
        hadOriginal: Boolean(existing),
        applied: false,
      };
      if (existing) {
        await mkdir(path.dirname(backup), { recursive: true });
        await renameFile(entry.destination, backup);
      }
      applied.push(state);
      await renameFile(entry.staged, entry.destination);
      state.applied = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const state of [...applied].reverse()) {
      try {
        if (state.applied) await rm(state.destination, { force: true });
        if (state.hadOriginal && await pathState(state.backup)) {
          await mkdir(path.dirname(state.destination), { recursive: true });
          await rename(state.backup, state.destination);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length === 0) {
      await rm(transactionRoot, { recursive: true, force: true });
      throw error;
    }
    throw new AggregateError(
      [error, ...rollbackErrors],
      "generated file transaction rollback failed; recovery data remains at " + transactionRoot,
    );
  }
  await rm(transactionRoot, { recursive: true, force: true });
  return Object.freeze({ files: destinations.length });
}

export async function writeCapabilityLayerAbi({
  root = new URL("../", import.meta.url),
} = {}) {
  const result = await rebuildCapabilityLayerAbi({ root });
  const writes = {
    ...result.files,
    [RECEIPT_PATH]: result.receiptText,
    [REPORT_PATH]: result.report,
  };
  await commitGeneratedFiles({
    rootPath: fileURLToPath(root),
    writes,
  });
  return result;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await writeCapabilityLayerAbi();
  process.stdout.write(JSON.stringify({
    status: result.receipt.status,
    canaries: result.bundles.length,
    receiptDigest: result.receipt.receiptDigest,
  }) + "\n");
}
