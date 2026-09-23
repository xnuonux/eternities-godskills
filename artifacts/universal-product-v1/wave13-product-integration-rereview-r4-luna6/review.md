# Wave 13 product integration independent focused r4 rereview

Review date: 2026-09-23 13:38 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Candidate release ID: `43d03dc2f6332fe694f99f4101e82605d86a4b1dcd55ce0d9fe3fea72cb0c94e`  
Git HEAD: `7438872d9ac89762608f4b05ef213298eb4b1a50`  
Runtime: Node `v24.18.0`

## Verdict

**Not ready for bounded product release.** The exact civic-water negatives, including the hyphenated variant, are now suppressed, and the five specified farm-water, heat-unit, and soil routes pass. The municipal-supply false negative from r3 is also repaired. But the anchor gate admits explicit municipal drinking-water treatment requests when an incidental anchor such as `garden` or `field` appears. Those requests rank the agricultural owner first while matching only `water` and the incidental anchor. That conflicts with the entrypoint's explicit exclusion of municipal treatment and infrastructure design.

The anchor gate also has a known coverage cost: an in-scope query phrased with “vegetable crops” and “greenhouse” but none of the declared anchor tokens is suppressed. The README discloses that valid paraphrases can be missed and points users to the directory. I treat that as a non-blocking, documented limitation for this bounded cut; the incidental-anchor civic false positives are the blocker.

## Comparison boundary

I used the same Node runtime, current `searchCatalog`, current catalog, and identical query strings. To isolate the new field's effect, I compared the candidate catalog with an in-memory control that differed only by removing `queryAnchors` from `agricultural-observation-and-trial`. This control is not a separately built or installed release. It demonstrates the optional gate's observable effect without changing workspace files.

## Route results

### Seven civic / municipal / drinking-water negatives are excluded

The focused integration test and direct probes do not return the agricultural owner in the top 20 for these requests:

| Query | Result |
|---|---|
| `design a municipal drinking water treatment plant` | absent |
| `triage municipal drinking water quality from a laboratory report` | absent |
| `plan a public drinking water treatment system` | absent |
| `assess potable water quality for a city utility` | absent |
| `design a municipal drinking-water treatment plant` | absent |
| `design a city drinking water purification plant` | absent |
| `interpret a drinking water laboratory result for a city utility` | absent |

The hyphenated and city-purification queries show the anchor gate filtering civic requests that contain no listed farm/agriculture anchor. In the in-memory anchor-omitted control, both return the agricultural owner at rank 1, score `35.553`, matched on `water` only.

### Five specified farm routes and two nearby farm paraphrases pass

All five requested positives rank the agricultural owner first:

| Query | Rank | Score |
|---|---:|---:|
| `triage a farm water quality result from a supplied laboratory report` | 1 | 153.315 |
| `calculate growing degree days from supplied weather records` | 1 | 160.79 |
| `compare mapped soil survey data with site measurements for this field` | 1 | 162.368 |
| `triage farm irrigation water quality results from a municipal supply` | 1 | 176.645 |
| `assess farm crop irrigation water report from city utility; not drinking water` | 1 | 131.548 |

Two additional municipal/city-utility phrasings also rank first:

| Query | Rank | Score |
|---|---:|---:|
| `review irrigation laboratory results from a municipal utility for crops on this farm` | 1 | 104.096 |
| `evaluate farm irrigation water quality using a city utility report; not for drinking` | 1 | 113.581 |

### Blocking: incidental anchors re-enable civic treatment routes

Adding a contextual occurrence of one broad anchor to a civic request lets the agricultural skill through, even though the query is still asking to design or plan potable municipal infrastructure:

| Civic/infrastructure query | Agricultural rank | Score | Matched terms |
|---|---:|---:|---|
| `design a municipal drinking-water treatment plant for a school garden` | 1 | 60.441 | `garden, water` |
| `design a city drinking-water purification system for a field station` | 1 | 55.786 | `field, water` |
| `plan potable water treatment for a community garden` | 1 | 67.5 | `garden, plan, water` |

`searchCatalog` accepts a skill when any one anchor is present; a multiword anchor passes when all its tokens occur anywhere in the query. The anti-trigger check is still a literal normalized-substring test. Thus `garden` or `field` is enough to reopen a hyphenated civic query, and the generic `water` trigger then gives the skill a strong score. These cases are not covered by the focused test, which tests the civic queries without incidental agricultural anchor words.

### Anchor-omission risk

The nearby in-scope query `triage water quality results from a laboratory report for vegetable crops in a greenhouse` does not contain any current anchor token: the list has singular `crop`, but not `crops`, `vegetable`, or `greenhouse`. The candidate does not return the agricultural owner in the top 20. In the control with agricultural anchors omitted, it ranks first with score `118.943`, matched on `laboratory, quality, results, triage, water`.

This confirms the tradeoff rather than contradicting the README: anchors stop generic-water false positives when agricultural terms are absent, but any unlisted in-scope phrasing can become a false negative. The directory and Markdown entrypoint remain available. Separately, because anchors are optional, omitting them from a skill leaves its previous lexical behavior in force; in this catalog 67 of 68 entries have no anchors. The current agricultural metadata includes its anchors and is bound by the candidate manifest.

## Portability, validation, and manifest

- `queryAnchors` is an optional JSON array. The product validator checks a present value is a non-empty array of unique strings, each at most 100 characters and yielding at least one token. It preserves the field in the generated catalog; current validation passed.
- The candidate catalog retains the v1 catalog schema. All 68 entries validate: one entry has anchors and 67 omit them. This preserves existing metadata without requiring every skill to opt in.
- The feature uses the bundled offline search implementation and built-in JavaScript tokenization/normalization; no new package or machine-local path is introduced. The README still presents Markdown/`INDEX.md` as the baseline and Node 24+ search as optional. A native loader or third-party searcher that ignores `queryAnchors` will not enforce the gate; the portability claim is for using the bundled search behavior, not for every host's independent retriever.
- `node product/bin/godskills.mjs validate` returned `status: verified-content`, the requested release ID, and `skillCount: 68`. The release manifest's hashes for `README.md`, `lib/product.mjs`, `catalog.json`, and the agricultural `skill.json` match their current bytes.

## Test record and limits

- `node --test tests/universal-wave13-integration.test.mjs`: 5 tests passed, 0 failed. Its route assertions cover the seven civic negatives, two municipal-supply positives, and three original water/heat/soil positives. It also checks that the agricultural metadata includes the `irrigation` anchor, resource/content boundaries, and interatomic specialist-parent structure.
- `node product/bin/godskills.mjs validate`: passed for release `43d03dc2f6332fe694f99f4101e82605d86a4b1dcd55ce0d9fe3fea72cb0c94e`, 68 skills.
- Direct probes exposed the three incidental-anchor civic false positives and the one unlisted-anchor farm paraphrase described above.
- No implementation files were changed. No broad suite, installer, publication, external call, or agricultural/scientific workflow was run.

This verdict applies only to the bounded packaging and offline discovery contract checked here. It makes no claim about global semantic quality, general host behavior, or agronomic performance.
