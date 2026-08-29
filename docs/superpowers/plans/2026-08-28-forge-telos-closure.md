# Forge Telos Closure Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bounded adversarial perfection-closure route to Eternities Forge without creating an infinite loop or changing the 21-card routing surface.

**Architecture:** Extend Forge as the existing high-consequence engineering orchestrator. Keep the entrypoint compact, put exact loop mechanics and source dispositions in focused references, and certify behavior with direct, paraphrase, exclusion, conflict, saturation, and budget cases.

**Tech Stack:** Markdown skills, JSON capability and evaluation contracts, Node.js `node:test`.

**Spec:** `docs/specs/forge-telos-closure.md`

## Global Constraints

- Preserve all existing Forge routes and the 21-card deterministic router.
- Treat the first-party Eternities Canon record as the canonical design source; do not copy external source prose or implementation.
- No unbounded iteration, ruflo, completion-token oracle, external mutation, or authority expansion.

---

### Task 1: behavioral contract

**Files:**
- Create: `tests/forge-telos-closure.test.mjs`
- Modify: `skills/eternities-forge/evals/cases.json`

**Interfaces:**
- Consumes: existing Forge skill, capability contract, and evaluation schema.
- Produces: observable requirements for `route:telos-closure` and four terminal states.

- [x] Write tests that require explicit routing, structural closure, relocation hunting, evidence deltas, budgets, saturation, and fail-closed boundaries.
- [x] Run the focused test and observe failure because the route is absent.
- [x] Add evaluation cases for direct, paraphrase, exclusion, conflict, saturation, and budget exhaustion.
- [x] Run the focused test and retain the expected failure until the skill contract exists.

### Task 2: independent first-party route

**Files:**
- Modify: `skills/eternities-forge/SKILL.md`
- Modify: `skills/eternities-forge/references/capability-contract.json`
- Create: `skills/eternities-forge/references/telos-closure.md`
- Create: `skills/eternities-forge/references/telos-provenance.json`

**Interfaces:**
- Consumes: the Task 1 behavioral contract.
- Produces: `telos-closure` route with `closed`, `saturated`, `blocked`, and `budget-exhausted` outcomes.

- [x] Implement the smallest entrypoint route and link its conditional reference.
- [x] Encode budgets, progress evidence, stop states, relocation checks, and authority boundaries.
- [x] Record the exact first-party canon commit and blob, plus external source identities, licenses, blob ids, and extraction dispositions.
- [x] Run the focused test until green.

### Task 3: certification and integration

**Files:**
- Create: `receipts/promotions/eternities-forge-telos-v1.json`
- Modify only if generated hashes require it: existing deterministic artifacts.

**Interfaces:**
- Consumes: final skill, contract, cases, and provenance bytes.
- Produces: reproducible promotion evidence without adding a routing card.

- [x] Generate exact SHA-256 evidence and a promotion receipt from current bytes.
- [x] Run focused Forge, routing, and promotion tests.
- [x] Run the full repository suite and inspect the final diff.
- [ ] Commit, integrate into main, and re-run the focused post-merge gate.
