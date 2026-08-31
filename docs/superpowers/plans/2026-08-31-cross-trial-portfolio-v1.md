# Cross-Trial Portfolio v1 Implementation Plan

> **For agentic workers:** execute inline in this isolated worktree. Preserve
> certified parents and stop on any unexpected protected-artifact drift.

**Goal:** certify a preregistered, reporting-only reducer that counts one
outcome per independent task and cannot turn oracle-case counts into fake
recurrence.

**Architecture:** a closed portfolio policy governs an exact pre-dispatch task
plan. Each accepted adaptive-evidence v2 trial is independently reverified and
collapsed into a completion receipt with one outcome per candidate variant. A
deterministic reducer joins only exact plan members and emits descriptive
task-level metrics with no profile, lifecycle, activation, or authority path.

**Tech stack:** Node.js 24 ESM, built-in `node:test`, existing adaptive evidence
v2 contracts, canonical SHA-256 identities, closed JSON Schema artifacts.

**Spec:**
`docs/superpowers/specs/2026-08-31-cross-trial-portfolio-v1-design.md`

## global constraints

- Do not modify adaptive evidence v2 artifacts, policy, source, schemas,
  receipts, or archived Aegis matrix evidence.
- Do not modify adaptive evaluator package v1 artifacts or receipt.
- Do not dispatch a model or reinterpret historical outcomes.
- Never concatenate evidence rows across trials.
- Never aggregate `comparisons.matched`, wins, losses, or ties across tasks.
- A partial cohort can report incompleteness but can never pass a gate.
- A critical regression in any task fails that candidate variant.
- All output is reporting-only and authority-neutral.
- JSON Schema is structural only; every artifact must declare and pass its
  required runtime semantic verifier.
- Write behavior-changing production code only after its focused test fails.
- Use deterministic ordering and canonical digests for every identity.

---

### task 1: close the policy and schema contracts

**files:**

- Create: `policies/adaptive-evidence-portfolio.v1.json`
- Create: `src/adaptive-evidence-portfolio.mjs`
- Create: `tests/adaptive-evidence-portfolio.test.mjs`
- Generate: `schemas/adaptive-evidence-portfolio-v1/plan.schema.json`
- Generate: `schemas/adaptive-evidence-portfolio-v1/completion.schema.json`
- Generate: `schemas/adaptive-evidence-portfolio-v1/report.schema.json`

- [ ] Write failing imports and closed-policy tests.
- [ ] Assert exact policy identity, thresholds, variants, admissible evidence
  levels, and false authority fields.
- [ ] Assert unknown fields, changed policy bytes, and permissive authority
  flags fail closed.
- [ ] Implement `validatePortfolioPolicy` and `buildPortfolioSchemas`.
- [ ] Run the focused tests to green.

### task 2: preregister the exact portfolio

**interface:** `preregisterPortfolioPlan(options)` and
`verifyPortfolioPlan(options)`.

- [ ] Write failing tests for canonical plan identity and input reordering.
- [ ] Write rejection tests for duplicate slot ids, trial ids, task digests,
  missing axes, duplicate axes, insufficient diversity, and too few tasks.
- [ ] Implement exact profile binding, exact-set selection, generic diversity
  axes, ISO time checks, and `planDigest`.
- [ ] Prove that a changed task, profile, axis, or threshold changes identity or
  fails verification.

### task 3: finalize one independently verified trial

**interface:** `createCompletedTrialReceipt(options)` and
`verifyCompletedTrialReceipt(options)`.

- [ ] Build test helpers that create independent v2 trials, ledgers, and
  derived profiles without touching certified fixtures.
- [ ] Write failing happy-path tests for exact completion receipts.
- [ ] Reject incomplete ledgers, non-admissible evidence levels, profile drift,
  wrong slots, retrospective plans, mutated rows, duplicate variants, and
  early completion timestamps.
- [ ] Reverify trial and ledger, rederive and compare the profile, and collapse
  rows to raw reference plus one task outcome per candidate variant.
- [ ] Bind internal comparisons only through `caseEvidenceDigest`; expose no
  case counters in the completion receipt.

### task 4: reduce task outcomes without pooling ledgers

**interface:** `reduceTrialPortfolio(options)` and
`verifyPortfolioReport(options)`.

- [ ] Write a failing two-task test where one task has three internal cases and
  another has three thousand, but the report counts two task outcomes.
- [ ] Write a failing worst-task regression test where aggregate wins look
  strong but one critical regression forces failure.
- [ ] Write missing-slot, extra-member, duplicate-member, cross-profile, and
  input-reordering tests.
- [ ] Implement deterministic slot joins, incomplete status, task-level
  metrics, frozen gates, and exact support digests.
- [ ] Assert the report has no profile, mode recommendation, lifecycle action,
  activation request, or authority expansion path.

### task 5: generate deterministic fixtures and release receipt

**files:**

- Create: `scripts/build-adaptive-evidence-portfolio-v1.mjs`
- Create: `tests/adaptive-evidence-portfolio-receipt.test.mjs`
- Generate: `artifacts/adaptive-evidence-portfolio-v1/plan.json`
- Generate: `artifacts/adaptive-evidence-portfolio-v1/completions/*.json`
- Generate: `artifacts/adaptive-evidence-portfolio-v1/report.json`
- Generate: `docs/adaptive-evidence-portfolio-v1-report.md`
- Generate: `receipts/adaptive-evidence-portfolio-v1.json`

- [ ] Write a failing receipt test that requires exact parent digests, source
  bindings, output manifests, proof limits, and authority-neutral gates.
- [ ] Build two independent synthetic model-level ledgers under one exact
  profile and radically different internal case counts.
- [ ] Use the repository's transactional multi-file writer.
- [ ] Keep parent-bound `package.json` byte-identical and invoke the new builder
  directly with `node scripts/build-adaptive-evidence-portfolio-v1.mjs`.
- [ ] Run the builder twice and compare every generated byte.

### task 6: review, certify, and release

**files:**

- Create: `docs/adaptive-evidence-portfolio-v1-certification.md`

- [ ] Run syntax checks and focused portfolio tests.
- [ ] Confirm certified parent paths are byte-identical to branch base.
- [ ] Request one independent bounded review of the exact implementation head.
- [ ] Repair only confirmed defects test-first and repeat review if needed.
- [ ] Run two deterministic rebuilds.
- [ ] Run the full repository test suite once at the release gate.
- [ ] Record exact commit ids, logical digests, file hashes, test counts,
  reviewer disposition, and proof limits in certification.
- [ ] Fast-forward merge the verified branch into `main`, push, confirm
  `main == origin/main`, and remove only this clean feature worktree.
- [ ] Select the next evidence-backed milestone. The expected next step is a
  real preregistered Aegis portfolio, not a Godagents activation change.
