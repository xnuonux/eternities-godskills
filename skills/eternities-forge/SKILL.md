---
name: eternities-forge
description: Orchestrate multi-stage, high-consequence software delivery from settled intent through implementation, review, evidence, and integration. Use when several engineering workflows must cooperate across a meaningful change. Do not use for routine edits or when one exact installed process skill fully covers the task.
---

# Eternities Forge

Deliver a consequential software change through the smallest sufficient engineering chain, with a visible proof obligation for every completion claim.

Read [references/operating-contract.md](references/operating-contract.md) before selecting a route. Forge coordinates installed process skills; it does not replace their detailed procedures.

## Entry gate

Invoke only when the requested outcome spans multiple engineering phases or carries integration, migration, authority, or regression risk that one narrow workflow cannot contain.

Yield when:

- only a design or specification is needed: use `eternities-architect` or the exact planning skill;
- an approved written plan merely needs execution: use `executing-plans`;
- an unexplained failure needs diagnosis: use `systematic-debugging` first;
- one small behavior change is adequately covered by `test-driven-development`;
- implementation is already verified and only branch disposition remains: use `finishing-a-development-branch`.

## Forge loop

1. **Bind the charge.** State the requested outcome, repository, authority, exclusions, acceptance evidence, and integration destination. Distinguish implementation from deployment or external mutation.
2. **Classify the route.** Choose feature, regression, refactor, or risky integration. Select only the process skills needed for that route. Never invoke every dependency by default.
3. **Establish the baseline.** Inspect current behavior, tests, repository instructions, working-tree state, and relevant interfaces. Preserve unrelated user changes. For defects, require a demonstrated root cause before entering implementation.
4. **Create the proof surface.** Name the production change that would make each test fail. Use `test-driven-development` when practical behavior can be automated. For configuration or generated artifacts, define the direct validation that replaces a test.
5. **Implement by bounded slices.** Each slice has one observable result, one verification command, and one rollback boundary. Keep speculative abstractions and unrelated cleanup outside the charge.
6. **Track claims.** Maintain a compact claim-to-evidence ledger: changed behavior, supporting test or inspection, unresolved risk, and authority still required. A command exit code without relevant assertions is not sufficient evidence.
7. **Review proportional to risk.** Request independent review for major, security-sensitive, cross-cutting, or integration-heavy changes. Evaluate findings technically; repair critical and important defects before continuing.
8. **Verify and integrate.** Run focused checks, then the full relevant suite. Confirm diff scope, generated artifacts, profile or migration targets, and rollback. Hand branch integration to `finishing-a-development-branch` when that boundary exists.

## Non-negotiable controls

- no production behavior before an observed failing test when a practical test surface exists;
- no fix before root-cause evidence;
- no destructive cleanup outside exact verified targets;
- no external write, deployment, publication, or account change without matching authority;
- no completion claim from stale, partial, or unrelated test output;
- no recursive routing back to Eternities Forge.

## Termination

Forge stops when the requested behavior satisfies its acceptance evidence, the relevant full verification is fresh, review obligations are resolved, integration state is explicit, and remaining risks or authority gaps are named. If one condition cannot be met, return the exact blocker and preserved state instead of rounding the work up to complete.

