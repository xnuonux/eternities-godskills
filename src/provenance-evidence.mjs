export function deriveSourceEvidence(contract, ledgerRows) {
  if (!Array.isArray(contract?.sourceIds) || contract.sourceIds.length === 0) {
    throw new Error("contract.sourceIds must not be empty");
  }
  const sourceIds = [...contract.sourceIds];
  if (new Set(sourceIds).size !== sourceIds.length) {
    throw new Error("contract.sourceIds must not contain duplicates");
  }
  const selected = [];
  for (const sourceId of sourceIds) {
    const matches = ledgerRows.filter((row) => row.sourceId === sourceId);
    if (matches.length === 0) throw new Error(`missing provenance row: ${sourceId}`);
    if (matches.length > 1) throw new Error(`duplicate provenance row: ${sourceId}`);
    selected.push(matches[0]);
  }
  return {
    sourceCoverage: selected.length,
    sourceIds: [...sourceIds].sort(),
    proseCopied: selected.some(({ proseCopied }) => proseCopied === true),
  };
}

const SHA256 = /^[a-f0-9]{64}$/;
const COLD_DISPOSITIONS = new Set([
  "independent-implementation",
  "pattern-reference",
  "rejected",
  "deferred",
]);

export function deriveColdIntakeSourceEvidence(
  contract,
  sourceRows,
  { manifest, sourcesJsonlSha256 } = {},
) {
  const evidence = contract?.sourceEvidence;
  if (evidence?.mode !== "cold-intake-v1") {
    throw new Error("contract.sourceEvidence.mode must be cold-intake-v1");
  }
  if (!/^quarry-intake-[a-z0-9][a-z0-9-]*$/.test(evidence.intakeDirectory ?? "")) {
    throw new Error("cold intake directory must be a safe quarry-intake name");
  }
  if (!Array.isArray(contract.sourceIds) || contract.sourceIds.length === 0) {
    throw new Error("contract.sourceIds must not be empty");
  }
  if (new Set(contract.sourceIds).size !== contract.sourceIds.length) {
    throw new Error("contract.sourceIds must not contain duplicates");
  }
  if (!Array.isArray(evidence.sources) || evidence.sources.length === 0) {
    throw new Error("cold intake source declarations must not be empty");
  }
  const declaredIds = evidence.sources.map(({ sourceId }) => sourceId);
  if (new Set(declaredIds).size !== declaredIds.length) {
    throw new Error("cold intake source declarations must not contain duplicates");
  }
  const contractIds = [...contract.sourceIds].sort();
  const evidenceIds = [...declaredIds].sort();
  if (
    contractIds.length !== evidenceIds.length ||
    contractIds.some((sourceId, index) => sourceId !== evidenceIds[index])
  ) {
    throw new Error("cold intake source declaration union must equal contract.sourceIds");
  }
  if (!manifest || manifest.status !== "cold-unreviewed") {
    throw new Error("cold intake manifest must remain cold-unreviewed");
  }
  if (manifest.activation !== "none") {
    throw new Error("cold intake manifest activation must remain none");
  }
  if (!Array.isArray(sourceRows) || manifest.counts?.sourceRecords !== sourceRows.length) {
    throw new Error("cold intake source record count does not match manifest");
  }
  if (!SHA256.test(sourcesJsonlSha256 ?? "")) {
    throw new Error("cold intake source file hash must be a SHA-256 digest");
  }
  if (
    evidence.sourcesJsonlSha256 !== sourcesJsonlSha256 ||
    manifest.outputs?.sourcesJsonlSha256 !== sourcesJsonlSha256
  ) {
    throw new Error("cold intake source file hash does not match contract and manifest");
  }

  const selected = [];
  for (const declaration of evidence.sources) {
    if (!SHA256.test(declaration.bodySha256 ?? "")) {
      throw new Error(`invalid declared body hash: ${declaration.sourceId}`);
    }
    if (!COLD_DISPOSITIONS.has(declaration.disposition)) {
      throw new Error(`invalid cold intake disposition: ${declaration.sourceId}`);
    }
    if (declaration.proseCopied !== false) {
      throw new Error(`copied prose is not eligible: ${declaration.sourceId}`);
    }
    const matches = sourceRows.filter(({ sourceId }) => sourceId === declaration.sourceId);
    if (matches.length === 0) {
      throw new Error(`missing cold intake source row: ${declaration.sourceId}`);
    }
    if (matches.length > 1) {
      throw new Error(`duplicate cold intake source row: ${declaration.sourceId}`);
    }
    const row = matches[0];
    if (row.bodySha256 !== declaration.bodySha256) {
      throw new Error(`cold intake body hash mismatch: ${declaration.sourceId}`);
    }
    if (row.reviewStatus !== "cold-unreviewed") {
      throw new Error(`cold intake review status changed: ${declaration.sourceId}`);
    }
    if (row.activation !== "none") {
      throw new Error(`cold intake activation changed: ${declaration.sourceId}`);
    }
    selected.push(row);
  }

  return {
    sourceCoverage: selected.length,
    sourceIds: contractIds,
    proseCopied: false,
    sourceEvidenceMode: "cold-intake-v1",
    intakeDirectory: evidence.intakeDirectory,
    sourcesJsonlSha256,
  };
}

export function deriveClusterSourceEvidence(contract, clusterRows, reviewRows) {
  if (contract?.sourceEvidence?.mode !== "cluster-review-v1") {
    throw new Error("contract.sourceEvidence.mode must be cluster-review-v1");
  }
  if (!Array.isArray(contract.sourceIds) || contract.sourceIds.length === 0) {
    throw new Error("contract.sourceIds must not be empty");
  }
  if (new Set(contract.sourceIds).size !== contract.sourceIds.length) {
    throw new Error("contract.sourceIds must not contain duplicates");
  }

  const selectedClusters = [];
  const memberSources = new Set();
  const selectedMembers = [];
  for (const declared of contract.sourceEvidence.clusters) {
    const matches = clusterRows.filter((row) => row.id === declared.id);
    if (matches.length === 0) throw new Error(`missing cluster evidence: ${declared.id}`);
    if (matches.length > 1) throw new Error(`duplicate cluster evidence: ${declared.id}`);
    const row = matches[0];
    if (row.clusterSetId !== contract.sourceEvidence.clusterSetId) {
      throw new Error(`cluster set mismatch for ${declared.id}`);
    }
    if (row.clusterDigest !== declared.digest) {
      throw new Error(`stale cluster digest for ${declared.id}`);
    }
    if (row.synthesisDecision !== "candidate") {
      throw new Error(`cluster is not a synthesis candidate: ${declared.id}`);
    }
    for (const member of row.members ?? []) {
      if (memberSources.has(member.sourceId)) {
        throw new Error(`duplicate source across selected clusters: ${member.sourceId}`);
      }
      memberSources.add(member.sourceId);
      selectedMembers.push(member);
    }
    selectedClusters.push(row);
  }

  const expectedSources = [...contract.sourceIds].sort();
  const actualSources = [...memberSources].sort();
  if (expectedSources.length !== actualSources.length ||
      expectedSources.some((sourceId, index) => sourceId !== actualSources[index])) {
    throw new Error("cluster source union does not match contract.sourceIds");
  }

  const seenReviews = new Set();
  for (const member of selectedMembers) {
    const matches = reviewRows.filter((row) => row.sourceId === member.sourceId);
    if (matches.length === 0) throw new Error(`missing review evidence: ${member.sourceId}`);
    if (matches.length > 1 || seenReviews.has(member.sourceId)) {
      throw new Error(`duplicate review evidence: ${member.sourceId}`);
    }
    seenReviews.add(member.sourceId);
    const review = matches[0];
    if (review.reviewDigest !== member.reviewDigest) {
      throw new Error(`stale review digest for ${member.sourceId}`);
    }
    if (review.copiedSourceProse === true) {
      throw new Error(`review contains copied source prose: ${member.sourceId}`);
    }
    if (review.promotionClaim === true) {
      throw new Error(`review contains a promotion claim: ${member.sourceId}`);
    }
  }

  return {
    sourceCoverage: actualSources.length,
    sourceIds: actualSources,
    proseCopied: false,
    sourceEvidenceMode: "cluster-review-v1",
    clusterIds: selectedClusters.map(({ id }) => id),
  };
}
