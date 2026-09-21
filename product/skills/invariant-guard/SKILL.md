---
name: invariant-guard
description: Use when an algorithm needs explicit preconditions, invariants, an independent bounded oracle, adversarial cases, and counterexample-driven repair.
---

# Invariant guard

Use this entrypoint to turn an algorithm contract into checks that can expose wrong branches. It improves evidence for a bounded domain; it does not turn a finite test suite into a formal proof.

## Write the contract first

State accepted input bounds, preconditions, postconditions, conservation or monotonicity rules, error behavior, and any loop or state invariant. Identify which properties must hold for every accepted input and which are examples or heuristics. If the desired behavior is still ambiguous, resolve the contract before implementing a guard.

Choose an expected-result route that is independent of the candidate. This may be a small brute-force implementation, a direct mathematical definition, a trusted fixture, a model checker, or a manually derived oracle for a bounded region. Do not compute the expected value by calling the same helper, reusing the same bug, or copying the candidate's branch structure.

## Generate and shrink evidence

1. Cover ordinary cases, empty and singleton inputs, lower and upper bounds, duplicate or degenerate values, overflow or precision edges, invalid inputs, and adversarial orderings.
2. Check invariants during execution when possible, not only on the final output. Include state transitions, resource bounds, and error paths where they are part of the contract.
3. Compare candidate and oracle outputs with a declared tolerance and representation rule. A tolerance must not hide a sign change, missing item, illegal state, or unsafe overflow.
4. When a case fails, minimize it while preserving the failure. Record the smallest input, expected result, observed result, violated invariant, and the branch or state transition implicated.
5. Repair the implementation or record the unresolved boundary, then keep the minimized case as a regression check. Never delete a counterexample because it is inconvenient.

Property-based generation is useful when its domain and shrink behavior are visible. Deterministic seeds improve replay, but a seed is not a substitute for boundary coverage. For a high-consequence algorithm, pair executable checks with independent review or formal methods where required.

## Finish and limits

The output is an invariant ledger, oracle description, boundary suite, minimized counterexamples, and unresolved regions. Finish when each declared invariant has evidence, every discovered failure has a regression or explicit open status, and the report says what the tests cannot establish. Do not use self-referential tests or a green fixture as a theorem certificate.

## Common failure modes

- Deriving the oracle from the candidate implementation.
- Testing only examples that shaped the algorithm.
- Using a loose numeric tolerance to hide an invalid result.
- Treating randomized coverage as reproducible without a seed and input record.
- Marking an untested branch “covered” because the main function returned success.
