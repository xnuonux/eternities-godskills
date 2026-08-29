---
name: web-performance-optimization
description: "Use when a web performance regression needs measured baseline, causal isolation, bounded changes, and repeated verification. Do not use for synthetic score theater or live mutation."
---

# Web performance optimization

Reduce a verified user-facing bottleneck while preserving behavior and separating laboratory metrics from field claims.

## use when

- Measure and repair a reproducible web performance regression.
- Compare a bounded optimization against an exact baseline and budget.

## do not use when

- Claim field improvement from one synthetic run.
- Change production delivery without release authority.

## inputs

- reproducible page and test environment
- baseline traces and performance budget
- functional and visual acceptance checks

## preconditions

- the environment and workload are repeatable
- a metric and acceptance budget are predeclared

## workflow

1. capture repeated baseline traces
2. isolate the dominant dependency or rendering cost
3. apply one bounded optimization
4. repeat measurements and verify behavior visual output and variance

## outputs

- bounded performance change
- before-after traces budgets and proof limits

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: dependency-installation, formal-proof-claim, production-mutation

## failure behavior

- stop when variance overwhelms the measured effect
- revert when behavior or visual acceptance regresses

## exclusions

- does not claim real-user impact without field evidence
- does not deploy or mutate live infrastructure

## termination

Stop when repeated measurements clear the declared performance budget with functional and visual regression checks still passing.
