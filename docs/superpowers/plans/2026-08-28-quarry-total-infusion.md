# Quarry Total Infusion Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 7,776 Wave 2 skill bodies a terminal evidence disposition and make every usable unique body available through one bounded, agent-neutral Omnibus Godskill.

**Architecture:** Build one deterministic cold atlas from existing source, duplicate, security, ontology, and routing evidence. Keep the current 20 domain Godskills narrow; add Omnibus only as a specialist-discovery and handoff layer, never as a broad execution authority.

**Tech Stack:** Node.js 24 ESM, JSON/JSONL artifacts, existing Godskills router and promotion policy, `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-28-quarry-total-infusion-design.md`

## Global Constraints

- Process exactly 7,776 source ids and 3,581 unique bodies.
- Execute no third-party quarry code.
- Copy no third-party prose into a promoted skill.
- Preserve exact source ids, body digests, license signals, security findings, and uncertainty.
- Retrieval limit is 1 through 5 and never loads a selected source body automatically.
- No external write, account mutation, deployment, publication, push, spending, host activation, or Pantheon enablement.

---

### Task 1: Canonical infusion model

**Files:**
- Create: `src/quarry-infusion.mjs`
- Test: `tests/quarry-total-infusion.test.mjs`

**Interfaces:**
- Consumes: source rows, security rows, ontology, routing-family map, and extracted body structures.
- Produces: `buildQuarryInfusion({ sources, securityRows, ontology, familyTargets, bodyTexts })` with `canonical`, `dispositions`, `facets`, `familyIndex`, and `coverage`.

- [ ] Write failing fixtures proving exact duplicate folding, rejected canonical bodies, deterministic family assignment, preserved security evidence, and exactly-once terminal coverage.
- [ ] Run `node --test tests/quarry-total-infusion.test.mjs` and observe missing-module failure.
- [ ] Implement strict validators, canonical representative selection, structural extraction, family mapping, facet construction, and coverage reconciliation.
- [ ] Run the focused test and commit the model.

### Task 2: Rebuildable corpus artifacts

**Files:**
- Create: `scripts/build-quarry-infusion.mjs`
- Create: `data/quarry-family-targets.v1.json`
- Generate: `artifacts/quarry-infusion/*.json*`
- Generate: `receipts/quarry-total-infusion-v1.json`
- Test: `tests/quarry-total-infusion-certification.test.mjs`

**Interfaces:**
- Consumes: exact Wave 2 receipts and D-drive source bodies.
- Produces: deterministic byte-bound artifacts plus `buildQuarryInfusionReceipt({ root, write })`.

- [ ] Write a failing rebuild test comparing generated evidence with committed artifacts.
- [ ] Implement atomic JSONL generation and raw-byte receipt bindings.
- [ ] Generate all artifacts, require exact expected counts, then rerun twice for byte stability.
- [ ] Commit the certified corpus layer.

### Task 3: Cold specialist retrieval

**Files:**
- Create: `src/quarry-atlas.mjs`
- Create: `scripts/query-quarry-atlas.mjs`
- Test: `tests/quarry-atlas.test.mjs`

**Interfaces:**
- Consumes: verified infusion receipt, facet JSONL, query text, optional family, and limit.
- Produces: bounded ranked facet cards containing provenance, risk, and target Godskill but no source body.

- [ ] Write failing direct, paraphrase, family-filter, duplicate, rejected, tampered-receipt, and limit tests.
- [ ] Implement deterministic lexical ranking with exact digest verification and fail-closed empty results.
- [ ] Verify CLI JSON transport and repeated byte-identical output.
- [ ] Commit the retrieval layer.

### Task 4: Omnibus Godskill

**Files:**
- Create: `skills/eternities-omnibus/SKILL.md`
- Create: `skills/eternities-omnibus/references/operating-contract.md`
- Create: `skills/eternities-omnibus/references/capability-contract.json`
- Create: `skills/eternities-omnibus/references/routing-card.json`
- Create: `skills/eternities-omnibus/evals/cases.json`
- Create: `scripts/build-omnibus-receipt.mjs`
- Create: `receipts/promotions/eternities-omnibus.json`
- Create: `syntheses/eternities-omnibus.v1.json`
- Test: `tests/eternities-omnibus-godskill.test.mjs`

**Interfaces:**
- Consumes: a specialist-discovery outcome with local-read authority.
- Produces: up to five inert facets and a narrow Godskill handoff recommendation.

- [ ] Write failing routing, exclusion, conflict, authority, and exact-artifact tests.
- [ ] Implement the independently written entrypoint and contracts with no copied source prose.
- [ ] Evaluate against the promotion policy and generate an exact receipt.
- [ ] Commit the promoted but cold Omnibus capability.

### Task 5: Routing and total-system certification

**Files:**
- Modify: `package.json`
- Modify: `scripts/build-godskills-system-certification.mjs`
- Generate: `artifacts/routing/*`
- Generate: `receipts/agent-native-router-v7.json`
- Generate: `receipts/godskills-system-certification-v2.json`
- Test: `tests/agent-native-router-v7.test.mjs`
- Test: `tests/godskills-system-v2-certification.test.mjs`

**Interfaces:**
- Consumes: the 21-card routing layer and infusion/Omnibus receipts.
- Produces: a final certificate requiring total quarry coverage and all prior v1 gates.

- [ ] Write failing commandless routing and stale-infusion negative tests.
- [ ] Rebuild routing artifacts and certify Omnibus is selected only for explicit specialist-corpus discovery.
- [ ] Build v2 certification requiring all 7,776 terminal rows, all 3,581 canonical bodies, zero unresolved sources, and no activation.
- [ ] Run focused tests and `npm test`, then commit.

### Task 6: Closure and integration

**Files:**
- Review all branch changes and receipts.

**Interfaces:**
- Consumes: clean feature branch and complete verification evidence.
- Produces: independently reviewed mainline release with temporary worktree removed.

- [ ] Request an independent adversarial review of provenance, terminal coverage, routing safety, determinism, and proof language.
- [ ] Fix every confirmed finding and rerun focused plus full verification.
- [ ] Merge only after clean review, verify the merged tree, and remove only this worktree and branch.
