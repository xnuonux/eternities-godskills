---
name: semantic-implementation-diff
description: Use when two bounded implementations or a rewrite must be compared for observable behavior, state, errors, side effects, and explicit unobserved regions.
---

# Semantic implementation diff

Use this entrypoint when a textual diff cannot answer whether two implementations preserve the contract. It compares bounded observations under declared environments and exposes the smallest meaningful divergence; it does not prove universal program equivalence.

## Define comparable behavior

Record both implementation revisions, runtime and dependency versions, configuration, input normalization, clocks, randomness, filesystem or network fixtures, and the observable contract. Name outputs, errors, state transitions, timing or ordering that matters, emitted events, resource effects, and deliberate nondeterminism.

If the environments cannot be normalized, divide the comparison into what can be held equal and what remains unobserved. Do not hide a dependency or platform difference behind a “same input” label.

## Trace and classify

1. Run both implementations through the same bounded fixture set, including empty, invalid, boundary, repeated, interrupted, and representative cases.
2. Capture normalized output, error type and message class, state snapshots, event order, writes, calls, and resource counts. Redact secrets while retaining enough identity to compare effects.
3. Classify each observation as equivalent, divergent, or unobserved. Explain whether a divergence is intended, tolerated, a regression, or unresolved.
4. Minimize a divergence to the smallest input and state history that preserves it. Keep environment facts next to the fixture so it can be replayed.
5. Add a regression or compatibility decision for every material difference. Use metamorphic or property checks to cover transformations that a fixed fixture misses.

Run untrusted implementations only in an appropriate sandbox with bounded resources. A matching result on a small fixture says only that the two implementations agreed there. It does not establish behavior for untested inputs, failures, concurrency, or external systems.

## Evidence and finish

Return an environment ledger, contract map, fixture results, semantic difference table, minimized reproducers, accepted differences, and unobserved limits. Finish when every observed difference is classified and every important unobserved region is explicit. If the question is a migration decision, state the release or rollback implication separately from the raw comparison.

## Common failure modes

- Comparing source shape rather than observable behavior.
- Letting one implementation normalize inputs differently.
- Ignoring error, cancellation, ordering, or write effects because outputs match.
- Calling an unrun branch equivalent.
- Treating a test harness that mocks away the changed dependency as a full comparison.
