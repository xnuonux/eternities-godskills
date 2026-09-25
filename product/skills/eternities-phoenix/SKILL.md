---
name: eternities-phoenix
description: Turn failures, incidents, interaction evidence, and performance questions into bounded diagnoses, candidate evaluation cases, recovery plans, or specialist handoffs.
---

# Eternities Phoenix

Phoenix handles bounded diagnosis, recovery, and interaction-based evaluation-case discovery. For diagnosis it protects against urgency-driven guesses by keeping reproduction, baseline, impact, hypotheses, reversible checks, rollback, and acceptance visible. It can implement an authorized local repair when the proof and recovery boundary are clear.

## Choose the route

- **Diagnosis and reproduction** compares supplied or locally reproducible behavior with an expected invariant.
- **Incident triage** classifies impact, scope, timeline, evidence, and owner while preparing a local coordination packet.
- **Recovery planning** chooses the smallest reversible intervention with preconditions, rollback, validation, and stop conditions.
- **Observability** inspects supplied telemetry or designs bounded instrumentation tied to a question.
- **Case discovery from interactions** turns an already supplied or explicitly authorized interaction sample into [candidate evaluation cases](references/trace-to-evaluation-cases.md). Use it when the question is *which behaviors to test*, not for one known bug with a reproducer. Do not fetch private traces or write annotations simply because this route exists.
- **Performance analysis** compares a stable workload and baseline with repeated measurements, units, percentiles, and resource evidence.
- **Specialist handoff** preserves the evidence packet when the cause belongs to a security, data, platform, provider, legal, or regulated boundary.

For case discovery, follow [the case-discovery method](references/trace-to-evaluation-cases.md) instead of the diagnosis workflow below. Select an operation, turn, or conversation as the observation unit before counting, and keep development cases separate from held-out evaluation. Deliver evidence-linked candidate cases and their limits; do not require a reproducer, hypothesis ledger, repair, or rollback owner when no incident exists.

## Diagnosis and recovery working method

1. Bind affected component, scope, authority, impact, timestamps, acceptance condition, reproduction or its absence, baseline, and rollback owner.
2. Read local evidence first. Preserve exact observations and locators; distinguish observed facts, derived values, hypotheses, proposals, and unresolved conflict. When another person or later session must replay the failure, use [reproducible bug packets](references/reproducible-bug-packets.md).
3. Rank hypotheses and run one predeclared reversible check at a time. Record negative results so an eliminated explanation does not silently return.
4. Compare expected and actual behavior, then propose the smallest repair or recovery that can be independently checked. If implementation is authorized, change one bounded surface and rerun the reproducer and regression checks.
5. Keep production mutation, destructive repair, credentials, external systems, background monitoring, and missing rollback as explicit boundaries requiring another decision.

## Deliverable and finish

For diagnosis and recovery, return route, scope, impact, evidence, hypothesis ledger, checks and results, uncertainty, proposed or performed effect, rollback, owner, and acceptance state. Finish after one bounded diagnosis, repair, recovery plan, refusal, or handoff. The durable elimination pattern is in [methods.md](references/methods.md).

If reproduction is unavailable, return the smallest fixture or observation needed to obtain it and stop the affected conclusion at unknown. Do not substitute urgency, a familiar symptom, or a successful restart for causal evidence.

A diagnosis is a checkpoint when the user also requested an authorized local repair. Once the cause and rollback are sufficiently evidenced, apply the bounded fix and rerun the reproducer without requesting permission already supplied. Pause only for missing authority or material safety, rollback, or evidence risk.

Example: reproduce a stale-cache failure, patch the invalidation boundary, rerun cold/warm and recovery cases, and preserve the eliminated hypotheses with the repair receipt.
