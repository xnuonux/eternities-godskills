# Vertical and surface comparability record

Use this record when a result subtracts, thresholds, merges or otherwise compares heights or elevation surfaces.

## Reference identity

- Horizontal CRS, axis order and coordinate operation.
- Vertical CRS or local datum, height type and unit.
- Epoch or realization when movement or dynamic datums matter.
- Geoid or quasi-geoid model and version.
- Transformation pipeline or operation identifier and required resources.
- Declared and observed accuracy, control coverage and residual statistics.

## Surface identity

- Point cloud, contour, TIN, DTM, DSM, CHM or another derived surface.
- Acquisition date, sensor or method, source version and immutable input identifier.
- Horizontal and vertical resolution, support, nodata code, voids and fill policy.
- Class or return selection used to create the surface.
- Resampling, interpolation, alignment, edge handling and co-registration method.

## Comparison contract

State the quantity being compared and its tolerance before transforming or differencing. Record the combined uncertainty budget from source accuracy, vertical transformation, co-registration, resolution and processing choices. Check a constant offset before interpreting local change; it can indicate a datum or geoid mismatch.

For change claims, preserve both inputs and the exact comparison grid. Report areas that are not comparable because of coverage, temporal, vegetation, water, saturation, void, or error-budget limits. A fitted offset is an estimate: record its control basis, residuals and whether it is acceptable for the intended use.

## Output metadata minimum

Write the horizontal and vertical reference, height type, unit, geoid model and version, applied operation, source identifiers, surface type and resolution, fitted offsets and residuals into the output or an attached machine-readable sidecar. Mark unresolved fields explicitly. Never replace them with an assumed default.

## Characteristic failures

- Subtracting ellipsoidal and orthometric heights because both are labelled metres.
- Calling a canopy or building surface a bare-earth model.
- Creating detail finer than source density or resolution supports.
- Losing the georeference while processing arrays and writing a default grid.
- Treating a round trip as absolute positional or vertical validation.
- Reporting a constant acquisition offset as environmental change.
- Dropping datum and geoid metadata from the delivered file after resolving it in analysis.
