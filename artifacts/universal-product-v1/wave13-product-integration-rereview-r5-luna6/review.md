# Wave 13 product integration independent focused r5 rereview

Review date: 2026-09-23 14:07 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Candidate release ID: `65af12738bf3c9804c74a9b8ebd53d9ed913990261571d8bc8e1321d04b000dd`  
Git HEAD: `7438872d9ac89762608f4b05ef213298eb4b1a50`  
Runtime: Node `v24.18.0`

## Verdict

**Not ready for bounded product release.** The exact r5 civic fixtures—including the three r4 incidental-anchor cases—are now excluded, and all prior core farm-water, municipal-supply, heat-unit, soil, vegetable, and greenhouse positives tested here rank the agricultural owner first. The candidate also validates as a coherent 68-skill package.

However, nearby explicit civic water-purification/infrastructure requests still rank the farm skill first when expressed as a “municipal water purification facility,” “potable-water purification works,” or city purification for a public park. These are top-ranked false positives driven by incidental garden/water/plan terms. Conversely, explicit farm-water evidence requests are suppressed if they mention a municipal water-treatment plant as the source, or include the civic phrase in a negated clause. That precision/coverage collision touches the exact boundary this focused integration is meant to establish. The included tests cover the corrected phrase fixtures but not these paraphrase and source/negation cases.

This verdict concerns only the checked bounded product routes and package. It makes no claim about general semantic routing, other host retrievers, agronomic quality, or performance.

## Review boundary and method

I read the current `product/lib/product.mjs`, agricultural `SKILL.md`, `skill.json` and `references/site-data-and-water-triage.md`, `product/README.md`, `product/catalog.json`, `product/release.json`, the focused Wave 13 integration test, and the r4 review. Direct queries used the checked-in `searchCatalog`, current catalog, Node `v24.18.0`, and top-20 result limit. No control build was created and no implementation or test source was edited.

The implementation normalizes a query and each anti-trigger to lowercase NFKC alphanumeric phrases, treating punctuation as separators, then checks for the padded phrase in the normalized query. This fixes the tested hyphen spelling and prevents partial-word substring matches. It remains an exact phrase veto: it does not establish what the phrase refers to or interpret negation. The optional `queryAnchors` gate admits a skill when any one declared anchor's token(s) appear in the query.

## Civic and municipal negatives

All ten civic queries now covered by the focused integration test were absent from agricultural results, including the three r4 incidental-anchor regressions:

- `design a municipal drinking water treatment plant`
- `triage municipal drinking water quality from a laboratory report`
- `plan a public drinking water treatment system`
- `assess potable water quality for a city utility`
- `design a municipal drinking-water treatment plant`
- `design a city drinking water purification plant`
- `interpret a drinking water laboratory result for a city utility`
- `design a municipal drinking-water treatment plant for a school garden`
- `design a city drinking-water purification system for a field station`
- `plan potable water treatment for a community garden`

Three nearby, still-explicit civic infrastructure formulations bypass the exclusions and rank the agricultural skill first:

| Query | Farm rank | Score | Matched terms |
|---|---:|---:|---|
| `design a municipal water purification facility for a school garden` | 1 | 60.441 | `garden, water` |
| `design potable-water purification works for a town garden` | 1 | 60.441 | `garden, water` |
| `plan city water purification for a public park garden` | 1 | 67.5 | `garden, plan, water` |

The first two requests are municipal/potable purification design despite not containing one of the exact excluded phrases such as `municipal water treatment`, `drinking water purification`, or `water purification system`. The public-park query also bypasses the listed phrases. These results show that the r4 regressions were repaired for their exact wording, not that the declared civic content boundary reliably survives nearby paraphrases with an incidental agricultural anchor.

## Farm-positive routes and nearby source/negation probes

All twelve farm-positive queries below ranked the agricultural owner first:

| Query | Rank | Score |
|---|---:|---:|
| `triage a farm water quality result from a supplied laboratory report` | 1 | 153.315 |
| `calculate growing degree days from supplied weather records` | 1 | 160.79 |
| `compare mapped soil survey data with site measurements for this field` | 1 | 162.368 |
| `triage farm irrigation water quality results from a municipal supply` | 1 | 176.645 |
| `assess farm crop irrigation water report from city utility; not drinking water` | 1 | 131.548 |
| `review irrigation laboratory results from a municipal utility for crops on this farm` | 1 | 104.096 |
| `evaluate farm irrigation water quality using a city utility report; not for drinking` | 1 | 113.581 |
| `triage water quality results from a laboratory report for vegetable crops in a greenhouse` | 1 | 118.943 |
| `evaluate farm irrigation water quality from a city utility report; not for drinking water` | 1 | 113.581 |
| `review crop water test results from the town water department for irrigation use` | 1 | 130.7 |
| `interpret orchard irrigation lab results from a village water utility` | 1 | 79.208 |
| `triage greenhouse irrigation water sample results supplied by the county water department` | 1 | 118.943 |

Three clear farm-evidence formulations were instead vetoed before scoring:

| Query | Result | Phrase overlap |
|---|---|---|
| `assess farm irrigation water quality from a municipal water treatment plant report` | agricultural owner absent | `municipal water treatment`; `water treatment plant` |
| `triage farm irrigation water quality; this is not a municipal drinking-water treatment request, only a crop-use lab report` | agricultural owner absent | `municipal drinking water` |
| `review crop irrigation sample results supplied by the municipal water treatment plant; assess only farm use, not treatment design` | agricultural owner absent | `municipal water treatment`; `water treatment plant` |

The query itself explicitly makes the farm crop/irrigation evidence the task; in two cases the treatment plant is only the supplied sample/report source, and in another the civic request phrase is negated. The README accurately says this is not general semantic negation, but these examples expose a material limitation for farm-water discovery: the same exact-phrase veto that excludes civic design can suppress a farm-use request when that phrase is source context or negated text.

## Content boundary, anchors, portability, and manifest

- The farm entrypoint explicitly excludes municipal, potable, public, or drinking-water treatment and directs civic water quality/public health/infrastructure requests to qualified current authorities. The reference confines farm-water triage to crop/soil decisions, says not to fetch or design infrastructure, and does not diagnose hazards from one value or promise agronomic outcomes. These content boundaries are present in the current release-bound files.
- The farm metadata declares 16 anchors, including `farm`, `agriculture`, `crop`/`crops`, `soil`, `irrigation`, `vegetable`/`vegetables`, and `greenhouse`. This closes the earlier vegetable/greenhouse omission. As documented, a new paraphrase can still miss if it includes none of these anchors.
- `queryAnchors` remains optional, and only this agricultural skill among the catalog's 68 entries currently uses it. The validator checks that a present value is a non-empty array of unique strings, each no longer than 100 characters and containing at least one tokenizer word. It does not validate anchor relevance or anti-trigger/anchor conflicts. The field is carried into the generated catalog. Optionality preserves older metadata and existing skills.
- The README keeps Markdown/`INDEX.md` as the baseline and Node 24+ offline search as optional. The gate is implemented in the bundled search path; an independent native host retriever may ignore catalog anchors. No third-party dependency was added. I did not test another host.
- `node product/bin/godskills.mjs validate` returned `status: verified-content`, release ID `65af12738bf3c9804c74a9b8ebd53d9ed913990261571d8bc8e1321d04b000dd`, and `skillCount: 68`. The release manifest contains 178 file entries; direct SHA-256 comparisons matched the current README, product search implementation, catalog, agricultural entrypoint, agricultural metadata, and water-triage reference.

## Focused test record and disposition

- `node --test tests/universal-wave13-integration.test.mjs`: 5 passed, 0 failed, 0 skipped. The test file covers the ten civic negatives, three municipal-supply/vegetable-greenhouse positives, three original farm-water/heat/soil positives, resource/content assertions, and specialist-parent linkage.
- Direct probes confirmed the tested civic and positive routes above and found the three civic paraphrase false positives and three farm source/negation false negatives.
- No broad suite, installer, publication, external call, or agronomic workflow was run. No implementation files were changed.

For a bounded release decision, the exact fixtures are not enough to accept while these nearby explicit civic infrastructure requests rank the agricultural owner first. The farm source/negation vetoes should also be an explicit acceptance decision for this water-routing slice. No general semantic quality or agronomic performance is inferred from these results.
