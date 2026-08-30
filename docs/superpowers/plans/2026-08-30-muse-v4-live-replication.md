# Muse v4 live replication implementation plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an inactive compact Muse v4 candidate and execute three blinded raw-versus-candidate Terra trials without disturbing promoted Muse history.

**Architecture:** The Godskills repository owns the neutral candidate contract, reviewed development evidence, task-sliced package, structural evaluation, and inactive decision receipt. A separate `C:\dev\muse-v4-replication` coordinator owns frozen Three.js scaffolds, six isolated subjects, paired launches, browser capture, and anonymous viewers. Candidate adoption remains a separate post-verdict action.

**Tech Stack:** Node.js 24, native `node:test`, existing Godskills contracts and hashing, Codex CLI, `gpt-5.6-terra`, Three.js 0.185.1, Vite 8.2.2, Playwright Core 1.62.1

**Spec:** `docs/superpowers/specs/2026-08-30-muse-v4-live-replication-design.md`

## Global Constraints

- Do not modify `skills/eternities-muse`, its current routing card, profiles, or historical receipts before the adoption gate.
- Candidate supplement maximum is 8,000 UTF-8 bytes and 2,000 estimated tokens.
- White fire is development evidence; portal, storm, and ecosystem are held-out missions.
- Both sides of every pair use identical model, reasoning, seed scaffold, authority, launch count, and time ceiling.
- Run mission pairs sequentially and subjects within a pair concurrently.
- Do not repair either model submission after termination.
- Candidate status remains `experimental` until all three user verdicts are recorded.

---

### Task 1: Freeze the inactive candidate contract and development ledger

**Files:**
- Create: `artifacts/muse-v4-experimental/neutral-contract.json`
- Create: `artifacts/muse-v4-experimental/development-evidence.json`
- Test: `tests/muse-v4-experimental.test.mjs`

**Interfaces:**
- Consumes: exact white-fire evidence digests and four reviewed failure codes.
- Produces: a local-read-only evidence ledger and an inactive neutral contract.

- [ ] Write a failing test requiring exact white-fire digests, four failure codes, no held-out mission text, and `active: false`.
- [ ] Run the focused test and confirm missing-artifact failure.
- [ ] Add the neutral contract and reviewed evidence records with source labels and proof limits.
- [ ] Run the focused test and commit.

### Task 2: Build the compact Muse v4 real-time phenomena slice

**Files:**
- Create: `artifacts/muse-v4-experimental/SKILL.md`
- Create: `artifacts/muse-v4-experimental/package.json`
- Create: `artifacts/muse-v4-experimental/evals/cases.json`
- Modify: `tests/muse-v4-experimental.test.mjs`

**Interfaces:**
- Consumes: the neutral contract and development failure codes.
- Produces: one authority-neutral package with exact digest, byte count, and estimated token count.

- [ ] Add failing behavioral fixtures for full orbit preservation, anti-regularity, solution freedom, luminance detail, quality fallback, and no authority expansion.
- [ ] Confirm the focused test fails because the candidate is absent.
- [ ] Independently write the smallest task slice satisfying the fixtures.
- [ ] Generate its package manifest from exact bytes and require at most 8,000 bytes and 2,000 estimated tokens.
- [ ] Run focused and full tests, then commit.

### Task 3: Create the six-subject replication coordinator

**Files:**
- Create: `C:\dev\muse-v4-replication\package.json`
- Create: `C:\dev\muse-v4-replication\starter/**`
- Create: `C:\dev\muse-v4-replication\missions/*.md`
- Create: `C:\dev\muse-v4-replication\tools/**`
- Create: `C:\dev\muse-v4-replication\tests/coordinator.test.mjs`

**Interfaces:**
- Consumes: candidate package and three frozen mission files.
- Produces: six byte-identical-within-pair subject seeds and exact prompt audits.

- [ ] Write failing tests for mission count, pair equality, prompt isolation, candidate-only supplement, path confinement, and sequential-pair scheduling.
- [ ] Confirm the coordinator tests fail before implementation.
- [ ] Adapt the proven white-fire isolation harness into a mission-general coordinator without copying any prior submission.
- [ ] Generate all seeds, isolated prompt audits, and independent Git ceilings.
- [ ] Run coordinator tests and commit.

### Task 4: Execute portal, storm, and ecosystem pairs

**Files:**
- Create at runtime: `C:\dev\muse-v4-replication\subjects/<mission>/<condition>/**`
- Create at runtime: `C:\dev\muse-v4-replication\evidence/launches/*.json`

**Interfaces:**
- Consumes: passing preflight evidence and six sealed subjects.
- Produces: six untouched submissions with redacted event digests and source manifests.

- [ ] Launch raw and candidate portal subjects concurrently and await both.
- [ ] Verify isolation, preserve outputs, and stop closed on violations.
- [ ] Repeat for storm, then ecosystem, never overlapping mission pairs.
- [ ] Commit untouched source submissions and launch evidence.

### Task 5: Capture and publish three anonymous comparisons

**Files:**
- Create: `C:\dev\muse-v4-replication\evidence/browser/**`
- Create: `C:\dev\muse-v4-replication\evidence/anonymous/**`
- Create: `C:\dev\muse-v4-replication\tools/prepare-live-comparison.mjs`

**Interfaces:**
- Consumes: six eligible submissions.
- Produces: three independently randomized A/B viewers and matched objective records.

- [ ] Build and capture each submission sequentially at the frozen viewport and timing.
- [ ] Exercise orbit, resize, pause or visibility behavior, and the lower-quality mode.
- [ ] Reject console errors, page errors, blank canvases, or missing direct spatial inspection.
- [ ] Randomize each mission independently and generate one-at-a-time HTML viewers.
- [ ] Run full verification and commit public evidence while leaving maps private.

### Task 6: Record verdicts and decide eligibility

**Files:**
- Create after user input: `C:\dev\muse-v4-replication\evidence/verdicts.json`
- Create after reveal: `C:\dev\muse-v4-replication\evidence/evaluation.md`
- Create after reveal: `artifacts/muse-v4-experimental/eligibility-receipt.json`

**Interfaces:**
- Consumes: three blind choices, objective evidence, cost records, and private maps.
- Produces: `eligible`, `experimental`, or `blocked`; never automatic adoption.

- [ ] Present all three anonymous viewers without condition hints.
- [ ] Record the user's choices verbatim before revealing mappings.
- [ ] Score each pair against named evidence and compute cost deltas.
- [ ] Apply every adoption gate exactly and write the inactive decision receipt.
- [ ] Run complete Godskills and coordinator verification, then commit.
