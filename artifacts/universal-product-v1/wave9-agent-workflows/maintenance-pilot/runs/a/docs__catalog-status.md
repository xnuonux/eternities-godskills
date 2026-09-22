# Catalog intake status

## Verified summary

Run the standalone summary mode when current intake progress is needed without
matching source records:

```text
node scripts/query-catalog-skill-intake.mjs --summary
```

It prints one JSON object and exits successfully after the existing verified
continuation loader has checked the intake manifest and receipts. The object
keeps the usual `scope`, `networkCalls`, `classificationComplete`, `continuation`,
and `bodyStatuses` fields, then adds:

- `mode: "summary"`
- `sourceCount`, derived from the loaded `sources` array length
- `uniqueBodyCount`, derived from the loaded `queue` array length
- `authority: "none"`
- `activation: "none"`

`results`, `sources`, and `queue` are omitted. Counts therefore reflect the
currently verified evidence and can change when the established manifest and
receipts change; they are not stored constants. Classification metadata is
advisory intake triage only and does not certify, activate, or approve a skill.

Summary mode is exclusive. Any combination with `--query`, `--domain`, or
`--limit`, a repeated `--summary`, a value after `--summary`, or an unknown
argument exits nonzero without success JSON. Query mode remains available with
`--query TEXT [--domain DOMAIN] [--limit 1..5]` and keeps its existing output
shape.
