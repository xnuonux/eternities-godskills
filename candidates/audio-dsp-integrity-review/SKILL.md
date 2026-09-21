---
name: audio-dsp-integrity-review
description: Review audio DSP code and graphs for hard real-time deadline hazards, numeric instability, and signal-path defects. Use for audio callbacks, plugin processing, render graphs, filters, feedback, sidechains, latency, sample-rate, channel, and gain-flow audits. Do not use for mixing taste, mastering, music generation, general DSP tutoring, code mutation, or claims that one static review certifies audible quality or a production host.
---

# Audio DSP integrity review

Produce an evidence-linked review of supplied audio code or graph descriptions. Keep three proof lanes separate: deadline safety, numeric integrity, and signal-graph integrity. A finding in one lane does not prove the others.

## Establish the boundary

Record the callback or render entrypoint, sample rate, frames per buffer, channel layout, host or runtime assumptions, and supplied source scope. Compute the nominal callback deadline from the supplied rate and buffer size, but label it a budget rather than measured headroom. Build a transitive call map from the realtime entrypoint and a directed signal graph from sources through processors and routers to sinks. Mark missing code, dynamic dispatch, host behavior, and undocumented edges as unresolved.

If there is no realtime path and no audio graph or numeric DSP question, skip this capability. Route conceptual DSP explanation elsewhere. Route requested code changes to an implementation workflow after the review is accepted.

## Lane A: deadline safety

Inspect every reachable realtime operation for a demonstrated finite upper bound. Flag allocations or growth, potentially blocking synchronization, file or network I/O, logging, process or thread creation, sleeping, exceptions, lazy initialization, and other OS or runtime transitions when they can occur inside the hard real-time boundary. Treat lock-free and wait-free as claims requiring platform-specific evidence; an atomic type or queue name is not proof. Record setup-time preallocation, pre-touching, bounded queues, overflow behavior, and fallback behavior when present.

## Lane B: numeric integrity

Trace stateful filters, feedback, accumulators, conversions, and domain-sensitive operations. Check finite input and output handling, NaN and infinity propagation, zero or near-zero divisors, invalid square-root or inverse-trigonometric domains, denormal policy, fixed-point overflow, accumulator precision, coefficient sensitivity, state initialization, and bounded feedback. Require units or gain conventions where ambiguity changes the result. Do not turn a plausible formula into stability proof; request poles, bounds, reference vectors, or measured evidence as appropriate.

## Lane C: signal graph

For each node and edge, record channels, sample rate, block contract, latency, gain convention, state, and control-only connections. Check parallel-path latency compensation, rate and channel conversion, pre/post-fader semantics, sidechain wiring, feedback delay, fan-out ownership, summing gain, clipping before downstream control, and graph cycles. Distinguish structural defects from unknown host compensation.

## Findings contract

For each finding emit:

- lane and severity;
- status: `confirmed`, `conditional`, or `unresolved`;
- exact file, line, node, edge, or call-path evidence;
- violated contract and concrete consequence;
- smallest safe remedy or handoff;
- verification needed to close the finding.

End with lane verdicts, a prioritized remediation order, residual uncertainty, and a proof boundary. Stop when all reachable evidence is classified or when missing source prevents further review. Static review does not prove audible quality and does not certify any host. Never silently repair code, run third-party tooling, claim glitch-free execution from static inspection, or certify a device, driver, plugin format, DAW, host, or production deployment without separate representative testing.
