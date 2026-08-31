import { sha256 } from "../src/io.mjs";

const VARIANT_LAYER = Object.freeze({
  raw: null,
  guardrail: "guardrails",
  method: "method",
  reviewer: "reviewer",
  combined: "reviewer",
});
const REVIEW_VARIANTS = new Set(["reviewer", "combined"]);
const TASK_KEYS = Object.freeze(["artifactContract", "id", "mission", "version"]);
const LAYER_KEYS = Object.freeze(["name", "path", "text", "sha256"]);
const PARENT_KEYS = Object.freeze([
  "variant",
  "artifactText",
  "expectedArtifactDigest",
  "expectedEvaluationDigest",
]);
const PARENT_VARIANT = Object.freeze({ reviewer: "raw", combined: "method" });
const DIGEST = /^[a-f0-9]{64}$/;

export const AEGIS_MATRIX_CONSTRUCTOR_TRUST = Object.freeze({
  taskDefinition: Object.freeze({
    sha256: "71dc6ba5957d7183e4e0f6d99c650d3244cc3e6808c111706b4c74df09f49aa7",
    bytes: 1797,
  }),
  layers: Object.freeze({
    guardrails: Object.freeze({
      path: "artifacts/capability-layers/eternities-aegis/guardrails.v1.json",
      sha256: "5210b632954d16b30f215f8f6869e08766c861f0c07a3c17b2da6cfaf61a1925",
      bytes: 1603,
    }),
    method: Object.freeze({
      path: "artifacts/capability-layers/eternities-aegis/method.v1.md",
      sha256: "5870b599b73361ec93d639c8fa809c97f674a3e2ef7b09dd48cfab63154b3b00",
      bytes: 17345,
    }),
    reviewer: Object.freeze({
      path: "artifacts/capability-layers/eternities-aegis/reviewer.v1.md",
      sha256: "e387aee8f7198dcba346621a854d67eb600bb7fd054545d31a1c1d690b7f4526",
      bytes: 1533,
    }),
  }),
});

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || JSON.stringify(Object.keys(value).sort(lexical))
        !== JSON.stringify([...expected].sort(lexical))) {
    throw new Error(`${label} keys are not closed`);
  }
}

function validateTaskDefinition(text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new TypeError("task definition text must be non-empty");
  }
  let task;
  try {
    task = JSON.parse(text);
  } catch {
    throw new Error("task definition text is not valid JSON");
  }
  exactKeys(task, TASK_KEYS, "task definition");
  for (const [name, value] of Object.entries(task)) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`task definition.${name} must be a non-empty string`);
    }
  }
  if (sha256(text) !== AEGIS_MATRIX_CONSTRUCTOR_TRUST.taskDefinition.sha256
      || Buffer.byteLength(text) !== AEGIS_MATRIX_CONSTRUCTOR_TRUST.taskDefinition.bytes) {
    throw new Error("trusted task definition bytes do not match");
  }
  return task;
}

function validateLayer(layer, expectedName) {
  if (expectedName === null) {
    if (layer !== null) throw new Error("raw prompt cannot receive an authorized layer");
    return null;
  }
  exactKeys(layer, LAYER_KEYS, "authorized layer");
  if (layer.name !== expectedName) {
    throw new Error(`authorized layer must be ${expectedName}`);
  }
  for (const field of ["path", "text", "sha256"]) {
    if (typeof layer[field] !== "string" || layer[field].trim() === "") {
      throw new Error(`authorized layer.${field} must be non-empty`);
    }
  }
  if (sha256(layer.text) !== layer.sha256) {
    throw new Error("authorized layer digest does not match its exact text");
  }
  const trusted = AEGIS_MATRIX_CONSTRUCTOR_TRUST.layers[expectedName];
  if (layer.path !== trusted.path || layer.sha256 !== trusted.sha256
      || Buffer.byteLength(layer.text) !== trusted.bytes) {
    throw new Error(`authorized ${expectedName} layer does not match the trusted matrix bytes`);
  }
  return layer;
}

function validateParent(parent, variant) {
  if (!REVIEW_VARIANTS.has(variant)) {
    if (parent !== null) throw new Error("construction prompt cannot receive a parent artifact");
    return null;
  }
  if (parent === null || parent === undefined) {
    throw new Error("review prompt requires the exact parent artifact");
  }
  exactKeys(parent, PARENT_KEYS, "prompt parent");
  const expectedVariant = PARENT_VARIANT[variant];
  if (parent.variant !== expectedVariant) {
    throw new Error(`${variant} parent variant must be ${expectedVariant}`);
  }
  if (typeof parent.artifactText !== "string" || parent.artifactText.trim() === "") {
    throw new Error("review prompt requires the exact parent artifact");
  }
  if (sha256(parent.artifactText) !== parent.expectedArtifactDigest) {
    throw new Error("parent artifact digest does not match its exact bytes");
  }
  if (!DIGEST.test(parent.expectedEvaluationDigest ?? "")) {
    throw new Error("parent evaluation digest must be a lowercase SHA-256 digest");
  }
  return Object.freeze({
    variant: parent.variant,
    artifactDigest: parent.expectedArtifactDigest,
    evaluationDigest: parent.expectedEvaluationDigest,
  });
}

export function constructAegisMatrixPrompt({
  variant,
  taskDefinitionText,
  authorizedLayer,
  parent,
} = {}) {
  if (!Object.hasOwn(VARIANT_LAYER, variant)) throw new Error("matrix prompt variant is invalid");
  validateTaskDefinition(taskDefinitionText);
  const layer = validateLayer(authorizedLayer, VARIANT_LAYER[variant]);
  const parentRecord = validateParent(parent, variant);
  const requiresParent = parentRecord !== null;

  const capabilityText = layer === null ? "none" : layer.text;
  const parentText = requiresParent ? parent.artifactText : "none";
  const parentProvenance = requiresParent ? JSON.stringify(parentRecord) : "none";
  const prompt = [
    "sealed evaluation task",
    "",
    "produce the requested artifact from only the bytes below. do not invoke tools, access files or networks, load skills, wake continuity systems, send messages, or seek outside context. do not describe your process. return only the artifact JSON required by the task definition.",
    "",
    "<task-definition>",
    taskDefinitionText,
    "</task-definition>",
    "",
    "<authorized-capability-material>",
    capabilityText,
    "</authorized-capability-material>",
    "",
    "<parent-provenance>",
    parentProvenance,
    "</parent-provenance>",
    "",
    "<parent-artifact>",
    parentText,
    "</parent-artifact>",
    "",
  ].join("\n");
  return Object.freeze({
    prompt,
    promptDigest: sha256(prompt),
    promptBytes: Buffer.byteLength(prompt),
    disclosedLayers: layer === null ? [] : [Object.freeze({
      name: layer.name,
      path: layer.path,
      sha256: layer.sha256,
      bytes: Buffer.byteLength(layer.text),
    })],
    parent: parentRecord,
  });
}
