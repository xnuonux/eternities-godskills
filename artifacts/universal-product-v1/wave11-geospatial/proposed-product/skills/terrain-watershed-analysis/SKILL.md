---
name: terrain-watershed-analysis
description: Choose and verify elevation surfaces for terrain derivatives, hydrologic conditioning, stream and catchment delineation, and viewsheds with explicit units and sensitivity evidence.
---

# Terrain and watershed analysis

Use for slope, aspect, curvature, ruggedness, flow direction or accumulation,
stream extraction, watersheds, catchments and terrain-based visibility from an
elevation raster. The contract is to make terrain and drainage results
reproducible under explicit surface, unit, conditioning and threshold choices.
It does not classify raw point clouds, repair CRS identity, establish ecological
causality, or certify flood, drainage, forestry, siting or engineering decisions.

## Bind the surface before calculating

State the decision, area, scale and output units. Inspect the raster's source and
date, surface type, horizontal and vertical reference, height type, resolution,
cell alignment, nodata code, voids and coverage. Use a bare-earth DTM for most
hydrology and slope questions; a DSM includes vegetation and buildings and is
appropriate only when those surfaces belong in the question, such as some
visibility studies. A CHM is a height-above-ground product, not terrain.

Require compatible horizontal and vertical units before derivatives. Check
nodata explicitly and document void filling. Do not invent detail finer than the
source resolution or acquisition accuracy supports. If raw points must first
become a surface, stop here and name the missing point-cloud work; if only the
coordinate interpretation is uncertain, use `geospatial-coordinate-integrity`.

## Condition and derive in a recorded order

1. Preserve the input and create a working surface. Record every edit to voids,
   cells or resolution.
2. Decide whether depressions are artifacts or real landscape features. For
   hydrologic routing, document whether barriers are breached, depressions are
   filled, or sinks are modeled explicitly. Conditioning changes the question;
   do not flatten genuine closed basins without saying so.
3. Select a flow algorithm from the output: discrete single-direction routing
   for stream networks and catchments, or divergent multiple-direction routing
   where dispersal quantities need flow splitting. Record the choice and
   parameters.
4. Derive slope with stated units and method, aspect as a circular variable,
   curvature with its sign convention, and any radius-dependent position or
   ruggedness measure with its radius. Keep visualization-only hillshade out of
   the analytical input chain.
5. Extract streams at a declared accumulation threshold. Because that threshold
   is a model choice, compare at least two defensible alternatives or calibrate
   to a documented reference network.
6. Snap each outlet or pour point to a justified high-accumulation cell within a
   stated search distance before delineation. Preserve both supplied and snapped
   outlets and the displacement.

The detailed checks are in [terrain operations](references/terrain-operations.md).

## Verify against independent evidence

Inspect derivative distributions for unit and nodata failures. Compare modeled
streams with imagery or an independent mapped network at several locations,
including flat or engineered terrain where artifacts concentrate. Cross-check
catchment area and outlet position against an authoritative basin when one is
available; otherwise report the absence of an independent control.

For visibility, state observer and target height, surface type, earth curvature
and refraction treatment, maximum distance and cell-size limits. A bare-earth
viewshed can overstate visibility where vegetation or structures matter.

Return the output surface or vectors, a parameter and decision record, source
identity, threshold and conditioning sensitivity, outlet displacements,
verification observations and unresolved limitations. A plausible map is not
acceptance if its drainage assumptions and checks are absent.

Example: a filled DEM sends a stream across a road embankment. Compare a
least-cost breach with explicit sink handling, snap the requested outlet to the
modeled channel, and show how catchment area changes with two stream thresholds.
If the surface is DSM-derived and bare-earth status is unknown, label the result
provisional rather than presenting a definitive watershed.
