import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  LAYER_FILES,
  canonicalJson,
  verifyCapabilityLayerBundle,
} from "./capability-layer-abi.mjs";
import { sha256 } from "./io.mjs";
import { assertInside } from "./paths.mjs";

export const GODSKILL_PACKAGE_PROTOCOL = "eternities-godskill-package-v1";
export const GODSKILL_PACKAGE_SCHEMA_VERSION = 1;
export const GODSKILL_PACKAGE_ID = "eternities-aegis";
export const GODSKILL_PACKAGE_VERSION = 1;
export const GODSKILL_CAPABILITY_VERSION = 4;
export const GODSKILL_PACKAGE_MANIFEST_NAME = "manifest.v1.json";

const PACKAGE_MANIFEST_ID = "eternities-aegis-godskill-v1";
const PACKAGE_STATUS = "experimental-canary";
const LAYER_BUNDLE_DIGEST =
  "06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9";
const EXPECTED_EFFECTS = Object.freeze(["read", "write"]);
const EXPECTED_HOST_KINDS = Object.freeze(["agent-neutral"]);
const EXPECTED_PROTOCOLS = Object.freeze([GODSKILL_PACKAGE_PROTOCOL]);
const EXPECTED_PROOF_LIMITS = Object.freeze([
  "package-integrity-only",
  "no-source-execution",
  "no-authority-expansion",
  "no-external-mutation",
  "no-model-quality-claim",
]);
const EXPECTED_VERIFICATION = Object.freeze({
  authorityExpansionAllowed: false,
  contentIsInert: true,
  externalMutationAllowed: false,
  requiresArtifactBeforeReview: true,
  sourceExecutionAllowed: false,
});
const EXPECTED_POLICY = Object.freeze({
  schemaVersion: GODSKILL_PACKAGE_SCHEMA_VERSION,
  id: "godskill-package-policy-v1",
  protocolId: GODSKILL_PACKAGE_PROTOCOL,
  status: PACKAGE_STATUS,
  packageKind: "directory",
  capabilityGrantsAuthority: false,
  allowedEffects: EXPECTED_EFFECTS,
  requiredVerification: EXPECTED_VERIFICATION,
  proofLimits: EXPECTED_PROOF_LIMITS,
});

const EXPECTED_SOURCE_ARTIFACTS = Object.freeze([
  Object.freeze({
    id: "layer-policy",
    sourcePath: "policies/capability-layer-abi.v1.json",
    packagePath: "sources/layer-policy.json",
    role: "source-layer-policy",
    mediaType: "application/json",
  }),
  Object.freeze({
    id: "entrypoint",
    sourcePath: "skills/eternities-aegis/SKILL.md",
    packagePath: "sources/entrypoint.SKILL.md",
    role: "source-entrypoint",
    mediaType: "text/markdown",
  }),
  Object.freeze({
    id: "contract",
    sourcePath: "skills/eternities-aegis/references/capability-contract.json",
    packagePath: "sources/contract.json",
    role: "source-contract",
    mediaType: "application/json",
  }),
  Object.freeze({
    id: "operatingContract",
    sourcePath: "skills/eternities-aegis/references/operating-contract.md",
    packagePath: "sources/operating-contract.md",
    role: "source-operating-contract",
    mediaType: "text/markdown",
  }),
  Object.freeze({
    id: "routingCard",
    sourcePath: "skills/eternities-aegis/references/routing-card.json",
    packagePath: "sources/routing-card.json",
    role: "source-routing-card",
    mediaType: "application/json",
  }),
]);

const EXPECTED_LAYER_ARTIFACTS = Object.freeze([
  Object.freeze({
    fileName: "manifest.v1.json",
    role: "layer-manifest",
    mediaType: "application/json",
  }),
  Object.freeze({
    fileName: "route-card.v1.json",
    role: "layer-route-card",
    mediaType: "application/json",
  }),
  Object.freeze({
    fileName: "guardrails.v1.json",
    role: "layer-guardrails",
    mediaType: "application/json",
  }),
  Object.freeze({
    fileName: "method.v1.md",
    role: "layer-method",
    mediaType: "text/markdown",
  }),
  Object.freeze({
    fileName: "reviewer.v1.md",
    role: "layer-reviewer",
    mediaType: "text/markdown",
  }),
  Object.freeze({
    fileName: "verifier.v1.json",
    role: "layer-verifier",
    mediaType: "application/json",
  }),
  Object.freeze({
    fileName: "input.schema.json",
    role: "layer-input-schema",
    mediaType: "application/json",
  }),
  Object.freeze({
    fileName: "output.schema.json",
    role: "layer-output-schema",
    mediaType: "application/json",
  }),
]);

const EXPECTED_PROMOTION_EVIDENCE = Object.freeze({
  sourcePath: "receipts/promotions/eternities-aegis-v4.json",
  packagePath: "evidence/promotion-receipt.v4.json",
  role: "promotion-evidence",
  mediaType: "application/json",
});

const lexical = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(label + " must be an object");
  }
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(label + " keys are not closed");
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(label + " must be a non-empty string");
  }
}

function digest(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new TypeError(label + " must be a lowercase SHA-256 digest");
  }
}

function bytes(value, label) {
  if (!(value instanceof Uint8Array) || value.length === 0) {
    throw new TypeError(label + " must be non-empty bytes");
  }
  return Buffer.from(value);
}

function sameArray(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(label + " is invalid");
  }
}

function safePackagePath(value, label) {
  nonEmptyString(value, label);
  if (
    value.includes("\\")
    || value.includes("\0")
    || value.startsWith("/")
    || /^[a-z]:/i.test(value)
    || value.split("/").some((part) => part === "" || part === "." || part === "..")
    || path.posix.normalize(value) !== value
  ) {
    throw new Error(label + " is not a safe package-relative path");
  }
  return value;
}

function packagePath(packageDirectory, relativePath, label = "package path") {
  safePackagePath(relativePath, label);
  return assertInside(
    packageDirectory,
    path.resolve(packageDirectory, ...relativePath.split("/")),
  );
}

function parseJson(source, label) {
  const value = JSON.parse(Buffer.from(source).toString("utf8"));
  return value;
}

function parseCanonicalJson(source, label) {
  const value = parseJson(source, label);
  if (canonicalJson(value) !== Buffer.from(source).toString("utf8")) {
    throw new Error(label + " is not canonical JSON");
  }
  return value;
}

function sortedPaths(values) {
  return [...values].sort(lexical);
}

function assertUnique(values, label) {
  const unique = new Set(values);
  if (unique.size !== values.length) {
    throw new Error(label + " contains a duplicate");
  }
}

function expectedContentDefinitions() {
  const definitions = [
    {
      path: "policy/package.v1.json",
      role: "package-policy",
      mediaType: "application/json",
    },
    ...EXPECTED_LAYER_ARTIFACTS.map((item) => ({
      path: "layers/" + item.fileName,
      role: item.role,
      mediaType: item.mediaType,
    })),
    ...EXPECTED_SOURCE_ARTIFACTS.map((item) => ({
      path: item.packagePath,
      role: item.role,
      mediaType: item.mediaType,
    })),
    {
      path: EXPECTED_PROMOTION_EVIDENCE.packagePath,
      role: EXPECTED_PROMOTION_EVIDENCE.role,
      mediaType: EXPECTED_PROMOTION_EVIDENCE.mediaType,
    },
  ];
  return Object.freeze(definitions.sort((left, right) => lexical(left.path, right.path)));
}

const EXPECTED_CONTENT = expectedContentDefinitions();
const EXPECTED_CONTENT_PATHS = Object.freeze(EXPECTED_CONTENT.map((item) => item.path));
const EXPECTED_PACKAGE_PATHS = Object.freeze([
  GODSKILL_PACKAGE_MANIFEST_NAME,
  ...EXPECTED_CONTENT_PATHS,
]);

function validatePackagePolicy(policy) {
  exactKeys(
    policy,
    [
      "schemaVersion",
      "id",
      "protocolId",
      "status",
      "packageKind",
      "capabilityGrantsAuthority",
      "allowedEffects",
      "requiredVerification",
      "proofLimits",
    ],
    "godskill package policy",
  );
  if (policy.schemaVersion !== EXPECTED_POLICY.schemaVersion
      || policy.id !== EXPECTED_POLICY.id
      || policy.protocolId !== EXPECTED_POLICY.protocolId
      || policy.status !== EXPECTED_POLICY.status
      || policy.packageKind !== EXPECTED_POLICY.packageKind
      || policy.capabilityGrantsAuthority !== false) {
    throw new Error("godskill package policy identity or authority is invalid");
  }
  sameArray(policy.allowedEffects, EXPECTED_EFFECTS, "godskill package policy effects");
  exactKeys(
    policy.requiredVerification,
    Object.keys(EXPECTED_VERIFICATION),
    "godskill package policy verification",
  );
  if (JSON.stringify(policy.requiredVerification) !== JSON.stringify(EXPECTED_VERIFICATION)) {
    throw new Error("godskill package policy verification boundary is invalid");
  }
  sameArray(policy.proofLimits, EXPECTED_PROOF_LIMITS, "godskill package policy proof limits");
  return policy;
}

function validateSourceDefinitions(sourceArtifacts) {
  if (!Array.isArray(sourceArtifacts) || sourceArtifacts.length !== EXPECTED_SOURCE_ARTIFACTS.length) {
    throw new Error("godskill package source provenance count is invalid");
  }
  const ids = sourceArtifacts.map((item) => item.id);
  assertUnique(ids, "godskill package source provenance ids");
  for (const expected of EXPECTED_SOURCE_ARTIFACTS) {
    const actual = sourceArtifacts.find((item) => item.id === expected.id);
    if (!actual) throw new Error("godskill package source provenance is missing: " + expected.id);
    exactKeys(actual, ["id", "sourcePath", "packagePath", "sha256", "bytes"], "source provenance");
    if (actual.sourcePath !== expected.sourcePath || actual.packagePath !== expected.packagePath) {
      throw new Error("godskill package source provenance path changed: " + expected.id);
    }
    safePackagePath(actual.packagePath, "source provenance package path");
    digest(actual.sha256, "source provenance sha256");
    if (!Number.isInteger(actual.bytes) || actual.bytes <= 0) {
      throw new Error("source provenance byte count is invalid: " + expected.id);
    }
  }
}

function validateSourceInputs(sourceArtifacts) {
  if (!Array.isArray(sourceArtifacts) || sourceArtifacts.length !== EXPECTED_SOURCE_ARTIFACTS.length) {
    throw new Error("godskill package source input count is invalid");
  }
  const ids = sourceArtifacts.map((item) => item.id);
  assertUnique(ids, "godskill package source input ids");
  for (const expected of EXPECTED_SOURCE_ARTIFACTS) {
    const actual = sourceArtifacts.find((item) => item.id === expected.id);
    if (!actual) throw new Error("godskill package source input is missing: " + expected.id);
    exactKeys(actual, ["id", "sourcePath", "packagePath", "bytes"], "source input");
    if (actual.sourcePath !== expected.sourcePath || actual.packagePath !== expected.packagePath) {
      throw new Error("godskill package source input path changed: " + expected.id);
    }
    safePackagePath(actual.packagePath, "source input package path");
    bytes(actual.bytes, "source input bytes " + expected.id);
  }
}

function canonicalSourceInputs(sourceArtifacts) {
  validateSourceInputs(sourceArtifacts);
  return EXPECTED_SOURCE_ARTIFACTS.map((expected) => (
    sourceArtifacts.find((item) => item.id === expected.id)
  ));
}

function validateContentDefinitions(content) {
  if (!Array.isArray(content) || content.length !== EXPECTED_CONTENT.length) {
    throw new Error("godskill package content count is invalid");
  }
  const paths = content.map((item) => item.path);
  const roles = content.map((item) => item.role);
  assertUnique(paths, "godskill package content paths");
  assertUnique(roles, "godskill package content roles");
  if (JSON.stringify(paths) !== JSON.stringify(EXPECTED_CONTENT_PATHS)) {
    throw new Error("godskill package content paths are not the canonical inventory");
  }
  for (let index = 0; index < EXPECTED_CONTENT.length; index += 1) {
    const actual = content[index];
    const expected = EXPECTED_CONTENT[index];
    exactKeys(actual, ["path", "role", "mediaType", "bytes", "sha256"], "content entry");
    if (actual.path !== expected.path
        || actual.role !== expected.role
        || actual.mediaType !== expected.mediaType) {
      throw new Error("godskill package content identity changed: " + expected.path);
    }
    safePackagePath(actual.path, "content path");
    if (!Number.isInteger(actual.bytes) || actual.bytes <= 0) {
      throw new Error("content byte count is invalid: " + actual.path);
    }
    digest(actual.sha256, "content sha256");
  }
}

function contentRow(content, relativePath) {
  const row = content.find((item) => item.path === relativePath);
  if (!row) throw new Error("declared package content is missing: " + relativePath);
  return row;
}

function createContentRow(definition, source) {
  const value = bytes(source, definition.path);
  return Object.freeze({
    path: definition.path,
    role: definition.role,
    mediaType: definition.mediaType,
    bytes: value.length,
    sha256: sha256(value),
  });
}

function sourceMap(sourceArtifacts) {
  return new Map(sourceArtifacts.map((item) => [item.id, item]));
}

function validateCapabilitySource(contract, promotionEvidence, layerManifest) {
  exactKeys(contract, [
    "schemaVersion",
    "id",
    "name",
    "category",
    "intent",
    "successCondition",
    "inputs",
    "outputs",
    "operations",
    "effects",
    "positiveTriggers",
    "negativeTriggers",
    "failureModes",
    "dependencies",
    "sourceIds",
    "explicitOnly",
    "routes",
    "terminationConditions",
    "sourceEvidence",
  ], "Aegis capability contract");
  if (contract.schemaVersion !== 1 || contract.id !== "godskill-eternities-aegis-v4"
      || contract.name !== GODSKILL_PACKAGE_ID || contract.explicitOnly !== false) {
    throw new Error("Aegis capability contract identity is invalid");
  }
  sameArray(contract.effects, EXPECTED_EFFECTS, "Aegis capability effects");
  if (!promotionEvidence || typeof promotionEvidence !== "object"
      || promotionEvidence.skillName !== GODSKILL_PACKAGE_ID
      || promotionEvidence.version !== GODSKILL_CAPABILITY_VERSION
      || promotionEvidence.evidenceLevel !== "agentic-ci-source-to-sink-candidate-certified") {
    throw new Error("Aegis promotion evidence identity is invalid");
  }
  if (!layerManifest || layerManifest.capabilityId !== GODSKILL_PACKAGE_ID
      || layerManifest.bundleDigest !== LAYER_BUNDLE_DIGEST) {
    throw new Error("Aegis layer bundle identity is invalid");
  }
}

function packageBody(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError("godskill package manifest must be an object");
  }
  const { packageDigest: ignoredPackageDigest, attestation: ignoredAttestation, ...body } = manifest;
  void ignoredPackageDigest;
  void ignoredAttestation;
  return body;
}

export function canonicalPackageBody(manifest) {
  return canonicalJson(packageBody(manifest));
}

function validateManifestShape(manifest) {
  exactKeys(manifest, [
    "schemaVersion",
    "protocolId",
    "packageKind",
    "id",
    "packageId",
    "packageVersion",
    "capabilityVersion",
    "status",
    "capabilityGrantsAuthority",
    "content",
    "provenance",
    "compatibility",
    "verification",
    "policy",
    "attestation",
    "packageDigest",
  ], "godskill package manifest");
  if (manifest.schemaVersion !== GODSKILL_PACKAGE_SCHEMA_VERSION
      || manifest.protocolId !== GODSKILL_PACKAGE_PROTOCOL
      || manifest.packageKind !== "directory"
      || manifest.id !== PACKAGE_MANIFEST_ID
      || manifest.packageId !== GODSKILL_PACKAGE_ID
      || manifest.packageVersion !== GODSKILL_PACKAGE_VERSION
      || manifest.capabilityVersion !== GODSKILL_CAPABILITY_VERSION
      || manifest.status !== PACKAGE_STATUS
      || manifest.capabilityGrantsAuthority !== false) {
    throw new Error("godskill package manifest identity or authority is invalid");
  }
  validateContentDefinitions(manifest.content);
  if (!manifest.policy || typeof manifest.policy !== "object" || Array.isArray(manifest.policy)) {
    throw new TypeError("godskill package policy evidence is required");
  }
  exactKeys(manifest.policy, ["id", "path", "sourcePath", "sha256", "bytes"], "package policy evidence");
  if (manifest.policy.id !== EXPECTED_POLICY.id
      || manifest.policy.path !== "policy/package.v1.json"
      || manifest.policy.sourcePath !== "policies/godskill-package-v1.json") {
    throw new Error("package policy evidence identity is invalid");
  }
  safePackagePath(manifest.policy.path, "package policy path");
  digest(manifest.policy.sha256, "package policy sha256");
  if (!Number.isInteger(manifest.policy.bytes) || manifest.policy.bytes <= 0) {
    throw new Error("package policy byte count is invalid");
  }
  exactKeys(manifest.provenance, ["layerBundle", "sourceArtifacts", "promotionEvidence"], "package provenance");
  exactKeys(manifest.provenance.layerBundle, [
    "sourcePath",
    "packagePath",
    "bundleDigest",
    "sha256",
    "bytes",
  ], "layer bundle provenance");
  if (manifest.provenance.layerBundle.sourcePath
      !== "artifacts/capability-layers/eternities-aegis/manifest.v1.json"
      || manifest.provenance.layerBundle.packagePath !== "layers/manifest.v1.json") {
    throw new Error("layer bundle provenance identity is invalid");
  }
  safePackagePath(manifest.provenance.layerBundle.packagePath, "layer bundle package path");
  digest(manifest.provenance.layerBundle.bundleDigest, "layer bundle digest");
  digest(manifest.provenance.layerBundle.sha256, "layer bundle provenance sha256");
  if (!Number.isInteger(manifest.provenance.layerBundle.bytes)
      || manifest.provenance.layerBundle.bytes <= 0) {
    throw new Error("layer bundle provenance byte count is invalid");
  }
  validateSourceDefinitions(manifest.provenance.sourceArtifacts);
  exactKeys(manifest.provenance.promotionEvidence, [
    "sourcePath",
    "packagePath",
    "evidenceLevel",
    "sha256",
    "bytes",
  ], "promotion evidence provenance");
  if (manifest.provenance.promotionEvidence.sourcePath !== EXPECTED_PROMOTION_EVIDENCE.sourcePath
      || manifest.provenance.promotionEvidence.packagePath !== EXPECTED_PROMOTION_EVIDENCE.packagePath
      || manifest.provenance.promotionEvidence.evidenceLevel
      !== "agentic-ci-source-to-sink-candidate-certified") {
    throw new Error("promotion evidence provenance identity is invalid");
  }
  safePackagePath(manifest.provenance.promotionEvidence.packagePath, "promotion evidence package path");
  digest(manifest.provenance.promotionEvidence.sha256, "promotion evidence sha256");
  if (!Number.isInteger(manifest.provenance.promotionEvidence.bytes)
      || manifest.provenance.promotionEvidence.bytes <= 0) {
    throw new Error("promotion evidence byte count is invalid");
  }
  exactKeys(manifest.compatibility, ["hostKinds", "protocols", "effects", "maxCompositionDepth"], "package compatibility");
  sameArray(manifest.compatibility.hostKinds, EXPECTED_HOST_KINDS, "package compatibility host kinds");
  sameArray(manifest.compatibility.protocols, EXPECTED_PROTOCOLS, "package compatibility protocols");
  sameArray(manifest.compatibility.effects, EXPECTED_EFFECTS, "package compatibility effects");
  if (manifest.compatibility.maxCompositionDepth !== 3) {
    throw new Error("package compatibility composition bound is invalid");
  }
  exactKeys(manifest.verification, Object.keys(EXPECTED_VERIFICATION), "package verification boundary");
  if (JSON.stringify(manifest.verification) !== JSON.stringify(EXPECTED_VERIFICATION)) {
    throw new Error("package verification boundary is unsafe");
  }
  digest(manifest.packageDigest, "package digest");
  exactKeys(manifest.attestation, [
    "kind",
    "authorityId",
    "trustRootDigest",
    "subjectDigest",
    "status",
  ], "package attestation");
  if (manifest.attestation.kind !== "first-party-digest-attestation-v1"
      || manifest.attestation.authorityId !== "eternities-godskills"
      || manifest.attestation.status !== "attested") {
    throw new Error("package attestation identity is invalid");
  }
  digest(manifest.attestation.trustRootDigest, "attestation trust root digest");
  digest(manifest.attestation.subjectDigest, "attestation subject digest");
  return manifest;
}

function buildProvenance(sourceArtifacts, layerManifestBytes, promotionEvidenceBytes) {
  const sources = sourceArtifacts.map((source) => {
    const value = bytes(source.bytes, "source artifact " + source.id);
    return Object.freeze({
      id: source.id,
      sourcePath: source.sourcePath,
      packagePath: source.packagePath,
      sha256: sha256(value),
      bytes: value.length,
    });
  });
  const evidence = bytes(promotionEvidenceBytes, "promotion evidence");
  const layer = bytes(layerManifestBytes, "layer manifest");
  return Object.freeze({
    layerBundle: Object.freeze({
      sourcePath: "artifacts/capability-layers/eternities-aegis/manifest.v1.json",
      packagePath: "layers/manifest.v1.json",
      bundleDigest: LAYER_BUNDLE_DIGEST,
      sha256: sha256(layer),
      bytes: layer.length,
    }),
    sourceArtifacts: Object.freeze(sources),
    promotionEvidence: Object.freeze({
      sourcePath: EXPECTED_PROMOTION_EVIDENCE.sourcePath,
      packagePath: EXPECTED_PROMOTION_EVIDENCE.packagePath,
      evidenceLevel: "agentic-ci-source-to-sink-candidate-certified",
      sha256: sha256(evidence),
      bytes: evidence.length,
    }),
  });
}

export function buildGodskillPackageManifest({
  policyBytes,
  layerManifestBytes,
  layerFiles,
  sourceArtifacts,
  promotionEvidenceBytes,
}) {
  const policyValue = parseCanonicalJson(bytes(policyBytes, "package policy"), "package policy");
  validatePackagePolicy(policyValue);
  const layerManifest = parseCanonicalJson(
    bytes(layerManifestBytes, "layer manifest"),
    "layer manifest",
  );
  const promotionEvidence = parseJson(
    bytes(promotionEvidenceBytes, "promotion evidence"),
    "promotion evidence",
  );
  const orderedSourceArtifacts = canonicalSourceInputs(sourceArtifacts);
  const sources = sourceMap(orderedSourceArtifacts);
  const expectedLayerFiles = LAYER_FILES.filter((name) => name !== GODSKILL_PACKAGE_MANIFEST_NAME);
  if (!layerFiles || typeof layerFiles !== "object" || Array.isArray(layerFiles)) {
    throw new TypeError("layer files must be an object");
  }
  const actualLayerFiles = Object.keys(layerFiles).sort(lexical);
  const wantedLayerFiles = expectedLayerFiles.slice().sort(lexical);
  if (JSON.stringify(actualLayerFiles) !== JSON.stringify(wantedLayerFiles)) {
    throw new Error("layer files do not match the canonical layer inventory");
  }
  const contractSource = sources.get("contract");
  const contract = parseJson(bytes(contractSource.bytes, "Aegis contract"), "Aegis contract");
  validateCapabilitySource(contract, promotionEvidence, layerManifest);
  if (policyValue.allowedEffects.join("\0") !== contract.effects.join("\0")) {
    throw new Error("package policy effects do not match capability effects");
  }

  const packageFiles = new Map();
  packageFiles.set("policy/package.v1.json", bytes(policyBytes, "package policy"));
  packageFiles.set("layers/manifest.v1.json", bytes(layerManifestBytes, "layer manifest"));
  for (const fileName of expectedLayerFiles) {
    packageFiles.set("layers/" + fileName, bytes(layerFiles[fileName], "layer " + fileName));
  }
  for (const source of orderedSourceArtifacts) {
    packageFiles.set(source.packagePath, bytes(source.bytes, "source " + source.id));
  }
  packageFiles.set(
    EXPECTED_PROMOTION_EVIDENCE.packagePath,
    bytes(promotionEvidenceBytes, "promotion evidence"),
  );

  const content = EXPECTED_CONTENT.map((definition) => createContentRow(
    definition,
    packageFiles.get(definition.path),
  ));
  verifyLayerBundle({
    packageBytes: packageFiles,
    layerManifest,
    sourceArtifacts: sources,
  });
  const policyRow = contentRow(content, "policy/package.v1.json");
  const provenance = buildProvenance(
    orderedSourceArtifacts,
    layerManifestBytes,
    promotionEvidenceBytes,
  );
  const body = {
    schemaVersion: GODSKILL_PACKAGE_SCHEMA_VERSION,
    protocolId: GODSKILL_PACKAGE_PROTOCOL,
    packageKind: "directory",
    id: PACKAGE_MANIFEST_ID,
    packageId: GODSKILL_PACKAGE_ID,
    packageVersion: GODSKILL_PACKAGE_VERSION,
    capabilityVersion: GODSKILL_CAPABILITY_VERSION,
    status: PACKAGE_STATUS,
    capabilityGrantsAuthority: false,
    content,
    provenance,
    compatibility: {
      hostKinds: EXPECTED_HOST_KINDS,
      protocols: EXPECTED_PROTOCOLS,
      effects: EXPECTED_EFFECTS,
      maxCompositionDepth: 3,
    },
    verification: EXPECTED_VERIFICATION,
    policy: {
      id: EXPECTED_POLICY.id,
      path: policyRow.path,
      sourcePath: "policies/godskill-package-v1.json",
      sha256: policyRow.sha256,
      bytes: policyRow.bytes,
    },
  };
  const packageDigest = sha256(canonicalJson(body));
  const manifest = {
    ...body,
    attestation: {
      kind: "first-party-digest-attestation-v1",
      authorityId: "eternities-godskills",
      trustRootDigest: policyRow.sha256,
      subjectDigest: packageDigest,
      status: "attested",
    },
    packageDigest,
  };
  validateManifestShape(manifest);
  packageFiles.set(GODSKILL_PACKAGE_MANIFEST_NAME, Buffer.from(canonicalJson(manifest), "utf8"));
  return Object.freeze({
    manifest: Object.freeze(manifest),
    files: Object.freeze(Object.fromEntries(packageFiles.entries())),
    packageDigest,
  });
}

async function readBytes(filePath, read) {
  return bytes(await read(filePath), filePath);
}

async function readManifestFile(packageDirectory, read) {
  const rootMetadata = await lstat(packageDirectory);
  if (rootMetadata.isSymbolicLink()) {
    throw new Error("symbolic package roots are not allowed");
  }
  if (!rootMetadata.isDirectory()) {
    throw new Error("godskill package root must be a directory");
  }
  const manifestPath = packagePath(
    packageDirectory,
    GODSKILL_PACKAGE_MANIFEST_NAME,
    "manifest path",
  );
  const metadata = await lstat(manifestPath);
  if (metadata.isSymbolicLink()) {
    throw new Error("symbolic links are not allowed in a godskill package: " + manifestPath);
  }
  if (!metadata.isFile()) {
    throw new Error("package manifest must be a regular file");
  }
  const value = await readBytes(manifestPath, read);
  const text = value.toString("utf8");
  const manifest = JSON.parse(text);
  if (canonicalJson(manifest) !== text) {
    throw new Error("godskill package manifest is not canonical JSON");
  }
  return Object.freeze({ manifest, bytes: value });
}

async function enumeratePackageFiles(packageDirectory, current = packageDirectory) {
  if (current === packageDirectory) {
    const metadata = await lstat(current);
    if (metadata.isSymbolicLink()) {
      throw new Error("symbolic package roots are not allowed");
    }
    if (!metadata.isDirectory()) {
      throw new Error("godskill package root must be a directory");
    }
  }
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = packagePath(
      packageDirectory,
      path.relative(packageDirectory, path.join(current, entry.name)).replaceAll("\\", "/"),
      "enumerated package path",
    );
    if (entry.isSymbolicLink()) {
      throw new Error("symbolic links are not allowed in a godskill package: " + absolute);
    }
    if (entry.isDirectory()) {
      files.push(...await enumeratePackageFiles(packageDirectory, absolute));
    } else if (entry.isFile()) {
      files.push(path.relative(packageDirectory, absolute).replaceAll("\\", "/"));
    } else {
      throw new Error("non-regular package entry is not allowed: " + absolute);
    }
  }
  return files;
}

function validateExpectedPackageInventory(actual) {
  const sortedActual = sortedPaths(actual);
  const expected = sortedPaths(EXPECTED_PACKAGE_PATHS);
  if (JSON.stringify(sortedActual) !== JSON.stringify(expected)) {
    throw new Error("godskill package file inventory is not exact");
  }
}

async function compareSourceRoot({ sourceRoot, provenance, packageBytes, read }) {
  if (sourceRoot === undefined || sourceRoot === null) return;
  nonEmptyString(sourceRoot, "source root");
  const rows = [
    {
      sourcePath: "policies/godskill-package-v1.json",
      packagePath: "policy/package.v1.json",
    },
    {
      sourcePath: provenance.layerBundle.sourcePath,
      packagePath: provenance.layerBundle.packagePath,
    },
    ...provenance.sourceArtifacts.map((item) => ({
      sourcePath: item.sourcePath,
      packagePath: item.packagePath,
    })),
    {
      sourcePath: provenance.promotionEvidence.sourcePath,
      packagePath: provenance.promotionEvidence.packagePath,
    },
  ];
  for (const row of rows) {
    safePackagePath(row.sourcePath, "source provenance path");
    const sourcePath = assertInside(
      sourceRoot,
      path.resolve(sourceRoot, ...row.sourcePath.split("/")),
    );
    const sourceValue = await readBytes(sourcePath, read);
    const packageValue = packageBytes.get(row.packagePath);
    if (!packageValue || !sourceValue.equals(packageValue)) {
      throw new Error("package source bytes do not match canonical source: " + row.sourcePath);
    }
  }
}

function verifyLayerBundle({ packageBytes, layerManifest, sourceArtifacts }) {
  const layerPolicy = sourceArtifacts.get("layer-policy");
  const contract = sourceArtifacts.get("contract");
  const routingCard = sourceArtifacts.get("routingCard");
  const operatingContract = sourceArtifacts.get("operatingContract");
  const entrypoint = sourceArtifacts.get("entrypoint");
  const policy = parseJson(layerPolicy.bytes, "layer policy");
  const canary = policy.canaries?.find((item) => item.capabilityId === GODSKILL_PACKAGE_ID);
  if (!canary) throw new Error("Aegis capability layer canary is missing");
  const sources = {
    entrypoint: { path: entrypoint.sourcePath, bytes: entrypoint.bytes },
    contract: { path: contract.sourcePath, bytes: contract.bytes },
    operatingContract: { path: operatingContract.sourcePath, bytes: operatingContract.bytes },
    routingCard: { path: routingCard.sourcePath, bytes: routingCard.bytes },
  };
  const layerFiles = {};
  for (const fileName of LAYER_FILES) {
    const value = packageBytes.get("layers/" + fileName);
    if (!value) throw new Error("layer package file is missing: " + fileName);
    layerFiles[fileName] = value.toString("utf8");
  }
  verifyCapabilityLayerBundle({
    bundle: {
      capabilityId: GODSKILL_PACKAGE_ID,
      files: layerFiles,
      manifest: layerManifest,
    },
    policy,
    policySource: { path: layerPolicy.sourcePath, bytes: layerPolicy.bytes },
    canary,
    sources,
  });
}

export async function readGodskillPackageManifest({ packageDirectory, read = readFile }) {
  nonEmptyString(packageDirectory, "package directory");
  if (typeof read !== "function") throw new TypeError("package read function is required");
  return readManifestFile(packageDirectory, read);
}

export async function verifyGodskillPackageDirectory({
  packageDirectory,
  expectedPackageDigest,
  expectedPolicyDigest,
  sourceRoot,
  read = readFile,
}) {
  nonEmptyString(packageDirectory, "package directory");
  digest(expectedPackageDigest, "expected package digest");
  digest(expectedPolicyDigest, "expected policy digest");
  if (typeof read !== "function") throw new TypeError("package read function is required");

  const { manifest, bytes: manifestBytes } = await readManifestFile(packageDirectory, read);
  validateManifestShape(manifest);
  if (manifest.packageDigest !== expectedPackageDigest) {
    throw new Error("package manifest does not match the trusted package digest");
  }
  if (manifest.policy.sha256 !== expectedPolicyDigest
      || manifest.attestation.trustRootDigest !== expectedPolicyDigest) {
    throw new Error("package manifest does not match the trusted policy digest");
  }
  if (sha256(Buffer.from(canonicalPackageBody(manifest), "utf8")) !== manifest.packageDigest) {
    throw new Error("package digest does not match its canonical body");
  }
  if (manifest.attestation.subjectDigest !== manifest.packageDigest) {
    throw new Error("package attestation subject does not match the package digest");
  }

  const actualInventory = await enumeratePackageFiles(packageDirectory);
  validateExpectedPackageInventory(actualInventory);
  const packageBytes = new Map();
  for (const relativePath of EXPECTED_CONTENT_PATHS) {
    const row = contentRow(manifest.content, relativePath);
    const absolute = packagePath(packageDirectory, relativePath, "declared package path");
    const value = await readBytes(absolute, read);
    if (value.length !== row.bytes || sha256(value) !== row.sha256) {
      throw new Error("package content digest or byte count does not match: " + relativePath);
    }
    packageBytes.set(relativePath, value);
  }
  if (manifestBytes.length === 0 || !manifestBytes.equals(Buffer.from(canonicalJson(manifest), "utf8"))) {
    throw new Error("package manifest bytes changed during verification");
  }

  const policyBytes = packageBytes.get("policy/package.v1.json");
  const policy = parseCanonicalJson(policyBytes, "package policy");
  validatePackagePolicy(policy);
  if (manifest.policy.bytes !== policyBytes.length || manifest.policy.sha256 !== sha256(policyBytes)) {
    throw new Error("package policy evidence does not match exact bytes");
  }

  const layerManifestBytes = packageBytes.get("layers/manifest.v1.json");
  const layerManifest = parseCanonicalJson(layerManifestBytes, "layer manifest");
  const provenanceLayer = manifest.provenance.layerBundle;
  if (provenanceLayer.bundleDigest !== layerManifest.bundleDigest
      || provenanceLayer.sha256 !== sha256(layerManifestBytes)
      || provenanceLayer.bytes !== layerManifestBytes.length) {
    throw new Error("layer bundle provenance does not match exact package bytes");
  }

  const sourceArtifacts = new Map();
  for (const row of manifest.provenance.sourceArtifacts) {
    const value = packageBytes.get(row.packagePath);
    if (!value || value.length !== row.bytes || sha256(value) !== row.sha256) {
      throw new Error("source provenance does not match exact package bytes: " + row.id);
    }
    sourceArtifacts.set(row.id, {
      ...row,
      bytes: value,
    });
  }
  const evidence = packageBytes.get(manifest.provenance.promotionEvidence.packagePath);
  if (!evidence
      || evidence.length !== manifest.provenance.promotionEvidence.bytes
      || sha256(evidence) !== manifest.provenance.promotionEvidence.sha256) {
    throw new Error("promotion evidence provenance does not match exact package bytes");
  }
  const contract = parseJson(sourceArtifacts.get("contract").bytes, "Aegis contract");
  const promotionEvidence = parseJson(evidence, "promotion evidence");
  validateCapabilitySource(contract, promotionEvidence, layerManifest);
  verifyLayerBundle({ packageBytes, layerManifest, sourceArtifacts });
  await compareSourceRoot({
    sourceRoot,
    provenance: manifest.provenance,
    packageBytes,
    read,
  });
  return Object.freeze({
    valid: true,
    protocolId: manifest.protocolId,
    packageId: manifest.packageId,
    packageVersion: manifest.packageVersion,
    capabilityVersion: manifest.capabilityVersion,
    packageDigest: manifest.packageDigest,
    policyDigest: manifest.policy.sha256,
    contentCount: manifest.content.length,
    evidenceLevel: manifest.provenance.promotionEvidence.evidenceLevel,
    sourceExecutionAllowed: manifest.verification.sourceExecutionAllowed,
    externalMutationAllowed: manifest.verification.externalMutationAllowed,
    authorityExpansionAllowed: manifest.verification.authorityExpansionAllowed,
  });
}
