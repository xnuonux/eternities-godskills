import { readFile } from "node:fs/promises";
import { canonicalText, sha256 } from "./io.mjs";
import path from "node:path";
import { assertInside } from "./paths.mjs";

export const LAYER_FILES = Object.freeze([
  "manifest.v1.json",
  "route-card.v1.json",
  "guardrails.v1.json",
  "method.v1.md",
  "reviewer.v1.md",
  "verifier.v1.json",
  "input.schema.json",
  "output.schema.json",
]);

const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const ACTIVATION_DISCLOSURE = Object.freeze({
  native: { expected: "none", files: [] },
  guardrail: { expected: "guardrails-only", files: ["guardrails.v1.json"] },
  method: { expected: "entrypoint-and-contract", files: ["method.v1.md"] },
  review: { expected: "none", files: ["reviewer.v1.md"] },
});
const LAYER_KEYS_BY_FILE = Object.freeze({
  "guardrails.v1.json": "guardrails",
  "method.v1.md": "method",
  "reviewer.v1.md": "reviewer",
});

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

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
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(label + " must be a non-empty string");
  }
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0
      || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new TypeError(label + " must be a non-empty string array");
  }
}

function byteBuffer(source, label) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new TypeError(label + " must be a source record");
  }
  exactKeys(source, ["path", "bytes"], label);
  if (!(source.bytes instanceof Uint8Array) || source.bytes.length === 0) {
    throw new TypeError(label + ".bytes must be non-empty bytes");
  }
  return Buffer.from(source.bytes);
}

function safeRelativePath(value, label) {
  nonEmptyString(value, label);
  const normalized = path.posix.normalize(value);
  if (value.includes("\\") || normalized !== value || value.startsWith("/")
      || /^[a-z]:/i.test(value) || value.split("/").includes("..")) {
    throw new Error(label + " is not a safe repository-relative source path");
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(stable(value), null, 2) + "\n";
}

function canonicalDigest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function sourceText(source) {
  return canonicalText(Buffer.from(source.bytes).toString("utf8")).trimEnd();
}

function sourceJson(source) {
  return JSON.parse(sourceText(source));
}

function validateSlots(slots, descriptions, label) {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new TypeError(label + " must be a non-empty array");
  }
  const ids = new Set();
  const typeIds = new Set();
  for (const [index, slot] of slots.entries()) {
    exactKeys(slot, ["id", "sourceIndex", "typeId", "jsonKind"], label + "[" + index + "]");
    nonEmptyString(slot.id, label + "[" + index + "].id");
    nonEmptyString(slot.typeId, label + "[" + index + "].typeId");
    if (ids.has(slot.id)) throw new Error(label + " contains a duplicate slot id");
    if (typeIds.has(slot.typeId)) throw new Error(label + " contains a duplicate slot type id");
    ids.add(slot.id);
    typeIds.add(slot.typeId);
    if (!Number.isInteger(slot.sourceIndex) || !descriptions[slot.sourceIndex]) {
      throw new Error(label + " contains an invalid source index");
    }
    if (!new Set(["object", "array"]).has(slot.jsonKind)) {
      throw new Error(label + " contains an invalid JSON kind");
    }
  }
}

function validateCompilerInput({ policy, policySource, canary, sources }) {
  exactKeys(policy, [
    "schemaVersion",
    "id",
    "status",
    "capabilityGrantsAuthority",
    "methodMode",
    "reviewerPolicy",
    "verifierPolicy",
    "proofLimits",
    "canaries",
  ], "capability layer policy");
  if (policy.schemaVersion !== 1 || policy.id !== "capability-layer-abi-v1"
      || policy.status !== "experimental-canary") {
    throw new Error("capability layer policy identity is invalid");
  }
  if (policy.capabilityGrantsAuthority !== false) {
    throw new Error("capability layer policy cannot grant authority");
  }
  if (policy.methodMode !== "entrypoint-contract-operating-contract-v1") {
    throw new Error("capability layer method mode is invalid");
  }
  exactKeys(policy.reviewerPolicy, [
    "artifactRequired",
    "selfCertificationAllowed",
    "sourceFields",
    "proofLimits",
  ], "reviewer policy");
  if (policy.reviewerPolicy.artifactRequired !== true
      || policy.reviewerPolicy.selfCertificationAllowed !== false) {
    throw new Error("reviewer policy must require an artifact and forbid self-certification");
  }
  stringArray(policy.reviewerPolicy.sourceFields, "reviewer policy source fields");
  stringArray(policy.reviewerPolicy.proofLimits, "reviewer policy proof limits");
  exactKeys(policy.verifierPolicy, [
    "initialStatus",
    "executedChecks",
    "observations",
    "sourceFields",
  ], "verifier policy");
  if (policy.verifierPolicy.initialStatus !== "declared-not-executed"
      || policy.verifierPolicy.executedChecks !== 0
      || !Array.isArray(policy.verifierPolicy.observations)
      || policy.verifierPolicy.observations.length !== 0) {
    throw new Error("verifier policy status must remain declared-not-executed");
  }
  stringArray(policy.verifierPolicy.sourceFields, "verifier policy source fields");
  stringArray(policy.proofLimits, "capability layer proof limits");

  byteBuffer(policySource, "policy source");
  if (safeRelativePath(policySource.path, "policy source path")
      !== "policies/capability-layer-abi.v1.json") {
    throw new Error("policy source path is not canonical");
  }
  if (canonicalJson(sourceJson(policySource)) !== canonicalJson(policy)) {
    throw new Error("policy source bytes do not match the provided policy");
  }
  if (!Array.isArray(policy.canaries) || policy.canaries.length !== 3) {
    throw new Error("capability layer policy requires exactly three canaries");
  }
  const canaryIds = policy.canaries.map(({ capabilityId }) => capabilityId);
  if (new Set(canaryIds).size !== canaryIds.length
      || JSON.stringify(canaryIds) !== JSON.stringify([...canaryIds].sort(lexical))) {
    throw new Error("capability layer policy canaries must be unique and sorted");
  }
  exactKeys(canary, ["capabilityId", "sources", "inputSlots", "outputSlots"], "policy canary");
  const authorized = policy.canaries.find(({ capabilityId }) => capabilityId === canary.capabilityId);
  if (!authorized || canonicalJson(authorized) !== canonicalJson(canary)) {
    throw new Error("policy canary does not match the exact policy entry");
  }
  exactKeys(canary.sources, ["entrypoint", "contract", "routingCard", "operatingContract"], "canary sources");
  exactKeys(sources, ["entrypoint", "contract", "routingCard", "operatingContract"], "source records");
  for (const [name, expectedPath] of Object.entries(canary.sources)) {
    safeRelativePath(expectedPath, "canary source path");
    byteBuffer(sources[name], "source record " + name);
    if (sources[name].path !== expectedPath) {
      throw new Error("source record path does not match canary policy: " + name);
    }
  }

  const contract = sourceJson(sources.contract);
  const routingCard = sourceJson(sources.routingCard);
  if (contract.schemaVersion !== 1 || contract.name !== canary.capabilityId) {
    throw new Error("capability contract identity does not match the canary");
  }
  if (routingCard.schemaVersion !== 1 || routingCard.id !== canary.capabilityId) {
    throw new Error("routing card identity does not match the canary");
  }
  for (const field of [
    "inputs",
    "outputs",
    "effects",
    "negativeTriggers",
    "failureModes",
    "terminationConditions",
  ]) {
    stringArray(contract[field], "capability contract " + field);
  }
  nonEmptyString(contract.successCondition, "capability contract successCondition");
  validateSlots(canary.inputSlots, contract.inputs, "input slots");
  validateSlots(canary.outputSlots, contract.outputs, "output slots");
  return { contract, routingCard };
}

function buildSlotSchema(capabilityId, direction, descriptions, slots) {
  const properties = Object.fromEntries(slots.map((slot) => [
    slot.id,
    {
      description: descriptions[slot.sourceIndex],
      type: slot.jsonKind,
      "x-eternities-type": slot.typeId,
    },
  ]));
  return {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:eternities:godskill:" + capabilityId + ":" + direction + ":v1",
    title: capabilityId + " " + direction + " envelope v1",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "capabilityId", "missionId", "slots"],
    properties: {
      schemaVersion: { const: 1 },
      capabilityId: { const: capabilityId },
      missionId: { type: "string", minLength: 1 },
      slots: {
        type: "object",
        additionalProperties: false,
        required: slots.map(({ id }) => id),
        properties,
      },
    },
  };
}

function renderMethod({ capabilityId, entrypoint, contract, operatingContract }) {
  return [
    "<!-- generated by capability-layer-abi-v1 from exact first-party sources -->",
    "",
    sourceText(entrypoint),
    "",
    "## bound capability contract",
    "",
    "```json",
    canonicalJson(contract).trimEnd(),
    "```",
    "",
    "## bound operating contract",
    "",
    sourceText(operatingContract),
    "",
    "<!-- capability: " + capabilityId + " -->",
    "",
  ].join("\n");
}

function bulletSection(title, values) {
  return ["## " + title, "", ...values.map((value) => "- " + value), ""];
}

function renderReviewer({ capabilityId, contract, policy }) {
  return [
    "# " + capabilityId + " reviewer v1",
    "",
    "artifact-required: " + String(policy.reviewerPolicy.artifactRequired),
    "self-certification-allowed: " + String(policy.reviewerPolicy.selfCertificationAllowed),
    "",
    "## success condition",
    "",
    contract.successCondition,
    "",
    ...bulletSection("required outputs", contract.outputs),
    ...bulletSection("rejection conditions", contract.failureModes),
    ...bulletSection("termination conditions", contract.terminationConditions),
    ...bulletSection("proof limits", policy.reviewerPolicy.proofLimits),
  ].join("\n");
}

function verifierChecks(contract) {
  const rows = [{
    id: "success-condition",
    sourceField: "successCondition",
    statement: contract.successCondition,
  }];
  for (const [index, statement] of contract.outputs.entries()) {
    rows.push({
      id: "required-output-" + String(index + 1).padStart(2, "0"),
      sourceField: "outputs[" + index + "]",
      statement,
    });
  }
  for (const [index, statement] of contract.failureModes.entries()) {
    rows.push({
      id: "rejection-" + String(index + 1).padStart(2, "0"),
      sourceField: "failureModes[" + index + "]",
      statement,
    });
  }
  for (const [index, statement] of contract.terminationConditions.entries()) {
    rows.push({
      id: "termination-" + String(index + 1).padStart(2, "0"),
      sourceField: "terminationConditions[" + index + "]",
      statement,
    });
  }
  return rows;
}

function layerDescriptor(path, mediaType, text, disclosureModes) {
  return {
    path,
    mediaType,
    sha256: sha256(text),
    bytes: Buffer.byteLength(text),
    disclosureModes,
  };
}

export function compileCapabilityLayerBundle({ policy, policySource, canary, sources }) {
  const capabilityId = canary.capabilityId;
  const { contract, routingCard } = validateCompilerInput({
    policy,
    policySource,
    canary,
    sources,
  });
  const guardrails = {
    schemaVersion: 1,
    capabilityId,
    successCondition: contract.successCondition,
    effects: contract.effects,
    negativeTriggers: contract.negativeTriggers,
    failureModes: contract.failureModes,
    terminationConditions: contract.terminationConditions,
  };
  const verifier = {
    schemaVersion: 1,
    capabilityId,
    status: policy.verifierPolicy.initialStatus,
    executedChecks: policy.verifierPolicy.executedChecks,
    observations: policy.verifierPolicy.observations,
    checks: verifierChecks(contract),
  };
  const nonManifest = {
    "route-card.v1.json": canonicalJson(routingCard),
    "guardrails.v1.json": canonicalJson(guardrails),
    "method.v1.md": renderMethod({
      capabilityId,
      entrypoint: sources.entrypoint,
      contract,
      operatingContract: sources.operatingContract,
    }),
    "reviewer.v1.md": renderReviewer({ capabilityId, contract, policy }),
    "verifier.v1.json": canonicalJson(verifier),
    "input.schema.json": canonicalJson(buildSlotSchema(
      capabilityId,
      "input",
      contract.inputs,
      canary.inputSlots,
    )),
    "output.schema.json": canonicalJson(buildSlotSchema(
      capabilityId,
      "output",
      contract.outputs,
      canary.outputSlots,
    )),
  };
  const modeMap = {
    "route-card.v1.json": ["selection"],
    "guardrails.v1.json": ["guardrail"],
    "method.v1.md": ["method"],
    "reviewer.v1.md": ["review-after-artifact"],
    "verifier.v1.json": ["verification"],
    "input.schema.json": ["contract"],
    "output.schema.json": ["contract"],
  };
  const mediaType = (name) => name.endsWith(".json")
    ? "application/json"
    : "text/markdown";
  const layers = Object.fromEntries(Object.entries(nonManifest).map(([name, text]) => [
    name.replace(/\.v1|\.schema/, "").replace(/\.(json|md)$/, ""),
    layerDescriptor(name, mediaType(name), text, modeMap[name]),
  ]));
  const sourceRecords = Object.fromEntries(Object.entries(sources).map(([name, source]) => [
    name,
    {
      path: source.path,
      sha256: sha256(source.bytes),
      bytes: source.bytes.length,
    },
  ]));
  const body = {
    schemaVersion: 1,
    id: capabilityId + "-layer-bundle-v1",
    capabilityId,
    status: "experimental-canary",
    policy: {
      path: policySource.path,
      sha256: sha256(policySource.bytes),
      bytes: policySource.bytes.length,
    },
    sources: sourceRecords,
    layers,
    compatibility: {
      legacyEntrypoint: canary.sources.entrypoint,
      legacyEntrypointUnchanged: true,
    },
    capabilityGrantsAuthority: false,
    proofLimits: policy.proofLimits,
  };
  const manifest = { ...body, bundleDigest: sha256(canonicalJson(body)) };
  const files = Object.freeze({
    ...nonManifest,
    "manifest.v1.json": canonicalJson(manifest),
  });
  return Object.freeze({ capabilityId, files, manifest: Object.freeze(manifest) });
}

export function verifyCapabilityLayerBundle({
  bundle,
  policy,
  policySource,
  canary,
  sources,
}) {
  const { contract, routingCard } = validateCompilerInput({
    policy,
    policySource,
    canary,
    sources,
  });
  exactKeys(bundle, ["capabilityId", "files", "manifest"], "compiled bundle");
  if (bundle.capabilityId !== canary.capabilityId) {
    throw new Error("compiled bundle capability identity does not match the canary");
  }
  exactKeys(bundle.files, LAYER_FILES, "compiled bundle files");
  exactKeys(bundle.manifest, [
    "schemaVersion",
    "id",
    "capabilityId",
    "status",
    "policy",
    "sources",
    "layers",
    "compatibility",
    "capabilityGrantsAuthority",
    "proofLimits",
    "bundleDigest",
  ], "layer manifest");
  const { bundleDigest, ...manifestBody } = bundle.manifest;
  if (bundleDigest !== sha256(canonicalJson(manifestBody))) {
    throw new Error("layer manifest bundle digest does not match its body");
  }
  if (bundle.manifest.schemaVersion !== 1
      || bundle.manifest.id !== canary.capabilityId + "-layer-bundle-v1"
      || bundle.manifest.capabilityId !== canary.capabilityId
      || bundle.manifest.status !== "experimental-canary"
      || bundle.manifest.capabilityGrantsAuthority !== false) {
    throw new Error("layer manifest identity or authority boundary is invalid");
  }
  exactKeys(bundle.manifest.policy, ["path", "sha256", "bytes"], "manifest policy");
  if (bundle.manifest.policy.path !== policySource.path
      || bundle.manifest.policy.sha256 !== sha256(policySource.bytes)
      || bundle.manifest.policy.bytes !== policySource.bytes.length) {
    throw new Error("manifest policy evidence does not match exact bytes");
  }
  exactKeys(bundle.manifest.sources, Object.keys(sources), "manifest sources");
  for (const [name, source] of Object.entries(sources)) {
    const row = bundle.manifest.sources[name];
    exactKeys(row, ["path", "sha256", "bytes"], "manifest source " + name);
    if (row.path !== source.path || row.sha256 !== sha256(source.bytes)
        || row.bytes !== source.bytes.length) {
      throw new Error("manifest source evidence does not match exact bytes: " + name);
    }
  }
  const expectedLayerNames = [
    "route-card",
    "guardrails",
    "method",
    "reviewer",
    "verifier",
    "input",
    "output",
  ];
  exactKeys(bundle.manifest.layers, expectedLayerNames, "manifest layers");
  for (const [name, row] of Object.entries(bundle.manifest.layers)) {
    exactKeys(row, ["path", "mediaType", "sha256", "bytes", "disclosureModes"], "layer " + name);
    safeRelativePath(row.path, "layer path");
    if (path.posix.basename(row.path) !== row.path || row.path === "manifest.v1.json") {
      throw new Error("layer path must be a contained non-manifest basename");
    }
    const text = bundle.files[row.path];
    if (typeof text !== "string" || row.sha256 !== sha256(text)
        || row.bytes !== Buffer.byteLength(text)) {
      throw new Error("layer digest or bytes do not match: " + name);
    }
  }
  if (bundle.files["manifest.v1.json"] !== canonicalJson(bundle.manifest)) {
    throw new Error("manifest file bytes do not match the parsed manifest");
  }
  if (bundle.files["route-card.v1.json"] !== canonicalJson(routingCard)) {
    throw new Error("route card output does not match its exact source");
  }
  const expected = compileCapabilityLayerBundle({
    policy,
    policySource,
    canary,
    sources,
  });
  for (const name of LAYER_FILES) {
    if (bundle.files[name] !== expected.files[name]) {
      throw new Error("compiled layer bytes do not match source-derived output: " + name);
    }
  }
  const guardrails = JSON.parse(bundle.files["guardrails.v1.json"]);
  exactKeys(guardrails, [
    "schemaVersion",
    "capabilityId",
    "successCondition",
    "effects",
    "negativeTriggers",
    "failureModes",
    "terminationConditions",
  ], "guardrail layer");
  const verifier = JSON.parse(bundle.files["verifier.v1.json"]);
  exactKeys(verifier, [
    "schemaVersion",
    "capabilityId",
    "status",
    "executedChecks",
    "observations",
    "checks",
  ], "verifier layer");
  if (verifier.status !== "declared-not-executed" || verifier.executedChecks !== 0
      || verifier.observations.length !== 0 || Object.hasOwn(verifier, "passed")) {
    throw new Error("verifier layer makes an unsupported execution claim");
  }
  for (const direction of ["input", "output"]) {
    const schema = JSON.parse(bundle.files[direction + ".schema.json"]);
    exactKeys(schema, [
      "$schema",
      "$id",
      "title",
      "type",
      "additionalProperties",
      "required",
      "properties",
    ], direction + " schema");
    if (schema.additionalProperties !== false
        || schema.properties.slots.additionalProperties !== false) {
      throw new Error(direction + " schema is not closed");
    }
  }
  if (contract.name !== canary.capabilityId) {
    throw new Error("verified contract identity changed during compilation");
  }
  return Object.freeze({
    valid: true,
    capabilityId: canary.capabilityId,
    sourceCount: Object.keys(sources).length,
    layerCount: Object.keys(bundle.manifest.layers).length,
  });
}

function validateActivationDecision(activationDecision, manifest) {
  if (!activationDecision || typeof activationDecision !== "object"
      || Array.isArray(activationDecision)) {
    throw new TypeError("a digest-bound activation decision is required");
  }
  const { decisionDigest, ...unsigned } = activationDecision;
  if (!/^[a-f0-9]{64}$/.test(decisionDigest ?? "")
      || canonicalDigest(unsigned) !== decisionDigest) {
    throw new Error("activation decision digest does not match its body");
  }
  const disclosure = ACTIVATION_DISCLOSURE[activationDecision.mode];
  if (!disclosure) throw new Error("activation decision mode is unknown");
  if (activationDecision.selectedId !== manifest.capabilityId) {
    throw new Error("activation decision capability does not match the manifest");
  }
  if (activationDecision.authorityExpanded !== false) {
    throw new Error("activation decision attempted to expand authority");
  }
  if (activationDecision.preInferenceDisclosure !== disclosure.expected) {
    throw new Error("activation decision disclosure contradicts its mode");
  }
  if (activationDecision.deferredReview !== (activationDecision.mode === "review")) {
    throw new Error("activation decision review phase is contradictory");
  }
  if (activationDecision.mode === "method") {
    const reasons = new Set(activationDecision.reasonCodes ?? []);
    if (!reasons.has("explicit-method-request")
        && !reasons.has("matched-method-advantage")) {
      throw new Error("method activation lacks explicit or matched evidence");
    }
  }
  return disclosure;
}

function validateReadableManifest(manifest) {
  exactKeys(manifest, [
    "schemaVersion",
    "id",
    "capabilityId",
    "status",
    "policy",
    "sources",
    "layers",
    "compatibility",
    "capabilityGrantsAuthority",
    "proofLimits",
    "bundleDigest",
  ], "readable layer manifest");
  const { bundleDigest, ...body } = manifest;
  if (bundleDigest !== sha256(canonicalJson(body))) {
    throw new Error("readable layer manifest digest does not match its body");
  }
  if (manifest.schemaVersion !== 1 || manifest.status !== "experimental-canary"
      || manifest.capabilityGrantsAuthority !== false) {
    throw new Error("readable layer manifest identity or authority is invalid");
  }
  return manifest;
}

export async function readCapabilityLayers({
  bundleDirectory,
  manifest,
  expectedBundleDigest,
  activationDecision,
  artifactAvailable = false,
  read = readFile,
}) {
  nonEmptyString(bundleDirectory, "bundle directory");
  if (typeof artifactAvailable !== "boolean" || typeof read !== "function") {
    throw new TypeError("layer read options are invalid");
  }
  validateReadableManifest(manifest);
  if (!/^[a-f0-9]{64}$/.test(expectedBundleDigest ?? "")
      || manifest.bundleDigest !== expectedBundleDigest) {
    throw new Error("manifest does not match the trusted bundle digest");
  }
  const disclosure = validateActivationDecision(activationDecision, manifest);
  if (activationDecision.mode === "review" && !artifactAvailable) {
    return Object.freeze({
      mode: activationDecision.mode,
      disclosed: Object.freeze([]),
      deferredReview: true,
    });
  }

  const disclosed = [];
  for (const fileName of disclosure.files) {
    const layerKey = LAYER_KEYS_BY_FILE[fileName];
    const layer = manifest.layers[layerKey];
    if (!layer || layer.path !== fileName) {
      throw new Error("activation layer is missing or has the wrong path: " + fileName);
    }
    safeRelativePath(layer.path, "activation layer path");
    const resolved = assertInside(bundleDirectory, path.resolve(bundleDirectory, layer.path));
    const value = await read(resolved);
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
    if (sha256(bytes) !== layer.sha256 || bytes.length !== layer.bytes) {
      throw new Error("activation layer digest or bytes do not match: " + fileName);
    }
    disclosed.push(Object.freeze({
      path: layer.path,
      sha256: layer.sha256,
      bytes,
    }));
  }
  return Object.freeze({
    mode: activationDecision.mode,
    disclosed: Object.freeze(disclosed),
    deferredReview: false,
  });
}
