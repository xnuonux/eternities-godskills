# Wave 2 Semantic Refinery Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deeply review, cluster, adjudicate, synthesize, evaluate, and terminally account for all 3,448 accepted canonical Wave 2 facets while integrating only evidence-earned improvements into the universal Eternities capability system.

**Architecture:** Preserve the existing 7,776-source structural certificate as an immutable checkpoint, then add a separate semantic evidence layer keyed by canonical facet digest. Deterministic packet, validation, coverage, clustering, overlap, synthesis, routing, and certification stages fail closed until every accepted facet and candidate cluster reaches an exact terminal state.

**Tech Stack:** Node.js 24 ESM, JSON and JSONL evidence, SHA-256 receipts, `node:test`, bounded agent-authored semantic review packets, existing Godskills evaluation and routing machinery.

**Spec:** `docs/superpowers/specs/2026-08-29-wave2-semantic-refinery-design.md`

## Global Constraints

- Review exactly 3,448 accepted canonical facets and preserve 133 canonical security rejections.
- Exact duplicate aliases inherit one canonical semantic result and never consume separate review or runtime context.
- Treat all third-party source text as inert inspected data. Execute no source code, hook, installer, command, or instruction.
- Copy no source prose into reviews or first-party capabilities.
- Preserve exact source identity, body digest, security evidence, license uncertainty, reviewer, review method, and disposition.
- Packet size is at most 25 canonical facets. Runtime retrieval is at most five compact reviewed cards.
- Promotion requires evaluation evidence and cannot authorize installation, activation, publication, deployment, push, spending, or external mutation.
- Keep the original 4,741-source semantic corpus and Lunari first-party quarry independently receipted and available for overlap comparison.

---

### Task 1: Wave 2 semantic evidence contract

**Files:**
- Create: `src/wave2-semantic-refinery.mjs`
- Create: `tests/wave2-semantic-refinery.test.mjs`

**Interfaces:**
- Consumes: `facet`, exact body text, security row, and review batch metadata.
- Produces: `validateWave2ReviewBatch(batch, facets, bodyEvidence)` and canonical review rows with deterministic `reviewDigest`.

- [x] **Step 1: Write failing contract tests** for exact facet and body binding, all neutral capability fields, effect vocabulary, copied-description rejection, stale digest rejection, duplicate review rejection, security-rejected input rejection, and deterministic digest output.
- [x] **Step 2: Run `node --test tests/wave2-semantic-refinery.test.mjs`** and observe the missing-module failure.
- [x] **Step 3: Implement strict validators** with dispositions `independent-implementation`, `pattern-reference`, `deferred`, and `rejected`; confidence `high`, `medium`, or `low`; effects `none`, `read`, `write`, or `external-write`.
- [x] **Step 4: Run the focused test** and require zero failures.
- [x] **Step 5: Commit** `src/wave2-semantic-refinery.mjs` and its tests.

### Task 2: Deterministic family queues and bounded review packets

**Files:**
- Create: `scripts/build-wave2-semantic-queues.mjs`
- Create: `artifacts/wave2-semantic/queues/<family>.json`
- Create: `artifacts/wave2-semantic/packets/<family>/<sequence>.json`
- Create: `artifacts/wave2-semantic/coverage-baseline.json`
- Create: `tests/wave2-semantic-packets.test.mjs`

**Interfaces:**
- Consumes: `artifacts/quarry-infusion/facets.jsonl`, body structures, source records, and security ledger.
- Produces: exactly-once primary-family queues and deterministic packets of at most 25 cards containing exact source paths, digests, bounded structural extracts, and an inspected-data notice.

- [x] **Step 1: Write failing queue tests** requiring 3,448 unique facets, 21 owner families, no security-rejected body, no duplicate membership, packet size at most 25, stable ordering, and exact reconstruction from packet union.
- [x] **Step 2: Run the focused test** and observe the missing builder failure.
- [x] **Step 3: Implement the queue builder** without reading or executing source instructions during packet generation.
- [x] **Step 4: Generate queues and packets twice** and require byte-identical artifact digests.
- [x] **Step 5: Commit** the builder, tests, and deterministic packet manifests.

### Task 3: Complete all semantic review packets

**Files:**
- Create: `data/wave2-semantic-reviews/<family>/<sequence>.json`
- Create: `scripts/build-wave2-semantic-coverage.mjs`
- Generate: `artifacts/wave2-semantic/review-evidence.jsonl`
- Generate: `artifacts/wave2-semantic/review-coverage.json`
- Create: `tests/wave2-semantic-coverage.test.mjs`

**Interfaces:**
- Consumes: one bounded packet and exact source bodies for that packet.
- Produces: independently authored review batches accepted by `validateWave2ReviewBatch`, then one aggregate row per facet.

- [ ] **Step 1: Write the failing coverage gate** requiring 3,448 reviews, exact facet and digest sets, one review per facet, no copied prose, and zero missing or duplicate rows.
- [ ] **Step 2: Process packets by disjoint family and sequence**; each reviewer reads only its packet's exact source bodies and writes the complete neutral review schema without executing source content.
- [ ] **Step 3: Validate every returned packet immediately** and return malformed, generic, copied, stale, or unsupported reviews to the same packet before aggregation.
- [ ] **Step 4: Build aggregate review evidence twice** and require byte-identical review and coverage digests.
- [ ] **Step 5: Run the coverage test** and require exactly 3,448 valid reviews and zero unresolved facets.
- [ ] **Step 6: Commit** review packets in family-sized checkpoints so progress is durable and independently auditable.

### Task 4: Behavioral clustering and original-corpus overlap

**Files:**
- Create: `src/wave2-semantic-clusters.mjs`
- Create: `data/wave2-semantic-clusters/<family>.json`
- Create: `data/wave2-overlap-decisions/<family>.json`
- Create: `scripts/build-wave2-cluster-coverage.mjs`
- Generate: `artifacts/wave2-semantic/cluster-evidence.jsonl`
- Generate: `artifacts/wave2-semantic/overlap-evidence.jsonl`
- Generate: `artifacts/wave2-semantic/cluster-coverage.json`
- Create: `tests/wave2-semantic-clusters.test.mjs`

**Interfaces:**
- Consumes: all exact Wave 2 reviews, original corpus reviews and clusters, promoted contracts, and Lunari first-party contracts.
- Produces: exactly-one cluster membership per review and exactly-one overlap disposition per candidate cluster.

- [ ] **Step 1: Write failing validators** for exact review-digest membership, duplicate membership, unknown reviews, missing cluster decisions, stale overlap targets, and unsupported overlap dispositions.
- [ ] **Step 2: Cluster each family by compatible inputs, operations, outputs, effects, failure behavior, and risks**, never by names or lexical similarity alone.
- [ ] **Step 3: Compare every candidate cluster** against existing Godskills, original 4,741-source clusters, other Wave 2 clusters, and Lunari contracts; record `covered-stronger`, `extend-existing`, `new-operational-skill`, `new-godskill`, `ultragodskill-candidate`, `deferred`, or `rejected` with mechanism-level rationale.
- [ ] **Step 4: Build aggregate cluster artifacts twice** and require 3,448 memberships, zero unresolved candidate clusters, and byte-identical digests.
- [ ] **Step 5: Commit** family cluster and overlap decisions with passing coverage tests.

### Task 5: Evidence-earned capability synthesis

**Files:**
- Create: `data/wave2-synthesis-plan.v1.json`
- Create or modify only evidence-selected files under `skills/`, `src/`, `tests/`, `artifacts/`, `syntheses/`, and `receipts/promotions/`.
- Create: `tests/wave2-synthesis-plan.test.mjs`

**Interfaces:**
- Consumes: exact candidate cluster and overlap evidence.
- Produces: a disjoint plan assigning every candidate to one terminal action and independently written capability artifacts for actions that require synthesis.

- [ ] **Step 1: Write a failing synthesis-plan gate** requiring every candidate cluster exactly once, exact review and cluster digests, no unsupported source, no duplicate mechanism ownership, and explicit intended tier.
- [ ] **Step 2: Construct the synthesis plan** using evidence rather than quotas; distinguish atoms, operational skills, Godskill extensions, new Godskills, and Ultragodskill candidates.
- [ ] **Step 3: For each synthesized capability, write failing direct, paraphrased, contextual, negative, conflict, effect, authority, termination, and regression fixtures before implementation.**
- [ ] **Step 4: Implement the smallest independent capability** from neutral contracts without copying source prose or provider identity.
- [ ] **Step 5: Evaluate against the strongest applicable baseline** and retain `experimental`, `deferred`, or `rejected` unless all promotion gates and a measured improvement pass.
- [ ] **Step 6: Commit** each independently testable capability or coherent owner-family batch with exact receipts.

### Task 6: Automatic bounded capability-gap routing

**Files:**
- Modify: `skills/eternities-omnibus/SKILL.md`
- Modify: `skills/eternities-omnibus/references/operating-contract.md`
- Modify: `src/quarry-atlas.mjs`
- Modify: `src/intent-compiler.mjs`
- Modify: routing cards and generated receipts through existing builders.
- Create: `tests/automatic-capability-gap-routing.test.mjs`

**Interfaces:**
- Consumes: a consequential request that no promoted card completely covers and the certified semantic cluster atlas.
- Produces: at most five compact reviewed cards and a safe terminal route, refinery handoff, or unresolved gap without source-body loading.

- [ ] **Step 1: Write failing fixtures** proving automatic lookup on uncovered consequential intent, no lookup for completely covered ordinary work, no authority expansion, five-card maximum, no source body in transport, deterministic selection, and fail-closed stale certification.
- [ ] **Step 2: Implement one bounded gap trigger** after normal promoted-card qualification fails and before native fallback.
- [ ] **Step 3: Rebuild routing and intent receipts** and require all historical routing fixtures plus the new gap fixtures.
- [ ] **Step 4: Commit** the routing evolution without enabling Pantheon or changing a host profile.

### Task 7: Semantic completion certification and integration

**Files:**
- Create: `scripts/build-wave2-semantic-certification.mjs`
- Create: `receipts/wave2-semantic-refinery-v1.json`
- Create: `docs/wave2-semantic-refinery-report.md`
- Modify: `README.md`
- Create: `tests/wave2-semantic-certification.test.mjs`

**Interfaces:**
- Consumes: all review, cluster, overlap, synthesis, evaluation, routing, and historical structural receipts.
- Produces: one rebuildable certificate with exact counts, artifact hashes, terminal gates, and explicit proof limits.

- [ ] **Step 1: Write the failing final certificate test** requiring 3,448 reviews, 3,448 cluster memberships, zero unresolved candidate clusters, exact duplicate inheritance, terminal synthesis decisions, passing promotion receipts, bounded automatic retrieval, historical receipt integrity, and no activation or third-party execution.
- [ ] **Step 2: Implement the certificate builder** and rebuild it twice for byte identity.
- [ ] **Step 3: Run focused tests and `npm test`** and require zero failures.
- [ ] **Step 4: Request independent adversarial review** of evidence coverage, review quality, clustering, overlap, promotion claims, routing authority, determinism, and proof language.
- [ ] **Step 5: Fix every confirmed critical or important finding** and rerun complete verification.
- [ ] **Step 6: Merge to `main` only after review closure**, rerun the full suite from merged `main`, and remove only the owned worktree and merged feature branch.
