---
name: eternities-phoenix
description: Turn reproducible failures, incidents, degradations, and performance questions into bounded diagnoses, recovery plans, or specialist handoffs.
---

# Eternities Phoenix

Phoenix is the diagnosis and recovery route. It protects the investigation from urgency-driven guesses by keeping reproduction, baseline, impact, hypotheses, reversible checks, rollback, and acceptance visible. It can implement an authorized local repair when the proof and recovery boundary are clear.

## Choose the route

- **Diagnosis and reproduction** compares supplied or locally reproducible behavior with an expected invariant.
- **Incident triage** classifies impact, scope, timeline, evidence, and owner while preparing a local coordination packet.
- **Recovery planning** chooses the smallest reversible intervention with preconditions, rollback, validation, and stop conditions.
- **Observability** inspects supplied telemetry or designs bounded instrumentation tied to a question.
- **Performance analysis** compares a stable workload and baseline with repeated measurements, units, percentiles, and resource evidence.
- **Specialist handoff** preserves the evidence packet when the cause belongs to a security, data, platform, provider, legal, or regulated boundary.

## Working method

1. Bind affected component, scope, authority, impact, timestamps, acceptance condition, reproduction or its absence, baseline, and rollback owner.
2. Read local evidence first. Preserve exact observations and locators; distinguish observed facts, derived values, hypotheses, proposals, and unresolved conflict. When another person or later session must replay the failure, use [reproducible bug packets](references/reproducible-bug-packets.md).
3. Rank hypotheses and run one predeclared reversible check at a time. Record negative results so an eliminated explanation does not silently return.
4. Compare expected and actual behavior, then propose the smallest repair or recovery that can be independently checked. If implementation is authorized, change one bounded surface and rerun the reproducer and regression checks.
5. Keep production mutation, destructive repair, credentials, external systems, background monitoring, and missing rollback as explicit boundaries requiring another decision.

## Deliverable and finish

Return route, scope, impact, evidence, hypothesis ledger, checks and results, uncertainty, proposed or performed effect, rollback, owner, and acceptance state. Finish after one bounded diagnosis, repair, recovery plan, refusal, or handoff. The durable elimination pattern is in [methods.md](references/methods.md).

If reproduction is unavailable, return the smallest fixture or observation needed to obtain it and stop the affected conclusion at unknown. Do not substitute urgency, a familiar symptom, or a successful restart for causal evidence.

A diagnosis is a checkpoint when the user also requested an authorized local repair. Once the cause and rollback are sufficiently evidenced, apply the bounded fix and rerun the reproducer without requesting permission already supplied. Pause only for missing authority or material safety, rollback, or evidence risk.

Example: reproduce a stale-cache failure, patch the invalidation boundary, rerun cold/warm and recovery cases, and preserve the eliminated hypotheses with the repair receipt.
