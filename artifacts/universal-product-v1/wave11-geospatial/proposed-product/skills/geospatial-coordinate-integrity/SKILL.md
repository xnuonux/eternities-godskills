---
name: geospatial-coordinate-integrity
description: Repair and verify GIS coordinate operations by separating horizontal and vertical reference meaning, assignment, transformation, measurement units, geometry validity and spatial evidence.
---

# Geospatial coordinate integrity

Use when map layers fail to align, coordinates need transformation, spatial joins
look wrong, distance or area calculations may use the wrong units, or elevation
products must be compared. This is a coordinate-integrity method, not a licensed
survey, engineering design, terrain model, ecological inference, or complete
remote-sensing workflow. A purely visual map-style change does not need a
coordinate audit.

## Establish what the numbers mean

Inspect each layer separately: source and version, declared horizontal and
vertical reference, coordinate columns and axis order, angular or linear units,
height type, extent, geometry type, missing values, and relevant datum or epoch.
Preserve the original files. An attractive overlay or plausible coordinate range
is only a clue. Missing or contradictory metadata calls for source documentation,
control points or qualified review; do not label unknown coordinates as WGS84 or
unknown heights as orthometric merely to make a tool accept them.

Separate three operations:

- **Assign:** attach a verified interpretation to existing numbers. Coordinates
  do not move. Correct a wrong label only with evidence of the actual source CRS.
- **Transform:** compute new coordinates for the same physical locations using
  an explicit source, target and suitable coordinate operation.
- **Measure:** choose a method that preserves the needed quantity adequately
  over the actual region. Display and analysis projections need not match.
  Degree-valued axes are not metres; projected axes are not always metres.

CRS axis definitions and a library's input convention may differ. Make that
boundary explicit, then test an asymmetric known location so an accidental axis
swap cannot look valid. The [PROJ axis-order guidance](https://proj.org/en/stable/faq.html)
and [GeoPandas assignment/transformation distinction](https://geopandas.org/en/stable/docs/user_guide/projections.html)
illustrate why the library contract must be checked; neither library is required.

## Check vertical comparability

For elevation or height comparisons, bind the vertical CRS or datum, height type
(ellipsoidal, orthometric or local benchmark), unit, epoch where relevant, geoid
model and version, transformation pipeline, and accuracy information. A common
unit does not make two height systems comparable. Do not infer a datum from
elevation magnitude alone.

Before differencing surfaces, also establish surface meaning and support: point
cloud versus raster, bare-earth DTM versus surface DSM, cell size, nodata and
void handling, co-registration, acquisition time, and the error budget for the
intended change claim. Route a raw point-cloud classification problem or terrain
derivative question to its focused owner; this method owns coordinate and
vertical-reference comparability.

Write the resolved reference information into the output metadata or an attached
sidecar, including any fitted offsets and residuals. A datum explanation that
exists only in a response is lost when the file is handed on. If the vertical
reference remains unresolved, mark the product provisional and keep the missing
evidence beside the data. See [vertical and surface comparability](references/vertical-and-surface-comparability.md)
for the detailed comparison record.

## Choose and perform the smallest justified operation

1. State the output purpose, area of interest, acceptable positional error and
   required units. Inspect candidate operations for coverage, known accuracy and
   transformation resources. Preserve full CRS definitions where a shorthand
   would lose information.
2. Check required datum or geoid resources and the behavior when they are
   missing. A silent lower-accuracy fallback is not the requested operation.
   Obtain resources only through authorized means, choose an explicitly
   acceptable alternative, or report the operation unavailable.
3. Transform a small representative sample first: known controls, edge
   locations, poles or antimeridian crossings when relevant. Check finite
   coordinates and expected bounds. A round trip checks consistency, not
   absolute truth.
4. For vector data, account for geometry validity, topology and edge meaning
   across projection discontinuities. Record feature counts and stable
   identifiers; investigate dropped, empty or split geometries. Do not silently
   repair topology when it changes the analysis question.
5. For raster data, transformation also selects an output grid: extent,
   resolution, alignment, nodata and resampling. Preserve class labels with a
   category-appropriate method; continuous interpolation can invent classes.
   Matching CRS labels do not prove raster co-registration.
6. Reopen the saved output and check its actual metadata and coordinates. Before
   a join, overlay or elevation difference, reconcile coordinate, unit and
   vertical meaning across all participating inputs.

## Verify the result against its purpose

Use independent controls or a trusted reference within a stated tolerance, plus
boundary and invalid-input cases. Compare a hand-checkable distance, area,
height difference or relationship when it matters. Report actual residuals,
coverage limits, omitted features and unresolved source uncertainty. A map
screenshot alone cannot prove survey accuracy, co-registration, or a correct
spatial join.

Record source identities, source and target definitions, selected operation,
resource and software versions, output-grid choices, tolerances and output
identity. Keep this proportionate: one layer repair may need only a small sidecar
record.

Example: a table documented as longitude and latitude in degrees has lost its
CRS. Assign the documented source interpretation, confirm column order with a
known point, then transform before a metre-based local buffer. Two elevation
rasters in metres remain unresolved until their height types and vertical
operations are reconciled. If documentation is absent, the same-looking inputs
remain unknown rather than becoming asserted facts.

Deliver the requested repaired artifact or bounded analysis and its checks, or
identify the exact missing evidence that prevents a trustworthy operation.
