function uniqueBy(rows, keyFor, label) {
  const values = new Map();
  for (const row of rows ?? []) {
    const key = keyFor(row);
    if (typeof key !== "string" || key === "") throw new Error(`${label} is missing an id`);
    if (values.has(key)) throw new Error(`duplicate ${label}: ${key}`);
    values.set(key, row);
  }
  return values;
}

export function assignCorpusOwners(records, reviews) {
  const sources = uniqueBy(records, ({ id }) => id, "source id");
  const reviewed = uniqueBy(reviews, ({ sourceId }) => sourceId, "review source id");
  for (const sourceId of reviewed.keys()) {
    if (!sources.has(sourceId)) throw new Error(`review references unknown source: ${sourceId}`);
  }

  return [...sources.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((source) => {
      const review = reviewed.get(source.id);
      const classified = Array.isArray(source.families) && source.families.length > 0
        ? [...new Set(source.families)]
        : ["general"];
      if (classified.some((family) => typeof family !== "string" || family === "")) {
        throw new Error(`source has invalid family: ${source.id}`);
      }
      const ownerFamily = review?.familyId ?? classified[0];
      if (typeof ownerFamily !== "string" || ownerFamily === "") {
        throw new Error(`source has no owner family: ${source.id}`);
      }
      return {
        schemaVersion: 1,
        sourceId: source.id,
        ownerFamily,
        secondaryFamilies: classified.filter((family) => family !== ownerFamily),
        ownershipBasis: review ? "existing-review" : "classifier-primary",
        reviewed: Boolean(review),
      };
    });
}
