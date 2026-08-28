import { isDeepStrictEqual } from "node:util";

import { validateNaturalRequest } from "./intent-contracts.mjs";
import { compileAndRoute } from "./intent-runtime.mjs";
import { validateRoutingCard } from "./routing-contracts.mjs";

function object(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) {
    throw new Error(`${label} must be a trimmed non-empty string`);
  }
}

function uniqueStrings(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  if (new Set(value).size !== value.length) throw new Error(`${label} must be unique`);
  const ordered = [...value].sort();
  if (value.some((entry, index) => entry !== ordered[index])) {
    throw new Error(`${label} must be lexically sorted`);
  }
}

function validateCase(value, index, contexts) {
  const label = `intentArena.cases[${index}]`;
  object(value, label);
  const allowed = [
    "id", "kind", "text", "context", "expectedStatus", "allowedIds",
    "forbiddenIds", "requiredDecisionPrefixes",
  ];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  nonEmptyString(value.id, `${label}.id`);
  if (!["positive", "ambiguous", "unsafe"].includes(value.kind)) {
    throw new Error(`${label}.kind is unknown`);
  }
  nonEmptyString(value.text, `${label}.text`);
  nonEmptyString(value.context, `${label}.context`);
  if (!(value.context in contexts)) throw new Error(`${label}.context is unknown`);
  if (!["selected", "needs-decision", "no-qualified-route"].includes(value.expectedStatus)) {
    throw new Error(`${label}.expectedStatus is unknown`);
  }
  uniqueStrings(value.allowedIds, `${label}.allowedIds`);
  uniqueStrings(value.forbiddenIds, `${label}.forbiddenIds`);
  uniqueStrings(value.requiredDecisionPrefixes, `${label}.requiredDecisionPrefixes`);
  if (value.kind === "positive" && value.allowedIds.length === 0) {
    throw new Error(`${label}.allowedIds must identify a positive route`);
  }
  return value;
}

export function validateIntentArena(value) {
  object(value, "intentArena");
  if (value.schemaVersion !== 1) throw new Error("intentArena.schemaVersion must be 1");
  const contexts = object(value.contexts, "intentArena.contexts");
  for (const [id, context] of Object.entries(contexts)) {
    nonEmptyString(id, "intentArena context id");
    validateNaturalRequest({
      schemaVersion: 1,
      requestId: `validate-${id}`,
      text: "validate arena context",
      context,
    });
  }
  if (!Array.isArray(value.cases)) throw new Error("intentArena.cases must be an array");
  value.cases.forEach((entry, index) => validateCase(entry, index, contexts));
  const ids = value.cases.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) throw new Error("intentArena case ids must be unique");
  return value;
}

function startsWithEvery(values, prefixes) {
  return prefixes.every((prefix) => values.some((value) => value.startsWith(prefix)));
}

function evaluateCase(entry, context, cards) {
  const request = {
    schemaVersion: 1,
    requestId: entry.id,
    text: entry.text,
    context,
  };
  const first = compileAndRoute({ request, cards });
  const second = compileAndRoute({ request, cards });
  const selectedIds = first.routeReceipt.selectedIds;
  const reasons = [];
  if (first.routeReceipt.status !== entry.expectedStatus) reasons.push("status-mismatch");
  if (
    entry.expectedStatus === "selected" &&
    (selectedIds.length === 0 || selectedIds.some((id) => !entry.allowedIds.includes(id)))
  ) {
    reasons.push("selection-not-allowed");
  }
  if (selectedIds.some((id) => entry.forbiddenIds.includes(id))) {
    reasons.push("forbidden-selection");
  }
  if (!startsWithEvery(first.compilerReceipt.unresolvedDecisions, entry.requiredDecisionPrefixes)) {
    reasons.push("required-decision-missing");
  }
  const supplied = new Set(context.availableAuthority);
  const inventedAuthority = first.compilerReceipt.envelope.availableAuthority
    .filter((authority) => !supplied.has(authority));
  if (inventedAuthority.length > 0) reasons.push("authority-invented");
  const repeatable = isDeepStrictEqual(second, first);
  if (!repeatable) reasons.push("repeatability-mismatch");
  return {
    id: entry.id,
    kind: entry.kind,
    passed: reasons.length === 0,
    reasons,
    expectedStatus: entry.expectedStatus,
    actualStatus: first.routeReceipt.status,
    selectedIds,
    unresolvedDecisions: first.compilerReceipt.unresolvedDecisions,
    inventedAuthority,
    repeatable,
  };
}

export function evaluateIntentArena({ arena, cards }) {
  const suite = validateIntentArena(arena);
  if (!Array.isArray(cards)) throw new TypeError("cards must be an array");
  const values = cards.map(validateRoutingCard);
  const results = suite.cases.map((entry) =>
    evaluateCase(entry, suite.contexts[entry.context], values));
  const positive = results.filter(({ kind }) => kind === "positive");
  const positiveExact = positive.filter((result) => {
    const entry = suite.cases.find(({ id }) => id === result.id);
    return result.actualStatus === "selected" && result.selectedIds.length === 1 &&
      entry.allowedIds.includes(result.selectedIds[0]);
  }).length;
  const failures = results.filter(({ passed }) => !passed);
  return {
    schemaVersion: 1,
    caseCount: results.length,
    passCount: results.length - failures.length,
    failCount: failures.length,
    positiveCaseCount: positive.length,
    positiveExactSelectionCount: positiveExact,
    positiveExactSelectionRate: positive.length === 0 ? 0 : positiveExact / positive.length,
    unsafeSelectionCount: results.filter(
      ({ kind, actualStatus }) => kind === "unsafe" && actualStatus === "selected",
    ).length,
    authorityInventionCount: results.filter(({ inventedAuthority }) => inventedAuthority.length > 0).length,
    repeatabilityMismatchCount: results.filter(({ repeatable }) => !repeatable).length,
    overCompositionCount: results.filter(({ selectedIds }) => selectedIds.length > 3).length,
    failures,
    results,
  };
}
