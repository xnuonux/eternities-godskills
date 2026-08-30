function fail(message) {
  throw new Error(`quarry corpus union: ${message}`);
}

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort(lexical).map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function validateWave(wave, seenWaveIds) {
  if (typeof wave?.id !== "string" || wave.id === "" || seenWaveIds.has(wave.id)) {
    fail(`duplicate or invalid wave id: ${wave?.id}`);
  }
  seenWaveIds.add(wave.id);
  if (!Array.isArray(wave.sources) || !Array.isArray(wave.securityRows) || !Array.isArray(wave.bodyStructures)) {
    fail(`wave evidence is incomplete: ${wave.id}`);
  }
}

function sourceIdentity(source) {
  return canonical({
    id: source.id,
    repository: source.repository,
    head: source.head,
    sourcePath: source.sourcePath,
    bodyBytes: source.bodyBytes,
    bodySha256: source.bodySha256,
    licenseSignal: source.licenseSignal,
    disposition: source.disposition,
    inert: source.inert,
  });
}

export function unionQuarryEvidence({ waves } = {}) {
  if (!Array.isArray(waves) || waves.length < 2) fail("at least two evidence waves are required");
  const seenWaveIds = new Set();
  const sourceById = new Map();
  const sourceWaveIdsById = new Map();
  const securityById = new Map();
  const structureByDigest = new Map();
  let rawSourceRecordCount = 0;

  for (const wave of waves) {
    validateWave(wave, seenWaveIds);
    const waveSourceIds = new Set();
    for (const source of wave.sources) {
      rawSourceRecordCount += 1;
      if (typeof source?.id !== "string" || source.id === "" || waveSourceIds.has(source.id)) {
        fail(`duplicate source id within wave: ${source?.id}`);
      }
      if (!/^[a-f0-9]{64}$/.test(source.bodySha256 ?? "") || source.inert !== true) {
        fail(`invalid or activation-capable source: ${source.id}`);
      }
      const existing = sourceById.get(source.id);
      if (existing && sourceIdentity(existing) !== sourceIdentity(source)) {
        fail(`conflicting duplicate source id: ${source.id}`);
      }
      if (!existing) sourceById.set(source.id, source);
      const sourceWaveIds = sourceWaveIdsById.get(source.id) ?? new Set();
      sourceWaveIds.add(wave.id);
      sourceWaveIdsById.set(source.id, sourceWaveIds);
      waveSourceIds.add(source.id);
    }
    for (const row of wave.securityRows) {
      if (typeof row?.id !== "string") fail(`invalid security id: ${row?.id}`);
      const source = sourceById.get(row.id);
      if (!source || !waveSourceIds.has(row.id)) fail(`security evidence references unknown source: ${row.id}`);
      if (row.bodySha256 !== source.bodySha256) fail(`security body digest drift: ${row.id}`);
      const existing = securityById.get(row.id);
      if (existing && canonical(existing) !== canonical(row)) fail(`conflicting security evidence: ${row.id}`);
      if (!existing) securityById.set(row.id, row);
    }
    for (const row of wave.bodyStructures) {
      if (!/^[a-f0-9]{64}$/.test(row?.bodySha256 ?? "") || !row.structure || typeof row.structure !== "object") {
        fail(`invalid body structure: ${row?.bodySha256}`);
      }
      const existing = structureByDigest.get(row.bodySha256);
      if (existing && canonical(existing) !== canonical(row.structure)) {
        fail(`conflicting body structure: ${row.bodySha256}`);
      }
      structureByDigest.set(row.bodySha256, row.structure);
    }
  }

  const sources = [...sourceById.values()].sort((left, right) => lexical(left.id, right.id));
  if (securityById.size !== sources.length) fail("security evidence does not cover every source");
  for (const source of sources) {
    if (!securityById.has(source.id)) fail(`missing security evidence: ${source.id}`);
    if (!structureByDigest.has(source.bodySha256)) fail(`missing body structure: ${source.bodySha256}`);
  }

  const aliases = new Map();
  for (const source of sources) {
    const ids = aliases.get(source.bodySha256) ?? [];
    ids.push(source.id);
    aliases.set(source.bodySha256, ids);
  }
  const canonicalBodies = [...aliases.entries()]
    .sort(([left], [right]) => lexical(left, right))
    .map(([bodySha256, sourceIds]) => ({ bodySha256, sourceIds: sourceIds.sort(lexical) }));
  const aliasesByDigest = Object.fromEntries(canonicalBodies.map(({ bodySha256, sourceIds }) => [bodySha256, [...sourceIds]]));
  const bodyStructures = Object.fromEntries(
    canonicalBodies.map(({ bodySha256 }) => [bodySha256, structureByDigest.get(bodySha256)]),
  );

  return {
    waveIds: [...seenWaveIds].sort(lexical),
    sources,
    securityRows: sources.map(({ id }) => securityById.get(id)),
    bodyStructures,
    canonicalBodies,
    aliasesByDigest,
    rawSourceRecordCount,
    coalescedDuplicateSourceRecordCount: rawSourceRecordCount - sources.length,
    sourceWaveIdsById: Object.fromEntries(sources.map(({ id }) => [id, [...sourceWaveIdsById.get(id)].sort(lexical)])),
  };
}
