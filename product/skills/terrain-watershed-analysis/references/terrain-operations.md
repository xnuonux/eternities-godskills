# Terrain operations and checks

## Surface gate

Record source, acquisition date, DTM/DSM/CHM meaning, horizontal and vertical reference, height type, cell size, alignment, nodata, voids, fill history, coverage and stable input digest. Reject or qualify a surface whose meaning, units or effective resolution cannot support the requested derivative.

For a comparison across rasters, require matching or explicitly transformed grids and a documented resampling method. Preserve categorical surfaces with categorical semantics. Report where no-data gaps make derivatives undefined.

## Derivative checks

- State slope units and convention; degrees and percent are not interchangeable.
- Treat aspect as circular and flat cells as undefined rather than zero.
- State curvature sign convention and the difference between plan and profile curvature.
- Report the radius or neighborhood for ruggedness, position and local relief measures.
- Inspect minima, maxima, quantiles and maps for unit errors, nodata contamination, edge effects and resolution artifacts.

## Hydrologic checks

Record the conditioning sequence and whether depressions were breached, filled or retained. Check engineered barriers, real closed basins, flat areas and raster edges. Compare discrete and divergent flow choices only when the scientific question supports both.

Stream extraction must expose the accumulation threshold and at least one sensitivity alternative. Catchment delineation must expose supplied outlet, snapped outlet, snap radius, displacement, outlet accumulation and resulting area. A very small catchment after a large outlet displacement is a reason to re-check the network and resolution, not automatically a result.

## Visibility checks

Record DTM or DSM choice, optional feature heights, observer coordinates and height, target height, vertical exaggeration if any, curvature and refraction settings, radius and output semantics. Compare at least one known-visible and one known-blocked location when independent evidence exists.

## Failure signatures

- Implausibly steep broad slopes from mixed horizontal and vertical units.
- Negative or nonsensical accumulation from nodata interpreted as deep elevation.
- Rivers over canopy or buildings because a DSM was used as bare earth.
- Phantom lakes after filling road embankments or other real barriers.
- One-cell or fragmented catchments from unsnapped outlets.
- Arithmetic aspect summaries that reverse north-facing slopes.
- One stream threshold presented as the uniquely real drainage network.
- A viewshed that ignores trees, buildings, observer height or earth curvature.

## Evidence packet

Keep the input identity, working-surface edits, parameter record, sensitivity table, outlet ledger, verification locations and observations, output identity and explicit unresolved limits. Distinguish a visual QA observation from an independent quantitative control.
