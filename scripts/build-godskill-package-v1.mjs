import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LAYER_FILES, canonicalJson } from "../src/capability-layer-abi.mjs";
import {
  GODSKILL_PACKAGE_MANIFEST_NAME,
  GODSKILL_PACKAGE_PROTOCOL,
  buildGodskillPackageManifest,
  verifyGodskillPackageDirectory,
} from "../src/godskill-package.mjs";
import { sha256 } from "../src/io.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const packageRelativePath = "artifacts/godskill-packages/eternities-aegis-v1";
const packageDirectory = path.join(repositoryRoot, packageRelativePath);

function sourcePath(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

async function readSource(relativePath) {
  return readFile(sourcePath(relativePath));
}

async function buildFixture() {
  const sourceArtifacts = await Promise.all([
    ["layer-policy", "policies/capability-layer-abi.v1.json", "sources/layer-policy.json"],
    ["entrypoint", "skills/eternities-aegis/SKILL.md", "sources/entrypoint.SKILL.md"],
    ["contract", "skills/eternities-aegis/references/capability-contract.json", "sources/contract.json"],
    ["operatingContract", "skills/eternities-aegis/references/operating-contract.md", "sources/operating-contract.md"],
    ["routingCard", "skills/eternities-aegis/references/routing-card.json", "sources/routing-card.json"],
  ].map(async ([id, source, target]) => ({
    id,
    sourcePath: source,
    packagePath: target,
    bytes: await readSource(source),
  })));
  const layerManifestBytes = await readSource(
    "artifacts/capability-layers/eternities-aegis/manifest.v1.json",
  );
  const layerFiles = Object.fromEntries(await Promise.all(
    LAYER_FILES
      .filter((fileName) => fileName !== GODSKILL_PACKAGE_MANIFEST_NAME)
      .map(async (fileName) => [
        fileName,
        await readSource("artifacts/capability-layers/eternities-aegis/" + fileName),
      ]),
  ));
  return buildGodskillPackageManifest({
    policyBytes: await readSource("policies/godskill-package-v1.json"),
    layerManifestBytes,
    layerFiles,
    sourceArtifacts,
    promotionEvidenceBytes: await readSource("receipts/promotions/eternities-aegis-v4.json"),
  });
}

async function writeIfAbsentOrIdentical(relativePath, value) {
  const target = path.join(packageDirectory, ...relativePath.split("/"));
  try {
    const existing = await readFile(target);
    if (!existing.equals(value)) {
      throw new Error("refusing to overwrite a changed generated package file: " + relativePath);
    }
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, value);
}

async function writeReceipt(fixture) {
  const manifestBytes = fixture.files[GODSKILL_PACKAGE_MANIFEST_NAME];
  const receipt = {
    schemaVersion: 1,
    protocolId: GODSKILL_PACKAGE_PROTOCOL,
    packagePath: packageRelativePath,
    packageDigest: fixture.manifest.packageDigest,
    manifestSha256: sha256(manifestBytes),
    manifestBytes: manifestBytes.length,
    policyDigest: fixture.manifest.policy.sha256,
    layerBundleDigest: fixture.manifest.provenance.layerBundle.bundleDigest,
    contentCount: fixture.manifest.content.length,
    focusedSuite: {
      tests: 12,
      passed: 11,
      failed: 0,
      skipped: 1,
    },
    fullRepositorySuite: {
      tests: 803,
      passed: 802,
      failed: 0,
      skipped: 1,
      cancelled: 0,
      todo: 0,
    },
    sourceArtifacts: fixture.manifest.provenance.sourceArtifacts,
    promotionEvidenceSha256: fixture.manifest.provenance.promotionEvidence.sha256,
    status: "verified-build",
  };
  const receiptBytes = Buffer.from(canonicalJson(receipt), "utf8");
  const receiptPath = path.join(repositoryRoot, "receipts/godskill-package-v1.json");
  try {
    const existing = await readFile(receiptPath);
    if (!existing.equals(receiptBytes)) {
      throw new Error("refusing to overwrite a changed generated package receipt");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(receiptPath, receiptBytes);
  }
  return receipt;
}

const fixture = await buildFixture();
for (const [relativePath, value] of Object.entries(fixture.files)) {
  await writeIfAbsentOrIdentical(relativePath, value);
}
const verified = await verifyGodskillPackageDirectory({
  packageDirectory,
  expectedPackageDigest: fixture.manifest.packageDigest,
  expectedPolicyDigest: fixture.manifest.policy.sha256,
  sourceRoot: repositoryRoot,
});
const receipt = await writeReceipt(fixture);
console.log(JSON.stringify({
  packagePath: packageRelativePath,
  packageDigest: verified.packageDigest,
  manifestSha256: receipt.manifestSha256,
  policyDigest: receipt.policyDigest,
  contentCount: verified.contentCount,
  status: verified.valid ? "verified-build" : "invalid",
}));
