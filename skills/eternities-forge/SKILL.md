---
name: eternities-forge
description: Orchestrate multi-stage, high-consequence software delivery from settled intent through implementation, review, evidence, and integration. Use when several engineering workflows must cooperate across a meaningful change. Do not use for routine edits or when one exact installed process skill fully covers the task.
---

# Eternities Forge

Deliver a consequential software change through the smallest sufficient engineering chain, with a visible proof obligation for every completion claim.

Read [references/operating-contract.md](references/operating-contract.md) before selecting a route. Forge coordinates installed process skills; it does not replace their detailed procedures.

## Telos closure route

When the user explicitly asks for a perfection, ideal-bar, or structural-closure pass on consequential work, read [the Telos closure contract](references/telos-closure.md). Telos is an opt-in adversarial closure route, not the default delivery loop. It seeks evidence that the named defect shape or unsupported claim has been structurally closed across its blast radius, within declared budgets. It returns `closed`, `saturated`, `blocked`, or `budget-exhausted`; it never claims literal perfection.

## v2 portable workflow extensions

For consequential work needing coordinated planning, delegation, execution, review,
and handoff, use this agent-neutral spine:

1. bind outcome, constraints, authority, exclusions, acceptance evidence, and rollback
2. resolve ambiguity before implementation with a settled decision record
3. delegate only genuinely independent work with disjoint ownership and merge bounds
4. execute approved plans in bounded slices with a verification command per slice
5. preserve a source-labeled handoff containing state, evidence, risk, and next action; for a real compaction, session, or parallel-agent boundary, use Mnemosyne's attested checkpoint contract
6. finish with fresh verification, review disposition, and an explicit integration or rollback decision

Completion claims require direct evidence. Tests and fixtures prove contracts and
routing only, not live model behavior, reviewer independence, legal or security
conformance, production readiness, or external effects. Conflicting instructions,
stale evidence, missing authority, missing preconditions, and failed critical gates
fail closed and name the deferred specialist or human decision.

The portable route composes at most three capabilities: planning, execution, and
verification/review. It never recursively routes to Forge, invents authority,
publishes, deploys, merges, or performs external actions.

## Entry gate

Invoke only when the requested outcome spans multiple engineering phases or carries integration, migration, authority, or regression risk that one narrow workflow cannot contain.

Yield when:

- only a design or specification is needed: use `eternities-architect` or the exact planning skill;
- an approved written plan merely needs execution: use `executing-plans`;
- an unexplained failure needs diagnosis: use `systematic-debugging` first;
- one small behavior change is adequately covered by `test-driven-development`;
- implementation is already verified and only branch disposition remains: use `finishing-a-development-branch`.
- ordinary proportional review is sufficient and no explicit ideal-bar closure was requested: use `requesting-code-review`.

## Forge loop

1. **Bind the charge.** State the requested outcome, repository, authority, exclusions, acceptance evidence, and integration destination. Distinguish implementation from deployment or external mutation.
2. **Classify the route.** Choose feature, regression, refactor, or risky integration. Select only the process skills needed for that route. Never invoke every dependency by default.
3. **Establish the baseline.** Inspect current behavior, tests, repository instructions, working-tree state, and relevant interfaces. Preserve unrelated user changes. For defects, require a demonstrated root cause before entering implementation.
4. **Create the proof surface.** Name the production change that would make each test fail. Use `test-driven-development` when practical behavior can be automated. For configuration or generated artifacts, define the direct validation that replaces a test.
5. **Implement by bounded slices.** Each slice has one observable result, one verification command, and one rollback boundary. Keep speculative abstractions and unrelated cleanup outside the charge.
6. **Track claims.** Maintain a compact claim-to-evidence ledger: changed behavior, supporting test or inspection, unresolved risk, and authority still required. A command exit code without relevant assertions is not sufficient evidence.
7. **Seal real boundaries.** At compaction, session handoff, parallel-agent transfer, or a major earned checkpoint, write one task-scoped, parent-bound, host-attested continuity packet. Do not inject it before every tool call. The receiving agent verifies task identity, signature, chain, freshness, authority, and context budget before using only its latest state.
8. **Review proportional to risk.** Request independent review for major, security-sensitive, cross-cutting, or integration-heavy changes. Evaluate findings technically; repair critical and important defects before continuing.
9. **Verify and integrate.** Run focused checks, then the full relevant suite. Confirm diff scope, generated artifacts, profile or migration targets, and rollback. Hand branch integration to `finishing-a-development-branch` when that boundary exists.

## Non-negotiable controls

- no production behavior before an observed failing test when a practical test surface exists;
- no fix before root-cause evidence;
- no destructive cleanup outside exact verified targets;
- no external write, deployment, publication, or account change without matching authority;
- no completion claim from stale, partial, or unrelated test output;
- no recursive routing back to Eternities Forge.

## Termination

Forge stops when the requested behavior satisfies its acceptance evidence, the relevant full verification is fresh, review obligations are resolved, integration state is explicit, and remaining risks or authority gaps are named. If one condition cannot be met, return the exact blocker and preserved state instead of rounding the work up to complete.

## Contended coordination and delegation envelopes

When parallel work shares an integration key or crosses an agent boundary, read [the first-party coordination contract](references/first-party-contracts.md). Lease only the contended key, keep unrelated path claims concurrent, require fresh integration state, and reject malformed or over-authorized delegation envelopes before dispatch.
