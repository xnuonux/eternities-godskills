---
name: eternities-atlas
description: Turn bounded data questions into reproducible analytics, schema, query, migration, synchronization, and measurement artifacts with visible assumptions.
---

# Eternities Atlas

Atlas is the data-infrastructure route. It connects a data question to the smallest reproducible analysis or local change while keeping keys, nulls, workload, consent, compatibility, and rollback visible. Provider syntax is an implementation detail; observed evidence and declared authority decide the route.

## Choose the route

- **Analytics and experimentation** defines the estimand, population, leakage controls, uncertainty, and reproducible result.
- **Finite trade-off frontier** computes a bounded nondominated set across predeclared objectives, never a winner. Use the [finite-frontier method](references/pareto-frontier-decision.md) only for that question. Its optional Node checker verifies declared-input arithmetic, not sources or rights.
- **Simulation-artifact handoff** binds a declared file set, run context, access limits, per-measurement units, stable-source evidence, and receiver byte checks. Use the [portable handoff contract](references/simulation-artifact-handoff.md); it provides no executable snapshot or security guarantee.
- **Query and performance** discovers the schema and dialect, establishes a comparable workload and baseline, inspects plans, and distinguishes a measured gain from a hypothesis.
- **Reconciliation and quality** compares records or structures with explicit keys and null semantics, then classifies clean, changed, missing, conflicting, and unknown.
- **Schema and migration** models entities and invariants, stages additive compatibility work, and requires dry-run, backup, recovery, and owner evidence before mutation.
- **Synchronization** treats offsets, retries, deduplication, ordering, conflicts, optimistic writes, and failure recovery as an explicit state machine.
- **Decision telemetry** links collection to one question, purpose, consent state, retention, and a decision owner.
- **Connected-source discovery** is a conditional route when a task needs an authorized source beyond sufficient supplied inputs, or asks what a connected source offers. Follow [connector-discovery.md](references/connector-discovery.md) to separate discovery, bounded probing, exact loading, active-input verification, and named-analysis consumption. This is not a default analytics preflight or permission to load data.

## Working method

1. Bind scope, data owner, time window, keys, dialect or provider, sensitivity, authority, and acceptance evidence.
2. Build a ledger that separates supplied facts, observed rows, derived values, estimates, assumptions, heuristics, and unresolved conflicts. Minimize sensitive fields.
3. Reconcile before concluding. Report coverage and discrepancy classes; a successful query or fixture is not live-system proof.
4. For performance, record workload, plan, units, repetitions, percentiles, functional checks, and resource cost. For migrations, preserve originals and prove compatibility and rollback.
5. For telemetry or experiments, predeclare event semantics, denominator, guardrails, stopping rule, and what decision the result may inform.

## Deliverable and finish

Return one route-owned packet with inputs, evidence ledger, method, output, checks, discrepancies, uncertainty, performed local effects, proposed effects, and next owner. Finish when the result is reproducible and no production or external mutation is implied. The three existing extension methods are collected in [methods.md](references/methods.md). Read the separate [finite-frontier method](references/pareto-frontier-decision.md) or [simulation handoff contract](references/simulation-artifact-handoff.md) only when its route applies.

Use the conditional [connected-source method](references/connector-discovery.md) only for an actual connected-source question. A catalog match does not mean the connected-source route applies: if supplied inputs suffice or the user explicitly disallows discovery, skip that route even when Atlas is shortlisted. Atlas's local analytics route may still be useful for the supplied file. Do not run connected-source discovery as a default preflight when supplied inputs already answer the task.

For a consequential real-world choice, HOLD any recommendation until an externally authorized evidence owner has reviewed the exact input, measurements, comparability, hard feasibility, and rights. Neither the calculating agent nor a caller-supplied reviewer name can self-certify that review. A passing finite checker is only a declared-input partition. Node is required for that optional executable route, not for Atlas's other routes.

The data model, query plan, or experiment contract is a checkpoint when the user also requested an authorized local implementation. Continue into the migration fixture, query change, instrumentation, or analysis and verify it without re-requesting permission. Pause only when authority, rollback, consent, or material live-data risk is unresolved.

Example: design an additive column migration from observed workload constraints, implement it in the local fixture, run old/new compatibility checks, and preserve the rollback evidence before any live target is considered.
