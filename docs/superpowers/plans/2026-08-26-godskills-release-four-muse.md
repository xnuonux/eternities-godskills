# Eternities Godskills Release Four Muse Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote one independently written Muse Godskill for consequential visual forensics, interface art direction, narrative motion, and deterministic visual acceptance without making ordinary frontend or media work heavier.

**Architecture:** `eternities-muse` is a bounded categorical router with four routes: visual forensics, interface art direction, motion story, and visual acceptance. The concise entrypoint selects one dominant route and delegates exact implementation to installed domain skills; the operating contract holds deeper evidence, budgets, and termination rules. Release Four activates Muse through a new one-skill `eternities-visual` profile so the engineering profile remains unchanged.

**Tech Stack:** Markdown skills, JSON capability and evaluation contracts, Node.js test runner, deterministic promotion and profile scripts, JSONL provenance ledger.

**Spec:** `docs/superpowers/specs/2026-08-26-eternities-godskills-design.md`

## Global Constraints

- canonical quarry is `D:\03-ARSENAL\warehouse`; no stale `C:\dev\Repo Warehouse` path may be used or created.
- source inspection is read-only; no third-party code, hook, installer, runtime, or network service is executed.
- no source prose is copied; each exact source receives a ledger disposition and digest.
- the entrypoint stays below the 4,000 estimated-token promotion ceiling and loads deeper detail only on demand.
- every direct, paraphrase, exclusion, and conflict case is critical.
- deterministic routing fixtures certify declared contracts, not live-model behavior.
- the engineering profile remains unchanged; global activation occurs only from canonical `main` after merge.
- the profile is reversible and its migration receipt may remove only `eternities-muse`.

---

### Task 1: Freeze neutral capability and provenance contracts

**Files:**

- Create: `skills/eternities-muse/references/capability-contract.json`
- Create: `skills/eternities-muse/references/operating-contract.md`
- Create: `skills/eternities-muse/references/mining-receipt.md`
- Modify: `provenance/source-ledger.jsonl`

**Interfaces:**

- Consumes: four certified catalog rows identified by `skill-06f3126fb15d16a1`, `skill-13f7f2706a7c06b4`, `skill-404e0c04f764f867`, and `skill-4852a463a4c15d89`.
- Produces: capability contract `godskill-eternities-muse-v1` with exactly four non-recursive routes and exact `sourceIds` used by evaluation and release certification.

- [ ] **Step 1: append four exact provenance rows**

  Use the catalog `sourcePath`, repository root, remote, Git head, extraction mode, and digest verbatim. Record visual confidence maps and token systems, cinematic pacing and progressive degradation, deterministic rendering diagnostics, and causal motion as concepts. Keep the Three.js source `pattern-reference` because its certified row lacks origin and commit evidence; use `independent-implementation` for the three fully traced permissive repositories.

- [ ] **Step 2: write the neutral contract**

  Define four route ids: `visual-forensics`, `interface-art-direction`, `motion-story`, and `visual-acceptance`. Require explicit effects, delegate names, failure modes, and termination conditions. Exclude ordinary UI fixes, generic image generation, exact narration or subtitle work, and purely technical Three.js debugging.

- [ ] **Step 3: write the operating and mining records**

  Specify evidence confidence, token and component contracts, narrative beats, motion causality, reduced-motion and GPU tiers, deterministic capture manifests, accessibility, and acceptance thresholds. Record the rejected fifth search card and state that local license inspection is evidence rather than legal clearance.

- [ ] **Step 4: verify contract schemas**

  Run the future `tests/muse-godskill.test.mjs` contract test after Task 2 creates it. Expected pre-implementation result: the test can parse and validate both capability and composition contracts.

### Task 2: Implement Muse through failing behavioral tests

**Files:**

- Create: `tests/muse-godskill.test.mjs`
- Create: `skills/eternities-muse/evals/cases.json`
- Create: `skills/eternities-muse/SKILL.md`
- Create: `receipts/promotions/eternities-muse.json`

**Interfaces:**

- Consumes: Task 1 contract and source ledger rows.
- Produces: a promoted, contract-certified Muse entrypoint and deterministic promotion receipt.

- [ ] **Step 1: write the failing test and evaluation suite**

  Assert exact metadata, four routes, all-critical direct and paraphrased cases, skip cases, delegations, exact provenance reconciliation, a token count at or below 4,000, and a promoted decision. The production mutation caught is route collapse or over-triggering into routine UI/media work.

- [ ] **Step 2: run the focused test and observe red**

  Run `node --test tests/muse-godskill.test.mjs`. Expected: failure because `skills/eternities-muse/SKILL.md` and the promotion receipt do not exist.

- [ ] **Step 3: implement the smallest entrypoint**

  Write one dominant route per mission, evidence before art direction, explicit causal and accessibility constraints, and a termination gate. Delegate exact implementation to `eternities-frontend-arsenal`, `frontend-design`, `imagegen`, `narrator`, `subtitles`, or domain debugging only when their narrower contract owns the work.

- [ ] **Step 4: generate and verify the promotion receipt**

  Run `node scripts/evaluate-skill.mjs --skill skills/eternities-muse --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-muse.json`, then `node scripts/verify-skill-receipt.mjs --skill skills/eternities-muse --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-muse.json`. Expected: `promoted`, all critical cases pass, evidence level is contract-certified, and the receipt is deterministic.

- [ ] **Step 5: run focused green verification and commit**

  Run `node --test tests/muse-godskill.test.mjs`; expected: all Muse tests pass. Commit the plan, contracts, provenance, skill, tests, and promotion receipt as one independently reviewable Muse feature.

### Task 3: Certify the isolated visual profile and release boundary

**Files:**

- Create: `profiles/eternities-visual.lock.json`
- Create: `tests/release-four-certification.test.mjs`
- Create: `receipts/release-four-certification.json`
- Create: `docs/release-four-report.md`

**Interfaces:**

- Consumes: promoted Muse receipt and canonical profile tooling.
- Produces: immutable pre-merge release certification with activation explicitly deferred.

- [ ] **Step 1: write the visual profile lock**

  Lock only `eternities-muse` to `C:\Users\Dom\.agents\skills` and point to `receipts/profile-eternities-visual.json`. Do not add Muse to `eternities-engineering`.

- [ ] **Step 2: write the failing release test**

  Assert promotion digest, source dispositions, four-route graph, total Godskill counts, unchanged engineering profile, one-skill visual profile, no temporary worktree links, and deferred activation.

- [ ] **Step 3: write pre-merge certification and report**

  Reconcile exact counts and hashes from repository evidence. Preserve historical release receipts unchanged. State current uncertainty around live-model routing, empirical visual taste, browser/device performance, and legal similarity review.

- [ ] **Step 4: run repository gates**

  Run `node --test tests/muse-godskill.test.mjs tests/release-four-certification.test.mjs`, `npm test`, `git diff --check`, and the cold-index integrity verifier. Expected: zero failures, a clean diff, and the certified cold index remains valid.

- [ ] **Step 5: request independent review and fix confirmed defects**

  Review the branch against base commit `1ba4f764a41646414e684238ac992211402e6eab`, focusing on route collision, source reconciliation, false superiority claims, profile reversibility, and historical-boundary mutation. Re-run all gates after any fix.

### Task 4: Merge, activate canonically, and prove rollback

**Files:**

- Create: `receipts/profile-eternities-visual.json`
- Create: `receipts/profile-eternities-visual-release-four-migration.json`
- Modify: `receipts/release-four-certification.json`
- Modify: `docs/release-four-report.md`

**Interfaces:**

- Consumes: reviewed release branch and `profiles/eternities-visual.lock.json`.
- Produces: canonical global Muse link, exact profile receipts, and a one-link rollback boundary.

- [ ] **Step 1: fast-forward canonical main**

  Confirm both worktrees are clean, then fast-forward `main` to the reviewed release commit. Reject a non-fast-forward merge.

- [ ] **Step 2: activate from canonical main**

  Run the profile preview, then apply `profiles/eternities-visual.lock.json` from `C:\dev\eternities-godskills`. Verify the resulting junction targets `C:\dev\eternities-godskills\skills\eternities-muse` and no path contains `.worktrees`.

- [ ] **Step 3: create the dedicated migration receipt**

  Record only the Muse link and a rollback dry run whose `planned` list is exactly `["eternities-muse"]`, with no refused or unrelated links.

- [ ] **Step 4: recertify canonical state**

  Update exact receipt hashes, activation flags, link counts, and final test total. Run `npm test`, `git diff --check`, cold-index verification, promotion receipt verification, profile verification, and a global-junction audit.

- [ ] **Step 5: commit integration and remove temporary state**

  Commit the canonical activation receipts and final certification on `main`, remove the merged release worktree, delete `feat/release-four-muse`, and verify all active Godskill links target canonical main.

## Completion Gate

- Muse is promoted with every critical routing fixture passing and an entrypoint below 4,000 estimated tokens.
- all four source records reconcile to exact catalog digests and no source prose is recorded as copied.
- the engineering profile is byte-for-byte unchanged by Release Four.
- the visual profile exposes only canonical Muse and can roll back only that link.
- independent review has no unresolved blocker.
- full tests, diff hygiene, cold-index integrity, receipt determinism, profile verification, and junction audits pass after canonical merge.
