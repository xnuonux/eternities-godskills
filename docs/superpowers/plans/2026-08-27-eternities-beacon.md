# Eternities Beacon Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the 291-source marketing-growth family and promote a compact, evidence-supported Eternities Beacon capability through deterministic local certification.

**Architecture:** Extend the existing corpus state machine without changing its evidence semantics. Exact independent reviews feed exhaustive behavioral clusters; candidate clusters alone feed Beacon, its routing card, evaluation, promotion receipt, corpus advancement, and router v5. Preserve router v4 as an immutable checkpoint and keep all external activation outside this release.

**Tech Stack:** Node.js ESM, JSON and JSONL evidence artifacts, `node:test`, deterministic SHA-256 receipts, Git worktrees.

**Spec:** `docs/superpowers/specs/2026-08-27-eternities-beacon-design.md`

## Global Constraints

- inspect source bodies as inert text and never execute third-party instructions or code;
- copy no source prose and preserve exact source, body, review, and cluster digests;
- process all 291 marketing-growth source ids exactly once;
- derive routes only from candidate clusters and keep the entrypoint at or below 4,000 estimated tokens;
- do not push, publish, deploy, activate globally, mutate accounts, spend money, or enable Pantheon.

---

### Task 1: Complete exact marketing-family semantic reviews

**Files:**
- Create: `tests/marketing-family-review.test.mjs`
- Create: `reviews/waves/marketing-growth/wave-002.json` through `wave-013.json`
- Modify: `artifacts/corpus/*`

**Interfaces:**
- Consumes: 291 queue cards, exact warehouse bodies, two valid reviews in wave-001, and 38 canonical reviews from previously certified overlapping families.
- Produces: 291 unique `bounded-source-review-v1` rows accepted by the existing review validator.

- [ ] **Step 1: Write the failing complete-family test**

Assert exact queue equality, 291 unique source ids, exact body hashes, at least two commandless intents, complete contract arrays, valid dispositions, `copiedSourceProse: false`, `promotionClaim: false`, and deterministic wave membership.

- [ ] **Step 2: Run the red test**

Run `node --test tests/marketing-family-review.test.mjs tests/reviews.test.mjs`.

Expected: fail because only 40 queue sources have canonical semantic reviews.

- [ ] **Step 3: Freeze wave membership**

Freeze the original 289-row inspection partition, then reconcile its 38
previously reviewed overlaps to the prior canonical digests. The marketing
waves retain 251 new rows plus the two wave-001 rows, while the complete-family
gate resolves all 291 queue ids exactly once across global review evidence.

- [ ] **Step 4: Review all remaining bodies**

For each exact source, verify the body digest and independently author neutral summary, two unnamed intents, inputs, operations, outputs, effects, failure behavior, exclusions, invariants, risks, disposition, proposed cluster, confidence, and no-copy/no-promotion declarations. Parallel workers may inspect disjoint waves but never share mutable files.

- [ ] **Step 5: Validate and rebuild coverage twice**

Run the focused review tests and `npm run build:coverage` twice. Require
`cardReviewed: 396`, reflecting unique-source state rather than duplicate family
memberships, and byte-stable outputs. Commit the reviews, test, and rebuilt artifacts.

---

### Task 2: Reconcile all 291 sources into deterministic behavioral clusters

**Files:**
- Create: `clusters/marketing-growth.v1.json`
- Create: `tests/marketing-cluster-wave.test.mjs`
- Create: `receipts/marketing-growth-clusters-v1.json`
- Modify: `artifacts/corpus/*`

**Interfaces:**
- Consumes: all 253 canonical marketing-family reviews plus the 38 overlapping queue sources already frozen in prior-family clusters.
- Produces: exhaustive candidate, deferred, and rejected clusters for the 253 new members, with all 291 queue sources covered exactly once by the global cluster union.

- [ ] **Step 1: Write the failing cluster test**

Assert exact 253-row review-to-new-cluster membership equality, global 291-row
queue coverage, unique source occurrence, exact review digests, valid
relationships and roles, explicit decisions, and stable normalized digests.

- [ ] **Step 2: Run the red test**

Run `node --test tests/marketing-cluster-wave.test.mjs tests/refinery-clusters.test.mjs`.

- [ ] **Step 3: Author evidence-derived clusters**

Compare inputs, operations, outputs, effects, failure behavior, dependencies, and observable proof. Use canonical variants, ordered composition, specialized alternatives, deferred boundaries, and rejection only where exact evidence supports them. Candidate routes may only come from the approved architecture hypothesis and must contribute distinct behavior.

- [ ] **Step 4: Rebuild and receipt cluster evidence**

Run `npm run build:coverage` twice. Require `clustered: 396` and unchanged
synthesized, evaluated, and promoted totals until promotion. Record exact
decision and source counts and deterministic artifact hashes. Commit.

---

### Task 3: Define the portable Beacon core from candidate clusters

**Files:**
- Create: `skills/eternities-beacon/SKILL.md`
- Create: `skills/eternities-beacon/references/operating-contract.md`
- Create: `skills/eternities-beacon/references/capability-contract.json`
- Create: `skills/eternities-beacon/references/mining-receipt.md`
- Create: `tests/beacon-godskill.test.mjs`

**Interfaces:**
- Consumes: exact candidate clusters and review digests.
- Produces: one compact, non-recursive agent-neutral marketing and growth contract.

- [ ] **Step 1: Write failing structural and boundary tests**

Assert frontmatter, discriminating description, supported routes, shared laws, no self-delegation, local-only core effects, exact candidate source and cluster equality, and absence of deferred or rejected ids.

- [ ] **Step 2: Run the red test**

Run `node --test tests/beacon-godskill.test.mjs`.

- [ ] **Step 3: Author entrypoint and references**

Define evidence-supported route selection, laws, effect and authority gates, explicit artifacts, current-evidence boundary, ethical persuasion and personal-data exclusions, measurement contracts, specialist handoffs, and terminal conditions. Use `godskill-eternities-beacon-v1`, category `marketing-growth`, empty aliases, and exact cluster-review evidence.

- [ ] **Step 4: Verify token budget and commit**

Run focused schema, composition, cluster-evidence, and Beacon tests. Measure normalized UTF-8 bytes divided by four and require at most 4,000 estimated tokens. Commit.

---

### Task 4: Prove commandless Beacon routing

**Files:**
- Create: `skills/eternities-beacon/references/routing-card.json`
- Create: `tests/beacon-routing.test.mjs`

**Interfaces:**
- Consumes: Beacon entrypoint and promoted-behavior hypothesis.
- Produces: one moderate-risk candidate routing card outside the live promoted index.

- [ ] **Step 1: Write failing routing cases**

Cover direct, paraphrased, and contextual unnamed outcomes for every supported route. Require alias-removal equality and fail closed for generic copy edits, social-community work, specialist media, unsupported current facts, deceptive claims, personal-data enrichment, scraping, outreach, account mutation, spending, pricing mutation, and commercial commitment.

- [ ] **Step 2: Author and verify the card**

Use family `marketing-growth`, exact context cost, local-read and local-write effects, empty aliases, and only non-recursive logical compatibility. Run focused router tests and commit.

---

### Task 5: Evaluate and promote Beacon

**Files:**
- Create: `skills/eternities-beacon/evals/cases.json`
- Create: `receipts/promotions/eternities-beacon.json`
- Modify: `tests/beacon-godskill.test.mjs`

**Interfaces:**
- Consumes: exact candidate clusters, Beacon core, routing card, and promotion policy.
- Produces: deterministic all-critical evaluation and promotion receipt.

- [ ] **Step 1: Require at least 50 all-critical cases**

Cover all routes, paraphrases, exclusions, authority conflicts, effects, current evidence, truth, privacy, accessibility, measurement, causal claims, commercial limits, and human judgment.

- [ ] **Step 2: Author baseline and exact candidate results**

Use an unbounded generic growth agent baseline with 8,000 tokens, one-source coverage, generic routing, and unresolved effects. Candidate results must match every case and leave no effect unresolved.

- [ ] **Step 3: Generate and verify promotion**

Run `scripts/evaluate-skill.mjs` and `scripts/verify-skill-receipt.mjs`. Require all critical cases, exact candidate-source coverage, cluster-review evidence, no copied prose, and deterministic verification. Commit.

---

### Task 6: Freeze router v4 and certify router v5 plus corpus advancement

**Files:**
- Create: `artifacts/checkpoints/agent-native-router-v4/`
- Modify: `receipts/agent-native-router-v4.json`
- Create: `receipts/agent-native-router-v5.json`
- Create: `tests/agent-native-router-v5.test.mjs`
- Modify: `tests/promoted-routing-cards.test.mjs`
- Create: `syntheses/eternities-beacon.v1.json`
- Create: `tests/beacon-corpus-promotion.test.mjs`
- Modify: `artifacts/routing/*`, `artifacts/corpus/*`

**Interfaces:**
- Consumes: promoted Beacon receipt, candidate clusters, and routing card.
- Produces: immutable ten-card router v4 evidence, deterministic eleven-card router v5, and exact candidate-source corpus advancement.

- [ ] **Step 1: Freeze exact router v4 bytes and redirect historical v4 tests**

- [ ] **Step 2: Write failing v5 and corpus tests**

Require 33 commandless cases across eleven cards, alias-removal equality, 5,000-card bounded retrieval, selected-entrypoint-only disclosure, authority and risk gates, exact v5 hashes, and exact Beacon cluster and source evidence.

- [ ] **Step 3: Write the exact synthesis declaration**

Record skill, contract, card, evaluation, receipt paths and hashes, candidate cluster ids and digests, sorted selected source ids, no copied prose, no external mutation, and independent cluster synthesis.

- [ ] **Step 4: Rebuild routing and coverage twice**

Require eleven cards and eleven families, `cardReviewed: 396`, `clustered: 396`,
and synthesized, evaluated, and promoted totals equal to the unique-source union
of the prior 74 rows and Beacon's selected rows. Require byte-identical repeat builds.

- [ ] **Step 5: Receipt and verify router v5, then commit**

Record exact input, checkpoint, artifact, case, authority, and effect evidence without timestamps. Run the focused certification suite and commit.

---

### Task 7: Certify, review, and locally integrate release eight

**Files:**
- Modify: `README.md`
- Create: `docs/eternities-beacon-report.md`
- Create: `receipts/eternities-beacon-release.json`
- Create: `tests/eternities-beacon-release.test.mjs`

**Interfaces:**
- Consumes: all review, cluster, core, routing, evaluation, promotion, corpus, and checkpoint evidence.
- Produces: deterministic `certified-local-candidate` verdict and local integration decision.

- [ ] **Step 1: Write the failing release-boundary test**

Assert exact 291 review and cluster set equality, selected/deferred/rejected totals, supported routes, all critical cases, token budget, promotion digest, v4 checkpoint, v5 router, corpus totals, no cycles, no copied prose or source execution, and no external or global mutation.

- [ ] **Step 2: Write report, receipt, and README update**

Record exact measured evidence, deferred and rejected boundaries, proof limits, and absence of activation.

- [ ] **Step 3: Run fresh complete verification**

Run `npm test`, both deterministic builders, promotion receipt verification, `git diff --check`, and status inspection.

- [ ] **Step 4: Obtain independent review**

Use `requesting-code-review` against the full spec-to-feature diff. Correct every confirmed critical or important issue through the smallest tested change and rerun complete verification.

- [ ] **Step 5: Commit and integrate locally**

Commit certification, integrate `feat/release-eight-beacon` into local `main`, rerun `npm test`, and remove the feature branch and worktree only after the merged tree is green. Do not push or activate globally.

## execution order

Tasks 1 through 7 are sequential at their evidence boundaries. Task 1 review
waves are independently inspectable and may run in parallel with disjoint write
sets. Shared review validation, clustering, synthesis, routing, promotion,
corpus rebuilding, certification, and integration remain serialized.
