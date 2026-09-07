# Applicability versus keyword retrieval: bounded evaluation proposal

Date: 2026-09-07. Status: proposed offline study, not a runtime change.

## Question

Can a small, explicit applicability check distinguish a genuinely relevant
capability from a keyword-retrieved card, without losing valid tasks or changing
authority? The [ranking review](2026-09-07-local-reasoning-ranking.md) establishes
why a higher lexical score alone is insufficient. It does not establish that a
particular semantic mechanism will solve the problem.

## Smallest architectural separation to test

Keep the present catalog and retrieval machinery as a cheap candidate finder.
Do not treat retrieval rank as proof that a skill should run. Evaluate a separate
applicability judgment against the *primary requested operation and deliverable*,
not merely the context, artifact format, quality adjectives or shared words.

For a shortlisted card, record:

- request ID, exact text digest, catalog/card digest and candidate ID;
- primary requested operation and deliverable, each with exact request spans;
- the card's declared capability and evidence location supporting applicability;
- one disposition: `applicable`, `inapplicable`, or `uncertain`;
- a concrete mismatch or uncertainty reason when applicability is not established.

These are study annotations, not a new trusted schema. A valid string span or a
well-formed annotation does not itself prove semantic entailment. The evaluation
must judge whether the cited capability actually covers the requested operation.
For example, numerical sorting does not become document production because the
input is called source material; documenting a sorting algorithm can be a genuine
writing task. Conversely, requesting a model-runtime comparison is not ordinary
arithmetic merely because it mentions compute or includes numbers.

No method body is injected, no new skill is created, and no authority is granted
by an applicability verdict. The existing effect inference runs independently,
even if every candidate is inapplicable. A genuine publication or deployment
request must still retain its effects and authority decisions. Empty/uncertain
applicability yields explicit unresolved state in this study, not automatic
native execution. Godagents owns governed native eligibility separately.

## Fixed development set and genuinely held-out set

Start with 12 development cases, then 12 independently authored held-out cases.
Do not describe the current examples as held out: they have already influenced
the design. Do not author the hidden test set in the same context that tunes the
applicability rule. Existing known counterexamples are mandatory development
cases, not the whole benchmark.

Each partition has six benign local cases and six genuine supported-domain or
external-action cases. Across each partition include:

- numerical and non-numerical uncovered local tasks, with bare and generic
  metadata-padded variants;
- real writing or engineering tasks using the same vocabulary and numbers, so
  a detector cannot succeed merely by rejecting numeric or source-material text;
- model/runtime and current-official-source research requests;
- publication, spending or production-change requests with insufficient authority;
- at least one supported domain request tested with and without required authority.

Label expected applicability independently of authority. A model-runtime request
can be applicable to Hephaestus yet lack external-read authority. Publication can
be a real requested effect even when no active card supports external writing.
Never make the absence of permission itself mean the task is semantically local.

Labels require card/body evidence and an expected deliverable, not skill names
chosen by the current router. Ambiguous cases are labeled uncertain, not quietly
deleted. Keep the same corpus and authority contexts across all comparison arms.

## Offline comparison arms

1. Unchanged main lexical retrieval/admission.
2. Isolated duplicate-token-support candidate.
3. A proposed applicability layer, only after its precise rule and evidence
   format are written and frozen. Begin with an annotation-only replay to measure
   the gap between retrieval and applicability, before choosing implementation.

The third arm is intentionally not implemented yet. It must not use a growing
stop-word list, hardcoded recognition of these math questions, a forced fallback,
or the expected labels as input. No additional provider or inference spending is
authorized by this proposal. If testing a model-based applicability checker
requires a call or paid service, stop at the local dataset/annotation stage and
obtain separate authority rather than treating that cost as implicit.

## Measurements and advancement rule

Report raw counts and each failure, not a single flattering average:

- unrelated clean admissions and inappropriate authority requirements;
- exact supported capability coverage, plus needless abstentions;
- retrieval recall separately from applicability precision;
- effect suppression, authority invention, invalid proposal acceptance and
  default/specialist disagreement;
- deterministic replay, annotation/context bytes, local runtime, and source
  bodies loaded (zero for routing; offline annotation reading is accounted apart).

Advance only if the frozen held-out comparison has no unrelated clean admission,
no authority/effect regression and no loss of the explicitly supported controls.
The small sample only qualifies the next bounded build, not universal correctness
or superiority over a raw agent. Any post-unblinding rule change requires a new
held-out set, not reuse of the same labels until the score becomes perfect.

If annotation quality itself is unreliable, record that result and keep retrieval
advisory. Do not let typed output or extra ceremony substitute for applicability
evidence. Only after this study supports a concrete mechanism should a separate
test-first implementation and versioned release plan proceed.
