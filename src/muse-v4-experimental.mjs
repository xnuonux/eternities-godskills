function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function buildMuseV4Acceptance({ affordances = [], phenomenonClass } = {}) {
  if (!Array.isArray(affordances) || affordances.some((value) => typeof value !== "string" || value.length === 0)) {
    throw new TypeError("affordances must be non-empty strings");
  }

  const naturalMotionChecks = phenomenonClass === "natural"
    ? [
      "multi-scale-variation",
      "phase-desynchronization",
      "multi-time-sample",
      "visible-pattern-rejection",
    ]
    : [];

  return {
    preservedAffordances: uniqueSorted(affordances),
    mandatedTechniques: [],
    solutionSpace: "open-within-acceptance-boundary",
    naturalMotionChecks,
    rejectionChecks: [
      "reject-narrower-substitute-controls",
      "reject-front-view-only-dimensionality",
      ...(phenomenonClass === "natural"
        ? ["reject-visible-spiral-lattice-or-synchronized-pulse"]
        : []),
      "reject-bloom-clipped-internal-structure",
    ],
  };
}

export function projectMuseV4Authority(requested = [], available = []) {
  const availableSet = new Set(available);
  const projected = uniqueSorted(requested);
  const expansion = projected.find((capability) => !availableSet.has(capability));
  if (expansion) {
    throw new Error(`Muse v4 authority expansion refused: ${expansion}`);
  }
  return projected;
}
