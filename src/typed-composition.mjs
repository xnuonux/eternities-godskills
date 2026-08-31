import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { validateActivationResult } from "./adaptive-activation-protocol.mjs";
import { canonicalJson } from "./capability-layer-abi.mjs";
import { sha256 } from "./io.mjs";

const DIGEST = /^[a-f0-9]{64}$/;
const MODES = new Set(["native", "guardrail", "method", "review"]);
const RISK_RANK = Object.freeze({ low: 0, moderate: 1, high: 2 });
const EVIDENCE_RANK = Object.freeze({ unverified: 0, inferred: 1, verified: 2 });
const REGISTRY_PROVENANCE = new WeakMap();
const METHOD_PROVENANCE = new WeakMap();
const lexical = (left, right) => left < right ? -1 : left > right ? 1 : 0;

export class TypedCompositionError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "TypedCompositionError";
    this.code = code;
  }
}

function failure(code, message, cause) {
  return new TypedCompositionError(code, message, cause ? { cause } : undefined);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort(lexical).map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  return sha256(JSON.stringify(stable(value)));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function object(value, label, code = "plan-invalid") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw failure(code, `${label} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, label, code = "plan-invalid") {
  object(value, label, code);
  const actual = Object.keys(value).sort(lexical);
  const expected = [...keys].sort(lexical);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw failure(code, `${label} fields are not closed`);
  }
}

function nonEmptyString(value, label, code = "plan-invalid") {
  if (typeof value !== "string" || value.length === 0 || /[\0\r\n]/.test(value)) {
    throw failure(code, `${label} must be a non-empty single-line string`);
  }
  return value;
}

function requireDigest(value, label, code = "plan-invalid") {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    throw failure(code, `${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function positiveInteger(value, label, code = "plan-invalid") {
  if (!Number.isInteger(value) || value < 1) {
    throw failure(code, `${label} must be a positive integer`);
  }
  return value;
}

function closedStringArray(value, label, code, { allowEmpty = true, sort = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)
      || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw failure(code, `${label} must be a${allowEmpty ? "" : " non-empty"} string array`);
  }
  if (new Set(value).size !== value.length) {
    throw failure(code, `${label} must contain unique values`);
  }
  return sort ? [...value].sort(lexical) : [...value];
}

function same(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function normalizeNativePath(value) {
  if (typeof value === "string" && /^\/[a-z]:\//i.test(value)) return value.slice(1);
  return value;
}

function safeRelativePath(value, label, code = "registry-integrity") {
  nonEmptyString(value, label, code);
  const normalized = path.posix.normalize(value);
  if (value.includes("\\") || normalized !== value || value.startsWith("/")
      || /^[a-z]:/i.test(value) || value.split("/").includes("..") || /[?#]/.test(value)) {
    throw failure(code, `${label} must be a safe repository-relative path`);
  }
  return value;
}

function inside(root, target, label, code = "registry-integrity") {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
    return target;
  }
  throw failure(code, `${label} escapes the repository root`);
}

async function regularPath(filePath, label, code, { repositoryRoot } = {}) {
  try {
    const status = await lstat(filePath);
    if (!status.isFile() || status.isSymbolicLink()) {
      throw failure(code, `${label} must be a regular non-symlink file`);
    }
    const resolved = await realpath(filePath);
    if (repositoryRoot) inside(repositoryRoot, resolved, label, code);
    return resolved;
  } catch (error) {
    if (error instanceof TypedCompositionError) throw error;
    throw failure(code, `${label} cannot be resolved`, error);
  }
}

async function loadBytes(filePath, label, code, read, options) {
  const resolved = await regularPath(filePath, label, code, options);
  try {
    const value = await read(resolved);
    return Buffer.isBuffer(value) ? value : Buffer.from(value);
  } catch (error) {
    throw failure(code, `${label} cannot be read`, error);
  }
}

function parseJson(bytes, label, code) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw failure(code, `${label} is not valid JSON`, error);
  }
}

function descriptor(value, label, code = "registry-integrity") {
  exactKeys(value, ["path", "sha256", "bytes"], label, code);
  safeRelativePath(value.path, `${label} path`, code);
  requireDigest(value.sha256, `${label} SHA-256`, code);
  positiveInteger(value.bytes, `${label} bytes`, code);
  return value;
}

function receiptDescriptor(value, label, code = "policy-integrity") {
  exactKeys(value, ["path", "receiptDigest", "sha256", "bytes"], label, code);
  descriptor({ path: value.path, sha256: value.sha256, bytes: value.bytes }, label, code);
  requireDigest(value.receiptDigest, `${label} receipt digest`, code);
  return value;
}

async function loadRepositoryArtifact({
  repositoryRoot,
  row,
  label,
  read,
  code = "registry-integrity",
}) {
  descriptor({ path: row.path, sha256: row.sha256, bytes: row.bytes }, label, code);
  const target = inside(
    repositoryRoot,
    path.resolve(repositoryRoot, ...row.path.split("/")),
    label,
    code,
  );
  const bytes = await loadBytes(target, label, code, read, { repositoryRoot });
  if (bytes.length !== row.bytes || sha256(bytes) !== row.sha256) {
    throw failure(code, `${label} bytes do not match the trusted descriptor`);
  }
  return bytes;
}

function validatePolicy(policy) {
  const code = "policy-integrity";
  exactKeys(policy, [
    "schemaVersion", "protocolId", "policyId", "activationTrustRoot",
    "capabilityLayerReceipt", "phaseOrder", "effectVocabulary",
    "authorityVocabulary", "preconditionVocabulary", "jsonKinds", "capabilities",
    "effectConflicts", "limits",
  ], "typed composition policy", code);
  if (policy.schemaVersion !== 1 || policy.protocolId !== "eternities-typed-composition-policy-v1") {
    throw failure(code, "typed composition policy identity is unsupported");
  }
  nonEmptyString(policy.policyId, "typed composition policy id", code);
  receiptDescriptor(policy.activationTrustRoot, "activation trust root", code);
  receiptDescriptor(policy.capabilityLayerReceipt, "capability layer receipt", code);
  policy.phaseOrder = closedStringArray(policy.phaseOrder, "policy phase order", code, { allowEmpty: false, sort: false });
  policy.effectVocabulary = closedStringArray(policy.effectVocabulary, "policy effect vocabulary", code, { allowEmpty: false });
  policy.authorityVocabulary = closedStringArray(policy.authorityVocabulary, "policy authority vocabulary", code, { allowEmpty: false });
  policy.preconditionVocabulary = closedStringArray(policy.preconditionVocabulary, "policy precondition vocabulary", code, { allowEmpty: false });
  policy.jsonKinds = closedStringArray(policy.jsonKinds, "policy JSON kinds", code, { allowEmpty: false });
  if (!same(policy.jsonKinds, ["array", "object"])) {
    throw failure(code, "typed composition policy JSON kinds are unsupported");
  }
  if (!Array.isArray(policy.capabilities) || policy.capabilities.length < 1) {
    throw failure(code, "typed composition policy needs supported capabilities");
  }
  const capabilityIds = new Set();
  for (const [index, row] of policy.capabilities.entries()) {
    exactKeys(row, ["capabilityId", "allowedPhases"], `policy capability ${index}`, code);
    nonEmptyString(row.capabilityId, `policy capability ${index} id`, code);
    row.allowedPhases = closedStringArray(row.allowedPhases, `policy capability ${row.capabilityId} phases`, code, { allowEmpty: false });
    if (capabilityIds.has(row.capabilityId) || row.allowedPhases.some((phase) => !policy.phaseOrder.includes(phase))) {
      throw failure(code, "typed composition capability phases or identities are invalid");
    }
    capabilityIds.add(row.capabilityId);
  }
  policy.capabilities.sort((left, right) => lexical(left.capabilityId, right.capabilityId));
  if (!Array.isArray(policy.effectConflicts)) {
    throw failure(code, "policy effect conflicts must be an array");
  }
  policy.effectConflicts = policy.effectConflicts.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1]
        || pair.some((effect) => !policy.effectVocabulary.includes(effect))) {
      throw failure(code, `policy effect conflict ${index} is invalid`);
    }
    return [...pair].sort(lexical);
  }).sort((left, right) => lexical(left.join("\0"), right.join("\0")));
  if (new Set(policy.effectConflicts.map((pair) => pair.join("\0"))).size !== policy.effectConflicts.length) {
    throw failure(code, "policy effect conflicts must be unique");
  }
  exactKeys(policy.limits, [
    "maximumNodes", "maximumLinks", "maximumMissionInputs", "maximumMissionOutputs",
    "maximumContextBytes", "maximumCompiledMethodBytes",
  ], "typed composition limits", code);
  for (const [name, value] of Object.entries(policy.limits)) {
    positiveInteger(value, `typed composition limit ${name}`, code);
  }
  return policy;
}

function validateReceiptDigest(receipt, label, kind) {
  requireDigest(receipt?.receiptDigest, `${label} receipt digest`, "registry-integrity");
  const unsigned = structuredClone(receipt);
  delete unsigned.receiptDigest;
  const actual = kind === "canonical-file-body" ? sha256(canonicalJson(unsigned)) : digest(unsigned);
  if (actual !== receipt.receiptDigest) {
    throw failure("registry-integrity", `${label} logical receipt digest is invalid`);
  }
}

function layerRow(value, label) {
  exactKeys(value, ["name", "path", "sha256", "bytes", "disclosureModes"], label, "registry-integrity");
  descriptor({ path: value.path, sha256: value.sha256, bytes: value.bytes }, label);
  value.disclosureModes = closedStringArray(value.disclosureModes, `${label} disclosure modes`, "registry-integrity", { allowEmpty: false });
  nonEmptyString(value.name, `${label} name`, "registry-integrity");
  return value;
}

function manifestLayer(value, label) {
  exactKeys(value, ["path", "mediaType", "sha256", "bytes", "disclosureModes"], label, "registry-integrity");
  nonEmptyString(value.mediaType, `${label} media type`, "registry-integrity");
  descriptor({ path: value.path, sha256: value.sha256, bytes: value.bytes }, label);
  value.disclosureModes = closedStringArray(value.disclosureModes, `${label} disclosure modes`, "registry-integrity", { allowEmpty: false });
  if (path.posix.basename(value.path) !== value.path) {
    throw failure("registry-integrity", `${label} must use a contained basename`);
  }
  return value;
}

function validateManifest(manifest, capabilityId) {
  exactKeys(manifest, [
    "schemaVersion", "id", "capabilityId", "status", "policy", "sources", "layers",
    "compatibility", "capabilityGrantsAuthority", "proofLimits", "bundleDigest",
  ], `${capabilityId} manifest`, "registry-integrity");
  if (manifest.schemaVersion !== 1 || manifest.id !== `${capabilityId}-layer-bundle-v1`
      || manifest.capabilityId !== capabilityId || manifest.status !== "experimental-canary"
      || manifest.capabilityGrantsAuthority !== false) {
    throw failure("registry-integrity", `${capabilityId} manifest identity or authority is invalid`);
  }
  requireDigest(manifest.bundleDigest, `${capabilityId} bundle digest`, "registry-integrity");
  const unsigned = structuredClone(manifest);
  delete unsigned.bundleDigest;
  if (sha256(canonicalJson(unsigned)) !== manifest.bundleDigest) {
    throw failure("registry-integrity", `${capabilityId} manifest bundle digest is invalid`);
  }
  const expectedLayers = ["guardrails", "input", "method", "output", "reviewer", "route-card", "verifier"];
  exactKeys(manifest.layers, expectedLayers, `${capabilityId} manifest layers`, "registry-integrity");
  for (const name of expectedLayers) manifestLayer(manifest.layers[name], `${capabilityId} ${name} layer`);
  return manifest;
}

function validateRouteCard(route, capabilityId) {
  exactKeys(route, [
    "schemaVersion", "id", "family", "intent", "intentExamples", "negativeIntents",
    "successCondition", "effects", "authorityRequirements", "preconditions", "requires",
    "provides", "compatibleWith", "conflictsWith", "riskClass", "dependencyCost",
    "contextCost", "evidenceConfidence", "entrypoint", "legacyAliases",
  ], `${capabilityId} route card`, "registry-integrity");
  if (route.schemaVersion !== 1 || route.id !== capabilityId) {
    throw failure("registry-integrity", `${capabilityId} route card identity is invalid`);
  }
  for (const name of [
    "effects", "authorityRequirements", "preconditions", "requires", "provides",
    "compatibleWith", "conflictsWith", "negativeIntents", "legacyAliases",
  ]) {
    route[name] = closedStringArray(route[name], `${capabilityId} route ${name}`, "registry-integrity");
  }
  if (!(route.riskClass in RISK_RANK) || !(route.evidenceConfidence in EVIDENCE_RANK)) {
    throw failure("registry-integrity", `${capabilityId} route confidence or risk class is invalid`);
  }
  return route;
}

function validateGuardrails(value, capabilityId) {
  exactKeys(value, [
    "schemaVersion", "capabilityId", "successCondition", "effects", "negativeTriggers",
    "failureModes", "terminationConditions",
  ], `${capabilityId} guardrail layer`, "registry-integrity");
  if (value.schemaVersion !== 1 || value.capabilityId !== capabilityId) {
    throw failure("registry-integrity", `${capabilityId} guardrail identity is invalid`);
  }
}

function extractSlots(schema, capabilityId, direction) {
  exactKeys(schema, [
    "$schema", "$id", "title", "type", "additionalProperties", "required", "properties",
  ], `${capabilityId} ${direction} schema`, "registry-integrity");
  if (schema.type !== "object" || schema.additionalProperties !== false
      || !schema.properties || schema.properties.capabilityId?.const !== capabilityId
      || schema.properties.schemaVersion?.const !== 1) {
    throw failure("registry-integrity", `${capabilityId} ${direction} schema envelope is invalid`);
  }
  const slots = schema.properties.slots;
  exactKeys(slots, ["type", "additionalProperties", "required", "properties"], `${capabilityId} ${direction} slots`, "registry-integrity");
  if (slots.type !== "object" || slots.additionalProperties !== false
      || !Array.isArray(slots.required) || new Set(slots.required).size !== slots.required.length) {
    throw failure("registry-integrity", `${capabilityId} ${direction} slot contract is invalid`);
  }
  const propertyIds = Object.keys(slots.properties).sort(lexical);
  if (!same([...slots.required].sort(lexical), propertyIds)) {
    throw failure("registry-integrity", `${capabilityId} ${direction} slots must all be required`);
  }
  return propertyIds.map((slotId) => {
    const slot = slots.properties[slotId];
    exactKeys(slot, ["description", "type", "x-eternities-type"], `${capabilityId} ${direction} slot ${slotId}`, "registry-integrity");
    nonEmptyString(slot["x-eternities-type"], `${capabilityId} ${direction} slot type`, "registry-integrity");
    if (!new Set(["object", "array"]).has(slot.type)) {
      throw failure("registry-integrity", `${capabilityId} ${direction} slot JSON kind is invalid`);
    }
    return {
      slotId,
      typeId: slot["x-eternities-type"],
      jsonKind: slot.type,
    };
  });
}

function publicDescriptor(row) {
  return { path: row.path, sha256: row.sha256, bytes: row.bytes };
}

function fullLayerDescriptor(canary, name) {
  const row = canary.layers.find((candidate) => candidate.name === name);
  if (!row) throw failure("registry-integrity", `capability receipt is missing ${name}`);
  return publicDescriptor(row);
}

export async function loadTypedCompositionRegistry({
  repositoryRoot,
  policyPath,
  expectedPolicyDigest,
  read = readFile,
} = {}) {
  if (typeof repositoryRoot !== "string" || typeof policyPath !== "string" || typeof read !== "function") {
    throw failure("policy-integrity", "typed composition loader arguments are invalid");
  }
  requireDigest(expectedPolicyDigest, "expected composition policy digest", "policy-integrity");
  let root;
  try {
    root = await realpath(path.resolve(normalizeNativePath(repositoryRoot)));
  } catch (error) {
    throw failure("policy-integrity", "repository root cannot be resolved", error);
  }
  const resolvedPolicyPath = path.resolve(normalizeNativePath(policyPath));
  const policyBytes = await loadBytes(resolvedPolicyPath, "typed composition policy", "policy-integrity", read);
  if (sha256(policyBytes) !== expectedPolicyDigest) {
    throw failure("policy-integrity", "typed composition policy digest does not match exact bytes");
  }
  const policy = validatePolicy(parseJson(policyBytes, "typed composition policy", "policy-integrity"));
  if (policyBytes.toString("utf8") !== canonicalJson(policy)) {
    throw failure("policy-integrity", "typed composition policy is not canonical JSON");
  }

  const layerReceiptBytes = await loadRepositoryArtifact({
    repositoryRoot: root,
    row: policy.capabilityLayerReceipt,
    label: "capability layer receipt",
    read,
    code: "registry-integrity",
  });
  const layerReceipt = parseJson(layerReceiptBytes, "capability layer receipt", "registry-integrity");
  if (layerReceiptBytes.toString("utf8") !== canonicalJson(layerReceipt)) {
    throw failure("registry-integrity", "capability layer receipt is not canonical JSON");
  }
  validateReceiptDigest(layerReceipt, "capability layer", "canonical-file-body");
  if (layerReceipt.receiptDigest !== policy.capabilityLayerReceipt.receiptDigest) {
    throw failure("registry-integrity", "capability layer receipt root does not match policy");
  }

  const activationReceiptBytes = await loadRepositoryArtifact({
    repositoryRoot: root,
    row: policy.activationTrustRoot,
    label: "activation executable receipt",
    read,
    code: "registry-integrity",
  });
  const activationReceipt = parseJson(activationReceiptBytes, "activation executable receipt", "registry-integrity");
  validateReceiptDigest(activationReceipt, "activation executable", "logical");
  if (activationReceipt.receiptDigest !== policy.activationTrustRoot.receiptDigest
      || activationReceipt.protocolId !== "eternities-godskills-activation-v1"
      || activationReceipt.status !== "verified-build") {
    throw failure("registry-integrity", "activation executable trust root is invalid");
  }
  const activationPolicy = activationReceipt.artifacts?.find(({ role }) => role === "policy");
  const activationEvidence = activationReceipt.artifacts?.find(({ role }) => role === "evidence");
  if (!activationPolicy || !activationEvidence) {
    throw failure("registry-integrity", "activation executable receipt lacks policy or evidence roots");
  }
  requireDigest(activationPolicy.logicalDigest, "activation policy logical digest", "registry-integrity");
  requireDigest(activationEvidence.logicalDigest, "activation evidence logical digest", "registry-integrity");

  if (!Array.isArray(layerReceipt.canaries)) {
    throw failure("registry-integrity", "capability layer receipt canaries are invalid");
  }
  const receiptCanaries = new Map(layerReceipt.canaries.map((canary) => [canary.capabilityId, canary]));
  const policyIds = policy.capabilities.map(({ capabilityId }) => capabilityId);
  if (!same([...receiptCanaries.keys()].sort(lexical), [...policyIds].sort(lexical))) {
    throw failure("registry-integrity", "policy and capability receipt identities differ");
  }

  const metadata = new Map();
  const publicCapabilities = [];
  for (const policyCapability of policy.capabilities) {
    const capabilityId = policyCapability.capabilityId;
    const canary = receiptCanaries.get(capabilityId);
    exactKeys(canary, ["capabilityId", "layers", "manifest", "sources"], `${capabilityId} receipt canary`, "registry-integrity");
    if (!Array.isArray(canary.layers) || canary.layers.length !== 7) {
      throw failure("registry-integrity", `${capabilityId} receipt layer set is invalid`);
    }
    canary.layers.forEach((row, index) => layerRow(row, `${capabilityId} receipt layer ${index}`));
    if (new Set(canary.layers.map(({ name }) => name)).size !== canary.layers.length) {
      throw failure("registry-integrity", `${capabilityId} receipt layers are duplicated`);
    }
    exactKeys(canary.manifest, ["path", "sha256", "bytes", "bundleDigest"], `${capabilityId} manifest receipt row`, "registry-integrity");
    descriptor({ path: canary.manifest.path, sha256: canary.manifest.sha256, bytes: canary.manifest.bytes }, `${capabilityId} manifest receipt row`);
    requireDigest(canary.manifest.bundleDigest, `${capabilityId} receipt bundle digest`, "registry-integrity");
    const manifestBytes = await loadRepositoryArtifact({
      repositoryRoot: root,
      row: publicDescriptor(canary.manifest),
      label: `${capabilityId} manifest`,
      read,
    });
    const manifest = validateManifest(
      parseJson(manifestBytes, `${capabilityId} manifest`, "registry-integrity"),
      capabilityId,
    );
    if (manifestBytes.toString("utf8") !== canonicalJson(manifest)
        || manifest.bundleDigest !== canary.manifest.bundleDigest) {
      throw failure("registry-integrity", `${capabilityId} manifest bytes or bundle root changed`);
    }
    const bundleDirectory = path.posix.dirname(canary.manifest.path);
    for (const row of canary.layers) {
      const manifestRow = manifest.layers[row.name];
      if (!manifestRow || row.path !== `${bundleDirectory}/${manifestRow.path}`
          || row.sha256 !== manifestRow.sha256 || row.bytes !== manifestRow.bytes
          || !same(row.disclosureModes, manifestRow.disclosureModes)) {
        throw failure("registry-integrity", `${capabilityId} ${row.name} cross-file descriptor changed`);
      }
    }

    const parsed = {};
    for (const name of ["route-card", "guardrails", "input", "output"]) {
      const row = canary.layers.find((candidate) => candidate.name === name);
      const bytes = await loadRepositoryArtifact({
        repositoryRoot: root,
        row: publicDescriptor(row),
        label: `${capabilityId} ${name}`,
        read,
      });
      const value = parseJson(bytes, `${capabilityId} ${name}`, "registry-integrity");
      if (bytes.toString("utf8") !== canonicalJson(value)) {
        throw failure("registry-integrity", `${capabilityId} ${name} is not canonical JSON`);
      }
      parsed[name] = value;
    }
    const route = validateRouteCard(parsed["route-card"], capabilityId);
    validateGuardrails(parsed.guardrails, capabilityId);
    if (route.effects.some((effect) => !policy.effectVocabulary.includes(effect))
        || route.authorityRequirements.some((authority) => !policy.authorityVocabulary.includes(authority))
        || route.preconditions.some((precondition) => !policy.preconditionVocabulary.includes(precondition))) {
      throw failure("registry-integrity", `${capabilityId} route exceeds policy vocabulary`);
    }
    const inputSlots = extractSlots(parsed.input, capabilityId, "input");
    const outputSlots = extractSlots(parsed.output, capabilityId, "output");
    const layers = Object.fromEntries(
      canary.layers.map((row) => [row.name, publicDescriptor(row)]),
    );
    const capability = {
      capabilityId,
      allowedPhases: [...policyCapability.allowedPhases],
      bundleDigest: manifest.bundleDigest,
      manifest: publicDescriptor(canary.manifest),
      routeCard: layers["route-card"],
      inputContract: { ...layers.input, slots: inputSlots },
      outputContract: { ...layers.output, slots: outputSlots },
      activationLayers: {
        guardrail: layers.guardrails,
        method: layers.method,
        review: layers.reviewer,
      },
      compatibility: {
        compatibleWith: [...route.compatibleWith],
        conflictsWith: [...route.conflictsWith],
      },
      effects: [...route.effects],
      authorityRequirements: [...route.authorityRequirements],
      preconditions: [...route.preconditions],
      riskClass: route.riskClass,
      evidenceConfidence: route.evidenceConfidence,
    };
    publicCapabilities.push(capability);
    metadata.set(capabilityId, {
      ...capability,
      route,
      inputSlots: new Map(inputSlots.map((slot) => [slot.slotId, slot])),
      outputSlots: new Map(outputSlots.map((slot) => [slot.slotId, slot])),
    });
  }

  const unsigned = {
    schemaVersion: 1,
    protocolId: "eternities-typed-composition-registry-v1",
    policyId: policy.policyId,
    policyDigest: expectedPolicyDigest,
    capabilityLayerReceiptDigest: layerReceipt.receiptDigest,
    activationTrustRootDigest: activationReceipt.receiptDigest,
    activationPolicyDigest: activationPolicy.logicalDigest,
    activationEvidenceDigest: activationEvidence.logicalDigest,
    phaseOrder: [...policy.phaseOrder],
    capabilities: publicCapabilities,
  };
  const registry = deepFreeze({ ...unsigned, registryDigest: digest(unsigned) });
  REGISTRY_PROVENANCE.set(registry, {
    repositoryRoot: root,
    policy: deepFreeze(structuredClone(policy)),
    capabilities: metadata,
  });
  return registry;
}

function normalizeAuthority(value, code = "plan-invalid") {
  exactKeys(value, [
    "availableAuthority", "permittedEffects", "availablePreconditions", "maximumRisk",
    "minimumEvidenceConfidence", "contextBudget",
  ], "composition authority projection", code);
  const normalized = {
    availableAuthority: closedStringArray(value.availableAuthority, "available authority", code),
    permittedEffects: closedStringArray(value.permittedEffects, "permitted effects", code),
    availablePreconditions: closedStringArray(value.availablePreconditions, "available preconditions", code),
    maximumRisk: value.maximumRisk,
    minimumEvidenceConfidence: value.minimumEvidenceConfidence,
    contextBudget: value.contextBudget,
  };
  if (!(normalized.maximumRisk in RISK_RANK) || !(normalized.minimumEvidenceConfidence in EVIDENCE_RANK)) {
    throw failure(code, "composition authority risk or evidence class is invalid");
  }
  positiveInteger(normalized.contextBudget, "composition context budget", code);
  return normalized;
}

function normalizeProducer(value, label) {
  object(value, label);
  if (value.kind === "mission-input") {
    exactKeys(value, ["kind", "inputId"], label);
    nonEmptyString(value.inputId, `${label} input id`);
    return { kind: value.kind, inputId: value.inputId };
  }
  if (value.kind === "node-output") {
    exactKeys(value, ["kind", "nodeId", "slotId"], label);
    nonEmptyString(value.nodeId, `${label} node id`);
    nonEmptyString(value.slotId, `${label} slot id`);
    return { kind: value.kind, nodeId: value.nodeId, slotId: value.slotId };
  }
  throw failure("plan-invalid", `${label} kind is unsupported`);
}

function normalizeUnsignedPlan(value) {
  exactKeys(value, [
    "schemaVersion", "protocolId", "missionId", "policyDigest",
    "capabilityLayerReceiptDigest", "activationTrustRootDigest", "activationResultDigest",
    "authorityProjection", "maximumContextBytes", "missionInputs", "nodes", "links",
    "missionOutputs",
  ], "typed composition plan");
  if (value.schemaVersion !== 1 || value.protocolId !== "eternities-typed-composition-plan-v1") {
    throw failure("plan-invalid", "typed composition plan identity is unsupported");
  }
  nonEmptyString(value.missionId, "typed composition mission id");
  for (const name of [
    "policyDigest", "capabilityLayerReceiptDigest", "activationTrustRootDigest", "activationResultDigest",
  ]) requireDigest(value[name], `typed composition plan ${name}`);
  positiveInteger(value.maximumContextBytes, "typed composition context byte ceiling");
  const authorityProjection = normalizeAuthority(value.authorityProjection);
  if (!Array.isArray(value.missionInputs) || !Array.isArray(value.nodes)
      || !Array.isArray(value.links) || !Array.isArray(value.missionOutputs)) {
    throw failure("plan-invalid", "typed composition plan collections are invalid");
  }
  const missionInputs = value.missionInputs.map((row, index) => {
    exactKeys(row, ["artifactId", "typeId", "jsonKind"], `mission input ${index}`);
    nonEmptyString(row.artifactId, `mission input ${index} artifact id`);
    nonEmptyString(row.typeId, `mission input ${index} type id`);
    if (!new Set(["object", "array"]).has(row.jsonKind)) {
      throw failure("plan-invalid", `mission input ${index} JSON kind is invalid`);
    }
    return { ...row };
  }).sort((left, right) => lexical(left.artifactId, right.artifactId));
  const nodes = value.nodes.map((row, index) => {
    exactKeys(row, ["nodeId", "phase", "capabilityId", "activationDecisionDigest"], `composition node ${index}`);
    nonEmptyString(row.nodeId, `composition node ${index} id`);
    nonEmptyString(row.phase, `composition node ${index} phase`);
    nonEmptyString(row.capabilityId, `composition node ${index} capability`);
    requireDigest(row.activationDecisionDigest, `composition node ${index} activation decision`);
    return { ...row };
  }).sort((left, right) => lexical(left.nodeId, right.nodeId));
  const links = value.links.map((row, index) => {
    exactKeys(row, ["artifactId", "producer", "consumer"], `composition link ${index}`);
    nonEmptyString(row.artifactId, `composition link ${index} artifact id`);
    exactKeys(row.consumer, ["nodeId", "slotId"], `composition link ${index} consumer`);
    nonEmptyString(row.consumer.nodeId, `composition link ${index} consumer node`);
    nonEmptyString(row.consumer.slotId, `composition link ${index} consumer slot`);
    return {
      artifactId: row.artifactId,
      producer: normalizeProducer(row.producer, `composition link ${index} producer`),
      consumer: { ...row.consumer },
    };
  }).sort((left, right) => lexical(
    `${left.consumer.nodeId}\0${left.consumer.slotId}\0${left.artifactId}`,
    `${right.consumer.nodeId}\0${right.consumer.slotId}\0${right.artifactId}`,
  ));
  const missionOutputs = value.missionOutputs.map((row, index) => {
    exactKeys(row, ["outputId", "nodeId", "slotId"], `mission output ${index}`);
    for (const name of ["outputId", "nodeId", "slotId"]) {
      nonEmptyString(row[name], `mission output ${index} ${name}`);
    }
    return { ...row };
  }).sort((left, right) => lexical(left.outputId, right.outputId));
  return {
    schemaVersion: 1,
    protocolId: value.protocolId,
    missionId: value.missionId,
    policyDigest: value.policyDigest,
    capabilityLayerReceiptDigest: value.capabilityLayerReceiptDigest,
    activationTrustRootDigest: value.activationTrustRootDigest,
    activationResultDigest: value.activationResultDigest,
    authorityProjection,
    maximumContextBytes: value.maximumContextBytes,
    missionInputs,
    nodes,
    links,
    missionOutputs,
  };
}

export function sealTypedCompositionPlan(unsignedPlan) {
  const normalized = normalizeUnsignedPlan(structuredClone(unsignedPlan));
  return deepFreeze({ ...normalized, planDigest: digest(normalized) });
}

function validateSealedPlan(plan) {
  exactKeys(plan, [
    "schemaVersion", "protocolId", "missionId", "policyDigest",
    "capabilityLayerReceiptDigest", "activationTrustRootDigest", "activationResultDigest",
    "authorityProjection", "maximumContextBytes", "missionInputs", "nodes", "links",
    "missionOutputs", "planDigest",
  ], "sealed typed composition plan");
  requireDigest(plan.planDigest, "typed composition plan digest");
  const unsigned = structuredClone(plan);
  delete unsigned.planDigest;
  const resealed = sealTypedCompositionPlan(unsigned);
  if (!same(plan, resealed)) throw failure("plan-invalid", "typed composition plan digest or canonical ordering is invalid");
  return plan;
}

function trustedRegistry(registry) {
  const provenance = REGISTRY_PROVENANCE.get(registry);
  if (!provenance) throw failure("registry-integrity", "typed composition registry lacks trusted provenance");
  const unsigned = structuredClone(registry);
  delete unsigned.registryDigest;
  if (digest(unsigned) !== registry.registryDigest) {
    throw failure("registry-integrity", "typed composition registry digest changed");
  }
  return provenance;
}

function producerIdentity(producer) {
  return producer.kind === "mission-input"
    ? `mission-input:${producer.inputId}`
    : `node-output:${producer.nodeId}:${producer.slotId}`;
}

function detectCycle(nodes, edges) {
  const indegree = new Map(nodes.map(({ nodeId }) => [nodeId, 0]));
  const outgoing = new Map(nodes.map(({ nodeId }) => [nodeId, new Set()]));
  for (const [from, to] of edges) {
    if (!outgoing.get(from).has(to)) {
      outgoing.get(from).add(to);
      indegree.set(to, indegree.get(to) + 1);
    }
  }
  const queue = [...nodes.map(({ nodeId }) => nodeId).filter((id) => indegree.get(id) === 0)].sort(lexical);
  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift();
    visited += 1;
    for (const next of [...outgoing.get(current)].sort(lexical)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
      queue.sort(lexical);
    }
  }
  return visited !== nodes.length;
}

function activationLayer(capability, decision) {
  if (!MODES.has(decision.mode)) throw failure("activation-mismatch", "activation mode is unsupported");
  if (decision.mode === "native") {
    return { mode: "native", timing: "none", path: null, sha256: null, bytes: 0 };
  }
  const row = capability.activationLayers[decision.mode];
  return {
    mode: decision.mode,
    timing: decision.mode === "review" ? "post-artifact" : "pre-inference",
    ...row,
  };
}

function sortedUnion(rows) {
  return [...new Set(rows.flat())].sort(lexical);
}

export function compileTypedMissionMethod({ registry, plan, activationResult } = {}) {
  const provenance = trustedRegistry(registry);
  validateSealedPlan(plan);
  const { policy, capabilities } = provenance;
  if (plan.policyDigest !== registry.policyDigest
      || plan.capabilityLayerReceiptDigest !== registry.capabilityLayerReceiptDigest
      || plan.activationTrustRootDigest !== registry.activationTrustRootDigest) {
    throw failure("trust-mismatch", "composition plan trust roots do not match the registry");
  }
  if (plan.nodes.length < 1 || plan.nodes.length > policy.limits.maximumNodes
      || plan.links.length > policy.limits.maximumLinks
      || plan.missionInputs.length > policy.limits.maximumMissionInputs
      || plan.missionOutputs.length > policy.limits.maximumMissionOutputs) {
    throw failure("plan-invalid", "composition plan exceeds structural limits");
  }
  if (plan.authorityProjection.availableAuthority.some((value) => !policy.authorityVocabulary.includes(value))) {
    throw failure("authority-overflow", "composition plan uses authority outside the policy vocabulary");
  }
  if (plan.authorityProjection.permittedEffects.some((value) => !policy.effectVocabulary.includes(value))) {
    throw failure("effect-overflow", "composition plan uses effects outside the policy vocabulary");
  }
  if (plan.authorityProjection.availablePreconditions.some((value) => !policy.preconditionVocabulary.includes(value))) {
    throw failure("precondition-missing", "composition plan uses preconditions outside the policy vocabulary");
  }
  const nodeIds = new Set();
  const capabilityIds = new Set();
  const phaseOwners = new Map();
  for (const node of plan.nodes) {
    if (nodeIds.has(node.nodeId)) throw failure("plan-invalid", "composition node identities must be unique");
    nodeIds.add(node.nodeId);
    if (!capabilities.has(node.capabilityId) || capabilityIds.has(node.capabilityId)) {
      throw failure("capability-unsupported", "composition capability is unsupported or repeated");
    }
    capabilityIds.add(node.capabilityId);
    if (phaseOwners.has(node.phase)) {
      throw failure("phase-owner-conflict", "composition phase has more than one owner");
    }
    phaseOwners.set(node.phase, node.nodeId);
  }
  for (const node of plan.nodes) {
    const capability = capabilities.get(node.capabilityId);
    if (!policy.phaseOrder.includes(node.phase) || !capability.allowedPhases.includes(node.phase)) {
      throw failure("capability-unsupported", `${node.capabilityId} cannot own phase ${node.phase}`);
    }
  }
  const selectedCapabilities = plan.nodes.map((node) => capabilities.get(node.capabilityId));
  const compatibilityEvidence = [];
  for (let left = 0; left < selectedCapabilities.length; left += 1) {
    for (let right = left + 1; right < selectedCapabilities.length; right += 1) {
      const one = selectedCapabilities[left];
      const two = selectedCapabilities[right];
      const compatible = one.compatibility.compatibleWith.includes(two.capabilityId)
        && two.compatibility.compatibleWith.includes(one.capabilityId)
        && !one.compatibility.conflictsWith.includes(two.capabilityId)
        && !two.compatibility.conflictsWith.includes(one.capabilityId);
      if (!compatible) throw failure("compatibility-conflict", `${one.capabilityId} and ${two.capabilityId} are not mutually compatible`);
      compatibilityEvidence.push({ left: one.capabilityId, right: two.capabilityId, mutuallyCompatible: true });
    }
  }

  let activation;
  try {
    activation = validateActivationResult(activationResult);
  } catch (error) {
    throw failure("activation-mismatch", "activation result is structurally invalid", error);
  }
  if (activation.resultDigest !== plan.activationResultDigest
      || activation.trustRootDigest !== registry.activationTrustRootDigest
      || activation.policyDigest !== registry.activationPolicyDigest
      || activation.evidenceDigest !== registry.activationEvidenceDigest) {
    throw failure("activation-mismatch", "activation result roots do not match the composition plan");
  }
  const decisions = new Map(activation.decisions.map((decision) => [decision.selectedId, decision]));
  if (!same([...decisions.keys()].sort(lexical), [...capabilityIds].sort(lexical))) {
    throw failure("activation-mismatch", "activation selected set differs from composition nodes");
  }
  for (const node of plan.nodes) {
    const decision = decisions.get(node.capabilityId);
    if (decision.decisionDigest !== node.activationDecisionDigest
        || decision.authorityExpanded !== false
        || !same(decision.authorityProjection, plan.authorityProjection)) {
      throw failure("activation-mismatch", `${node.capabilityId} activation decision does not match the plan`);
    }
    if (decision.mode === "method"
        && !decision.reasonCodes.some((reason) => new Set(["explicit-method-request", "matched-method-advantage"]).has(reason))) {
      throw failure("activation-mismatch", `${node.capabilityId} method activation is not earned`);
    }
  }

  const nodes = new Map(plan.nodes.map((node) => [node.nodeId, node]));
  const missionInputRows = new Map();
  for (const input of plan.missionInputs) {
    if (missionInputRows.has(input.artifactId)) throw failure("plan-invalid", "mission input identities must be unique");
    missionInputRows.set(input.artifactId, input);
  }
  const artifactOwners = new Map();
  const consumerBindings = new Map();
  const edges = [];
  const resolvedLinks = [];
  for (const link of plan.links) {
    const consumerNode = nodes.get(link.consumer.nodeId);
    if (!consumerNode) throw failure("slot-invalid", "composition link consumer node is unknown");
    const consumerCapability = capabilities.get(consumerNode.capabilityId);
    const consumerSlot = consumerCapability.inputSlots.get(link.consumer.slotId);
    if (!consumerSlot) throw failure("slot-invalid", "composition link consumer slot is unknown");
    let producerSlot;
    if (link.producer.kind === "mission-input") {
      producerSlot = missionInputRows.get(link.producer.inputId);
      if (!producerSlot) throw failure("slot-invalid", "composition mission input producer is unknown");
    } else {
      const producerNode = nodes.get(link.producer.nodeId);
      if (!producerNode) throw failure("slot-invalid", "composition producer node is unknown");
      const producerCapability = capabilities.get(producerNode.capabilityId);
      producerSlot = producerCapability.outputSlots.get(link.producer.slotId);
      if (!producerSlot) throw failure("slot-invalid", "composition producer output slot is unknown");
      edges.push([producerNode.nodeId, consumerNode.nodeId]);
    }
    const owner = producerIdentity(link.producer);
    const knownOwner = artifactOwners.get(link.artifactId);
    if (knownOwner && knownOwner !== owner) {
      throw failure("duplicate-artifact-owner", `artifact ${link.artifactId} has multiple producers`);
    }
    artifactOwners.set(link.artifactId, owner);
    const consumerKey = `${link.consumer.nodeId}\0${link.consumer.slotId}`;
    if (consumerBindings.has(consumerKey)) {
      throw failure("duplicate-input-binding", `input ${link.consumer.nodeId}.${link.consumer.slotId} has multiple links`);
    }
    consumerBindings.set(consumerKey, link);
    resolvedLinks.push({ link, producerSlot, consumerSlot });
  }
  if (detectCycle(plan.nodes, edges)) throw failure("cycle", "composition graph contains a cycle");
  for (const [from, to] of edges) {
    const fromIndex = policy.phaseOrder.indexOf(nodes.get(from).phase);
    const toIndex = policy.phaseOrder.indexOf(nodes.get(to).phase);
    if (fromIndex >= toIndex) {
      throw failure("phase-order-conflict", "composition dependency does not move forward in phase order");
    }
  }
  for (const { producerSlot, consumerSlot } of resolvedLinks) {
    if (producerSlot.typeId !== consumerSlot.typeId || producerSlot.jsonKind !== consumerSlot.jsonKind) {
      throw failure("type-mismatch", "composition link requires exact type and JSON-kind equality");
    }
  }
  for (const node of plan.nodes) {
    for (const slotId of capabilities.get(node.capabilityId).inputSlots.keys()) {
      if (!consumerBindings.has(`${node.nodeId}\0${slotId}`)) {
        throw failure("missing-input", `required input ${node.nodeId}.${slotId} has no producer`);
      }
    }
  }
  const outputIds = new Set();
  const consumedNodeOutputs = new Set(plan.links
    .filter(({ producer }) => producer.kind === "node-output")
    .map(({ producer }) => `${producer.nodeId}\0${producer.slotId}`));
  for (const output of plan.missionOutputs) {
    if (outputIds.has(output.outputId)) throw failure("plan-invalid", "mission output identities must be unique");
    outputIds.add(output.outputId);
    const node = nodes.get(output.nodeId);
    if (!node || !capabilities.get(node.capabilityId).outputSlots.has(output.slotId)) {
      throw failure("slot-invalid", "mission output refers to an unknown capability slot");
    }
    if (consumedNodeOutputs.has(`${output.nodeId}\0${output.slotId}`)) {
      throw failure("plan-invalid", "mission outputs must be terminal unconsumed artifacts");
    }
  }

  const aggregateEffects = sortedUnion(selectedCapabilities.map(({ effects }) => effects));
  const aggregateAuthority = sortedUnion(selectedCapabilities.map(({ authorityRequirements }) => authorityRequirements));
  const aggregatePreconditions = sortedUnion(selectedCapabilities.map(({ preconditions }) => preconditions));
  for (const pair of policy.effectConflicts) {
    if (pair.every((effect) => aggregateEffects.includes(effect))) {
      throw failure("effect-conflict", `composition effects conflict: ${pair.join(" + ")}`);
    }
  }
  if (aggregateEffects.some((effect) => !plan.authorityProjection.permittedEffects.includes(effect))) {
    throw failure("effect-overflow", "composition effects exceed the permitted projection");
  }
  if (aggregateAuthority.some((authority) => !plan.authorityProjection.availableAuthority.includes(authority))) {
    throw failure("authority-overflow", "composition authority requirements exceed the available projection");
  }
  if (aggregatePreconditions.some((precondition) => !plan.authorityProjection.availablePreconditions.includes(precondition))) {
    throw failure("precondition-missing", "composition preconditions are not satisfied");
  }
  if (selectedCapabilities.some(({ riskClass }) => RISK_RANK[riskClass] > RISK_RANK[plan.authorityProjection.maximumRisk])) {
    throw failure("risk-overflow", "composition risk exceeds the host ceiling");
  }
  if (selectedCapabilities.some(({ evidenceConfidence }) => EVIDENCE_RANK[evidenceConfidence] < EVIDENCE_RANK[plan.authorityProjection.minimumEvidenceConfidence])) {
    throw failure("evidence-below-floor", "composition evidence is below the host floor");
  }

  const orderedPlanNodes = [...plan.nodes].sort((left, right) => {
    const phase = policy.phaseOrder.indexOf(left.phase) - policy.phaseOrder.indexOf(right.phase);
    return phase || lexical(left.nodeId, right.nodeId);
  });
  let estimatedContextBytes = 0;
  const compiledNodes = orderedPlanNodes.map((node, index) => {
    const capability = capabilities.get(node.capabilityId);
    const decision = decisions.get(node.capabilityId);
    const disclosure = activationLayer(capability, decision);
    const contextBytes = capability.inputContract.bytes + capability.outputContract.bytes + disclosure.bytes;
    estimatedContextBytes += contextBytes;
    return {
      nodeId: node.nodeId,
      phase: node.phase,
      phaseIndex: policy.phaseOrder.indexOf(node.phase),
      order: index,
      capabilityId: node.capabilityId,
      bundleDigest: capability.bundleDigest,
      routeCard: capability.routeCard,
      inputContract: capability.inputContract,
      outputContract: capability.outputContract,
      activation: {
        decisionDigest: decision.decisionDigest,
        mode: decision.mode,
        reasonCodes: [...decision.reasonCodes],
        preInferenceDisclosure: decision.preInferenceDisclosure,
        deferredReview: decision.deferredReview,
        layer: disclosure,
      },
      effects: [...capability.effects],
      authorityRequirements: [...capability.authorityRequirements],
      preconditions: [...capability.preconditions],
      riskClass: capability.riskClass,
      evidenceConfidence: capability.evidenceConfidence,
      estimatedContextBytes: contextBytes,
    };
  });
  const activationByteCeiling = plan.authorityProjection.contextBudget * 4;
  if (plan.maximumContextBytes > policy.limits.maximumContextBytes
      || estimatedContextBytes > plan.maximumContextBytes
      || estimatedContextBytes > activationByteCeiling
      || estimatedContextBytes > policy.limits.maximumContextBytes) {
    throw failure("context-overflow", "composition disclosure exceeds a context byte ceiling");
  }

  const unsignedMethod = {
    schemaVersion: 1,
    protocolId: "eternities-typed-mission-method-v1",
    missionId: plan.missionId,
    policyDigest: registry.policyDigest,
    registryDigest: registry.registryDigest,
    capabilityLayerReceiptDigest: registry.capabilityLayerReceiptDigest,
    activationTrustRootDigest: registry.activationTrustRootDigest,
    activationResultDigest: activation.resultDigest,
    planDigest: plan.planDigest,
    authorityProjection: structuredClone(plan.authorityProjection),
    missionInputs: structuredClone(plan.missionInputs),
    nodes: compiledNodes,
    links: structuredClone(plan.links),
    missionOutputs: structuredClone(plan.missionOutputs),
    aggregate: {
      effects: aggregateEffects,
      authorityRequirements: aggregateAuthority,
      preconditions: aggregatePreconditions,
      riskClasses: sortedUnion(selectedCapabilities.map(({ riskClass }) => [riskClass])),
      evidenceConfidence: sortedUnion(selectedCapabilities.map(({ evidenceConfidence }) => [evidenceConfidence])),
      contractBytes: compiledNodes.reduce((sum, node) => sum + node.inputContract.bytes + node.outputContract.bytes, 0),
      selectedLayerBytes: compiledNodes.reduce((sum, node) => sum + node.activation.layer.bytes, 0),
      estimatedContextBytes,
      estimatedContextTokens: Math.ceil(estimatedContextBytes / 4),
      methodBodiesEmbedded: 0,
      sourceBodiesTransported: 0,
      authorityExpanded: false,
    },
    evidence: {
      compatibility: compatibilityEvidence,
      graph: {
        nodeCount: plan.nodes.length,
        linkCount: plan.links.length,
        topologicalOrder: compiledNodes.map(({ nodeId }) => nodeId),
        acyclic: true,
        phaseMonotonic: true,
        everyRequiredInputBoundOnce: true,
        everyArtifactHasOneProducer: true,
      },
    },
  };
  const method = { ...unsignedMethod, methodDigest: digest(unsignedMethod) };
  if (Buffer.byteLength(canonicalJson(method)) > policy.limits.maximumCompiledMethodBytes) {
    throw failure("method-overflow", "compiled typed mission method exceeds its byte ceiling");
  }
  deepFreeze(method);
  METHOD_PROVENANCE.set(method, {
    registryDigest: registry.registryDigest,
    canonical: canonicalJson(method),
  });
  return method;
}

export function verifyTypedMissionMethod({ registry, method } = {}) {
  trustedRegistry(registry);
  const provenance = METHOD_PROVENANCE.get(method);
  if (!provenance || provenance.registryDigest !== registry.registryDigest) {
    throw failure("method-integrity", "typed mission method lacks trusted compiler provenance");
  }
  const unsigned = structuredClone(method);
  const methodDigest = unsigned.methodDigest;
  delete unsigned.methodDigest;
  if (!DIGEST.test(methodDigest ?? "") || digest(unsigned) !== methodDigest
      || canonicalJson(method) !== provenance.canonical
      || method.registryDigest !== registry.registryDigest) {
    throw failure("method-integrity", "typed mission method identity changed");
  }
  return {
    valid: true,
    methodDigest,
    nodeCount: method.nodes.length,
    linkCount: method.links.length,
  };
}

function jsonKind(value) {
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) return "object";
  return null;
}

function validateJson(value, label, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (!value || typeof value !== "object" || seen.has(value)) {
    throw failure("execution-invalid", `${label} is not finite acyclic JSON data`);
  }
  seen.add(value);
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) validateJson(child, `${label}.${key}`, seen);
  seen.delete(value);
}

function requireValueKind(value, expected, label, code = "execution-invalid") {
  try {
    validateJson(value, label);
  } catch (error) {
    if (error instanceof TypedCompositionError && error.code !== code) {
      throw failure(code, error.message, error);
    }
    throw error;
  }
  if (jsonKind(value) !== expected) throw failure(code, `${label} must be a JSON ${expected}`);
}

function validateOutputEnvelope(output, node) {
  const code = "output-invalid";
  exactKeys(output, ["schemaVersion", "capabilityId", "missionId", "slots"], `${node.capabilityId} output`, code);
  if (output.schemaVersion !== 1 || output.capabilityId !== node.capabilityId
      || output.missionId !== node.missionId) {
    throw failure(code, `${node.capabilityId} output envelope identity is invalid`);
  }
  object(output.slots, `${node.capabilityId} output slots`, code);
  const expected = node.outputContract.slots.map(({ slotId }) => slotId).sort(lexical);
  if (!same(Object.keys(output.slots).sort(lexical), expected)) {
    throw failure(code, `${node.capabilityId} output slots are not closed and complete`);
  }
  for (const slot of node.outputContract.slots) {
    requireValueKind(output.slots[slot.slotId], slot.jsonKind, `${node.capabilityId}.${slot.slotId}`, code);
  }
}

export async function executeTypedMissionMethod({
  registry,
  method,
  missionInputs,
  executors,
} = {}) {
  verifyTypedMissionMethod({ registry, method });
  object(missionInputs, "typed mission inputs", "execution-invalid");
  object(executors, "typed mission executors", "executor-missing");
  const expectedInputs = method.missionInputs.map(({ artifactId }) => artifactId).sort(lexical);
  if (!same(Object.keys(missionInputs).sort(lexical), expectedInputs)) {
    throw failure("execution-invalid", "typed mission input set is not exact");
  }
  for (const input of method.missionInputs) {
    requireValueKind(missionInputs[input.artifactId], input.jsonKind, `mission input ${input.artifactId}`);
  }
  const expectedExecutors = method.nodes.map(({ capabilityId }) => capabilityId).sort(lexical);
  const actualExecutors = Object.keys(executors).sort(lexical);
  if (!same(actualExecutors, expectedExecutors)
      || expectedExecutors.some((capabilityId) => typeof executors[capabilityId] !== "function")) {
    throw failure("executor-missing", "typed mission requires exactly one executor per selected capability");
  }

  const nodeOutputs = new Map();
  const nodeExecutions = [];
  const handoffs = [];
  for (const node of method.nodes) {
    const nodeLinks = method.links.filter(({ consumer }) => consumer.nodeId === node.nodeId);
    const slots = {};
    for (const link of nodeLinks) {
      let value;
      if (link.producer.kind === "mission-input") {
        value = missionInputs[link.producer.inputId];
      } else {
        value = nodeOutputs.get(`${link.producer.nodeId}\0${link.producer.slotId}`);
      }
      if (value === undefined) throw failure("execution-invalid", `artifact ${link.artifactId} is unavailable at execution`);
      slots[link.consumer.slotId] = structuredClone(value);
      handoffs.push({
        artifactId: link.artifactId,
        producer: structuredClone(link.producer),
        consumer: structuredClone(link.consumer),
        valueDigest: digest(value),
      });
    }
    const input = deepFreeze({
      schemaVersion: 1,
      capabilityId: node.capabilityId,
      missionId: method.missionId,
      slots,
    });
    let output;
    try {
      output = await executors[node.capabilityId](input);
    } catch (error) {
      if (error instanceof TypedCompositionError) throw error;
      throw failure("execution-invalid", `${node.capabilityId} executor failed`, error);
    }
    validateOutputEnvelope(output, { ...node, missionId: method.missionId });
    const closedOutput = structuredClone(output);
    for (const [slotId, value] of Object.entries(closedOutput.slots)) {
      nodeOutputs.set(`${node.nodeId}\0${slotId}`, deepFreeze(structuredClone(value)));
    }
    nodeExecutions.push({
      nodeId: node.nodeId,
      capabilityId: node.capabilityId,
      activationDecisionDigest: node.activation.decisionDigest,
      inputDigest: digest(input),
      outputDigest: digest(closedOutput),
    });
  }
  const outputs = {};
  const outputEvidence = [];
  for (const output of method.missionOutputs) {
    const value = nodeOutputs.get(`${output.nodeId}\0${output.slotId}`);
    if (value === undefined) throw failure("execution-invalid", `mission output ${output.outputId} is unavailable`);
    outputs[output.outputId] = structuredClone(value);
    outputEvidence.push({ ...output, valueDigest: digest(value) });
  }
  const unsignedReceipt = {
    schemaVersion: 1,
    protocolId: "eternities-typed-composition-execution-v1",
    missionId: method.missionId,
    methodDigest: method.methodDigest,
    missionInputDigest: digest(missionInputs),
    nodeExecutions,
    handoffs,
    missionOutputs: outputEvidence,
    authorityExpanded: false,
  };
  const receipt = { ...unsignedReceipt, executionDigest: digest(unsignedReceipt) };
  return deepFreeze({ outputs, receipt });
}
