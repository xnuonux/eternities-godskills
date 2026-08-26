import { sha256 } from "./io.mjs";
import { validateSourceRecord } from "./schema.mjs";

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function displayText(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
}

function normalizedArray(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError("catalog list fields must be arrays");
  return [...new Set(value.map(normalizeText).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function sourcePath(value) {
  return displayText(value).replaceAll("/", "\\");
}

function repositoryRoot(entry, normalizedSourcePath) {
  const explicit = sourcePath(entry.repository_root);
  if (explicit) return explicit;
  const segments = normalizedSourcePath.split("\\").filter(Boolean);
  return segments.length > 1 ? segments.slice(0, 2).join("\\") : "unknown";
}

function capabilityDigest(record) {
  return sha256(
    JSON.stringify({
      description: normalizeText(record.description),
      enhancedSummary: normalizeText(record.enhancedSummary),
      tags: record.tags,
      triggers: record.triggers,
      exclusions: record.exclusions,
      operations: record.operations,
      effects: record.effects,
      missingDescriptionSource:
        record.descriptionStatus === "missing" ? normalizeText(record.sourcePath) : "",
    }),
  );
}

function normalizeEntry(entry) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    throw new TypeError("catalog entry must be an object");
  }
  const normalizedSourcePath = sourcePath(entry.source_path);
  const indexedDescription = displayText(entry.description);
  const enhancedSummary = displayText(entry.enhanced_summary);
  const descriptionStatus = indexedDescription
    ? "indexed"
    : enhancedSummary
      ? "enhanced-summary"
      : "missing";
  const record = {
    schemaVersion: 1,
    id: displayText(entry.id),
    name: displayText(entry.name),
    normalizedName: normalizeText(entry.name),
    description:
      indexedDescription ||
      enhancedSummary ||
      `[description unavailable in certified index: ${displayText(entry.name)}]`,
    descriptionStatus,
    enhancedSummary,
    sourceCategory: normalizeText(entry.category) || "uncategorized",
    tags: normalizedArray(entry.tags),
    triggers: normalizedArray(entry.triggers),
    exclusions: normalizedArray(entry.exclusions),
    operations: normalizedArray(entry.operations),
    effects: normalizedArray(entry.effects),
    sourcePath: normalizedSourcePath,
    repositoryRoot: repositoryRoot(entry, normalizedSourcePath),
    remote: displayText(entry.remote),
    gitHead: normalizeText(entry.git_head),
    licenseClass: normalizeText(entry.license_class) || "unknown",
    licenseFiles: normalizedArray(entry.license_files),
    status: normalizeText(entry.status) || "raw",
    confidence: normalizeText(entry.confidence) || "unknown",
    extractionMode: normalizeText(entry.extraction_mode) || "adapted-source",
  };
  record.contentDigest = capabilityDigest(record);
  record.behaviorDigest = record.contentDigest;
  validateSourceRecord(record);
  return record;
}

export function normalizeIndex(index) {
  if (index === null || typeof index !== "object" || Array.isArray(index)) {
    throw new TypeError("index must be an object");
  }
  if (index.schema_version !== 1) {
    throw new Error("index.schema_version must be 1");
  }
  if (!Array.isArray(index.entries)) {
    throw new Error("index.entries must be an array");
  }
  if (!Number.isInteger(index.entry_count) || index.entry_count !== index.entries.length) {
    throw new Error("index.entry_count does not match entries");
  }

  const records = index.entries.map(normalizeEntry);
  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`duplicate source id: ${record.id}`);
    ids.add(record.id);
  }
  return records.sort((left, right) => left.id.localeCompare(right.id));
}
