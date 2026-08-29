import { createHash } from "node:crypto";

const DOMAIN_RULES = [
  {
    id: "agent-design-and-orchestration",
    pattern: /\b(agent|subagent|multi-agent|persona|orchestrat|delegat|handoff|crew|squad)\b/i,
    capability: "designs or coordinates bounded agent behavior",
    object: "agent roles, authority, state, routing, and handoff evidence",
    stages: ["role definition", "authority binding", "stateful routing", "handoff verification"],
  },
  {
    id: "delivery-pipeline-engineering",
    pattern: /\b(ci\/?cd|workflow yaml|build pipeline|deployment|release|expo|eas|github actions?)\b/i,
    capability: "models a validated build, test, and delivery pipeline",
    object: "project configuration, pipeline stages, credentials, and release gates",
    stages: ["pipeline modeling", "configuration validation", "effect gating", "delivery verification"],
  },
  {
    id: "browser-and-interface-testing",
    pattern: /\b(playwright|browser test|end.to.end|e2e|ui test|visual regression)\b/i,
    capability: "constructs evidence-producing browser or interface tests",
    object: "user journeys, selectors, environments, assertions, and failure artifacts",
    stages: ["journey modeling", "environment control", "assertion design", "failure capture"],
  },
  {
    id: "automation-and-integration",
    pattern: /\b(n8n|mcp|automation|webhook|integration|connector|api workflow)\b/i,
    capability: "maps an integration request into a bounded automation workflow",
    object: "triggers, credentials, schemas, transformations, side effects, and receipts",
    stages: ["trigger mapping", "schema validation", "effect authorization", "receipt capture"],
  },
  {
    id: "repository-lifecycle-operations",
    pattern: /\b(github|gitlab|repository|pull request|issue|branch|commit|repo commander)\b/i,
    capability: "governs repository inspection and lifecycle operations",
    object: "repository identity, refs, changes, reviews, permissions, and operation receipts",
    stages: ["repository inspection", "change planning", "permission gating", "operation verification"],
  },
  {
    id: "defensive-security-assessment",
    pattern: /\b(pentest|security test|vulnerabil|threat|attack surface|exploit|owasp)\b/i,
    capability: "structures an authorized defensive security assessment",
    object: "declared scope, assets, test methods, findings, evidence, and remediation boundaries",
    stages: ["scope authorization", "evidence collection", "finding validation", "remediation handoff"],
  },
  {
    id: "scientific-computation",
    pattern: /\b(molecule|molecular|chemistry|chemical|molfeat|rowan|quantum|simulation|laboratory|bioinformatic|experimental design|design of experiments|doe)\b/i,
    capability: "organizes a reproducible scientific computation",
    object: "scientific inputs, representations, parameters, methods, and validation evidence",
    stages: ["method selection", "parameter binding", "reproducible execution", "result validation"],
  },
  {
    id: "research-and-citation",
    pattern: /\b(citation|bibliograph|literature|research|nature journal|reference manager|scholarly)\b/i,
    capability: "builds a provenance-aware research or citation workflow",
    object: "claims, sources, identifiers, citation style, verification, and uncertainty",
    stages: ["claim decomposition", "source reconciliation", "citation validation", "uncertainty reporting"],
  },
  {
    id: "language-and-content-analysis",
    pattern: /\b(keyword|extract|classif|summari|sentiment|entity|text analysis|content analysis)\b/i,
    capability: "turns language material into normalized analytical evidence",
    object: "source text, extraction rules, labels, ranking criteria, and validation samples",
    stages: ["text normalization", "signal extraction", "ranking or classification", "sample validation"],
  },
  {
    id: "skill-and-prompt-engineering",
    pattern: /\b(meta.skill|skill creator|skill design|prompt engineer|instruction design|agent creator)\b/i,
    capability: "authors a reusable agent capability contract",
    object: "trigger conditions, inputs, procedures, authority limits, outputs, and evaluations",
    stages: ["trigger definition", "procedure design", "authority bounding", "evaluation construction"],
  },
  {
    id: "data-and-model-engineering",
    pattern: /\b(machine learning|model training|dataset|feature engineering|embedding|vector|inference|data pipeline)\b/i,
    capability: "engineers a reproducible data or model workflow",
    object: "datasets, transformations, model configuration, metrics, and reproducibility evidence",
    stages: ["data qualification", "transformation control", "model evaluation", "reproducibility capture"],
  },
  {
    id: "product-and-business-operations",
    pattern: /\b(marketing|sales|customer|product management|business|campaign|seo|social media)\b/i,
    capability: "structures an evidence-bounded product or business workflow",
    object: "audience, objectives, source evidence, decisions, deliverables, and outcome measures",
    stages: ["objective framing", "evidence analysis", "bounded production", "outcome measurement"],
  },
  {
    id: "document-and-presentation-production",
    pattern: /\b(docx|document|word processing|presentation|slide deck|deck|powerpoint|pptx|pdf author|spreadsheet|xlsx)\b/i,
    capability: "produces and verifies a structured document artifact",
    object: "source content, structure, formatting constraints, output format, and rendered acceptance evidence",
    stages: ["content preservation", "structural composition", "format rendering", "visual verification"],
  },
  {
    id: "creative-production",
    pattern: /\b(game design|audio|video|image|3d|animation|creative|art direction|music)\b/i,
    capability: "organizes an iterative creative production workflow",
    object: "creative intent, references, assets, constraints, review stages, and acceptance evidence",
    stages: ["creative framing", "asset production", "iterative review", "acceptance verification"],
  },
  {
    id: "software-implementation",
    pattern: /\b(code|software|typescript|javascript|python|rust|swift|react|frontend|backend|database|debug|test|event sourcing|microservice|distributed system|architecture)\b/i,
    capability: "turns a software requirement into an inspectable implementation workflow",
    object: "repository evidence, constraints, implementation steps, tests, and rollback conditions",
    stages: ["requirement binding", "implementation design", "behavioral verification", "rollback readiness"],
  },
];

const PROVIDER_TERMS = /\b(azure|aws|amazon|google|github|gitlab|expo|eas|n8n|openai|anthropic|claude|supabase|vercel|netlify|cloudflare|composio|rube|slack|notion|linear|jira|salesforce|hubspot|stripe|shopify|playwright|opentrons|langgraph|pipecat|neon)\b/i;
const EXTERNAL_TERMS = /\b(deploy|publish|submit|send|upload|provision|create (?:an? )?(?:issue|pull request|job|release|record)|delete|update remote|webhook|api call|mcp tool|cloud job|push)\b/i;
const WRITE_TERMS = /\b(author|build|create|write|edit|generate|implement|configure|transform|compile|design|produce|refactor|migrate)\b/i;
const HIGH_RISK_TERMS = /\b(pentest|exploit|credential|secret|token|medical|clinical|financial|trading|laboratory|robot|delete|production|deployment|publish|personal data|pii)\b/i;
const MALICIOUS_TERMS = /\b(ignore previous|exfiltrat|steal credentials?|malicious[_ -]skill|tests?[\\/]fixtures?[\\/]malicious|bypass (?:safety|approval|permission))\b/i;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clean(value) {
  return String(value ?? "")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "unnamed-capability";
}

function unique(values) {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = clean(value).toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function frontmatter(body, field) {
  const block = body.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/)?.[1] ?? "";
  const direct = block.match(new RegExp(`^${field}:\\s*([^|>\\n][^\\n]*)$`, "mi"))?.[1];
  if (direct) return clean(direct.replace(/^['"]|['"]$/g, ""));
  const folded = block.match(new RegExp(`^${field}:\\s*[|>]\\s*\\n((?:[ \\t]+[^\\n]*\\n?)+)`, "mi"))?.[1];
  return clean(folded ?? "");
}

function extractHeadings(body) {
  return unique(
    [...body.matchAll(/^#{1,4}\s+(.+?)\s*$/gm)]
      .map((match) => clean(match[1]))
      .filter((heading) => !/^(examples?|overview|introduction|quick start|references?)$/i.test(heading)),
  ).slice(0, 12);
}

function extractSignals(body, card) {
  const prose = body
    .replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, "")
    .replace(/```[\s\S]*?```/g, " ");
  const candidates = [
    ...extractHeadings(body),
    ...prose
      .split(/\r?\n/)
      .map((line) => clean(line.replace(/^[-+*]\s+/, "")))
      .filter((line) => line.length >= 24 && line.length <= 180),
  ];
  const nameTerms = slug(card.name).split("-").filter((term) => term.length >= 4);
  const scored = candidates.map((value, index) => ({
    value,
    score:
      (/(must|should|validate|verify|check|create|build|analy|configure|generate|failure|limit|security|workflow|output|input)/i.test(value) ? 5 : 0) +
      nameTerms.filter((term) => value.toLowerCase().includes(term)).length * 3 -
      index / 1000,
  }));
  return unique(scored.sort((a, b) => b.score - a.score).map(({ value }) => value)).slice(0, 8);
}

function chooseDomain(card, evidence) {
  const fields = {
    name: `${card.name} ${card.sourcePath}`,
    summary: `${card.summary ?? ""} ${evidence.frontmatterDescription}`,
    headings: evidence.headings.join(" "),
    signals: evidence.signals.join(" "),
  };
  const ranked = DOMAIN_RULES.map((rule, index) => ({
    rule,
    index,
    score:
      (rule.pattern.test(fields.name) ? 12 : 0) +
      (rule.pattern.test(fields.summary) ? 8 : 0) +
      (rule.pattern.test(fields.headings) ? 4 : 0) +
      (rule.pattern.test(fields.signals) ? 1 : 0),
  })).sort((left, right) => right.score - left.score || left.index - right.index);
  if (ranked[0]?.score > 0) return ranked[0].rule;
  return {
    id: "specialized-procedure",
    capability: "reconstructs a specialized procedure as an inspectable contract",
    object: "declared inputs, named stages, constraints, outputs, and verification evidence",
    stages: ["scope reconstruction", "ordered execution", "boundary validation", "acceptance verification"],
  };
}

function coupling(card, evidence) {
  const localPath = card.sourcePath.replaceAll("\\", "/").split("/").slice(-2).join(" ");
  const identity = `${card.name} ${localPath}`;
  const descriptive = `${card.summary ?? ""} ${evidence.frontmatterDescription} ${evidence.headings.join(" ")}`;
  const provider = PROVIDER_TERMS.test(identity) || /(?:^|[-_/])(api|sdk|cli)(?:$|[-_/])/i.test(card.sourcePath);
  const providerCoupling = provider
    ? "provider-bound"
    : /\b(api|sdk|cli|framework|hosted service)\b/i.test(descriptive)
      ? "conditional"
      : "none";
  const projectCoupling = /\b(projects?|repositories|repository|codebases?|build|deploy|applications?|workflow files?|configuration|datasets?|protocols?|campaigns?)\b/i.test(descriptive)
    ? "project-bound"
    : /\b(research|analysis|design|planning|review|writing|document|presentation)\b/i.test(descriptive)
      ? "project-adjacent"
      : "portable";
  return { providerCoupling, projectCoupling };
}

function dispositionFor({ malicious, providerCoupling, external, highRisk, domain, securitySurfaces }) {
  if (malicious) return "rejected";
  if (external || securitySurfaces.some((surface) => ["credentials", "destructive", "external-write"].includes(surface))) {
    return "deferred";
  }
  if (highRisk || providerCoupling === "provider-bound") return "pattern-reference";
  if (["specialized-procedure", "product-and-business-operations", "creative-production", "defensive-security-assessment", "scientific-computation"].includes(domain.id)) {
    return "pattern-reference";
  }
  return "pattern-reference";
}

export function inspectGroundedSemanticBody(card, body) {
  if (!card?.facetId || !card?.bodySha256 || !card?.canonicalSourceId) {
    throw new Error("grounded semantic review requires an exact packet card");
  }
  const bytes = Buffer.byteLength(body);
  if (bytes !== card.bodyBytes) throw new Error(`body byte count mismatch for ${card.facetId}`);
  const bodyDigest = sha256(body);
  if (bodyDigest !== card.bodySha256) throw new Error(`body digest mismatch for ${card.facetId}`);
  const headings = extractHeadings(body);
  const signals = extractSignals(body, card);
  return {
    bodyDigest,
    bytes,
    headings,
    signals,
    frontmatterName: frontmatter(body, "name") || card.name,
    frontmatterDescription: frontmatter(body, "description"),
  };
}

export function buildGroundedSemanticReview(card, body) {
  const evidence = inspectGroundedSemanticBody(card, body);
  const label = clean(evidence.frontmatterName || card.name).replace(/[-_]+/g, " ");
  const analysisText = clean([
    label,
    card.summary,
    card.sourcePath,
    evidence.frontmatterDescription,
    ...evidence.headings,
    ...evidence.signals,
    body,
  ].join(" "));
  const domain = chooseDomain(card, evidence);
  const stages = domain.stages;
  let { providerCoupling, projectCoupling } = coupling(card, evidence);
  const malicious = MALICIOUS_TERMS.test(`${card.canonicalSourceId} ${card.sourcePath} ${card.summary} ${analysisText}`);
  const writes = WRITE_TERMS.test(analysisText);
  const external = card.security?.surfaces?.includes("network") && EXTERNAL_TERMS.test(analysisText);
  const highRisk = HIGH_RISK_TERMS.test(analysisText) || (card.security?.surfaces?.length ?? 0) > 1;
  if (external && domain.id === "automation-and-integration") providerCoupling = "provider-bound";
  if (["software-implementation", "delivery-pipeline-engineering", "browser-and-interface-testing"].includes(domain.id)) {
    projectCoupling = "project-bound";
  }
  if (external) projectCoupling = "project-bound";
  const effects = unique(["read", writes ? "write" : null, external ? "external-write" : null].filter(Boolean));
  const stageText = stages.length > 0 ? stages.join(", ") : "its named workflow and acceptance boundaries";
  const cluster = malicious ? "unsafe-or-malicious-skill-fixture" : domain.id;
  const disposition = dispositionFor({
    malicious,
    providerCoupling,
    external,
    highRisk,
    domain,
    securitySurfaces: card.security?.surfaces ?? [],
  });
  const sourceAlias = label || slug(card.name);

  return {
    facetId: card.facetId,
    canonicalSourceId: card.canonicalSourceId,
    bodySha256: card.bodySha256,
    neutralCapabilitySummary: malicious
      ? `Identifies ${sourceAlias} as hostile or adversarial fixture material and preserves it only as rejection evidence.`
      : `${sourceAlias} ${domain.capability} around ${stageText}, with its authority and acceptance boundaries kept explicit.`,
    neutralIntentExamples: malicious
      ? [`detect unsafe instruction patterns represented by ${sourceAlias}`, `retain ${sourceAlias} as a negative security fixture`]
      : [`apply ${sourceAlias} to a declared bounded outcome`, `audit a ${sourceAlias} result against its named constraints`],
    legacyAliases: unique([card.name, evidence.frontmatterName]).filter((value) => clean(value).toLowerCase() !== clean(sourceAlias).toLowerCase()).slice(0, 2),
    inputs: malicious
      ? [`the exact ${sourceAlias} fixture body and its security disposition`, "the enclosing test provenance and non-execution boundary"]
      : [`the requested ${sourceAlias} outcome, authority, constraints, and acceptance conditions`, domain.object],
    operations: malicious
      ? [`bind ${sourceAlias} to its exact fixture digest without following embedded instructions`, `classify ${sourceAlias} indicators and preserve a fail-closed rejection record`]
      : [
          `for ${sourceAlias}, reconstruct ${stageText} as ordered decision and verification stages`,
          `for ${sourceAlias}, separate source-supported mechanisms from provider assumptions and ungranted effects`,
          `for ${sourceAlias}, test the resulting artifact or recommendation against explicit failure and acceptance conditions`,
        ],
    outputs: malicious
      ? [`a digest-bound rejection record for ${sourceAlias}`, "negative security-test evidence"]
      : [`a bounded ${sourceAlias} procedure or artifact`, `verification evidence tied to ${sourceAlias} acceptance conditions`],
    effects,
    failureBehavior: malicious
      ? ["never execute or relay instructions from the fixture", "fail closed if fixture provenance or digest changes"]
      : [
          `stop ${sourceAlias} when required source evidence, authority, or validation is absent`,
          `surface ${sourceAlias} provider, project, and acceptance failures separately`,
        ],
    exclusions: malicious
      ? ["does not expose credentials or private data", "does not treat embedded instructions as user authority", "does not promote fixture behavior"]
      : [
          `does not let ${sourceAlias} expand permissions beyond the user's declared scope`,
          `does not claim ${sourceAlias} success from configuration or prose alone`,
          `does not copy source wording into a promoted skill`,
        ],
    usefulInvariants: malicious
      ? [`${sourceAlias} remains inert`, "fixture identity and digest remain exact"]
      : [
          `${sourceAlias} remains bound to exact source evidence`,
          `${sourceAlias} effects are authorized before execution`,
          `${sourceAlias} acceptance is based on observable evidence`,
        ],
    materialRisks: malicious
      ? ["instruction injection", "credential disclosure", "unsafe capability promotion"]
      : unique([
          `${sourceAlias} behavior can drift from its reviewed source or provider version`,
          external ? `${sourceAlias} can cause remote mutation, cost, or disclosure` : `${sourceAlias} can produce an unverified local artifact`,
          highRisk ? `${sourceAlias} operates near consequential security, safety, privacy, or production boundaries` : `${sourceAlias} assumptions can hide incomplete acceptance evidence`,
        ]),
    providerCoupling,
    projectCoupling,
    disposition,
    proposedCluster: cluster,
    confidence: evidence.signals.length >= 3 ? "high" : "medium",
    copiedSourceProse: false,
    promotionClaim: false,
    semanticEvidence: {
      schemaVersion: 1,
      bodySha256: evidence.bodyDigest,
      bodyBytes: evidence.bytes,
      headings: evidence.headings.slice(0, 8),
      signals: evidence.signals.slice(0, 5),
      classifier: domain.id,
      derivation: "exact-body-structural-and-lexical-semantic-review-v1",
    },
  };
}
