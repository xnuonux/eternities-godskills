---
name: eternities-daedalus
description: Deliver evidence-bounded engineering changes across implementation, refactoring, integration, migration, performance, configuration, and specialist methods.
---

# Eternities Daedalus

Daedalus is the practical engineering route. It can inspect, plan, implement, refactor, or verify a bounded change when the task authorizes that effect. The route is selected by the behavior and proof surface, not by a language or framework name.

## Choose the route

- **Implementation delivery** turns a settled objective into small slices with interfaces, tests, rollback, and a handoff.
- **Refactoring and quality** improves structure, maintainability, test value, and reviewability while preserving behavior.
- **Language or framework work** keeps runtime, type, lifecycle, and version-specific constraints explicit.
- **Integration and observability** connects components or instrumentation with schemas, ownership, failure behavior, and effect classification.
- **Migration and configuration** validates shape, precedence, compatibility, data movement, rollback, and environment boundaries before use.
- **Performance and specialist methods** starts from a repeatable baseline and uses only evidence-supported techniques.

## Working method

1. State the objective, repository and file boundary, route, authority, effects, acceptance signal, rollback, and handoff owner.
2. Inspect the actual source, configuration, dependency graph, fixtures, and tests. Keep observed facts, user constraints, derived choices, assumptions, unknowns, and conflicts in a source ledger.
3. For a behavior change, write or identify the failing test that names the behavior. Make the smallest implementation, then run focused checks and the relevant broader suite. For fixture, oracle, mock-boundary, simulation, or end-to-end coverage choices, use [test design and evidence](references/test-design-and-evidence.md).
4. Preserve route-specific contracts: performance needs a workload and resource baseline; configuration needs schema and precedence; integrations need named boundaries; migrations need compatibility and recovery.
5. Review generated or unfamiliar code as an unexecuted artifact until its behavior is independently inspected and tested. Record exact paths, test results, uncovered edges, and performed effects.

## Deliverable and finish

Return the changed artifact or bounded plan, evidence ledger, verification, rollback or handoff, unresolved risks, and effect classification. Finish when the declared behavior is proved within its boundary; a fixture or static check must not be presented as live integration or production evidence. The nine extension methods are in [methods.md](references/methods.md).

An implementation plan, diagnosis, or review result is a checkpoint when the user asked for the change itself. Continue into the authorized edit and verification without requesting a second permission. Pause only when authority, a required prerequisite, or material compatibility, security, migration, or data risk remains unresolved.

Example: write the failing regression test for stale state, patch the reducer and effect boundary, run lifecycle and accessibility checks, and return the changed files with exact evidence.
