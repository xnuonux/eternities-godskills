import { sha256 } from "./io.mjs";
import {
  validateCompilerReceipt,
  validateNaturalRequest,
  validateSemanticProposal,
} from "./intent-contracts.mjs";
import { validateRoutingCard } from "./routing-contracts.mjs";
import { searchWave2SemanticAtlas } from "./quarry-atlas.mjs";

const STOP_WORDS = new Set([
  "a", "about", "after", "all", "an", "and", "anything", "as", "at", "be",
  "been", "before", "but", "by", "can", "do", "for", "from", "have", "how",
  "i", "in", "into", "is", "it", "its", "me", "my", "of", "on", "one", "or",
  "our", "please", "so", "some", "that", "the", "their", "them", "these",
  "this", "those", "through", "to", "turn", "up", "us", "we", "while",
  "with", "without", "you", "your",
]);

const WRITE_WORDS = new Set([
  "build", "edit", "fix", "implement", "integrate", "migrate",
  "redesign", "refactor", "rewrite", "update",
]);
const EXTERNAL_READ_WORDS = new Set([
  "browse", "internet", "online", "probe", "scan", "web",
]);
const EXTERNAL_WRITE_WORDS = new Set([
  "buy", "deploy", "email", "message", "notify", "post", "publish", "purchase",
  "send", "spend", "submit", "upload",
]);

const MINIMUM_INTENT_SUPPORT = 12;

function lexicalCompare(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sorted(values) {
  return [...new Set(values)].sort(lexicalCompare);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort(lexicalCompare).map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableDigest(value) {
  return sha256(JSON.stringify(stableValue(value)));
}

function stem(token) {
  if (token.length > 6 && token.endsWith("ization")) return token.slice(0, -7);
  if (token.length > 6 && token.endsWith("ments")) return token.slice(0, -5);
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith("ions")) return token.slice(0, -4);
  if (token.length > 5 && token.endsWith("tion")) return token.slice(0, -4);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokens(text) {
  return sorted(
    text
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[-_/]+/g, " ")
      .replace(/[^a-z0-9\s]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
      .map(stem),
  );
}

function plainText(text) {
  return text.normalize("NFKD").toLowerCase().replace(/[^a-z0-9\s]+/g, " ");
}

function omitExplicitExternalExclusions(text) {
  // Only recognize a bounded noun-list grammar. Preserve uncertain/double
  // negation, and never let one excluded mention cancel another occurrence.
  const item = "(?:any\\s+)?(?:tools?|network\\s+access|browsing)";
  const list = `(?:${item}(?:\\s*,\\s*${item}){0,3}\\s*,?\\s+(?:and|or)\\s+)?`;
  const exclusion = new RegExp(
    `\\b(?:without|no)\\s+(?:any\\s+)?${list}external\\s+(?:actions?|changes?|mutations?)\\b`,
    "gi",
  );
  return text.replace(exclusion, (match, offset) => {
    const suffix = text.slice(offset + match.length);
    // A qualifier/continuation is not an unconditional prohibition. Only
    // accept a terminal clause; comma continuations remain conservative too.
    if (!/^\s*(?:[.!?;:\n]|$)/.test(suffix)) return match;
    const prefix = text.slice(0, offset).split(/[,.!?;:\n]/).at(-1);
    if (/\b(?:not|never|no|without|cannot|\w+n['’]t)\b/i.test(prefix)) return match;
    return " ";
  });
}

function actionNegated(plain, word) {
  const action = `\\b${word}\\w*\\b`;
  const reversal = new RegExp(
    `\\bdo not\\s+(?:fail|hesitate|neglect)\\s+to\\s+(?:\\w+\\s+){0,3}${action}` +
      `|\\bdo not\\s+forget\\s+(?:to|that)\\s+(?:(?!(?:never|no|not|without)\\b)\\w+\\s+){0,5}${action}` +
      `|\\bnot only\\s+(?:(?!(?:never|no|not|without)\\b)\\w+\\s+){0,3}${action}`,
    "g",
  );
  const withoutReversals = plain.replace(reversal, " ");
  return new RegExp(`\\b(?:without|do not|not|no)\\s+(?:\\w+\\s+){0,6}${action}`).test(withoutReversals);
}

function changeRequestsMutation(plain) {
  if (actionNegated(plain, "change")) return false;
  return [...plain.matchAll(/\bchange\w*\b/g)].some((match) => {
    const prefix = plain.slice(Math.max(0, match.index - 64), match.index);
    return !/\b(?:could|may|might|would)\s+(?:\w+\s+){0,3}$/.test(prefix);
  });
}

function publicationRequested(plain) {
  const positiveAction = (words) => words.some((word) =>
    new RegExp(`\\b${word}\\w*\\b`).test(plain) && !actionNegated(plain, word));
  return (
    positiveAction(["post", "publish", "upload"]) ||
    /\b(?:make|share)\b.{0,24}\bpublic(?:ly)?\b/.test(plain) &&
      positiveAction(["make", "share"]) ||
    /\b(?:make|put|take)\b.{0,32}\blive\b/.test(plain) &&
      positiveAction(["make", "put", "take"]) ||
    /\bgo\s+live\b/.test(plain) && !actionNegated(plain, "go") ||
    /\b(?:activate|enable)\b.{0,32}\b(?:live|public(?:ly)?|release)\b/.test(plain) &&
      positiveAction(["activate", "enable"]) ||
    /\blaunch\b.{0,32}\b(?:live|public(?:ly)?)\b/.test(plain) && !actionNegated(plain, "launch") ||
    /\bannounce\b.{0,40}\b(?:account|channel|social)\b/.test(plain) && !actionNegated(plain, "announce") ||
    /\bsubmit\b.*\bstore\b/.test(plain) && !actionNegated(plain, "submit") ||
    /\brelease\b.*\b(?:public(?:ly)?|recording|final cut)\b/.test(plain) && !actionNegated(plain, "release")
  );
}

function credentialUseRequested(plain) {
  return /\b(?:admin(?:istrator)?\s+(?:password|token)|access token|api key|bearer token|client secret|credential|database password|login session|private key|secret manager|service token|session cookie|shared vault|vault)\b/.test(plain);
}

function overlap(left, right) {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token));
}

function evidenceFor(requestTokens, text, label, weight) {
  const matched = overlap(requestTokens, tokens(text));
  return matched.map((token) => ({ evidence: `${label}:${token}`, weight }));
}

function intentHintEvidence(card, plain) {
  if (
    card.id === "eternities-phoenix" &&
    /\bdiagnos\w*\b/.test(plain) &&
    /\b(?:latency|p\d{2}|spike|trace|traces)\b/.test(plain) &&
    /\b(?:non destructive|repair|repeatable|root cause)\b/.test(plain)
  ) {
    return [{ evidence: "intent-hint:diagnostic-observability", weight: 14 }];
  }
  return [];
}

function scoreCard(card, requestTokens, plain) {
  const entries = [
    ...evidenceFor(requestTokens, card.intent, "intent-token", 5),
    ...evidenceFor(requestTokens, card.successCondition, "success-token", 3),
    ...evidenceFor(requestTokens, card.family, "family-token", 5),
    ...card.provides.flatMap((value) => evidenceFor(requestTokens, value, "capability-token", 7)),
    ...Object.values(card.intentExamples)
      .flat()
      .flatMap((value) => evidenceFor(requestTokens, value, "example-token", 4)),
    ...card.negativeIntents
      .flatMap((value) => evidenceFor(requestTokens, value, "negative-token", -6)),
    ...intentHintEvidence(card, plain),
  ];
  const byEvidence = new Map();
  for (const entry of entries) {
    const current = byEvidence.get(entry.evidence);
    if (current === undefined || entry.weight > current) byEvidence.set(entry.evidence, entry.weight);
  }
  const byToken = new Map();
  let intentSupport = 0;
  for (const [evidence, weight] of byEvidence) {
    if (weight < 0) continue;
    if (evidence.startsWith("intent-hint:")) {
      intentSupport += weight;
      continue;
    }
    const token = evidence.slice(evidence.indexOf(":") + 1);
    byToken.set(token, Math.max(byToken.get(token) ?? 0, weight));
  }
  return {
    id: card.id,
    score: [...byEvidence.values()].reduce((sum, value) => sum + value, 0),
    // Admission needs independent positive support, not repeated metadata words.
    // Keep the established ranking scale and negative penalties after admission.
    independentSupport: [...byToken.values()].reduce((sum, value) => sum + value, intentSupport),
    evidence: sorted([...byEvidence.keys()]),
  };
}

function compareScores(left, right) {
  return right.score - left.score || lexicalCompare(left.id, right.id);
}

function capabilityEvidenceCount(score) {
  return score.evidence.filter((entry) => entry.startsWith("capability-token:")).length;
}

function inferRequestedEffects(text) {
  const requestTokens = new Set(tokens(text));
  const plain = plainText(text);
  const negated = (word) => actionNegated(plain, word);
  const effects = new Set(["local-read"]);
  if (
    [...WRITE_WORDS].some((token) => requestTokens.has(stem(token)) && !negated(token)) ||
    changeRequestsMutation(plain)
  ) {
    effects.add("local-write");
  }
  const externalResearch = !/\b(?:do not|without)\b.{0,48}\b(?:latest|current|official)\b/.test(plain) && (
    /\b(?:latest|current|official)\b.{0,48}\b(?:api|contract|documentation|docs|provider|specification|standard)\b/.test(plain) ||
    /\b(?:api|contract|documentation|docs|provider|specification|standard)\b.{0,48}\b(?:latest|current|official)\b/.test(plain)
  );
  if (
    [...EXTERNAL_READ_WORDS].some((token) => requestTokens.has(stem(token)) && !negated(token)) ||
    /\b(?:security test|partner endpoint|partner network|vendor systems)\b/.test(plain) ||
    externalResearch
  ) {
    effects.add("external-read");
  }
  const productionMutationWords = [
    "change", "correct", "delete", "deploy", "enable", "fix", "migrate",
    "modify", "restart", "run",
  ];
  const productionMutation = /\b(?:production|live)\b/.test(plain) &&
    productionMutationWords.some((token) => requestTokens.has(stem(token)) && !negated(token));
  const explicitExternalChange = /\bexternal\s+(?:action|change|mutation)s?\b/.test(plain);
  if (
    [...EXTERNAL_WRITE_WORDS].some((token) => requestTokens.has(stem(token)) && !negated(token)) ||
    publicationRequested(plain) ||
    productionMutation ||
    explicitExternalChange
  ) {
    effects.add("external-write");
  }
  return sorted(effects);
}

function matchedCapabilities(card, requestTokens) {
  const matches = evidencedCapabilities(card, requestTokens);
  return sorted(matches.length > 0 ? matches : [card.provides[0]]);
}

function evidencedCapabilities(card, requestTokens) {
  return sorted(
    card.provides.filter((capability) => overlap(requestTokens, tokens(capability)).length > 0),
  );
}

function missingPolicyDecisions(cards, context) {
  const authority = new Set(context.availableAuthority);
  const preconditions = new Set(context.availablePreconditions);
  const decisions = [];
  for (const card of cards) {
    for (const requirement of card.authorityRequirements) {
      if (!authority.has(requirement)) decisions.push(`authority:${requirement}`);
    }
    for (const precondition of card.preconditions) {
      if (!preconditions.has(precondition)) decisions.push(`precondition:${precondition}`);
    }
  }
  return sorted(decisions);
}

function consequentialDecisions(text, requestedEffects, context, selectedCards, allCards) {
  const requestTokens = new Set(tokens(text));
  const plain = plainText(text);
  const negated = (word) => actionNegated(plain, word);
  const authority = new Set(context.availableAuthority);
  const permitted = new Set(context.permittedEffects);
  const decisions = [];
  for (const effect of requestedEffects) {
    if (effect === "none") continue;
    if (!permitted.has(effect)) decisions.push(`effect-authority:${effect}`);
    if ((effect === "external-read" || effect === "external-write") && !authority.has(effect)) {
      decisions.push(`authority:${effect}`);
    }
    const supported = allCards.some((card) => card.effects.includes(effect));
    const selectedSupport = selectedCards.some((card) => card.effects.includes(effect));
    if (!supported || (selectedCards.length > 0 && !selectedSupport)) {
      decisions.push(`unsupported-effect:${effect}`);
    }
  }
  const writesExternally = requestedEffects.includes("external-write");
  if (writesExternally && (requestTokens.has("account") || requestTokens.has("channel"))) {
    if (!authority.has("account-write")) decisions.push("authority:account-write");
  }
  if (
    (requestTokens.has("spend") || requestTokens.has("buy") || requestTokens.has("purchase")) &&
    !negated("spend") && !negated("buy") && !negated("purchase")
  ) {
    if (!authority.has("spending-authority")) decisions.push("authority:spending-authority");
  }
  const publication = publicationRequested(plain);
  if (publication && !authority.has("publication-authority")) {
    decisions.push("authority:publication-authority");
  }
  if (credentialUseRequested(plain) &&
      !authority.has("credential-use")) {
    decisions.push("authority:credential-use");
  }
  if (/\b(?:clone\w*\s+(?:this\s+)?(?:singer s\s+)?voice|likeness|licensed footage|commercial spot|endorsement)\b/.test(plain) &&
      !authority.has("rights-and-consent-when-applicable")) {
    decisions.push("authority:rights-and-consent-when-applicable");
  }
  const securityScopeRequested =
    /\b(?:scan|probe|security test|intrusive security|exploitable|weakness|firewall)\b/.test(plain) ||
    /\b(?:audit|assess|review|threat model)\b.{0,64}\b(?:authorization|credential|permission|security|trust boundar\w*)\b/.test(plain) ||
    /\b(?:authorization|credential|permission|security|trust boundar\w*)\b.{0,64}\b(?:audit|assess|review|threat model)\b/.test(plain);
  if (securityScopeRequested &&
      !authority.has("authorized-security-scope")) {
    decisions.push("authority:authorized-security-scope");
  }
  if (
    /\b(?:production|live)\b/.test(plain) &&
    writesExternally &&
    !authority.has("production-write")
  ) {
    decisions.push("authority:production-write");
  }
  return sorted(decisions);
}

function confidenceFor(scores) {
  if (scores.length === 0) return "low";
  if (scores[0].score >= 35 && (scores[1] === undefined || scores[0].score - scores[1].score >= 8)) {
    return "verified";
  }
  if (scores[0].score >= 22) return "high";
  if (scores[0].score >= 12) return "medium";
  return "low";
}

function explicitlyCompatible(left, right) {
  return left.compatibleWith.includes(right.id) &&
    right.compatibleWith.includes(left.id) &&
    !left.conflictsWith.includes(right.id) &&
    !right.conflictsWith.includes(left.id);
}

function naturalComposition(scores, byId, requestTokens, maxCompositionSize) {
  if (scores.length < 2 || maxCompositionSize < 2) return null;
  const eligible = scores.filter((score) =>
    score.score >= 20 &&
    evidencedCapabilities(byId.get(score.id), requestTokens).length >= 2);
  if (eligible.length < 2 || eligible[0].id !== scores[0].id) return null;
  const selected = [byId.get(eligible[0].id)];
  for (const score of eligible.slice(1)) {
    if (selected.length >= maxCompositionSize) break;
    const card = byId.get(score.id);
    if (selected.every((candidate) => explicitlyCompatible(candidate, card))) {
      selected.push(card);
    }
  }
  return selected.length > 1 ? selected : null;
}

function broadDomainCount(text) {
  const plain = text.normalize("NFKD").toLowerCase();
  const domains = [
    /\b(?:customer|growth|campaign|product|prospect)\b/,
    /\b(?:accessible|interface|media|visual)\b/,
    /\b(?:launch|production|release|rollout|ship)\b/,
    /\b(?:architecture|code|engineering|implement|implementation|schema|technical)\b/,
    /\b(?:governance|mitigation|security|trust)\b/,
    /\b(?:compaction|context|memory|recover)\b/,
    /\b(?:evidence|investigate|research|review)\b/,
    /\b(?:failure|incident|recovery)\b/,
    /\b(?:delivery|operating|operations|service)\b/,
  ];
  return domains.filter((pattern) => pattern.test(plain)).length;
}

export function compileIntent({ request, cards }) {
  const natural = validateNaturalRequest(request);
  if (!Array.isArray(cards)) throw new TypeError("cards must be an array");
  const values = cards.map(validateRoutingCard).sort((left, right) => lexicalCompare(left.id, right.id));
  const intentText = omitExplicitExternalExclusions(natural.text);
  const requestTokens = tokens(intentText);
  const requestPlain = plainText(intentText);
  const scored = values.map((card) => scoreCard(card, requestTokens, requestPlain)).sort(compareScores);
  const meaningful = scored
    .filter(({ score, independentSupport }) =>
      score >= MINIMUM_INTENT_SUPPORT && independentSupport >= MINIMUM_INTENT_SUPPORT)
    .slice(0, 8)
    .map(({ independentSupport, ...score }) => score);
  const byId = new Map(values.map((card) => [card.id, card]));
  const proposal = natural.proposal === undefined
    ? null
    : validateSemanticProposal(natural.proposal, values);
  const acceptedProposalIds = proposal === null
    ? []
    : proposal.candidateIds.filter((id) => meaningful.some((score) => score.id === id));
  const rejectedProposalIds = proposal === null
    ? []
    : proposal.candidateIds.filter((id) => !acceptedProposalIds.includes(id));
  const closePair = meaningful.length >= 2 && meaningful[0].score - meaningful[1].score <= 3
    ? [byId.get(meaningful[0].id), byId.get(meaningful[1].id)]
    : null;
  const capabilityPreferredScore = closePair === null
    ? null
    : [...meaningful.slice(0, 2)].sort((left, right) =>
      capabilityEvidenceCount(right) - capabilityEvidenceCount(left) || compareScores(left, right))[0];
  const capabilityEvidenceLead = capabilityPreferredScore !== null &&
    Math.abs(capabilityEvidenceCount(meaningful[0]) - capabilityEvidenceCount(meaningful[1])) >= 1
    ? byId.get(capabilityPreferredScore.id)
    : null;
  const broadAmbiguity = acceptedProposalIds.length === 0 && broadDomainCount(intentText) >= 3;
  const forgeSignals = ["implementation", "integration", "review", "test", "verification"]
    .filter((signal) => new Set(requestTokens).has(stem(signal))).length;
  const resolvedEngineeringCoordination = forgeSignals >= 3;
  const ambiguous = acceptedProposalIds.length === 0 && (
    (broadAmbiguity && !resolvedEngineeringCoordination) ||
    (closePair !== null && capabilityEvidenceLead === null && !explicitlyCompatible(closePair[0], closePair[1]))
  );
  const ambiguousCards = closePair ?? meaningful.slice(0, 2).map(({ id }) => byId.get(id));
  const evidencedComposition = acceptedProposalIds.length === 0 && !ambiguous
    ? naturalComposition(
      meaningful,
      byId,
      requestTokens,
      natural.context.maxCompositionSize,
    )
    : null;
  const selectedCards = acceptedProposalIds.length > 0
    ? acceptedProposalIds.map((id) => byId.get(id))
    : ambiguous
      ? ambiguousCards
      : evidencedComposition !== null
        ? evidencedComposition
      : meaningful.length === 0
        ? []
        : [capabilityEvidenceLead ?? byId.get(meaningful[0].id)];

  const requestedEffects = sorted([
    ...inferRequestedEffects(intentText),
    ...(proposal?.requestedEffects ?? []),
  ]);
  const unresolvedDecisions = sorted([
    ...(selectedCards.length === 0 ? ["intent-not-understood"] : []),
    ...(ambiguous ? ["intent-ambiguous"] : []),
    ...consequentialDecisions(
      intentText,
      requestedEffects,
      natural.context,
      selectedCards,
      values,
    ),
    ...missingPolicyDecisions(selectedCards, natural.context),
    ...(proposal?.unresolvedDecisions ?? []),
  ]);
  const candidateFamilies = sorted(selectedCards.map(({ family }) => family));
  const acceptedProposal = proposal !== null && acceptedProposalIds.length > 0;
  const requiredCapabilities = selectedCards.length === 0
    ? ["unresolved-intent"]
    : sorted(
      acceptedProposal
        ? proposal.requiredCapabilities
        : selectedCards.flatMap((card) => matchedCapabilities(card, requestTokens)),
    );

  const envelope = {
    schemaVersion: 1,
    requestId: natural.requestId,
    outcome: natural.text,
    candidateFamilies,
    requiredCapabilities,
    forbiddenCapabilities: [...natural.context.forbiddenCapabilities],
    permittedEffects: [...natural.context.permittedEffects],
    availableAuthority: [...natural.context.availableAuthority],
    availablePreconditions: [...natural.context.availablePreconditions],
    maximumRisk: natural.context.maximumRisk,
    minimumEvidenceConfidence: natural.context.minimumEvidenceConfidence,
    contextBudget: natural.context.contextBudget,
    maxCompositionSize: natural.context.maxCompositionSize,
    unresolvedDecisions,
  };

  return validateCompilerReceipt({
    schemaVersion: 1,
    requestId: natural.requestId,
    requestDigest: stableDigest(natural),
    textDigest: sha256(natural.text),
    mode: proposal === null ? "deterministic" : "proposal-assisted",
    candidateScores: meaningful,
    acceptedProposalIds: sorted(acceptedProposalIds),
    rejectedProposalIds: sorted(rejectedProposalIds),
    requestedEffects: sorted(requestedEffects),
    suppliedAuthority: [...natural.context.availableAuthority],
    unresolvedDecisions,
    confidence: selectedCards.length === 0 ? "low" : confidenceFor(meaningful),
    envelope,
    proofLimits: ["fixture-and-contract-evidence-only"],
  });
}

export function compileIntentWithGapLookup({ request, cards, semanticAtlas }) {
  const compilerReceipt = compileIntent({ request, cards });
  const promotedRouteQualified =
    !compilerReceipt.unresolvedDecisions.includes("intent-not-understood") &&
    !compilerReceipt.unresolvedDecisions.includes("intent-ambiguous") &&
    (["verified", "high"].includes(compilerReceipt.confidence) ||
      (compilerReceipt.confidence === "medium" && (compilerReceipt.candidateScores[0]?.score ?? 0) >= 20));
  if (promotedRouteQualified) {
    return {
      compilerReceipt,
      gapLookup: {
        invoked: false,
        reason: "promoted-route-qualified",
        cards: [],
        terminalRoute: "promoted-capability",
        targetSkillId: compilerReceipt.candidateScores[0]?.id ?? null,
        authorityExpanded: false,
        sourceBodiesTransported: 0,
      },
    };
  }
  const consequential =
    compilerReceipt.requestedEffects.some((effect) => effect !== "local-read" && effect !== "none") ||
    ["high", "critical"].includes(request.context.maximumRisk);
  if (!consequential) {
    return {
      compilerReceipt,
      gapLookup: {
        invoked: false,
        reason: "ordinary-uncovered-intent",
        cards: [],
        terminalRoute: "native-fallback",
        targetSkillId: null,
        authorityExpanded: false,
        sourceBodiesTransported: 0,
      },
    };
  }
  if (semanticAtlas?.certificate?.stale !== false) {
    throw new Error("Wave 2 semantic atlas certification is stale");
  }
  const gapCards = searchWave2SemanticAtlas(semanticAtlas, { query: request.text, limit: 5 });
  const first = gapCards[0] ?? null;
  const promoted = first?.evaluationStatus === "promoted" && first?.targetSkillId;
  return {
    compilerReceipt,
    gapLookup: {
      invoked: true,
      reason: "uncovered-consequential-intent",
      cards: gapCards,
      terminalRoute: promoted ? "promoted-capability" : first ? "refinery-handoff" : "unresolved-gap",
      targetSkillId: promoted ? first.targetSkillId : first ? "sovereign-skill-refinery" : null,
      authorityExpanded: false,
      sourceBodiesTransported: 0,
    },
  };
}
