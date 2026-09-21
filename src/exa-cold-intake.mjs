const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function buildExaColdIntake({
  sourceEnvelope,
  integrationReceipt,
  sourceEnvelopeSha256,
  integrationReceiptSha256,
  expectedSourceEnvelopeSha256,
  expectedIntegrationReceiptSha256,
}) {
  requireCondition(sourceEnvelope?.status === "cold-unreviewed", "source envelope must remain cold-unreviewed");
  requireCondition(sourceEnvelope?.activation === "none", "source envelope must remain inert");
  requireCondition(Array.isArray(sourceEnvelope?.records), "source records are required");
  requireCondition(Array.isArray(sourceEnvelope?.errors) && sourceEnvelope.errors.length === 0, "source errors must be empty");
  requireCondition(integrationReceipt?.status === "integrated", "warehouse integration receipt is not final");
  requireCondition(integrationReceipt?.activation === "none", "warehouse integration activated sources");
  requireCondition(integrationReceipt?.semanticReview === "cold-unreviewed", "warehouse integration review boundary changed");
  requireCondition(integrationReceipt?.additiveOnly === true, "warehouse integration was not additive-only");
  requireCondition(integrationReceipt?.boundaries?.upstreamCodeExecuted === false, "upstream code execution is not allowed");
  requireCondition(integrationReceipt?.boundaries?.sourceBodiesActivated === false, "source bodies must remain inactive");
  requireCondition(integrationReceipt?.boundaries?.qualityCertified === false, "intake cannot claim quality certification");
  requireCondition(SHA256.test(sourceEnvelopeSha256), "source envelope receipt hash is invalid");
  requireCondition(SHA256.test(integrationReceiptSha256), "integration receipt hash is invalid");
  requireCondition(sourceEnvelopeSha256 === expectedSourceEnvelopeSha256, "source envelope is not the admitted artifact");
  requireCondition(integrationReceiptSha256 === expectedIntegrationReceiptSha256, "integration receipt is not the admitted artifact");

  const records = [...sourceEnvelope.records].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const sourceIds = new Set();
  const repositories = new Set();
  const bodyHashes = new Set();
  for (const record of records) {
    requireCondition(typeof record.sourceId === "string" && record.sourceId !== "", "sourceId is required");
    requireCondition(!sourceIds.has(record.sourceId), `duplicate sourceId: ${record.sourceId}`);
    requireCondition(typeof record.repository === "string" && record.repository !== "", `${record.sourceId} repository is required`);
    requireCondition(typeof record.path === "string" && record.path.toLowerCase().endsWith("skill.md"), `${record.sourceId} is not a skill entrypoint`);
    requireCondition(SHA256.test(record.bodySha256), `${record.sourceId} body hash is invalid`);
    requireCondition(SHA1.test(record.gitBlob), `${record.sourceId} Git blob is invalid`);
    requireCondition(record.reviewStatus === "cold-unreviewed", `${record.sourceId} is not cold-unreviewed`);
    requireCondition(record.activation === "none", `${record.sourceId} is activated`);
    requireCondition(record.sourceKind === "exa-jev-proposal", `${record.sourceId} source kind changed`);
    sourceIds.add(record.sourceId);
    repositories.add(record.repository);
    bodyHashes.add(record.bodySha256);
  }

  requireCondition(sourceEnvelope.count === records.length, "source envelope count mismatch");
  requireCondition(sourceEnvelope.uniqueBodyHashes === bodyHashes.size, "source envelope body count mismatch");
  requireCondition(
    Number.isInteger(integrationReceipt.additions?.rows)
      && integrationReceipt.additions.rows >= repositories.size,
    "integrated repository count is smaller than the source-bearing repository count",
  );
  requireCondition(integrationReceipt.additions?.sourceRecords === records.length, "integrated source count mismatch");
  requireCondition(integrationReceipt.additions?.uniqueBodyHashes === bodyHashes.size, "integrated body count mismatch");

  return {
    records,
    jsonl: `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
    manifest: {
      schemaVersion: 1,
      status: "cold-unreviewed",
      activation: "none",
      intake: "exa-jev-skill-acquisition-2026-09-20",
      counts: {
        acquiredRepositories: integrationReceipt.additions.rows,
        sourceBearingRepositories: repositories.size,
        repositoriesWithoutSkillEntrypoints: integrationReceipt.additions.rows - repositories.size,
        sourceRecords: records.length,
        uniqueBodyHashes: bodyHashes.size,
      },
      inputs: {
        sourceEnvelopeSha256,
        integrationReceiptSha256,
      },
      boundaries: {
        upstreamCodeExecuted: false,
        providerCallsDuringImport: 0,
        sourceBodiesActivated: false,
        qualityCertified: false,
        semanticDeduplicationPerformed: false,
      },
    },
  };
}
