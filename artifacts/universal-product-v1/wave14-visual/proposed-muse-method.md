---
name: operational-system-visualization
owner: eternities-muse
status: proposed-product-artifact
---

# Operational system visualization

Turn an observed operational state model into a visual explanation whose marks can be traced to fields, events, formulas, and time windows. This method proposes a diagram or interface contract; it does not make an unverified system observable or turn a mock into live evidence.

## Triggers

Use when a user needs a technical view that explains one or more of:

- freshness and dependency flow, such as source data, a materialized result, and its consumers;
- bounded capacity and waiting work, such as a connection pool and its acquisition queue;
- retries over time, including attempts, wait intervals, outcomes, and retry budgets;
- ownership or redistribution across a ring or other partition topology.

## Exclusions and handoffs

- Route metric definitions, denominators, sampling, reconciliation, and analytical claims through Atlas.
- Route actual retry, timeout, circuit-breaker, and integration semantics through Hermes.
- Route implementation staging, review, and integration through Forge when the request spans engineering phases.
- Use Frontend Arsenal for local component or shader selection and browser-render proof; use Muse for visual contracts, accessibility, and visual acceptance.
- Do not invent telemetry, thresholds, formulas, ownership rules, health states, or outcomes. If their source is absent, mark the view as a proposal or simulated fixture.
- Do not use generated raster imagery as a substitute for an exact data view, live dashboard, accessible interaction, or validated technical diagram.
- This method does not authorize live-system access, network calls, provider calls, external writes, or changes to monitoring configuration.

## Steps

1. **Bind the question and evidence.** Name the audience, the decision or relationship the view should explain, the owner of each data field, the observation window, units, timezone, and whether inputs are live, recorded, synthetic, or inferred. Record missing fields as unknown.
2. **Model the entities and states.** List nodes, events, capacities, transitions, and invariants before choosing a chart. For time-based views, distinguish event time, elapsed duration, and waiting time. For topology, record the ownership rule and boundary behavior.
3. **Choose a view that preserves the mechanism.** Use a directed topology for dependency flow; capacity cells plus an adjacent queue and synchronized trend for pools; one request track per retry sequence with separately encoded attempts and waits; and a ring or partition map for ownership. Pair detail views with an aggregate only when both use the same time window and denominator.
4. **Map source values to marks.** For every line, area, state, count, color, label, and motion, document the source field or deterministic formula. Define thresholds from the target contract and identify the as-of time. Keep units and absolute timestamps available. Never imply freshness from a relative-time label alone.
5. **Design accessible interaction and fallback.** Do not encode state by color alone. Provide text labels and a table/list equivalent, keyboard operation, visible focus, clear empty/error/stale states, responsive density rules, and a reduced-motion equivalent. Do not hide essential values in hover-only details. Animate only observed transitions and allow the reader to pause or disable motion.
6. **Check semantic invariants with a bounded fixture.** Check applicable rules against known input and expected output: source-to-consumer edges match the declared dependency set; freshness derives from the stated observation time and refresh time; mutually exclusive pool-state counts reconcile to capacity at a common sample; retry intervals match recorded event times and the declared policy; and ownership regions match the target hash/partition function, including wrap and tie cases. Label simulated data and do not present a fixture as production evidence.
7. **Freeze and inspect the rendered contract.** Record artifact revision, data fixture or snapshot, viewport, locale, timezone, font and reduced-motion setting. Inspect representative, empty, stale, saturated, failure, and boundary states. Use Muse acceptance and Frontend Arsenal's actual-route browser proof when implementation is in scope. A source review or clean build alone is not rendered acceptance.

## Outputs

- A view contract with the question, audience, entities, state model, field-to-mark mapping, units, time basis, thresholds, and assumptions.
- An annotated diagram or interface specification with responsive, keyboard, text-alternative, empty, stale, and failure states.
- A small deterministic fixture and expected invariant results, clearly separated from live observations.
- A provenance and acceptance receipt recording input identity, transforms, configuration, captures or inspection evidence, limitations, and next owner.

## Recovery

- When a feed, field, denominator, timestamp, or policy is missing, show “unknown” or “unavailable” with the last observed time; never substitute zero, green, or a healthy state.
- When samples are partial or from different windows, label the mismatch and suppress comparisons that would imply a common denominator.
- When an invariant fails, preserve the input and failed comparison, expose the discrepancy, and fall back to a table or last verified snapshot. Do not silently clamp, interpolate, or smooth the value.
- When the view becomes too dense, aggregate with a stated grouping rule and preserve a path to exact counts or records. If aggregation changes the question, stop and request a narrower view contract.
- When animation, canvas, or WebGL is unavailable or reduced motion is requested, retain the same information in a static DOM/table view.

## Provenance

For every rendered value retain the source field or event, input snapshot identifier or fixture hash, transformation and formula version, unit, timezone, observation time, and any threshold owner. For simulated views retain the seed and model parameters and label the output synthetic. Record target code/asset revisions, accessibility settings, viewport, and evidence filenames in the acceptance receipt. Preserve third-party notices whenever future implementation copies source code or substantial text; this proposal itself contains no copied source code or prose.

## Source basis for this proposal

The adapted mechanisms are the materialized-view lifecycle (`r0019`), connection-pool capacity and waiters (`r0038`), retry timeline (`r0247`), and consistent-hash ownership ring (`r0248`). The provider-specific image-generation workflow (`r0206`) was rejected for this method. Exact pinned revisions and body identities are recorded in `source-integrity.json`; per-body reasons are in `source-dispositions.md`.
