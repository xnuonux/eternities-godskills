import { normalizeText } from "./catalog.mjs";

function searchableText(record) {
  return [
    record.name,
    record.description,
    record.enhancedSummary,
    record.sourcePath,
    ...(record.tags ?? []),
    ...(record.triggers ?? []),
    ...(record.operations ?? []),
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(text, keyword) {
  const normalized = normalizeText(keyword);
  if (!normalized) return false;
  const startsWithWord = /^[\p{L}\p{N}]/u.test(normalized);
  const endsWithWord = /[\p{L}\p{N}]$/u.test(normalized);
  const pattern = `${startsWithWord ? "(?:^|[^\\p{L}\\p{N}])" : ""}${escapeRegExp(normalized)}${endsWithWord ? "(?:$|[^\\p{L}\\p{N}])" : ""}`;
  return new RegExp(pattern, "u").test(text);
}

function keywordScore(text, keywords) {
  return keywords.reduce((score, keyword) => score + (containsKeyword(text, keyword) ? 1 : 0), 0);
}

export function classify(record, ontology) {
  if (ontology?.schemaVersion !== 1 || !Array.isArray(ontology.families)) {
    throw new Error("unsupported ontology");
  }
  const text = searchableText(record);
  const matches = ontology.families
    .map((family, order) => ({
      id: family.id,
      order,
      score: keywordScore(text, family.keywords ?? []),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.order - right.order);
  return matches.length > 0 ? matches.map(({ id }) => id) : ["general"];
}

export function summarizeOntology(records, ontology) {
  const familyCounts = Object.fromEntries([
    ...ontology.families.map(({ id }) => [id, 0]),
    ["general", 0],
  ]);
  const unclassifiedSourceIds = [];
  for (const record of [...records].sort((a, b) => a.id.localeCompare(b.id))) {
    const families = record.families?.length ? record.families : ["general"];
    for (const family of families) {
      familyCounts[family] = (familyCounts[family] ?? 0) + 1;
    }
    if (families.length === 1 && families[0] === "general") {
      unclassifiedSourceIds.push(record.id);
    }
  }
  return {
    schemaVersion: 1,
    ontologyVersion: ontology.version,
    sourceCount: records.length,
    familyCounts,
    unclassifiedSourceIds,
  };
}
