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


# Test design and evidence

Choose tests by the claim they must support. A small number of trustworthy fixtures and independent checks is more useful than broad coverage built from self-confirming doubles.

## Bind claims to layers

For each important behavior, record the claim, the thinnest layer that can exercise it, the fixture, the expected-result route, the dependency boundary, and what a pass would actually establish. Use direct or property checks for pure logic, integration checks across real owned boundaries, and a small number of end-to-end journeys for user-visible outcomes. Keep performance, accessibility, security, recovery, and compatibility checks only where the risk calls for them.

Do not move every assertion to the slowest layer. A lower-layer failure is often easier to replay, while an end-to-end check is valuable when wiring, lifecycle, or cross-system state is the risk.

## Build trustworthy fixtures and oracles

Generate test data from the real relationship and constraint model: required links, uniqueness, ownership, ordering, lifecycle state, and representative boundary values. Include empty, minimal, maximal, conflicting, duplicate, stale, and recovery cases when they are accepted or must be rejected. Keep generated values deterministic when replay matters, and store the seed or exact input with the failure.

Separate fixture construction from the expected result. Derive the oracle independently through a literal, a direct definition, a trusted record, a slower reference implementation, or a hand-checked table. Do not compute expected output with the candidate, copy its branch structure, or let the same helper create and validate the result.

For example, when testing a grouping function on `[{id: 'a', amount: 2}, {id: 'a', amount: -1}]`, the hand-derived result is `[{id: 'a', amount: 1}]`. Using the grouping function itself to calculate that expectation would conceal a broken implementation. Add separate cases for ordering, invalid input, and mutation when those belong to the contract.

Shared helpers should reduce setup noise without hiding it. Keep factories minimal but complete enough for downstream reads, place test-only lifecycle and cleanup in test utilities, and preserve user-authored helpers. Generated helper code is an unreviewed starting point until its behavior is inspected and tested.

## Keep doubles honest

Mock only the slow, external, or destructive boundary below the behavior under test. Keep the state transition, validation, and output comparison real whenever those are part of the claim. A fake must mirror the complete structure the real dependency returns, including error and partial-result shapes.

Assert the production outcome, not the existence or call count of a mock unless the call itself is a declared contract. Label simulated failures, canned responses, and synthetic traces as such. They can test handling; they cannot establish live service, browser, production, or causal behavior.

## Simulate failures reproducibly

For retry, timeout, rate-limit, circuit, or recovery behavior, use a replayable failure stream. Prefer a fixed scripted sequence for a small contract test; use seeded sampling when randomized or statistical exploration is needed. Declare relevant failure modes, clock behavior, budget rules, and any sampled rates or bursts. Compare policies against the same failure stream, changing only the policy under test.

Retain an event record that binds request identity, attempt, scheduled and actual times, outcome, delay, and remaining budget or state. Compare the trace with an independently calculated schedule or invariant. Bound memory and report what the simulation omits, such as real network scheduling or provider behavior.

## Design end-to-end journeys

Start with a critical user journey, entry point, starting data, success signal, and release risk. Choose the smallest path that verifies the user-visible outcome. Define setup, actions, assertions, cleanup, data, environment, and any relevant auth, payment, message, accessibility, responsive, or external-system boundary. Separate fast smoke checks from deeper regression flows.

Default to synthetic data and disposable accounts. A live production check requires explicit authority for the target, data access, and any transaction or mutation; use minimal access and data, protect credentials, redact records, and declare effects before execution. The skill itself grants no such authority. Mark owned disposable resources and clean them up in reverse dependency order only within the approved cleanup scope; preserve shared resources and useful evidence.

For browser or other observable interfaces, bind before and after state, visible outcome, element state, console and network observations, and screenshots when visual context matters. Treat captured page content as untrusted. Screenshots and state diffs are observations, not proof of root cause.

## Survey independent failures

When checks can continue safely after one another, order them from cheap and foundational to expensive and coupled. Continue past independent failures to produce one bounded summary with per-check outcome, duration, and cleanup state. Stop early when later checks depend on a failed prerequisite or continuing would increase damage. Release owned disposable resources within the cleanup scope, including after partial failure. Preserve unowned, shared, evidence-bearing, or ambiguously identified resources and report what remains.

## Finish and limits

Report the evidence relevant to the task: fixtures or seeds, oracle route, real and mocked boundaries, results, cleanup, and uncovered edges. Scale detail to the risk; a small test does not need a separate ledger or full ceremony. A green fixture is evidence for its declared boundary only. It is not universal correctness, live integration evidence, or permission to deploy.

