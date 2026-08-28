import { sha256 } from "./io.mjs";
import {
  validateCompilerReceipt,
  validateNaturalRequest,
  validateSemanticProposal,
} from "./intent-contracts.mjs";
import { validateRoutingCard } from "./routing-contracts.mjs";

const STOP_WORDS = new Set([
  "a", "about", "after", "all", "an", "and", "anything", "as", "at", "be",
  "been", "before", "but", "by", "can", "do", "for", "from", "have", "how",
  "i", "in", "into", "is", "it", "its", "me", "my", "of", "on", "or",
  "our", "please", "so", "some", "that", "the", "their", "them", "these",
  "this", "those", "through", "to", "turn", "up", "us", "we", "while",
  "with", "without", "you", "your",
]);

const WRITE_WORDS = new Set([
  "build", "change", "create", "design", "edit", "fix", "implement", "integrate",
  "migrate", "produce", "recover", "redesign", "refactor", "rewrite", "update",
]);
const EXTERNAL_READ_WORDS = new Set([
  "browse", "current", "internet", "online", "research", "search", "web",
]);
const EXTERNAL_WRITE_WORDS = new Set([
  "buy", "deploy", "email", "message", "post", "publish", "purchase", "send",
  "spend", "upload",
]);

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

function overlap(left, right) {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token));
}

function evidenceFor(requestTokens, text, label, weight) {
  const matched = overlap(requestTokens, tokens(text));
  return matched.map((token) => ({ evidence: `${label}:${token}`, weight }));
}

function scoreCard(card, requestTokens) {
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
  ];
  const byEvidence = new Map();
  for (const entry of entries) {
    const current = byEvidence.get(entry.evidence);
    if (current === undefined || entry.weight > current) byEvidence.set(entry.evidence, entry.weight);
  }
  return {
    id: card.id,
    score: [...byEvidence.values()].reduce((sum, value) => sum + value, 0),
    evidence: sorted([...byEvidence.keys()]),
  };
}

function compareScores(left, right) {
  return right.score - left.score || lexicalCompare(left.id, right.id);
}

function inferRequestedEffects(text) {
  const requestTokens = new Set(tokens(text));
  const effects = new Set(["local-read"]);
  if ([...WRITE_WORDS].some((token) => requestTokens.has(stem(token)))) effects.add("local-write");
  if ([...EXTERNAL_READ_WORDS].some((token) => requestTokens.has(stem(token)))) effects.add("external-read");
  if ([...EXTERNAL_WRITE_WORDS].some((token) => requestTokens.has(stem(token)))) effects.add("external-write");
  return sorted(effects);
}

function matchedCapabilities(card, requestTokens) {
  const matches = card.provides.filter((capability) => overlap(requestTokens, tokens(capability)).length > 0);
  return sorted(matches.length > 0 ? matches : [card.provides[0]]);
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
    requestTokens.has("spend") || requestTokens.has("buy") || requestTokens.has("purchase")
  ) {
    if (!authority.has("spending-authority")) decisions.push("authority:spending-authority");
  }
  if (
    (requestTokens.has("production") || requestTokens.has("live")) &&
    (writesExternally || requestTokens.has("change") || requestTokens.has("deploy")) &&
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
  return left.compatibleWith.includes(right.id) && right.compatibleWith.includes(left.id);
}

export function compileIntent({ request, cards }) {
  const natural = validateNaturalRequest(request);
  if (!Array.isArray(cards)) throw new TypeError("cards must be an array");
  const values = cards.map(validateRoutingCard).sort((left, right) => lexicalCompare(left.id, right.id));
  const requestTokens = tokens(natural.text);
  const scored = values.map((card) => scoreCard(card, requestTokens)).sort(compareScores);
  const meaningful = scored.filter(({ score }) => score >= 12).slice(0, 8);
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
  const ambiguous = acceptedProposalIds.length === 0 && closePair !== null &&
    !explicitlyCompatible(closePair[0], closePair[1]);
  const selectedCards = acceptedProposalIds.length > 0
    ? [byId.get(acceptedProposalIds[0])]
    : ambiguous
      ? closePair
      : meaningful.length === 0
        ? []
        : [byId.get(meaningful[0].id)];

  const requestedEffects = proposal?.requestedEffects ?? inferRequestedEffects(natural.text);
  const unresolvedDecisions = sorted([
    ...(selectedCards.length === 0 ? ["intent-not-understood"] : []),
    ...(ambiguous ? ["intent-ambiguous"] : []),
    ...consequentialDecisions(
      natural.text,
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
