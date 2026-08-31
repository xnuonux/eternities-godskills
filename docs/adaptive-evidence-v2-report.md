# adaptive evidence v2 report

status: `experimental-canary`

## fixture mechanics

the deterministic fixture admitted 5 digest-bound rows across raw, guardrail, method, reviewer, and combined conditions.
its profile remains `ineligible` with `0` promotable rows, and the lifecycle request is `rejected`.
fixture scores exercise mechanics only. they are not model-quality evidence and cannot promote activation.

## historical real evidence

the reviewed Muse bridge retains 4 prior comparisons from commit `265d40d121463de5f3b6215bf513db851ccb8f3b`.
its status is `historical-ineligible` because v2 preregistration, exact environment identity, and isolated five-condition coverage were absent.
historical evidence remains useful context but is not retroactive preregistration.

## fresh model evidence

the preregistered Aegis matrix completed all five isolated Terra-high conditions against one frozen task, environment, prompt constructor, evaluator, and executable activation trust root.

| condition | score / 30 | result against raw | critical regression | evidence level |
| --- | ---: | --- | --- | --- |
| raw | 26 | baseline | yes | model |
| guardrail | 27 | win | yes | model |
| method | 3 | loss | yes | model |
| reviewer | 26 | tie | yes | model |
| combined | 0 | loss | yes | model |

guardrail scored 27 against raw 26, but all five conditions triggered the frozen critical-regression predicate. the derived profile is therefore `ineligible`, recommends `guardrail`, and the attempted method promotion was `rejected` with the active mode remaining `native`.

the method and combined scores expose a post-dispatch evaluator limitation: its lexical taxonomy did not recognize some semantically correct hyphenated finding language. the evaluator remained frozen and no subject was rerun or rescored after this result was known. these scores characterize this exact verifier and task, not universal capability quality.

## lifecycle trust boundary

lifecycle authorization is verified under a host-pinned Ed25519 public-key root and exact policy digest. the authorization signs the profile, bindings, action, modes, grant, actor, and validity interval; the resulting lifecycle decision receives a separate signature before any evidence-derived activation may consume it.

the checked fixture signer is deterministic test material only, not a production authority. direct activation calls cannot trust a caller-supplied profile, and possession of an authorization record without a trusted signature over the exact lifecycle decision cannot self-apply promotion.

## boundaries

this report proves deterministic structural mechanics plus one preregistered task and model matrix. it does not prove universal behavior, cross-model equivalence, global activation, or external authority.
activation v1 remains the rollback path.
