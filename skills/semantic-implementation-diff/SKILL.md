---
name: semantic-implementation-diff
description: "Use when two implementations must be compared for behavioral equivalence beyond textual diff. Do not use to claim universal equivalence from bounded observations."
---

# Semantic implementation diff

Trace contracts, state transitions, outputs, errors, and effects across implementations and expose the smallest meaningful semantic divergence.

## use when

- Compare two implementations for contract-level semantic differences.
- Verify a rewrite or migration against observable behavior and effects.

## do not use when

- Declare arbitrary programs equivalent from matching source shape.
- Ignore environment or dependency differences that affect behavior.

## inputs

- two bounded implementations and their contracts
- shared fixtures and environment assumptions
- observable state output error and effect model

## preconditions

- both implementations can run in a bounded comparable harness
- the observable contract is explicit

## workflow

1. normalize comparable inputs and environment
2. trace outputs errors state transitions and effects
3. classify equivalent divergent and unobserved regions
4. minimize each divergence into a regression fixture

## outputs

- semantic difference ledger
- equivalence fixtures divergences and unobserved limits

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, local-read
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when environments cannot be normalized
- label unobserved behavior instead of inferring equivalence

## exclusions

- does not prove undecidable general equivalence
- does not execute untrusted code without a sandbox

## termination

Stop when every observed semantic difference is classified and minimized, and every unobserved region is explicit.
