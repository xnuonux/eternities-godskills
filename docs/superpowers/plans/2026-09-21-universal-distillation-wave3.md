# Universal distillation wave 3 implementation plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add only source-supported missing methods for geospatial integrity and experiment artifact lineage, and exercise the resulting instructions before installation.

**Architecture:** The existing self-contained Markdown pack and metadata catalog remain the product. Two Luna reviewers inspect disjoint source sets; the parent authors final methods and checks. Jev supplies advisory triage, never acceptance.

**Tech Stack:** Markdown, JSON, existing Node 24 built-in-only product tooling, Node test runner.

**Spec:** `docs/universal-product-v1-plan.md` and this bounded source-to-method acceptance contract.

## Global constraints

- Keep the historical activation ABI and frozen receipt artifacts unchanged.
- No dependency, API, warehouse, personal path or mandatory companion skill is required by the shipped methods.
- Source entrypoints remain inert research; preserve source identities and provenance.
- Classifications do not promote skills. Maturity stays instruction-reviewed; a bounded exercise is not universal performance qualification.
- Use the existing isolated `feat/universal-product-v1` worktree, reconciled to canonical `14f48b7` before work. Baseline: 938 tests, 937 pass, one legacy symlink skip.

## Task 1: Source-supported contracts

**Files:** `docs/universal-wave3-geospatial-source-review.md`, `docs/universal-wave3-experiment-source-review.md`, `artifacts/universal-product-v1/wave3/jev-triage.json`.

**Interfaces:** Exact source records from `data/quarry-intake-2026-09-21-exa/sources.jsonl` produce hash-checked source ledgers and retained/rejected mechanisms. No product writes by reviewers.

- [x] Verify clean branch/upstream and run fresh baseline tests.
- [x] Obtain one four-item Jev triage batch; preserve abstention and thin-wrapper warnings.
- [x] Read and compare the two independent source reviews; reject unsupported mechanisms and excessive scope.

## Task 2: Discovery and methods

**Files:** `tests/universal-discovery-cases.test.mjs`, `product/skills/geospatial-coordinate-integrity/{SKILL.md,skill.json}`, `product/skills/experiment-artifact-lineage/{SKILL.md,skill.json}`, broad-owner metadata, generated product catalog/index/release.

**Interfaces:** Existing `searchCatalog(catalog, query, {limit:3})` must return the relevant specialist for direct and paraphrased task queries without activation. Methods produce validated transformations or evidence-bound resume/reuse decisions, not new authority.

- [x] Add these literal discovery cases before adding metadata:

```js
['Fix GIS CRS axis order and reproject coordinates without changing their location','geospatial-coordinate-integrity'],
['My map layers do not line up and buffer distances are in degrees','geospatial-coordinate-integrity'],
['Resume model training only when checkpoint dataset split and experiment lineage match','experiment-artifact-lineage'],
['Can I reuse cached features after preprocessing and training data changed','experiment-artifact-lineage'],
```

- [x] Run `node --test tests/universal-discovery-cases.test.mjs`; verify the four new cases fail for absent methods.
- [x] Independently author concise methods, useful examples, exclusions, optional relations and exact provenance. No arbitrary provider prescriptions.
- [x] Rerun discovery tests and `node product/bin/godskills.mjs build`, then `node product/bin/godskills.mjs validate`.

## Task 3: Instruction exercise and publication

**Files:** `artifacts/universal-product-v1/wave3/exercise/`, `docs/universal-intake-distillation-wave-3.md`, current product scope and release summary.

**Interfaces:** Fresh Luna contexts receive identical inert task inputs. The baseline is host-native (existing global skills cannot be removed); only the assisted arm receives the uninstalled candidate. Predeclare cases and criteria, freeze candidate bytes, retain outputs and failures, and do not expose the scoring key to workers.

- [ ] Run an actual artifact-lineage decision exercise with independent expected outcomes, including valid reuse, incomplete evidence, changed split, missing resume state and leakage.
- [ ] Review candidate instructions for concrete defects independently of their author; preserve findings and revisions.
- [ ] Run the full repository suite with the existing second-volume fixture and compare protected artifacts against the pinned base.
- [ ] Reconcile upstream, commit only scoped changes, fast-forward canonical main and push verified work.
- [ ] Install with a new explicit backup directory; verify every installed skill against the release manifest and preserve unrelated files. Update the clean-machine ZIP and local receipt.

If a candidate fails to add a real procedure, defer it rather than adding a title for coverage. Audio/video synchronization remains deferred here: the initial source is a launcher shell, not sufficient evidence of a missing method.
