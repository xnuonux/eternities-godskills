---
name: audio-dsp-integrity-review
description: Use when supplied audio DSP code or a signal graph needs evidence-linked review of realtime deadlines, numeric integrity, routing, latency, rate, channel, or feedback behavior.
---

# Audio DSP integrity review

Use this entrypoint for a structured review of an audio callback, plugin processing path, render graph, filter, feedback network, or sidechain. Keep deadline safety, numeric integrity, and signal-graph integrity as separate evidence lanes; a finding in one lane does not close another.

## Establish the boundary

Record the realtime or render entrypoint, reachable source scope, sample rate, frames per buffer, channel layout, host assumptions, block contract, and acceptance question. Compute the nominal callback interval from the supplied rate and buffer size, but label it as a budget rather than measured headroom. Build a transitive call map and a directed graph from sources through processors, routers, controls, and sinks. Mark missing code, dynamic dispatch, host compensation, undocumented edges, and unknown threading as unresolved.

## Inspect the three lanes

1. **Deadline safety.** Trace every reachable operation for a demonstrated finite bound. Look for allocation or growth, blocking locks, file or network I/O, logging, exceptions, thread or process creation, sleeps, lazy initialization, page faults, and runtime or operating-system transitions. Record setup-time preallocation, queue capacity, overflow policy, fallback, and platform evidence for lock-free or wait-free claims.
2. **Numeric integrity.** Trace stateful filters, feedback, accumulators, conversions, and domain-sensitive functions. Check finite input/output handling, NaN and infinity propagation, zero and near-zero divisors, invalid roots or inverse-trigonometric domains, denormals, fixed-point overflow, accumulator precision, coefficient sensitivity, state initialization, gain conventions, and bounded feedback. A plausible formula is not a stability proof.
3. **Signal graph.** For each node and edge record channels, rate, block size, latency, gain convention, state ownership, and control/data role. Check parallel-path compensation, conversion placement, pre/post-fader semantics, sidechain wiring, feedback delay, fan-out ownership, summing gain, clipping before downstream control, and cycles. Distinguish an observed structural defect from unknown host behavior.

## Findings and finish

For every finding return lane, severity, status (confirmed, conditional, or unresolved), exact file/line/call/edge evidence, violated contract, consequence, smallest safe remedy or implementation handoff, and verification needed to close it. End with one verdict per lane, a remediation order, residual uncertainty, and a proof boundary.

Static review can guide an authorized code change, but it does not silently mutate code, prove glitch-free execution, prove audible quality, or certify a DAW, driver, device, plugin format, or production host. Close the review when all reachable evidence is classified or missing source prevents further analysis.

## Common failure modes

- Calling an atomic type lock-free without platform evidence.
- Checking filter coefficients while ignoring state initialization or denormals.
- Treating a graph drawing as proof of latency compensation.
- Collapsing unresolved host behavior into a clean verdict.
- Using a synthetic render or authored fixture as proof of real-time or audible performance.
