---
name: geospatial-coordinate-integrity
description: Repair and verify GIS coordinate operations by separating CRS identification, assignment, transformation, measurement units, geometry validity and spatial evidence.
---

# Geospatial coordinate integrity

Use when map layers fail to align, coordinates need transformation, spatial joins
look wrong, or distance/area calculations may use the wrong units. This is a
coordinate-integrity method, not a substitute for a licensed survey, engineering
design, or a complete remote-sensing/modeling workflow. A purely visual map-style
change does not need a coordinate audit.

## Establish what the numbers mean

Inspect each layer separately: source and version, declared CRS, coordinate
columns and axis order, angular or linear units, extent, geometry type, missing
values, and relevant horizontal/vertical datum or epoch. Preserve the original
files. An attractive overlay or plausible coordinate range is only a clue, not
proof of a CRS. Missing or contradictory metadata calls for source documentation,
control points or qualified review; do not label unknown coordinates as WGS84 to
make a tool accept them.

Separate three operations:

- **Assign:** attach a verified interpretation to existing numbers. Coordinates
  do not move. Correct a wrong label only with evidence of the actual source CRS.
- **Transform:** compute new coordinates for the same physical locations using
  an explicit source, target and suitable coordinate operation.
- **Measure:** choose a method that preserves the needed quantity adequately
  over the actual region. Display projection and analysis projection need not
  match. Degree-valued axes are not metres; projected axes are not always metres
  either. Check units and distortion rather than picking a familiar code.

CRS axis definitions and a library's input convention may differ. Make that
boundary explicit, then test an asymmetric known location so an accidental axis
swap cannot look valid. The [PROJ axis-order guidance](https://proj.org/en/stable/faq.html)
and [GeoPandas assignment/transformation distinction](https://geopandas.org/en/stable/docs/user_guide/projections.html)
illustrate why the library contract must be checked; neither library is required.

## Choose and perform the smallest justified operation

1. State the output purpose, area of interest, acceptable positional error and
   required units. Inspect candidate operations for coverage, known accuracy and
   available transformation resources. Preserve full CRS definitions where a
   shorthand would lose information.
2. Check required datum grids and the behavior when they are missing. An operation
   that silently falls back to a lower-accuracy approximation is not equivalent
   to the requested one. Obtain resources only through authorized means, choose
   an explicitly acceptable alternative, or report the operation unavailable.
3. Transform a small representative sample first: known controls, edge locations,
   poles or antimeridian crossings when relevant. Check finite coordinates and
   expected bounds. An inverse round trip checks consistency, not absolute truth;
   the same mistaken assumptions can cancel in both directions.
4. For vector data, account for geometry validity, topology and the meaning of
   edges across projection discontinuities. Record feature counts and stable
   identifiers; investigate dropped, empty or split geometries. Do not silently
   repair topology if it changes the analysis question. If validity cannot be
   checked, record that limit instead of reporting the geometry as validated.
5. For raster data, coordinate transformation also selects an output grid:
   extent, resolution, alignment, nodata and resampling. Preserve class labels
   with a category-appropriate method; interpolation suitable for continuous
   values can invent nonexistent classes. Do not infer raster co-registration
   merely because both files declare the same CRS.
6. Reopen the saved output and check its actual metadata and coordinates, not
   only the in-memory object. Before a join or overlay, reconcile coordinate
   meaning and measurement assumptions across all participating layers.

## Verify the result against its purpose

Use independent controls or a trusted reference within a stated tolerance, plus
boundary and invalid-input cases. Compare a hand-checkable distance/area or
relationship when it matters. Report actual residuals, coverage limits, omitted
features and unresolved source uncertainty. A map screenshot alone cannot prove
survey accuracy or a correct spatial join.

Record source identities, source/target definitions, selected operation, resource
and software versions, output-grid choices if any, tolerances and output identity.
Keep this proportionate: one layer repair may need only a small sidecar record.

Example: a table documented as longitude/latitude in degrees has lost its CRS.
Assign the documented source interpretation, confirm column order with a known
point, then transform before a metre-based local buffer. If that documentation
is absent, the same-looking table remains unresolved. Do not reinterpret its
numbers as projected metres or convert a guessed source into an asserted fact.

Deliver the requested repaired artifact or bounded analysis and its checks, or
identify the exact missing evidence that prevents a trustworthy transformation.
