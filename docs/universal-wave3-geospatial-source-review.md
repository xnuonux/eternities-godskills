# Universal wave 3: geospatial coordinate integrity source review

**Lane:** geospatial coordinate integrity
**Scope:** bounded body review of four inert quarry records for a universal
Godskills method. No corpus tool, script, installer, web call, product edit,
catalog edit, test edit, manifest edit, or other task-file mutation was
performed.

## Disposition

**A dedicated method adds actionable value, but only as a narrow geospatial
coordinate-integrity and spatial-leakage preflight.** The selected sources add
concrete rules that are not present together in the product skills: assignment
versus reprojection, task-appropriate units/CRS, coordinate/axis warning
signals, and spatially grouped evaluation. The method should extend the
general evidence/provenance discipline in
product/skills/eternities-atlas/SKILL.md and reuse the gate-and-quarantine
shape of product/skills/genomic-coordinate-assembly-and-variant-gates/SKILL.md;
it should not become a GIS project compiler, ArcPy runner, library catalog, or
genomic variant normalizer.

## Evidence and exact source verification

The records were resolved by exact repository/path lookup in
data/quarry-intake-2026-09-21-exa/sources.jsonl. For each record, the recorded
byte count and bodySha256 matched the bytes at destination + path before the
body was used. The index labels all four records reviewStatus=cold-unreviewed,
activation=none, and sourceKind=exa-jev-proposal. A license hint is intake
metadata only; it is not an endorsement or licensing clearance.

| Exact sourceId | Destination + path | Bytes: record / observed | bodySha256 (record = observed) | License hint |
|---|---|---:|---|---|
| porom004/geoskills@dc4cac53ee2f595cabbc094f7623a8efbd9fb810:skills/crs-and-reprojection/SKILL.md | D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\porom004__geoskills\skills\crs-and-reprojection\SKILL.md | 2247 / 2247 | 019f939b1acc3026f600325f9b04a07eba578b6ba9afd5e90a559335806adbdf | MIT (MIT License) |
| porom004/geoskills@dc4cac53ee2f595cabbc094f7623a8efbd9fb810:skills/geospatial-ml/SKILL.md | D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\porom004__geoskills\skills\geospatial-ml\SKILL.md | 7712 / 7712 | 0717ca42bb8fa0e81cef5608e1dbe42c5710bc7c87e5a217d64deb4cfbbf297e | MIT (MIT License) |
| jaakla/openmapstack-skills@534792f438a4d263e3ef4105e7a53b63baa330d5:skills/reproducible-gis-project/SKILL.md | D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\jaakla__openmapstack-skills\skills\reproducible-gis-project\SKILL.md | 3439 / 3439 | c663aa726faa74d075b6521766c876d9c062dad2929d2fa695e826e21eaa36c8 | MIT (MIT License) |
| danmaps/gis-agent-skills@47afe3a4b5ee40a940a4ed44b000ea63179cee50:skills/arcpy-plan/SKILL.md | D:\03-ARSENAL\warehouse\hunt\exa-skills-2026-09-20\danmaps__gis-agent-skills\skills\arcpy-plan\SKILL.md | 1589 / 1589 | 056cf6e85478252a73c3ccc7efaafdcef0da8ad4744575fc37f95fb251c18fea | null / no hint or name |

## Source-by-source assessment

### crs-and-reprojection

Useful concrete procedures:

- Establish whether the source CRS is known, missing, or wrong; record
  geographic versus projected status and implied units.
- Match the CRS decision to the operation: display, distance/area,
  engineering, regional, or global analysis.
- Treat missing metadata, wrong assignment, mixed layers, datum mismatch,
  suspicious coordinate magnitude, and suspicious axis order as failure
  signals.
- Keep assignment separate from reprojection: assign only when the existing
  numbers are already known to use the CRS; reproject only after the source is
  trustworthy; choose the target from the objective rather than habit.
- Validate with a known reference overlay, unit confirmation, extent checks,
  and feature alignment. Avoid Web Mercator for precision measurement work.

Questionable assumptions or limits:

- “Correct source CRS” is assumed to be knowable, but the body gives no
  evidence hierarchy, confidence field, or authority rule for resolving
  conflicting metadata.
- Axis order is named as a failure signal but there is no explicit convention
  or disambiguation procedure. Geometry validity, vertical/time-dependent
  reference systems, antimeridian/polar behavior, and repair policy are not
  covered.
- A local or regional projected CRS is a useful default for metric work, not a
  universal target rule; global, geodesic, three-dimensional, and temporal
  tasks need an explicit objective-specific decision.

What should be generalized:

- A small coordinate-binding record: source digest/provenance, declared CRS
  and revision, whether it is declared or inferred, axis convention, units,
  geometry dimensions, and task/precision requirement.
- A hard semantic distinction: assignment changes metadata only; reprojection
  changes coordinate values and must retain source/target metadata,
  transformation identity, and validation evidence.
- An unresolved-CRS disposition of stop or quarantine, rather than a guessed
  default.

Do not generalize the output template as a sufficient proof, or turn the
Web-Mercator warning into a universal ban.

### geospatial-ml

Useful concrete procedures:

- Define the prediction target and geometry/label type before constructing
  features; keep a stable geometry ID when assembling the feature matrix.
- Compute distance, area, density, morphometric, and graph-distance features
  in an appropriate metric CRS; check infinity, extreme values, and CRS-
  dependent features.
- Treat spatial autocorrelation as a leakage risk. Candidate controls include
  geographic block folds, buffered leave-one-out, or tile-based folds; compare
  row-random and spatial metrics as a diagnostic and map residuals for spatial
  bias.
- Avoid raw coordinates as unexamined model features, mixing CRS across joins,
  angular graph distances, and treating raster nodata as a valid value. For
  raster output, retain matching transform and CRS.

Questionable assumptions or limits:

- The library table and examples assume an ML workload and a Python/geospatial
  stack; they are not a neutral prerequisite for coordinate integrity.
- Moran’s I significance, block size, buffer distance, H3/tile choice, and the
  comparison metric require a declared spatial scale and evaluation objective.
  A random-versus-spatial score gap is evidence of a risk, not a proof that
  leakage is absent or present in every case.
- “Never” use a shuffled random split is appropriate as a warning for
  autocorrelated geometry, but the method needs a stated dependency structure,
  holdout unit, and exception rationale rather than a library-independent
  absolute.
- Raw coordinates can be a deliberate feature in some tasks; the universal
  rule should require justification and leakage review, not ban them.

What should be generalized:

- Make spatial leakage a conditional branch for predictive workflows: declare
  the spatial unit/scale, split groups by location or buffered neighborhood,
  preserve the fold rule, and retain the evaluation evidence.
- Require stable geometry identity and an explicit CRS/scale for derived
  features. Keep the original geometry and transformed feature metadata
  traceable.
- Generalize the failure patterns, not the specific package list, model
  examples, H3 defaults, or metric thresholds.

### reproducible-gis-project

Useful concrete procedures:

- Bind the objective, authoritative inputs, semantic filters, metric CRS,
  algorithm, outputs, and unresolved assumptions before changing a project.
- Pin immutable sources; represent corrections and scenarios separately with
  provenance; verify the correction target and prior value; never overwrite a
  source merely to make validation pass.
- Use one canonical ordered executable pipeline and derive presentations from
  it rather than maintaining independent logic.
- Execute checks, retain machine-readable run evidence, perform a clean
  rerun, and make missing tools or unknown semantics visible. Deliver runtime
  instructions and substantive limitations with the project.

Questionable assumptions or limits:

- The body defers mandatory details to unreviewed references and examples, so
  this body alone cannot establish the referenced project contract.
- It assumes a project-delivery context and an executable runtime. It does not
  say how to assign versus reproject, resolve axis conventions, check geometry
  validity, or control spatial leakage.
- “Metric CRS” is useful for many operations but is not a complete CRS choice
  for angular, geodesic, global, or non-metric workflows.

What should be generalized:

- A coordinate-operation receipt with immutable input/output digests,
  transformation identity, ordered checks, clean-rerun evidence, and visible
  unresolved assumptions.
- The rule that planned validation is not executed validation.

Do not generalize the project scaffolding, QGIS/web presentation obligations,
or an assumption that a particular stack is installed.

### arcpy-plan

Useful concrete procedures:

- Plan before code and ground the plan in actual project context rather than
  invented layer, field, or connection names.
- Return explicit inputs, ordered steps, outputs, preflight checks/counts,
  and risks. Validate layer existence before selection/buffer/export and flag
  destructive operations or performance concerns.
- Keep uncertainty visible instead of inventing data, credentials, or system
  context.

Questionable assumptions or limits:

- The workflow is ArcGIS Pro/ArcPy-specific and assumes an arcgispro-cli or
  equivalent live context may be available; it is not a universal geospatial
  procedure.
- The “500 ft” example has no CRS, axis, or distance semantics. The body has
  no coordinate assignment/reprojection rule, geometry-validity rule,
  provenance/digest receipt, or spatial-leakage control.
- The source metadata has no license hint or name; no licensing conclusion is
  possible from this intake record.

What should be generalized:

- Context-grounded planning and a preflight plan object with inputs, ordered
  operations, outputs, checks, and risks.
- Require units and coordinate semantics for any distance/buffer operation.

Do not generalize ArcGIS tool names, CLI availability, or the example’s unit as
defaults. The source body was reviewed only; no ArcGIS command was run.

## Overlap and missing coverage

The product inventory contains 57 SKILL.md files. No standalone general
GIS/CRS product entrypoint was found by the product-surface name/term scan.
The required local skills are adjacent coverage, not substitutes:

| Concern | Existing product overlap | What the reviewed sources add | Remaining boundary |
|---|---|---|---|
| Scope, evidence, keys, nulls, uncertainty | Atlas binds scope and reconciles observed/derived/unknown values | GIS project adds immutable source pinning, canonical pipeline, clean rerun | Keep this general; do not duplicate a project compiler |
| Assignment versus reprojection | Genomic skill has traceable transformations, but for assemblies/alleles | CRS source states the metadata-only versus numeric-transform distinction directly | Require source trust and transform provenance; do not auto-select a CRS |
| Axis convention | Genomic skill records coordinate base/interval/orientation; CRS source only flags suspicious axis order | A geospatial record can require an explicit x/y or lon/lat convention | No universal axis disambiguation is supported; unresolved means unknown/stop |
| Units | Atlas and the sources require visible units; geospatial ML requires metric CRS for metric features | CRS/task matching makes the units decision operational | Preserve angular versus linear meaning; do not assume a local projected CRS fits every task |
| Geometry/coordinate validity | Genomic gates support bounds, reference agreement, rejection, and quarantine for genomic records | ArcPy plan expects preflight checks but does not define geometry validity | The selected GIS bodies do not justify a universal repair algorithm; check or record unknown |
| Spatial leakage | Atlas names leakage as an analytics concern but gives no spatial fold method | Geospatial ML supplies block/buffer/tile evaluation patterns and stable-geometry guidance | Conditional ML branch only; fold choice and scale remain task-specific |
| Vendor/runtime planning | Atlas keeps provider syntax secondary; no ArcGIS-specific route | ArcPy plan supplies context-grounded plan/check/risk structure | Keep vendor details optional and never treat tool availability as evidence |

## Proposed neutral procedure (not yet added to product)

**Name:** Geospatial coordinate integrity and spatial-leakage preflight.

**Inputs and receipt fields:** immutable source identifier/digest; geometry type;
declared CRS identifier/WKT and revision; declared axis convention; coordinate
and vertical units when present; geometry dimensions; provenance and whether
each value is declared, inferred, or unknown; task, spatial scale, precision,
and intended operations; target CRS and transformation identity if needed;
stable geometry ID; for predictive work, spatial grouping/fold definition.

1. **Bind the source.** Preserve the raw geometry. Record the coordinate
   semantics, CRS, axis convention, units, source provenance, and task. Do not
   infer a CRS from familiar coordinate ranges or silently default a missing
   value.
2. **Choose assignment or reprojection.** Assign only when the existing
   numeric coordinates are already known to use the declared CRS; assignment
   changes metadata, not numbers. Reproject only from a trusted source CRS,
   with a named target and transformation revision; retain before/after
   metadata and digests.
3. **Run semantic preflight.** Check finite coordinates, declared bounds or
   extent, axis interpretation, units, cross-layer CRS consistency, and a
   known-reference alignment check where one is available. Run a declared
   geometry-validity check when the chosen stack supports one; if it cannot be
   checked, record unknown rather than claiming validity or silently repairing
   geometry.
4. **Perform coordinate-dependent work.** Use a CRS and measurement model
   suited to the operation. Make angular/geodesic versus linear/projected
   behavior explicit. Compute distance/area/density only with declared units;
   join or overlay layers only after their spatial references are reconciled.
   Preserve stable IDs through transformations and feature derivation.
5. **Add the leakage gate when prediction is involved.** Declare the spatial
   unit and scale. Prevent the same location or an excluded neighborhood from
   crossing train/evaluation folds using a justified block, tile, group, or
   buffer rule. Record the fold construction and compare against a row-random
   diagnostic only as evidence about sensitivity, not as a certification.
6. **Emit the receipt.** Record retained, rejected, quarantined, and
   unassessed counts; source/target CRS and units; axis convention;
   transformation digest; validity status; feature/geometry ID checks; fold
   definition where applicable; check results; and remaining uncertainty. A
   clean rerun is evidence of reproducibility, not evidence that the source is
   authoritative or fit for every purpose.

### Failure cases and dispositions

| Failure | Disposition |
|---|---|
| Missing, contradictory, or only guessed source CRS | Stop or quarantine before metric, overlay, or model work; resolve the source context |
| CRS assignment used to “fix” coordinates, or reprojection from an untrusted source | Reject the operation; preserve the original and require a declared transform path |
| Axis order or units cannot be established | Mark unknown and stop coordinate-dependent work; do not choose by magnitude alone |
| Mixed CRS/datum or unaligned layers | Stop before join/overlay/measurement and reconcile references |
| Nonfinite, out-of-bound, or unsupported/unknown-validity geometry | Reject or quarantine with a reason; only repair under a declared, auditable rule |
| Stable geometry IDs are missing, duplicated, or drift across a transform | Stop joins/feature assembly and repair identity/provenance first |
| Random row split lets nearby or repeated locations cross predictive folds | Treat evaluation as leakage-prone; rerun with a declared spatial grouping/block/buffer rule |
| Target CRS, transformation, measurement unit, or fold rule is unstated | Return inconclusive with the missing decision; do not present a planned check as performed evidence |

This procedure preserves the strongest supported value from the source bodies
while keeping axis resolution, geometry repair, CRS selection, and spatial
fold design as explicit decisions rather than hidden defaults. It is a
proposal for the next product owner, not an implementation or certification.
