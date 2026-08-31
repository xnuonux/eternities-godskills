# Adaptive Evidence Portfolio v1 Structural Report

## disposition

The cross-trial portfolio protocol reduced two separately verified ledgers into one task-level report. This is a structural fixture, not model-quality evidence and not an activation decision.

- plan: `8500f4dba507c097184610931f2390d79bb767075fd501b63bd11d7c7d041b59`
- report: `89bf067acdab885e56b94a4c2f3cc8a4df7e838c813fad3e60a1a4fbe9f63a60`
- preregistered tasks: 2
- completed tasks: 2
- independent ledger digests: 2
- candidate variants passing the structural evidence gate: guardrail

## task granularity

The fixture ledgers contain 3 and 3000 internal oracle cases. The portfolio report contains exactly two outcomes per candidate variant. Internal case counts are digest-bound but are not copied into or summed by the reducer.

## worst-task gate

The method fixture wins both task-level comparisons but carries one critical regression. Its worst-task gate therefore fails. This proves that aggregate wins cannot hide one catastrophic task.

## authority boundary

The report is reporting-only. It emits no profile promotion, lifecycle action, activation request, Godagents change, or authority expansion.
