# Universal Capability Construction Wave Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all 48 mechanism-owning Wave 2 targets into independently written universal operational skills or exact existing-Godskill extensions, evaluate every target, and emit one portable certified capability release.

**Architecture:** Preserve the 21 compact categorical Godskills as top-level owners. Materialize 22 focused operational delegates and 26 bounded owner extensions from exact semantic evidence, then package promoted results in a content-addressed portable manifest compatible with the Godagents selected-entrypoint boundary.

**Tech Stack:** Node.js 24+, ECMAScript modules, JSON Schema-style contracts, deterministic JSON/JSONL artifacts, Node test runner, existing Godskills router and evaluation machinery.

**Spec:** `docs/superpowers/specs/2026-08-29-universal-capability-construction-wave.md`

## Global Constraints

- The system is provider-neutral, agent-neutral, product-neutral, organization-neutral, embodiment-neutral, and Realm-neutral.
- Lunari is one optional consumer and contributes no construction priority or authority.
- The input set is exactly 22 `synthesize-operational-skill` and 26 `extend-existing` actions from `data/wave2-synthesis-plan.v1.json`.
- No source instruction executes and no source prose is copied.
- No target promotes without exact current evidence, critical fixture coverage, resolved effects, and a measured improvement.
- No host profile, Godagent genome, Realm Contract, external account, or product runtime is changed.
- The 21 existing Godskills remain the only top-level categorical owners in this wave.

---

### Task 1: Exact construction ledger and priority order

**Files:**
- Create: `src/universal-capability-wave.mjs`
- Create: `scripts/build-universal-capability-wave.mjs`
- Create: `data/universal-capability-wave.v1.json`
- Create: `artifacts/universal-capability-wave/priority-ledger.jsonl`
- Create: `artifacts/universal-capability-wave/coverage.json`
- Test: `tests/universal-capability-wave.test.mjs`

**Interfaces:**
- Consumes: `buildUniversalCapabilityWave({ synthesisPlan, clusterEvidence, reviewEvidence })`.
- Produces: exactly 48 normalized target rows and `certifyUniversalCapabilityCoverage(rows)`.

- [ ] **Step 1: Write failing exact-coverage tests** proving 22 operational actions, 26 extensions, exact cluster and review digests, stable bytewise ordering, no duplicate target, no unknown owner, and no Lunari-specific priority field.
- [ ] **Step 2: Run** `node --test tests/universal-capability-wave.test.mjs` and require the missing-module failure.
- [ ] **Step 3: Implement the pure normalizer and six-dimension priority score** with integer dimensions from zero through five and the tie-break order `score`, `familyId`, `clusterId`.
- [ ] **Step 4: Build the ledger twice** and require identical SHA-256 digests, 48 targets, 22 operational targets, 26 extension targets, and zero unresolved input bindings.
- [ ] **Step 5: Commit** the ledger, builder, and tests.

### Task 2: Operational capability contract and materializer

**Files:**
- Create: `src/operational-capability.mjs`
- Create: `scripts/build-operational-capabilities.mjs`
- Create: `schemas/operational-capability.schema.json`
- Create: `tests/operational-capability.test.mjs`
- Generate: `skills/<operational-id>/SKILL.md`
- Generate: `skills/<operational-id>/references/capability-contract.json`
- Generate: `skills/<operational-id>/references/provenance.json`
- Generate: `skills/<operational-id>/evals/cases.json`

**Interfaces:**
- Consumes: one exact operational target plus an independently authored neutral workflow record.
- Produces: `validateOperationalCapability(record)`, `renderOperationalSkill(record)`, and four deterministic skill artifacts.

- [ ] **Step 1: Write failing schema and rendering tests** for discriminating description, owner identity, exact evidence, inputs, outputs, operations, effects, failure behavior, exclusions, authority, termination, direct/paraphrased/contextual/negative/conflict cases, and source-prose exclusion.
- [ ] **Step 2: Run** `node --test tests/operational-capability.test.mjs` and require the missing-module failure.
- [ ] **Step 3: Implement strict validation and deterministic rendering** so the renderer cannot invent missing fields, product authority, provider identity, or source instructions.
- [ ] **Step 4: Add collision and token-budget tests** requiring unique ids, unique intents, stable route ownership, and an entrypoint ceiling of 1,600 estimated tokens.
- [ ] **Step 5: Commit** the contract, materializer, schema, and tests.

### Task 3: Universal engineering operational skills

**Files:**
- Create records and generated skill artifacts for:
  - `bounded-service-shutdown`
  - `invariant-guard`
  - `formula-preserving-workbook-engineering`
  - `fp-ts-functional-refactoring`
  - `api-rate-limit-recovery`
  - `web-performance-optimization`
  - `semantic-implementation-diff`
  - `symbolic-mathematics-python`
- Test: `tests/universal-engineering-operational-skills.test.mjs`

**Interfaces:**
- Consumes: exact target ledger rows and Task 2 materializer.
- Produces: eight focused delegates owned by Daedalus or its declared supporting owners.

- [ ] **Step 1: Write failing cross-capability tests** proving mechanism distinction, direct and delegated use, no dependency installation, no production mutation, and no formal-proof overclaim.
- [ ] **Step 2: Author eight neutral records** with mechanism-specific evidence, failure modes, authority gates, and termination conditions.
- [ ] **Step 3: Materialize and validate all eight skills**, then run `node --test tests/operational-capability.test.mjs tests/universal-engineering-operational-skills.test.mjs`.
- [ ] **Step 4: Evaluate each skill against Daedalus or native behavior** and retain only evidence-earned dispositions.
- [ ] **Step 5: Commit** the eight skills and terminal evaluation evidence.

### Task 4: Data, product, and release operational skills

**Files:**
- Create records and generated skill artifacts for:
  - `bounded-verified-object-ingestion`
  - `columnar-ingestion-rollup-and-query-layout-design`
  - `lazy-tabular-transformation-and-validation`
  - `measured-paid-creative-iteration`
  - `venture-falsification-and-planning`
  - `release-script-safety`
  - `performance-release-gating`
- Test: `tests/universal-data-product-release-operational-skills.test.mjs`

**Interfaces:**
- Consumes: exact target ledger rows and Task 2 materializer.
- Produces: seven portable delegates with provider-specific execution left to separately authorized adapters.

- [ ] **Step 1: Write failing effect-boundary tests** for storage mutation, database installation, arbitrary file reads, advertising spend, financial authority, deployment, and external load generation.
- [ ] **Step 2: Author seven neutral records** with local artifact outputs and explicit Oracle, Atlas, Beacon, Herald, Aegis, or Daedalus handoffs.
- [ ] **Step 3: Materialize, validate, and test** all seven skills.
- [ ] **Step 4: Evaluate each skill against its strongest current owner or native workflow** and issue terminal receipts.
- [ ] **Step 5: Commit** the seven skills and evaluation evidence.

### Task 5: Evidence, science, document, and accessibility operational skills

**Files:**
- Create records and generated skill artifacts for:
  - `approval-bound-private-session-mining`
  - `confirmed-destructive-reconstruction`
  - `diagnostic-statistical-model-inference`
  - `docx-package-redline-and-render-verification`
  - `genomic-coordinate-assembly-and-variant-gates`
  - `physics-constrained-numerical-validation`
  - `interface-localization-and-bidirectionality`
- Test: `tests/universal-evidence-science-accessibility-operational-skills.test.mjs`

**Interfaces:**
- Consumes: exact target ledger rows and Task 2 materializer.
- Produces: seven explicit-boundary delegates with domain claims limited to verified inputs and adapters.

- [ ] **Step 1: Write failing high-risk tests** for private-session access, destructive action, causal overclaim, unsafe document-package links, genome-build mismatch, simulation-to-hardware confusion, and unreviewed translation publication.
- [ ] **Step 2: Author seven neutral records** with exact approval, evidence, privacy, units, coordinate, rendering, and human-review gates.
- [ ] **Step 3: Materialize, validate, and test** all seven skills.
- [ ] **Step 4: Evaluate each skill against its current owner or native workflow** and issue terminal receipts.
- [ ] **Step 5: Commit** the seven skills and evaluation evidence.

### Task 6: Existing-Godskill extension registries

**Files:**
- Create: `src/godskill-extension-registry.mjs`
- Create: `scripts/build-godskill-extension-registries.mjs`
- Create: `data/godskill-extensions.v1.json`
- Create: `skills/<owner>/references/wave2-capability-extensions.json` for every affected owner
- Preserve: affected owner `SKILL.md` files as immutable receipt-bound routing identities
- Test: `tests/godskill-extension-registry.test.mjs`

**Interfaces:**
- Consumes: all 26 `extend-existing` target rows.
- Produces: exact owner registries and `selectOwnerExtension({ ownerId, requestFeatures })`.

- [ ] **Step 1: Write failing tests** requiring all 26 targets exactly once, current owner existence, exact evidence, deterministic selection, no description inflation, no authority expansion, and no cross-owner recursion.
- [ ] **Step 2: Implement the registry validator and deterministic selector** with at most three returned extensions.
- [ ] **Step 3: Author all 26 extension contracts** from the neutral target intents and mechanism-specific rationales.
- [ ] **Step 4: Bind every owner registry through the portable router manifest without mutating owner entrypoint bytes** and rerun every owner-specific regression suite.
- [ ] **Step 5: Commit** the registries, owner changes, and tests.

### Task 7: Portable hierarchical capability manifest

**Files:**
- Create: `src/portable-capability-manifest.mjs`
- Create: `scripts/build-portable-capability-manifest.mjs`
- Create: `schemas/portable-capability-manifest.schema.json`
- Create: `artifacts/portable-capabilities/manifest.v1.json`
- Create: `receipts/portable-capability-manifest-v1.json`
- Test: `tests/portable-capability-manifest.test.mjs`

**Interfaces:**
- Consumes: promoted top-level contracts, promoted operational contracts, owner registries, and exact promotion receipts.
- Produces: `buildPortableCapabilityManifest(evidence)` and one content-addressed selected-entrypoint package.

- [ ] **Step 1: Write failing manifest tests** for exact entrypoints, owner hierarchy, contract and receipt digests, stable ordering, bounded composition, no host paths, no credentials, no source bodies, and no product-specific authority.
- [ ] **Step 2: Implement the pure manifest builder and schema validation**.
- [ ] **Step 3: Rebuild twice** and require byte identity.
- [ ] **Step 4: Add selected-entrypoint compatibility fixtures matching the Godagents adapter contract**, including authority/effect subset and malformed-composition rejection.
- [ ] **Step 5: Commit** the manifest, receipt, and compatibility tests.

### Task 8: Routing, evaluation, and terminal certification

**Files:**
- Modify: routing artifacts only through existing builders
- Create: `scripts/build-universal-capability-certification.mjs`
- Create: `receipts/universal-capability-construction-v1.json`
- Create: `docs/universal-capability-construction-report.md`
- Modify: `README.md`
- Test: `tests/universal-capability-certification.test.mjs`

**Interfaces:**
- Consumes: all 48 terminal receipts, portable manifest receipt, Wave 2 certificate, current router receipts, and adversarial review evidence.
- Produces: one rebuildable terminal certificate and Godagents handoff digest.

- [ ] **Step 1: Write the failing final certificate test** requiring 48 exact terminal targets, 22 operational artifacts, 26 extension entries, exact promotion dispositions, deterministic portable manifest, zero authority expansion, zero source execution, zero activation, and current routing regressions.
- [ ] **Step 2: Rebuild the intent compiler and router receipts** and require all historical and new hierarchical routing fixtures.
- [ ] **Step 3: Implement the certificate builder** and rebuild it twice for byte identity.
- [ ] **Step 4: Run focused tests and `npm test`**, then perform an inline adversarial review because the user limited this task to one optional Terra reviewer maximum.
- [ ] **Step 5: Fix every confirmed critical or important finding**, rerun the complete suite, and write the exact Godagents compatibility handoff.
- [ ] **Step 6: Merge to `main` only after all gates pass**, rerun the merged suite, remove only the owned worktree and merged feature branch, and leave unrelated Godagents and Beacon work untouched.
