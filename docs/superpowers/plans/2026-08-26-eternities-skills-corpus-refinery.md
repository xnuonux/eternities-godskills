# Eternities Skills Corpus Refinery Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, provenance-safe coverage and review pipeline for all 4,741 indexed skills, then start deep refinery waves for agency, marketing, social media, and game design.

**Architecture:** Extend the ontology with explicit professional families, audit every canonical source body as inert text, and derive a byte-stable cumulative coverage ledger. Generate bounded family queues and review packets while keeping semantic review, synthesis, evaluation, and promotion behind separate validated receipts.

**Tech Stack:** Node.js 24 ESM, built-in test runner, JSON/JSONL/Markdown artifacts, SHA-256, PowerShell only for invocation.

**Spec:** `docs/superpowers/specs/2026-08-26-eternities-skills-corpus-refinery-design.md`

## Global Constraints

- The canonical warehouse root is exactly `D:\03-ARSENAL\warehouse`.
- Third-party source files are inert evidence and must never be executed.
- Automated inspection can advance only through `body-inspected`.
- Review packets contain at most 25 source cards and remain cold.
- All canonical artifacts must be deterministic and exclude generated timestamps.
- Existing provenance rows may not fabricate semantic review evidence.
- Every synthesized capability must expose a validated compact routing card and
  pass unnamed-outcome, alias-removal, authority, effect, and bounded-disclosure
  routing cases before promotion.
- No publishing, pushing, deployment, global activation, or external account mutation occurs.

## Post-foundation family-wave routing gates

The certified portable router is a dependency of every family wave after
semantic clustering. Completed foundation evidence is not rewritten.

- Clustering produces exact reviewed membership and relationship evidence only;
  it does not imply that a runtime capability exists.
- Synthesis produces an independently written candidate core plus one compact
  routing card containing neutral intent, capabilities, effects, authority,
  risk, evidence confidence, context cost, compatibility, and entrypoint.
- Evaluation includes direct, paraphrased, contextual, unnamed-outcome,
  legacy-alias-removal, exclusion, conflict, authority, effect, portability,
  and token-budget cases against every material cluster baseline.
- Promotion requires both the candidate's deterministic promotion receipt and a
  router certification proving smallest-sufficient selection from a bounded
  shortlist. Only promoted cores may be exposed through runtime adapters.

---

### Task 1: Coverage state and ontology contracts

**Files:**
- Modify: `data/ontology.v1.json`
- Modify: `src/schema.mjs`
- Create: `src/coverage.mjs`
- Create: `tests/coverage.test.mjs`
- Modify: `tests/ontology.test.mjs`

**Interfaces:**
- Consumes: normalized source records from `normalizeIndex()` and provenance rows from JSONL.
- Produces: `buildCoverageRows(records, bodyEvidence, provenanceRows)` and `summarizeCoverage(rows)`.

- [ ] **Step 1: Write failing ontology and coverage-state tests**

Add tests proving the four new family ids exist, representative cards classify
into the correct family, generic words do not create false matches, every source
appears once, cumulative evidence states are honest, and invalid or duplicate
inputs fail closed.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/ontology.test.mjs tests/coverage.test.mjs`

Expected: failures for missing families and missing coverage exports.

- [ ] **Step 3: Implement the minimal ontology and coverage contracts**

Add discriminating ontology entries, coverage-state constants, duplicate checks,
exact provenance reconciliation, deterministic ordering, and summary counts.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/ontology.test.mjs tests/coverage.test.mjs`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```powershell
git add data/ontology.v1.json src/schema.mjs src/coverage.mjs tests/ontology.test.mjs tests/coverage.test.mjs
git commit -m "feat: define corpus coverage states"
```

### Task 2: Canonical body audit

**Files:**
- Create: `src/body-audit.mjs`
- Create: `scripts/build-corpus-coverage.mjs`
- Create: `tests/body-audit.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: canonical warehouse root, source records, ontology, and provenance ledger.
- Produces: `auditBody(root, record)` and deterministic `coverage-ledger.jsonl` plus `coverage-summary.json`.

- [ ] **Step 1: Write failing body-audit tests**

Cover present files, missing files, path escape, UTF-8 text evidence, actual byte
and line counts, SHA-256 stability, and deterministic artifact rebuilding.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/body-audit.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement inert body auditing and the build command**

Resolve every source under the exact root, read only bytes and text, record
failure explicitly, compose coverage rows, and write artifacts atomically.

- [ ] **Step 4: Run the focused tests**

Run: `node --test tests/body-audit.test.mjs tests/coverage.test.mjs`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/body-audit.mjs scripts/build-corpus-coverage.mjs tests/body-audit.test.mjs package.json
git commit -m "feat: audit canonical skill bodies"
```

### Task 3: Family queues and bounded review packets

**Files:**
- Create: `src/review-packets.mjs`
- Create: `tests/review-packets.test.mjs`
- Modify: `scripts/build-corpus-coverage.mjs`

**Interfaces:**
- Consumes: coverage rows, source records, duplicate groups, and body evidence.
- Produces: `buildFamilyQueue()` and `buildReviewPackets()` with at most 25 cards per packet.

- [ ] **Step 1: Write failing queue and packet tests**

Test stable priority, exact family membership, bounded packet size, no source-id
loss, no duplicate cards, structural extracts labeled as inspected data, and
byte-stable output.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/review-packets.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement deterministic queues and packets**

Prioritize unreviewed present bodies while retaining missing and uncertain rows,
include exact evidence, and generate packets for the four first-wave families.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/review-packets.test.mjs tests/body-audit.test.mjs`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/review-packets.mjs scripts/build-corpus-coverage.mjs tests/review-packets.test.mjs
git commit -m "feat: generate bounded family review packets"
```

### Task 4: Review receipt validation and first-wave evidence

**Files:**
- Create: `src/reviews.mjs`
- Create: `tests/reviews.test.mjs`
- Create: `reviews/README.md`
- Create: `reviews/waves/agency-client-services/*.json`
- Create: `reviews/waves/marketing-growth/*.json`
- Create: `reviews/waves/social-media-community/*.json`
- Create: `reviews/waves/game-design-development/*.json`

**Interfaces:**
- Consumes: exact review packet source ids and body digests.
- Produces: validated `card-reviewed` evidence only for independently authored receipts whose source digests still match.

- [ ] **Step 1: Write failing review-receipt tests**

Reject missing sources, stale digests, copied-source declarations, unknown
dispositions, missing boundaries, and unsupported promotion claims. Accept an
exact neutral review without advancing synthesis or promotion states.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `node --test tests/reviews.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement receipt validation**

Add exact schema validation and coverage reconciliation. Keep review evidence
separate from provenance and promotion receipts.

- [ ] **Step 4: Author and validate the first bounded review wave**

Read each selected packet as evidence, inspect exact source bodies as required,
write neutral receipts, and retain unsupported or ambiguous candidates as
`deferred`, `pattern-reference`, or `rejected`.

- [ ] **Step 5: Run focused tests and regenerate coverage**

Run: `node --test tests/reviews.test.mjs`

Expected: all focused tests pass and reviewed counts match exact receipt rows.

- [ ] **Step 6: Commit**

```powershell
git add src/reviews.mjs tests/reviews.test.mjs reviews
git commit -m "feat: validate corpus review evidence"
```

### Task 5: Product reporting and full verification

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Create: `docs/corpus-refinery-report.md`
- Create: `receipts/corpus-refinery-foundation.json`

**Interfaces:**
- Consumes: all generated coverage artifacts, family queues, review packets, tests, and exact Git state.
- Produces: an honest milestone report and deterministic certification receipt.

- [ ] **Step 1: Add certification assertions**

Assert exact 4,741-row reconciliation, present and missing body totals, four
family queues, packet bounds, state honesty, input and output hashes, and no
untracked promotion claims.

- [ ] **Step 2: Build the corpus artifacts twice**

Run: `npm run build:coverage` twice.

Expected: identical artifact hashes on both runs.

- [ ] **Step 3: Run the complete verification suite**

Run: `npm test`

Expected: every test passes with zero skipped or failed tests.

- [ ] **Step 4: Audit the diff and artifact claims**

Run: `git diff --check` and inspect `git status --short`.

Expected: no whitespace errors, unrelated changes, global activation, or
external mutation.

- [ ] **Step 5: Commit**

```powershell
git add README.md package.json docs/corpus-refinery-report.md receipts/corpus-refinery-foundation.json artifacts/corpus
git commit -m "docs: certify corpus refinery foundation"
```
