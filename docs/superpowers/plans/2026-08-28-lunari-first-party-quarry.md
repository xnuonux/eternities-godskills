# Lunari First-Party Quarry Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inventory the complete archived Lunari Claude workspace as inert first-party evidence and promote only independently reviewed portable mechanisms that close confirmed Godskill gaps.

**Architecture:** A pure Node module classifies and hashes the physical archive snapshot into deterministic ledgers while refusing to read sensitive, raw-session, vendor, generated deployment, oversized, and binary content. A thin CLI obtains Git snapshot identity and writes artifacts. A reviewed-selection manifest separates lexical discovery from human disposition. Nine compact owner references consume ten neutral contracts without copying source prose, and one exact receipt binds source, review, and resulting bytes.

**Tech Stack:** Node.js 24 ESM, built-in `fs`, `crypto`, `child_process`, and `node:test`; Markdown and JSON evidence artifacts.

**Spec:** `docs/specs/lunari-first-party-quarry.md`

## Global Constraints

- The D archive is read-only.
- No archived instruction, script, hook, package, or binary is executed.
- Secret-shaped, settings, transcript, log, vendor, generated, media, and Git-internal content is not read.
- Candidate cards contain bounded structural evidence, not source prose.
- Existing 21-card commandless routing remains unchanged.
- Promotion changes only the nine owners justified in the reviewed-selection manifest. Atlas and every other reviewed no-gap owner remain unchanged.

---

### Task 1: Deterministic archive classifier and deduplicator

**Files:**
- Create: `src/first-party-quarry.mjs`
- Create: `tests/first-party-quarry.test.mjs`

**Interfaces:**
- Consumes: `{ relativePath, bytes?, byteSize, headBlob?, state }` source records and existing digest maps.
- Produces: `classifyArchivePath(path)`, `inspectCandidate(record)`, `buildFirstPartyEvidence(records, existingEvidence)`, and deterministic ledger, card, duplicate, and owner objects.

- [x] **Step 1: Write failing tests** for path-order stability, secret and transcript non-reading, bounded heading and symbol extraction, duplicate grouping, and owner recommendation for coordination, debugging, and schema evidence.
- [x] **Step 2: Run `node --test tests/first-party-quarry.test.mjs`** and confirm failure because `src/first-party-quarry.mjs` does not exist.
- [x] **Step 3: Implement the minimal pure classifier and evidence builder** with explicit extension, path, size, keyword, owner, and exclusion tables.
- [x] **Step 4: Run the focused test** and confirm every classifier and deduplication assertion passes.
- [x] **Step 5: Commit** the tested pure evidence machinery.

### Task 2: Read-only Git and working-snapshot inventory CLI

**Files:**
- Create: `scripts/build-lunari-first-party-quarry.mjs`
- Modify: `package.json`
- Modify: `tests/first-party-quarry.test.mjs`

**Interfaces:**
- Consumes: `--source`, `--output`, and `--existing-root`; Git head tree plus present tracked and untracked files.
- Produces: the five exact artifacts named in the spec, written atomically and path ordered.

- [x] **Step 1: Add a failing isolated-repository test** proving head-only and working-only files enter the union while `.env`, transcripts, generated deployment output, oversized text, nested `.git`, and vendor paths remain content-inert; staged-only changes remain visible.
- [x] **Step 2: Run the focused test** and confirm the missing CLI/build API is the failure.
- [x] **Step 3: Implement the CLI** using read-only Git plumbing, physical file sizes, HEAD-relative modification state, and direct reads only after classification and size permit content inspection.
- [x] **Step 4: Run the focused test** twice and assert byte-identical artifacts.
- [x] **Step 5: Commit** the archive builder and package command.

### Task 3: Build and review the real archive evidence

**Files:**
- Create: `artifacts/lunari-first-party-quarry/coverage-ledger.jsonl`
- Create: `artifacts/lunari-first-party-quarry/candidate-cards.jsonl`
- Create: `artifacts/lunari-first-party-quarry/duplicate-groups.json`
- Create: `artifacts/lunari-first-party-quarry/owner-map.json`
- Create: `artifacts/lunari-first-party-quarry/coverage.json`
- Create: `docs/lunari-first-party-quarry-report.md`

**Interfaces:**
- Consumes: the Task 2 CLI and the exact D archive.
- Produces: a zero-unresolved coverage receipt and a human-reviewed disposition report.

- [x] **Step 1: Run** `node scripts/build-lunari-first-party-quarry.mjs --source D:\05-BACKUP-BUNDLE\04-session-workspaces\desktop-lunari --output artifacts\lunari-first-party-quarry --existing-root .`.
- [x] **Step 2: Verify** source counts, exclusion counts, duplicate groups, no excluded-content reads, and zero unresolved paths.
- [x] **Step 3: Review the highest-scoring cards** across all owners and record promoted, supporting-only, overlapping, project-specific, deferred, and rejected dispositions in `data/lunari-first-party-reviewed-selection.v1.json` without source prose.
- [x] **Step 4: Rebuild and compare exact bytes** to prove determinism.
- [x] **Step 5: Commit** the evidence and report.

### Task 4: Promote the independently confirmed owner improvements

**Files:**
- Modify: nine owner `SKILL.md` entrypoints named in the reviewed-selection manifest.
- Create: one `references/first-party-contracts.md` under each enhanced owner.
- Create: `src/lunari-first-party-contracts.mjs`.
- Create: `tests/lunari-first-party-infusion.test.mjs`

**Interfaces:**
- Consumes: reviewed candidate digests and owner dispositions from Task 3.
- Produces: bounded conditional references and deterministic route fixtures without adding routing cards.

- [x] **Step 1: Write failing behavior tests** for ten reviewed portable contracts across Forge, Phoenix, Aegis, Oracle, Athena, Architect, Logos, Daedalus, and Herald.
- [x] **Step 2: Run the focused infusion test** and confirm each missing contract fails.
- [x] **Step 3: Independently write the compact references and conditional entrypoint links** from the neutral contracts. Record why Atlas and other reviewed owners do not change.
- [x] **Step 4: Run focused tests** and confirm the existing 21-card router is unchanged.
- [x] **Step 5: Commit** the owner improvements.

### Task 5: Exact promotion receipt and full certification

**Files:**
- Create: `scripts/build-lunari-first-party-infusion-receipt.mjs`
- Create: `receipts/lunari-first-party-infusion-v1.json`
- Create: `data/lunari-first-party-reviewed-selection.v1.json`
- Modify: `tests/lunari-first-party-infusion.test.mjs`
- Modify: `docs/superpowers/plans/2026-08-28-lunari-first-party-quarry.md`

**Interfaces:**
- Consumes: source coverage digest, reviewed owner map, exact owner artifacts, and focused test contract.
- Produces: one reproducible promotion receipt with explicit limits and final plan state.

- [x] **Step 1: Add a failing receipt-reconciliation test** covering every promoted artifact and reviewed source disposition.
- [x] **Step 2: Run the focused test** and confirm it fails on the absent reviewed evidence and receipt.
- [x] **Step 3: Implement the receipt builder and generate the receipt** from exact coverage, owner map, duplicate groups, reviewed selection, and current artifact bytes.
- [x] **Step 4: Run** `node --test tests/first-party-quarry.test.mjs tests/lunari-first-party-infusion.test.mjs`, then `npm test`, and verify the archive artifacts rebuild byte-identically.
- [x] **Step 5: Mark plan checkboxes complete and commit** the certification closure.
