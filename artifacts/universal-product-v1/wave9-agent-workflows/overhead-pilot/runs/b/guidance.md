---
name: eternities-forge
description: Coordinate multi-stage engineering delivery from settled intent through implementation, review, verification, and explicit integration.
---

# Eternities Forge

Forge is the coordination route for changes that need more than one engineering phase or cross-boundary proof. It composes a small chain of planning, execution, review, and verification; it does not make an unresolved design, permission, or deployment decision disappear.

## Choose the route

- **Feature delivery** carries a settled outcome through implementation, tests, review, and integration.
- **Regression repair** keeps reproduction, root-cause evidence, fix, and regression proof in one chain.
- **Refactor** protects behavior with a baseline while structure changes.
- **Risky integration** adds isolation, dependency closure, rollback, review, and fresh integration state.
- **Closure review** is an optional adversarial pass when the user names a specific defect shape or ideal-bar question. It returns the bounded state supported by evidence, not literal perfection.
- **Model-feedback refinement** uses a bounded generator/reviewer loop when critique can improve an artifact; the optional card in [methods.md](references/methods.md) keeps model judgments separate from verified acceptance.

## Working method

1. Bind outcome, repository, authority, exclusions, acceptance evidence, rollback, integration destination, and owners.
2. Resolve design ambiguity before editing. Delegate only independent slices with disjoint paths, explicit inputs, outputs, budgets, and termination conditions.
3. Establish the baseline: current behavior, tests, working-tree state, relevant interfaces, and any known failure. Preserve unrelated changes.
4. Give each slice one observable result, one proof command or inspection, and one rollback boundary. Track claim-to-evidence rows instead of relying on completion narration.
5. Review correctness, security, performance, failure behavior, compatibility, maintainability, test honesty, and diff scope in proportion to risk. Recheck integration state immediately before combining work.
6. On failure, preserve exact evidence and return to the smallest responsible slice. When a scoped effect is already authorized and its preconditions and rollback are clear, execute it within the declared target and verify the receipt. Stop before the effect only when authority is missing or material risk or a required precondition remains unresolved; otherwise hand off the exact payload as a normal boundary artifact.

## Deliverable and finish

Return a stage ledger with decisions, slices, evidence, review disposition, integration or rollback decision, unresolved risks, and next owner. Finish only when fresh relevant verification covers the acceptance contract and the integration state is explicit. Use [methods.md](references/methods.md) for slice and closure templates.

A stage ledger is a checkpoint, not automatically the end of the user's task. If implementation, verification, or another scoped stage was already requested and authorized, continue through it without asking for separate permission. Pause only for missing authority or material unresolved risk.

Example: after settling a migration slice, apply the authorized local schema change, run compatibility and rollback fixtures, and record the integration result instead of returning only the plan.

# Forge method cards

## Slice ledger

For each stage record the intended observable result, exact path or boundary, prerequisite decision, pre-change proof surface, smallest change, focused verification, remaining dependency, rollback point, and owner. Independent work may proceed only when path claims and integration keys do not overlap. Refresh repository state before integration and preserve conflicts rather than averaging them.

## Bounded closure review

When a named defect shape needs an adversarial pass, bind the surface, invariant, downstream consumers, probes, budget, and mutation boundary. Try distinct seams—inputs, ordering, state, persistence, concurrency, recovery, permissions, migration, and documentation claims—then change one surface and rerun probes. Return closed, saturated, blocked, or budget-exhausted within the declared boundary; never call finite work perfect.

## Bounded model-feedback refinement

Use a loop only when a specific critique can change the artifact. Fix the task,
acceptance criteria, model roles and attempt/time/cost budget before iteration.
Run deterministic checks where available; ask a model reviewer for concrete
defects and evidence, not an ungrounded quality number. A typed pass/fail result
is still an opinion unless its acceptance claims have been independently checked.

Carry the current candidate and necessary feedback forward without accumulating
irrelevant history. Keep the best verified candidate, not automatically the last
one. Stop on accepted criteria, no actionable feedback, repeated non-improvement,
unavailable evaluation or exhausted budget; report which occurred. Recheck every
changed requirement and retained invariant after revision. Feedback does not
authorize a new tool, paid run or deployment. For comparative quality claims use
held-out tasks and an appropriately independent evaluation, not the same judge
whose preferences guided all the revisions.

# Optional workflow overhead check

Use this only when repeated context, tool work, or coordination is materially costly, or the user asks to simplify it. A small ordinary task needs no extra ceremony.

Identify the useful outcome and the checks that must survive. Look for repeated reads, duplicated work, oversized output, unnecessary delegation, and details loaded before they are needed. Use the smallest relevant input slice and keep conditional detail out of the normal path. Prefer a reversible simplification over another orchestration layer.

No historical timing or token baseline is required to inspect duplication, implement an authorized improvement, or test correctness. Distinguish those observations from measured savings. If a consequential choice depends on performance, compare matched conditions with the same acceptance contract; record available time, usage and quality, leaving missing costs unknown. Do not add cached tokens to totals that already include them.

Preserve permissions, validation, failure reporting, and required review. Less work is not better when it hides failures or weakens the contract. Stop tuning when the useful result is verified, evidence no longer supports another change, or the declared budget is reached. Report the decision and material uncertainty briefly; do not demand a separate overhead report for every task.
