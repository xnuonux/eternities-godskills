---
name: bounded-parametric-design-iteration
description: Improve an existing parametric CAD/CAE design through a bounded change, preflight, rerun, compare, and accept-or-rollback loop. Use when a solved baseline, editable parameters, explicit targets, comparable solver evidence, and mutation authority exist. Do not use for new geometry authoring, open-ended optimization, setup invention, unequal evidence tiers, or physical certification.
---

# Bounded parametric design iteration

Advance one existing design against explicit engineering targets without losing causal attribution. Keep geometry mutation, solver execution, evidence comparison, and acceptance as separate gates.

## Entry contract

Require an identified baseline model and result set, editable parameters with units and safe ranges, objective metrics and direction, hard constraints, a finite iteration budget, and authorized mutation and local compute. Record the solver, setup, mesh policy, material, loads, boundary conditions, postprocessing method, and evidence credibility. If the target is already met, no safe parameter exists, the setup is incomplete, or comparable evidence cannot be produced, stop before mutation.

This capability assumes a solved baseline. Route new CAD authoring elsewhere. Route validation of an unchanged simulation to physics-constrained numerical validation. Never invent a material, load, constraint, tolerance, manufacturing limit, or acceptance threshold.

## Freeze the baseline

Bind the model, parameter values, solver configuration, result artifacts, metrics, units, credibility tier, and known uncertainty to exact local evidence. Preserve a rollback point before any write. A screenshot, critique, surrogate, or plausible scalar is not interchangeable with an executed solver result.

## Iterate

1. Select one change per iteration. State the hypothesis, parameter, old and proposed values, bound source, expected metric effect, and constraints at risk. Coupled changes require an explicit declaration that attribution will be weaker.
2. Preflight units, parameter scope, dependency effects, geometry validity, approval state, solver readiness, and rollback availability.
3. Obtain approval for the declared mutation and solver effects. Approval for one iteration does not authorize another or authorize external deployment.
4. Apply only the declared change. Reinspect topology, interfaces, dimensions, manufacturability signals, and mesh readiness. Abort or rollback when the mutation creates an invalid or materially different problem.
5. Rerun the same evidence-producing path. Preserve solver logs, convergence state, result artifacts, extraction method, and credibility. Surrogates may prioritize candidates but cannot close an iteration.
6. Compare baseline and candidate like-for-like: same metric definition, units, boundary conditions, credibility class, and acceptance rule. Report constraint regressions and uncertainty with the apparent gain.
7. Accept the candidate only when the target or bounded improvement rule passes and no hard constraint regresses. Otherwise rollback or retain it as a rejected branch. Append an iteration ledger either way.

## Ledger and termination

For every iteration record baseline digest, change digest, approvals, structural checks, solver and result digests, metric delta, uncertainty, credibility, constraint verdict, accept-or-rollback decision, and remaining budget. Stop on target met, budget exhausted, denied approval, missing or stale evidence, solver failure, nonconvergence, unsafe bounds, invalid geometry, constraint regression, or absent rollback.

The output is a bounded design-iteration receipt, not proof of optimality. It does not grant write or compute authority, does not prove manufacturability or physical safety, and does not provide physical certification. Hardware claims require representative physical validation; production release requires a separate authorized gate.
