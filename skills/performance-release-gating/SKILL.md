---
name: performance-release-gating
description: "Use when a release needs a repeatable local performance gate with explicit workloads, budgets, variance, and failure policy. Do not use for external load generation or deployment."
---

# Performance release gating

Bind release readiness to measured performance evidence without confusing a local load fixture with production capacity.

## use when

- Create a local performance release gate for a bounded workload.
- Compare a candidate against a baseline budget with variance controls.

## do not use when

- Generate load against an external or production target.
- Deploy because one benchmark happened to pass.

## inputs

- authorized local target and workload
- baseline distribution and performance budget
- functional correctness and resource ceilings

## preconditions

- the load target is local and authorized
- budgets and run count are predeclared

## workflow

1. freeze workload environment and warmup policy
2. measure baseline distribution and variance
3. run the candidate under identical bounded conditions
4. gate on predeclared latency throughput error and resource budgets

## outputs

- local performance gate
- baseline candidate variance and failure receipt

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, local-load-authority
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop when the target or load authorization is unclear
- fail the gate when variance or functional errors invalidate comparison

## exclusions

- does not deploy or publish
- does not claim production capacity from a local fixture

## termination

Stop when the bounded run set yields a reproducible pass or a failure receipt under the declared budgets.
