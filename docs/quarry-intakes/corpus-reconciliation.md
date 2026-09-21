# Corpus reconciliation v1

Status: bounded deterministic inventory. This is metadata reconciliation, not
semantic deduplication, source-body verification, synthesis, promotion, or
whole-product completion.

The original local output remains preserved at `data/corpus-reconciliation-v1/`
as historical evidence. The latest hardened run, including the verified Exa
intake, was written to
`D:\03-ARSENAL\warehouse\_operations\corpus-reconciliation-2026-09-21-exa/`.

The CLI is deterministic and local-only:

```powershell
node scripts/reconcile-corpus.mjs --root C:\dev\eternities-godskills --output D:\03-ARSENAL\warehouse\_operations\corpus-reconciliation-2026-09-21-exa
```

The manifest records exact SHA-256 and byte length for every supported input
and every explicitly excluded source-bearing file. The output does not read or
execute any source body. Equality of two declared `bodySha256` values is only
a grouping assertion about ledger declarations; it is not verification of a
current file. `contentDigest` is retained separately and is never used as a
body group key. Valid `bodySha256` values are normalized for grouping;
malformed submitted values are retained separately as `declaredBodySha256`,
and missing values remain unkeyed.

Discovery ignores both the canonical local reconciliation output and the
requested output target. This keeps a preserved prior run from becoming a
fresh source or a spurious exclusion when the next run is written elsewhere.

## Included input families

The primary source-row inventory contains 28,787 rows:

| family | primary rows | treatment |
| --- | ---: | --- |
| `artifacts/release-one/source-records.jsonl` | 4,741 | historical source records |
| `artifacts/github-wave-2/source-records.jsonl` | 7,776 | raw wave-2 source records |
| `artifacts/github-wave-3/source-records.jsonl` | 9,100 | raw wave-3 source records |
| `data/quarry-intake-*/sources.jsonl` | 7,167 | registered intake source records, including 2,643 Exa records |
| `data/quarry-intake-2026-09-20-jev/source-cards.json` | 3 | registered source cards |

The historical `artifacts/corpus/body-evidence.jsonl` and
`artifacts/corpus/coverage-ledger.jsonl` each contain 4,741 rows. They are
included as evidence ledgers, not substituted for the later 7,776-row and
9,100-row source waves.

The inventory also binds and processes the supported body/security/evidence
records in `artifacts/github-wave-2`, `artifacts/github-wave-3`, the
checkpoint coverage/review/ownership ledgers, `provenance/source-ledger.jsonl`,
all registered intake `facets.jsonl`, and the source/body/facet/disposition
records under `artifacts/quarry-infusion` and
`artifacts/quarry-infusion-v2`. Infusion canonical sources, body structures,
facets, terminal dispositions, and union/coverage summaries are marked as
derived observations; they do not inflate `sourceRecordCount`.

The repository manifests
`data/github-skill-quarry-wave-2.json` and
`data/github-skill-quarry-wave-3.json` are explicitly excluded because their
entries describe repositories, not skill-body records.

## Reconciled counts

The fresh hardened warehouse manifest digest is
`fcbb9f47bf21164f7fa7744b9331be3aa79615902444e19d3811e825135a872b`.
Two consecutive CLI runs against the same root and separate output targets produced
this same digest and the same five output-file hashes. The fresh output is
163,230,836 bytes; `ledger-observations.jsonl` is 100,195,234 bytes.

| count | value | meaning |
| --- | ---: | --- |
| supported input files | 44 | files read and hash-bound |
| excluded source-bearing files | 20 | excluded and listed with hash/size/record count |
| source records | 28,787 | primary raw source/card rows only |
| supported ledger records | 148,827 | all non-summary rows normalized for reconciliation |
| derived observations | 120,040 | non-primary evidence/classification rows |
| unique primary source identities | 27,741 | aliases remain separate identity values |
| unique source identities | 32,667 | identities observed across supported ledgers |
| unique known bodies | 16,339 | distinct valid declared `bodySha256` values |
| unique known bodies in primary rows | 11,926 | primary rows only; missing historical hashes remain missing |
| missing body-hash records | 9,512 | supported records with no usable declared `bodySha256` |
| missing body-hash primary records | 4,741 | historical release-one source rows |
| content-digest-only records | 4,771 | retained separately from body hashes |
| conflicting-hash identities | 163 | one identity declares more than one body hash |
| conflicting hash declarations | 1,304 | declarations belonging to those identities |
| exact body groups | 16,339 | grouping by declared `bodySha256` only |

Hash-status counts include supported records even when no source identity is
available. An anonymous record with a valid declared body hash is retained in
the matching body group with an anonymous declaration count and input-path
receipt; no synthetic identity is invented. Invalid values never participate
in body groups or conflict winners, but their submitted value remains visible
as `declaredBodySha256` in the normalized record output.

The 163 conflicting identities are preserved in
`identity-conflicts.jsonl`; no snapshot was overwritten. `source-records.jsonl`
and `ledger-observations.jsonl` retain source paths, classifications, input
origins, record positions, and the file hash of each origin. Large body
structure/security/review payloads are represented by bounded metadata and
stable digests; the original ledgers remain untouched and are hash-bound by the
manifest.

## Explicit exclusions

The exact 20 exclusions, reasons, byte sizes, record counts, and file hashes
are in `manifest.json`. The exclusions are deliberately outside the raw source
count:

- repository file manifests from GitHub waves are not skill records;
- cluster/candidate evidence is a derived synthesis target, not a raw source;
- the Lunari first-party quarry uses a different non-skill source schema;
- older duplicate/semantic/coverage summaries without a supported normalized
  schema remain excluded.

The Exa/Jev discovery artifact itself remains outside the corpus. Its separately
verified acquisition is represented only by the 2,643 exact cold source records
in `data/quarry-intake-2026-09-21-exa/sources.jsonl`. The separate
`data/corpus-overlap-pilot-2026-09-20/receipt.json` is also not a skill body or
a reconciliation input. Neither discovery metadata nor the overlap receipt was
read as a source body.

Because excluded source-bearing artifacts remain outside this bounded input
contract, this report makes no whole-corpus claim.

## Next minimal batching input plan

The next batch should stay metadata-first and use the frozen manifest as its
admission ledger:

1. Start with a stratified metadata-only batch over unique known bodies, keyed
   by `(bodySha256, taxonomy/question version, model identity)`. Include old
   foundation, wave 2, wave 3, newest intake, short/long bodies, and all 163
   conflict identities as explicit unknown/quarantine cases. Send aliases once
   per known body, never once per alias.
2. For each admitted item, send only source identity, preserved ownership path,
   repository/commit/blob metadata, existing classifications, hash status,
   conflict status, and bounded structure summaries. Do not send body text in
   this first batch.
3. Select a small held-out set from the same strata. Only where metadata cannot
   answer the declared question should the next batch admit an exact body
   excerpt, bounded to the minimum section needed and carrying the same body
   hash, source origin, and exclusion/failure receipt.
4. Keep semantic grouping proposals separate from exact-body reconciliation;
   the Jev pilot's abstentions and one spreadsheet-equivalent proposal do not
   authorize semantic deduplication or promotion.

No provider call, acquisition, install, source execution, ownership rewrite,
or external action is part of this inventory.

## Git handoff boundary

Keep the reconciliation module, CLI, adversarial tests, this compact report,
and the compact hardened receipt at
`data/corpus-reconciliation-v1/warehouse-manifest.json` in Git.
Do not add the bulk JSONL output to Git: the fresh receipt is approximately
163 MB, including a roughly 100 MB ledger file. The warehouse output is the
reproducible operational artifact; the preserved local output is not deleted
or rewritten by this hardening pass.
