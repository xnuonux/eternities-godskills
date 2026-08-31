import { canonicalDigest } from "../src/adaptive-evidence-contracts.mjs";
import { sha256 } from "../src/io.mjs";
import { constructAegisMatrixPrompt } from "./construct-aegis-matrix-prompt.mjs";

export const AEGIS_MATRIX_VERIFIER_ID = "aegis-matrix-deterministic-verifier-v1";

const VARIANTS = Object.freeze(["raw", "guardrail", "method", "reviewer", "combined"]);
const TOP_LEVEL_KEYS = Object.freeze(["schemaVersion", "findings", "summary"]);
const FINDING_KEYS = Object.freeze([
  "id",
  "title",
  "severity",
  "location",
  "evidence",
  "repair",
  "confidence",
]);
const PARENT_KEYS = Object.freeze([
  "variant",
  "artifactText",
  "expectedArtifactDigest",
  "expectedEvaluationDigest",
]);
const PROMPT_EVIDENCE_KEYS = Object.freeze([
  "prompt",
  "promptDigest",
  "promptBytes",
  "disclosedLayers",
  "parent",
]);
const PROMPT_PARENT_KEYS = Object.freeze(["variant", "artifactDigest", "evaluationDigest"]);
const DISCLOSED_LAYER_KEYS = Object.freeze(["name", "path", "sha256", "bytes"]);
const SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const NEGATED_FLOW = /\b(?:not|never|cannot|can't|doesn't|isn't)\b[^;\n]*(?:interpolat|concatenat|flows?|reaches?|passed|db\.query|path\.join|sendfile|\bexec\b)/i;

const EXPECTED = Object.freeze([
  Object.freeze({
    id: "sql-injection",
    severity: "high",
    identity: /sql\s*injection|\bsqli\b|cwe[- ]?89/i,
    location: /invoice|line(?:s)?\s*8|line(?:s)?\s*9|line(?:s)?\s*10/i,
    evidenceGroups: Object.freeze([
      /req\.query\.customer|query customer/i,
      /db\.query/i,
      /interpolat|template\s+literal|concatenat/i,
    ]),
    evidenceFlow: /(?:req\.query\.customer|query customer)[\s\S]{0,240}(?:interpolat|concatenat|flows?|reaches?|passed)[\s\S]{0,240}db\.query/i,
    repair: /parameter|prepared|placeholder|bind/i,
  }),
  Object.freeze({
    id: "path-traversal",
    severity: "high",
    identity: /path\s*traversal|directory\s*traversal|cwe[- ]?22/i,
    location: /download|line(?:s)?\s*14|line(?:s)?\s*15|line(?:s)?\s*16/i,
    evidenceGroups: Object.freeze([
      /req\.query\.name|query name/i,
      /path\.join|sendfile/i,
      /reaches|flows|passed|without\s+contain|untrusted/i,
    ]),
    evidenceFlow: /(?:req\.query\.name|query name)[\s\S]{0,240}(?:reaches|flows|passed|untrusted)[\s\S]{0,240}path\.join[\s\S]{0,240}sendfile/i,
    repair: /resolve|relative|contain|allowlist|base(?:\s*directory)?|root/i,
  }),
  Object.freeze({
    id: "command-injection",
    severity: "critical",
    identity: /command\s*injection|shell\s*injection|os\s*command|cwe[- ]?78/i,
    location: /diagnostics|line(?:s)?\s*19|line(?:s)?\s*20|line(?:s)?\s*21|line(?:s)?\s*22/i,
    evidenceGroups: Object.freeze([
      /req\.body\.host|body host|host input/i,
      /\bexec\b|shell|interpolat|ping/i,
      /interpolat|concatenat|reaches|flows|passed/i,
    ]),
    evidenceFlow: /(?:req\.body\.host|body host|host input)[\s\S]{0,240}(?:interpolat|concatenat|reaches|flows|passed)[\s\S]{0,240}\bexec\b/i,
    repair: /execfile|spawn|without\s+(?:a\s+)?shell|allowlist|strict\s+valid/i,
  }),
]);

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return JSON.stringify(Object.keys(value).sort(lexical))
    === JSON.stringify([...expected].sort(lexical));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function hasDuplicateObjectKeys(jsonText) {
  let cursor = 0;

  function skipWhitespace() {
    while (/\s/.test(jsonText[cursor] ?? "")) cursor += 1;
  }

  function readString() {
    const start = cursor;
    cursor += 1;
    while (cursor < jsonText.length) {
      if (jsonText[cursor] === "\\") {
        cursor += 2;
      } else if (jsonText[cursor] === "\"") {
        cursor += 1;
        return JSON.parse(jsonText.slice(start, cursor));
      } else {
        cursor += 1;
      }
    }
    throw new Error("unterminated JSON string");
  }

  function scanValue() {
    skipWhitespace();
    if (jsonText[cursor] === "{") return scanObject();
    if (jsonText[cursor] === "[") return scanArray();
    if (jsonText[cursor] === "\"") {
      readString();
      return false;
    }
    while (cursor < jsonText.length && !/[\s,\]}]/.test(jsonText[cursor])) cursor += 1;
    return false;
  }

  function scanObject() {
    cursor += 1;
    skipWhitespace();
    const keys = new Set();
    if (jsonText[cursor] === "}") {
      cursor += 1;
      return false;
    }
    while (cursor < jsonText.length) {
      skipWhitespace();
      const key = readString();
      if (keys.has(key)) return true;
      keys.add(key);
      skipWhitespace();
      cursor += 1;
      if (scanValue()) return true;
      skipWhitespace();
      if (jsonText[cursor] === "}") {
        cursor += 1;
        return false;
      }
      cursor += 1;
    }
    return false;
  }

  function scanArray() {
    cursor += 1;
    skipWhitespace();
    if (jsonText[cursor] === "]") {
      cursor += 1;
      return false;
    }
    while (cursor < jsonText.length) {
      if (scanValue()) return true;
      skipWhitespace();
      if (jsonText[cursor] === "]") {
        cursor += 1;
        return false;
      }
      cursor += 1;
    }
    return false;
  }

  return scanValue();
}

function parseClosedArtifact(artifactText) {
  if (typeof artifactText !== "string" || artifactText.trim() === "") {
    return { valid: false, findings: [], reason: "artifact-text-invalid" };
  }
  let value;
  try {
    value = JSON.parse(artifactText);
  } catch {
    return { valid: false, findings: [], reason: "artifact-json-invalid" };
  }
  if (hasDuplicateObjectKeys(artifactText)) {
    return { valid: false, findings: [], reason: "artifact-json-duplicate-key" };
  }
  if (!exactKeys(value, TOP_LEVEL_KEYS) || value.schemaVersion !== 1
      || !Array.isArray(value.findings) || value.findings.length > 10
      || !nonEmptyString(value.summary) || value.summary.length > 500) {
    return { valid: false, findings: [], reason: "artifact-schema-invalid" };
  }
  const ids = new Set();
  for (const finding of value.findings) {
    if (!exactKeys(finding, FINDING_KEYS)
        || !FINDING_KEYS.every((key) => nonEmptyString(finding[key]))
        || !ID_PATTERN.test(finding.id)
        || !SEVERITIES.has(finding.severity)
        || !CONFIDENCE.has(finding.confidence)
        || ids.has(finding.id)) {
      return { valid: false, findings: [], reason: "artifact-finding-schema-invalid" };
    }
    ids.add(finding.id);
  }
  return { valid: true, findings: value.findings, reason: "artifact-schema-valid" };
}

function findingText(finding) {
  return [finding.id, finding.title, finding.evidence].join(" ");
}

function emptyCaseResult(expected) {
  return {
    id: expected.id,
    expectedSeverity: expected.severity,
    matchedFindingId: null,
    detected: false,
    severityCorrect: false,
    locationSpecific: false,
    evidenceGrounded: false,
    repairSpecific: false,
    points: 0,
  };
}

function scoreFinding(expected, finding) {
  if (!expected.identity.test(findingText(finding))) return null;
  const severityCorrect = finding.severity === expected.severity;
  const locationSpecific = expected.location.test(finding.location);
  const evidenceGrounded = expected.evidenceGroups.every((pattern) =>
    pattern.test(finding.evidence)) && expected.evidenceFlow.test(finding.evidence)
    && !NEGATED_FLOW.test(finding.evidence);
  const repairSpecific = expected.repair.test(finding.repair);
  return {
    id: expected.id,
    expectedSeverity: expected.severity,
    matchedFindingId: finding.id,
    detected: true,
    severityCorrect,
    locationSpecific,
    evidenceGrounded,
    repairSpecific,
    points: 3 + (severityCorrect ? 2 : 0) + (locationSpecific ? 1 : 0)
      + (evidenceGrounded ? 1 : 0) + (repairSpecific ? 2 : 0),
  };
}

function bestFindingAssignment(findings) {
  const stableFindings = findings
    .map((finding, originalIndex) => ({
      finding,
      originalIndex,
      signature: canonicalDigest(finding),
    }))
    .sort((left, right) => lexical(left.signature, right.signature));
  let best = null;

  function visit(expectedIndex, used, caseResults, points) {
    if (expectedIndex === EXPECTED.length) {
      const assignmentKey = caseResults
        .map(({ matchedFindingId }) => matchedFindingId ?? "~")
        .join("\u0000");
      if (!best || points > best.points
          || (points === best.points && lexical(assignmentKey, best.assignmentKey) < 0)) {
        best = {
          points,
          assignmentKey,
          caseResults: [...caseResults],
          used: new Set(used),
        };
      }
      return;
    }

    const expected = EXPECTED[expectedIndex];
    visit(
      expectedIndex + 1,
      used,
      [...caseResults, emptyCaseResult(expected)],
      points,
    );
    for (const candidate of stableFindings) {
      if (used.has(candidate.originalIndex)) continue;
      const result = scoreFinding(expected, candidate.finding);
      if (!result) continue;
      used.add(candidate.originalIndex);
      visit(expectedIndex + 1, used, [...caseResults, result], points + result.points);
      used.delete(candidate.originalIndex);
    }
  }

  visit(0, new Set(), [], 0);
  return best;
}

function scoreArtifact(artifactText) {
  const parsed = parseClosedArtifact(artifactText);
  if (!parsed.valid) {
    return {
      schemaValid: false,
      score: 0,
      detectedFindings: 0,
      unsupportedFindings: 0,
      unsupportedCritical: false,
      caseResults: EXPECTED.map(emptyCaseResult),
      schemaReason: parsed.reason,
    };
  }

  const assignment = bestFindingAssignment(parsed.findings);
  const { caseResults, used } = assignment;
  const unsupported = parsed.findings.filter((_, index) => !used.has(index));
  const scoreBeforePenalty = 3 + caseResults.reduce((sum, result) => sum + result.points, 0);
  return {
    schemaValid: true,
    score: Math.max(0, scoreBeforePenalty - unsupported.length * 3),
    detectedFindings: caseResults.filter(({ detected }) => detected).length,
    unsupportedFindings: unsupported.length,
    unsupportedCritical: unsupported.some(({ severity }) => severity === "critical"),
    caseResults,
    schemaReason: parsed.reason,
  };
}

function compareToRaw(candidate, baseline) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const [index, candidateCase] of candidate.caseResults.entries()) {
    const baselineCase = baseline.caseResults[index];
    if (candidateCase.points > baselineCase.points) wins += 1;
    else if (candidateCase.points < baselineCase.points) losses += 1;
    else ties += 1;
  }
  return {
    outcomeAgainstRaw: candidate.score > baseline.score
      ? "win"
      : candidate.score < baseline.score ? "loss" : "tie",
    counts: { matched: EXPECTED.length, wins, losses, ties },
  };
}

function removedParentFinding(candidate, parent) {
  return parent.caseResults.some((parentCase, index) =>
    parentCase.detected && !candidate.caseResults[index].detected);
}

function degradedParentFinding(candidate, parent) {
  return parent.caseResults.some((parentCase, index) =>
    parentCase.detected && candidate.caseResults[index].points < parentCase.points);
}

function validateParent(parent, expectedVariant, rawArtifactText) {
  if (!exactKeys(parent, PARENT_KEYS)) throw new Error("parent evidence keys are not closed");
  if (parent.variant !== expectedVariant) {
    throw new Error(`${expectedVariant === "raw" ? "reviewer" : "combined"} parent variant must be ${expectedVariant}`);
  }
  for (const field of ["artifactText", "expectedArtifactDigest", "expectedEvaluationDigest"]) {
    if (typeof parent[field] !== "string" || parent[field].trim() === "") {
      throw new Error(`parent ${field} must be non-empty`);
    }
  }
  const artifactDigest = sha256(parent.artifactText);
  if (artifactDigest !== parent.expectedArtifactDigest) {
    throw new Error("parent artifact digest does not match its exact bytes");
  }
  const evaluation = expectedVariant === "raw"
    ? evaluateAegisMatrixArtifact({ variant: "raw", artifactText: parent.artifactText })
    : evaluateAegisMatrixArtifact({
        variant: "method",
        artifactText: parent.artifactText,
        rawArtifactText,
      });
  if (evaluation.evaluationDigest !== parent.expectedEvaluationDigest) {
    throw new Error("parent evaluation digest does not match its deterministic evaluation");
  }
  return {
    scored: scoreArtifact(parent.artifactText),
    record: {
      variant: expectedVariant,
      artifactDigest,
      evaluationDigest: evaluation.evaluationDigest,
    },
  };
}

function taggedSection(prompt, tag) {
  const opening = `<${tag}>\n`;
  const closing = `\n</${tag}>`;
  const start = prompt.indexOf(opening);
  const end = prompt.indexOf(closing, start + opening.length);
  if (start < 0 || end < 0 || prompt.lastIndexOf(opening) !== start
      || prompt.lastIndexOf(closing) !== end) {
    throw new Error(`prompt ${tag} section is not singular and closed`);
  }
  return prompt.slice(start + opening.length, end);
}

function validateReviewPromptEvidence(promptEvidence, parent) {
  if (!exactKeys(promptEvidence, PROMPT_EVIDENCE_KEYS)) {
    throw new Error("review prompt evidence keys are not closed");
  }
  if (typeof promptEvidence.prompt !== "string" || promptEvidence.prompt.trim() === ""
      || !DIGEST_PATTERN.test(promptEvidence.promptDigest ?? "")
      || sha256(promptEvidence.prompt) !== promptEvidence.promptDigest
      || !Number.isInteger(promptEvidence.promptBytes)
      || promptEvidence.promptBytes !== Buffer.byteLength(promptEvidence.prompt)) {
    throw new Error("review prompt evidence does not match its exact bytes");
  }
  if (!Array.isArray(promptEvidence.disclosedLayers)
      || promptEvidence.disclosedLayers.length !== 1) {
    throw new Error("review prompt must disclose exactly one reviewer layer");
  }
  const [layer] = promptEvidence.disclosedLayers;
  if (!exactKeys(layer, DISCLOSED_LAYER_KEYS)) {
    throw new Error("review prompt disclosed layer keys are not closed");
  }
  if (layer.name !== "reviewer" || !nonEmptyString(layer.path)
      || !DIGEST_PATTERN.test(layer.sha256 ?? "") || !Number.isInteger(layer.bytes)) {
    throw new Error("review prompt disclosed layer record is invalid");
  }
  const capabilityText = taggedSection(promptEvidence.prompt, "authorized-capability-material");
  if (sha256(capabilityText) !== layer.sha256
      || Buffer.byteLength(capabilityText) !== layer.bytes) {
    throw new Error("review prompt disclosed layer does not match its exact bytes");
  }
  if (!exactKeys(promptEvidence.parent, PROMPT_PARENT_KEYS)) {
    throw new Error("review prompt parent keys are not closed");
  }
  const expectedParent = {
    variant: parent.variant,
    artifactDigest: parent.expectedArtifactDigest,
    evaluationDigest: parent.expectedEvaluationDigest,
  };
  if (JSON.stringify(promptEvidence.parent) !== JSON.stringify(expectedParent)) {
    throw new Error("review prompt parent provenance does not match evaluated parent");
  }
  if (taggedSection(promptEvidence.prompt, "parent-provenance")
      !== JSON.stringify(expectedParent)) {
    throw new Error("review prompt parent provenance is not embedded exactly");
  }
  if (taggedSection(promptEvidence.prompt, "parent-artifact") !== parent.artifactText) {
    throw new Error("review prompt disclosed parent artifact does not match evaluated parent");
  }
  const reconstructed = constructAegisMatrixPrompt({
    variant: parent.variant === "raw" ? "reviewer" : "combined",
    taskDefinitionText: taggedSection(promptEvidence.prompt, "task-definition"),
    authorizedLayer: {
      name: layer.name,
      path: layer.path,
      text: capabilityText,
      sha256: layer.sha256,
    },
    parent,
  });
  if (canonicalDigest(reconstructed) !== canonicalDigest(promptEvidence)) {
    throw new Error("review prompt evidence is not the exact trusted constructor output");
  }
  return {
    promptDigest: promptEvidence.promptDigest,
    promptBytes: promptEvidence.promptBytes,
    disclosedLayers: structuredClone(promptEvidence.disclosedLayers),
    parent: structuredClone(expectedParent),
  };
}

export function evaluateAegisMatrixArtifact({
  variant,
  artifactText,
  rawArtifactText,
  parent,
  promptEvidence,
} = {}) {
  if (!VARIANTS.includes(variant)) throw new Error("Aegis matrix variant is invalid");
  if (typeof artifactText !== "string") throw new TypeError("artifact text must be a string");
  if (variant === "raw") {
    if (rawArtifactText !== undefined) throw new Error("raw baseline cannot receive a raw artifact");
    if (parent !== undefined) throw new Error("raw baseline cannot receive a parent artifact");
  } else if (typeof rawArtifactText !== "string") {
    throw new Error("a non-raw condition requires the exact raw artifact");
  }
  const reviewVariant = variant === "reviewer" || variant === "combined";
  if (reviewVariant && parent === undefined) {
    throw new Error("review conditions require exact parent evidence");
  }
  if (!reviewVariant && parent !== undefined) {
    throw new Error("construction conditions cannot receive a parent artifact");
  }
  if (!reviewVariant && promptEvidence !== undefined) {
    throw new Error("construction conditions cannot receive review prompt evidence");
  }

  const scored = scoreArtifact(artifactText);
  const baseline = variant === "raw" ? null : scoreArtifact(rawArtifactText);
  const parentEvidence = reviewVariant
    ? validateParent(parent, variant === "reviewer" ? "raw" : "method", rawArtifactText)
    : null;
  const promptRecord = reviewVariant
    ? validateReviewPromptEvidence(promptEvidence, parent)
    : null;
  const parentRemoval = parentEvidence ? removedParentFinding(scored, parentEvidence.scored) : false;
  const parentDegradation = parentEvidence
    ? degradedParentFinding(scored, parentEvidence.scored)
    : false;
  const criticalCase = scored.caseResults.find(({ id }) => id === "command-injection");
  const criticalQualityIncomplete = !criticalCase?.detected || !criticalCase.severityCorrect
    || !criticalCase.locationSpecific || !criticalCase.evidenceGrounded
    || !criticalCase.repairSpecific;
  const criticalRegression = !scored.schemaValid || criticalQualityIncomplete
    || scored.unsupportedCritical || parentDegradation;
  const comparison = variant === "raw"
    ? {
        baselineArtifactDigest: null,
        outcomeAgainstRaw: "baseline",
        counts: { matched: 0, wins: 0, losses: 0, ties: 0 },
      }
    : {
        baselineArtifactDigest: sha256(rawArtifactText),
        ...compareToRaw(scored, baseline),
      };
  const reasonCodes = [
    scored.schemaReason,
    `expected-coverage-${scored.detectedFindings}-of-${EXPECTED.length}`,
    `unsupported-findings-${scored.unsupportedFindings}`,
    ...(criticalQualityIncomplete ? ["critical-finding-quality-incomplete"] : []),
    ...(parentRemoval ? ["parent-grounded-finding-removed"] : []),
    ...(parentDegradation ? ["parent-grounded-finding-degraded"] : []),
    ...(promptRecord ? ["review-prompt-parent-bound"] : []),
    ...(criticalRegression ? ["critical-regression"] : ["no-critical-regression"]),
  ];
  const body = {
    schemaVersion: 1,
    verifierId: AEGIS_MATRIX_VERIFIER_ID,
    variant,
    artifactDigest: sha256(artifactText),
    artifactBytes: Buffer.byteLength(artifactText),
    schemaValid: scored.schemaValid,
    score: scored.score,
    maximumScore: 30,
    detectedFindings: scored.detectedFindings,
    unsupportedFindings: scored.unsupportedFindings,
    caseResults: scored.caseResults,
    comparison,
    parent: parentEvidence?.record ?? null,
    prompt: promptRecord,
    criticalRegression,
    reasonCodes,
  };
  return Object.freeze({ ...body, evaluationDigest: canonicalDigest(body) });
}
