export const COVERAGE_STAGES = Object.freeze([
  "indexed",
  "classified",
  "body-inspected",
  "card-reviewed",
  "provenance-certified",
  "clustered",
  "synthesized",
  "evaluated",
  "promoted",
]);

function uniqueBy(rows, keyFor, label) {
  const result = new Map();
  for (const row of rows ?? []) {
    const key = keyFor(row);
    if (typeof key !== "string" || key.trim() === "") {
      throw new Error(`${label} is missing its source id`);
    }
    if (result.has(key)) throw new Error(`duplicate ${label}: ${key}`);
    result.set(key, row);
  }
  return result;
}

function sortedFamilies(value) {
  if (!Array.isArray(value) || value.length === 0) return ["general"];
  return [...new Set(value)].sort((left, right) => left.localeCompare(right));
}

function bodyFields(body) {
  if (!body || body.status !== "inspected" || body.present !== true) {
    return {
      bodyStatus: body?.status ?? "not-audited",
      bodySha256: null,
      byteSize: null,
      lineCount: null,
    };
  }
  return {
    bodyStatus: "inspected",
    bodySha256: body.bodySha256,
    byteSize: body.byteSize,
    lineCount: body.lineCount,
  };
}

export function buildCoverageRows(records, bodyEvidence = [], provenanceRows = []) {
  if (!Array.isArray(records)) throw new TypeError("records must be an array");
  const sources = uniqueBy(records, (row) => row.id, "source id");
  const bodies = uniqueBy(bodyEvidence, (row) => row.sourceId, "body evidence source id");
  const provenance = uniqueBy(
    provenanceRows,
    (row) => row.sourceId,
    "provenance source id",
  );

  for (const sourceId of [...bodies.keys(), ...provenance.keys()]) {
    if (!sources.has(sourceId)) throw new Error(`unknown evidence source id: ${sourceId}`);
  }

  return [...sources.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((record) => {
      const body = bodies.get(record.id);
      const provenanceRow = provenance.get(record.id);
      if (provenanceRow && provenanceRow.contentDigest !== record.contentDigest) {
        throw new Error(`stale provenance digest for ${record.id}`);
      }
      const families = sortedFamilies(record.families);
      const inspected = body?.status === "inspected" && body?.present === true;
      return {
        schemaVersion: 1,
        sourceId: record.id,
        name: record.name,
        sourcePath: record.sourcePath,
        contentDigest: record.contentDigest,
        families,
        licenseClass: record.licenseClass ?? "unknown",
        confidence: record.confidence ?? "unknown",
        ...bodyFields(body),
        evidence: {
          indexed: true,
          classified: families.some((family) => family !== "general"),
          bodyInspected: inspected,
          cardReviewed: false,
          provenanceCertified: Boolean(provenanceRow),
          clustered: false,
          synthesized: false,
          evaluated: false,
          promoted: false,
        },
      };
    });
}

export function summarizeCoverage(rows) {
  if (!Array.isArray(rows)) throw new TypeError("rows must be an array");
  const ids = new Set();
  const familyCounts = {};
  const evidenceCounts = Object.fromEntries(
    COVERAGE_STAGES.map((stage) => [
      stage.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
      0,
    ]),
  );

  for (const row of rows) {
    if (ids.has(row.sourceId)) throw new Error(`duplicate coverage source id: ${row.sourceId}`);
    ids.add(row.sourceId);
    for (const family of row.families ?? ["general"]) {
      familyCounts[family] = (familyCounts[family] ?? 0) + 1;
    }
    for (const key of Object.keys(evidenceCounts)) {
      if (row.evidence?.[key] === true) evidenceCounts[key] += 1;
    }
  }

  return {
    schemaVersion: 1,
    sourceCount: rows.length,
    evidenceCounts,
    familyCounts: Object.fromEntries(
      Object.entries(familyCounts).sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}
