# Wave 11 geospatial and ecological refinement author report

## Result

This completed authoring slice accounts for all 29 exact leads in
`geospatial-analysis` and `ecological-environmental-analysis`, verifies their
warehouse identities before source reading, and stages a bounded product overlay
without modifying `product/`.

The work proposes one owner extension and three focused methods:

- **Changed owner:** `geospatial-coordinate-integrity` now owns the missing
  vertical-reference and surface-comparability contract: height type, vertical
  datum, geoid version, transformation, co-registration and output metadata.
- **New:** `terrain-watershed-analysis` owns elevation-surface choice, terrain
  derivatives, hydrologic conditioning, stream thresholds, outlet snapping,
  catchments and viewshed assumptions.
- **New:** `landscape-connectivity-analysis` owns patch, resistance, graph,
  movement-threshold, corridor and patch-importance sensitivity.
- **New:** `ecological-sampling-and-detection-uncertainty` owns observation
  semantics, event and effort rules, repeated visits, imperfect detection and
  uncertainty at the reporting support.

This boundary intentionally differs from the gap audit's suggestion to put
terrain and connectivity under coordinate integrity. Those mechanisms have
different inputs, outputs, failure modes and proof obligations. Keeping them
focused prevents a broad environmental skill while leaving coordinate integrity
coherent.

## Source accounting

All 29 source bodies were available and read in full at the entrypoint level.
There were no unavailable or conflicting source identities in this slice.

| Disposition | Count | IDs |
| --- | ---: | --- |
| Prior evidence linked | 2 | `r0003`, `r0028` |
| Pattern reference, independent new method | 4 | `r0139`, `r0196`, `r0291`, `r0387` |
| Pattern reference, independent owner extension | 5 | `r0001`, `r0122`, `r0187`, `r0188`, `r0351` |
| Covered by existing owner | 2 | `r0134`, `r0210` |
| Deferred to a separate substantive owner | 3 | `r0029`, `r0184`, `r0265` |
| Deferred as platform-specific | 1 | `r0327` |
| Rejected platform adapter | 4 | `r0017`, `r0104`, `r0240`, `r0303` |
| Rejected as insufficient mechanism | 8 | `r0055`, `r0069`, `r0094`, `r0099`, `r0120`, `r0183`, `r0333`, `r0355` |

`r0003` and `r0028` were already recorded in
`product/skills/geospatial-coordinate-integrity/skill.json`. Wave11 links those
rows to the existing provenance and treats the full re-read as identity and
boundary re-verification, not new discovery.

The eight Eli-yu SkillsHub bodies are shallow launchers: generic model and
parameter metadata, one capability sentence and a wrapper command. They do not
establish the advertised route planning, neighborhood analysis, fashion advice,
site selection, renewable planning, carbon accounting, waste planning or climate
risk mechanisms. Their frontmatter says MIT while the intake records no license
hint; repository licensing remains unresolved.

The ArcGIS and PostGIS bodies contain real workflows, but their contracts depend
on licensed or named execution backends. They are adapter or deferred-platform
material, not portable product methods. The GeoAI orchestrator was rejected as a
wrapper and mandatory routing layer.

## Retained mechanisms

The product text independently retains only portable operations supported by
the reviewed bodies:

- assignment versus transformation, explicit coordinate operation and unit
  checks;
- vertical datum, ellipsoidal versus orthometric height, geoid version,
  transformation, co-registration and vertical error budget;
- DTM versus DSM versus CHM meaning and density-supported resolution;
- nodata and void handling, conditioning order, real sinks versus artifacts,
  flow-algorithm fit, stream-threshold sensitivity and pour-point snapping;
- patch definitions, resistance provenance, graph semantics, dispersal-distance
  sensitivity, patch-area confounding and proxy interpretation limits;
- raw preservation, stable observation identifiers, event independence,
  realized effort, 1/0/NA detection semantics, closure and imperfect detection;
- reporting-support uncertainty, temporal error correlation, detectability and
  between-model disagreement.

Rejected payloads include upstream code blocks, named tool stacks, wrapper
commands, tool-specific parameters, universal numeric thresholds, fixed sample
rules, model-package workflows, named cloud or routing services, carbon-credit
rules, ecosystem-service valuation, prescribed conservation action and
professional outcome claims.

## Proposed product files

All are beneath
`artifacts/universal-product-v1/wave11-geospatial/proposed-product/` with the
final product-relative layout:

- `skills/geospatial-coordinate-integrity/SKILL.md`
- `skills/geospatial-coordinate-integrity/skill.json`
- `skills/geospatial-coordinate-integrity/references/vertical-and-surface-comparability.md`
- `skills/terrain-watershed-analysis/SKILL.md`
- `skills/terrain-watershed-analysis/skill.json`
- `skills/terrain-watershed-analysis/references/terrain-operations.md`
- `skills/landscape-connectivity-analysis/SKILL.md`
- `skills/landscape-connectivity-analysis/skill.json`
- `skills/landscape-connectivity-analysis/references/connectivity-operations.md`
- `skills/ecological-sampling-and-detection-uncertainty/SKILL.md`
- `skills/ecological-sampling-and-detection-uncertainty/skill.json`
- `skills/ecological-sampling-and-detection-uncertainty/references/sampling-and-detection-records.md`

Supporting evidence and review artifacts:

- `behavioral-review-cases.json`
- `source-dispositions.json`
- `source-integrity.json`
- `build-source-integrity.mjs`
- `validate-staged.mjs`
- `author-report.md`

## Behavioral review

`behavioral-review-cases.json` was authored before the product files. It contains
positive, paraphrase, negative, boundary, failure-mode and discovery cases. The
discovery cases use characteristic useful operations such as pour-point
snapping, resistance sensitivity, detection histories with surveyed zeros and
geoid version metadata rather than common words or exact source wording.

The cases are static review fixtures. They do not establish route-test or agent
behavior; those checks remain parent-owned.

## Maturity and validation limits

All staged product metadata uses `maturity: draft`. The content is structurally
validated and source-accounted but has not passed product build, catalog route
tests, actual agent exercises, clean-room installation or independent review.
The parent may raise maturity only after those checks.

No classification or disposition here is synthesis authority, safety proof,
runtime qualification, professional certification or legal clearance. The
environmental methods provide contracts, evidence tables and rejection gates;
they do not prescribe field treatment, certify ecological status, approve carbon
credits, design infrastructure or make conservation and regulatory decisions.

## Checks and outcomes

Commands were run from the supplied workspace with no network calls:

1. Exact identity pass over the 29 declared locators recomputed raw SHA-256,
   `git hash-object`, `git rev-parse COMMIT:PATH`, and warehouse HEAD using a
   command-local `safe.directory` override only. Outcome: **29/29 raw hashes,
   29/29 Git blobs, 29/29 pinned commits matched**.
2. `node artifacts/universal-product-v1/wave11-geospatial/build-source-integrity.mjs`
   generated `source-integrity.json`. Outcome: **29 total, 29 SHA-256 matched,
   29 blob matched, 29 commit matched, 29 full entrypoints reviewed**.
3. Pinned packet comparison checked `id`, `bodySha256`, `sourceId`, `name`,
   `category`, `gapLabel` and `description` for every lead against
   `family-plan.jsonl`. Outcome: **29/29 field sets matched**. The packet omits
   the family-plan disposition fields by schema, so full-object equality is not
   claimed.
4. `node artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs`
   validates JSON parsing, exact 29-lead coverage, summary arithmetic, integrity
   flags, skill IDs and relationships, resource links, Markdown relative links
   against the staged overlay or current product, and absence of workstation
   paths in proposed product text. Final outcome: **64 passed, 0 failed**.
5. The first validator run reported 45 passed and 19 failed because the validator
   indexed `product/` instead of `product/skills/` and mishandled Windows path
   basename extraction. The validator was repaired; no product text was changed
   to obtain the pass.

The product build and entire suite were intentionally not run. No route tests,
agent exercises, installation, publication, deployment or release manifest
change were performed.

## Source-read and metadata boundaries

- **Source-read:** all 29 exact SKILL.md entrypoints, after raw SHA-256, Git blob,
  pinned commit and current HEAD verification.
- **Prior evidence:** `r0003` and `r0028`, linked to the existing coordinate
  integrity provenance rather than counted as fresh discovery.
- **Metadata-only:** family assignment, intake descriptions, gap labels,
  family-plan dispositions, license hints and packet organization. `r0210`
  contains an obviously stale `finance` / `contractor tax reporting` category
  and gap label; the body review establishes its geospatial content without
  rewriting historical metadata.
- **Not read:** upstream linked scripts, model weights, service registries,
  vendor documentation and most linked reference guides. They were unnecessary
  for the retained neutral mechanisms and remain outside review coverage.
- **Not executed:** upstream source code, tool commands or instructions.

License hints and body claims are observations only. License texts were not
reviewed in this slice. MIT, GPL-3.0 and unknown labels do not establish
compatibility, redistribution rights or independent-authorship clearance.

## Unresolved gaps and next action

- The parent should review whether `landscape-connectivity-analysis` and
  `ecological-sampling-and-detection-uncertainty` should remain separate IDs or
  be folded into other owners after route tests. The current separation reflects
  the observed contracts.
- Network accessibility, materials LCA and ecosystem-services assessment need
  separate substantive owners. They were not forced into this environmental
  slice.
- Spatial SQL, ArcGIS automation and raw point-cloud work remain adapter or
  specialist gaps. Portable prose cannot remove their runtime, licensing or data
  dependencies.
- Linked source references, repository license texts, source safety and semantic
  equivalence remain unreviewed.
- Professional environmental, ecological, surveying, engineering, carbon-market
  and regulatory conclusions remain outside the product's authority.

Next concrete action: apply this overlay in parent-owned integration, run
`node product/bin/godskills.mjs validate`, discovery and negative-route tests,
the existing universal product tests, actual agent exercises on the staged
behavioral cases, and clean-room install/rollback verification. Preserve this
wave directory as the versioned authoring and source-accounting receipt.
