import { isDeepStrictEqual } from "node:util";

import { validateEvaluation } from "./schema.mjs";

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function validateCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) {
    throw new Error("evaluation cases must be a non-empty array");
  }
  const ids = new Set();
  for (const item of cases) {
    nonEmptyString(item?.id, "case.id");
    nonEmptyString(item?.kind, `case ${item.id}.kind`);
    if (typeof item.critical !== "boolean") {
      throw new Error(`case ${item.id}.critical must be boolean`);
    }
    if (!("expected" in item)) throw new Error(`case ${item.id} must declare expected`);
    if (ids.has(item.id)) throw new Error(`duplicate case id: ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}

function indexResults(results, caseIds) {
  if (!Array.isArray(results)) throw new TypeError("results must be an array");
  const indexed = new Map();
  for (const result of results) {
    nonEmptyString(result?.id, "result.id");
    if (!caseIds.has(result.id)) throw new Error(`unknown result id: ${result.id}`);
    if (indexed.has(result.id)) throw new Error(`duplicate result id: ${result.id}`);
    if (
      result.tokenCount !== undefined &&
      (!Number.isInteger(result.tokenCount) || result.tokenCount < 0)
    ) {
      throw new Error(`result ${result.id}.tokenCount must be a non-negative integer`);
    }
    if (
      result.unresolvedEffects !== undefined &&
      (!Array.isArray(result.unresolvedEffects) ||
        result.unresolvedEffects.some((effect) => typeof effect !== "string"))
    ) {
      throw new Error(`result ${result.id}.unresolvedEffects must be strings`);
    }
    indexed.set(result.id, result);
  }
  return indexed;
}

export function evaluateSuite(cases, results) {
  const caseIds = validateCases(cases);
  const indexed = indexResults(results, caseIds);
  const kindCounts = new Map();
  const failures = [];
  const unresolvedEffects = new Set();
  let passed = 0;
  let criticalPassed = 0;
  let criticalTotal = 0;
  let tokenCount = 0;

  for (const item of cases) {
    if (item.critical) criticalTotal += 1;
    const result = indexed.get(item.id);
    const matched = result !== undefined && isDeepStrictEqual(result.actual, item.expected);
    const counts = kindCounts.get(item.kind) ?? { total: 0, passed: 0 };
    counts.total += 1;
    if (matched) {
      passed += 1;
      counts.passed += 1;
      if (item.critical) criticalPassed += 1;
    } else {
      failures.push({
        id: item.id,
        kind: item.kind,
        critical: item.critical,
        reason: result === undefined ? "missing result" : "actual did not match expected",
      });
    }
    kindCounts.set(item.kind, counts);
    tokenCount += result?.tokenCount ?? 0;
    for (const effect of result?.unresolvedEffects ?? []) {
      if (effect.trim()) unresolvedEffects.add(effect.trim());
    }
  }

  const kindScores = Object.fromEntries(
    [...kindCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([kind, counts]) => [
        kind,
        { ...counts, score: counts.total === 0 ? 0 : counts.passed / counts.total },
      ]),
  );
  const evaluation = {
    schemaVersion: 1,
    status: "evaluated",
    total: cases.length,
    passed,
    criticalTotal,
    criticalPassed,
    score: passed / cases.length,
    tokenCount,
    kindScores,
    unresolvedEffects: [...unresolvedEffects].sort((a, b) => a.localeCompare(b)),
    failures,
  };
  validateEvaluation(evaluation);
  return evaluation;
}
