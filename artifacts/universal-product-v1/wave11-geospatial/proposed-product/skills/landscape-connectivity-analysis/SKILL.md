---
name: landscape-connectivity-analysis
description: Analyze habitat connectivity with explicit patch, resistance, movement-threshold and graph assumptions, then verify corridor and patch-importance results through sensitivity checks.
---

# Landscape connectivity analysis

Use when habitat patches, landscape resistance, dispersal barriers, wildlife
corridors, pinch points or patch importance are the analytical object. The
contract is to expose how a connectivity result depends on habitat definition,
movement assumptions, resistance values, graph construction and scale. It does
not infer observed animal movement from a graph, prescribe conservation action,
value land, or replace species expertise and field evidence.

## Define the movement question

Identify the taxon or movement process, life stage, season, spatial extent,
ecological grain and decision the result may inform. State whether the desired
output is structural connection, potential functional permeability, modeled
current, least-cost route, or patch contribution. These are different claims.

Inspect land-cover or habitat inputs, source date, classification accuracy,
resolution, extent and coordinate meaning. Define habitat patches with explicit
class rules, minimum mapping unit, edge rules and patch identifiers. Preserve a
patch-area ledger; area and connectivity effects are easily confounded.

## Make resistance and graph choices auditable

Build a resistance or cost surface only from a recorded table that maps every
input class to a value and source. Distinguish expert judgment, literature
transfer, telemetry calibration and untested convention. Missing classes,
smoothing, barriers and resolution can dominate the output.

Choose Euclidean, least-cost or circuit-style distance from the movement
question, and document the graph nodes, edges, directions and weights. When the
dispersal distance or threshold is uncertain, run a small sensitivity range and
show which edges, rankings and corridors persist. Do not tune the threshold until
a preferred corridor appears.

Compute only metrics that answer the question. Patch removal contribution,
betweenness, current density and least-cost paths each carry different
interpretations. Report patch area beside importance, and call betweenness or
current a modeled proxy rather than observed flow. Optional external solvers may
be used only where separately installed and authorized; the portable method does
not require one.

The detailed record is in [connectivity operations](references/connectivity-operations.md).

## Verify and delimit the claim

Test habitat classification uncertainty, alternative resistance tables,
movement thresholds, graph construction and at least one corridor method where
the decision warrants it. Check that isolated patches, unreachable nodes,
boundary clipping and narrow graph bridges are real model features rather than
resolution artifacts. Compare candidate corridors with independent barriers,
telemetry, field observations or expert review when available; otherwise say
that functional connectivity is unvalidated.

Return the patch and graph definition, resistance provenance, sensitivity table,
corridor or patch outputs, unresolved assumptions and the strongest supported
statement. Example: rank candidate stepping stones, but report how the ranking
changes under two resistance tables and three movement distances before calling
any patch important.

If a user needs habitat loss impact, route causal and temporal design concerns
to `eternities-athena`; if statistical model fit or uncertainty dominates, use
`diagnostic-statistical-model-inference` conditionally.
