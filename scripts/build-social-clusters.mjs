import { readFile, readdir, writeFile } from "node:fs/promises";

import { validateReviewBatch } from "../src/reviews.mjs";

const familyId = "social-media-community";
const queue = JSON.parse(await readFile("artifacts/corpus/families/social-media-community/queue.json", "utf8"));
const bodies = (await readFile("artifacts/corpus/body-evidence.jsonl", "utf8"))
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const sources = queue.cards.map((card) => ({ id: card.sourceId, families: card.families }));
const reviews = [];
for (const file of (await readdir("reviews/waves/social-media-community")).sort()) {
  const batch = JSON.parse(await readFile(`reviews/waves/social-media-community/${file}`, "utf8"));
  reviews.push(...validateReviewBatch(batch, sources, bodies));
}

const candidate = {
  "identity-and-channel-strategy": [
    "channel-format-selection", "channel-specific-public-communication", "content-pillar-ideation-matrix",
    "content-strategy-and-editorial-architecture", "editorial-calendar-and-capacity",
    "identity-and-voice-contract", "marketing-operating-system-boundary",
    "public-identity-and-profile-stewardship",
  ],
  "editorial-production": [
    "cross-channel-editorial-production", "cross-format-repurposing",
    "editorial-ideation-and-portfolio", "editorial-microformat-adaptation",
    "editorial-opening-and-promise-design", "evidence-preserving-cross-channel-repurposing",
    "platform-native-caption-and-action-design", "platform-native-post-formatting",
    "short-form-hook-and-retention-direction", "social-visual-summary-pattern", "source-ingestion-boundary",
    "truthful-editorial-story-architecture", "video-editorial-strategy-and-repurposing",
    "voice-grounded-social-post-authoring",
  ],
  "community-operations": ["social-communication-operating-core"],
  "measurement-and-stewardship": [
    "current-content-signal-research", "editorial-quality-and-evidence-review",
    "social-measurement-and-learning", "social-measurement-interface",
  ],
};

const deferred = {
  "external-account-and-community-action-boundary": [
    "account-engagement-automation-boundary", "community-participation-and-external-action-boundary",
    "direct-outreach-and-consent-boundary", "platform-account-safety-boundary",
    "platform-data-and-account-integration-boundary",
  ],
  "prospecting-and-enrichment-boundary": ["acquisition-intent-and-enrichment-boundary"],
  "paid-acquisition-boundary": [
    "paid-acquisition-audience-boundary", "paid-acquisition-creative-boundary",
    "paid-acquisition-experiment-boundary", "paid-acquisition-measurement-boundary",
    "paid-acquisition-optimization-boundary", "paid-acquisition-strategy-boundary",
  ],
  "specialist-media-production-boundary": [
    "social-asset-brief-and-production-boundary", "specialist-video-production-boundary",
    "specialist-visual-production-boundary",
  ],
  "integrated-market-and-reputation-boundary": [
    "competitive-intelligence-and-market-research-boundary", "earned-media-and-public-relations-boundary",
    "integrated-marketing-campaign-boundary", "reputation-and-public-signal-research-boundary",
  ],
};

const rejected = {
  "security-workflows-false-positive": [
    "application-security-false-positive", "cyber-threat-intelligence-false-positive",
    "security-monitoring-false-positive", "security-reconnaissance-false-positive",
  ],
  "financial-and-infrastructure-false-positive": [
    "conversion-infrastructure-false-positive", "financial-market-sentiment-false-positive",
    "inference-serving-false-positive", "vector-infrastructure-false-positive",
  ],
  "personal-data-enrichment-false-positive": [
    "lead-enrichment-and-prospect-data-boundary", "personal-data-enrichment-boundary",
  ],
  "deprecated-routing-false-positive": ["deprecated-router-false-positive"],
};

const definitions = {
  "identity-and-channel-strategy": ["Resolve identity, audience, editorial architecture, channel roles, formats, profile, and sustainable cadence as one strategy contract.", "ordered-composition", "candidate", "These reviewed contracts jointly decide who is speaking, for whom, through which channels and formats, under what capacity and identity constraints."],
  "editorial-production": ["Transform approved evidence into original channel-native stories, posts, captions, short-form scripts, derivatives, and visual summaries without publishing them.", "ordered-composition", "candidate", "The sources contribute distinct production stages that preserve one truthful source while adapting structure, voice, promise, format, and accessibility."],
  "community-operations": ["Plan bounded listening, participation, moderation readiness, response triage, and human handoff without performing public account actions.", "ordered-composition", "candidate", "The operating-core reviews contain reusable stewardship planning while their external effects remain excluded by separate deferred clusters."],
  "measurement-and-stewardship": ["Collect current source-labeled signals, validate social metrics, review editorial quality, and convert evidence into bounded learning decisions.", "ordered-composition", "candidate", "Research, measurement, interface, and quality-review contracts form one learning loop while preserving provenance, metric definitions, and uncertainty."],
  "external-account-and-community-action-boundary": ["Keep account access, scraping, comments, messages, outreach, and live community actions behind current policy, consent, identity, and explicit authority.", "boundary-deferred", "deferred", "These operations mutate or inspect external platforms and can expose personal data, spam communities, or restrict accounts, so Chorus may plan but cannot absorb execution."],
  "prospecting-and-enrichment-boundary": ["Keep sales-signal collection, scoring, company enrichment, and prospect handoff outside a universal community capability.", "boundary-deferred", "deferred", "Public engagement is not contact consent and provider-backed identity resolution requires a declared lawful purpose, current terms, and separate authority."],
  "paid-acquisition-boundary": ["Keep paid audience, creative, experiment, measurement, optimization, campaign, bidding, and budget operations behind economics and live-account authority.", "boundary-deferred", "deferred", "Paid acquisition has financial, privacy, attribution, and platform-mutation effects that cannot enter a universal organic communication core."],
  "specialist-media-production-boundary": ["Defer visual and video generation, paid model calls, asset rights, specialist tools, and production execution to authorized media workflows.", "boundary-deferred", "deferred", "The reusable briefing patterns remain informative, but generation cost, model behavior, licensing, and production dependencies require specialist verification."],
  "integrated-market-and-reputation-boundary": ["Keep broad campaign orchestration, earned media, competitive intelligence, and reputation research as separately scoped market workflows.", "boundary-deferred", "deferred", "These missions cross legal, budget, live-source, HR, and public-relations boundaries wider than Chorus's communication and stewardship core."],
  "security-workflows-false-positive": ["Exclude offensive security, threat intelligence, and impersonation monitoring from social communication synthesis.", "specialized-alternative", "rejected", "Their social-source overlap is incidental to authorized defensive security work and does not contribute a social or community behavior contract."],
  "financial-and-infrastructure-false-positive": ["Exclude market sentiment, model serving, vector retention, and conversion infrastructure from the social family.", "specialized-alternative", "rejected", "These sources were classified through incidental social terminology and belong to financial or infrastructure domains with materially different evidence and risks."],
  "personal-data-enrichment-false-positive": ["Exclude contact dossiers and prospect-data pipelines from universal social and community behavior.", "specialized-alternative", "rejected", "Personal-data enrichment and disclosure create privacy and unsolicited-contact risks without contributing necessary Chorus behavior."],
  "deprecated-routing-false-positive": ["Exclude a deprecated redirect-only wrapper from the synthesized capability.", "specialized-alternative", "rejected", "The source contributes no behavior beyond routing to specialists and would add indirection rather than capability."],
};

const assignment = new Map();
for (const [route, clusters] of Object.entries(candidate)) for (const cluster of clusters) assignment.set(cluster, { id: route, route });
for (const [id, clusters] of Object.entries(deferred)) for (const cluster of clusters) assignment.set(cluster, { id });
for (const [id, clusters] of Object.entries(rejected)) for (const cluster of clusters) assignment.set(cluster, { id });

const grouped = new Map();
for (const review of reviews) {
  const target = assignment.get(review.proposedCluster);
  if (!target) throw new Error(`unmapped proposed cluster: ${review.proposedCluster}`);
  const rows = grouped.get(target.id) ?? [];
  rows.push(review);
  grouped.set(target.id, rows);
}

const clusters = Object.keys(definitions).sort().map((id) => {
  const [intent, relationship, synthesisDecision, rationale] = definitions[id];
  const rows = (grouped.get(id) ?? []).sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  if (rows.length === 0) throw new Error(`empty cluster: ${id}`);
  const cluster = {
    id, intent, relationship, synthesisDecision, rationale,
    members: rows.map((review, index) => ({
      sourceId: review.sourceId,
      reviewDigest: review.reviewDigest,
      role: synthesisDecision === "candidate" ? (index === 0 ? "canonical" : "variant")
        : synthesisDecision === "deferred" ? "deferred" : "boundary",
    })),
  };
  if (candidate[id]) cluster.candidateRoute = id;
  return cluster;
});

const batch = { schemaVersion: 1, clusterSetId: "social-media-community-clusters-v1", familyId, clusters };
await writeFile("clusters/social-media-community.v1.json", `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(`wrote ${batch.clusters.length} clusters covering ${reviews.length} reviews`);
