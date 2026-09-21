# Atlas method cards

## consent-gated-decision-linked-telemetry

Start with one decision question and the minimum observation needed to answer it. For each event, record purpose, subject or aggregate level, fields, sensitivity, consent or other collection basis, retention, access, deletion, sampling, owner, and the decision it can inform. Do not collect a field because it might be useful later.

Define event semantics precisely: when it starts, when it completes, identity and deduplication key, ordering, clock, retries, missing values, and whether the event is client- or server-observed. Build a local fixture that exercises consent denied, withdrawn, duplicate, late, malformed, and retained-too-long cases. Link each metric to the decision ledger and record what the telemetry cannot establish.

## evidence-bound-data-modeling-schema-change-and-inspection

Inventory actual workload shapes, keys, cardinalities, invariants, constraints, access patterns, retention, compatibility targets, and rollback resources. Compare model options on correctness, query shape, write path, migration cost, and inspection evidence. For a schema change, prefer a staged compatibility sequence: add or dual-read, backfill with checks, switch reads or writes, then remove only after dependent evidence passes.

Inspect generated schema, constraints, indexes, representative plans, migration output, and failure behavior. Exercise valid, boundary, old-version, duplicate, null, and rollback cases. Preserve the original and state whether the proof is fixture, local database, or live-system evidence. No migration is complete from a design packet alone.

## precommitted-product-experimentation-gate

Before observation, write the falsifiable hypothesis, eligible population, unit of assignment, intervention and comparator, primary metric, guardrails, denominator, window, sample or observation requirement, stopping rule, analysis method, confounders, and decision for each possible result. Version the contract so later results cannot rewrite the question.

After observation, validate exposure and exclusion, missingness, contamination, instrumentation, and guardrail coverage before calculating. Report effect and uncertainty, practical meaning, and deviations. A result can support learning without proving causality; if the precommit or evidence is incomplete, return inconclusive and name the smallest repair.
