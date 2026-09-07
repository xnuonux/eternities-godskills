# Offline applicability study: main versus held candidate

Date: 2026-09-07. Status: diagnostic evidence, not release qualification.

## Freeze and independence

The evaluation follows the
[bounded proposal](2026-09-07-applicability-versus-retrieval-evaluation.md).
Development data and the offline evaluator were committed at
`ddaf74a44b4a0f84069bd22bd5bb3ca64d915988` before held-out replay. No production
ranking code changed during this phase.

- Main: `2ccdacf8ae04aceaff417de7c27fb3885b0bb7b7`.
- Candidate: `ddaf74a44b4a0f84069bd22bd5bb3ca64d915988`, with the same compiler
  bytes as reviewed implementation `6380b111f0cf9dad4981f8587962b4d5d2ce63f1`.
- Evaluator SHA-256:
  `3ae60f82d2d1e1d9fde9c2998f55afdbfbb06a888bcd34b50867dd183f744c3b`.
- Development dataset SHA-256:
  `fcc6e8249cfce53c4089074e880dfaf4cf2cb8fd2eacba80f54aaeb52f2a6bc8`.

Godagents task `01a04a0c-ae62-7c83-8f77-9d7b1614f390` independently authored
the held-out set. That author knew the four previous counterexamples and devised
new cases; this is independent task-context authoring, not an independent human
study. Only file paths, freeze hashes and aggregate results entered the rule
tuner's context. Case text and labels remain outside the repository. No tuner
read them to adjust either rule. The same evaluator and runtime bytes produced
both partition replays.

Held-out v1 SHA-256 was
`8e690c15e7262322534c30b9acd436860b2f07d74ce0272d75bf4e1b2465e7ca`.
Its replay stopped on an invalid effect enum before an output file was written:
`repository-write` belongs in authority, not permitted effects. The author
preserved v1 and created v2, removing that value from two variant effect arrays
only. Texts, annotations and authority arrays were unchanged. The author validated
all 12 default contexts and two variants without routing or tuning.
Corrected v2 SHA-256:
`833604e2f350bae1dfae54d05d04d39cf2ef482bc3cad4c5eb37a7679c843c2d`.

## Design and verified boundaries

Each partition contains six benign local and six supported-domain/external-action
cases. Twelve development cases produce 13 authority contexts; twelve held-out
cases produce 14 contexts. Main and candidate run the identical input in both
default and specialist entrypoints, with a repeated replay of every input.
This is 24 base cases, 27 contexts and 216 local compile/router evaluations per
complete replay. A second complete replay reproduced both output hashes exactly.

The specialist control has no preference override. It establishes parity for
that path, not all specialist preference behavior. Expected labels are used only
after obtaining actual receipts; they are never sent to the router. Each replay
retains the full request, annotation, source evidence, actual compiler/router
receipts, expected-effect/authority discrepancies and deterministic-repeat check.
Evidence quotes are checked against exact local source bytes.

Five test-first evaluator tests pass: unrelated clean admission accounting,
annotation/runtime separation, authority-paired applicability, duplicate/invalid
request-span rejection, and uncertain-label handling. Four prior generic-padding
regressions remain active and failing. A combined fresh nine-test run has five
passes and those four failures, with no skips or TODOs. No full-suite green claim.

No provider inference, runtime trust-root mutation, skill-body activation, source
receipt rewrite or main integration occurred. The third arm is annotation only;
there is no implemented semantic applicability mechanism to compare or promote.

## Aggregate results

Default and specialist metrics were identical within each arm and partition.
Counts below are per partition/arm, not multiplied across duplicate mode runs.

| Metric | Development main | Development candidate | Held-out main | Held-out candidate |
| --- | ---: | ---: | ---: | ---: |
| Clean unrelated admissions | 2 | 1 | 2 | 0 |
| Qualified shortlist entries | 50 | 28 | 62 | 55 |
| Expected applicable shortlist entries retained | 5 / 5 | 5 / 5 | 6 / 6 | 6 / 6 |
| Eligible selection misses | 1 | 1 | 1 | 1 |
| Inappropriate benign-local authority demands | 3 | 3 | 0 | 0 |
| Required-effect discrepancies | 0 | 0 | 2 | 2 |
| Missing required authority decisions | 0 | 0 | 0 | 0 |
| Authority invention | 0 | 0 | 0 | 0 |
| Repeatability or default/specialist mismatches | 0 | 0 | 0 | 0 |

"Qualified shortlist" means the compiler's emitted `candidateScores`, not all
raw lexical scores. The applicability labels are reference annotations, not a
learned or validated semantic oracle. An eligible selection miss checks declared
authority, preconditions and effects; it still needs per-case adjudication for
compound-task sequencing and other routing constraints. An expected-effect
discrepancy is not automatically a security defect: input semantics and label
correctness must be checked before implementation.

The development compound engineering/documentation request retains both expected
skills in the shortlist but selects only Logos in both arms. The arithmetic
sorting/source-material counterexample remains a clean incorrect selection.
Three other known local tasks still acquire irrelevant permission requirements.
The candidate correctly removes a clean refinery selection for a simple lexical
comparison. None of these observations licenses a fallback or permission bypass.

The independent author adjudicated both effect discrepancies as genuine
under-reporting of explicitly requested local artifact creation: `local-write`
is missing from `requestedEffects`. The architecture-category selection miss is
a genuine unnecessary abstention involving unsupported external-read and
intent-ambiguous decisions for local design. These occur in both arms, not as
demonstrated candidate regressions. This conclusion is attributed to that
independent inspection; the tuner did not read the held-out prompts. No label
correction was warranted. The author preserved a separate
`heldout-adjudication.v1.md` outside the repo, not used for tuning.

Missing `local-write` in requested-effect reporting does not prove an unauthorized
write occurred. Selected-card effects/authority and downstream host checks are
separate. No requested task was executed in this offline study.

## Per-case evidence

All files below are under
`D:/00-INDEX/operations/2026-09-07-godskills-applicability/`:

| Artifact | SHA-256 |
| --- | --- |
| `development-replay.v1.json` | `705d3803127d8e32a44e40dee78030579081eafe566d2d1cc99c63d4391db4b0` |
| `heldout.v1.json` (preserved invalid original) | `8e690c15e7262322534c30b9acd436860b2f07d74ce0272d75bf4e1b2465e7ca` |
| `heldout.v2.json` (structural correction only) | `833604e2f350bae1dfae54d05d04d39cf2ef482bc3cad4c5eb37a7679c843c2d` |
| `heldout-replay.v2.json` | `6e451864323ed8b0da3c20f844a5a5956ec651bfbd9c6b49bd147858544729cd` |

The replay tool refuses a dataset hash mismatch, validates exact request and
source quotes, rejects changed runtime source, checks both arms use identical
cards, and writes only a new output path. The report embeds exact commit, compiler,
catalog and evaluator hashes. This is not a replacement for a certified complete
executable trust root. It does not prove host execution or live model performance.

## Smallest justified implementation decision

Keep the duplicate-token candidate isolated. The observed improvement supports
its narrow mechanism; the four active known counterexamples forbid calling it a
complete applicability fix. Do not add further keyword exceptions, change the
native-mode policy or migrate certification yet.

The next justified artifact is a bounded applicability contract and annotation
review surface that records the requested operation/deliverable and the exact
capability claimed to cover it. Keep that artifact advisory and separate from
execution admission. No automatic semantic checker has earned enforcement from
this study. Freeze a precise proposed mechanism before a new independently
authored holdout; do not tune repeatedly against these 24 labels.

The immediate next implementation decision is a separate test-first repair for
explicit local artifact creation under-reporting, using newly authored development
cases and preserving the held-out set. Do not modify applicability scoring or
authority checks as part of that effect-classification repair. Local architecture
abstention stays a separate applicability investigation. Neither issue justifies
rewriting this comparison or claiming universal semantic qualification.
Godagents continues to own receipt-backed no-selection versus unresolved-intent
and explicitly governed native eligibility. This study does not equate them.
