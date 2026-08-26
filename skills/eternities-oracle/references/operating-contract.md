# Eternities Oracle operating contract

Use this contract when the investigation persists beyond the current answer or combines local and live evidence.

## Question frame

Record:

- the consequential decision or falsifiable question;
- scope and explicit exclusions;
- required freshness and temporal cutoff;
- allowed effects and authorization boundaries;
- success evidence and stop conditions.

## Source hierarchy

Choose the highest available authority appropriate to the claim:

1. direct runtime observation or exact local implementation;
2. canonical project records, receipts, manifests, and versioned history;
3. current official documentation, specifications, APIs, and repositories;
4. first-party announcements or datasets;
5. reputable secondary analysis;
6. community discussion as a lead or sentiment signal only.

A lower tier may contradict a higher tier, but cannot silently overrule it. Preserve the disagreement and explain whether recency, scope, or direct observation changes the authority judgment.

## Evidence record

For each material finding retain:

- `finding_id` and atomic claim;
- disposition: `verified`, `unverified`, `rejected`, or `deferred`;
- observation versus inference;
- source identity and authority tier;
- exact local path or canonical URL;
- line, section, page, commit, timestamp, or other bounded locator;
- relevant date and retrieval date for live evidence;
- supporting, contradicting, qualifying, and missing evidence;
- confidence reason and what would falsify or refresh the finding.

## Synthesis rules

- One citation can support only the scope it actually establishes.
- Similar wording across sources does not establish independence.
- Missing evidence is not negative evidence unless the search boundary makes absence meaningful.
- Comparative claims require a named baseline and matching conditions.
- Current claims require live verification; historical claims preserve the then-current source date.
- Never fabricate a locator, quote, URL, file, execution result, or confidence score.

## Completion

Return the verdict, verified findings, unverified findings, rejected claims, deferred work, source ledger, conflicts, and refresh targets. State the investigation limit plainly. External writes or operational changes remain separate actions requiring their own authorization.
