# specialist preference routing v1 certification

certified: 2026-08-31

disposition: `certified-additive-preference-routing-protocol`

proof level: `deterministic-structural-fixture-and-executable-source-closure`

reviewed implementation head: `b85a7be178463a548ed92f0b1346de4f8772a527`

post-repair independent re-review: `not performed`

receipt digest: `992f1efb07de413af42b8da869b0c6b3184a8bd010903a30ecc5735296654080`

receipt file SHA-256: `3b5164b41aa498ad637def561ff38df76d22a8f95b694a8c37f29ffa363718e7`

fixture file SHA-256: `e897d84557714d3fd788a5b5bedd35b76583b317fb970d8afc7ce4f38cf64d49`

## certified scope

this certification covers the versioned specialist-preference contracts,
compiler adapter, bounded shortlist, router, runtime, CLI, deterministic
fixture, exact source closure, and release receipt.

`preferredCapabilities` is a nonempty, sorted, unique set of at most 32 known
portable capability ids. it is considered only after coverage, card count,
extra capabilities, effects, context, dependencies, and evidence. it can
replace only the historical lexical-id tie breaker.

the route receipt binds the exact supplied, policy-qualified, semantic,
selected, and historical-baseline ids. it states whether preference changed
selection and why. unresolved user decisions, policy rejection, shortlist
overflow, unknown ids, forbidden overlap, and malformed receipt claims fail
closed.

this protocol performs no Godagents activation. a Godagents host must verify
and pin this exact receipt and executable closure before forwarding any
specialist preference.

## frozen boundaries

the historical compiler, natural-request contracts, routing contracts,
routing index, router, runtime, CLI, and all four parent receipts remain
byte-identical to base
`fc986664e6ebdb9adbffc7c602a2b4013432d090`.

the four exact parent receipt files are:

| parent | file SHA-256 | bytes |
|---|---|---:|
| `agent-native-router-v8` | `b32500d810ba66539334cbe3ae5ef31223dbf712197a061779fc21f75048ebf3` | 7284 |
| `eternities-godskills-system-v3` | `228ba0a63d252f0c37178ff3de8c1278d0ea878e9abeb173e7faea699f28fb57` | 4446 |
| `intent-compiler-v3` | `1ca40ec9138c1d0583068ee4dc3db58f0b77b07f631a2b38d9c47eb28ccce49a` | 3661 |
| `portable-capability-manifest-v1` | `f78f6aded5198e8db1591af49fe97285307427d93396b34c78dd6e5f2466f33d` | 1128 |

## acceptance disposition

| condition | disposition | evidence |
|---|---|---|
| historical omission path | pass | the versioned runtime delegates directly and produces an exact deep-equal historical result |
| tie-break position | pass | card count, extra capabilities, effects, context, dependencies, and evidence each beat preference in retained tests |
| authority neutrality | pass | `authorityExpanded` is false and selected fixture cards require no authority absent from the request |
| bounded identity | pass | unknown, duplicate, unsorted, empty, forbidden, and more than 32 ids fail closed |
| semantic isolation | pass | a preferred-only support card is inspected but cannot enter or enable a composition |
| receipt integrity | pass | forged direction, application, semantic-set, reason, selected-id, and request-preference claims are rejected |
| deterministic output | pass | two consecutive builds reproduce the fixture and receipt byte-for-byte |
| source closure | pass | the receipt binds 13 transitive runtime modules and 19 total source files before certification |
| full repository gate | pass | 762 tests pass with zero failures, skips, cancellations, or todos |

## inline review and repairs

the first implementation edited the historically certified compiler and
router modules. the full suite correctly rejected that source drift. the
release was redesigned as a separate versioned runtime, restoring every
historical source and receipt byte.

the inline adversarial pass then reproduced a candidate-expansion defect. a
preferred card unioned for identity checking could act as a new composition
dependency even though historical semantic retrieval had excluded it. the
repair records semantic candidate ids separately and permits only those ids
to enter singles or compositions. the preferred-only card remains visible
for identity and policy evidence but cannot influence route feasibility.

additional retained regressions reject a mismatched compiler request and
preference set, an unrequested semantic-candidate control, a tie-break moving
away from preference, and a forged stronger-selection reason applied to a
non-semantic card.

the user prohibited subagents during the final repair and certification
phase. no post-repair independent re-review occurred, and none is claimed.
the exact-head disposition rests on test-first reproduced defects, inline
source review, deterministic rebuilds, historical compatibility checks, and
the full repository suite.

## proof limits

- deterministic structural protocol and local fixtures only
- no specialist-quality or model-quality superiority claim
- no eligibility, effect, authority, or user-decision expansion
- no arbitrary-language or unseen-mission generalization proof
- no model selection or provider behavior proof
- no Godagents activation or adapter proof
- no Lunari integration
- no protection from a host that substitutes pinned repository bytes
- policy qualification is recomputed by the exact executable, not proven by
  standalone receipt shape alone

## next trust boundary

Godagents may adopt this protocol only through an additive release pin that
verifies this exact receipt, source closure, parent set, and output hashes.
the host must forward only eligibility-derived preferences, bind the exact
root and ids into durable cycle identity, preserve the all-rounder and legacy
path, and prove recovery performs no new routing decision.
