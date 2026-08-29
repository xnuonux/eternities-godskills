---
name: symbolic-mathematics-python
description: "Use when a mathematical implementation needs symbolic derivation, assumption tracking, and numeric cross-checks. Do not use to turn computer algebra output into an unqualified proof."
---

# Symbolic mathematics in Python

Construct and verify symbolic identities or transformations under explicit domains, assumptions, units, and numerical spot checks.

## use when

- Derive and check a symbolic mathematical identity in Python.
- Validate a symbolic transformation against assumptions and numeric samples.

## do not use when

- Present an unchecked expression as a proof.
- Ignore branch cuts domains units or singularities.

## inputs

- mathematical statement and variable domains
- assumptions units and branch conventions
- independent numeric examples

## preconditions

- variable domains and assumptions are stated
- an independent validation route exists

## workflow

1. encode symbols domains and assumptions
2. derive simplify or solve while retaining conditions
3. inspect singularities branches and dimensional consistency
4. cross-check symbolic results with independent numeric samples

## outputs

- symbolic derivation with conditions
- numeric cross-checks and unresolved domain limits

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, local-read
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when the solver discards conditions or returns ambiguous branches
- preserve unevaluated forms when simplification changes the domain

## exclusions

- does not replace expert mathematical review
- does not claim formal proof from numeric agreement

## termination

Stop when the symbolic result, assumptions, exceptional regions, and independent numeric checks are all recorded.
