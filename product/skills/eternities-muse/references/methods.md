# Muse method cards

## accessible-async-interface-state-machine

Freeze interaction contract, content states, target viewport and assistive technology assumptions, and acceptance criteria. Model idle, loading, success, empty, error, cancelled, retrying, and stale states. For every transition, define focus destination, announcement or status semantics, keyboard operation, cancellation, retry behavior, and what happens when an older response arrives after a newer request. Use request identity or an equivalent guard so stale data cannot overwrite current state.

Exercise slow, failed, cancelled, duplicate, out-of-order, and empty results. Check visible focus, nonvisual status, reduced motion, disabled controls, pointer and keyboard alternatives, and recovery after retry. Return a state diagram, issue ledger, and race-condition evidence; a static inspection or one browser capture does not prove universal assistive-technology support.

## rendered-spatial-measurement-and-adjudication

Freeze artifact revision, viewport and device matrix, pixel ratio, fonts, content, camera, seed, timing, and acceptance thresholds. Measure final rendered geometry, alignment, clipping, occlusion, spacing, contrast, and responsive transitions from captures or inspectable output. Compare intended, near-boundary, and extreme states; preserve the raw measurement and locator for every decision.

Return a spatial measurement ledger with expected value, observed value, tolerance, evidence, and disposition, followed by a visual adjudication receipt. Distinguish source declarations from rendered behavior and state unmeasured surfaces.
