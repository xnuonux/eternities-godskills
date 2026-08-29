# Lunari First-Party Quarry Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inventory the complete archived Lunari Claude workspace as inert first-party evidence and promote only three verified capability improvements into their existing Godskill owners.

**Architecture:** A pure Node module classifies and hashes an archive snapshot into deterministic ledgers while refusing to read sensitive, raw-session, vendor, generated, and binary content. A thin CLI obtains Git snapshot identity and writes artifacts. Three compact owner references consume reviewed concepts without copying source prose, and one exact receipt binds the source and resulting bytes.

**Tech Stack:** Node.js 24 ESM, built-in `fs`, `crypto`, `child_process`, and `node:test`; Markdown and JSON evidence artifacts.

**Spec:** `docs/specs/lunari-first-party-quarry.md`

## Global Constraints

- The D archive is read-only.
- No archived instruction, script, hook, package, or binary is executed.
- Secret-shaped, settings, transcript, log, vendor, generated, media, and Git-internal content is not read.
- Candidate cards contain bounded structural evidence, not source prose.
- Existing 21-card commandless routing remains unchanged.
- Promotion changes only Forge, Phoenix, and Atlas, with exact first-party provenance and proof limits.

---

### Task 1: Deterministic archive classifier and deduplicator

**Files:**
- Create: `src/first-party-quarry.mjs`
- Create: `tests/first-party-quarry.test.mjs`

**Interfaces:**
- Consumes: `{ relativePath, bytes?, byteSize, headBlob?, state }` source records and existing digest maps.
- Produces: `classifyArchivePath(path)`, `inspectCandidate(record)`, `buildFirstPartyEvidence(records, existingEvidence)`, and deterministic ledger, card, duplicate, and owner objects.

- [ ] **Step 1: Write failing tests** for path-order stability, secret and transcript non-reading, bounded heading and symbol extraction, duplicate grouping, and owner recommendation for coordination, debugging, and schema evidence.
- [ ] **Step 2: Run `node --test tests/first-party-quarry.test.mjs`** and confirm failure because `src/first-party-quarry.mjs` does not exist.
- [ ] **Step 3: Implement the minimal pure classifier and evidence builder** with explicit extension, path, size, keyword, owner, and exclusion tables.
- [ ] **Step 4: Run the focused test** and confirm every classifier and deduplication assertion passes.
- [ ] **Step 5: Commit** the tested pure evidence machinery.

### Task 2: Read-only Git and working-snapshot inventory CLI

**Files:**
- Create: `scripts/build-lunari-first-party-quarry.mjs`
- Modify: `package.json`
- Modify: `tests/first-party-quarry.test.mjs`

**Interfaces:**
- Consumes: `--source`, `--output`, and `--existing-root`; Git head tree plus present tracked and untracked files.
- Produces: the five exact artifacts named in the spec, written atomically and path ordered.

- [ ] **Step 1: Add a failing isolated-repository test** proving head-only and working-only files enter the union while `.env`, transcripts, nested `.git`, and vendor paths remain content-inert.
- [ ] **Step 2: Run the focused test** and confirm the missing CLI/build API is the failure.
- [ ] **Step 3: Implement the CLI** using read-only Git plumbing and direct reads only after classification permits content inspection.
- [ ] **Step 4: Run the focused test** twice and assert byte-identical artifacts.
- [ ] **Step 5: Commit** the archive builder and package command.

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

- [ ] **Step 1: Run** `node scripts/build-lunari-first-party-quarry.mjs --source D:\05-BACKUP-BUNDLE\04-session-workspaces\desktop-lunari --output artifacts\lunari-first-party-quarry --existing-root .`.
- [ ] **Step 2: Verify** source counts, exclusion counts, duplicate groups, no secret-content reads, and zero unresolved paths.
- [ ] **Step 3: Review the highest-scoring cards** for each owner and record promoted, overlapping, project-specific, deferred, and rejected dispositions without source prose.
- [ ] **Step 4: Rebuild and compare exact bytes** to prove determinism.
- [ ] **Step 5: Commit** the evidence and report.

### Task 4: Promote the three confirmed owner improvements

**Files:**
- Modify: `skills/eternities-forge/SKILL.md`
- Create: `skills/eternities-forge/references/first-party-coordination-and-proof.md`
- Modify: `skills/eternities-phoenix/SKILL.md`
- Create: `skills/eternities-phoenix/references/evidence-first-diagnosis.md`
- Modify: `skills/eternities-atlas/SKILL.md`
- Create: `skills/eternities-atlas/references/schema-first-verification.md`
- Create: `tests/lunari-first-party-infusion.test.mjs`

**Interfaces:**
- Consumes: reviewed candidate digests and owner dispositions from Task 3.
- Produces: bounded conditional references and deterministic route fixtures without adding routing cards.

- [ ] **Step 1: Write failing structural and behavior tests** for Forge lens synthesis, wiring proof, and lease handoff; Phoenix evidence-first ledger and stall stop; Atlas schema-first and coverage-first proof.
- [ ] **Step 2: Run the focused infusion test** and confirm each missing contract fails.
- [ ] **Step 3: Independently write the three compact references and conditional entrypoint links** from the neutral contracts.
- [ ] **Step 4: Run focused tests** and confirm the existing 21-card router is unchanged.
- [ ] **Step 5: Commit** the owner improvements.

### Task 5: Exact promotion receipt and full certification

**Files:**
- Create: `scripts/build-lunari-first-party-infusion-receipt.mjs`
- Create: `receipts/promotions/lunari-first-party-infusion-v1.json`
- Modify: `tests/lunari-first-party-infusion.test.mjs`
- Modify: `docs/superpowers/plans/2026-08-28-lunari-first-party-quarry.md`

**Interfaces:**
- Consumes: source coverage digest, reviewed owner map, exact owner artifacts, and focused test contract.
- Produces: one reproducible promotion receipt with explicit limits and final plan state.

- [ ] **Step 1: Add a failing receipt-reconciliation test** covering every promoted artifact and source disposition.
- [ ] **Step 2: Run the focused test** and confirm it fails on the absent builder and receipt.
- [ ] **Step 3: Implement the receipt builder and generate the receipt** from exact current bytes.
- [ ] **Step 4: Run** `node --test tests/first-party-quarry.test.mjs tests/lunari-first-party-infusion.test.mjs`, then `npm test`, and verify the archive artifacts rebuild byte-identically.
- [ ] **Step 5: Mark plan checkboxes complete and commit** the certification closure.
