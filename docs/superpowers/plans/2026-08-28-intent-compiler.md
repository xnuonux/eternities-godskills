# Eternities Intent Compiler Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, agent-neutral natural-language intent compiler that safely produces validated Godskills router envelopes and refuses to invent authority.

**Architecture:** Add separate contracts, compiler, and runtime modules around the existing compact-card index and deterministic router. Natural language and optional semantic proposals produce evidence, while explicit host context remains the sole source of authority and permitted effects.

**Tech Stack:** Node.js 24 ESM, built-in `node:test`, JSON and JSONL artifacts, existing Godskills routing contracts.

**Spec:** `docs/superpowers/specs/2026-08-28-intent-compiler-design.md`

## Global Constraints

- No network dependency, model SDK, embedding database, or runtime package dependency.
- Never infer authority, credentials, consent, spending permission, publication permission, production mutation permission, or rights from natural language.
- Never load skill bodies during compilation or routing.
- Candidate retrieval remains at most eight cards during compilation and 32 cards during routing.
- Existing router contracts and historical receipts remain backward compatible.
- Generated receipts must be deterministic and state fixture-versus-live proof limits.

---

### Task 1: Intent contracts

**Files:**
- Create: `src/intent-contracts.mjs`
- Create: `tests/intent-contracts.test.mjs`

**Interfaces:**
- Consumes: routing effect, risk, and evidence vocabularies from `src/routing-contracts.mjs`
- Produces: `validateNaturalRequest(value)`, `validateSemanticProposal(value, cards)`, and `validateCompilerReceipt(value)`

- [x] Write failing tests for canonical natural requests, forbidden authority proposal fields, unknown card ids, unstable arrays, malformed receipts, and deterministic accepted values.
- [x] Run `node --test tests/intent-contracts.test.mjs` and verify failures identify the absent module.
- [x] Implement strict schema-versioned validators with no authority field in semantic proposals.
- [x] Run the focused tests and verify they pass.
- [x] Commit the contract slice.

### Task 2: Deterministic candidate evidence

**Files:**
- Create: `src/intent-compiler.mjs`
- Create: `tests/intent-compiler.test.mjs`

**Interfaces:**
- Consumes: validated natural request and compact routing cards
- Produces: `compileIntent({ request, cards }) -> compilerReceipt`

- [x] Write failing tests for architecture, security, visual, continuity, Forge, social, game, media, data, writing, debugging, and unknown-intent missions.
- [x] Run the focused test and verify the compiler module is missing.
- [x] Implement normalized phrase/token evidence, stable scoring, negative-intent penalties, eight-card bounds, confidence, and ambiguity detection.
- [x] Run focused tests and verify exact expected candidates without aliases or slash commands.
- [x] Commit candidate retrieval.

### Task 3: Authority, effect, and proposal reconciliation

**Files:**
- Modify: `src/intent-compiler.mjs`
- Modify: `tests/intent-compiler.test.mjs`

**Interfaces:**
- Consumes: host context and optional untrusted semantic proposal
- Produces: canonical router envelope plus requested-effect and decision evidence

- [x] Add failing tests proving prose cannot grant external-write, spending, production, security, rights, or account authority.
- [x] Add failing tests for valid host authority, unsupported proposals, effect mismatches, and missing card preconditions.
- [x] Run focused tests and verify policy assertions fail before implementation.
- [x] Implement effect inference and missing-authority/precondition decisions without expanding host context.
- [x] Implement proposal reconciliation that rejects unsupported ids and cannot carry authority.
- [x] Run focused tests and verify all policy cases pass.
- [x] Commit policy reconciliation.

### Task 4: Compile-and-route runtime and CLI

**Files:**
- Create: `src/intent-runtime.mjs`
- Create: `scripts/intent.mjs`
- Create: `tests/intent-runtime.test.mjs`
- Create: `tests/intent-transport.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `compileIntent`, `buildRoutingIndex`, `shortlistRoutingCards`, and `routeCapabilities`
- Produces: `compileAndRoute({ request, cards }) -> { compilerReceipt, routeReceipt }` and `npm run intent -- --request <json> [--cards <jsonl>] [--output <json>]`

- [x] Write failing runtime tests for selected, needs-decision, no-qualified-route, bounded shortlisting, and absence of skill-body reads.
- [x] Write failing CLI tests for stdout, canonical output, unknown flags, and refusal of apply-style flags.
- [x] Run focused tests and verify missing runtime/transport behavior.
- [x] Implement the runtime composition and file-only CLI.
- [x] Run focused tests and verify deterministic output.
- [x] Commit runtime transport.

### Task 5: Adversarial arena

**Files:**
- Create: `data/intent-arena.v1.json`
- Create: `src/intent-arena.mjs`
- Create: `scripts/evaluate-intent-arena.mjs`
- Create: `tests/intent-arena.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: at least 120 commandless mission cases and `compileAndRoute`
- Produces: deterministic aggregate and per-case arena results

- [x] Write failing tests for corpus size, all-card positive coverage, unsafe classes, ambiguity cases, deterministic repeatability, zero authority invention, and metric reconciliation.
- [x] Run the arena tests and verify failure before implementation and fixture creation.
- [x] Add independently worded positive, mixed, ambiguous, and unsafe missions with expected boundaries.
- [x] Implement arena evaluation and exact metric aggregation.
- [x] Run arena tests, account for every miss, and refine compact evidence only when the refinement remains generally valid.
- [x] Commit the arena.

### Task 6: Documentation and certification

**Files:**
- Create: `docs/intent-compiler.md`
- Create: `receipts/intent-compiler-v1.json`
- Create: `scripts/build-intent-compiler-receipt.mjs`
- Create: `tests/intent-compiler-certification.test.mjs`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: compiler, runtime, cards, arena, and focused test evidence
- Produces: portable adapter documentation and deterministic certification receipt

- [ ] Write failing certification tests for exact artifact digests, arena gates, proof limits, and external-action prohibitions.
- [ ] Run focused certification tests and verify missing artifacts fail.
- [ ] Document JSON usage, generic adapter requirements, and host integration boundaries.
- [ ] Implement the deterministic receipt builder and generate the receipt twice.
- [ ] Verify byte-identical receipts and pass focused certification tests.
- [ ] Commit documentation and certification.

### Task 7: Review and integration

**Files:**
- Modify: `docs/superpowers/plans/2026-08-28-intent-compiler.md`

**Interfaces:**
- Consumes: the complete feature branch and independent review findings
- Produces: verified local-main integration

- [ ] Run `npm test` and require zero failures.
- [ ] Run intent compiler artifact generation twice and compare exact hashes.
- [ ] Run `git diff --check main..HEAD`.
- [ ] Request independent review focused on authority invention, unsafe selection, adapter ambiguity, fixture leakage, and proof claims.
- [ ] Fix confirmed findings through failing regression tests.
- [ ] Mark this checklist complete, merge locally into `main`, and rerun the full suite on the integrated tree.
- [ ] Remove only the verified merged feature branch and worktree.
