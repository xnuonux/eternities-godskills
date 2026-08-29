const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const EFFECTS = new Set(["none", "read", "write", "external-write"]);
const REQUIRED_CASE_KINDS = [
  "direct",
  "paraphrase",
  "contextual",
  "exclusion",
  "conflict",
  "authority",
  "effect",
  "failure",
  "termination",
];
const FORBIDDEN_AUTHORITY = /ambient|user[- ]intent|agent[- ]identity|product[- ]identity|model[- ]identity|inherited[- ]authority/i;
const PROVIDER_VOCABULARY = /\b(?:openai|anthropic|claude|gemini|grok|openrouter)\b/i;
const PRODUCT_AUTHORITY_VOCABULARY = /\b(?:lunari|luna)\b/i;

function asciiCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function string(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function digest(value, field) {
  if (typeof value !== "string" || !DIGEST_PATTERN.test(value)) throw new Error(`${field} must be a SHA-256 digest`);
  return value;
}

function strings(values, field, { sort = true } = {}) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${field} must be a non-empty array`);
  const normalized = values.map((value) => string(value, field));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} contains duplicates`);
  return sort ? normalized.sort(asciiCompare) : normalized;
}

function digests(values, field) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${field} must be a non-empty array`);
  const normalized = values.map((value) => digest(value, field)).sort(asciiCompare);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} contains duplicates`);
  return normalized;
}

function exact(left, right, label) {
  if (JSON.stringify(left) !== JSON.stringify(right)) throw new Error(`${label} does not match target`);
}

function collectStrings(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) for (const child of value) collectStrings(child, output);
  else if (value && typeof value === "object") for (const child of Object.values(value)) collectStrings(child, output);
  return output;
}

function normalizedProse(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function rejectCopiedSourceProse(record, sourceReviews) {
  const candidateStrings = collectStrings(record)
    .filter((value) => value.length >= 40)
    .map(normalizedProse);
  const sourceStrings = sourceReviews.flatMap((review) => collectStrings({
    neutralCapabilitySummary: review.neutralCapabilitySummary,
    neutralIntentExamples: review.neutralIntentExamples,
    inputs: review.inputs,
    operations: review.operations,
    outputs: review.outputs,
    failureBehavior: review.failureBehavior,
    exclusions: review.exclusions,
    usefulInvariants: review.usefulInvariants,
  })).filter((value) => value.length >= 40).map(normalizedProse);
  if (candidateStrings.some((candidate) => sourceStrings.some((source) =>
    candidate === source || (source.length >= 80 && candidate.includes(source))))) {
    throw new Error("copied source prose is forbidden");
  }
}

function validateSourceBinding(binding, target, sourceReviews) {
  if (!binding || typeof binding !== "object") throw new Error("sourceBinding must be an object");
  const normalized = {
    targetId: string(binding.targetId, "sourceBinding.targetId"),
    clusterDigest: digest(binding.clusterDigest, "sourceBinding.clusterDigest"),
    overlapDigest: digest(binding.overlapDigest, "sourceBinding.overlapDigest"),
    reviewDigests: digests(binding.reviewDigests, "sourceBinding.reviewDigests"),
    comparisonDigests: digests(binding.comparisonDigests, "sourceBinding.comparisonDigests"),
  };
  if (normalized.targetId !== target.targetId) throw new Error("sourceBinding targetId does not match target");
  if (normalized.clusterDigest !== target.clusterDigest) throw new Error("target cluster digest does not match source review binding");
  if (normalized.overlapDigest !== target.overlapDigest) throw new Error("sourceBinding overlapDigest does not match target");
  exact(normalized.reviewDigests, [...target.reviewDigests].sort(asciiCompare), "sourceBinding reviewDigests");
  exact(normalized.comparisonDigests, [...target.comparisonDigests].sort(asciiCompare), "sourceBinding comparisonDigests");
  const sourceReviewDigests = sourceReviews.map((review) => digest(review.reviewDigest, "sourceReview.reviewDigest")).sort(asciiCompare);
  exact(sourceReviewDigests, normalized.reviewDigests, "source review evidence");
  return normalized;
}

function validateEvaluationCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) throw new Error("evaluationCases must be a non-empty array");
  const ids = new Set();
  const kinds = new Map();
  const normalized = cases.map((entry) => {
    const id = string(entry?.id, "evaluationCases.id");
    if (ids.has(id)) throw new Error(`duplicate evaluation case: ${id}`);
    ids.add(id);
    const kind = string(entry.kind, "evaluationCases.kind");
    if (!REQUIRED_CASE_KINDS.includes(kind)) throw new Error(`unknown evaluation kind: ${kind}`);
    if (entry.critical !== true) throw new Error(`${kind} evaluation must be critical`);
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    return {
      id,
      kind,
      critical: true,
      prompt: string(entry.prompt, "evaluationCases.prompt"),
      expected: string(entry.expected, "evaluationCases.expected"),
    };
  });
  for (const kind of REQUIRED_CASE_KINDS) {
    if (!kinds.has(kind)) throw new Error(`missing critical evaluation kind: ${kind}`);
  }
  return normalized;
}

function validateImprovement(value) {
  if (!value || typeof value !== "object") throw new Error("measurableImprovement must be an object");
  return {
    baseline: string(value.baseline, "measurableImprovement.baseline"),
    metric: string(value.metric, "measurableImprovement.metric"),
    threshold: string(value.threshold, "measurableImprovement.threshold"),
  };
}

export function validateOperationalCapability(record, { target, sourceReviews = [] } = {}) {
  if (!record || record.schemaVersion !== 1) throw new Error("record schemaVersion must be 1");
  if (!target || target.kind !== "operational-skill") throw new Error("target must be an operational-skill construction target");
  const id = string(record.id, "id");
  if (!ID_PATTERN.test(id)) throw new Error("id must be lowercase kebab-case");
  if (id !== target.implementationOwnerId) throw new Error("id does not match target implementation owner");
  const title = string(record.title, "title");
  const description = string(record.description, "description");
  if (description.length > 420 || !/\buse\b/i.test(description) || !/\bdo not use\b/i.test(description)) {
    throw new Error("description must be discriminating and at most 420 characters");
  }
  const intent = string(record.intent, "intent");
  const ownerGodskillId = string(record.ownerGodskillId, "ownerGodskillId");
  if (ownerGodskillId !== target.categoricalOwnerId) throw new Error("owner does not match target categorical owner");
  const sourceBinding = validateSourceBinding(record.sourceBinding, target, sourceReviews);
  const supportingGodskillIds = strings(record.supportingGodskillIds, "supportingGodskillIds");
  const useWhen = strings(record.useWhen, "useWhen", { sort: false });
  const doNotUseWhen = strings(record.doNotUseWhen, "doNotUseWhen", { sort: false });
  const inputs = strings(record.inputs, "inputs", { sort: false });
  const operations = strings(record.operations, "operations", { sort: false });
  const outputs = strings(record.outputs, "outputs", { sort: false });
  const allowedEffects = strings(record.allowedEffects, "allowedEffects").map((effect) => {
    if (!EFFECTS.has(effect)) throw new Error(`unknown allowed effect: ${effect}`);
    return effect;
  });
  const requiredAuthority = strings(record.requiredAuthority, "requiredAuthority");
  if (requiredAuthority.some((value) => FORBIDDEN_AUTHORITY.test(value))) throw new Error("forbidden authority vocabulary");
  if (allowedEffects.includes("external-write") && !requiredAuthority.includes("external-effect")) {
    throw new Error("external-write requires explicit external-effect authority");
  }
  const forbiddenEffects = strings(record.forbiddenEffects, "forbiddenEffects");
  const preconditions = strings(record.preconditions, "preconditions", { sort: false });
  const failureBehavior = strings(record.failureBehavior, "failureBehavior", { sort: false });
  const exclusions = strings(record.exclusions, "exclusions", { sort: false });
  const terminationCondition = string(record.terminationCondition, "terminationCondition");
  const measurableImprovement = validateImprovement(record.measurableImprovement);
  const evaluationCases = validateEvaluationCases(record.evaluationCases);

  const searchableText = collectStrings({ description, intent, useWhen, doNotUseWhen, inputs, operations, outputs }).join(" ");
  if (PROVIDER_VOCABULARY.test(searchableText)) throw new Error("provider-specific vocabulary is forbidden");
  if (PRODUCT_AUTHORITY_VOCABULARY.test(searchableText)) throw new Error("product-specific authority vocabulary is forbidden");
  rejectCopiedSourceProse(record, sourceReviews);

  return {
    schemaVersion: 1,
    id,
    title,
    description,
    intent,
    ownerGodskillId,
    supportingGodskillIds,
    sourceBinding,
    useWhen,
    doNotUseWhen,
    inputs,
    operations,
    outputs,
    allowedEffects,
    requiredAuthority,
    forbiddenEffects,
    preconditions,
    failureBehavior,
    exclusions,
    terminationCondition,
    measurableImprovement,
    evaluationCases,
    capabilityDoesNotGrantAuthority: true,
    sourceProvenance: {
      sourceProseCopied: false,
      sourceInstructionsExecuted: false,
      independentlyWritten: true,
    },
  };
}

function bullets(values) {
  return values.map((value) => `- ${value}`).join("\n");
}

export function renderOperationalSkill(record) {
  const text = [
    "---",
    `name: ${record.id}`,
    `description: ${JSON.stringify(record.description)}`,
    "---",
    "",
    `# ${record.title}`,
    "",
    record.intent,
    "",
    "## use when",
    "",
    bullets(record.useWhen),
    "",
    "## do not use when",
    "",
    bullets(record.doNotUseWhen),
    "",
    "## inputs",
    "",
    bullets(record.inputs),
    "",
    "## preconditions",
    "",
    bullets(record.preconditions),
    "",
    "## workflow",
    "",
    record.operations.map((value, index) => `${index + 1}. ${value}`).join("\n"),
    "",
    "## outputs",
    "",
    bullets(record.outputs),
    "",
    "## authority and effects",
    "",
    "capability does not grant authority. the host must grant every required authority and effect separately.",
    "",
    `required authority: ${record.requiredAuthority.join(", ")}`,
    `allowed effects: ${record.allowedEffects.join(", ")}`,
    `forbidden effects: ${record.forbiddenEffects.join(", ")}`,
    "",
    "## failure behavior",
    "",
    bullets(record.failureBehavior),
    "",
    "## exclusions",
    "",
    bullets(record.exclusions),
    "",
    "## termination",
    "",
    record.terminationCondition,
    "",
  ].join("\n");
  if (Math.ceil(Buffer.byteLength(text, "utf8") / 4) > 1600) throw new Error("rendered operational entrypoint exceeds 1600 estimated tokens");
  return text;
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function materializeOperationalCapability({ record, target, sourceReviews = [] }) {
  const normalized = validateOperationalCapability(record, { target, sourceReviews });
  const contract = {
    schemaVersion: 1,
    id: `operational-${normalized.id}-v1`,
    name: normalized.id,
    category: target.familyId,
    tier: "operational-skill",
    ownerGodskillId: normalized.ownerGodskillId,
    supportingGodskillIds: normalized.supportingGodskillIds,
    intent: normalized.intent,
    successCondition: normalized.terminationCondition,
    inputs: normalized.inputs,
    outputs: normalized.outputs,
    operations: normalized.operations,
    effects: normalized.allowedEffects,
    capabilityDoesNotGrantAuthority: true,
    authority: {
      required: normalized.requiredAuthority,
      forbiddenEffects: normalized.forbiddenEffects,
    },
    preconditions: normalized.preconditions,
    positiveTriggers: normalized.useWhen,
    negativeTriggers: normalized.doNotUseWhen,
    failureModes: normalized.failureBehavior,
    exclusions: normalized.exclusions,
    terminationConditions: [normalized.terminationCondition],
    measurableImprovement: normalized.measurableImprovement,
    sourceEvidence: {
      mode: "wave2-target-v1",
      ...normalized.sourceBinding,
    },
    sourceProvenance: normalized.sourceProvenance,
  };
  const provenance = {
    schemaVersion: 1,
    provenanceId: `operational-${normalized.id}-provenance-v1`,
    skillId: normalized.id,
    ...normalized.sourceBinding,
    sourceProseCopied: false,
    sourceInstructionsExecuted: false,
    independentlyWritten: true,
  };
  const cases = {
    schemaVersion: 1,
    skillId: normalized.id,
    evaluationBoundary: "deterministic contract fixtures do not prove arbitrary live-agent interpretation or domain correctness",
    cases: normalized.evaluationCases,
  };
  return {
    "SKILL.md": renderOperationalSkill(normalized),
    "references/capability-contract.json": json(contract),
    "references/provenance.json": json(provenance),
    "evals/cases.json": json(cases),
  };
}

export function validateOperationalCapabilitySet(entries) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("operational capability set must be non-empty");
  const ids = new Set();
  const intents = new Set();
  return entries.map(({ record, target, sourceReviews }) => {
    const normalized = validateOperationalCapability(record, { target, sourceReviews });
    if (ids.has(normalized.id)) throw new Error(`duplicate operational capability id: ${normalized.id}`);
    ids.add(normalized.id);
    const intentKey = normalizedProse(normalized.intent);
    if (intents.has(intentKey)) throw new Error(`duplicate operational capability intent: ${normalized.intent}`);
    intents.add(intentKey);
    return normalized;
  });
}
