---
name: bounded-parametric-design-iteration
description: Use when an existing solved parametric design can be improved through one bounded parameter change, comparable solver evidence, constraint checks, and an accept-or-rollback decision.
---

# Bounded parametric design iteration

Use this entrypoint to advance an existing CAD or CAE design while preserving causal attribution. It assumes a solved baseline and editable parameters; new geometry authoring and validation of an unchanged simulation belong to different workflows.

## Freeze the baseline

Record the exact model, parameter values and units, solver and setup, mesh policy, material, loads, boundary conditions, postprocessing method, objective metrics, hard constraints, result artifacts, credibility tier, and known uncertainty. Preserve a rollback point and digests for the model, setup, and result. A screenshot, critique, surrogate, or plausible scalar is not interchangeable with an executed solver result.

## Run a finite iteration

1. Select one change. State the hypothesis, parameter, old and proposed values, safe bounds, dependency scope, expected metric direction, constraints at risk, and remaining iteration budget. If several parameters must move together, declare that attribution is weaker.
2. Preflight units, parameter ownership, dependent geometry, interfaces, topology, manufacturability signals, mesh readiness, solver settings, approval state, and rollback availability.
3. Apply only the declared mutation. Reinspect the model before solving. Abort or restore the baseline when the change creates invalid geometry, changes the problem definition, or leaves the declared parameter scope.
4. Rerun the same evidence-producing solver path. Preserve logs, convergence state, result files, extraction code, and credibility tier. A surrogate can prioritize candidates but cannot close the iteration.
5. Compare baseline and candidate with the same metric definition, units, setup, evidence tier, and acceptance rule. Report hard-constraint regressions and uncertainty with any gain.
6. Accept only when the target or predeclared improvement rule passes and no hard constraint regresses. Otherwise retain a rejected branch or roll back, then append the iteration receipt.

If the task includes an authorized solver or model write, use that authority only for the declared iteration. Do not silently spend compute, change loads, or widen bounds to rescue a failed candidate.

## Evidence and limits

Each iteration receipt should include baseline and change digests, approvals, preflight checks, solver/result digests, metric delta, uncertainty, constraint verdict, accept/rollback decision, and remaining budget. Stop on target met, budget exhausted, denied approval, stale or incomparable evidence, nonconvergence, invalid geometry, unsafe bounds, or missing rollback.

The result is an evidence-backed design iteration, not proof of optimality, manufacturability, physical safety, or certification. Hardware claims require representative physical validation and a separate release decision.

## Common failure modes

- Comparing a solver result with a surrogate as if both had the same credibility.
- Changing geometry and boundary conditions together without declaring attribution loss.
- Accepting a lower-stress result that violates a hard displacement or interface constraint.
- Reusing stale results after the mesh or solver setup changed.
- Continuing after rollback evidence is unavailable.
