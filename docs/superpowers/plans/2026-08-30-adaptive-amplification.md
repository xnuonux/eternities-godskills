# Adaptive Amplification Protocol v1 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate capability selection from evidence-bound activation so a strong raw agent remains the floor and full Godskill method enters context only when it has earned that intervention.

**Architecture:** Add a deterministic activation compiler and exact reviewed evidence registry to `eternities-godskills`, then add an optional package-shaping adapter path to `eternities-godagents`. The adapter accepts host task classification but compiles activation locally against the exact pinned policy and evidence trust root. Preserve all System v3 and adapter-v1 certificates. Apply a compact equivalent policy to global Codex skill routing only after repository tests pass.

**Tech Stack:** Node.js 24 ESM, `node:test`, canonical JSON and SHA-256 receipts, existing Godskills router and Godagents adapter contracts.

**Spec:** `docs/superpowers/specs/2026-08-30-adaptive-amplification-design.md`

## Global Constraints

- Preserve the certified Godskills System v3 artifacts and the Godagents adapter-v1 default behavior.
- Treat `C:\dev\eternities-oneshots` commit `265d40d121463de5f3b6215bf513db851ccb8f3b` as reviewed development evidence only.
- Never load a selected entrypoint before an activation decision permits it.
- Never claim a deferred review was executed.
- Activation cannot expand authority, effects, risk, preconditions, context, or composition.
- Full method eligibility requires explicit user intent or matched evidence meeting the policy threshold.
- Keep raw transcripts and third-party source bodies out of activation artifacts.

---

### Task 1: Exact evidence registry and neutral contract

**Files:**
- Create: `artifacts/adaptive-activation/neutral-contract.json`
- Create: `artifacts/adaptive-activation/evidence.v1.json`
- Create: `policies/adaptive-activation.v1.json`
- Create: `tests/adaptive-activation.test.mjs`

**Interfaces:**
- Consumes: exact one-shot commit and SHA-256 values from the reviewed archive.
- Produces: `policy`, `profiles`, and source digest records consumed by `compileActivationDecision`.

- [ ] **Step 1: Write failing evidence tests**

Assert exact source commit, exact verdict and manifest digests, four matched visual preferences, one Muse win, three raw wins, zero automatic adoption, and no raw transcript body.

- [ ] **Step 2: Run the focused test and observe missing artifacts**

Run: `node --test tests/adaptive-activation.test.mjs`

Expected: failure because the policy and evidence registry do not exist.

- [ ] **Step 3: Add the neutral contract, policy, and reviewed registry**

The policy must define these exact modes and thresholds:

```json
{
  "modes": ["native", "guardrail", "method", "review"],
  "methodEvidence": {
    "minimumMatchedEvaluations": 3,
    "minimumWins": 2,
    "minimumWinRate": 0.6666666666666666,
    "maximumCriticalRegressions": 0,
    "maximumOverheadRatio": 1.35
  }
}
```

The Muse profile must declare `methodEligible: false`, `review` as its preferred creative-generation mode, and exact evidence digests.

- [ ] **Step 4: Run the focused evidence tests**

Run: `node --test tests/adaptive-activation.test.mjs`

Expected: evidence assertions pass while compiler tests still fail because the compiler export is absent.

- [ ] **Step 5: Commit**

```powershell
git add artifacts/adaptive-activation policies/adaptive-activation.v1.json tests/adaptive-activation.test.mjs
git commit -m "test: freeze adaptive activation evidence"
```

### Task 2: Deterministic activation compiler

**Files:**
- Create: `src/adaptive-activation.mjs`
- Modify: `tests/adaptive-activation.test.mjs`
- Create: `runtime/adaptive-amplification.md`

**Interfaces:**
- Consumes: `compileActivationDecision({ selectedId, task, explicitMethodRequest, reviewAvailable, profile, policy })`.
- Produces: a frozen decision containing `mode`, `reasonCodes`, `preInferenceDisclosure`, `deferredReview`, `policyDigest`, and `evidenceDigest`.

- [ ] **Step 1: Add failing behavior tests**

Cover:

```js
assert.equal(museCreativeWithReview.mode, 'review');
assert.equal(museCreativeWithReview.preInferenceDisclosure, 'none');
assert.equal(museConsequentialWithoutReview.mode, 'guardrail');
assert.equal(museLowConsequenceWithoutReview.mode, 'native');
assert.equal(replicatedPositiveEvidence.mode, 'method');
assert.equal(explicitRequest.mode, 'method');
assert.throws(() => compileActivationDecision({ profile: staleProfile }), /digest|stale/i);
```

- [ ] **Step 2: Run the focused tests and observe missing behavior**

Run: `node --test tests/adaptive-activation.test.mjs`

Expected: failure because `src/adaptive-activation.mjs` is absent.

- [ ] **Step 3: Implement the smallest deterministic compiler**

Validate closed enums and exact digests, derive evidence totals without trusting a profile's `methodEligible` claim, and prefer the least intrusive mode that satisfies consequence and review availability. Return reason codes rather than prose-only judgment.

- [ ] **Step 4: Add runtime documentation**

Document that selection answers relevance while activation answers timing and disclosure. State that `review` requires a real second phase and cannot silently collapse into full pre-inference injection.

- [ ] **Step 5: Run focused and existing routing tests**

Run:

```powershell
node --test tests/adaptive-activation.test.mjs tests/mission-skill-stack.test.mjs tests/router.test.mjs
```

Expected: all pass.

- [ ] **Step 6: Commit**

```powershell
git add src/adaptive-activation.mjs runtime/adaptive-amplification.md tests/adaptive-activation.test.mjs
git commit -m "feat: compile evidence-bound skill activation"
```

### Task 3: Reproducible activation receipt

**Files:**
- Create: `scripts/build-adaptive-activation-receipt.mjs`
- Create: `receipts/adaptive-activation-v1.json`
- Modify: `package.json`
- Modify: `tests/adaptive-activation.test.mjs`

**Interfaces:**
- Consumes: exact policy, evidence, compiler, contract, and test fixture bytes.
- Produces: canonical `adaptive-activation-v1` receipt with current Muse disposition and proof limits.

- [ ] **Step 1: Add a failing byte-rebuild test**

Require the checked receipt to rebuild byte-for-byte and report Muse as `review`, never `method` or `promoted`.

- [ ] **Step 2: Run the focused test and observe the missing builder**

Run: `node --test tests/adaptive-activation.test.mjs`

- [ ] **Step 3: Implement the deterministic builder and package script**

Add `npm run build:adaptive-activation`. The receipt must include exact input digests, decision outputs, disclosure bytes, failed method gates, and the proof limit `model-quality-on-unseen-missions`.

- [ ] **Step 4: Build twice and compare exact bytes**

Run the builder twice and compare SHA-256. Expected: identical receipt bytes.

- [ ] **Step 5: Run focused tests and commit**

```powershell
node --test tests/adaptive-activation.test.mjs
git add package.json scripts/build-adaptive-activation-receipt.mjs receipts/adaptive-activation-v1.json tests/adaptive-activation.test.mjs
git commit -m "test: certify adaptive activation decisions"
```

### Task 4: Optional Godagents adaptive package shaping

**Files:**
- Create: `C:\dev\eternities-godagents\src\skills\activation-resolver.mjs`
- Create: `C:\dev\eternities-godagents\tests\godskills-adaptive-activation.test.mjs`
- Modify: `C:\dev\eternities-godagents\src\skills\mission-binder.mjs`
- Modify: `C:\dev\eternities-godagents\README.md`

**Interfaces:**
- Consumes: an optional frozen activation classifier supplied to `createGodskillsAdapter`. It carries the exact pinned policy and evidence digests and may return only task class, consequence, and real review availability.
- Produces: a first-attempt cortex package with per-capability activation, exact disclosure accounting, and digest-bound deferred review descriptors.

- [ ] **Step 1: Write failing filesystem-spy tests**

Require:

- `native`: no selected entrypoint or contract read;
- `guardrail`: contract read only, no entrypoint read;
- `method`: contract and entrypoint read;
- `review`: neither selected artifact read before inference, plus one deferred descriptor;
- omitted classifier: byte-compatible current method behavior.

- [ ] **Step 2: Run the focused test and observe current unconditional reads**

Run: `node --test tests/godskills-adaptive-activation.test.mjs`

Expected: native, guardrail, and review cases fail because the current binder always opens both files.

- [ ] **Step 3: Implement activation before artifact reads**

Split metadata selection from artifact disclosure. Compile modes inside the adapter rather than accepting a mode-bearing resolver. Guardrail packages may contain only sorted contract-derived success, failure, effect, and termination constraints. Review descriptors contain ids and certified digests, no bodies. Include activation decisions in `stackDigest` and `packageDigest`.

- [ ] **Step 4: Preserve legacy defaults and recovery**

Without a classifier, produce the existing method package. Rehydration must recompile the stored activation context and reject a changed policy, evidence registry, explicit-method intent, authority projection, decision, or package.

- [ ] **Step 5: Run focused and v1 regression suites**

Run:

```powershell
node --test tests/godskills-adaptive-activation.test.mjs tests/godskills-mission-binder.test.mjs tests/godskills-runtime-order.test.mjs tests/godskills-adapter.test.mjs
```

Expected: all pass.

- [ ] **Step 6: Commit in Godagents**

```powershell
git add src/skills/activation-resolver.mjs src/skills/mission-binder.mjs tests/godskills-adaptive-activation.test.mjs README.md
git commit -m "feat: shape Godskill context by activation mode"
```

### Task 5: Global Codex adaptive routing rule

**Files:**
- Modify: `C:\Users\Dom\.codex\AGENTS.md`
- Create: `tests/codex-routing-policy.test.mjs`

**Interfaces:**
- Consumes: the compact adaptive activation doctrine.
- Produces: one globally discoverable rule that preserves deterministic skill matching but prevents unconditional full-body injection.

- [ ] **Step 1: Write a structural policy test**

Assert the global rule contains the four modes, raw-floor language, creative raw-first behavior, explicit-method override, authority preservation, and no always-on invocation wording.

- [ ] **Step 2: Run the test and observe failure against current instructions**

Run: `node --test tests/codex-routing-policy.test.mjs`

- [ ] **Step 3: Patch only the skill-routing section**

Add compact mode-selection language after deterministic task-shape routing. Do not expand routine-turn skill usage, reintroduce `using-superpowers`, or alter keel behavior.

- [ ] **Step 4: Run the structural policy and Godskills tests**

Run: `node --test tests/codex-routing-policy.test.mjs tests/adaptive-activation.test.mjs`

- [ ] **Step 5: Commit the repository-owned policy test**

```powershell
git add tests/codex-routing-policy.test.mjs
git commit -m "test: enforce adaptive Codex skill routing"
```

The global `AGENTS.md` file is outside the repository and is verified by exact structural tests rather than committed here.

### Task 6: Verification, independent review, and release disposition

**Files:**
- Create: `docs/adaptive-amplification-report.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: both repository diffs, focused test output, full test output, receipt rebuild, and one fresh Codex routing probe.
- Produces: an honest experimental disposition and next matched field-trial gate.

- [ ] **Step 1: Run full Godskills verification**

Run: `npm test`

Expected: zero failures without regenerating historical receipts.

- [ ] **Step 2: Run full Godagents verification**

Run: `npm test`

Expected: zero failures and unchanged v1 integration receipts.

- [ ] **Step 3: Run a fresh routing probe**

Use one fresh Terra subject with only the global instructions and a new creative mission. Inspect its reported skill activation before artifact work. Pass condition: it does not preload a full visual Godskill solely because the mission is visual.

- [ ] **Step 4: Obtain one independent code review**

Review evidence thresholds, fail-closed digest handling, body-read spies, recovery stability, authority preservation, and proof language. Resolve critical and important findings.

- [ ] **Step 5: Write the report and README section**

State exact tests, decisions, evidence limits, and that Muse remains experimental. Define the next meaningful evaluation as a fresh matched A/B mission set comparing adaptive against raw, not adaptive against the already-losing full-injection candidate.

- [ ] **Step 6: Final verification and commits**

Run `git diff --check`, both full suites, receipt rebuild, and `git status --short --branch`. Commit report and README updates separately after all evidence is current.
