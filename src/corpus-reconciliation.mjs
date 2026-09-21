import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const RECONCILIATION_SCHEMA_VERSION = 1;

const HEX_SHA256 = /^[a-f0-9]{64}$/i;
const PRIMARY_ROLES = new Set([
  "raw-source-records",
  "raw-intake-sources",
  "source-card",
]);
const DERIVED_SUMMARY_ROLES = new Set([
  "derived-summary",
  "derived-duplicate-groups",
  "derived-synthesis-target",
]);
const SOURCE_BEARING_BASENAMES = new Set([
  "body-evidence.jsonl",
  "body-structures.jsonl",
  "canonical-sources.jsonl",
  "candidate-evidence.jsonl",
  "cluster-evidence.jsonl",
  "corpus-union.json",
  "coverage-ledger.jsonl",
  "coverage.json",
  "duplicate-groups.json",
  "facets.jsonl",
  "family-index.json",
  "ownership.jsonl",
  "repository-file-manifests.jsonl",
  "review-evidence.jsonl",
  "skill-security-ledger.jsonl",
  "source-cards.json",
  "source-ledger.jsonl",
  "source-records.jsonl",
  "sources.jsonl",
  "terminal-dispositions.jsonl",
]);

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(lexical)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function toPosix(relativePath) {
  return relativePath.replaceAll("\\", "/");
}

function relativePath(root, absolutePath) {
  return toPosix(path.relative(root, absolutePath));
}

function normalizeHash(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return HEX_SHA256.test(normalized) ? normalized : null;
}

function normalizeContentDigest(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "" ? null : normalized;
}

function identityFromRecord(record) {
  for (const field of ["sourceId", "id", "canonicalSourceId", "sourceIdentity"]) {
    const value = record?.[field];
    if (typeof value === "string" && value.trim() !== "") {
      return { field, value };
    }
  }
  return { field: null, value: null };
}

function aliasesFromRecord(record, identity) {
  const aliases = Array.isArray(record?.aliasSourceIds)
    ? record.aliasSourceIds.filter((value) => typeof value === "string" && value.trim() !== "")
    : [];
  return [...new Set(aliases.filter((value) => value !== identity.value))].sort(lexical);
}

function sourcePathFromRecord(record) {
  for (const field of ["sourcePath", "path", "relativePath", "resolvedRelativePath"]) {
    if (typeof record?.[field] === "string") return record[field];
  }
  return null;
}

function classificationFromRecord(record) {
  const classification = { ...record };
  for (const field of [
    "sourceId",
    "id",
    "canonicalSourceId",
    "sourceIdentity",
    "aliasSourceIds",
    "bodySha256",
    "contentDigest",
    "sourcePath",
    "path",
    "relativePath",
    "resolvedRelativePath",
  ]) {
    delete classification[field];
  }
  if (classification.structure && typeof classification.structure === "object") {
    const structure = classification.structure;
    classification.structureDigest = sha256(canonicalJson(structure));
    classification.structureSummary = {
      keys: Object.keys(structure).sort(lexical),
      frontmatterName: typeof structure.frontmatterName === "string" ? structure.frontmatterName : null,
      headingCount: Array.isArray(structure.headings) ? structure.headings.length : 0,
      invocationCandidateCount: Array.isArray(structure.invocationCandidates)
        ? structure.invocationCandidates.length
        : 0,
    };
    delete classification.structure;
  }
  if (Array.isArray(classification.findings)) {
    classification.findingSummary = {
      count: classification.findings.length,
      ruleIds: [...new Set(classification.findings
        .map((finding) => finding?.ruleId)
        .filter((ruleId) => typeof ruleId === "string"))].sort(lexical),
      severities: [...new Set(classification.findings
        .map((finding) => finding?.severity)
        .filter((severity) => typeof severity === "string"))].sort(lexical),
    };
    delete classification.findings;
  }
  return compactClassification(classification);
}

function compactClassification(value, depth = 0) {
  if (typeof value === "string") {
    if (value.length <= 512) return value;
    return { kind: "string", chars: value.length, sha256: sha256(value) };
  }
  if (Array.isArray(value)) {
    const serialized = canonicalJson(value);
    if (value.length > 16 || serialized.length > 800) {
      return { kind: "array", count: value.length, sha256: sha256(serialized) };
    }
    return value.map((item) => compactClassification(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const serialized = canonicalJson(value);
    if (depth > 2 || serialized.length > 1600) {
      return {
        kind: "object",
        keys: Object.keys(value).sort(lexical),
        sha256: sha256(serialized),
      };
    }
    return Object.fromEntries(
      Object.keys(value)
        .sort(lexical)
        .map((key) => [key, compactClassification(value[key], depth + 1)]),
    );
  }
  return value;
}

function bodyHashStatus(record) {
  if (!Object.hasOwn(record ?? {}, "bodySha256") || record.bodySha256 === null || record.bodySha256 === "") {
    return "missing";
  }
  return normalizeHash(record.bodySha256) ? "known" : "invalid";
}

function recordDescriptor(input, record, lineNumber, recordIndex) {
  const identity = identityFromRecord(record);
  const bodyStatus = bodyHashStatus(record);
  const declaredBodySha256 = bodyStatus === "invalid" ? record?.bodySha256 ?? null : undefined;
  const bodySha256 = bodyStatus === "known" ? normalizeHash(record.bodySha256) : null;
  const contentDigest = normalizeContentDigest(record.contentDigest);
  return {
    schemaVersion: RECONCILIATION_SCHEMA_VERSION,
    recordId: `${input.inputPath}#${String(recordIndex + 1).padStart(6, "0")}`,
    recordRole: input.role,
    primary: input.primary === true,
    sourceIdentity: identity.value,
    sourceIdentityField: identity.field,
    sourceAliases: aliasesFromRecord(record, identity),
    sourcePath: sourcePathFromRecord(record),
    ...(bodyStatus === "invalid" ? { declaredBodySha256 } : {}),
    bodySha256,
    bodyHashStatus: bodyStatus,
    contentDigest,
    contentDigestOnly: bodyStatus !== "known" && contentDigest !== null,
    origin: {
      inputPath: input.inputPath,
      lineNumber,
      recordIndex,
      fileSha256: input.fileSha256 ?? null,
    },
    classification: classificationFromRecord(record),
  };
}

function aliasDeclarations(descriptor) {
  return [
    {
      sourceIdentity: descriptor.sourceIdentity,
      identityRelation: "primary",
    },
    ...descriptor.sourceAliases.map((sourceIdentity) => ({
      sourceIdentity,
      identityRelation: "alias",
    })),
  ].filter(({ sourceIdentity }) => sourceIdentity !== null);
}

function declarationFor(descriptor, identity, identityRelation) {
  return {
    sourceIdentity: identity,
    identityRelation,
    recordId: descriptor.recordId,
    sourcePath: descriptor.sourcePath,
    recordRole: descriptor.recordRole,
    origin: descriptor.origin,
  };
}

function sortDescriptors(left, right) {
  return lexical(left.recordId ?? `${left.recordRole}:${left.sourceIdentity ?? ""}`, right.recordId ?? `${right.recordRole}:${right.sourceIdentity ?? ""}`);
}

function aggregateDeclarations(declarations) {
  const groups = new Map();
  for (const declaration of declarations) {
    const key = canonicalJson({
      sourceIdentity: declaration.sourceIdentity,
      identityRelation: declaration.identityRelation,
      recordRole: declaration.recordRole,
      sourcePath: declaration.sourcePath,
    });
    const group = groups.get(key) ?? {
      sourceIdentity: declaration.sourceIdentity,
      identityRelation: declaration.identityRelation,
      recordRole: declaration.recordRole,
      sourcePath: declaration.sourcePath,
      origins: new Map(),
      declarationCount: 0,
    };
    const origin = { ...declaration.origin, recordId: declaration.recordId };
    group.origins.set(canonicalJson(origin), origin);
    group.declarationCount += 1;
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      sourceIdentity: group.sourceIdentity,
      identityRelation: group.identityRelation,
      recordRole: group.recordRole,
      sourcePath: group.sourcePath,
      declarationCount: group.declarationCount,
      origins: [...group.origins.values()].sort((left, right) =>
        lexical(left.inputPath, right.inputPath) ||
        left.recordIndex - right.recordIndex ||
        lexical(left.recordId, right.recordId)),
    }))
    .sort((left, right) =>
      lexical(left.sourceIdentity, right.sourceIdentity) ||
      lexical(left.recordRole, right.recordRole) ||
      lexical(left.sourcePath ?? "", right.sourcePath ?? "") ||
      lexical(left.identityRelation, right.identityRelation));
}

function aggregateObservations(descriptors) {
  const groups = new Map();
  for (const descriptor of descriptors) {
    const normalized = {
      schemaVersion: descriptor.schemaVersion,
      recordRole: descriptor.recordRole,
      sourceIdentity: descriptor.sourceIdentity,
      sourceIdentityField: descriptor.sourceIdentityField,
      sourcePath: descriptor.sourcePath,
      ...(descriptor.bodyHashStatus === "invalid"
        ? { declaredBodySha256: descriptor.declaredBodySha256 }
        : {}),
      bodySha256: descriptor.bodySha256,
      bodyHashStatus: descriptor.bodyHashStatus,
      contentDigest: descriptor.contentDigest,
      contentDigestOnly: descriptor.contentDigestOnly,
      classification: descriptor.classification,
      identityRelation: descriptor.identityRelation ?? "primary",
    };
    const key = canonicalJson(normalized);
    const group = groups.get(key) ?? { ...normalized, origins: new Map() };
    const origin = { ...descriptor.origin, recordId: descriptor.recordId };
    group.origins.set(canonicalJson(origin), origin);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      origins: [...group.origins.values()].sort((left, right) =>
        lexical(left.inputPath, right.inputPath) ||
        left.recordIndex - right.recordIndex ||
        lexical(left.recordId, right.recordId)),
    }))
    .sort(sortDescriptors);
}

function declarationSummary(declarations) {
  return {
    declarationCount: declarations.length,
    inputPaths: [...new Set(declarations.map(({ origin }) => origin.inputPath))].sort(lexical),
    recordRoles: [...new Set(declarations.map(({ recordRole }) => recordRole))].sort(lexical),
  };
}

function identityInputPaths(identityMap) {
  return Object.fromEntries(
    [...identityMap.entries()]
      .sort(([left], [right]) => lexical(left, right))
      .map(([sourceIdentity, declarations]) => [
        sourceIdentity,
        [...new Set(declarations.map(({ origin }) => origin.inputPath))].sort(lexical),
      ]),
  );
}

function exclusionReason(relative) {
  const normalized = toPosix(relative);
  const base = path.posix.basename(normalized);
  if (/^data\/github-skill-quarry-wave-[23]\.json$/.test(normalized) || base === "repository-file-manifests.jsonl") {
    return "repository-manifest-not-skill-record";
  }
  if (["cluster-evidence.jsonl", "candidate-evidence.jsonl"].includes(base)) {
    return "derived-synthesis-target-not-raw-source";
  }
  if (normalized.includes("lunari-first-party-quarry")) {
    return "unsupported-non-skill-source-schema";
  }
  return "unsupported-source-bearing-schema";
}

function descriptorForPath(relative) {
  const normalized = toPosix(relative);
  const base = path.posix.basename(normalized);

  if (normalized === "artifacts/release-one/source-records.jsonl") {
    return { role: "raw-source-records", primary: true, format: "jsonl" };
  }
  if (normalized === "artifacts/corpus/body-evidence.jsonl") {
    return { role: "body-evidence", primary: false, format: "jsonl" };
  }
  if (normalized === "artifacts/corpus/coverage-ledger.jsonl") {
    return { role: "coverage-ledger", primary: false, format: "jsonl" };
  }
  if (normalized === "artifacts/corpus/review-evidence.jsonl") {
    return { role: "review-evidence", primary: false, format: "jsonl" };
  }
  if (normalized === "artifacts/corpus/ownership.jsonl") {
    return { role: "ownership-ledger", primary: false, format: "jsonl" };
  }
  if (normalized === "provenance/source-ledger.jsonl") {
    return { role: "provenance-ledger", primary: false, format: "jsonl" };
  }

  const checkpointMatch = normalized.match(/^artifacts\/checkpoints\/[^/]+\/(.+)$/);
  if (checkpointMatch) {
    if (base === "body-evidence.jsonl") return { role: "checkpoint-body-evidence", primary: false, format: "jsonl" };
    if (base === "coverage-ledger.jsonl") return { role: "checkpoint-coverage-ledger", primary: false, format: "jsonl" };
    if (base === "review-evidence.jsonl") return { role: "checkpoint-review-evidence", primary: false, format: "jsonl" };
    if (base === "ownership.jsonl") return { role: "checkpoint-ownership-ledger", primary: false, format: "jsonl" };
    return null;
  }

  const githubWaveMatch = normalized.match(/^artifacts\/(github-wave-[23])\/([^/]+)$/);
  if (githubWaveMatch) {
    if (base === "source-records.jsonl") return { role: "raw-source-records", primary: true, format: "jsonl" };
    if (base === "body-structures.jsonl") return { role: "derived-body-structure", primary: false, format: "jsonl" };
    if (base === "skill-security-ledger.jsonl") return { role: "security-ledger", primary: false, format: "jsonl" };
    if (base === "duplicate-groups.json") return { role: "derived-duplicate-groups", primary: false, format: "json" };
    return null;
  }

  const infusionMatch = normalized.match(/^artifacts\/(quarry-infusion(?:-v2)?)\/([^/]+)$/);
  if (infusionMatch) {
    if (base === "canonical-sources.jsonl") return { role: "derived-source-grouping", primary: false, format: "jsonl" };
    if (base === "body-structures.jsonl") return { role: "derived-body-structure", primary: false, format: "jsonl" };
    if (base === "facets.jsonl") return { role: "derived-facet", primary: false, format: "jsonl" };
    if (base === "terminal-dispositions.jsonl") return { role: "derived-disposition", primary: false, format: "jsonl" };
    if (["coverage.json", "family-index.json", "corpus-union.json"].includes(base)) {
      return { role: "derived-summary", primary: false, format: "json" };
    }
    return null;
  }

  const intakeMatch = normalized.match(/^data\/quarry-intake-[^/]+\/([^/]+)$/);
  if (intakeMatch) {
    if (base === "sources.jsonl") return { role: "raw-intake-sources", primary: true, format: "jsonl" };
    if (base === "source-cards.json") return { role: "source-card", primary: true, format: "json" };
    if (base === "facets.jsonl") return { role: "intake-facet", primary: false, format: "jsonl" };
    return null;
  }

  return null;
}

function isPotentialSourceBearing(relative) {
  const normalized = toPosix(relative);
  return SOURCE_BEARING_BASENAMES.has(path.posix.basename(normalized)) ||
    /^data\/github-skill-quarry-wave-[23]\.json$/.test(normalized);
}

async function walkFiles(directory, ignoredPrefixes = []) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((left, right) => lexical(left.name, right.name))) {
    const absolute = path.join(directory, entry.name);
    if (ignoredPrefixes.some((ignoredPrefix) =>
      path.resolve(absolute).toLowerCase().startsWith(ignoredPrefix))) continue;
    if (entry.isDirectory()) files.push(...await walkFiles(absolute, ignoredPrefixes));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

export async function discoverCorpusInputs({ repositoryRoot, outputPath } = {}) {
  const root = path.resolve(repositoryRoot ?? process.cwd());
  const ignoredPrefixes = [
    path.join(root, "data", "corpus-reconciliation-v1"),
    ...(outputPath ? [path.resolve(outputPath)] : []),
  ].map((ignoredPath) => `${ignoredPath.toLowerCase().replace(/[\\/]+$/, "")}${path.sep}`);
  const candidates = [];
  for (const directory of ["artifacts", "data", "provenance"]) {
    candidates.push(...await walkFiles(path.join(root, directory), ignoredPrefixes));
  }

  const inputs = [];
  const exclusions = [];
  for (const absolute of candidates.map((candidate) => path.resolve(candidate)).sort(lexical)) {
    const inputPath = relativePath(root, absolute);
    if (!isPotentialSourceBearing(inputPath)) continue;
    const descriptor = descriptorForPath(inputPath);
    if (descriptor) inputs.push({ inputPath, absolutePath: absolute, ...descriptor });
    else exclusions.push({ inputPath, reason: exclusionReason(inputPath) });
  }

  const explicitManifests = [
    "data/github-skill-quarry-wave-2.json",
    "data/github-skill-quarry-wave-3.json",
  ];
  for (const inputPath of explicitManifests) {
    if (!inputs.some((input) => input.inputPath === inputPath) &&
        !exclusions.some((input) => input.inputPath === inputPath) &&
        await fileExists(path.join(root, inputPath))) {
      exclusions.push({ inputPath, reason: exclusionReason(inputPath) });
    }
  }

  inputs.sort((left, right) => lexical(left.inputPath, right.inputPath));
  exclusions.sort((left, right) => lexical(left.inputPath, right.inputPath));
  return { inputs, exclusions };
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function parseRecords(text, format, inputPath) {
  if (format === "jsonl") {
    const records = [];
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].trim() === "") continue;
      try {
        records.push({ value: JSON.parse(lines[index]), lineNumber: index + 1 });
      } catch (error) {
        throw new Error(`invalid JSONL in ${inputPath} line ${index + 1}: ${error.message}`);
      }
    }
    return records;
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`invalid JSON in ${inputPath}: ${error.message}`);
  }
  if (Array.isArray(value)) {
    return value.map((record, index) => ({ value: record, lineNumber: 1, recordIndex: index }));
  }
  return [{ value, lineNumber: 1, recordIndex: 0 }];
}

async function loadInput(repositoryRoot, input) {
  const absolutePath = input.absolutePath ?? path.resolve(repositoryRoot, input.inputPath);
  const bytes = await readFile(absolutePath);
  const text = bytes.toString("utf8");
  const parsed = parseRecords(text, input.format ?? (input.inputPath.endsWith(".jsonl") ? "jsonl" : "json"), input.inputPath);
  return {
    ...input,
    inputPath: toPosix(input.inputPath),
    fileSha256: sha256(bytes),
    byteSize: bytes.byteLength,
    recordCount: parsed.length,
    records: parsed,
  };
}

function emptyCounts() {
  return {
    sourceRecordCount: 0,
    ledgerRecordCount: 0,
    derivedRecordCount: 0,
    derivedSummaryRecordCount: 0,
    uniquePrimarySourceIdentities: 0,
    uniqueSourceIdentities: 0,
    uniqueKnownBodies: 0,
    sourceRecordUniqueKnownBodies: 0,
    missingBodyHashRecordCount: 0,
    sourceRecordMissingBodyHashRecordCount: 0,
    invalidBodyHashRecordCount: 0,
    contentDigestOnlyRecordCount: 0,
    conflictingHashIdentityCount: 0,
    conflictingHashDeclarationCount: 0,
    bodyGroupCount: 0,
  };
}

function manifestFor({ inputs, exclusions, counts }) {
  return {
    schemaVersion: RECONCILIATION_SCHEMA_VERSION,
    kind: "corpus-reconciliation",
    version: "v1",
    status: "bounded-inventory",
    scope: {
      wholeCorpusClaimed: false,
      statement: "Registered source and evidence ledgers are reconciled as metadata; excluded inputs remain outside the inventory.",
      networkCalls: 0,
    },
    hashSemantics: {
      bodySha256: "Only a record's declared bodySha256 field, lowercased when it is a valid 64-hex SHA-256, participates in body grouping.",
      declaredBodySha256: "Malformed submitted bodySha256 values are retained separately on their record; valid values use normalized bodySha256 and missing values remain unkeyed.",
      contentDigest: "Retained as a separate normalized field and never used as a bodySha256 declaration or body group key.",
      verificationBoundary: "Hash equality is declared-ledger grouping, not verification of current source bodies.",
    },
    inputs: inputs.map(({ inputPath, role, primary, format, fileSha256, byteSize, recordCount }) => ({
      inputPath,
      role,
      primary,
      format,
      fileSha256,
      byteSize,
      recordCount,
    })),
    exclusions: exclusions.map(({ inputPath, reason, fileSha256, byteSize, recordCount }) => ({
      inputPath,
      reason,
      ...(fileSha256 ? { fileSha256 } : {}),
      ...(byteSize === undefined ? {} : { byteSize }),
      ...(recordCount === undefined ? {} : { recordCount }),
    })),
    counts,
  };
}

export function reconcileCorpus({ inputs = [], exclusions = [] } = {}) {
  const normalizedInputs = inputs
    .map((input) => ({
      ...input,
      inputPath: toPosix(input.inputPath),
      records: input.records ?? [],
      recordCount: input.recordCount ?? (input.records?.length ?? 0),
    }))
    .sort((left, right) => lexical(left.inputPath, right.inputPath));
  const normalizedExclusions = exclusions
    .map((exclusion) => ({ ...exclusion, inputPath: toPosix(exclusion.inputPath) }))
    .sort((left, right) => lexical(left.inputPath, right.inputPath));

  const counts = emptyCounts();
  const primarySourceIdentities = new Set();
  const sourceIdentities = new Set();
  const knownBodies = new Set();
  const primaryKnownBodies = new Set();
  const identityDeclarations = new Map();
  const bodyDeclarations = new Map();
  const sourceRecords = [];
  const ledgerObservations = [];

  const addBodyDeclaration = (descriptor, sourceIdentity, identityRelation) => {
    const bodySha256 = descriptor.bodySha256;
    if (!bodySha256) return;
    const bodyMap = bodyDeclarations.get(bodySha256) ?? new Map();
    const identityDeclarationsForBody = bodyMap.get(sourceIdentity) ?? [];
    identityDeclarationsForBody.push(declarationFor(descriptor, sourceIdentity, identityRelation));
    bodyMap.set(sourceIdentity, identityDeclarationsForBody);
    bodyDeclarations.set(bodySha256, bodyMap);
  };

  const addIdentityDeclaration = (descriptor, sourceIdentity, identityRelation) => {
    sourceIdentities.add(sourceIdentity);
    const identityMap = identityDeclarations.get(sourceIdentity) ?? new Map();
    const bodySha256 = descriptor.bodySha256;
    if (bodySha256) {
      const declarations = identityMap.get(bodySha256) ?? [];
      declarations.push(declarationFor(descriptor, sourceIdentity, identityRelation));
      identityMap.set(bodySha256, declarations);
      addBodyDeclaration(descriptor, sourceIdentity, identityRelation);
    }
    identityDeclarations.set(sourceIdentity, identityMap);
  };

  for (const input of normalizedInputs) {
    const summaryOnly = DERIVED_SUMMARY_ROLES.has(input.role);
    if (summaryOnly) {
      counts.derivedSummaryRecordCount += input.records.length;
      continue;
    }
    for (const parsedRecord of input.records) {
      const record = parsedRecord.value ?? parsedRecord;
      const recordIndex = parsedRecord.recordIndex ?? (parsedRecord.lineNumber ? parsedRecord.lineNumber - 1 : 0);
      const lineNumber = parsedRecord.lineNumber ?? recordIndex + 1;
      const descriptor = recordDescriptor(input, record, lineNumber, recordIndex);
      counts.ledgerRecordCount += 1;
      if (descriptor.primary) {
        counts.sourceRecordCount += 1;
        if (descriptor.sourceIdentity) primarySourceIdentities.add(descriptor.sourceIdentity);
        sourceRecords.push(descriptor);
      } else {
        counts.derivedRecordCount += 1;
        if (descriptor.sourceIdentity) ledgerObservations.push(descriptor);
      }

      if (descriptor.bodyHashStatus !== "known") {
        counts.missingBodyHashRecordCount += 1;
        if (descriptor.primary) counts.sourceRecordMissingBodyHashRecordCount += 1;
        if (descriptor.bodyHashStatus === "invalid") counts.invalidBodyHashRecordCount += 1;
        if (descriptor.contentDigestOnly) counts.contentDigestOnlyRecordCount += 1;
      }
      if (descriptor.bodySha256) {
        knownBodies.add(descriptor.bodySha256);
        if (descriptor.primary) primaryKnownBodies.add(descriptor.bodySha256);
      }
      const identities = aliasDeclarations(descriptor);
      if (identities.length === 0 && descriptor.bodySha256) {
        addBodyDeclaration(descriptor, null, null);
      }
      for (const identity of identities) {
        addIdentityDeclaration(descriptor, identity.sourceIdentity, identity.identityRelation);
      }
    }
  }

  const bodyGroups = [...bodyDeclarations.entries()]
    .sort(([left], [right]) => lexical(left, right))
    .map(([bodySha256, identityMap]) => {
      const namedEntries = [...identityMap.entries()]
        .filter(([sourceIdentity]) => sourceIdentity !== null);
      const anonymousDeclarations = identityMap.get(null) ?? [];
      const bodyGroup = {
        schemaVersion: RECONCILIATION_SCHEMA_VERSION,
        bodySha256,
        sourceIdentities: namedEntries.map(([sourceIdentity]) => sourceIdentity).sort(lexical),
        identityInputPaths: identityInputPaths(new Map(namedEntries)),
        ...declarationSummary([...identityMap.values()].flat()),
      };
      if (anonymousDeclarations.length > 0) {
        bodyGroup.anonymousDeclarationCount = anonymousDeclarations.length;
        bodyGroup.anonymousInputPaths = [...new Set(
          anonymousDeclarations.map(({ origin }) => origin.inputPath),
        )].sort(lexical);
      }
      return bodyGroup;
    });

  const conflicts = [...identityDeclarations.entries()]
    .filter(([, hashMap]) => hashMap.size > 1)
    .sort(([left], [right]) => lexical(left, right))
    .map(([sourceIdentity, hashMap]) => ({
      schemaVersion: RECONCILIATION_SCHEMA_VERSION,
      sourceIdentity,
      bodySha256Values: [...hashMap.keys()].sort(lexical),
      declarations: aggregateDeclarations([...hashMap.values()].flat()),
    }));

  counts.uniquePrimarySourceIdentities = primarySourceIdentities.size;
  counts.uniqueSourceIdentities = sourceIdentities.size;
  counts.uniqueKnownBodies = knownBodies.size;
  counts.sourceRecordUniqueKnownBodies = primaryKnownBodies.size;
  counts.conflictingHashIdentityCount = conflicts.length;
  counts.conflictingHashDeclarationCount = conflicts.reduce(
    (total, conflict) => total + conflict.declarations.reduce((count, declaration) => count + declaration.declarationCount, 0),
    0,
  );
  counts.bodyGroupCount = bodyGroups.length;

  const inputManifestRows = normalizedInputs.map((input) => ({
    inputPath: input.inputPath,
    role: input.role,
    primary: input.primary === true,
    format: input.format ?? null,
    fileSha256: input.fileSha256 ?? null,
    byteSize: input.byteSize ?? null,
    recordCount: input.recordCount ?? input.records.length,
  }));
  const manifest = manifestFor({
    inputs: inputManifestRows,
    exclusions: normalizedExclusions,
    counts,
  });
  const manifestSha256 = sha256(`${canonicalJson(manifest)}\n`);
  manifest.manifestSha256 = manifestSha256;

  return {
    schemaVersion: RECONCILIATION_SCHEMA_VERSION,
    manifest,
    manifestSha256,
    inputs: inputManifestRows,
    exclusions: normalizedExclusions,
    counts,
    sourceRecords: sourceRecords.sort(sortDescriptors),
    ledgerObservations: aggregateObservations(ledgerObservations),
    bodyGroups,
    conflicts,
  };
}

function jsonlText(rows) {
  return rows.length === 0 ? "" : `${rows.map((row) => canonicalJson(row)).join("\n")}\n`;
}

export async function writeCorpusReconciliation(outputPath, result) {
  await mkdir(outputPath, { recursive: true });
  const files = {
    "manifest.json": `${canonicalJson(result.manifest)}\n`,
    "source-records.jsonl": jsonlText(result.sourceRecords),
    "ledger-observations.jsonl": jsonlText(result.ledgerObservations),
    "body-groups.jsonl": jsonlText(result.bodyGroups),
    "identity-conflicts.jsonl": jsonlText(result.conflicts),
  };
  for (const [name, text] of Object.entries(files)) {
    await writeFile(path.join(outputPath, name), text, "utf8");
  }
  return result;
}

export async function buildCorpusReconciliation({ repositoryRoot, outputPath } = {}) {
  const root = path.resolve(repositoryRoot ?? process.cwd());
  const target = path.resolve(outputPath ?? path.join(root, "data", "corpus-reconciliation-v1"));
  const discovered = await discoverCorpusInputs({ repositoryRoot: root, outputPath: target });
  const loaded = [];
  for (const input of discovered.inputs) loaded.push(await loadInput(root, input));
  const exclusions = [];
  for (const exclusion of discovered.exclusions) {
    const absolute = path.join(root, exclusion.inputPath);
    try {
      const bytes = await readFile(absolute);
      const parsed = parseRecords(bytes.toString("utf8"), absolute.endsWith(".jsonl") ? "jsonl" : "json", exclusion.inputPath);
      exclusions.push({
        ...exclusion,
        fileSha256: sha256(bytes),
        byteSize: bytes.byteLength,
        recordCount: parsed.length,
      });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      exclusions.push(exclusion);
    }
  }
  const result = reconcileCorpus({ inputs: loaded, exclusions });
  await writeCorpusReconciliation(target, result);
  return { ...result, outputPath: target };
}
