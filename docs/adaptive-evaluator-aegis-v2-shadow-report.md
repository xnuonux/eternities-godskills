# Aegis evaluator v2 retrospective shadow report

status: `retrospective-shadow-ineligible`

evaluator package: `85ea65e9449a3739d10764a202f868be26b99de67cb1165f3897b02ffccf733d`
shadow replay: `f8906ccf90e8990925a0f36e9d82876ae055c776e41ecafa391f238a1e500f8d`
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
