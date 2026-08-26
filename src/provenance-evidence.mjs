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
