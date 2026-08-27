import { readFile, writeFile } from "node:fs/promises";

const familyId = "marketing-growth";
const clusterSetId = "marketing-growth-clusters-v1";

const definitions = {
  "market-truth-and-positioning": [
    "Reconcile customer, category, competitor, product, brand, claim, and segment evidence into a falsifiable positioning system.",
    "The selected reviews contribute complementary research, segmentation, differentiation, message, brand-governance, and claim-validation contracts without requiring market mutation.",
  ],
  "offer-and-commercial-architecture": [
    "Design evidence-bounded offers, packaging, pricing hypotheses, proposals, qualification, value framing, and commercial decision handoffs.",
    "These reviews jointly cover value, scope, economics, risk reversal, collateral, proposal, and deal-decision structure while keeping final commercial commitments outside the route.",
  ],
  "discoverability-and-search-systems": [
    "Diagnose and design technical, content, entity, local, marketplace, and answer-engine discoverability systems from verifiable site evidence.",
    "The reviews form a coherent search evidence loop spanning crawl, render, index, architecture, structured data, content trust, local visibility, and bounded change planning.",
  ],
  "go-to-market-and-demand-systems": [
    "Design bounded launch, channel, partnership, content, product-led, demand, and growth experiment portfolios from declared goals and constraints.",
    "These reviews contribute strategy, sequencing, channel economics, demand mechanisms, partner systems, and lead-capture planning without implying publication, outreach, or spend.",
  ],
  "conversion-and-lifecycle-systems": [
    "Diagnose and improve acquisition, activation, conversion, onboarding, lifecycle, retention, expansion, and recovery journeys through reversible tests.",
    "The selected contracts cover page and form friction, messaging, overlays, onboarding, email, upgrades, churn, and lifecycle measurement under consent and truthful-choice constraints.",
  ],
  "growth-measurement-and-stewardship": [
    "Define metrics, instrumentation, attribution limits, forecasts, experiments, channel economics, anomaly handling, and evidence-based scale or stop decisions.",
    "These reviews compose a measurement and learning loop that preserves definitions, cohorts, denominators, uncertainty, causal limits, guardrails, and decision ownership.",
  ],
  "provider-account-and-live-data-boundary": [
    "Keep credentialed provider queries, live ranking data, account inspection, notification APIs, and metered intelligence outside the portable local core.",
    "Although the reviews contain useful analytical patterns, their behavior depends on credentials, changing provider contracts, live data, quotas, or account-side effects requiring separate authority.",
  ],
  "specialist-media-and-interface-production-boundary": [
    "Keep image, video, animation, interface, document rendering, and specialist campaign-asset production behind dedicated production capabilities.",
    "The source contracts require media tools, rights review, rendering stacks, model calls, or specialist craft beyond Beacon's portable marketing reasoning and artifact boundary.",
  ],
  "external-publication-and-store-operation-boundary": [
    "Keep publishing, release-store mutation, listing changes, and other public distribution effects behind an explicit external-action handoff.",
    "The reusable launch planning is valid, but the reviewed operation crosses from local preparation into public account mutation and therefore requires target-bound authority and receipts.",
  ],
  "deferred-provider-search-and-market-intelligence": [
    "Defer metered search, crawl, backlink, brand-mention, generative-visibility, and competitor intelligence until current provider evidence and authority are supplied.",
    "These reviews are useful only with live external services, paid quotas, current scoring semantics, or broad collection boundaries that cannot be certified in a portable local capability.",
  ],
  "deferred-campaign-contact-and-revenue-operations": [
    "Defer contact-center, prospect-state, outbound benchmark, and revenue-response orchestration to separately authorized customer and sales operations.",
    "The reviewed systems touch personal data, messages, contact state, revenue ledgers, or campaign execution and therefore exceed a universal marketing planning contract.",
  ],
  "deferred-specialist-media-and-presentation-production": [
    "Defer screenshot, presentation, multimodal rendering, and assembly workflows whose operative machinery is external, incomplete, or specialist-bound.",
    "The source bodies expose useful routing or production boundaries but do not provide a self-contained, locally certifiable marketing behavior contract.",
  ],
  "deferred-runtime-installation-and-provider-administration": [
    "Defer toolkit installation, upstream synchronization, and managed provider pipeline administration to environment-specific engineering workflows.",
    "These operations mutate runtime state and depend on upstream packages or provider administration rather than contributing portable marketing reasoning.",
  ],
  "deferred-regulated-financial-and-compliance-research": [
    "Defer grants, regulated claims, financial market research, and jurisdiction-sensitive guidance until current expert and authoritative evidence is available.",
    "The reviewed work is temporally and jurisdictionally unstable or financially consequential, so Beacon may identify the need but cannot canonize its conclusions.",
  ],
  "social-editorial-and-generic-copy-exclusion": [
    "Exclude generic copy editing, social editorial production, community growth, reputation response, and long-form publishing from Beacon's distinct core.",
    "These candidate-like reviews belong to Chorus or narrower writing workflows and would blur route ownership without adding necessary marketing-system behavior.",
  ],
  "outbound-sales-execution-exclusion": [
    "Exclude cold outreach, prospecting copy, deliverability operations, and sales-message execution from the portable marketing capability.",
    "The reviewed behavior creates unsolicited-contact, privacy, consent, and external-action risks and belongs to separately governed sales execution.",
  ],
  "generic-routing-format-and-runtime-exclusion": [
    "Exclude generic routers, document conversion, deliberation loops, runtime manifests, and broad orchestration that do not define marketing behavior.",
    "These reviews are infrastructure or generic agent machinery whose incidental marketing labels would introduce recursion and capability ambiguity.",
  ],
  "adjacent-finance-engineering-and-integration-false-positive": [
    "Exclude finance, engineering organization, contact-center integration, location semantics, and investment analysis false positives from marketing synthesis.",
    "Their family match is incidental; their inputs, proof standards, risks, and outputs belong to materially different professional domains.",
  ],
  "rejected-security-and-attack-surface-false-positive": [
    "Reject security assessment, threat attribution, parser tracing, poisoning analysis, and attack-surface workflows from the marketing family.",
    "These sources require authorized defensive-security scope and contribute no necessary marketing contract despite overlapping reconnaissance language.",
  ],
  "rejected-unsafe-outreach-phishing-and-impersonation": [
    "Reject phishing, impersonation, spearphishing, unsafe outreach infrastructure, and simulated deceptive contact from marketing synthesis.",
    "The reviewed operations can facilitate deception or unauthorized targeting and cannot become a portable marketing capability under any routing interpretation.",
  ],
  "rejected-thin-router-and-private-doctrine": [
    "Reject thin pointers, provider routers, missing upstream bundles, and persona-bound private doctrine that contain no independently certifiable behavior.",
    "These rows offer indirection or private assumptions rather than a complete evidence-backed contract, so adopting them would create unsupported capability claims.",
  ],
  "rejected-provider-dependent-seo-and-prospecting": [
    "Reject provider-locked prospecting and search-intelligence stubs that cannot operate or be verified independently of unavailable external machinery.",
    "The specific reviewed rows are incomplete or unsafe provider dependencies, not portable search or market reasoning patterns suitable for Beacon.",
  ],
  "rejected-adjacent-document-product-database-and-engineering": [
    "Reject academic review, document routing, product discovery, database migration, and engineering-operation false positives from marketing synthesis.",
    "These sources were classified through incidental terms and have unrelated domain contracts, dependencies, and acceptance evidence.",
  ],
  "rejected-specialist-identity-media-production": [
    "Reject identity-bound specialist media generation from the marketing core when the source is primarily a production persona rather than a reusable contract.",
    "The reviewed row binds behavior to specialist identity and media execution, providing neither portable marketing reasoning nor an independently verifiable boundary-safe workflow.",
  ],
};

function jsonLines(text) {
  return text.split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

const [mapping, reviewText] = await Promise.all([
  readFile("data/marketing-growth-cluster-map.v1.json", "utf8").then(JSON.parse),
  readFile("artifacts/corpus/review-evidence.jsonl", "utf8"),
]);
const reviews = jsonLines(reviewText).filter((review) => review.familyId === familyId);
if (reviews.length !== 253) throw new Error(`expected 253 marketing reviews, received ${reviews.length}`);
if (mapping.clusters.length !== 24) throw new Error(`expected 24 mapping clusters, received ${mapping.clusters.length}`);

const byFinalId = new Map(mapping.clusters.map((cluster) => [cluster.id, cluster]));
if (byFinalId.size !== mapping.clusters.length) throw new Error("duplicate final cluster id in mapping");
for (const id of byFinalId.keys()) if (!definitions[id]) throw new Error(`missing definition for ${id}`);
for (const id of Object.keys(definitions)) if (!byFinalId.has(id)) throw new Error(`unused definition for ${id}`);

const sourceQualified = new Map();
for (const [proposedCluster, assignments] of Object.entries(mapping.sourceQualifiedMappings ?? {})) {
  for (const [sourceId, finalId] of Object.entries(assignments)) {
    sourceQualified.set(`${proposedCluster}\0${sourceId}`, finalId);
  }
}
const proposedIndex = new Map();
for (const cluster of mapping.clusters) {
  for (const proposedCluster of cluster.proposedClusters) {
    const rows = proposedIndex.get(proposedCluster) ?? [];
    rows.push(cluster.id);
    proposedIndex.set(proposedCluster, rows);
  }
}

const grouped = new Map();
const seenSources = new Set();
for (const review of reviews) {
  if (seenSources.has(review.sourceId)) throw new Error(`duplicate review source: ${review.sourceId}`);
  seenSources.add(review.sourceId);
  const qualified = sourceQualified.get(`${review.proposedCluster}\0${review.sourceId}`);
  const candidates = proposedIndex.get(review.proposedCluster) ?? [];
  const finalId = qualified ?? (candidates.length === 1 ? candidates[0] : undefined);
  if (!finalId) throw new Error(`ambiguous or unmapped review: ${review.sourceId} ${review.proposedCluster}`);
  if (!byFinalId.has(finalId)) throw new Error(`unknown mapped cluster: ${finalId}`);
  const rows = grouped.get(finalId) ?? [];
  rows.push(review);
  grouped.set(finalId, rows);
}

const clusters = [...byFinalId.keys()].sort().map((id) => {
  const declaration = byFinalId.get(id);
  const rows = (grouped.get(id) ?? []).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  if (rows.length !== declaration.sourceCount) {
    throw new Error(`${id} expected ${declaration.sourceCount} sources, received ${rows.length}`);
  }
  const [intent, rationale] = definitions[id];
  const cluster = {
    id,
    intent,
    relationship: declaration.synthesisDecision === "candidate"
      ? "ordered-composition"
      : declaration.synthesisDecision === "deferred"
        ? "boundary-deferred"
        : "specialized-alternative",
    synthesisDecision: declaration.synthesisDecision,
    rationale,
    members: rows.map((review, index) => ({
      sourceId: review.sourceId,
      reviewDigest: review.reviewDigest,
      role: declaration.synthesisDecision === "candidate"
        ? (index === 0 ? "canonical" : "variant")
        : declaration.synthesisDecision === "deferred" ? "deferred" : "boundary",
    })),
  };
  if (declaration.synthesisDecision === "candidate") {
    if (declaration.candidateRoute !== id) throw new Error(`candidate route mismatch for ${id}`);
    cluster.candidateRoute = declaration.candidateRoute;
  }
  return cluster;
});

const counts = Object.fromEntries(["candidate", "deferred", "rejected"].map((decision) => [decision, {
  clusters: clusters.filter((cluster) => cluster.synthesisDecision === decision).length,
  sources: clusters
    .filter((cluster) => cluster.synthesisDecision === decision)
    .reduce((total, cluster) => total + cluster.members.length, 0),
}]));
if (JSON.stringify(counts) !== JSON.stringify(mapping.decisionCounts)) {
  throw new Error(`decision count mismatch: ${JSON.stringify(counts)}`);
}
if (clusters.reduce((total, cluster) => total + cluster.members.length, 0) !== 253) {
  throw new Error("cluster membership does not total 253");
}

const batch = { schemaVersion: 1, clusterSetId, familyId, clusters };
await writeFile("clusters/marketing-growth.v1.json", `${JSON.stringify(batch, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ clusters: clusters.length, sources: reviews.length, counts }, null, 2));
