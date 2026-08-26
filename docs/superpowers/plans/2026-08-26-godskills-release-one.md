# Eternities Godskills Release One Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first working sovereign-skill refinery release: ingest the ten missing GitHub stars once, normalize the certified 4,676-entry source catalog, produce deterministic ontology and duplicate evidence, promote one refined skill and one Godskill through measurable gates, and prove a reversible active Codex profile.

**Architecture:** A dependency-free Node.js ESM core reads the existing certified cold index and produces first-party contracts, clusters, evaluations, locks, and receipts inside this repository. Third-party repositories remain in `D:\03-ARSENAL\warehouse`; only sovereign artifacts live here. Profile activation exposes a small proven set through supported `.agents/skills` discovery while the full corpus remains cold.

**Tech Stack:** Node.js 24 built-ins, `node:test`, JSON/JSONL, Markdown, PowerShell only for invoking the existing warehouse index certification scripts, Git and GitHub CLI for repository ingestion.

**Spec:** `docs/superpowers/specs/2026-08-26-eternities-godskills-design.md`

## Global Constraints

- Canonical repository warehouse: `D:\03-ARSENAL\warehouse`.
- First-party source: `C:\dev\eternities-godskills`.
- Do not execute third-party setup, hooks, binaries, installers, or repository scripts during ingestion or mining.
- Exact GitHub origin identity wins over folder-name similarity.
- Do not delete sources, overwrite installed skills, publish, push, deploy, or change model routing.
- Unknown, restricted, noncommercial, copyleft, branding-bound, or mixed-license sources remain behavior-only unless compatibility is established.
- Promotion requires no critical baseline regression and at least one measured improvement.
- The full catalog remains cold; only a compact lock-selected profile enters Codex discovery.
- `eternities-pantheon` is explicit-only and is outside release-one promotion.
- Every external-state mutation supports a dry run and writes a receipt.

---

## File Structure

### Repository foundation

- `package.json` ... scripts and Node version contract.
- `README.md` ... release-one operator entrypoint and safety boundaries.
- `src/paths.mjs` ... canonical path resolution and containment checks.
- `src/io.mjs` ... deterministic JSON reads, atomic writes, and SHA-256 helpers.
- `src/schema.mjs` ... capability-contract, source-record, evaluation, and profile-lock validation.

### Warehouse ingestion

- `data/star-delta-2026-08-26.json` ... immutable approved GitHub delta.
- `scripts/sync-star-delta.mjs` ... dry-run-first exact-origin deduplication, shallow clone, and receipt generation.
- `tests/sync-star-delta.test.mjs` ... path, identity, duplicate, command, and failure tests.
- `receipts/star-sync-2026-08-26.json` ... actual verified outcomes.

### Catalog and ontology

- `src/catalog.mjs` ... parse the existing certified cold index into normalized source records.
- `src/ontology.mjs` ... assign first-party categories and stable behavioral fingerprints.
- `src/clusters.mjs` ... exact, alias, and behavioral candidate groups without destructive merging.
- `scripts/build-catalog.mjs` ... deterministic release artifact builder.
- `data/ontology.v1.json` ... first-party category definitions and keyword evidence.
- `tests/catalog.test.mjs` ... root schema, normalization, deterministic ids, and duplicate evidence.
- `tests/ontology.test.mjs` ... category and non-merge boundary cases.

### Refinery and evaluation

- `src/evaluate.mjs` ... route, exclusion, conflict, coverage, and token-budget scoring.
- `src/promote.mjs` ... fail-closed promotion decision and receipt construction.
- `scripts/evaluate-skill.mjs` ... evaluate one sovereign artifact and write its receipt.
- `policies/promotion.v1.json` ... numeric gates and critical-case policy.
- `tests/evaluate.test.mjs` ... regression, improvement, unknown-baseline, and token tests.
- `tests/promote.test.mjs` ... promotion state-machine tests.

### Sovereign artifacts

- `skills/sovereign-skill-refinery/SKILL.md` ... refined workflow for turning source evidence into independent first-party skills.
- `skills/sovereign-skill-refinery/references/contract-template.json` ... exact contract shape.
- `skills/sovereign-skill-refinery/evals/cases.json` ... direct, paraphrase, exclusion, and conflict cases.
- `skills/eternities-oracle/SKILL.md` ... categorical source-research and repository-mining Godskill.
- `skills/eternities-oracle/references/operating-contract.md` ... source hierarchy, handoffs, and failure semantics.
- `skills/eternities-oracle/evals/cases.json` ... Godskill routing and composition cases.
- `provenance/source-ledger.jsonl` ... private source, revision, license, extraction, and digest rows.
- `receipts/promotions/*.json` ... immutable promotion evidence.

### Active profiles

- `src/profile.mjs` ... preview, activate, verify, and remove a lock-selected profile.
- `profiles/eternities-core.lock.json` ... exact skill sources and destination names.
- `tests/profile.test.mjs` ... collision, containment, rollback, and idempotence tests.
- `receipts/profile-eternities-core.json` ... activation and rendered-prompt verification.
- `tests/release-certification.test.mjs` ... aggregate release receipt gate.

---

### Task 1: Foundation, deterministic I/O, and schemas

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `src/paths.mjs`
- Create: `src/io.mjs`
- Create: `src/schema.mjs`
- Create: `tests/schema.test.mjs`

**Interfaces:**
- Produces: `assertInside(parent, child) -> string`, `readJson(path) -> unknown`, `writeJsonAtomic(path, value) -> void`, `sha256(value) -> string`, `validateSourceRecord(value)`, `validateCapabilityContract(value)`, `validateEvaluation(value)`, and `validateProfileLock(value)`.
- Consumes: no project code.

- [ ] **Step 1: Write failing schema and containment tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { assertInside } from "../src/paths.mjs";
import { validateCapabilityContract } from "../src/schema.mjs";

test("assertInside rejects a path outside its canonical parent", () => {
  assert.throws(() => assertInside("D:\\03-ARSENAL\\warehouse", "C:\\escape"), /outside canonical root/);
});

test("capability contracts require effects and negative triggers", () => {
  assert.throws(() => validateCapabilityContract({ schemaVersion: 1, id: "cap-x" }), /effects/);
});
```

- [ ] **Step 2: Run the focused test and confirm missing-module failure**

Run: `node --test tests/schema.test.mjs`

Expected: FAIL because `src/paths.mjs` and `src/schema.mjs` do not exist.

- [ ] **Step 3: Implement focused modules and package scripts**

`package.json` must set `"type": "module"`, `"engines": { "node": ">=24" }`, and scripts `test`, `check`, `sync:stars`, `build:catalog`, and `profile`.

`assertInside` must compare resolved Windows paths case-insensitively and accept only equality or a child beginning with the canonical root plus a path separator. Validators must reject unknown schema versions, missing required arrays, duplicate ids, and invalid effect values outside `none`, `read`, `write`, and `external-write`.

- [ ] **Step 4: Run foundation verification**

Run: `npm test -- --test-name-pattern="assertInside|capability contracts"`

Expected: PASS.

- [ ] **Step 5: Commit the foundation**

```powershell
git add package.json README.md src/paths.mjs src/io.mjs src/schema.mjs tests/schema.test.mjs
git commit -m "feat: establish sovereign refinery foundation"
```

### Task 2: Exact, dry-run-first GitHub star ingestion

**Files:**
- Create: `data/star-delta-2026-08-26.json`
- Create: `scripts/sync-star-delta.mjs`
- Create: `tests/sync-star-delta.test.mjs`
- Create during apply: `receipts/star-sync-2026-08-26.json`

**Interfaces:**
- Consumes: `assertInside`, `readJson`, `writeJsonAtomic`, and the approved twelve-repository delta.
- Produces: `normalizeGitHubRemote(url) -> owner/repo`, `planStarSync(delta, inventory) -> SyncPlan[]`, `applyStarSync(plan) -> SyncReceipt`.

- [ ] **Step 1: Record the immutable approved delta and failing planner tests**

The JSON contains `cutoff`, all twelve `fullName`, `starredAt`, `sizeKb`, and `disposition`. Mark MarkItDown and Taste Skill as `existing`; mark the other ten `ingest`.

```js
test("planner skips an exact remote already represented elsewhere", () => {
  const plan = planStarSync([{ fullName: "microsoft/markitdown", disposition: "ingest" }], {
    remotes: new Map([["microsoft/markitdown", "D:\\03-ARSENAL\\warehouse\\hunt\\atlas\\microsoft__markitdown"]])
  });
  assert.equal(plan[0].action, "existing");
});

test("planner uses collision-safe owner double-underscore repo destination", () => {
  const plan = planStarSync([{ fullName: "github/github-mcp-server", disposition: "ingest" }], { remotes: new Map() });
  assert.match(plan[0].destination, /from-stars[\\/]github__github-mcp-server$/i);
});
```

- [ ] **Step 2: Run the planner tests and confirm failure**

Run: `node --test tests/sync-star-delta.test.mjs`

Expected: FAIL because the planner does not exist.

- [ ] **Step 3: Implement inventory, planning, and guarded apply**

Default invocation performs a dry run. `--apply` is required to clone. Use `git clone --depth 1 --no-tags <url> <destination>`. Do not use `--recurse-submodules`, run hooks, or run repository code. Verify each successful clone with `git remote get-url origin`, `git rev-parse HEAD`, and `git symbolic-ref --short HEAD`. Refuse any destination outside `D:\03-ARSENAL\warehouse\from-stars`.

- [ ] **Step 4: Run tests, dry run, then approved apply**

Run: `npm test -- --test-name-pattern="planner"`

Run: `node scripts/sync-star-delta.mjs --manifest data/star-delta-2026-08-26.json`

Expected dry run: ten `clone`, two `existing`, zero `conflict`.

Run: `node scripts/sync-star-delta.mjs --manifest data/star-delta-2026-08-26.json --apply`

Expected apply: every row ends `cloned`, `existing`, `empty`, or explicit `failed`; no duplicate destination is created.

- [ ] **Step 5: Re-run for idempotence and commit**

Run the same `--apply` command again.

Expected: all successful prior clones report `existing`; no second clone occurs.

```powershell
git add data/star-delta-2026-08-26.json scripts/sync-star-delta.mjs tests/sync-star-delta.test.mjs receipts/star-sync-2026-08-26.json
git commit -m "feat: ingest approved starred repository delta"
```

### Task 3: Rebuild and certify the warehouse skill index

**Files:**
- Modify externally through existing tool: `C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-index.json`
- Modify externally through existing tool: associated Markdown, card, integrity, vector, and manifest artifacts.
- Create: `receipts/cold-index-refresh-2026-08-26.json`

**Interfaces:**
- Consumes: verified warehouse clones and the existing `build-skill-index.ps1`, `verify-skill-index.ps1`, and vector builder.
- Produces: a certified source index whose `entry_count` and hash become release-one inputs.

- [ ] **Step 1: Capture the pre-build hashes and entry count**

Use Node or PowerShell to record SHA-256 for the source index, integrity file, vector matrix, and vector manifest. Record `entry_count` from the root object.

- [ ] **Step 2: Rebuild the lexical source catalog**

Run:

```powershell
& 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\scripts\build-skill-index.ps1' -WarehouseRoot 'D:\03-ARSENAL\warehouse'
```

Expected: completes with a nonzero entry count and writes certified index artifacts.

- [ ] **Step 3: Rebuild vectors against the new exact index**

Run:

```powershell
& 'C:\Users\Dom\.codex\runtimes\skill-search-eval\Scripts\python.exe' 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\scripts\build-skill-vectors.py' --index 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-index.json' --integrity 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-index.sha256' --model-receipt 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-model-selection-receipt.json' --model-root 'C:\Users\Dom\.codex\models\skill-search' --vectors 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-index-vectors.npy' --manifest 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-vector-manifest.json'
```

- [ ] **Step 4: Verify index, vectors, and representative search**

Run:

```powershell
& 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\scripts\verify-skill-index.ps1' -PythonPath 'C:\Users\Dom\.codex\runtimes\skill-search-eval\Scripts\python.exe'
& 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\scripts\search-skill-index.ps1' -Query 'sovereign agent skill refinement provenance evaluation' -Limit 5 -AsJson
```

Expected: verifier valid, vectors valid, five or fewer ranked cards.

- [ ] **Step 5: Write and commit the refresh receipt**

Receipt fields: before and after hashes, counts, commands, exit codes, new source paths, search result ids, and any explicit failure.

```powershell
git add receipts/cold-index-refresh-2026-08-26.json
git commit -m "chore: certify refreshed cold skill catalog"
```

### Task 4: Normalize sources and produce deterministic duplicate evidence

**Files:**
- Create: `src/catalog.mjs`
- Create: `src/ontology.mjs`
- Create: `src/clusters.mjs`
- Create: `data/ontology.v1.json`
- Create: `tests/catalog.test.mjs`
- Create: `tests/ontology.test.mjs`
- Create during build: `artifacts/release-one/source-records.jsonl`
- Create during build: `artifacts/release-one/duplicate-groups.json`
- Create during build: `artifacts/release-one/ontology-summary.json`

**Interfaces:**
- Consumes: root index `{ schema_version, warehouse_root, entry_count, entries }`.
- Produces: `normalizeIndex(index) -> SourceRecord[]`, `classify(record, ontology) -> string[]`, `findDuplicateGroups(records) -> { exact: DuplicateGroup[], aliases: DuplicateGroup[], candidates: DuplicateGroup[] }`.

- [ ] **Step 1: Write failing normalization and non-merge tests**

```js
test("normalizer reads entries from the certified root object", () => {
  const rows = normalizeIndex({ schema_version: 1, entry_count: 1, entries: [{ id: "skill-a", name: "A", description: "does x", source_path: "r/a/SKILL.md" }] });
  assert.equal(rows.length, 1);
});

test("same names with different effects remain behavioral candidates, not exact duplicates", () => {
  const groups = findDuplicateGroups([
    { id: "a", name: "deploy", operation: "release", effects: ["write"], contentDigest: "one" },
    { id: "b", name: "deploy", operation: "release", effects: ["external-write"], contentDigest: "two" }
  ]);
  assert.equal(groups.exact.length, 0);
  assert.equal(groups.candidates.length, 1);
});
```

- [ ] **Step 2: Confirm the tests fail**

Run: `node --test tests/catalog.test.mjs tests/ontology.test.mjs`

- [ ] **Step 3: Implement deterministic normalization and ontology seeds**

Stable fingerprints must normalize Unicode, case, whitespace, and ordered arrays. Exact duplicates require matching normalized capability content digest. Behavioral candidates may use name, operation keywords, and category overlap, but may never auto-merge.

- [ ] **Step 4: Build release-one artifacts twice and compare hashes**

Run: `node scripts/build-catalog.mjs --index C:\Users\Dom\.codex\skills\arsenal-repo-miner\references\skill-index.json --output artifacts/release-one`

Run the command twice.

Expected: identical hashes on unchanged input.

- [ ] **Step 5: Commit normalization and evidence**

```powershell
git add src/catalog.mjs src/ontology.mjs src/clusters.mjs data/ontology.v1.json scripts/build-catalog.mjs tests/catalog.test.mjs tests/ontology.test.mjs artifacts/release-one
git commit -m "feat: derive sovereign capability ontology evidence"
```

### Task 5: Fail-closed evaluation and promotion engine

**Files:**
- Create: `src/evaluate.mjs`
- Create: `src/promote.mjs`
- Create: `policies/promotion.v1.json`
- Create: `tests/evaluate.test.mjs`
- Create: `tests/promote.test.mjs`

**Interfaces:**
- Consumes: evaluation cases `{ id, kind, critical, expected }[]`, candidate results, baseline results, and promotion policy.
- Produces: `evaluateSuite(cases, results) -> Evaluation`, `decidePromotion({ baseline, candidate, policy }) -> PromotionDecision`.

- [ ] **Step 1: Write failing superiority-gate tests**

```js
test("critical regression blocks promotion even when average score rises", () => {
  const policy = { requireAllCritical: true, requireImprovement: true };
  const decision = decidePromotion({
    baseline: { criticalPassed: 4, criticalTotal: 4, score: 0.80, improvements: [] },
    candidate: { criticalPassed: 3, criticalTotal: 4, score: 0.95, improvements: ["score"] },
    policy
  });
  assert.equal(decision.status, "blocked");
});

test("unknown executable baseline cannot produce a superiority claim", () => {
  const policy = { requireAllCritical: true, requireImprovement: true };
  const candidate = { criticalPassed: 1, criticalTotal: 1, score: 1, improvements: ["score"] };
  assert.equal(decidePromotion({ baseline: null, candidate, policy }).status, "unverified");
});
```

- [ ] **Step 2: Confirm focused failure**

Run: `node --test tests/evaluate.test.mjs tests/promote.test.mjs`

- [ ] **Step 3: Implement scoring and promotion state machine**

States: `experimental`, `blocked`, `unverified`, and `promoted`. Promotion requires all critical cases, policy minimums for direct, paraphrase, exclusion, and conflict cases, token budget compliance, no unresolved effect declarations, and improvement in at least one policy-listed dimension.

- [ ] **Step 4: Run evaluation tests**

Run: `node --test tests/evaluate.test.mjs tests/promote.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the promotion engine**

```powershell
git add src/evaluate.mjs src/promote.mjs policies/promotion.v1.json tests/evaluate.test.mjs tests/promote.test.mjs
git commit -m "feat: enforce evidence-based godskill promotion"
```

### Task 6: Promote the Sovereign Skill Refinery refined skill

**Files:**
- Create: `skills/sovereign-skill-refinery/SKILL.md`
- Create: `skills/sovereign-skill-refinery/references/contract-template.json`
- Create: `skills/sovereign-skill-refinery/evals/cases.json`
- Create: `provenance/source-ledger.jsonl`
- Create: `receipts/promotions/sovereign-skill-refinery.json`
- Create: `tests/refinery-skill.test.mjs`

**Interfaces:**
- Consumes: certified source records, capability-contract schema, ontology, promotion engine, and provenance ledger.
- Produces: one refined workflow that maps evidence to neutral contracts, independent implementation, evaluation, and explicit disposition.

- [ ] **Step 1: Write routing, exclusion, and structural tests**

Cases must include direct requests such as “refine these agent skills,” paraphrases such as “turn this workflow quarry into our own tested capability,” exclusions such as routine skill invocation, and conflicts with `arsenal-repo-miner` and `skill-creator`.

- [ ] **Step 2: Run tests and confirm missing skill failure**

Run: `node --test tests/refinery-skill.test.mjs`

- [ ] **Step 3: Author the first-party skill from the approved contract**

The skill must require source inspection, neutral contracts, extraction disposition, independent implementation, baseline comparison, promotion receipt, and cold-by-default placement. It must not copy candidate prose, claim legal clearance, bulk-install outputs, or call itself for ordinary skill usage.

- [ ] **Step 4: Evaluate and write the promotion receipt**

Run: `node scripts/evaluate-skill.mjs --skill skills/sovereign-skill-refinery --policy policies/promotion.v1.json --receipt receipts/promotions/sovereign-skill-refinery.json`

Expected: `promoted` only if all critical tests pass and at least one measured dimension improves over the selected workflow baselines. Otherwise retain `unverified` and do not install.

- [ ] **Step 5: Commit the refined skill and evidence**

```powershell
git add skills/sovereign-skill-refinery provenance/source-ledger.jsonl receipts/promotions/sovereign-skill-refinery.json tests/refinery-skill.test.mjs scripts/evaluate-skill.mjs
git commit -m "feat: promote sovereign skill refinery"
```

### Task 7: Promote Eternities Oracle as the first categorical Godskill

**Files:**
- Create: `skills/eternities-oracle/SKILL.md`
- Create: `skills/eternities-oracle/references/operating-contract.md`
- Create: `skills/eternities-oracle/evals/cases.json`
- Create: `receipts/promotions/eternities-oracle.json`
- Create: `tests/oracle-skill.test.mjs`

**Interfaces:**
- Consumes: `arsenal-repo-miner`, official-source research rules, the sovereign refinery, source hierarchy, and promotion engine.
- Produces: a single categorical Godskill for local repository evidence, live official sources, provenance-aware synthesis, and verified research receipts.

- [ ] **Step 1: Write Godskill routing and composition tests**

Test direct repository-mining missions, unusual paraphrases, local-before-live source order, official-source requirements, license disposition, no third-party execution, and exclusions for simple factual questions or already-installed exact skills.

- [ ] **Step 2: Confirm the Godskill is absent**

Run: `node --test tests/oracle-skill.test.mjs`

- [ ] **Step 3: Implement the Godskill and operating contract**

The Godskill selects the smallest sufficient research path, delegates cold-catalog mining to `arsenal-repo-miner`, uses official sources for current product facts, requires exact source files before synthesis, and returns verified, unverified, rejected, and deferred findings separately.

- [ ] **Step 4: Evaluate against source baselines**

Run: `node scripts/evaluate-skill.mjs --skill skills/eternities-oracle --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-oracle.json`

Expected: `promoted` only when composition and exclusion cases pass with no critical regression.

- [ ] **Step 5: Commit the first Godskill**

```powershell
git add skills/eternities-oracle receipts/promotions/eternities-oracle.json tests/oracle-skill.test.mjs
git commit -m "feat: promote Eternities Oracle godskill"
```

### Task 8: Reversible active profile and fresh-prompt proof

**Files:**
- Create: `src/profile.mjs`
- Create: `scripts/profile.mjs`
- Create: `profiles/eternities-core.lock.json`
- Create: `tests/profile.test.mjs`
- Create during activation: `receipts/profile-eternities-core.json`

**Interfaces:**
- Consumes: promoted receipts and exact skill source directories.
- Produces: `planProfile(lock, destination)`, `activateProfile(plan)`, `removeProfile(receipt)`, and `verifyProfile(receipt, promptText)`.

- [ ] **Step 1: Write collision, idempotence, and rollback tests**

```js
test("profile refuses to overwrite an unrelated destination", () => {
  assert.throws(() => planProfile(lock, occupiedDestination), /collision/);
});

test("profile removal deletes only links recorded by its own receipt", () => {
  const result = removeProfile(receipt, sandbox);
  assert.deepEqual(result.preserved, ["unrelated-skill"]);
});
```

- [ ] **Step 2: Confirm profile tests fail**

Run: `node --test tests/profile.test.mjs`

- [ ] **Step 3: Implement preview, activation, verification, and removal**

Default is preview. `--apply` creates directory links only for artifacts whose promotion receipts say `promoted`. The receipt stores source, destination, prior state, link target, digest, and removal command. Refuse destination paths outside `C:\Users\Dom\.agents\skills` or a project-local `.agents\skills` directory.

- [ ] **Step 4: Preview and activate the core profile**

Run: `node scripts/profile.mjs preview profiles/eternities-core.lock.json`

Expected: two additions, zero overwrite, zero unresolved receipt.

Run: `node scripts/profile.mjs activate profiles/eternities-core.lock.json --apply`

- [ ] **Step 5: Verify fresh Codex discovery and prompt budget**

Run:

```powershell
$rendered = codex debug prompt-input 'say hello' 2>&1 | Out-String
$rendered.Contains('sovereign-skill-refinery')
$rendered.Contains('eternities-oracle')
$rendered.Contains('eternities-pantheon')
```

Expected: refinery `True`, oracle `True`, pantheon `False`. The rendered prompt must not contain the cold index body, vector matrix, source ledger, or all source descriptions.

- [ ] **Step 6: Run full tests and rollback drill**

Run: `npm test`

Run: `node scripts/profile.mjs remove receipts/profile-eternities-core.json --dry-run`

Expected: tests pass; dry-run lists only the two links created by this profile.

- [ ] **Step 7: Commit profile machinery and receipt**

```powershell
git add src/profile.mjs scripts/profile.mjs profiles/eternities-core.lock.json tests/profile.test.mjs receipts/profile-eternities-core.json
git commit -m "feat: activate reversible Eternities core profile"
```

### Task 9: Release-one certification and continuation map

**Files:**
- Create: `receipts/release-one-certification.json`
- Create: `docs/release-one-report.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all task receipts, Git history, test output, cold-index verifier output, profile proof, and unresolved findings.
- Produces: one fail-closed certification plus the measured basis for later Godskill expansion plans.

- [ ] **Step 1: Add an aggregate certification test**

The test requires exact receipt schema versions, all expected GitHub rows, certified index hashes, promoted refinery and Oracle receipts, profile proof, and zero unresolved critical failures.

- [ ] **Step 2: Run the aggregate test and confirm failure before certification exists**

Run: `node --test tests/release-certification.test.mjs`

- [ ] **Step 3: Generate the release report and certification**

Report exact source count, exact and candidate duplicate group counts, ontology family counts, repository ingestion outcomes, promoted/unverified/rejected artifacts, test totals, token sizes, active profile contents, and remaining uncertainty. Do not claim corpus-wide refinement.

- [ ] **Step 4: Run every gate from a clean working tree candidate**

Run:

```powershell
npm test
git diff --check
& 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\scripts\verify-skill-index.ps1' -PythonPath 'C:\Users\Dom\.codex\runtimes\skill-search-eval\Scripts\python.exe'
node scripts/profile.mjs verify receipts/profile-eternities-core.json
```

Expected: all commands succeed and certification status is `certified`.

- [ ] **Step 5: Commit release one**

```powershell
git add README.md docs/release-one-report.md receipts/release-one-certification.json tests/release-certification.test.mjs
git commit -m "chore: certify Eternities Godskills release one"
```

- [ ] **Step 6: Record the next plan boundaries**

Future plans are created separately from measured release-one evidence:

1. bulk contract extraction and cluster review
2. highest-leverage refined engineering skills
3. visual and narrative Godskills
4. memory and context Godskills
5. governance and external-action Godskills
6. Ultragodskill composition and explicit Pantheon
