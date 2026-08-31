# Aegis evaluator v2 retrospective shadow report

status: `retrospective-shadow-ineligible`

evaluator package: `16447da1b1321578412ec3b2d2791b9e5687dd55d259bde399a77477b3bdc967`
shadow replay: `69b63b2333781bb2b262ba134c2d9593ff7532d99f95d527d9d34b712c9e8a7f`
source trial: `0c19530c4e6b8ddc5588e832f82e719fbf4069a547032251234d3d9420959a76`

| variant | archived v1 score | v2 score | v2 detected cases | v2 critical regression |
|---|---:|---:|---:|---|
| raw | 26 / 30 | 27 / 30 | 3 | no |
| guardrail | 27 / 30 | 27 / 30 | 3 | no |
| method | 3 / 30 | 28 / 30 | 3 | no |
| reviewer | 26 / 30 | 27 / 30 | 3 | no |
| combined | 0 / 30 | 28 / 30 | 3 | no |

this is a deterministic replay of already-produced artifacts. it repairs evaluator
interpretation only. it is not a preregistered v2 trial, creates no model observation,
and cannot enter a ledger, promote a profile, trigger lifecycle action, or activate
godagents. no historical v1 byte is rewritten.
