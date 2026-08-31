# Aegis evaluator v2 retrospective shadow report

status: `retrospective-shadow-ineligible`

evaluator package: `5eb0360cb487f3525ffcc233dd4eb1ebc0754f89ec434a9cf9b8c96e5d0292f7`
shadow replay: `cab71a0bf4c889ccbb2b60ae2502adfd1c9dd3829a5605f341723e1951b002ca`
source trial: `0c19530c4e6b8ddc5588e832f82e719fbf4069a547032251234d3d9420959a76`

| variant | archived v1 score | v2 score | v2 detected cases | v2 critical regression |
|---|---:|---:|---:|---|
| raw | 26 / 30 | 27 / 30 | 3 | no |
| guardrail | 27 / 30 | 28 / 30 | 3 | no |
| method | 3 / 30 | 29 / 30 | 3 | no |
| reviewer | 26 / 30 | 27 / 30 | 3 | no |
| combined | 0 / 30 | 29 / 30 | 3 | no |

this is a deterministic replay of already-produced artifacts. it repairs evaluator
interpretation only. it is not a preregistered v2 trial, creates no model observation,
and cannot enter a ledger, promote a profile, trigger lifecycle action, or activate
godagents. no historical v1 byte is rewritten.
