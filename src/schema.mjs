const EFFECTS = new Set(["none", "read", "write", "external-write"]);

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function versionOne(value, label) {
  object(value, label);
  if (value.schemaVersion !== 1) {
    throw new Error(`${label}.schemaVersion must be 1`);
  }
}

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function stringArray(value, field, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${field} must be an array of strings`);
  }
  if (nonEmpty && value.length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}

export function validateSourceRecord(value) {
  versionOne(value, "sourceRecord");
  for (const field of [
    "id",
    "name",
    "description",
    "sourcePath",
    "repositoryRoot",
    "licenseClass",
    "extractionMode",
  ]) {
    nonEmptyString(value[field], `sourceRecord.${field}`);
  }
  if (value.remote !== undefined && value.remote !== "") {
    nonEmptyString(value.remote, "sourceRecord.remote");
  }
  if (value.gitHead !== undefined && value.gitHead !== "") {
    if (!/^[0-9a-f]{40}$/i.test(value.gitHead)) {
      throw new Error("sourceRecord.gitHead must be a 40-character hex digest");
    }
  }
  return value;
}

export function validateCapabilityContract(value) {
  versionOne(value, "capabilityContract");
  for (const field of ["id", "category", "intent", "successCondition"]) {
    nonEmptyString(value[field], `capabilityContract.${field}`);
  }
  stringArray(value.negativeTriggers, "capabilityContract.negativeTriggers", {
    nonEmpty: true,
  });
  for (const field of [
    "inputs",
    "outputs",
    "operations",
    "effects",
    "positiveTriggers",
    "failureModes",
    "dependencies",
    "sourceIds",
  ]) {
    stringArray(value[field], `capabilityContract.${field}`, {
      nonEmpty: [
        "inputs",
        "outputs",
        "operations",
        "effects",
        "positiveTriggers",
        "failureModes",
        "sourceIds",
      ].includes(field),
    });
  }
  for (const effect of value.effects) {
    if (!EFFECTS.has(effect)) {
      throw new Error(`capabilityContract.effects contains invalid value: ${effect}`);
    }
  }
  if (value.sourceEvidence !== undefined) {
    const evidence = object(value.sourceEvidence, "capabilityContract.sourceEvidence");
    if (evidence.mode !== "cluster-review-v1") {
      throw new Error(`unknown source evidence mode: ${evidence.mode}`);
    }
    nonEmptyString(evidence.clusterSetId, "capabilityContract.sourceEvidence.clusterSetId");
    if (!Array.isArray(evidence.clusters) || evidence.clusters.length === 0) {
      throw new Error("capabilityContract.sourceEvidence.clusters must not be empty");
    }
    const clusterIds = [];
    for (const [index, cluster] of evidence.clusters.entries()) {
      object(cluster, `capabilityContract.sourceEvidence.clusters[${index}]`);
      nonEmptyString(cluster.id, `capabilityContract.sourceEvidence.clusters[${index}].id`);
      if (!/^[0-9a-f]{64}$/.test(cluster.digest)) {
        throw new Error(
          `capabilityContract.sourceEvidence.clusters[${index}].digest must be a lowercase SHA-256 digest`,
        );
      }
      clusterIds.push(cluster.id);
    }
    if (new Set(clusterIds).size !== clusterIds.length) {
      throw new Error("capabilityContract.sourceEvidence contains a duplicate cluster id");
    }
    if (clusterIds.some((id, index) => id !== [...clusterIds].sort()[index])) {
      throw new Error("capabilityContract.sourceEvidence cluster ids must be lexically sorted");
    }
  }
  return value;
}

export function validateEvaluation(value) {
  versionOne(value, "evaluation");
  nonEmptyString(value.status, "evaluation.status");
  for (const field of [
    "total",
    "passed",
    "criticalTotal",
    "criticalPassed",
    "tokenCount",
  ]) {
    if (!Number.isInteger(value[field]) || value[field] < 0) {
      throw new Error(`evaluation.${field} must be a non-negative integer`);
    }
  }
  if (value.passed > value.total) {
    throw new Error("evaluation.passed cannot exceed total");
  }
  if (value.criticalPassed > value.criticalTotal) {
    throw new Error("evaluation.criticalPassed cannot exceed criticalTotal");
  }
  if (typeof value.score !== "number" || value.score < 0 || value.score > 1) {
    throw new Error("evaluation.score must be between 0 and 1");
  }
  return value;
}

export function validateProfileLock(value) {
  versionOne(value, "profileLock");
  nonEmptyString(value.name, "profileLock.name");
  if (!Array.isArray(value.skills) || value.skills.length === 0) {
    throw new Error("profileLock.skills must be a non-empty array");
  }
  const names = new Set();
  for (const [index, skill] of value.skills.entries()) {
    object(skill, `profileLock.skills[${index}]`);
    for (const field of ["name", "source", "promotionReceipt"]) {
      nonEmptyString(skill[field], `profileLock.skills[${index}].${field}`);
    }
    const folded = skill.name.toLowerCase();
    if (names.has(folded)) {
      throw new Error(`duplicate skill name: ${skill.name}`);
    }
    names.add(folded);
  }
  return value;
}
