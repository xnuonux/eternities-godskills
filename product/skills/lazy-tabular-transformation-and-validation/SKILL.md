---
name: lazy-tabular-transformation-and-validation
description: Use when a tabular pipeline needs deferred execution, explicit schema and row invariants, inspected plans, bounded materialization, and validation evidence.
---

# Lazy tabular transformation and validation

Use this entrypoint when a table workflow should remain lazy until a deliberate, measurable boundary. Laziness is useful only when the plan, schema, resource envelope, and materialized result remain visible.

## Declare the data contract

Record authorized source membership, schema and type system, key constraints, null policy, unit conventions, row identity, expected cardinality, and the result needed by the task. State the maximum rows, bytes, memory, time, or partitions allowed at collection points. Keep source data immutable unless the task explicitly includes a separate write.

## Build and inspect the plan

1. Parse or bind the declared schema before composing transformations. Reject drift in names, types, units, or required keys rather than allowing implicit coercion to spread.
2. Compose projections, filters, joins, windows, and aggregations lazily. Keep predicates and column selection close enough to the source for the engine to optimize, but verify that pushdown did not change semantics.
3. Inspect the logical and physical plan. Look for accidental eager reads, unbounded joins, duplicate-producing keys, sort or group explosions, hidden conversions, and operations that defeat partition pruning.
4. Materialize only at a named bounded edge. Capture row count, byte estimate, null counts, key uniqueness, type checks, aggregate reconciliation, and resource use.
5. Compare the result to a small independent fixture or a separately computed invariant. For a write, stage the output and reconcile its digest or partition manifest before replacing an existing artifact.

Choose a chunked or sampled path when the full result exceeds the budget. A sample can diagnose a plan; it cannot certify full-data completeness. If the logical plan crosses its memory, row, or time envelope, stop before collection and report the operation that caused the risk.

## Evidence and finish

Return the source revision, schema, plan representation, materialization boundary, resource budget, observed use, validation results, rejected rows and reasons, and any unassessed partitions. Finish when both the logical plan and bounded result satisfy the declared invariants. Do not hide eager work behind a name such as lazy or streaming.

## Common failure modes

- Inferring schema from the first file and accepting later drift.
- Joining on a non-unique key without measuring row multiplication.
- Collecting a full plan to discover its size after memory is exhausted.
- Validating only row count while nulls, units, and keys changed.
- Mutating the source table as a side effect of a read-oriented transformation.
