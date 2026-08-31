# adaptive evaluator packages v1 runtime boundary

status: `verified-retrospective-shadow`

this record defines the executable and evidentiary boundary for adaptive
evaluator packages v1. it does not authorize global routing, model execution,
profile promotion, lifecycle action, or godagents activation.

## package rebuild sequence

1. run `npm run build:adaptive-evaluator-packages` from the repository root.
2. the builder reconstructs the three closed schemas in memory.
3. the package builder discovers the complete local static module closure from
   the pinned evaluator entrypoint and rejects dynamic, commonjs, bare,
   escaping, missing, and symlink-aliased dependencies.
4. the builder binds the evaluator code, policy, schemas, oracle, frozen task,
   archived artifacts, archived v1 observations, parent receipt, report, and
   runtime record into deterministic receipts.
5. all seven checked outputs are staged, verified, and committed in one
   transaction. any failed later rename restores every earlier destination.
6. a second rebuild must produce zero byte changes before certification.

## pinned entrypoint rule

the host imports `src/aegis-evaluator-v2.mjs` as a fixed, reviewed entrypoint.
a receipt path is data and is never an execution instruction. the package
policy keeps dynamic loading and receipt-path execution false. package identity
does not grant authority and cannot select arbitrary code.

## request and result contract

every request binds the exact package receipt, task definition, task source,
artifact bytes, variant, timestamp, raw baseline, and review parent required by
that variant. a bound baseline or parent carries both the prior artifact bytes
and the complete prior result body. the evaluator validates its identity and
context, then deterministically re-scores the bound artifact. a self-consistent
or recomputed digest cannot substitute a result from another evaluator or a
fabricated prior score.

every result is a closed portable object with package, evaluator, task, oracle,
normalization, artifact, score, case, comparison, parent, regression, reason,
authority, and time bindings. its logical digest covers the complete result
body. `authorityExpanded` must remain false.

## source and oracle grounding

the source is extracted from the exact frozen task after its first blank line.
the task file hash, task logical digest, source hash, oracle logical digest, and
package receipt must all agree. source and sink anchors committed by the oracle
must occur in that bound source before any artifact is scored. findings require
one-to-one identity, location, source, sink, directional-flow, severity, and
repair evidence. normalization only applies nfkc, lowercase folding,
punctuation separation, and whitespace collapse.

## fail-closed behavior

malformed or duplicate-key json, open object shapes, duplicate finding ids,
unsupported critical findings, negated flow, keyword stuffing, invented
locations, missing sources or sinks, generic repairs, identity substitution,
stale context, parent removal, parent degradation, path escape, incomplete
closure, and transactional write failure all fail closed. no repair is silently
invented and no failed artifact is promoted.

## retrospective shadow ineligibility

the archived five-condition replay has status
`retrospective-shadow-ineligible`. its `ledgerAdmissionAllowed`,
`profilePromotionAllowed`, `lifecycleActionAllowed`, and
`godagentsActivationAllowed` fields are all false. it reinterprets immutable
historical artifacts under evaluator v2 but creates no preregistered v2 trial,
no fresh model observation, no evidence ledger row, and no activation signal.

## evidence interpretation

`matchedComparisons` in adaptive evidence v2 counts task-local oracle cases,
not independent trials. three matched cases in one task are not three repeated
experiments and cannot establish recurrence, generalization, or a promotion
threshold. retrospective replay can reveal evaluator defects, but it is not
model-quality proof.

## future preregistration sequence

1. freeze a versioned task, source, oracle, evaluator package, comparison
   policy, and environment before dispatch.
2. preregister each fresh task as a separate trial before a model produces an
   artifact.
3. keep each trial ledger separate and preserve raw, guardrail, method,
   reviewer, and combined artifacts with exact result bindings.
4. reduce completed trial outcomes through a later versioned cross-trial
   portfolio that counts trials, not oracle cases.
5. require replicated task evidence and independent review before any profile,
   lifecycle, routing, or godagents adapter can consume a recommendation.

until that sequence is certified, adaptive evaluator packages remain a
deterministic measurement boundary and the v2 archive replay remains
reporting-only.
