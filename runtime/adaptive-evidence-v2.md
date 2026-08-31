# adaptive evidence v2 runtime contract

status: `experimental-canary`

default activation change: `none`

## purpose and boundary

adaptive evidence v2 is an additive evidence and lifecycle layer for qualified
capability activation. it observes exact conditions, preserves causal trial
history, derives a new profile from immutable rows, and returns a governed
decision. it does not grant authority, install a capability, change a provider,
or activate itself globally.

the legacy activation v1 path remains the operational rollback boundary. a
host that does not explicitly integrate and trust v2 continues to use its
existing behavior.

## required runtime sequence

the host must perform these steps in this order:

1. verify capability bundle and trusted policy
2. compile complete profile identity
3. derive or invalidate the current profile
4. compile body-free shadow prediction
5. preserve native attempt
6. preregister task, variants, evaluator, and comparison policy
7. construct each isolated artifact under its authorized disclosure
8. evaluate only after each artifact exists
9. append immutable evidence rows
10. derive a new profile without mutating history
11. apply only an explicitly authorized lifecycle receipt
12. fall back to activation v1 when v2 is disabled or ineligible

skipping or reordering a step does not produce qualified v2 evidence. a host
must never backfill preregistration after an artifact exists or tune thresholds
after seeing a result.

## exact profile identity

one profile is valid only for the exact seven-field tuple below:

| field | meaning |
| --- | --- |
| `capabilityId` | selected capability identity |
| `taskClass` | bounded task category |
| `modelFamily` | exact evaluated model family |
| `reasoningTier` | exact evaluated reasoning effort |
| `consequenceClass` | consequence boundary used by policy |
| `capabilityVersion` | digest-bound capability bundle version |
| `environmentId` | digest of the material evaluation environment |

a change to any field makes the profile stale and invalid for current
activation. policy, task definition, comparison policy, trial, ledger, and
profile digests are additional lineage bindings. stale evidence remains in
history but cannot authorize a current mode.

## evidence levels

the policy recognizes these distinct levels:

1. `structural`
2. `fixture`
3. `artifact`
4. `model`
5. `cross-model`
6. `field`
7. `universal`

structural, fixture, and artifact rows cannot promote a profile. historical
evidence that was not preregistered under v2 remains visible but ineligible.
only policy-listed promotable levels can count, and their exact model, task,
reasoning, capability, consequence, and environment boundary still applies.
no level is inferred merely from routing accuracy, corpus size, popularity, or
valid JSON.

## five-condition causal matrix

a complete matrix has exactly these isolated variants in preregistered order:

1. `raw`, with no capability body and admitted first as the baseline
2. `guardrail`, with only the exact guardrail body
3. `method`, with only the exact method body
4. `reviewer`, with the raw artifact and exact reviewer body after raw exists
5. `combined`, with the method artifact and exact reviewer body after method exists

every non-raw row binds the same raw artifact and deterministic raw evaluation.
review conditions additionally bind the exact parent artifact, parent
evaluation, disclosed reviewer bytes, and reconstructed prompt. artifacts are
never overwritten by their reviews.

the ledger is append-only. it admits raw first, assigns sequence and parent
digest itself, rejects duplicate proposals, artifacts, or variants, and
replays the complete chain before appending a row. scores, outcomes, critical
regression state, costs, proof level, producer, evaluator, and timestamps are
copied into a digest-bound row without embedding the artifact body.

## evaluation and promotion

the evaluator must be fixed before dispatch and distinct from the subject
producer and capability. model output is retained exactly. malformed output is
recorded as failure rather than repaired by the coordinator.

promotion requires complete promotable variant coverage, current identity and
bindings, policy thresholds, acceptable overhead, zero critical regressions,
and explicit authorization from an actor that is not the capability, producer,
or evaluator. a critical regression blocks promotion even if an aggregate
score or win count improves.

the fresh Aegis Terra-high matrix recorded five `model` rows. guardrail scored
27 against raw 26, method scored 3, reviewer scored 26, and combined scored 0.
all five rows triggered the frozen critical-regression predicate. the profile
is `ineligible`, recommends `guardrail`, and the attempted method promotion is
`rejected`; the recorded active mode remains `native`.

the low method and combined scores also expose a frozen evaluator limitation:
its lexical taxonomy did not recognize some semantically correct hyphenated
finding language. this was discovered after dispatch. the evaluator and
thresholds were not changed, and no subject was rerun or rescored. the result
therefore describes this exact task and verifier, not general Aegis quality.

## persistence, privacy, and replay

required durable evidence is:

- trusted policy and capability identities
- task, comparison, environment, evaluator, and trial digests
- exact artifact bytes in bounded evidence storage plus their digests and byte counts
- deterministic observations and their evaluation digests
- the append-only ledger, derived profile, and lifecycle receipt
- the external authorization digest for any lifecycle action

aggregate ledgers and receipts retain references, digests, metrics, verdicts,
cost fields, and proof limits. they do not need raw prompt text, proprietary
artifact bodies, credentials, or unrelated personal data. reports and
human-readable summaries are optional views and cannot substitute for the
required records.

exact replay requires the original artifact bytes, evaluator bytes, prompt
constructor, disclosed capability layers, task and comparison bytes, policy,
and all bound digests. a digest without its recoverable artifact can prove
identity but cannot reproduce semantic evaluation. unavailable token, latency,
or monetary measurements remain `null`; they are never converted to zero.

## lifecycle authority and recovery

a lifecycle request requires an externally trusted profile digest, an exact
grant scoped to that profile, a named actor, and a current identity and binding
set. malformed authority throws. valid but unqualified promotion returns a
digest-bound `rejected` decision. every decision records prior mode, next mode,
reason codes, evidence digest, authorization digest, and
`authorityExpanded: false`.

demotion, quarantine, or invalidation derives a new receipt and never deletes
history. return to native is the conservative recovery path when evidence is
ineligible, stale, invalidated, or explicitly demoted. consequential stale
profiles may fall back to guardrail only where the trusted policy says so; that
recommendation is not self-applying.

rollback is to disable v2 consumption and use activation v1. the v1 compiler,
policy, evidence, and executable receipt remain unchanged. no v2 builder,
profile, or lifecycle receipt changes global defaults by existing alone.

## proof limits

this phase can prove:

- deterministic structural and fixture engine integrity
- exact append-only lineage and replay checks
- one preregistered, single-task, single-model five-condition matrix
- independent evaluator and lifecycle authority separation in the tested boundary
- failure-closed non-promotion for the recorded matrix

it does not prove:

- universal model or capability quality
- cross-model, cross-task, cross-host, or field behavior
- that guardrail, method, review, or combined activation is generally superior
- provider equivalence or future model stability
- no global activation outside a host that independently violates this contract
- external authority, Godagents adapter correctness, or Lunari readiness
- protection from a hostile actor with write access to all trusted local bytes

there is no global activation in phase 2. phase 3, provider adapters, Godagents
runtime integration, and Lunari integration require separate authorization,
implementation, evidence, and certification.
