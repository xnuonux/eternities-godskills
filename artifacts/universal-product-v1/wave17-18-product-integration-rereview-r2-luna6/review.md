# Independent Wave18 R2 integration rereview

**R2 static instruction-reviewed integration: READY** for the exact product release `96af112ec57d4bd962d721578a007b6d214e09cf891e008123e51869bcbfaefb` at HEAD `6fa17164e85187a34bb3e8144604189e139968e1`.

The three previously failing Daedalus paraphrase/conflict probes now place Daedalus first, not merely in the top three. The transaction-boundary wording is materially safer, the relevant owner relationships are present, and the five new focused tests pass. Fresh partial-commit and contradictory cross-system cases also surface Daedalus first. I found an advisory owner-shortlist over-inclusion for generic database work, but not a method activation or authority grant: `searchCatalog` continues to return `authority: none` and `activation: none`, and the R2 card’s scope remains explicit.

This is a static R2 integration decision only. It is not live transaction/database qualification, provider/runtime qualification, acceptance of the source proposal, installation, or qualification of the 68-skill corpus. No repository-wide suite was run in this rereview because the Wave19 projection test is present as concurrent in-flight work; a possible suite-level failure during that work would not be attributed to this R2 candidate.

## Repair verification

`verifyProduct(product)` independently passed against the supplied release ID. The exact `product/release.json` is 21,603 bytes with SHA-256 `1b8a1daa5aa16ceeddf09623b76de64f513c3ef49c14a6bc7254bf0f3d70bd8e`; it declares 68 skills and 177 files. The verifier recomputed the release identity and validated the complete file set, file hashes, catalog/metadata correspondence, entrypoints, and resources. The catalog’s exact SHA-256 is `eadea445ecdb0a0c03c4dd9d0bf88f17ebb621e56af9218900ca4ca146225e7f`. The focused product tests also passed the copied-pack/minimal-environment CLI portability case.

The five newly added focused tests are present and passed: three route regressions for the prior paraphrase/conflict cases, one transaction-boundary assertion, and one relationship assertion. Focused execution of `tests/universal-owner-refinements-wave17-18.test.mjs` plus `tests/universal-product.test.mjs` finished with **34 passed, 1 skipped, 0 failed**. `git diff --check` passed.

## R2 routing results

| Probe | Previous release `0e8abf…` | Current release `96af11…` | Finding |
|---|---:|---:|---|
| “A database action succeeded but a downstream service failed…” | Daedalus rank 5 | Rank 1 | Repaired |
| “A write is durable but the downstream step failed…” | Not in top 5 | Rank 1 | Repaired |
| “The service should be atomic even though the first database commit must remain…” | Not in top 5 | Rank 1 | Repaired |
| Held-out: payment transaction timed out after commit; fulfillment API returned 500 | Rank 2 | Rank 1 | Pass |
| Held-out: invoice posted; customer provisioning failed; identify state/compensation | Rank 1 | Rank 1 | Pass |
| Held-out: all-or-nothing required across database/vendor API while a commit must remain visible | Rank 4 | Rank 1 | Pass; conflict is surfaced to Daedalus |

The old comparison catalog was reconstructed in memory by reversing only the stated Wave17–18 repairs (the three new Daedalus triggers, its three relationship additions, the Logos→Muse edge, and the Daedalus methods-reference hash). Its SHA-256 exactly matched the prior candidate’s recorded catalog hash `d396e7943d6a4552d9a9c976b13c166e6b06e1e935b1fb02af61ce9d60c95b50`; it was not written to disk.

Fresh boundary controls ranked `api-rate-limit-recovery` first for a Retry-After/idempotency request, `release-script-safety` first for a timed-out publication, and Atlas first for schema migration validation. The atomicity wording now says a single verified transaction is appropriate only when relevant effects share a supported transactional boundary; a database transaction does not make a remote service atomic. Where that boundary is unavailable, the method preserves uncertainty and requires reconciliation or explicitly authorized compensation. The ordinary all-or-nothing exclusion and the read-only exclusion remain in the card.

### Advisory lexical over-inclusion

Held-out “A database action succeeded and returned a row count; summarize it for a dashboard, with no downstream call or retry” now ranks Daedalus first (it was absent from the previous release’s top five). “Make an ordinary single-database update atomic within one supported transaction” also ranks Daedalus first (previously absent from the top five). The latter is a legitimate Daedalus engineering-owner result, although the partial-commit method itself is expressly excluded; the former is a noisy owner suggestion for a reporting-shaped request. Neither query causes method-level activation: discovery remains advisory and returns no authority or activation. These are precision caveats to retain in future routing evaluation, not blockers to this R2 instruction review. No previously present top-five result was displaced in the dashboard-shaped query; the ordinary transaction query adds Daedalus and pushes one low-ranked generic candidate out.

The API-boundary results also remain query-specific: a generic “API 429 with safe retries” may list Hermes above the rate-limit specialist, while the held-out query naming Retry-After and an idempotency key correctly ranks `api-rate-limit-recovery` first. That is lexical retrieval behavior, not a Daedalus R2 route.

## Relationships, provenance, and content boundary

- Daedalus `related` now includes Atlas, `release-script-safety`, and `api-rate-limit-recovery`, matching the method’s migration, interrupted-release, and provider-quota boundary instructions.
- Logos `related` now includes Muse, matching its explicit visual/accessibility acceptance handoff.
- The Daedalus `source-review` provenance still points to the Wave18 review packet and explicitly says the source’s cross-engine savepoint/logical-delete advice was rejected and source rights remain unresolved. No provenance field was removed or promoted to a legal/rights clearance.
- Wave18’s pinned source review and independent receipt remain proposal-stage evidence only. The upstream repository’s missing root LICENSE, README MIT badge, and null body hints do not resolve reuse rights. This rereview does not authorize copying or redistribution. The earlier independent source review found no long exact seven-word phrase overlap for the source bodies against the new method; that remains a text-overlap check, not a legal conclusion.
- The current R2 method makes no unsupported runtime, database-provider, or cross-engine compatibility claim. It requires engine/driver/ORM/version evidence, an independent final-state matrix, reconciliation before retry after an uncertain commit, and explicit compensation authority. It does not prescribe source-specific transaction syntax.

The updated Wave18 source review (`ef9a7d…`), proposal (`9640cc…`), author receipt (`4283b7…`), and independent review/receipt (`ef62d7…` / `6079b0…`) were checked as the governing proposal evidence. Their READY decisions were for nonterminal proposal review only; this product rereview does not change source disposition or rights status.

