# Catalog intake status

`scripts/query-catalog-skill-intake.mjs` has a standalone status mode for callers
who need current verified intake progress rather than matching source records:

```sh
node scripts/query-catalog-skill-intake.mjs --summary
```

The command prints one JSON object after the existing continuation evidence
loader has validated the manifest, frozen queue, request plan and receipts. It
keeps the established `scope`, `networkCalls`, `classificationComplete`,
`continuation`, and `bodyStatuses` fields and adds `mode: "summary"`,
`sourceCount` (the loaded `sources` array length), `uniqueBodyCount` (the loaded
`queue` array length), `authority: "none"`, and `activation: "none"`. Search
results and the underlying `sources` and `queue` arrays are omitted.

Summary mode is exclusive: `--summary` cannot be combined with `--query`,
`--domain`, or `--limit`, repeated, or given a value. Unknown arguments are
rejected with a nonzero exit and no success JSON. Existing query invocation and
JSON remain unchanged:

```sh
node scripts/query-catalog-skill-intake.mjs --query TEXT [--domain DOMAIN] [--limit 1..5]
```

Counts are derived from the current integrity-checked evidence and can change
when that evidence changes under its manifest contract. These are discovery
metadata and triage statuses only; they do not certify a skill, establish
authority, review a source body, or authorize activation.
