---
name: fp-ts-functional-refactoring
description: "Use when TypeScript behavior should be refactored into explicit functional data, validation, and effect boundaries. Do not use when runtime contracts or library versions are unknown."
---

# fp-ts functional refactoring

Refactor TypeScript into composable typed transformations while preserving runtime behavior and isolating effects at declared edges.

## use when

- Refactor typed validation and effects into explicit functional composition.
- Preserve behavior while replacing hidden mutation with typed data flow.

## do not use when

- Introduce a functional library without dependency authority.
- Erase a framework lifecycle behind an incompatible abstraction.

## inputs

- existing TypeScript behavior and tests
- runtime and library version constraints
- effect and error-channel inventory

## preconditions

- current behavior has executable characterization
- dependency versions and runtime boundaries are known

## workflow

1. characterize current success error and effect paths
2. model domain values and failures explicitly
3. refactor one boundary at a time
4. verify runtime semantics type errors and effect ordering

## outputs

- typed functional refactor
- behavioral and type-level regression evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when abstraction changes observable ordering or cancellation
- retain explicit imperative code where functional encoding obscures the contract

## exclusions

- does not install dependencies
- does not treat type checking as runtime proof

## termination

Stop when characterized behavior, type checks, tests, and declared effect ordering all pass for the bounded refactor.
