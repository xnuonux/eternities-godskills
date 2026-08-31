# Cross-Trial Portfolio v1 Design

## status

Approved for implementation under Dom's standing continuous Godskills and
Godagents development instruction on 2026-08-31.

This is the bounded phase 2.2 milestone after adaptive evaluator packages v1.
It adds a preregistered, reporting-only portfolio protocol that counts one
outcome per independent task. It does not rerun a model, reinterpret the
archived Aegis matrix, emit a pooled activation profile, change lifecycle
state, or alter Godagents runtime behavior.

## problem

Adaptive evidence v2 correctly keeps every trial isolated, but its
`matchedComparisons` counter represents oracle cases inside one task. Three
findings in one security review are not three independent demonstrations that
a capability improves an agent. Aggregating those counters across ledgers
would let one case-rich task masquerade as recurrence.

A trustworthy cross-task layer must also prevent retrospective task selection.
If tasks can be included after their outcomes are known, a portfolio can hide
hard losses, repeat near-duplicate tasks, or mix incompatible model profiles.
The selection set and its diversity requirements therefore have to exist
before any member trial is registered.

## decision

Build a separate v1 portfolio protocol with four immutable artifacts:

1. a portfolio plan preregistering one exact profile and one exact task set;
2. a signed pre-dispatch witness for that exact plan, verified against a
   host-pinned independent authority trust root;
3. one completion receipt per independently verified adaptive-evidence v2
   trial;
4. one deterministic report reducing each intervention to one win, loss, or
   tie per task.

The report is descriptive evidence. It can state which variants passed the
frozen portfolio evidence gate, but it cannot recommend a runtime mode, create
an activation profile, request a lifecycle transition, or grant authority.

## invariant boundary

- Every member keeps its own trial envelope, ledger, and profile.
- Evidence rows are never copied into or concatenated inside a portfolio.
- Internal oracle-case counts are bound by digest but never summed by the
  portfolio reducer.
- The exact profile identity must match across the plan and every member.
- The plan is signed by a host-pinned witness authority before every accepted
  member trial is registered.
- A caller-supplied plan timestamp is never sufficient evidence of
  preregistration.
- Every accepted task occupies one preregistered slot with an exact trial id
  and task-definition digest.
- Duplicate trial ids, trial digests, ledger digests, profile digests, task
  definition digests, completion digests, or slot ids are rejected.
- Missing slots produce an incomplete report, never a smaller passing cohort.
- Any critical regression on a task fails that variant's worst-task gate.
- The protocol is reporting-only and cannot expand authority.

## portfolio policy

`policies/adaptive-evidence-portfolio.v1.json` is closed and digest-pinned. It
contains:

- protocol and schema identity;
- the exact adaptive-evidence trial and candidate variants;
- evidence levels admissible to a cross-task portfolio;
- a minimum of two completed, distinct tasks;
- at least two diversity axes with at least two distinct values on every axis;
- task-level win, loss, win-rate, and critical-regression thresholds;
- mandatory complete-cohort and exact-preregistered-set behavior;
- explicit false values for pooled profiles, lifecycle action, activation
  requests, and authority expansion.

The initial evidence gate is deliberately strict: at least two task wins, at
least a two-thirds task win rate, no task losses, and no critical regression.
Passing this gate means only "eligible for independent activation review."
It is not activation.

## portfolio plan

`preregisterPortfolioPlan` accepts:

```js
{
  portfolioId,
  profileIdentity,
  selectionRule: {
    mode: "exact-preregistered-set",
    diversityAxes: ["surface", "failure-mode"],
    minimumDistinctValues: [
      { axis: "surface", count: 2 },
      { axis: "failure-mode", count: 2 }
    ]
  },
  taskSlots: [
    {
      slotId,
      trialId,
      taskDefinition: { id, version, digest },
      diversityValues: [
        { axis: "surface", value: "filesystem-boundary" },
        { axis: "failure-mode", value: "path-alias" }
      ]
    }
  ],
  registeredAt,
  policy,
  expectedPolicyDigest
}
```

The plan compiler canonicalizes slot and diversity ordering, verifies that all
declared axes are present exactly once in every slot, enforces each minimum
distinct-value count, and rejects repeated task definitions. The resulting
`planDigest` binds the exact cohort to be witnessed before dispatch.

The generic protocol does not prescribe domain labels. A future Aegis cohort
may use attack surface and failure mode; Forge may use implementation domain
and acceptance mechanism; Muse may use visual family and reviewer rubric.
The exact axes and values are still frozen in each plan.

## preregistration witness

`createPortfolioWitnessAuthority` compiles a host-pinned Ed25519 trust root and
returns the only runtime verifier accepted by completion and reduction. A
valid witness signs the exact plan digest, portfolio-policy digest, registry
identity, monotonic sequence, previous-witness digest, witnessed time, and an
explicit `dispatchNotStarted: true` statement.

The witness must be created at or after plan registration and strictly before
every member trial registration. Completion and report identities bind the
verified witness digest, witnessed time, and authority trust-root digest.
Supplying a different authority object, an untrusted key, an altered plan, a
late witness, or an unsigned timestamp fails closed.

The signature proves that a key accepted by the host made the attestation. Its
chronology remains dependent on the operational integrity of the independent
witness authority: the authority must refuse retrospective signing and the
host must pin the intended trust root. The deterministic fixture signer is
committed only to reproduce protocol fixtures. Its private key is public test
material and is never a production trust root.

## completed trial receipt

`createCompletedTrialReceipt` consumes a plan slot plus the exact adaptive
evidence v2 trial, ledger, and derived profile. It performs all existing trial
and ledger verification again, re-derives the profile from the ledger, and
requires byte-equivalent canonical profile content.

A trial is complete only when:

- it matches the plan's profile and exact task slot;
- the exact plan has a valid host-pinned witness;
- its registration time is strictly after the signed witness time;
- its ledger contains exactly one row for every frozen trial variant;
- every row has a portfolio-admissible proof level;
- its completion time is after the last observation;
- its raw row remains a baseline and every intervention has exactly one
  `win`, `loss`, or `tie` outcome.

The completion receipt contains no oracle-case counters. It binds those
counters through a `caseEvidenceDigest`, then exposes only:

- the raw row reference;
- one task-level outcome and critical-regression bit per candidate variant;
- exact trial, ledger, profile, task, comparison-policy, row, plan, and policy
  digests;
- a canonical `completionDigest`.

This makes case-count inflation unavailable to the portfolio reducer by
construction.

## portfolio reducer

`reduceTrialPortfolio` verifies the plan and every supplied member bundle,
then joins receipts to preregistered slots. It is deterministic under input
reordering.

For each candidate variant it reports:

- completed task count;
- task wins, losses, and ties;
- task win rate;
- critical-regression count;
- whether the worst task had a critical regression;
- exact failed gates;
- the member completion digests supporting the count.

When any slot is missing, `status` is `incomplete`, all candidate gate results
are false, and the report lists the missing slots. Extra or unregistered
members are rejected instead of ignored.

When all slots are present, `status` is `complete`. A candidate may then pass
the evidence gate, but output is still marked:

```json
{
  "reportingOnly": true,
  "profilePromotionAllowed": false,
  "lifecycleActionAllowed": false,
  "activationRequestAllowed": false,
  "authorityExpanded": false
}
```

The report schema intentionally has no `recommendedMode`, activation profile,
lifecycle decision, or runtime request field.

JSON Schema is the portable structural gate, not the semantic verifier. Each
artifact carries `semanticVerificationRequired: true`, the policy fixes
`schemaValidationSufficient: false`, and each schema names its required
runtime verifier. Plan axis equality, digest recomputation, exact evidence
lineage, derived counters, and report consistency must be checked by
`verifyPortfolioPlan`, `verifyCompletedTrialReceipt`, or
`verifyPortfolioReport` as applicable. The report schema additionally enforces
that complete reports have no missing slots and incomplete reports cannot
claim a passing candidate.

## schemas and deterministic release receipt

The protocol generates closed JSON Schemas for the plan, preregistration
witness, completion receipt, and report. A deterministic builder produces a
two-task fixture cohort whose internal case counts differ dramatically while
its portfolio counts remain exactly two tasks. It writes:

- the four schemas;
- one fixture plan;
- one fixture plan witness and its public trust-root identity;
- two independent fixture trial completions;
- one complete fixture report;
- one human-readable report;
- one aggregate release receipt.

The release receipt binds the portfolio policy, protocol source, builder,
schemas, fixtures, adaptive evidence v2 parent receipt, and adaptive evaluator
packages v1 parent receipt. Two rebuilds must reproduce every output byte.

## threat model and rejection tests

The implementation must reject:

- an unsigned plan timestamp presented as preregistration evidence;
- a witness created after a member trial;
- a witness signed by a caller-controlled or unpinned key;
- a witness whose plan, policy, registry, chronology, chain, or signature was
  altered;
- a member not named by the exact preregistered set;
- duplicate or aliased tasks and trials;
- a changed profile field or profile digest;
- a changed trial, ledger, row, evaluator, task, or comparison-policy digest;
- incomplete variant coverage;
- fixture or structural evidence presented as model evidence;
- a completion time before its observations;
- a member array reordered to manipulate identity;
- high internal oracle-case counts used as multiple task wins;
- a missing losing task hidden from a partial cohort;
- any attempt to add activation, profile, lifecycle, or authority fields.

## proof boundary

Under a host-pinned witness authority that refuses retrospective signing, this
milestone can prove that cross-trial evidence was selected before dispatch,
kept profile-exact, reduced at task granularity, and blocked by the worst-task
critical-regression gate. The repository cannot independently prove that an
external authority's clock or refusal policy was honest. Its committed fixture
key proves deterministic protocol behavior only.

It cannot prove that Aegis, Forge, Muse, any Godskill, or any Godagent is
better than a raw agent. That requires fresh, materially distinct,
preregistered model trials after this protocol is certified. Godagents adapter
v2 remains blocked until such evidence passes independent review.
