# Wave 13 product integration focused rereview

Review date: 2026-09-23 09:37 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Baseline: `7438872d9ac89762608f4b05ef213298eb4b1a50` (`feat/universal-product-v1`)  
Candidate: 68 skills, release ID `49236eb74ecd2e14ee4d7d897c2739b45e3488eada141037d6a982bccc7f7225`

## Verdict

**Not ready for staged product integration acceptance.** The two farm findings in the first review are corrected for the intended positive farm routes and the explicit single-value hazard / guaranteed-outcome boundary is back in the integrated reference. However, the expanded farm-water metadata now ranks the agricultural method first for clearly municipal water requests, including a municipal treatment-plant design request that the farm method explicitly excludes. This is a blocking discovery ambiguity in the candidate.

This is a focused rereview of the farm repairs, not a new source-quality or performance assessment. It does not claim scientific, agronomic, hydrologic, public-health, or professional performance. The interatomic specialist-parent test was included in the focused test run and passed its structural assertions; that is not a fresh full review of the specialist integration.

## Review boundary and binding

I read the exact changed farm owner, metadata, integrated reference, focused integration test, and the candidate catalog/index/release registration relevant to this rereview. The initial review is preserved at [the original review](../wave13-product-integration-review-luna6/review.md); its SHA-256 remains `b5b1a86057abe84b9d6ffe3a970c2c1bb922be050e66cee9ef0f086becb10379`. Its receipt SHA-256 is `a7e97150ee7104dd96bbbed85f0901754b063c8f1a3419f60e164fb02c2873531`.

The Git index had no staged paths, so this verdict binds to the named release candidate in the current worktree, not a Git-staged patch. The product release validator and offline product search were used; no install, publication, external call, broad suite, or source workflow was run. The wave13 source artifacts were not re-reviewed.

## Focused findings

### Resolved: intended farm searches now discover the owner

The farm owner's metadata now includes water-quality, growing-degree-day / heat-unit, and mapped-soil triggers. The owner entrypoint links the integrated reference, and the owner metadata declares that relative reference as a resource. Offline search against the candidate returned `agricultural-observation-and-trial` at rank 1 for all three intended queries:

| Query | Result | Score |
|---|---|---:|
| `triage a farm water quality result from a supplied laboratory report` | agricultural owner, rank 1 | 153.315 |
| `calculate growing degree days from supplied weather records` | agricultural owner, rank 1 | 160.79 |
| `compare mapped soil survey data with site measurements for this field` | agricultural owner, rank 1 | 162.368 |

Each discovery response reported `authority: none` and `activation: none`. This resolves the original positive-discoverability gap for the tested intents.

### Resolved in content: explicit hazard and guarantee limits are restored

The integrated reference now states: “Do not diagnose a hazard from one value or promise a guaranteed agronomic outcome.” It also requires an appropriately sampled, interpreted, current local assessment before an action claim. The focused test asserts the one-value hazard wording. It does not separately assert the guaranteed-outcome clause; that is a small remaining test-coverage omission, not a content failure in this candidate.

### Blocking: municipal water queries are misrouted to the farm method

Two offline negative probes both ranked `agricultural-observation-and-trial` first:

| Out-of-domain query | Farm result | Why this is a failure |
|---|---|---|
| `design a municipal drinking water treatment plant` | rank 1, score 35.553; matched only `water` | The request is municipal infrastructure design, while the farm reference says not to design infrastructure and scopes water triage to farm decisions. |
| `triage municipal drinking water quality from a laboratory report` | rank 1, score 100.176; matched `laboratory`, `quality`, `triage`, `water` | The query has no farm, crop, or irrigation context, yet the farm method wins the route. |

The current summary and farm-water trigger make generic terms such as `water`, `quality`, `laboratory`, and `triage` strong matches without requiring farm context. The new focused test adds positive search cases but has no negative-route assertion, so these collisions pass the 3/3 test run. Narrow the farm-water discovery language or otherwise disambiguate the product route, then add negative municipal-water regression cases while keeping the three farm positives green.

## Packaging and ownership checks

- `node product/bin/godskills.mjs validate` passed with `status: verified-content`, the candidate release ID above, and `skillCount: 68`.
- The agricultural owner links `references/site-data-and-water-triage.md`; `skill.json` declares the same relative resource. The catalog registers its path and digest `094dddf4fa8da9f16e396e5faa90c8794757b9bdc241eed2fbdbc9efd3e063b3`, which is also present in `product/release.json`.
- The updated agricultural summary is present in `product/INDEX.md` and `product/catalog.json`. The catalog and release manifest validate together.
- The owner metadata retains four pattern-reference source records. The water, mapped-soil, and growing-degree-day records carry structured body digests; the earlier agricultural-soil record retains its digest in the provenance note. This rereview checked retained provenance metadata, not the upstream source contents or licensing.
- `node --test tests/universal-wave13-integration.test.mjs` passed all 3 tests. Those cover resource/boundary/provenance text, the three positive farm routes, and structural interatomic-parent relations. They do not test the municipal-water negative routes.

## Verification limits

No broad test suite, installer, publication, external call, source script, or agricultural/scientific workflow was run. Passing content validation establishes catalog/resource/manifest consistency for this release candidate; the search probes establish behavior only for the stated offline queries. Neither proves scientific or field performance.

The candidate remains **not ready** until the municipal-water false-positive routes are corrected and guarded by negative tests. The original review and its artifacts were not modified.
