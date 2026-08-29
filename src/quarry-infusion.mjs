import { classify } from "./ontology.mjs";

const SECURITY_DISPOSITIONS = new Set([
  "clear-for-semantic-review",
  "manual-review-required",
  "reject-before-indexing",
]);

function fail(message) {
  throw new Error(`quarry infusion: ${message}`);
}

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim() !== ""))].sort(lexical);
}

function validateInputs({ sources, securityRows, bodyStructures, ontology, familyTargets }) {
  if (!Array.isArray(sources) || sources.length === 0) fail("sources must not be empty");
  if (!Array.isArray(securityRows) || securityRows.length !== sources.length) {
    fail("security evidence does not cover every source");
  }
  if (!bodyStructures || typeof bodyStructures !== "object") fail("bodyStructures must be an object");
  if (ontology?.schemaVersion !== 1 || !Array.isArray(ontology.families)) fail("unsupported ontology");
  if (familyTargets?.schemaVersion !== 1 || !familyTargets.targets || typeof familyTargets.targets !== "object") {
    fail("unsupported family targets");
  }
  const sourceById = new Map();
  for (const source of sources) {
    if (typeof source?.id !== "string" || source.id === "" || sourceById.has(source.id)) fail(`duplicate or invalid source id: ${source?.id}`);
    if (!/^[a-f0-9]{64}$/.test(source.bodySha256 ?? "")) fail(`invalid body digest: ${source.id}`);
    if (source.inert !== true) fail(`source is not inert: ${source.id}`);
    sourceById.set(source.id, source);
  }
  const securityById = new Map();
  for (const row of securityRows) {
    if (typeof row?.id !== "string" || securityById.has(row.id)) fail(`duplicate or invalid security id: ${row?.id}`);
    const source = sourceById.get(row.id);
    if (!source) fail(`security evidence references unknown source: ${row.id}`);
    if (row.bodySha256 !== source.bodySha256) fail(`security body digest drift: ${row.id}`);
    if (!SECURITY_DISPOSITIONS.has(row.disposition)) fail(`unknown security disposition: ${row.id}`);
    securityById.set(row.id, row);
  }
  if (securityById.size !== sourceById.size) fail("security evidence does not cover every source");
  return { sourceById, securityById };
}

function structureRecord(source, structure) {
  return {
    id: source.id,
    name: structure.frontmatterName ?? source.sourcePath.split(/[\\/]/).at(-2) ?? "",
    description: structure.frontmatterDescription ?? "",
    enhancedSummary: (structure.headings ?? []).join(" "),
    sourcePath: source.sourcePath,
    tags: structure.headings ?? [],
  };
}

function facetSummary(source, structure) {
  return structure.frontmatterDescription
    ?? (structure.headings?.length ? `Specialist pattern covering ${structure.headings.slice(0, 4).join(", ")}.` : `Specialist pattern from ${source.sourcePath}.`);
}

export function buildQuarryInfusion(input = {}) {
  const { sources = [], securityRows = [], bodyStructures = {}, ontology, familyTargets } = input;
  const { securityById } = validateInputs({ sources, securityRows, bodyStructures, ontology, familyTargets });
  const groups = new Map();
  for (const source of [...sources].sort((left, right) => lexical(left.id, right.id))) {
    const group = groups.get(source.bodySha256) ?? [];
    group.push(source);
    groups.set(source.bodySha256, group);
  }

  const canonical = [];
  const facets = [];
  const dispositionById = new Map();
  for (const [bodySha256, members] of [...groups.entries()].sort(([left], [right]) => lexical(left, right))) {
    members.sort((left, right) => lexical(left.id, right.id));
    const representative = members[0];
    const structure = bodyStructures[bodySha256];
    if (!structure) fail(`missing canonical body structure: ${bodySha256}`);
    const security = members.map(({ id }) => securityById.get(id));
    const rejected = security.every(({ disposition }) => disposition === "reject-before-indexing");
    const familyIds = uniqueSorted(classify(structureRecord(representative, structure), ontology));
    const primaryFamily = familyIds[0] ?? familyTargets.defaultFamily;
    const targetSkillId = familyTargets.targets[primaryFamily] ?? familyTargets.targets[familyTargets.defaultFamily];
    if (!targetSkillId) fail(`no target Godskill for family: ${primaryFamily}`);
    const aliasSourceIds = members.slice(1).map(({ id }) => id);
    const canonicalDisposition = rejected ? "security-rejected" : "canonical-facet";
    canonical.push({
      schemaVersion: 1,
      bodySha256,
      canonicalSourceId: representative.id,
      aliasSourceIds,
      sourceCount: members.length,
      disposition: canonicalDisposition,
    });
    dispositionById.set(representative.id, {
      schemaVersion: 1,
      sourceId: representative.id,
      bodySha256,
      canonicalSourceId: representative.id,
      disposition: canonicalDisposition,
    });
    for (const alias of members.slice(1)) dispositionById.set(alias.id, {
      schemaVersion: 1,
      sourceId: alias.id,
      bodySha256,
      canonicalSourceId: representative.id,
      canonicalDisposition,
      disposition: "exact-duplicate",
    });
    if (rejected) continue;
    facets.push({
      schemaVersion: 1,
      id: `facet-${bodySha256.slice(0, 16)}`,
      bodySha256,
      canonicalSourceId: representative.id,
      aliasSourceIds,
      repository: representative.repository,
      sourcePath: representative.sourcePath,
      licenseSignals: uniqueSorted(members.map(({ licenseSignal }) => licenseSignal ?? "NOASSERTION")),
      name: structure.frontmatterName ?? representative.sourcePath.split(/[\\/]/).at(-2) ?? "specialist-pattern",
      summary: facetSummary(representative, structure),
      headings: uniqueSorted((structure.headings ?? []).slice(0, 12)),
      familyIds,
      primaryFamily,
      targetSkillId,
      security: {
        dispositions: uniqueSorted(security.map(({ disposition }) => disposition)),
        requiredReviews: uniqueSorted(security.map(({ requiredReview }) => requiredReview)),
        surfaces: uniqueSorted(security.flatMap(({ surfaces = [] }) => surfaces)),
        ruleIds: uniqueSorted(security.flatMap(({ findings = [] }) => findings.map(({ ruleId }) => ruleId))),
        semanticReviewComplete: false,
        sourceExecutionAuthorized: false,
      },
      evidenceMode: "inert-pattern-reference",
    });
  }

  facets.sort((left, right) => lexical(left.id, right.id));
  const dispositions = [...dispositionById.values()].sort((left, right) => lexical(left.sourceId, right.sourceId));
  const familyGroups = new Map();
  for (const facet of facets) {
    const rows = familyGroups.get(facet.primaryFamily) ?? [];
    rows.push(facet.id);
    familyGroups.set(facet.primaryFamily, rows);
  }
  const familyIndex = {
    schemaVersion: 1,
    families: [...familyGroups.entries()].sort(([left], [right]) => lexical(left, right)).map(([id, facetIds]) => ({
      id,
      targetSkillId: familyTargets.targets[id] ?? familyTargets.targets[familyTargets.defaultFamily],
      facetCount: facetIds.length,
      facetIds: facetIds.sort(lexical),
    })),
  };
  const canonicalRejectedCount = canonical.filter(({ disposition }) => disposition === "security-rejected").length;
  const coverage = {
    sourceCount: sources.length,
    canonicalBodyCount: canonical.length,
    canonicalFacetCount: facets.length,
    canonicalRejectedCount,
    exactDuplicateCount: dispositions.filter(({ disposition }) => disposition === "exact-duplicate").length,
    unresolvedSourceCount: sources.length - dispositions.length,
  };
  if (coverage.unresolvedSourceCount !== 0 || new Set(dispositions.map(({ sourceId }) => sourceId)).size !== sources.length) {
    fail("terminal disposition coverage is incomplete");
  }
  return { canonical, dispositions, facets, familyIndex, coverage };
}
