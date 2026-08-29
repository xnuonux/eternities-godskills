---
name: lazy-tabular-transformation-and-validation
description: "Use when a tabular pipeline needs deferred execution, schema checks, and measured materialization boundaries. Do not use when lazy plans hide invalid data or memory risk."
---

# Lazy tabular transformation and validation

Build a reproducible tabular transformation whose logical plan, schema invariants, collection points, and validation evidence are explicit.

## use when

- Construct a lazy tabular transformation with explicit validation.
- Move collection and materialization to measured bounded edges.

## do not use when

- Read arbitrary datasets outside the supplied scope.
- Collect an unbounded plan into memory.

## inputs

- authorized tabular sources and schema
- transformation and validation requirements
- resource budget and materialization targets

## preconditions

- source scope and schema are explicit
- materialization has a declared resource ceiling

## workflow

1. declare schema and row-level invariants
2. compose lazy projections filters joins and aggregations
3. inspect and constrain the execution plan
4. materialize bounded results and validate counts nulls keys and types

## outputs

- lazy transformation pipeline
- plan schema resource and validation evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, dataset-bound-read
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop when the plan crosses the memory or row budget
- reject schema drift before downstream materialization

## exclusions

- does not hide eager operations behind naming
- does not mutate source datasets

## termination

Stop when the logical plan and bounded materialized result both satisfy the declared schema and data invariants.
