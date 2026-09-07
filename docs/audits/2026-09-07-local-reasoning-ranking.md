# Local reasoning admission repair

Date: 2026-09-07. Status: isolated partial repair, held after independent review.

## Scope and evidence

Base: `38e5c8589bfe57db3f304fa09f658aa0d0a6042d`, the separately reviewed
coordinated-external-negation repair. Ranking implementation:
`6380b111f0cf9dad4981f8587962b4d5d2ce63f1` on `fix/local-reasoning-ranking`.
Canonical main remains `2ccdacf8ae04aceaff417de7c27fb3885b0bb7b7`.

The active catalog has 22 cards. Hephaestus selects model runtimes and compute
configurations; Logos handles writing, documentation and narrative. Neither is
a mathematical optimization capability. No new card, body, permission, native
fallback, provider invocation, or Godagents binding is part of this change.

The fixed mission request is preserved at
`D:/00-INDEX/operations/2026-09-07-godagents-minimax-comparison/candidate-2/workflow/mission-request.json`.
Its SHA-256 remains
`269db0d950346e4edb7dd14a6ae0f934baf693f74e39fa7bfd70489053e44493`.
The objective is `mission.objective`; the authority context is `hostCeiling`.
The read-only diagnostic invokes the compiler/router, not the mission runner.

## Root cause

The old score counted a request token once in each metadata field. One word
could therefore satisfy the minimum score by appearing in intent, success
condition and examples. `one` gave Agora 12 points by itself. The scheduling
objective gave Hephaestus 19 through `select`, `one` and `result`, despite no
model/runtime evidence. Its genuine external-read requirement then blocked the
local task. Dropping that permission would conceal the wrong selection.

## Test-first experiment and rejected alternative

Before the production edit, a fixed 19-test set covered eight local objectives
(scheduling, GCD, probability, sorting, implication, graph paths, multiplication,
maximum number), generic padding, synthetic independent evidence, four real
domain controls, card-authority preservation and three external-action controls.
Five failed on the base and fourteen passed. This was not just one objective
with many spellings.

Experiment 1 replaced aggregate scores with strongest-per-token scores and kept
negative penalties. It corrected the new false-admission cases but damaged
architecture selection, ambiguity and synthetic composition. Its 77-test run had
65 passes, 11 failures and one TODO. Six failures were previous negation tests
pinning the known wrong authority result; five were genuine regressions. That
scoring-scale replacement was rejected rather than retuning all thresholds.

## Bounded candidate mechanism

Keep the existing ranking score, negative penalties, tie policy, composition and
confidence scale. Add an admission requirement: independent positive support
must reach the existing minimum of 12, taking only the strongest field weight
for each distinct token. The existing multi-signal Phoenix hint retains its
separate contribution. The original aggregate score must also reach 12, so
negative penalties are not bypassed. Add grammatical `one` to the stop words.

Admission filtering happens before proposal acceptance and the eight-card cap.
The internal independent-support value is not added to the version-1 receipt
schema. Effects and supplied authority are unchanged. An explicit proposal
cannot reintroduce a card rejected by the evidence requirement.

This is a lexical evidence floor, not semantic understanding. Multiple distinct
generic words can still produce false matches. The English tokenizer and the
existing special hint remain limitations. The tests do not establish universal
routing superiority or a general-purpose reasoning capability.

The previous scheduling TODO is now an active regression asserting an explicit
catalog gap. Negation tests still compare effects, candidates and decisions
against the unqualified baseline. Genuine Hephaestus requests separately prove
that the external-read card requirement survives external exclusion wording.

## Verification

- Targeted compiler, two generalization files, and new ranking tests: 77 pass,
  zero failures, zero TODOs.
- Current 151-case arena: 151 pass; all 92 positive selections exact; zero
  unsafe selections, authority invention, over-composition or repeatability
  mismatches. This is fixture evidence, not a live outcome trial.
- Exact frozen mission: requested effects `[local-read]`, candidates `[]`,
  unresolved decisions `[intent-not-understood]`, route `needs-decision`,
  selected IDs `[]`. The scheduling mission is still NOT qualified.
- Full candidate suite at implementation commit: 887 tests, 880 pass, six
  failures, one skipped, no TODOs. The six failure identities match the
  previous negation candidate. This is not a green release suite.
- Four new supported-domain controls additionally exercise `compileAndRoute`,
  not just first-score identity: selected status and intended skill membership
  for Hephaestus, Oracle, Logos and Forge. All 19 new tests pass after this
  assertion strengthening. It does not claim every selected composition is
  minimal or that Oracle is the only skill in its control.
- Compiler file SHA-256:
  `a40594a4a7f7e33a62135191406de27da4bf8b834712fa2a7a6f2805f51de6a6`.

Logs from this run are in the host temporary directory:
`godskills-ranking-red.tap` (Node default reporter despite suffix),
`godskills-ranking-experiment1.tap`, `godskills-ranking-experiment2.tap`,
`godskills-ranking-route-controls.tap`, and `godskills-ranking-final-full.tap`.
The committed tests, source and this report are the durable evidence; temporary
logs are supplementary and may expire.

## Release decision

Do not merge or repin this candidate yet. Five exact-artifact checks reject the
changed compiler/source closure: intent-compiler v1, compiler-generalization
v2, intent-compiler v3, specialist-preference routing v1, and routing executable
v1. A sixth, pre-existing test requires obsolete literal wording in the global
Codex instructions. Neither the instructions nor that unrelated test changed.

## Independent review: semantic applicability remains unresolved

Terra reviewer Chandrasekhar (`01a07d97-cda2-7a22-823a-d91f552b16a8`) found
four generic-padding counterexamples. The coordinator reproduced all four on
both unchanged main and this candidate, using the same cards and local-only
authority context. They are pre-existing defects, not regressions caused by this
patch, but they block broad qualification of local-reasoning admission.

| Request | Main and candidate behavior |
| --- | --- |
| Sort 19, 2, 11, 7 from local source material. | Logos selected, no unresolved decision |
| Calculate the greatest common divisor using a bounded local artifact. | Hermes family inferred; execution/network authority requirement blocks selection |
| Compute 17 times 23 from supplied facts and evidence. | Hephaestus family inferred; external-read authority requirement blocks selection |
| Compute 17 times 23. Preserve provenance and uncertainty. | Orpheus family inferred; review and rights/consent requirements block selection |

The first is a clean unrelated route, not just an unnecessary refusal. Distinct
words are not distinct domain evidence. No further stop-word expansion or
objective-specific math detector was attempted.

The exact texts are durable in `data/local-reasoning-admission-review.v1.json`.
`tests/intent-generic-padding-regression.test.mjs` preserves all four as active
failing runtime-level tests, not skips or TODOs. Fresh run: four tests, zero
passes, four failures. Log: `godskills-ranking-review-red.tap`.
The earlier 887-test full-suite result predates these four new regressions and
must not be represented as the final expanded suite result.
Final expanded targeted run: 81 tests, 77 pass, four confirmed generic-padding
failures, zero skips and zero TODOs (`godskills-ranking-final-targeted.tap`).

The reviewer independently ran 58 tests from the compiler and new ranking files,
and subsequently all 19 new tests after runtime assertion strengthening. The
coordinator's 77-test command additionally includes the two generalization files;
these are different test scopes, not contradictory counts. Review disposition:
partial lexical correction is sound, semantic admission P1 remains, hold release.

The [migration proposal](2026-09-07-routing-certification-migration-proposal.md)
defines the remaining certification boundary. The
[applicability evaluation proposal](2026-09-07-applicability-versus-retrieval-evaluation.md)
defines the smallest next architectural investigation. An explicit governed
native-mode policy for an uncovered task belongs to Godagents architecture, not
this scoring repair; native within an existing bound workflow is not unbound
operation. No native eligibility decision was implemented here.
