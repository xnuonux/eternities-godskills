import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalJson,
  compileCapabilityLayerBundle,
  LAYER_FILES,
  verifyCapabilityLayerBundle,
} from "../src/capability-layer-abi.mjs";
import { sha256 } from "../src/io.mjs";

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

let atomicSequence = 0;

async function writeTextAtomic(filePath, text) {
  const directory = path.dirname(filePath);
  atomicSequence += 1;
  const temporary = path.join(
    directory,
    "." + path.basename(filePath) + "." + process.pid + "." + atomicSequence + ".tmp",
  );
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
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
  for (const relative of Object.keys(writes).sort()) {
    await writeTextAtomic(fileURLToPath(new URL(relative, root)), writes[relative]);
  }
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
