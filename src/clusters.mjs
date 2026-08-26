import { sha256 } from "./io.mjs";
import { normalizeText } from "./catalog.mjs";

function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function groupBy(records, keyFor) {
  const groups = new Map();
  for (const record of records) {
    const key = keyFor(record);
    if (!key) continue;
    const rows = groups.get(key) ?? [];
    rows.push(record);
    groups.set(key, rows);
  }
  return groups;
}

function evidenceGroup(kind, key, rows, reason) {
  return {
    id: `${kind}-${sha256(key).slice(0, 16)}`,
    kind,
    reason,
    automaticMerge: false,
    normalizedNames: sortedUnique(
      rows.map((row) => normalizeText(row.normalizedName ?? row.name)),
    ),
    contentDigests: sortedUnique(rows.map((row) => row.contentDigest)),
    sourceIds: sortedUnique(rows.map((row) => row.id)),
  };
}

function sortedGroups(groups) {
  return groups.sort((left, right) => left.id.localeCompare(right.id));
}

export function findDuplicateGroups(records) {
  if (!Array.isArray(records)) throw new TypeError("records must be an array");

  const exact = [];
  for (const [key, rows] of groupBy(
    records,
    (record) =>
      record.contentDigest && normalizeText(record.normalizedName ?? record.name)
        ? `${normalizeText(record.normalizedName ?? record.name)}\u0000${record.contentDigest}`
        : "",
  )) {
    if (rows.length > 1) {
      exact.push(
        evidenceGroup(
          "exact",
          key,
          rows,
          "same normalized name and normalized capability-content digest",
        ),
      );
    }
  }

  const aliases = [];
  for (const [key, rows] of groupBy(records, (record) => record.contentDigest ?? "")) {
    const names = sortedUnique(
      rows.map((row) => normalizeText(row.normalizedName ?? row.name)),
    );
    if (rows.length > 1 && names.length > 1) {
      aliases.push(
        evidenceGroup(
          "alias",
          key,
          rows,
          "different normalized names share a normalized capability-content digest",
        ),
      );
    }
  }

  const candidates = [];
  for (const [key, rows] of groupBy(
    records,
    (record) => normalizeText(record.normalizedName ?? record.name),
  )) {
    const digests = sortedUnique(rows.map((row) => row.contentDigest));
    if (rows.length > 1 && digests.length > 1) {
      candidates.push(
        evidenceGroup(
          "candidate",
          key,
          rows,
          "same normalized name but differing behavior requires human or evaluated synthesis",
        ),
      );
    }
  }

  return {
    schemaVersion: 1,
    policy: "evidence-only-no-automatic-merge",
    exact: sortedGroups(exact),
    aliases: sortedGroups(aliases),
    candidates: sortedGroups(candidates),
  };
}
