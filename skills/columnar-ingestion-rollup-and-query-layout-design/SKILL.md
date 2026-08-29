---
name: columnar-ingestion-rollup-and-query-layout-design
description: "Use when analytical data needs a measured columnar layout, partition scheme, rollup path, and query proof. Do not use for speculative production schema mutation."
---

# Columnar ingestion rollup and query layout design

Design a columnar ingestion and rollup layout from workload evidence while preserving lineage, late data handling, and reproducible query measurements.

## use when

- Design a columnar ingestion and rollup path for a known analytical workload.
- Compare partition and query layouts using representative local evidence.

## do not use when

- Install or migrate a production database.
- Choose partitions without cardinality retention and query evidence.

## inputs

- event schema volume and arrival model
- representative query shapes and retention needs
- available local engine and measurement budget

## preconditions

- representative workload evidence exists
- retention correctness and query goals are explicit

## workflow

1. profile fields cardinality skew and late arrival
2. design raw normalized and rollup layers
3. compare partition sort compression and pruning behavior
4. measure representative queries and record tradeoffs

## outputs

- columnar layout and rollup design
- query measurements lineage and migration handoff

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, local-read
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop when workload samples are not representative
- retain alternative layouts when measurements are inconclusive

## exclusions

- does not deploy or install a database
- does not infer production cost from toy data

## termination

Stop when the selected layout clears declared correctness and query budgets against representative local fixtures.
