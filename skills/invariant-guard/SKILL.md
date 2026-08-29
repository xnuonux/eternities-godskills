---
name: invariant-guard
description: "Use when an algorithm needs explicit invariants, executable oracles, and counterexample-driven correctness checks. Do not use to claim formal proof from tests or examples."
---

# Invariant guard

Translate an algorithm contract into preserved invariants and adversarial checks that expose incorrect branches without overstating proof.

## use when

- Guard an algorithm with explicit invariants and counterexamples.
- Build a reference oracle for edge-case comparison.

## do not use when

- Certify a theorem from a finite test suite.
- Implement before the input and output contract is settled.

## inputs

- algorithm contract and domain bounds
- candidate implementation
- trusted examples or reference oracle

## preconditions

- the contract is falsifiable
- an independent expected result can be derived for bounded cases

## workflow

1. state preconditions postconditions and loop invariants
2. construct a small independent oracle
3. generate boundary and adversarial cases
4. minimize counterexamples and repair the violated branch

## outputs

- invariant ledger and oracle
- counterexample and regression suite

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when the expected behavior is circularly derived from the candidate
- report unproved regions instead of generalizing from fixtures

## exclusions

- does not replace formal verification
- does not accept self-referential test oracles

## termination

Stop when every declared invariant has a passing guard and every discovered counterexample has a regression case or an explicit unresolved status.
