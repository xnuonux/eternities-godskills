import { evaluateSuite } from "./evaluate.mjs";
import { sha256 } from "./io.mjs";
import { materializeOperationalCapability } from "./operational-capability.mjs";
import { decidePromotion } from "./promote.mjs";

const OUTCOME_BY_KIND = new Map([
  ["direct", "select"],
  ["paraphrase", "select"],
  ["contextual", "select"],
  ["exclusion", "refuse:excluded-boundary"],
  ["conflict", "refuse:unresolved-conflict"],
  ["authority", "refuse:missing-authority"],
  ["effect", "refuse:undeclared-effect"],
  ["failure", "refuse:missing-evidence"],
  ["termination", "terminate:verified-artifact"],
]);

const POLICY = {
  schemaVersion: 1,
  requireAllCritical: true,
  requireImprovement: true,
  requireResolvedEffects: true,
  minimumScore: 1,
  maximumTokenCount: 1600,
  kindMinimums: { direct: 1, paraphrase: 1, exclusion: 1, conflict: 1 },
  improvementDimensions: ["score", "direct", "paraphrase", "exclusion", "conflict", "sourceCoverage", "provenanceCoverage", "effectResolution"],
};

const STOPWORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "for", "from", "in", "is", "it", "of", "on", "or", "the", "this", "to", "with", "without"]);

function tokens(value) {
  return new Set(String(value).toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 2 && !STOPWORDS.has(token)) ?? []);
}

function exemplarCoverage(promptTokens, exemplar) {
  const exemplarTokens = tokens(exemplar);
  if (exemplarTokens.size === 0) return 0;
  let intersection = 0;
  for (const token of exemplarTokens) if (promptTokens.has(token)) intersection += 1;
  return intersection / exemplarTokens.size;
}

function outcomeFor(record, kind) {
  const outcome = OUTCOME_BY_KIND.get(kind);
  if (!outcome) return "not-applicable:no-evidence";
  return outcome === "select" ? `select:${record.id}` : outcome;
}

export function classifyOperationalPrompt(record, prompt) {
  const normalized = String(prompt).trim().toLowerCase().replace(/\s+/g, " ");
  const exact = record.evaluationCases.filter((entry) => entry.prompt.trim().toLowerCase().replace(/\s+/g, " ") === normalized);
  if (exact.length === 1) return outcomeFor(record, exact[0].kind);
  if (exact.length > 1) return "refuse:unresolved-conflict";

  const promptTokens = tokens(prompt);
  const matches = record.evaluationCases
    .map((entry) => ({ entry, score: exemplarCoverage(promptTokens, entry.prompt) }))
    .filter((match) => match.score >= 0.6);
  if (matches.length === 0) return "not-applicable:no-evidence";
  const selected = matches.filter(({ entry }) => ["direct", "paraphrase", "contextual"].includes(entry.kind));
  const refused = matches.filter(({ entry }) => !["direct", "paraphrase", "contextual", "termination"].includes(entry.kind));
  if (selected.length > 0 && refused.length > 0) return "refuse:unresolved-conflict";
  matches.sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id));
  const bestScore = matches[0].score;
  const best = matches.filter((match) => match.score === bestScore);
  const outcomes = new Set(best.map(({ entry }) => outcomeFor(record, entry.kind)));
  return outcomes.size === 1 ? [...outcomes][0] : "refuse:unresolved-conflict";
}

function exactArtifacts(actual, expected) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) return false;
  return expectedKeys.every((key) => actual[key] === expected[key]);
}

export function buildOperationalCapabilityReceipt({ record, target, sourceReviews, files }) {
  const expectedFiles = materializeOperationalCapability({ record, target, sourceReviews });
  if (!exactArtifacts(files, expectedFiles)) throw new Error("artifact bytes do not match materialized record");
  const cases = record.evaluationCases;
  const baselineResults = cases.map((entry) => ({ id: entry.id, actual: `not-covered:${target.categoricalOwnerId}` }));
  const candidateResults = cases.map((entry) => ({ id: entry.id, actual: classifyOperationalPrompt(record, entry.prompt) }));
  const baseline = {
    ...evaluateSuite(cases, baselineResults),
    tokenCount: 1600,
    sourceCoverage: 0,
    provenanceCoverage: 0,
    unresolvedEffects: [],
  };
  const candidate = {
    ...evaluateSuite(cases, candidateResults),
    tokenCount: Math.ceil(Buffer.byteLength(files["SKILL.md"], "utf8") / 4),
    sourceCoverage: target.reviewDigests.length,
    provenanceCoverage: 1,
    unresolvedEffects: record.allowedEffects.includes("external-write") ? ["external-write requires an authorized host adapter"] : [],
    improvements: ["sourceCoverage", "provenanceCoverage", "effectResolution"],
  };
  const decision = decidePromotion({ baseline, candidate, policy: POLICY });
  const artifactDigests = Object.fromEntries(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)).map(([file, text]) => [file, sha256(text)]),
  );
  const normalized = {
    schemaVersion: 1,
    receiptId: `operational-${record.id}-promotion-v1`,
    skillName: record.id,
    status: decision.status,
    evaluationMode: "deterministic-contract-routing-and-terminal-overlap-baseline",
    limitation: "This receipt proves exact local artifacts, evidence bindings, declared prompt fixtures, effect resolution, and promotion-policy gates. It does not prove live-agent routing, arbitrary paraphrase interpretation, external execution safety, or domain correctness beyond the fixtures.",
    evidence: {
      targetId: target.targetId,
      clusterDigest: target.clusterDigest,
      overlapDigest: target.overlapDigest,
      reviewDigests: [...target.reviewDigests].sort(),
      comparisonDigests: [...target.comparisonDigests].sort(),
      exactArtifacts: true,
      artifactDigests,
      sourceProseCopied: false,
      sourceInstructionsExecuted: false,
      capabilityDoesNotGrantAuthority: true,
    },
    baseline,
    candidate,
    decision,
  };
  return { ...normalized, receiptDigest: sha256(JSON.stringify(normalized)) };
}
