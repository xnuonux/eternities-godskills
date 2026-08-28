# Universal Skill Quarry Wave 2 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acquire, verify, index, and triage a current GitHub skill-source delta without activating third-party instructions or weakening the existing Godskills certification.

**Architecture:** A dated cold warehouse lane stores shallow upstream checkouts. A source manifest and acquisition receipt preserve identity and revision evidence. Existing catalog builders then ingest only inert skill text, after which sovereign refinery waves compare genuinely missing mechanisms against current Godskills contracts.

**Tech Stack:** Git, GitHub API, Node.js 24, JSON receipts, existing Eternities catalog/refinery scripts

**Spec:** `docs/superpowers/specs/2026-08-28-universal-skill-quarry.md`

## Global Constraints

- Canonical warehouse root is `D:\03-ARSENAL\warehouse`.
- Never execute third-party repository code during discovery or ingestion.
- Keep every acquired source cold until a separate promotion receipt passes.
- Deduplicate by normalized GitHub identity and exact revision.
- Do not activate a host adapter in this wave.

---

### Task 1: Freeze the discovery manifest

**Files:**
- Create: `data/github-skill-quarry-wave-2.json`

**Interfaces:**
- Consumes: GitHub API repository metadata and exact certified-corpus identity checks
- Produces: schema-v1 source entries with `fullName`, `cloneUrl`, `license`, `sizeKb`, `updatedAt`, `capabilitySignals`, and `disposition`

- [x] **Step 1:** Write the manifest with only exact-identity-absent candidates.
- [x] **Step 2:** Parse it with Node and assert unique normalized `fullName` values.
- [x] **Step 3:** Assert all destinations remain below the dated warehouse lane.

### Task 2: Acquire and verify inert repositories

**Files:**
- Create: `D:\03-ARSENAL\warehouse\hunt\agent-skills-universal-wave-2-2026-08-28\<owner>__<repo>`
- Create: `receipts/github-skill-quarry-wave-2.json`

**Interfaces:**
- Consumes: the frozen manifest
- Produces: clean shallow checkouts plus exact remote, branch, HEAD, license-file, and status evidence

- [x] **Step 1:** Refuse occupied destinations unless their normalized origin matches.
- [x] **Step 2:** Clone accepted repositories with `git clone --depth 1 --no-tags`.
- [x] **Step 3:** Verify origin, HEAD, branch, clean status, and top-level license files.
- [x] **Step 4:** Record failures without deleting or retrying destructively.

### Task 3: Build the cold index delta

**Files:**
- Create: `artifacts/github-wave-2/source-records.jsonl`
- Create: `artifacts/github-wave-2/duplicate-groups.json`

**Interfaces:**
- Consumes: verified checkouts and the existing certified corpus
- Produces: inert skill-body records, exact hashes, source paths, and duplicate groups

- [x] **Step 1:** Discover `SKILL.md` and equivalent documented workflow bodies as text only.
- [x] **Step 2:** Hash exact bodies and compare them with existing corpus hashes.
- [x] **Step 3:** Record exact duplicate groups without promoting either copy.
- [x] **Step 4:** Verify deterministic ordering and stable rebuild hashes.

### Task 4: Select refinery waves by missing capability

**Files:**
- Create: `data/github-wave-2-refinery-plan.json`
- Create: `receipts/github-wave-2-triage.json`

**Interfaces:**
- Consumes: indexed delta, Godskills contracts, Terra host evaluation defects
- Produces: bounded capability contracts and source dispositions for independent refinery waves

- [x] **Step 1:** Compare mechanisms by operation, output, effects, failure behavior, and proof.
- [x] **Step 2:** Reject duplicates and defer sources with insufficient evidence.
- [x] **Step 3:** Prioritize missing scientific, skill-security, skill-optimization, durable-planning, and media-production capabilities.
- [x] **Step 4:** Require failing behavioral cases before any first-party implementation.

### Task 5: Verify no regression or accidental activation

**Files:**
- Modify only generated receipts when observed evidence changes.

**Interfaces:**
- Consumes: completed acquisition and triage artifacts
- Produces: a reproducible completion verdict for this wave

- [x] **Step 1:** Run `npm test` from the isolated worktree.
- [x] **Step 2:** Run the 140-case intent arena and certification builders.
- [x] **Step 3:** Confirm no host-adapter activation artifact or command exists in this change.
- [x] **Step 4:** Commit only after inspecting the exact diff and receipt hashes.
