---
name: columnar-ingestion-rollup-and-query-layout-design
description: Use when an analytical workload needs a measured columnar layout, partition and sort choices, late-data handling, rollups, and reproducible query evidence.
---

# Columnar ingestion, rollups, and query layout

Use this entrypoint to design or revise an analytical data layout from workload evidence. The goal is a layout decision with lineage and measurements, not a fashionable storage pattern or an unmeasured production migration.

## Describe the workload first

Capture the event schema, approximate volume and growth, arrival distribution, update or correction behavior, retention horizon, and representative query shapes. Include filters, groupings, joins, freshness expectations, and acceptable latency or scan budgets. Measure field cardinality and skew; a partition key that looks natural can create tiny files, hot partitions, or poor pruning.

Keep raw input, normalized records, and derived rollups as separate logical layers. State which layer is authoritative, which transformations are replayable, and how a late or corrected event changes each layer. Define the identity and watermark used to prevent a late batch from being counted twice.

## Compare layouts

1. Establish a baseline using the current or simplest viable layout. Record data volume, file count, compression, bytes read, rows examined, result correctness, and freshness.
2. Propose only the partition, sort, encoding, clustering, or rollup changes needed by the observed workload. Avoid partitioning on high-cardinality values unless the query and file-size evidence supports it.
3. Include late-arrival and backfill scenarios. Test whether rollups can be incrementally corrected or must be rebuilt, and identify the window in which a result is provisional.
4. Run representative queries against comparable data and warm-up conditions. Collect a distribution, not one favorable timing, and retain the query plan or pruning evidence.
5. Reconcile every optimization with retention, deletion, schema evolution, and lineage requirements. A faster query that cannot be explained or repaired is not a complete design.

When an authorized implementation follows the design, ship the smallest reversible change, backfill in a bounded slice, and compare old and new results before widening the slice. Keep alternatives when measurements are inconclusive rather than forcing a winner.

## Evidence and finish

The design packet should contain workload provenance, schema and cardinality notes, layer diagram, partition and sort rationale, rollup update rule, representative query set, baseline/candidate measurements, correctness comparison, and migration or rollback considerations. Mark toy-data results as exploratory and do not translate them into production cost or capacity claims.

Finish when correctness and query budgets are explicit, late data has a defined path, the selected layout is supported by representative evidence, and unresolved tradeoffs are visible. A plan or benchmark receipt does not itself perform a database installation or migration.

## Common failure modes

- Optimizing a single query while degrading the rest of the declared workload.
- Treating a rollup as authoritative without a replay or correction rule.
- Hiding partition skew behind an average file size.
- Comparing compressed and uncompressed layouts with different data or cache state.
- Choosing a design from toy data and calling it a production estimate.
