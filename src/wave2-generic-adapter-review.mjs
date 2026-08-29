import { createHash } from "node:crypto";

export const APPROVED_EMPTY_RUBE_TEMPLATE_DIGESTS = Object.freeze([
  "50cfe934b260c4eefbba8aff4e1dd7ce3a407f47f717e7186ec510a7b6e8eb5c",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sourceName(body, fallbackName) {
  return (
    body.match(/^name:\s*([^\r\n]+)$/m)?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, "") || fallbackName
  );
}

function displayName(body, fallbackName) {
  const heading = body.match(/^#\s+(.+?)\s+Automation via Rube MCP\s*$/im)?.[1]?.trim();
  if (heading) return heading;
  return fallbackName
    .replace(/-automation$/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
    .join(" ");
}

export function normalizeRubeAdapterTemplate(body, fallbackName = "") {
  let normalized = body.replace(/\r/g, "");
  const name = sourceName(normalized, fallbackName);
  const slug = name.replace(/-automation$/, "");
  const display =
    normalized.match(/^#\s+(.+?)\s+Automation via Rube MCP\s*$/im)?.[1] || slug;
  const toolkit = normalized.match(/composio\.dev\/toolkits\/([a-z0-9_-]+)/i)?.[1] || slug;
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  for (const value of [...new Set([name, display, toolkit, slug])].sort(
    (left, right) => right.length - left.length,
  )) {
    if (!value) continue;
    normalized = normalized.replace(
      new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(value)}(?![A-Za-z0-9])`, "g"),
      "{provider}",
    );
  }
  return normalized.toLowerCase();
}

export function inspectGenericRubeAdapterBody(
  card,
  body,
  approvedTemplateDigests = APPROVED_EMPTY_RUBE_TEMPLATE_DIGESTS,
) {
  if (!card?.canonicalSourceId?.startsWith("ComposioHQ/awesome-claude-skills@")) {
    throw new Error("generic adapter review requires the pinned Composio source repository");
  }
  const bytes = Buffer.byteLength(body);
  if (bytes !== card.bodyBytes) {
    throw new Error(`body byte count mismatch for ${card.facetId}`);
  }
  const bodyDigest = sha256(body);
  if (bodyDigest !== card.bodySha256) {
    throw new Error(`body digest mismatch for ${card.facetId}`);
  }
  const templateDigest = sha256(normalizeRubeAdapterTemplate(body, card.name));
  if (!approvedTemplateDigests.includes(templateDigest)) {
    throw new Error(`template digest is not approved for ${card.facetId}`);
  }
  return {
    bodyDigest,
    bytes,
    templateDigest,
    sourceName: sourceName(body, card.name),
    displayName: displayName(body, card.name),
  };
}

export function buildGenericRubeAdapterReview(
  card,
  body,
  approvedTemplateDigests = APPROVED_EMPTY_RUBE_TEMPLATE_DIGESTS,
) {
  const evidence = inspectGenericRubeAdapterBody(card, body, approvedTemplateDigests);
  const provider = evidence.displayName;
  return {
    facetId: card.facetId,
    canonicalSourceId: card.canonicalSourceId,
    bodySha256: card.bodySha256,
    neutralCapabilitySummary: `Names a ${provider} adapter behind a common schema-discovery and connection shell but supplies no provider-specific objects, operations, field rules, authority boundaries, or verification contract.`,
    neutralIntentExamples: [
      `inspect available ${provider} adapter metadata without submitting a domain payload`,
      `determine whether a requested ${provider} action has a governed operation contract`,
    ],
    legacyAliases: [`Rube ${provider} bootstrap`],
    inputs: [
      `a proposed ${provider} outcome, adapter connection, current schema, and session identity`,
      `missing ${provider} object semantics, authority, field validation, effects, privacy, cost, retry, and rollback rules`,
    ],
    operations: [
      `inspect ${provider} schema and connection metadata without transmitting a provider-domain payload`,
      `reject ${provider} execution when only the generic transport shell is present and no operation-specific contract can be verified`,
    ],
    outputs: [`${provider} adapter metadata`, `an unresolved ${provider} authority and behavior contract`],
    effects: ["read", "external-write"],
    failureBehavior: [
      `accounts for mutable ${provider} tool schemas and connection state`,
      `does not define any ${provider} operation, payload, success condition, domain error, or compensating action`,
    ],
    exclusions: [
      `does not authenticate or connect ${provider}`,
      `does not execute a discovered ${provider} tool`,
      `does not infer provider authority from connection availability`,
    ],
    usefulInvariants: [
      `${provider} schemas are inspected before use`,
      `${provider} effects remain blocked until a domain contract and authority are explicit`,
    ],
    materialRisks: [
      `${provider} schemas can expose consequential write operations`,
      `${provider} authentication can grant broad account access`,
      `${provider} requests may disclose sensitive data or incur cost`,
    ],
    providerCoupling: "provider-bound",
    projectCoupling: "project-bound",
    disposition: "rejected",
    proposedCluster: "generic-unbounded-rube-adapter-bootstrap",
    confidence: "high",
    copiedSourceProse: false,
    promotionClaim: false,
  };
}
