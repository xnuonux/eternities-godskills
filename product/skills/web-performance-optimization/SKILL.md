---
name: web-performance-optimization
description: Use when a reproducible web bottleneck needs baseline traces, causal isolation, a bounded optimization, repeated measurement, and functional or visual regression checks.
---

# Web performance optimization

Use this entrypoint to improve a measured web experience without confusing a lab result with field impact. It supports authorized code and delivery changes, while keeping deployment and real-user claims explicit.

## Freeze the user-visible baseline

Record the page or flow, revision, browser and device profile, network and CPU conditions, data and cache state, viewport, authentication state, and performance budget. Define the user-facing metric—such as interaction latency, largest contentful paint, long task time, transfer size, or a product-specific measure—and how it will be sampled.

Capture repeated traces and a functional and visual baseline. Include console errors, network waterfalls, resource timing, layout shifts, hydration or rendering state, and accessibility behavior when relevant. Separate lab metrics from field telemetry; do not substitute a score for a user's actual flow.

## Isolate and change

1. Use traces to identify the dominant dependency or rendering cost. Confirm it with an experiment or counterfactual where possible rather than optimizing the most visible line of code.
2. Choose one bounded change with a hypothesis, expected metric, regression risk, rollback point, and scope. Examples include reducing a critical payload, changing loading order, removing duplicate work, or correcting a render invalidation.
3. Re-run the same functional, visual, and performance harness under the same warm-up and cache policy. Keep all samples, including failed or throttled runs.
4. Compare distributions and tail budgets, not only means. Check error rate, content correctness, responsive layout, input behavior, and accessibility as well as speed.
5. Accept, revert, or mark inconclusive. If an authorized delivery change is included, record the rollout boundary separately from before-and-after lab evidence and use field telemetry for a field claim.

Do not optimize by disabling content, hiding errors, weakening accessibility, or making the benchmark unlike the declared user flow. A field improvement requires matched real-user evidence and its own analysis.

## Finish and limits

Return baseline and candidate traces, environment, hypothesis, change digest, metric distribution, budget result, functional and visual checks, rollback state, and proof limits. Finish when repeated measurements clear the declared budget or produce a failure or inconclusive receipt.

## Common failure modes

- Treating one Lighthouse or synthetic score as a causal result.
- Changing caching, browser profile, and code in the same iteration.
- Improving first paint by delaying or breaking the real interaction.
- Ignoring tail latency and error rate because the average improved.
- Deploying a lab optimization without a release decision.
