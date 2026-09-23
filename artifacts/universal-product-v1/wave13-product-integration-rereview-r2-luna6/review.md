# Wave 13 product integration independent focused rereview

Review date: 2026-09-23 12:48 UTC  
Workspace: `C:/dev/eternities-godskills/.worktrees/universal-product-v1`  
Candidate release ID: `da91d43418b094cbc358352d270db510a71bf4c82c6021aa51ac6e66a8ca1620`  
Git HEAD: `7438872d9ac89762608f4b05ef213298eb4b1a50`; candidate files are in the working tree and this review binds to the validated release ID and current file bytes.

## Verdict

**Not ready for focused product integration acceptance.** The earlier municipal-treatment false-positive routes are corrected for the four checked negative queries, and farm-water, heat-unit, and mapped-soil searches all discover the agricultural owner first. However, the new broad `municipal` anti-trigger also suppresses a legitimate farm-irrigation water-quality query when the farm's source is municipal. This is an in-scope false negative in the discovery route and remains a blocker for this focused acceptance.

This is an independent check of the current candidate. The prior review was used to identify the municipal false-positive cases to retest; conclusions below come from current files, current offline search behavior, and the focused test run.

## Focused findings

### Blocking: municipal anti-trigger hides an in-scope farm-water request

`product/skills/agricultural-observation-and-trial/skill.json` declares the single-word anti-trigger `municipal`. The catalog search implementation skips an owner whenever the normalized query contains any anti-trigger (`product/lib/product.mjs:155`). As a result, this query returns no agricultural owner among the top 20:

| Query | Agricultural result |
|---|---|
| `triage farm irrigation water quality results from a municipal supply` | absent |
| `assess farm crop irrigation water report from city utility; not drinking water` | absent |

The first request is explicitly about irrigation and farm water quality, matching the owner's declared trigger and the reference's farm-decision scope. The entrypoint excludes municipal water-treatment workflows and civic/public-health requests; it does not exclude crop decisions merely because a farm's supply comes from a municipality. The second query also demonstrates the exact-phrase anti-trigger limitation: mentioning “city utility” or “drinking water” as context, including a negated phrase, suppresses the owner without interpreting the surrounding farm intent. The product README documents that anti-triggers are literal normalized-phrase suppressors, not semantic negation (`product/README.md:42-44`).

Keep the explicit municipal/public/drinking-water treatment negatives green while narrowing the broad suppressors or otherwise preserving a clearly farm-scoped query. Add a regression for a farm using municipal supply before treating the route as accepted.

### Resolved for the prior review's explicit negative cases

All four focused negative queries in `tests/universal-wave13-integration.test.mjs` exclude `agricultural-observation-and-trial` from the top 20: municipal treatment-plant design, municipal drinking-water lab triage, public drinking-water system planning, and potable-water assessment for a city utility. This corrects the false-positive behavior described in the prior review for those cases.

### Positive farm, heat, and soil routes pass

Offline catalog search ranks `agricultural-observation-and-trial` first for each requested positive path:

| Query | Rank | Score |
|---|---:|---:|
| `triage a farm water quality result from a supplied laboratory report` | 1 | 153.315 |
| `calculate growing degree days from supplied weather records` | 1 | 160.79 |
| `compare mapped soil survey data with site measurements for this field` | 1 | 162.368 |

These discovery responses report `authority: none` and `activation: none`. The positive checks establish the listed lexical routes only; they do not establish general semantic retrieval quality.

### Content boundary is present and consistent

The agricultural entrypoint says this is not a municipal, potable, public, or drinking-water treatment workflow and limits farm-water evidence triage to crop and soil decisions. The integrated reference links from the entrypoint and states that it adds evidence triage, not treatment or infrastructure authority. The reference keeps mapped values separate from field samples, labels heat-unit/model estimates separately from observed stages, and asks for water source, intended use, date, method, units, and supplied interpretation. It rejects hazard diagnosis from one value and guaranteed agronomic outcomes, and it does not invent water-quality thresholds or treatment instructions.

The focused integration test asserts the reference resource link, the mapped-soil and modeled-stage content, water-quality section, one-value hazard limit, guarantee limit, provenance shape, and absence of draft-only wording.

### Catalog and release manifest agree

`node product/bin/godskills.mjs validate` returned `status: verified-content`, the requested release ID, and `skillCount: 68`. The catalog also contains 68 skills. For the agricultural entrypoint and integrated reference, catalog digests, release-manifest digests, and current file SHA-256 values match. The reference is declared in `skill.json` and registered as a catalog resource.

## Verification record and limits

- `node --test tests/universal-wave13-integration.test.mjs`: 4 tests passed, 0 failed. This includes the content/resource checks, four negative municipal/public-water cases, three positive farm/heat/soil cases, and the structural interatomic specialist-parent assertions.
- `node product/bin/godskills.mjs validate`: passed for release `da91d43418b094cbc358352d270db510a71bf4c82c6021aa51ac6e66a8ca1620`, 68 skills.
- Additional direct offline search probes confirmed the stated ranks and exposed the municipal-source farm false negative.
- No implementation files were changed by this review. No broad suite, installer, publication, external call, upstream-source review, or agronomic/scientific workflow was run.

This is a focused product-discovery and packaging review. It makes no claim about agronomic performance, scientific validity, or completion of the wider corpus.
