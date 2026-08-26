# Eternities Godskills Release Two Engineering Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote three independently written categorical Godskills for architecture, implementation, and governed security, expose them through a reversible engineering profile, and certify their routing, composition, provenance, and prompt cost.

**Architecture:** Release two reuses the release-one deterministic evaluation and profile machinery. Each Godskill owns one end-to-end domain decision loop, delegates narrow work to existing installed process skills, yields on routine tasks, and carries a neutral contract plus exact provenance and promotion receipts. A shared composition validator proves that every Godskill has bounded routes, termination conditions, and no recursive self-invocation.

**Tech Stack:** Node.js 24 built-ins, `node:test`, JSON/JSONL, Markdown, Git, and the existing release-one profile and evaluation commands.

**Spec:** `docs/superpowers/specs/2026-08-26-eternities-godskills-design.md`

## Global Constraints

- Canonical repository warehouse: `D:\03-ARSENAL\warehouse`.
- First-party source: `C:\dev\eternities-godskills`.
- Source text remains evidence only; new operational prose is independently written from neutral contracts.
- Do not execute third-party setup, hooks, binaries, installers, scripts, or example commands while mining.
- Every inspected source retains its exact id, path, digest, license class, and disposition.
- Promotion requires every critical case, no critical regression, resolved effects, a measured improvement, and no more than 4,000 estimated entrypoint tokens.
- Godskills must select the smallest sufficient installed workflow, define termination, and never invoke themselves recursively.
- Routine edits, simple lookups, narrow bug fixes, and exact installed-skill matches must bypass the Godskills.
- The cold 4,741-source catalog remains outside ordinary prompts.
- Global activation must be collision-checked, reversible, receipt-owned, and fresh-prompt verified.

---

## File Structure

- `src/composition.mjs` validates categorical Godskill contracts and route selections.
- `tests/composition.test.mjs` proves bounded routes, smallest-set selection, and recursion rejection.
- `skills/eternities-architect/` contains the architecture Godskill, neutral contract, operating contract, and evaluation suite.
- `skills/eternities-forge/` contains the implementation Godskill, neutral contract, operating contract, and evaluation suite.
- `skills/eternities-aegis/` contains the governed security Godskill, neutral contract, operating contract, and evaluation suite.
- `tests/engineering-godskills.test.mjs` validates all three artifacts, evaluations, receipts, and exact provenance.
- `provenance/source-ledger.jsonl` appends source dispositions without changing release-one rows.
- `receipts/promotions/*.json` records each deterministic baseline, candidate, decision, and proof limitation.
- `profiles/eternities-engineering.lock.json` defines the five-skill engineering profile.
- `receipts/profile-eternities-engineering.json` owns only links created by that profile.
- `tests/release-two-certification.test.mjs` reconciles all release-two evidence.
- `receipts/release-two-certification.json` and `docs/release-two-report.md` state the exact certified scope.

### Task 1: Shared Godskill composition contract

**Files:**
- Create: `src/composition.mjs`
- Create: `tests/composition.test.mjs`

**Interfaces:**
- Consumes: a schema-version-one contract with `name`, `routes`, `terminationConditions`, and `explicitOnly`.
- Produces: `validateCompositionContract(value)` and `selectSmallestRoute(routes, requiredCapabilities)`.

- [ ] **Step 1: Write failing validator tests**

Create cases asserting that duplicate route ids, an empty termination list, a route containing its own Godskill name, and an uncovered required capability throw. Assert that the selector chooses one exact route over a broader two-route composition.

- [ ] **Step 2: Run the focused tests and observe the missing-module failure**

Run: `node --test tests/composition.test.mjs`

Expected: failure because `src/composition.mjs` does not exist.

- [ ] **Step 3: Implement the minimal pure functions**

`validateCompositionContract` returns the input after validating non-empty strings and arrays, unique route ids, non-recursion, declared effects, and at least one termination condition. `selectSmallestRoute` filters routes whose capability set covers every requirement, then sorts by capability count and route id.

- [ ] **Step 4: Run focused and full tests**

Run:

```powershell
node --test tests/composition.test.mjs
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit the composition contract**

```powershell
git add src/composition.mjs tests/composition.test.mjs
git commit -m "feat: add bounded Godskill composition contracts"
```

### Task 2: Promote Eternities Architect

**Files:**
- Create: `skills/eternities-architect/SKILL.md`
- Create: `skills/eternities-architect/references/capability-contract.json`
- Create: `skills/eternities-architect/references/operating-contract.md`
- Create: `skills/eternities-architect/evals/cases.json`
- Modify: `provenance/source-ledger.jsonl`
- Create: `receipts/promotions/eternities-architect.json`
- Create: `tests/engineering-godskills.test.mjs`

**Interfaces:**
- Consumes: architecture intent, existing-repository evidence, constraints, options, and acceptance conditions.
- Produces: one evidenced system decision with requirements, interfaces, alternatives, trade-offs, risks, validation, and an implementation handoff.

- [ ] **Step 1: Add failing Architect structure and routing tests**

The suite must cover a new-system design, an existing-system redesign, a consequential ADR, a paraphrased architecture request, exclusion of routine code edits, conflict delegation to `brainstorming` and `writing-plans`, and termination after a decision and handoff exist.

- [ ] **Step 2: Run the focused test and observe missing artifacts**

Run: `node --test tests/engineering-godskills.test.mjs`

Expected: failure because the Architect files do not exist.

- [ ] **Step 3: Write the neutral contract and exact provenance rows**

Use source ids `skill-0aea1470a8fb8c11`, `skill-330342e7e8edc510`, `skill-64376ecfd3fc8025`, and `skill-7030d919fe03611`. Record exact release-one paths and digests. Mark permissive sources `independent-implementation`; preserve any unverified detail as `pattern-reference`.

- [ ] **Step 4: Write the independent Architect workflow**

The entrypoint must distinguish architecture from ideation and implementation, inspect existing reality before redesign, quantify constraints where evidence permits, compare at least two viable options, record rejected alternatives, define interfaces and failure behavior, and stop at an implementation-ready handoff.

- [ ] **Step 5: Evaluate and generate the promotion receipt**

Run:

```powershell
node scripts/evaluate-skill.mjs --skill eternities-architect
node --test tests/engineering-godskills.test.mjs
```

Expected: every critical case passes and the decision is `promoted`.

- [ ] **Step 6: Commit Architect**

```powershell
git add skills/eternities-architect tests/engineering-godskills.test.mjs provenance/source-ledger.jsonl receipts/promotions/eternities-architect.json
git commit -m "feat: promote Eternities Architect godskill"
```

### Task 3: Promote Eternities Forge

**Files:**
- Create: `skills/eternities-forge/SKILL.md`
- Create: `skills/eternities-forge/references/capability-contract.json`
- Create: `skills/eternities-forge/references/operating-contract.md`
- Create: `skills/eternities-forge/evals/cases.json`
- Modify: `tests/engineering-godskills.test.mjs`
- Modify: `provenance/source-ledger.jsonl`
- Create: `receipts/promotions/eternities-forge.json`

**Interfaces:**
- Consumes: an approved outcome, repository state, test surface, risk, and integration boundary.
- Produces: the smallest verified implementation path, routed through installed process skills only when their exact trigger applies.

- [ ] **Step 1: Add failing Forge composition tests**

Cover multi-stage feature implementation, regression repair, refactoring, risky integration, paraphrased development requests, routine-edit exclusion, and conflicts with `writing-plans`, `executing-plans`, `systematic-debugging`, and `finishing-a-development-branch`.

- [ ] **Step 2: Run the focused test and observe missing Forge artifacts**

Run: `node --test tests/engineering-godskills.test.mjs`

Expected: failure naming the absent Forge files.

- [ ] **Step 3: Write the neutral contract and provenance rows**

Use source ids `skill-0106e66a5f004bb6`, `skill-ef1830eb06a36c46`, `skill-b3177aeea9596bb7`, `skill-c5d998749ee6b275`, and `skill-4e367ac15eb8c11`. Preserve all exact source paths and digests.

- [ ] **Step 4: Write the independent Forge workflow**

The workflow must classify the task before selecting process skills, require a failing test where a practical behavior surface exists, isolate risky work, maintain a claim-to-evidence ledger, stop on unmet authority, perform review proportional to risk, and terminate only when acceptance evidence and integration state are explicit.

- [ ] **Step 5: Evaluate and generate the promotion receipt**

Run:

```powershell
node scripts/evaluate-skill.mjs --skill eternities-forge
node --test tests/engineering-godskills.test.mjs
```

Expected: every critical case passes and the decision is `promoted`.

- [ ] **Step 6: Commit Forge**

```powershell
git add skills/eternities-forge tests/engineering-godskills.test.mjs provenance/source-ledger.jsonl receipts/promotions/eternities-forge.json
git commit -m "feat: promote Eternities Forge godskill"
```

### Task 4: Promote Eternities Aegis

**Files:**
- Create: `skills/eternities-aegis/SKILL.md`
- Create: `skills/eternities-aegis/references/capability-contract.json`
- Create: `skills/eternities-aegis/references/operating-contract.md`
- Create: `skills/eternities-aegis/evals/cases.json`
- Modify: `tests/engineering-godskills.test.mjs`
- Modify: `provenance/source-ledger.jsonl`
- Create: `receipts/promotions/eternities-aegis.json`

**Interfaces:**
- Consumes: an authorized target, assets, trust boundaries, intended effects, attacker or failure hypotheses, and available evidence.
- Produces: a severity-ranked, evidence-linked risk model and the smallest verified mitigation plan without performing unauthorized offensive or external actions.

- [ ] **Step 1: Add failing Aegis authorization and audit tests**

Cover source-code security audit, architecture threat model, MCP configuration review, external-write authority review, paraphrased requests, exclusion of ordinary code review, refusal of unauthorized intrusion, and delegation to an exact platform security skill.

- [ ] **Step 2: Run the focused test and observe missing Aegis artifacts**

Run: `node --test tests/engineering-godskills.test.mjs`

Expected: failure naming the absent Aegis files.

- [ ] **Step 3: Write the neutral contract and provenance rows**

Use source ids `skill-72cad70c3765e1c2`, `skill-6a5af032f4ae778f`, `skill-81bf77b4de7d5da3`, and `skill-e2c045990c37a6b5`. Preserve exact paths and digests and keep all operations read-only unless separately authorized.

- [ ] **Step 4: Write the independent Aegis workflow**

The workflow must establish authorization and scope first, inventory assets and trust boundaries, distinguish verified findings from hypotheses, rank exploitability and impact separately, avoid secret disclosure, define reproducible mitigation verification, and stop before external mutation unless the user grants that exact authority.

- [ ] **Step 5: Evaluate and generate the promotion receipt**

Run:

```powershell
node scripts/evaluate-skill.mjs --skill eternities-aegis
node --test tests/engineering-godskills.test.mjs
```

Expected: every critical case passes and the decision is `promoted`.

- [ ] **Step 6: Commit Aegis**

```powershell
git add skills/eternities-aegis tests/engineering-godskills.test.mjs provenance/source-ledger.jsonl receipts/promotions/eternities-aegis.json
git commit -m "feat: promote Eternities Aegis godskill"
```

### Task 5: Reversible Eternities engineering profile

**Files:**
- Create: `profiles/eternities-engineering.lock.json`
- Create: `receipts/profile-eternities-engineering.json`
- Modify: `tests/profile.test.mjs`

**Interfaces:**
- Consumes: five promoted receipts for Oracle, Refinery, Architect, Forge, and Aegis.
- Produces: exact global junctions owned by one profile receipt and a rollback plan that never removes unrelated skills.

- [ ] **Step 1: Add a failing five-skill profile test**

Assert exact names, promoted receipts, collision refusal, idempotent preview, canonical line-ending digests, and rollback ownership.

- [ ] **Step 2: Create the lock and preview it**

Run: `node scripts/profile.mjs preview profiles/eternities-engineering.lock.json`

Expected: three additions and two exact existing links, with no collision.

- [ ] **Step 3: Activate and verify the profile**

Run:

```powershell
node scripts/profile.mjs activate profiles/eternities-engineering.lock.json --apply
node scripts/profile.mjs verify receipts/profile-eternities-engineering.json
```

Expected: all five names are present, target the isolated checkout during certification, and the cold catalog is absent.

- [ ] **Step 4: Commit the profile**

```powershell
git add profiles/eternities-engineering.lock.json receipts/profile-eternities-engineering.json tests/profile.test.mjs
git commit -m "feat: activate Eternities engineering profile"
```

### Task 6: Release-two certification, review, and integration

**Files:**
- Create: `tests/release-two-certification.test.mjs`
- Create: `receipts/release-two-certification.json`
- Create: `docs/release-two-report.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: all three promotion receipts, exact provenance rows, profile receipt, prompt proof, and full test output.
- Produces: a fail-closed release-two verdict and the measured continuation boundary for memory, visual, narrative, and Ultragodskill releases.

- [ ] **Step 1: Add the failing aggregate certification test**

Require three promoted decisions, no critical failures, exact source counts and digests, five active profile names, composition recursion rejection, cold-payload absence, and explicit remaining uncertainty.

- [ ] **Step 2: Generate the report and certification**

State the exact promoted count, evaluation totals, token sizes, profile contents, proof limits, and what remains cold. Do not claim completion of the full Pantheon.

- [ ] **Step 3: Run every final gate**

Run:

```powershell
npm test
git diff --check
node scripts/profile.mjs verify receipts/profile-eternities-engineering.json
& 'C:\Users\Dom\.codex\skills\arsenal-repo-miner\scripts\verify-skill-index.ps1' -PythonPath 'C:\Users\Dom\.codex\runtimes\skill-search-eval\Scripts\python.exe'
```

Expected: every command succeeds with zero test failures.

- [ ] **Step 4: Commit certification**

```powershell
git add README.md docs/release-two-report.md receipts/release-two-certification.json tests/release-two-certification.test.mjs
git commit -m "chore: certify Eternities Godskills release two"
```

- [ ] **Step 5: Review and integrate**

Review the complete branch diff against this plan, repair every critical or important finding, rerun all gates, migrate profile junctions from the worktree to merged `main`, fast-forward `main`, verify exact destination hashes, remove the worktree, and delete the merged feature branch.
