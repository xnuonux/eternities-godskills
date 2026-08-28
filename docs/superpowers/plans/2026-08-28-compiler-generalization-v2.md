# Compiler Generalization v2 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry clearly evidenced compatible multi-capability intent from ordinary language into the existing bounded Godskills router.

**Architecture:** Add bounded morphological matching only at the capability-evidence boundary, then derive a mutually compatible natural candidate set before envelope construction. Leave authority reconciliation and final route selection in their existing modules.

**Tech Stack:** Node.js 24, ECMAScript modules, `node:test`, deterministic JSON receipts

**Spec:** `docs/superpowers/specs/2026-08-28-compiler-generalization-v2-design.md`

## Global Constraints

- No host adapter or profile activation.
- No third-party code execution.
- No inferred authority, precondition, permission, or external effect.
- Existing arena outcomes remain regression gates.
- Production behavior is written only after its focused test fails for the expected missing behavior.

---

### Task 1: Natural compatible composition

**Files:**
- Modify: `src/intent-compiler.mjs`
- Create: `tests/intent-generalization-v2.test.mjs`

**Interfaces:**
- Consumes: validated natural request and validated compact cards passed to `compileIntent({ request, cards })`
- Produces: an envelope whose candidate families and required capabilities can be covered only by the smallest mutually compatible card set

- [x] Write a failing test proving Aegis plus Forge is selected from natural language without a proposal.
- [x] Write exclusion fixtures proving generic review language remains Aegis-only and broad ambiguous language still pauses.
- [x] Run `node --test tests/intent-generalization-v2.test.mjs` and observe the missing-composition failure.
- [x] Add bounded capability-evidence and compatible-set derivation.
- [x] Re-run the focused tests and preserve deterministic output.
- [x] Commit the independently testable behavior.

### Task 2: Certification and proof limits

**Files:**
- Create: `scripts/build-compiler-generalization-v2-receipt.mjs`
- Create: `tests/compiler-generalization-v2-certification.test.mjs`
- Create: `receipts/compiler-generalization-v2.json`
- Modify: `package.json`
- Modify: `docs/intent-compiler.md`

**Interfaces:**
- Consumes: exact compiler, runtime, contract, routing-card, and arena bytes plus observed focused metrics
- Produces: deterministic certification receipt with exact hashes and explicit proof limits

- [x] Write a failing certification test that requires exact artifact reconciliation and zero existing arena regressions.
- [x] Implement the deterministic receipt builder and package command.
- [x] Generate the receipt twice and compare exact bytes.
- [x] Run focused tests, intent arena, and the full repository suite.
- [ ] Obtain independent review of over-composition, authority invention, and proof claims.
- [ ] Commit only after all gates pass.
