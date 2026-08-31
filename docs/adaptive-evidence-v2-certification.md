# adaptive evidence v2 certification

certified: 2026-08-31

disposition: `certified-adaptive-engine-canary`

proof level: `single-task-single-model-engine-canary`

## certified scope

this disposition covers the additive adaptive evidence v2 engine, its closed
schemas and deterministic builders, one preregistered five-condition Aegis
matrix, append-only evidence and profile derivation, and the host-pinned
lifecycle trust boundary.

the independently reviewed implementation head is
`6d5b9475f5182f2e7992c9df41dd5ba6587e4cd8` on branch
`feat/adaptive-evidence-v2`. the aggregate build receipt is
`receipts/adaptive-evidence-v2.json`, with logical receipt digest
`2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d`
and file SHA-256
`7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a`.

the generated receipt and report retain status `experimental-canary`. they are
deterministic evidence and do not certify themselves. this document records
the independent bounded disposition without rewriting the reviewed receipt.

## acceptance disposition

all phase-2 engine gates pass within the stated proof limit.

| # | condition | disposition | evidence |
|---:|---|---|---|
| 1 | trusted phase-1 and activation-executable roots remain exact | pass | phase 1 remains certified and executable release `f6b828ffbea29cf28cba751d4438e5c41a8deb2d` remains the frozen matrix trust root |
| 2 | the real trial was preregistered before dispatch | pass | the task, comparison policy, environment, model profile, constructor, evaluator, layer bytes, and five variants were frozen before any subject artifact |
| 3 | all five subjects used one exact model profile and isolated disclosure | pass | raw, guardrail, method, reviewer, and combined used `gpt-5.6-terra` at high effort, no tools, and condition-specific prompt construction |
| 4 | every artifact and observation is digest-bound | pass | five exact model artifacts and five deterministic evaluator records replay into one verified append-only ledger |
| 5 | fixture and historical evidence cannot promote | pass | fixture evidence derives zero promotable rows, and the historical Muse bridge remains `historical-ineligible` |
| 6 | stale identity or lineage cannot activate | pass | freshness checks cover all seven identity fields plus policy, task, comparison, trial, and ledger bindings |
| 7 | critical regressions block promotion | pass | all five model rows triggered the frozen critical-regression predicate, so method promotion was rejected and active mode remained native |
| 8 | lifecycle authority cannot self-authorize | pass | authorization and lifecycle decisions require separate Ed25519 signatures under one host-pinned public-key root |
| 9 | direct profile injection cannot select evidence-derived method | pass | the direct helper treats caller profiles as untrusted; only the trusted factory can consume an applied and separately attested lifecycle decision |
| 10 | historical and new tests pass | pass | 55 focused compatibility tests and 699 passed full-repository tests with zero failures before certification |
| 11 | independent review is clear | pass | the same reviewer reproduced the original defects, inspected the repair, exercised adversarial and positive controls, and found no unresolved critical or important defect |
| 12 | legacy activation and phase-1 bytes remain unchanged | pass | protected v1 blobs, all phase-1 checked outputs, and every existing `skills/*/SKILL.md` entrypoint are unchanged |

## exact matrix result

the frozen matrix result is negative evidence about this exact task and
evaluator, not a quality promotion:

| condition | score / 30 | result against raw | critical regression |
|---|---:|---|---|
| raw | 26 | baseline | yes |
| guardrail | 27 | win | yes |
| method | 3 | loss | yes |
| reviewer | 26 | tie | yes |
| combined | 0 | loss | yes |

the resulting ledger digest is
`d8fe5feabc14a7614550142e5028bf3ec5ffc7cdb6585d7c205b6847af75e133`.
the profile digest is
`1747cb530ed1c1fcf3b83a386f38537e96a3ccd380c9de7649248a40e8677a06`.
the profile is `ineligible`, recommends `guardrail`, and has failed gate
`criticalRegressions`. the attempted method lifecycle action is `rejected`,
and the resulting mode remains `native`.

the method and combined scores preserve a known post-dispatch limitation in
the frozen evaluator: its lexical taxonomy did not recognize some semantically
correct hyphenated finding language. no task, threshold, evaluator, artifact,
observation, or subject result was changed or rerun after that limitation was
known. universal superiority is not proved, certified, or claimed.

## lifecycle trust boundary

the lifecycle controller and evidence-aware activation compiler are created by
the host with an expected policy digest and a host-pinned Ed25519 public-key
map. individual decision calls cannot supply replacement trust roots.

an authorization signs the exact profile digest, binding-set digest, action,
prior and requested modes, grant, actor, issue time, and expiry time. the
resulting lifecycle decision is separately signed. evidence-derived activation
recomputes that decision digest and requires the exact profile, current
bindings, `promote` action, `applied` status, recommended mode, signer key, and
trust-root digest before it may select method or review.

the checked lifecycle decision digest is
`86e3bfccc472d0ea7b04dccfe5a2930db665912d80a91142eeffa53d1539dde7`.
its separate attestation binds that exact digest under trust-root digest
`4b0f8cd1d259adf0d581b9d7e9f3ff081f1701c5e232b5d0623b9d51be5c90a1`.
the authorization digest is
`8bc36df7557c2d2fccdb381a715a0891ea8ec1e5907ab1b76b7b4bb4c8e9df65`.

the repository fixture private key exists only to make checked examples
deterministic. it is not a production authority, production credential, or
global activation root. a production host must inject protected signing
material and pin only its public keys.

## independent review

the independent reviewer was the `Plato` review agent,
`01a056cc-41b0-7260-89ec-c365b704986c`.

the first review found two critical implementation defects. a caller could
present a self-digested forged eligible profile to the activation path, and the
lifecycle function accepted authorization material plus caller-selected
expected digests in the same invocation. those defects made method promotion
self-authorizable in the library boundary.

the repair range
`6875f9472f26a99027f268e34e257810969e20a8..6d5b9475f5182f2e7992c9df41dd5ba6587e4cd8`
replaced same-call digest trust with host-created compilers, host-pinned
Ed25519 keys, signed time-bounded authorizations, and a separate signature over
the exact lifecycle decision. direct activation remains available for explicit
user intent but cannot trust an evidence profile.

the same reviewer then exercised a self-digested eligible profile, a forged
nonparticipant actor, a valid preauthorization paired with a forged lifecycle
decision, a caller-selected trust-root injection, and an attacker-substituted
decision signature. every attack was rejected. the properly authorized and
separately attested positive control selected method. the reviewer recorded
39 passed focused tests with zero failures and reported no unresolved critical
or important defect.

## verification evidence

the pre-certification completion gate produced:

- two pure rebuilds with byte-identical files, receipt, and report
- aggregate rebuild SHA-256 `2979b4423725dbe2f732592f8d3fb962f8c28d8c50f10278459a269592c8b414`
- 18 generated schema and evidence files plus one report bound by the receipt
- 55 passed focused compatibility tests, 0 failed
- 699 passed full-repository tests, 0 failed, 0 skipped, 0 cancelled
- exact matrix replay with five model rows and zero promotions
- handled-failure transactional writer rollback coverage
- `git diff --check` pass
- zero phase-1 checked-output drift and zero skill-entrypoint drift

the protected v1 blobs are unchanged from the coordinated frozen base:

| path | unchanged git blob |
|---|---|
| `src/adaptive-activation.mjs` | `3f263e2f68f006b42bda33805eca09add9d74727` |
| `policies/adaptive-activation.v1.json` | `1bdc9636284589f2a335d65efa8e61e815d01bbb` |
| `artifacts/adaptive-activation/evidence.v1.json` | `9b9f77b3acbddc406da1c112b3a3cb3376c4960a` |

## integration state and rollback

the work remains isolated on `feat/adaptive-evidence-v2` in
`.worktrees/adaptive-evidence-v2`. it has not been pushed, merged, installed
globally, connected to Godagents, or integrated into Lunari. there is no global
activation and no default activation change.

rollback is to stop consuming v2 and continue through the unchanged certified
activation v1 executable. all phase-2 records are additive. rejected trials,
demotions, and invalidations remain append-only evidence rather than rewriting
history.

## proof limits and next gate

this certification proves deterministic engine mechanics, exact identity and
lineage binding, append-only replay, fixture and historical non-promotion,
stale-profile rejection, one preregistered single-task single-model matrix, and
the tested host-pinned lifecycle authority boundary.

it does not prove universal model or Godskill quality, cross-model or
cross-host behavior, field performance, provider equivalence, production key
operations, external production authority, Godagents adapter correctness,
Lunari readiness, or protection from an actor that controls all host-pinned
private signing material.

this certification does not authorize phase 3, typed composition,
`.godskill` packaging, provider adapters, global installation, a merge, a push,
Godagents runtime changes, or Lunari integration. each requires a separately
authorized implementation and evidence boundary.
