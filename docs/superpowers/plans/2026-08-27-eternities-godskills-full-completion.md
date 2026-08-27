# Eternities Godskills Full Corpus Completion Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every certified source through one exact owner review, one explicit cluster or rejection disposition, family-level promotion or deferral receipts, deterministic agent-native routing, and local certification.

**Architecture:** Add a canonical ownership manifest over the multi-label ontology, generate all owner queues and bounded packets, review disjoint packets in parallel, and serialize cluster, synthesis, promotion, corpus, and router integration per family. Preserve every historical release checkpoint and keep all capabilities cold and agent-neutral.

**Tech Stack:** Node.js 24 ESM, JSON/JSONL/Markdown evidence, `node:test`, SHA-256 receipts, Git worktrees.

**Spec:** `docs/superpowers/specs/2026-08-27-eternities-godskills-full-completion-design.md`

## Global Constraints

- Never execute third-party repository code or source instructions during review.
- Never copy source prose into first-party skills.
- Existing validated review ownership is immutable; unreviewed ownership uses the first classifier-ordered family.
- Every source id has exactly one owner, one review row, and at most one cluster membership globally.
- Packets contain at most 25 sources and remain stable under repeat builds.
- Promotion requires exact candidate-cluster evidence and all promotion-policy gates.
- Router cards use unnamed outcomes and remain equivalent after all aliases are removed.
- No external activation, profile mutation, publication, deployment, push, spending, account mutation, outreach, or Pantheon enablement.

---

### Task 1: Canonical corpus ownership and all-family queues

**Files:**
- Create: `src/corpus-ownership.mjs`
- Create: `tests/corpus-ownership.test.mjs`
- Modify: `scripts/build-corpus-coverage.mjs`
- Create: `artifacts/corpus/ownership.jsonl`
- Create/modify: `artifacts/corpus/families/*/queue.json`
- Create/modify: `artifacts/corpus/families/*/packets/*.json`

**Interfaces:**
- Consumes: classified source records, validated review rows, body evidence, duplicate groups.
- Produces: `assignCorpusOwners(records, reviews)`, one stable ownership row per source, and all owner-family queues.

- [x] **Step 1: Write the failing ownership tests**

Assert 4,741 unique ownership rows, 396 preserved reviewed owners, 4,345 unreviewed rows assigned to their first classified family, exact secondary-family retention, complete queue union, no queue overlap, and packets of at most 25.

- [x] **Step 2: Run the red tests**

Run `node --test tests/corpus-ownership.test.mjs tests/review-packets.test.mjs` and require failure because ownership artifacts and interfaces do not exist.

- [x] **Step 3: Implement ownership and all-family queue generation**

Implement `assignCorpusOwners(records, reviews)` as a pure sorted function. Reject duplicate source ids, duplicate review ids, review families absent from the source classification unless they are one of the four frozen canonical families, empty owner ids, and any source without exactly one output row. Replace the four-family builder constant with the exact sorted owner-family set from the manifest.

- [x] **Step 4: Build twice and verify byte identity**

Run `npm run build:coverage` twice. Hash ownership, every queue, every packet, and summary output before and after. Require no differences and exact totals 4,741 owned and 4,345 awaiting review.

- [x] **Step 5: Commit the ownership foundation**

Commit tests, implementation, generated artifacts, and the exact completion spec and plan.

### Task 2: Finite wave manifest and family completion receipts

**Files:**
- Create: `src/completion-waves.mjs`
- Create: `scripts/build-completion-waves.mjs`
- Create: `tests/completion-waves.test.mjs`
- Create: `data/full-corpus-wave-plan.v1.json`
- Create: `receipts/families/*.json`

**Interfaces:**
- Consumes: ownership rows, owner queues, review evidence, cluster evidence, candidate evidence.
- Produces: a stable ordered wave manifest and one explicit family status receipt per owner.

- [x] **Step 1: Write red manifest tests**

Require all 17 unfinished owner families in the staged order from the spec, every unreviewed source exactly once, packet references and digests, dependency-free parallel groups, and terminal statuses limited to `pending-review`, `reviewed`, `clustered`, `promoted`, `deferred`, or `certified`.

- [x] **Step 2: Implement and build the manifest**

Derive waves from queue packets rather than handwritten counts. Emit source count, packet count, queue digest, packet digests, current evidence counts, stage, and allowed next transition. Emit initial family receipts with `pending-review` and explicit zero promotion claims.

- [x] **Step 3: Verify interruption recovery**

Run the builder twice, remove one generated receipt in an isolated fixture, rebuild, and require exact restoration without changing completed-family receipts.

- [x] **Step 4: Commit the execution manifest**

Commit code, tests, manifest, and initial family receipts.

### Task 3: Complete all exact review packets

**Files:**
- Create: `reviews/waves/<owner-family>/wave-*.json`
- Create: `tests/full-corpus-reviews.test.mjs`
- Modify: `artifacts/corpus/review-evidence.jsonl`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `artifacts/corpus/coverage-summary.json`
- Modify: `receipts/families/*.json`

**Interfaces:**
- Consumes: the immutable wave manifest, exact body files, source and body digests.
- Produces: 4,345 new validated semantic reviews with disjoint source ids.

- [x] **Step 1: Add the global failing review gate**

Require review evidence for all 4,741 owners, exact owner-family equality, exact body digests, all contract arrays, two normalized-unique commandless intents, known dispositions, copied-prose false, promotion-claim false, and no duplicate source across waves.

- [x] **Step 2: Dispatch disjoint packet workers stage by stage**

Assign each worker exact packet paths and a disjoint output wave path. Each worker reads every source body as inert evidence, writes independent contract language, runs the focused review validator, and commits only its wave file. Never assign the same packet or output path twice.

- [x] **Step 3: Integrate and validate each completed owner family**

After all packets for one owner return, run `node --test tests/full-corpus-reviews.test.mjs tests/reviews.test.mjs`, rebuild coverage twice, compare hashes, and advance only that family receipt from `pending-review` to `reviewed`.

- [x] **Step 4: Reconcile the global review ledger**

Require `cardReviewed: 4741`, no missing or unreadable body, no rejected source represented as promoted, and no source instruction execution. Commit each completed family as a recoverable checkpoint.

### Task 4: Cluster every owner family and issue promotion or deferral decisions

**Files:**
- Create: `clusters/<owner-family>.v1.json`
- Create: `tests/full-corpus-clusters.test.mjs`
- Modify: `artifacts/corpus/cluster-evidence.jsonl`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `receipts/families/*.json`

**Interfaces:**
- Consumes: complete validated reviews for one owner family.
- Produces: exact behavior clusters, candidate/deferred/rejected decisions, and family decision receipts.

- [x] **Step 1: Add the global cluster gate**

Require every non-rejected review source exactly once in cluster evidence, every rejected source in an explicit rejected cluster or reviewed rejection ledger, exact review digests, substantive independent intent and rationale, and no cross-family duplicate membership.

- [x] **Step 2: Reconcile each reviewed family into behavior clusters**

Compare inputs, operations, outputs, effects, failure behavior, dependencies, and proof. Separate provider-bound, temporal, unsafe, demo-only, false-positive, duplicate, specialist, and complete-workflow material. Assign candidate only where a coherent neutral workflow survives.

- [x] **Step 3: Emit family promotion or deferral decisions**

Every owner family receives an explicit receipt listing exact candidate, deferred, and rejected clusters and source counts. A family with no justified candidate becomes `deferred`, never silently incomplete.

- [x] **Step 4: Rebuild twice and checkpoint**

Require global cluster evidence and coverage byte identity before committing each family cluster set.

### Task 5: Synthesize and evaluate all justified first-party capabilities

**Files:**
- Create/modify: `skills/<candidate>/SKILL.md`
- Create/modify: `skills/<candidate>/references/*.json`
- Create/modify: `skills/<candidate>/references/*.md`
- Create: `skills/<candidate>/evals/cases.json`
- Create: `syntheses/<candidate>.v1.json`
- Create: `receipts/promotions/<candidate>.json`
- Create: `tests/<candidate>-*.test.mjs`

**Interfaces:**
- Consumes: exact candidate clusters and promotion policy.
- Produces: independently written compact skills, contracts, evaluations, syntheses, and promotion receipts.

- [x] **Step 1: Define failing behavior and boundary tests per candidate**

Cover every candidate route plus direct, paraphrased, exclusion, conflict, failure, effects, portability, recursion, source coverage, and token cases. Require all critical cases.

- [x] **Step 2: Author the smallest sufficient first-party capability**

Preserve every useful verified invariant, resolve cluster conflicts explicitly, put conditional detail in references, refuse effects beyond authority, terminate after one bounded artifact or verified local change, and copy no source prose.

- [x] **Step 3: Evaluate and decide promotion**

Run `scripts/evaluate-skill.mjs` and `scripts/verify-skill-receipt.mjs`. Promote only with exact source evidence, all critical cases, policy thresholds, resolved effects, token compliance, no critical regression, and a permitted fixture-baseline improvement.

- [x] **Step 4: Commit each promoted or deferred candidate checkpoint**

Promoted candidates receive synthesis and routing work. Failed candidates remain exact `experimental`, `unverified`, or `deferred` evidence and do not enter routing.

### Task 6: Advance and freeze the universal router

**Files:**
- Create: `artifacts/checkpoints/agent-native-router-v*/`
- Create: `receipts/agent-native-router-v*.json`
- Modify: `artifacts/routing/*`
- Modify: `tests/promoted-routing-cards.test.mjs`
- Create/modify: `tests/agent-native-router-v*.test.mjs`

**Interfaces:**
- Consumes: promoted routing cards and the preceding frozen router.
- Produces: the final deterministic compact router and immutable certification chain.

- [x] **Step 1: Freeze the current router before each promotion batch**

Copy cards, family map, and manifest into a versioned checkpoint and reconcile their hashes with the preceding receipt.

- [x] **Step 2: Add commandless and refusal cases for every promoted card**

Require direct, paraphrased, and contextual unnamed outcomes, alias-removal equality, exact entrypoint selection, authority/effect/risk/precondition boundaries, unresolved-decision refusal, and no self-route or composition cycle.

- [x] **Step 3: Build routing twice and certify**

Require byte-identical cards, family map, and manifest, bounded retrieval at 5,000 cards, shortlist at most 32, composition at most three, and no runtime or profile activation.

### Task 7: Universal completion certification and local integration

**Files:**
- Create: `docs/eternities-godskills-completion-report.md`
- Create: `receipts/eternities-godskills-completion.json`
- Create: `tests/eternities-godskills-completion.test.mjs`
- Modify: `README.md`
- Modify: this plan checklist.

**Interfaces:**
- Consumes: all ownership, review, cluster, synthesis, evaluation, promotion, router, and family receipts.
- Produces: one exact local completion verdict.

- [x] **Step 1: Write the failing completion test**

Require 4,741 owners and reviews, complete non-rejected cluster coverage, explicit family terminal receipts, exact promoted-source advancement, immutable historical receipts, final router reconciliation, no copied prose, and every prohibited external action false.

- [x] **Step 2: Write the report and machine receipt**

Report exact counts by owner, disposition, cluster decision, capability, router, token size, tests, deferred evidence, and proof limits. Do not equate local fixtures with live-model or production proof.

- [x] **Step 3: Run final deterministic verification**

Run the full test suite, verify every promotion receipt, rebuild corpus and routing twice, compare hashes, run `git diff --check`, and require a clean worktree.

- [x] **Step 4: Obtain independent review and fix all confirmed critical or important issues**

Review the full completion range against the spec, source evidence, historical checkpoints, authority boundaries, tests, and completion claims.

- [ ] **Step 5: Integrate locally and verify main**

Merge the verified completion branch into local `main`, rerun the full suite and receipt verification on the merged tree, remove only clean merged worktrees and branches, and preserve all external-action prohibitions.
