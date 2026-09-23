# Wave 13 product integration focused r3 rereview

Review date: 2026-09-23 13:10 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Candidate release ID: `22cd6b728ee53617395eaff23e2a37f9c5850869ce0dbd5be1aaebdea92ef32c`  
Git HEAD: `7438872d9ac89762608f4b05ef213298eb4b1a50`; the candidate is the current working-tree product bound by the validated release ID and manifest digests.

## Verdict

**Not ready for bounded product integration acceptance.** The r2 false negative is repaired: both farm irrigation queries naming municipal or city-utility supply now rank the agricultural owner first, including the case that says “not drinking water.” The prior four municipal/public-water negatives and the three farm-water, heat-unit, and mapped-soil positives also pass. However, two nearby municipal/drinking-water infrastructure paraphrases still rank the agricultural owner first. In both cases the only matched trigger term is the generic word `water`. This remains a focused discovery false positive for a product whose entrypoint explicitly routes civic-water and infrastructure-design requests elsewhere.

## Verification

### Prior four negative routes pass

The focused test excludes `agricultural-observation-and-trial` from the top 20 for all four checked out-of-domain requests:

| Query | Agricultural owner |
|---|---|
| `design a municipal drinking water treatment plant` | absent |
| `triage municipal drinking water quality from a laboratory report` | absent |
| `plan a public drinking water treatment system` | absent |
| `assess potable water quality for a city utility` | absent |

### All five requested positive routes pass

Direct offline catalog search ranks the agricultural owner first for the three original routes and the two municipal-supply routes:

| Query | Rank | Score |
|---|---:|---:|
| `triage a farm water quality result from a supplied laboratory report` | 1 | 153.315 |
| `calculate growing degree days from supplied weather records` | 1 | 160.79 |
| `compare mapped soil survey data with site measurements for this field` | 1 | 162.368 |
| `triage farm irrigation water quality results from a municipal supply` | 1 | 176.645 |
| `assess farm crop irrigation water report from city utility; not drinking water` | 1 | 131.548 |

Two additional nearby farm paraphrases also rank the owner first:

| Query | Rank | Score |
|---|---:|---:|
| `review irrigation laboratory results from a municipal utility for crops on this farm` | 1 | 104.096 |
| `evaluate farm irrigation water quality using a city utility report; not for drinking` | 1 | 113.581 |

### Blocking: nearby municipal infrastructure paraphrases still route to agriculture

Two close variants of the prior negative cases rank `agricultural-observation-and-trial` first, with score 35.553 in each case:

| Out-of-domain query | Agricultural result | Matched terms |
|---|---|---|
| `design a municipal drinking-water treatment plant` | rank 1 | `water` only |
| `design a city drinking water purification plant` | rank 1 | `water` only |

The metadata now uses more precise anti-triggers such as `municipal drinking water`, `municipal water treatment`, and `drinking water treatment` (`skill.json:13-19`). The first paraphrase hyphenates “drinking-water,” so it bypasses these literal phrases. The second uses “city” and “purification,” so it contains none of the declared civic-water phrases. The search implementation suppresses only when a normalized query contains a complete anti-trigger phrase; otherwise a shared token can score the owner (`product/lib/product.mjs:154-158`). Here that single generic token is enough to rank the farm skill above every other result.

Keep the five in-scope positives green while adding these two negative regressions and preventing `water` alone from making this owner the leading route for an infrastructure-design request. This finding is based on these specific lexical probes; it is not a claim about general semantic routing quality.

## Content and manifest

The entrypoint continues to state that this is not a municipal, potable, public, or drinking-water treatment workflow and limits farm-water triage to crop and soil decisions. The integrated reference remains linked and declared in `skill.json`; it separates mapped from measured soil evidence and calculated/model-estimated heat units from observed stages. It also says not to diagnose a hazard from one value, promise a guaranteed agronomic outcome, invent water-quality thresholds, or provide treatment instructions.

`node product/bin/godskills.mjs validate` returned `status: verified-content`, release ID `22cd6b728ee53617395eaff23e2a37f9c5850869ce0dbd5be1aaebdea92ef32c`, and 68 skills. The catalog contains 68 entries. Agricultural entrypoint and reference digests match across the catalog, release manifest, and current file bytes.

## Test record and limits

- `node --test tests/universal-wave13-integration.test.mjs`: 5 tests passed, 0 failed. Its discovery assertions cover the four original negatives, two municipal-supply positives, and the three water/heat/soil positives; it also checks content/resource boundaries and interatomic specialist-parent structure.
- `node product/bin/godskills.mjs validate`: passed for the candidate release ID and 68 skills.
- Direct offline probes checked those nine routes, two additional farm paraphrases, and the two nearby infrastructure paraphrases that expose the remaining false positive.
- No implementation files were changed. No broad suite, installer, publication, upstream-source review, or field/scientific workflow was run.

This is a bounded integration and lexical-discovery review. It makes no claim about general semantic routing, agronomic performance, scientific validity, or completion of the wider corpus.
