import path from "node:path";

import { sha256 } from "./io.mjs";

const TEXT_EXTENSIONS = new Set([
  ".cjs", ".css", ".graphql", ".html", ".js", ".json", ".jsx", ".md", ".mjs",
  ".ps1", ".py", ".scss", ".sh", ".sql", ".svg", ".toml", ".ts", ".tsx", ".txt",
  ".yaml", ".yml",
]);

const BINARY_EXTENSIONS = new Set([
  ".7z", ".avi", ".bin", ".bmp", ".doc", ".docx", ".eot", ".exe", ".gif", ".gz",
  ".ico", ".jpeg", ".jpg", ".m4a", ".mov", ".mp3", ".mp4", ".otf", ".pdf", ".png",
  ".tar", ".ttf", ".wav", ".webm", ".webp", ".woff", ".woff2", ".zip",
]);

const OWNER_TERMS = [
  {
    owner: "eternities-forge",
    terms: [
      "coordination", "shared tree", "lease", "mutex", "handoff", "goal backward", "observable truth",
      "wiring", "multi lens", "skeptic", "claim ledger", "completion proof", "independent review",
    ],
  },
  {
    owner: "eternities-phoenix",
    terms: [
      "diagnostic", "debug", "hypothesis", "reproduce", "reproduction", "eliminated", "root cause",
      "measurement before hypothesis", "incident", "failure", "regression",
    ],
  },
  {
    owner: "eternities-atlas",
    terms: [
      "schema", "information_schema", "migration", "constraint", "rls", "database", "sql", "query",
      "coverage before ranking", "data coverage", "rollback", "dry run",
    ],
  },
  {
    owner: "eternities-mnemosyne",
    terms: ["keel", "memory", "continuity", "context budget", "compaction", "wake", "letter", "checkpoint"],
  },
  {
    owner: "eternities-herald",
    terms: ["deploy", "release", "ship sequence", "production readiness", "version bump", "rollback"],
  },
  {
    owner: "eternities-aegis",
    terms: ["security", "threat", "permission", "trust boundary", "secret", "vulnerability"],
  },
  {
    owner: "eternities-logos",
    terms: ["voice check", "editorial", "writing", "canon", "style guide", "claim support"],
  },
];

function portablePath(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "");
}

function hasSegment(value, names) {
  return value.split("/").some((segment) => names.has(segment.toLowerCase()));
}

export function classifyArchivePath(input) {
  const relativePath = portablePath(input);
  const lower = relativePath.toLowerCase();
  const basename = path.posix.basename(lower);
  const extension = path.posix.extname(lower);

  if (
    basename === ".env" || basename.startsWith(".env.") ||
    /(?:^|[._-])(credentials?|secrets?|private[-_]?key|api[-_]?keys?|tokens?)(?:[._-]|$)/i.test(basename) ||
    basename === "settings.local.json" || basename === "scheduled_tasks.lock"
  ) {
    return { disposition: "excluded", reason: "sensitive-local-state", inspectContent: false };
  }

  if (
    extension === ".log" || extension === ".jsonl" ||
    /(?:^|[/_-])(transcripts?|chat[-_ ]?dump|conversation[-_ ]?export)(?:[/_. -]|$)/i.test(lower) ||
    lower.includes("/.reasonix/truncated-results/")
  ) {
    return { disposition: "excluded", reason: "raw-session-or-log", inspectContent: false };
  }

  if (hasSegment(lower, new Set([".git", "node_modules", "vendor", "third_party", "_repos"]))) {
    return { disposition: "excluded", reason: "vendor-or-dependency", inspectContent: false };
  }

  if (
    hasSegment(lower, new Set(["dist", "coverage", ".cache", ".next"])) ||
    /(?:^|\/)(?:package-lock|pnpm-lock|yarn\.lock)(?:\.json|\.yaml)?$/i.test(lower) ||
    /(?:^|\/)_shots?(?:\/|$)/i.test(lower)
  ) {
    return { disposition: "excluded", reason: "generated-or-build-output", inspectContent: false };
  }

  if (BINARY_EXTENSIONS.has(extension)) {
    return { disposition: "excluded", reason: "binary-or-media", inspectContent: false };
  }

  if (TEXT_EXTENSIONS.has(extension) || extension === "") {
    return { disposition: "eligible", reason: "inspectable-first-party-text", inspectContent: true };
  }

  return { disposition: "excluded", reason: "unsupported-file-type", inspectContent: false };
}

function extractHeadings(text) {
  return [...text.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)]
    .map((match) => match[1].trim())
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 12);
}

function extractSymbols(text) {
  const values = [];
  const seen = new Set();
  const patterns = [
    /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\bclass\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (seen.has(match[1])) continue;
      seen.add(match[1]);
      values.push(match[1]);
      if (values.length === 12) return values;
    }
  }
  return values;
}

function compactSearchText(relativePath, text, maxEvidenceChars) {
  const bounded = text.slice(0, maxEvidenceChars);
  return `${portablePath(relativePath).replaceAll(/[-_.\/]+/g, " ")}\n${bounded}`
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

function recommendOwner(relativePath, text, maxEvidenceChars) {
  const searchable = compactSearchText(relativePath, text, maxEvidenceChars);
  const workflowBonus = /(?:^|\/)\.claude\/skills\//i.test(portablePath(relativePath)) ? 2 : 0;
  const ranked = OWNER_TERMS.map(({ owner, terms }, priority) => {
    const matchedTerms = terms.filter((term) => searchable.includes(term));
    return { owner, matchedTerms, score: matchedTerms.length + workflowBonus, priority };
  }).sort((left, right) => right.score - left.score || left.priority - right.priority);
  return ranked[0].score >= 2 ? ranked[0] : null;
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export async function buildFirstPartyEvidence(records, options = {}) {
  const {
    sourceIdentity = "unidentified-first-party-archive",
    maxEvidenceChars = 64_000,
    maxInspectableBytes = 2_000_000,
    corpusDigests = new Set(),
    godskillDigestPaths = new Map(),
  } = options;
  if (!Array.isArray(records)) throw new TypeError("records must be an array");
  if (!Number.isInteger(maxEvidenceChars) || maxEvidenceChars < 1) {
    throw new Error("maxEvidenceChars must be a positive integer");
  }

  const ordered = [...records].sort((left, right) =>
    portablePath(left.relativePath).localeCompare(portablePath(right.relativePath)),
  );
  const ledger = [];
  const cards = [];
  const digestPaths = new Map();

  for (const record of ordered) {
    const relativePath = portablePath(record.relativePath);
    let classification = classifyArchivePath(relativePath);
    if (classification.inspectContent && record.byteSize > maxInspectableBytes) {
      classification = { disposition: "excluded", reason: "inspectable-size-budget", inspectContent: false };
    }
    const row = {
      schemaVersion: 1,
      sourceIdentity,
      relativePath,
      state: record.state ?? "working",
      byteSize: Number.isFinite(record.byteSize) ? record.byteSize : null,
      disposition: classification.disposition,
      reason: classification.reason,
      contentInspected: false,
      sha256: null,
    };

    if (!classification.inspectContent) {
      ledger.push(row);
      continue;
    }

    const bytes = await record.read();
    const digest = sha256(bytes);
    const text = bytes.toString("utf8");
    row.contentInspected = true;
    row.sha256 = digest;
    ledger.push(row);
    const paths = digestPaths.get(digest) ?? [];
    paths.push(relativePath);
    digestPaths.set(digest, paths);

    const recommendation = recommendOwner(relativePath, text, maxEvidenceChars);
    if (!recommendation) continue;
    cards.push({
      schemaVersion: 1,
      sourceIdentity,
      relativePath,
      sha256: digest,
      byteSize: bytes.byteLength,
      evidenceChars: Math.min(text.length, maxEvidenceChars),
      headings: extractHeadings(text.slice(0, maxEvidenceChars)),
      symbols: extractSymbols(text.slice(0, maxEvidenceChars)),
      mechanismTerms: recommendation.matchedTerms,
      ownerRecommendation: recommendation.owner,
      reviewState: "unreviewed-first-party",
    });
  }

  cards.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const ownerMap = cards.map((card) => ({
    relativePath: card.relativePath,
    sha256: card.sha256,
    owner: card.ownerRecommendation,
    mechanismTerms: card.mechanismTerms,
    reviewState: card.reviewState,
  }));
  const internal = [...digestPaths.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([digest, paths]) => ({ sha256: digest, paths: sortedUnique(paths) }))
    .sort((left, right) => left.sha256.localeCompare(right.sha256));
  const corpusMatches = sortedUnique([...digestPaths.keys()].filter((digest) => corpusDigests.has(digest)));
  const godskillMatches = [...digestPaths.entries()]
    .filter(([digest]) => godskillDigestPaths.has(digest))
    .map(([digest, paths]) => ({
      sha256: digest,
      archivePaths: sortedUnique(paths),
      godskillPaths: sortedUnique(godskillDigestPaths.get(digest)),
    }))
    .sort((left, right) => left.sha256.localeCompare(right.sha256));

  return {
    ledger,
    cards,
    ownerMap,
    duplicates: { internal, corpusMatches, godskillMatches },
  };
}
