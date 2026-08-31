# Adaptive Evidence Portfolio v1 Structural Report

## disposition

The cross-trial portfolio protocol reduced two separately verified ledgers into one task-level report. This is a structural fixture, not model-quality evidence and not an activation decision.

- plan: `8500f4dba507c097184610931f2390d79bb767075fd501b63bd11d7c7d041b59`
- preregistration witness: `9b0216dbb965ee2ede1f35bfeeebecfe264f0779a16d1a5227b84cc53872fc5f`
- witness trust root: `2f9acbb8d90ea560bdd4bb650edb89af3b293e0602f078ca1bcb1d28cbc1ca93`
- report: `43fd6185131e28da34131890a809bf600e68182aca616b99a489895ed6fc80e5`
- preregistered tasks: 2
- completed tasks: 2
- independent ledger digests: 2
- candidate variants passing the structural evidence gate: guardrail

## task granularity

The fixture ledgers contain 3 and 3000 internal oracle cases. The portfolio report contains exactly two outcomes per candidate variant. Internal case counts are digest-bound but are not copied into or summed by the reducer.

## worst-task gate

The method fixture wins both task-level comparisons but carries one critical regression. Its worst-task gate therefore fails. This proves that aggregate wins cannot hide one catastrophic task.

## authority boundary

The report is reporting-only. It emits no profile promotion, lifecycle action, activation request, Godagents change, or authority expansion. The committed fixture key proves deterministic verifier behavior only. Production chronology requires a separately operated witness authority whose trust root is pinned by the host and whose clock and refusal policy are trusted.
