# Muse method cards

## accessible-async-interface-state-machine

Freeze interaction contract, content states, target viewport and assistive technology assumptions, and acceptance criteria. Model idle, loading, success, empty, error, cancelled, retrying, and stale states. For every transition, define focus destination, announcement or status semantics, keyboard operation, cancellation, retry behavior, and what happens when an older response arrives after a newer request. Use request identity or an equivalent guard so stale data cannot overwrite current state.

Exercise slow, failed, cancelled, duplicate, out-of-order, and empty results. Check visible focus, nonvisual status, reduced motion, disabled controls, pointer and keyboard alternatives, and recovery after retry. Return a state diagram, issue ledger, and race-condition evidence; a static inspection or one browser capture does not prove universal assistive-technology support.

## rendered-spatial-measurement-and-adjudication

Freeze artifact revision, viewport and device matrix, pixel ratio, fonts, content, camera, seed, timing, and acceptance thresholds. Measure final rendered geometry, alignment, clipping, occlusion, spacing, contrast, and responsive transitions from captures or inspectable output. Compare intended, near-boundary, and extreme states; preserve the raw measurement and locator for every decision.

Return a spatial measurement ledger with expected value, observed value, tolerance, evidence, and disposition, followed by a visual adjudication receipt. Distinguish source declarations from rendered behavior and state unmeasured surfaces.

## operational-system-visualization

Use when the question is how observed data dependencies, bounded capacity, retry attempts, or partition ownership behave. This is a visual-explanation method, not authority to access a live system or change its telemetry, retry policy, or routing. Ask Atlas to own field definitions, units, time windows, reconciliation, sensitivity, and access; ask Hermes to own retry and timeout semantics. If those contracts are absent, label the view proposed or simulated rather than live.

1. Name the audience, decision, input snapshot, observation time, units, timezone, data owner, and whether each value is live, recorded, synthetic, or inferred. Model entities, transitions, capacities, and invariants before drawing.
2. Choose the view that exposes the mechanism: a directed source-to-result-to-consumer topology with refresh and stale-read evidence; capacity cells beside a separate waiter queue and synchronized latency/count trend; an attempt timeline distinguishing request duration from backoff; or a partition ring showing physical and virtual nodes, keys, ownership, and before/after migration. A detail and aggregate view must use compatible windows and denominators.
3. Bind every mark, label, threshold, color, and animation to a field, event, or deterministic formula. Derive freshness from the stated as-of and refresh times, never from a relative label alone. Use the target's actual connection states, retry classification and `Retry-After` policy, hash space, virtual-node rules, tie/wrap behavior, and membership-change semantics; do not import example defaults.
4. Check a bounded fixture against the target contract: dependency edges and refresh lag; pool-state counts from the same sample, with each currently allocated connection in one exhaustive state and their sum no greater than the configured maximum; recorded attempt/wait intervals and terminal outcomes; and key ownership before and after a node change, including affected keys and wrap/tie cases. Derive unallocated slots as maximum minus allocated only if the state set is known complete and its capacity semantics are declared; otherwise show unallocated capacity as unknown. Waiters are a separate queue, never part of the connection total. Keep simulated fixtures visibly separate from production evidence.
5. Give the reader labels, a table/list equivalent, keyboard access, visible focus, reduced motion, and empty/error/stale states. Preserve exact values without hover or color. Animate only observed transitions, and use a static equivalent if animation or canvas is unavailable. For implementation, freeze revision, snapshot, viewport, locale, timezone, and motion setting, then inspect rendered normal, boundary, saturated, stale, and failure states under Muse's acceptance contract.

Return a view contract, field-to-mark map, diagram or interface specification, fixture with expected invariant results, and acceptance receipt binding values to source fields, transforms, units, time, configuration, and limitations. Missing feeds remain unknown, not zero or healthy. Partial or mismatched windows suppress comparative claims; a failed invariant is preserved and shown rather than smoothed away. Any new telemetry collection requires the data owner's consent, retention, and access rules; this method grants no collection permission.
