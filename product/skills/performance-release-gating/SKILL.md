---
name: performance-release-gating
description: Use when a release needs repeatable performance evidence with an explicit target, workload, baseline distribution, budgets, variance policy, and functional gate.
---

# Performance release gating

Use this entrypoint to decide whether a bounded candidate clears a declared performance gate. The target may be a local fixture or another explicitly authorized test target; the evidence must say which. A synthetic pass is not a field-capacity claim.

## Freeze the comparison

Record candidate and baseline revisions, target identity, environment, runtime and dependency versions, workload shape, data state, warm-up policy, cache state, concurrency, run count, and resource ceilings. Define the metric, percentile or statistic, acceptable variance, and failure rule before measuring. Pair performance with functional, error-rate, and visual checks when the change can affect them.

Do not compare a warmed candidate with a cold baseline, a cached response with a fresh one, or a production-like data set with a toy fixture without marking the difference. If the target or load is not authorized, stop before generating it.

## Run the gate

1. Verify the target is healthy and the workload is bounded. Keep an artifact digest or request list so the same input can be replayed.
2. Run enough baseline samples to characterize distribution and outliers. Record interruptions, throttling, GC or thermal effects, and resource saturation instead of deleting inconvenient samples.
3. Apply one material change where causal attribution matters, then run the candidate under the same harness and order policy. If the task is a release candidate, also run the required regression suite.
4. Compare latency, throughput, error rate, memory, CPU, I/O, and other declared metrics against budgets and uncertainty. A small mean gain that is outside the variance or worsens a tail budget fails the gate.
5. Produce pass, fail, or inconclusive. Inconclusive means more controlled evidence is needed; it is not a pass.

If deployment or live traffic measurement is part of the authorized task, keep the release effect and the measurement claim separate and record the rollout boundary. Otherwise hand off the gate result without publishing.

## Finish and limits

The receipt should include environment, workload, baseline and candidate distributions, budgets, functional result, resource use, outliers, and proof limits. Finish only when the bounded run set is reproducible enough for the declared decision. Do not claim real-user impact, production capacity, or safety from a lab run alone.

## Common failure modes

- Reporting one fastest run as the baseline.
- Changing the workload after seeing the candidate result.
- Ignoring errors because latency improved.
- Reusing a budget from a different target or runtime.
- Deploying because a benchmark passed without the release gate.
