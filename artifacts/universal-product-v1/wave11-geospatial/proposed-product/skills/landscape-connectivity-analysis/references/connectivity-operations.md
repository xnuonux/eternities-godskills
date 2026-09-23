# Connectivity operations record

## Claim and scale

Record the movement process, taxon and life stage where known, season, extent, grain, minimum mapping unit, intended decision and claim class: structural, potential functional, modeled current, modeled route or patch contribution. State where the model cannot represent behavior, mortality, density or realized movement.

## Patch ledger

For each patch preserve a stable identifier, source class, area, perimeter or shape measure where used, habitat-quality caveat, boundary handling and inclusion threshold. Report area with every removal-importance ranking. Check whether a ranking survives an alternative minimum patch size.

## Resistance ledger

For every land-cover or feature class record resistance value, unit or scale, source, geography and species relevance, expert or empirical basis, date and uncertainty. Record smoothing, barriers, water rules, roads and unresolved classes. Compare at least one plausible alternative table when the result is consequential.

## Graph and route ledger

Record node and edge definitions, edge direction, distance or cost metric, connectivity threshold or kernel, unreachable-node policy, boundary treatment and software-independent calculation description. Preserve the supplied candidate route alongside the computed route and record any endpoint snapping.

For current-density or circuit-style outputs, identify focal nodes, source and ground settings, solver mode and parameterization. For least-cost outputs, show cost-path alternatives or sensitivity to one plausible resistance change. For patch removal metrics, show the metric formula class, reference landscape extent and area-normalized companion values.

## Verification

- Compare at least two movement thresholds or justify a fixed value with species evidence.
- Inspect graph bridges, isolated components and boundary effects at the output resolution.
- Check a known barrier and a known permeable location where independent evidence exists.
- Compare modeled corridor placement with telemetry, field signs or expert review when available.
- Report which conclusions change under resistance, threshold and patch-size sensitivity.

## Failure signatures

- A distance threshold selected because it yields the preferred corridor.
- Unreviewed resistance values treated as measured movement cost.
- Patch area effect described as unique connectivity importance.
- Betweenness or modeled current reported as observed animal flow.
- Corridor lines crossing clipped study boundaries or raster gaps without comment.
- A graph that changes completely under minor resolution or patch-rule changes.
- One model output used as a land-use, conservation or regulatory decision by itself.
