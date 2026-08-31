# adaptive evaluator packages v1 design

## status

Approved for implementation under Dom's standing continuous Godskills and
Godagents development instruction on 2026-08-31.

This is the bounded phase 2.1 milestone after adaptive evidence v2 reached
`main`. It adds a versioned evaluator trust boundary and one Aegis v2 package.
It does not alter the archived Aegis matrix, its v1 evaluator, its ledger, its
profile, any activation default, or Godagents runtime behavior.

## problem

Adaptive evidence v2 proved that preregistration, isolated variants,
append-only evidence, stale-profile rejection, and signed lifecycle control
can work. Its only live matrix used one task, one model profile, and one
hard-coded Aegis verifier. That verifier treated punctuation as semantics and
missed correct hyphenated finding identities. The method and combined
artifacts were therefore scored as severe losses even though their findings
described the expected source-to-sink paths.

The frozen result is still valid evidence about the exact v1 verifier. It is
not reliable evidence about general Aegis quality, and it cannot support a
Godagents activation decision. The next trials need evaluators whose complete
code and task resources are digest-bound, whose output contract is portable,
and whose proof type fits the task.

Inspection also exposed a separate aggregation limit. Adaptive evidence v2 is
correctly single-trial, but its `matchedComparisons` metric sums oracle cases
inside that trial. The original design language requires repeated matched
evaluations across independent tasks. Three findings in one security review
therefore cannot be treated as three demonstrations of recurring advantage.
This milestone does not reinterpret or repair that counter. No v2 profile may
be consumed as recurrence evidence until a separately versioned cross-trial
portfolio layer distinguishes case comparisons from trial outcomes.

## approaches considered

### patch the Aegis v1 verifier

This is the smallest code change, but it destroys exact replay of the archived
trial or silently changes what its evaluator digest means. Rejected.

### versioned evaluator packages with task-specific adapters

Each evaluator becomes a closed package containing an explicit entrypoint,
complete local module closure, policy, request and result schemas, and exact
task resources. Adaptive evidence continues to bind only evaluator kind, id,
and digest. The package receipt explains what those fields mean and can be
rebuilt before use. Selected.

### model-judge-first evaluation

Model judges can handle aesthetic and semantic work that has no objective
oracle, but they introduce order bias, nondeterminism, cost, and another model
identity. They belong behind the same package boundary after deterministic
integrity exists, not at its foundation. Deferred.

## architecture

### evaluator package receipt

An evaluator package receipt is a relocation-independent identity for one
executable evaluator. It contains:

- package id, protocol id, evaluator kind, task class, and artifact media type;
- one explicit entrypoint and its complete repository-local static module
  closure;
- closed request and result schema references;
- one package policy reference;
- zero or more declared task resources such as an oracle or rubric;
- SHA-256, byte count, role, and optional logical digest for every artifact;
- proof limits and one logical `receiptDigest` over the unsigned body.

The builder rejects absolute paths, parent traversal, symlinks, duplicate
paths, unresolved imports, dynamic imports, CommonJS loading, bare external
dependencies, resource drift, and undeclared local dependencies. The package
cannot grant authority and cannot identify itself as its own producer.

Task oracles, case taxonomies, aliases, and scoring fixtures are evaluator
resources, never subject-prompt material. Their bytes are frozen before a
future dispatch and bound into preregistration without exposing them as answer
keys.

The first implementation reuses the existing static module closure scanner.
It does not add arbitrary plugin loading. Hosts call a pinned evaluator
entrypoint and compare the rebuilt receipt to the preregistered digest before
evaluation. A future registry may map trusted ids to entrypoints, but a
receipt-supplied path is never executed merely because it is well formed.

### portable request and result

The evaluator request is closed and contains:

- package receipt digest;
- task-definition digest and exact task-source digest;
- variant and exact artifact bytes;
- optional raw-baseline artifact and evaluation bindings;
- optional review-parent artifact and evaluation bindings;
- evaluation time supplied by the host.

The result preserves the adaptive evidence observation fields needed by
`createObservationProposal`: score, outcome against raw, critical-regression
state, baseline artifact digest, comparison counts, and reason codes. It also
binds package, task, source, oracle, artifact, baseline, parent, normalization,
and result digests. It contains per-case evidence without embedding unrelated
source or prompt bodies.

No package writes to an evidence ledger. Admission remains the responsibility
of the existing adaptive evidence engine.

### Aegis deterministic evaluator v2

The Aegis package evaluates a closed JSON finding artifact against an exact
task source and a frozen task oracle. The oracle defines stable case ids,
expected severity, allowed source locations, source and sink anchors, required
flow relations, and repair invariants.

Normalization is deliberately narrow: Unicode NFKC, lowercase conversion,
punctuation and dash separation, and whitespace collapse. It may reconcile
`command-injection`, `command injection`, and equivalent identifier spelling.
It cannot establish factual grounding by itself.

Grounding requires all of the following:

1. the oracle's source and sink anchors exist in the exact bound task source;
2. one finding maps to one oracle case through a stable best assignment;
3. the finding identifies an allowed location;
4. its evidence names the required source, sink, and directional flow;
5. its repair satisfies the case-specific repair invariants;
6. negated flow, unsupported claims, invented locations, and keyword stuffing
   cannot satisfy the case.

Missing or degraded critical cases, malformed output, unsupported critical
findings, parent degradation, oracle drift, source drift, and evaluator drift
fail closed. Candidate order does not affect assignment or digest.

### retrospective shadow replay

The five archived Aegis artifacts are replayed through v2 without changing
their bytes or any v1 observation. The output is a new
`retrospective-shadow-ineligible` artifact and receipt that bind:

- all five archived artifact digests;
- all five original v1 evaluation digests;
- the v2 evaluator package receipt;
- the exact task source and oracle;
- all five v2 shadow results;
- an explicit prohibition on ledger admission and profile promotion.

The replay is diagnostic evidence that the evaluator defect is addressed. It
is not preregistered model evidence and cannot repair, replace, or promote the
historical profile.

## repository shape

The milestone adds these bounded surfaces:

- `policies/adaptive-evaluator-packages.v1.json`
- `schemas/adaptive-evaluator-package-v1.schema.json`
- `schemas/adaptive-evaluator-request-v1.schema.json`
- `schemas/adaptive-evaluator-result-v1.schema.json`
- `src/adaptive-evaluator-package.mjs`
- `src/aegis-evaluator-v2.mjs`
- `scripts/build-adaptive-evaluator-package-receipt.mjs`
- `scripts/build-aegis-evaluator-v2-shadow-replay.mjs`
- `artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json`
- generated Aegis package, replay, report, and aggregate receipt artifacts
- focused package, evaluator, replay, trust-boundary, and compatibility tests

The exact generated paths are frozen in the implementation plan before their
builders are written.

## data flow

1. Rebuild and verify the evaluator package receipt from current bytes.
2. Verify the task definition, task source, oracle, package policy, and request.
3. Parse the artifact through the closed output contract.
4. Normalize only identity-bearing text and assign findings one-to-one.
5. Verify location, source, sink, flow, repair, severity, and parent retention.
6. Compute a deterministic result and result digest.
7. For shadow replay, bind the result beside the immutable v1 result and mark
   it ineligible.
8. For a future preregistered trial, pass the portable observation subset to
   adaptive evidence v2 for ordinary append-only admission.

## failure behavior

Validation errors throw before any checked output is replaced. Builders write
through the repository's transactional generated-file mechanism. A failure on
a later file restores every earlier checked output. Unknown fields, stale
digests, incomplete dependency closure, unsupported evaluator kinds, and
cross-task resources are hard failures.

An artifact can score poorly without throwing. Malformed structure and loss of
a required critical case produce a valid fail-closed evaluation with
`criticalRegression: true`. Infrastructure or identity corruption throws and
produces no evaluation.

## acceptance evidence

The milestone is accepted only when fresh evidence shows:

1. package receipts rebuild byte-identically and bind complete local closure;
2. path escape, symlink, dynamic import, bare dependency, missing resource,
   duplicate path, and any byte substitution are rejected;
3. hyphenated, spaced, and identifier-form expected findings map identically;
4. paraphrase with exact source-to-sink grounding passes while ids alone,
   keyword stuffing, negated flow, fabricated anchors, and invented locations
   fail;
5. assignment is stable under finding order and cannot reuse one finding for
   two cases;
6. unsupported critical claims and missing or degraded critical cases fail
   closed;
7. raw-baseline and review-parent bindings reject removal, substitution, and
   evaluation-digest drift;
8. all five archived artifacts replay deterministically through v2 with all
   three expected source-grounded cases recognized;
9. shadow replay remains explicitly non-promotable and cannot enter a v2
   evidence ledger;
10. the v1 evaluator, archived matrix, v1 observations, v2 ledger, v2 profile,
    activation executable, capability layers, and skill entrypoints retain
    exact pre-phase bytes;
11. focused tests, the complete inherited repository suite, syntax checks,
    deterministic rebuilds, and `git diff --check` pass;
12. one independent adversarial review reports no unresolved critical or
    important implementation defect.

## proof boundary

This milestone proves evaluator package integrity and Aegis v2 deterministic
behavior against one exact source/oracle family. It does not prove Aegis is
better than raw, rerun a model, authorize profile promotion, establish
cross-task generalization, or validate Forge and Muse evaluation.

The next evidence batch uses this ABI for separately preregistered work:

- a cross-trial portfolio that aggregates exact completed trial receipts by
  profile identity, freezes the task-selection and diversity rule, counts
  task-level wins, losses, ties, and regressions, and fails on the worst-task
  critical-regression gate;
- two fresh, materially distinct Aegis security tasks with objective
  source-oracle evaluation, ten retained model artifacts, and one independent
  five-row ledger per task;
- Forge implementation tasks with sandboxed executable acceptance receipts;
- Muse creative tasks with blinded pairwise reviewer packages and explicit
  order-bias controls.

Until the portfolio contract is independently certified, cross-task output is
reporting-only. Separate trial ledgers are never concatenated, and no pooled
profile or lifecycle request is emitted.

Godagents adapter v2 remains blocked until the portfolio layer and replicated
trials can justify a mode for at least one exact profile without a critical
regression. Case counts from one trial can never satisfy that gate.
