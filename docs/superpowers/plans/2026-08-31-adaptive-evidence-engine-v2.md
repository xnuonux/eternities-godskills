# Adaptive Evidence Engine v2 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and certify a digest-bound adaptive evidence engine that records shadow decisions, preregisters causal trials, derives identity-qualified activation profiles, and governs promotion or demotion without allowing fixtures, stale evidence, or a capability to certify itself.

**Architecture:** Three pure Node.js modules own contracts, trials, and ledger lifecycle behavior. A deterministic builder emits closed schemas and checked fixture evidence, while one preregistered five-condition Aegis matrix supplies fresh model-level observations for raw, guardrail, method, reviewer, and combined interventions. Activation v1 and the phase-1 capability bundles remain unchanged and available as rollback boundaries.

**Tech Stack:** Node.js 24, native `node:test`, SHA-256 canonical JSON, existing phase-1 capability-layer manifests, Git worktrees, sequential `gpt-5.6-terra` trial subjects

**Spec:** `docs/superpowers/specs/2026-08-30-godskills-evolution-arc-design.md`

## Global Constraints

- Implement phase 2 only. Typed composition, `.godskill` packaging, protocol transport, provider adapters, Godagents runtime changes, and Lunari integration remain outside this branch.
- Preserve `src/adaptive-activation.mjs`, `policies/adaptive-activation.v1.json`, `receipts/adaptive-activation-v1.json`, every existing `skills/*/SKILL.md`, and all phase-1 checked outputs byte-for-byte.
- Build from certified phase-1 commit `51bec80ef6fc18d761d13094de2d4ee6aef8c549` on branch `feat/adaptive-evidence-v2`.
- Use no new runtime dependency. Validation, canonicalization, hashing, ledger verification, and schema generation stay in native Node.js.
- Key every activation profile by capability ID, task class, model family, reasoning tier, consequence class, capability version, and evaluation environment identity.
- Bind policy, task definition, comparison policy, capability bundle, model profile, environment, artifacts, observations, and parent rows by exact digest.
- Keep raw mission text and proprietary artifact bodies out of aggregate receipts. Store references, byte counts, metrics, verdicts, and digests by default.
- Structural and fixture evidence cannot promote a model behavior. Historical evidence without v2 preregistration remains visible but ineligible.
- Selection, activation, evidence, lifecycle decisions, protocol-shaped records, and capability layers never grant or expand authority.
- A model or capability may propose evidence but cannot review, verify, promote, or demote its own profile.
- Preserve failed trials and demotions as append-only evidence. Invalidation changes eligibility, not history.
- Use at most one Terra trial subject concurrently. Every trial subject starts fresh, receives no filesystem or network task, and sees only the pinned mission plus the exact layer body authorized for its condition.
- A real trial may prove only its exact model, task, effort, capability version, policy, comparison policy, and environment. It cannot establish universal superiority.
- Do not push, merge, install globally, or change default activation on this branch.

## File Map

- Create `policies/adaptive-evidence.v2.json`: trusted trial, evidence-level, profile, lifecycle, and threshold policy.
- Create `src/adaptive-evidence-contracts.mjs`: canonical identity, closed-record validation, trusted policy validation, profile keys, and schema generation.
- Create `src/adaptive-evidence-trials.mjs`: activation v2, body-free shadow decisions, preregistration, trial verification, and observation proposals.
- Create `src/adaptive-evidence-ledger.mjs`: append-only chain verification, profile derivation, freshness evaluation, and lifecycle receipts.
- Create `tests/adaptive-evidence-v2.test.mjs`: focused red-green coverage for every phase-2 boundary.
- Create `scripts/build-adaptive-evidence-v2.mjs`: deterministic repository input loading and transactional checked-output emission.
- Create `schemas/adaptive-evidence-v2/*.schema.json`: closed schemas for shadow decisions, trials, evidence rows, profiles, and lifecycle receipts.
- Create `artifacts/adaptive-evidence-v2/*.json`: deterministic fixture, historical bridge, derived profile, and lifecycle examples.
- Create `evidence/adaptive-evidence-v2/aegis-matrix/*.json`: preregistered real-trial contract, raw model artifacts, verifier observations, ledger, and derived profile.
- Create `receipts/adaptive-evidence-v2.json`: aggregate input, output, trial, invariant, and proof-limit receipt.
- Create `runtime/adaptive-evidence-v2.md`: host sequence, authority boundary, retention, replay, fallback, and rollback contract.
- Create `docs/adaptive-evidence-v2-report.md`: observed variant metrics and exact proof level without a universal claim.
- Create `docs/adaptive-evidence-v2-certification.md`: independently reviewed phase-2 disposition and phase-3 entry boundary.
- Modify `package.json`: add only `build:adaptive-evidence-v2`.

---

### Task 1: Freeze the trusted policy and identity contracts

**Files:**
- Create: `policies/adaptive-evidence.v2.json`
- Create: `src/adaptive-evidence-contracts.mjs`
- Create: `tests/adaptive-evidence-v2.test.mjs`

**Interfaces:**
- Consumes: caller-supplied policy bytes and an independently trusted expected policy digest.
- Produces: `canonicalJson(value)`, `canonicalDigest(value)`, `validateAdaptiveEvidencePolicy({ policy, expectedPolicyDigest })`, `compileProfileIdentity(input)`, `profileKey(identity)`, `sameProfileIdentity(left, right)`, and `buildAdaptiveEvidenceSchemas()`.

- [ ] **Step 1: Write the failing policy and profile-identity tests**

Require the exact v2 policy identity, ordered trial variants, evidence levels, profile-key fields, promotion thresholds, lifecycle grants, and no-authority flags. Require profile identity to contain these exact keys:

```js
const identity = {
  capabilityId: "eternities-aegis",
  taskClass: "security-review",
  modelFamily: "gpt-5.6-terra",
  reasoningTier: "high",
  consequenceClass: "consequential",
  capabilityVersion: aegisManifest.bundleDigest,
  environmentId: environmentDigest,
};
```

Assert that a changed field changes the profile key, missing or extra fields fail closed, duplicate policy values fail, fixture evidence is non-promotable, and a self-consistent altered policy fails against the external expected digest.

- [ ] **Step 2: Run the focused test and witness the missing-contract failure**

Run:

```powershell
node --test tests/adaptive-evidence-v2.test.mjs
```

Expected: failure identifies the absent policy or contracts module.

- [ ] **Step 3: Add the exact policy**

The policy must encode:

```json
{
  "schemaVersion": 2,
  "id": "adaptive-evidence-policy-v2",
  "trialVariants": ["raw", "guardrail", "method", "reviewer", "combined"],
  "profileKeyFields": [
    "capabilityId",
    "taskClass",
    "modelFamily",
    "reasoningTier",
    "consequenceClass",
    "capabilityVersion",
    "environmentId"
  ],
  "evidenceLevels": [
    "structural",
    "fixture",
    "artifact",
    "model",
    "cross-model",
    "field",
    "universal"
  ],
  "promotableEvidenceLevels": ["model", "cross-model", "field", "universal"],
  "methodPromotion": {
    "minimumMatchedComparisons": 3,
    "minimumWins": 2,
    "minimumWinRate": 0.6666666666666666,
    "maximumCriticalRegressions": 0,
    "maximumOverheadRatio": 1.35
  },
  "lifecycleGrants": {
    "promote": "adaptive-evidence:promote",
    "demote": "adaptive-evidence:demote",
    "quarantine": "adaptive-evidence:quarantine",
    "invalidate": "adaptive-evidence:invalidate"
  },
  "fixtureEvidenceCanPromote": false,
  "historicalEvidenceCanPromote": false,
  "selfReviewAllowed": false,
  "selfPromotionAllowed": false,
  "authorityExpanded": false
}
```

- [ ] **Step 4: Implement canonical policy and profile contracts**

Use recursively sorted object keys, preserve array order, reject unknown keys, reject unsafe or empty identities, and freeze returned values. Policy validation must compare `canonicalDigest(policy)` to `expectedPolicyDigest`; the policy cannot establish its own trust root.

`profileKey(identity)` must return `sha256(canonicalJson(identity))`. `sameProfileIdentity` must compare canonical bytes, not partial labels.

- [ ] **Step 5: Generate closed schema objects in memory**

`buildAdaptiveEvidenceSchemas()` must return exactly five draft 2020-12 schemas named:

```text
shadow-decision.schema.json
trial-envelope.schema.json
evidence-row.schema.json
profile.schema.json
lifecycle-decision.schema.json
```

Every object and nested record uses `additionalProperties: false`, exact required fields, fixed `schemaVersion: 2`, enumerated status values, and 64-character lowercase SHA-256 patterns for identities.

- [ ] **Step 6: Run the focused tests and commit the contract boundary**

```powershell
node --test tests/adaptive-evidence-v2.test.mjs
git add policies/adaptive-evidence.v2.json src/adaptive-evidence-contracts.mjs tests/adaptive-evidence-v2.test.mjs
git commit -m "feat: define adaptive evidence v2 contracts"
```

---

### Task 2: Add activation v2, body-free shadowing, and preregistered trials

**Files:**
- Create: `src/adaptive-evidence-trials.mjs`
- Modify: `tests/adaptive-evidence-v2.test.mjs`

**Interfaces:**
- Consumes: a verified phase-1 manifest digest, trusted v2 policy, exact profile identity, optional derived profile, pinned task definition, comparison policy, artifact boundary, and reviewer or verifier identity.
- Produces: `compileActivationDecisionV2(input)`, `compileShadowDecision(input)`, `preregisterTrial(input)`, `verifyTrialEnvelope(input)`, `createObservationProposal(input)`, and `importHistoricalEvidence(input)`.

- [ ] **Step 1: Write failing activation and shadow tests**

Cover these decisions:

```text
explicit exact-method request -> method
fresh authorized method profile -> method
fresh review profile plus real review availability -> review
stale or mismatched profile plus consequential task -> guardrail
stale or mismatched profile plus low-consequence task -> native
uncertain profile -> never method
```

Assert that every decision carries the complete profile identity, policy digest, profile digest or `null`, unchanged authority projection, `authorityExpanded: false`, exact reason codes, and a recomputable decision digest.

For shadow mode, assert:

```js
assert.deepEqual(shadow.disclosedLayerBodies, []);
assert.equal(shadow.nativeAttemptRequired, true);
assert.equal(shadow.predictedDecisionDigest, activation.decisionDigest);
assert.equal(shadow.artifactDigest, null);
```

- [ ] **Step 2: Write failing preregistration tests**

Require a trial to bind:

```js
{
  trialId,
  profileIdentity,
  capabilityManifestDigest,
  policyDigest,
  taskDefinition: { id, version, digest },
  comparisonPolicy: { id, version, digest, baseline: "raw", variants, metrics, stopConditions },
  artifactBoundary: { mediaType, required: true },
  evaluator: { kind: "reviewer" | "deterministic-verifier", id, digest },
  variants: ["raw", "guardrail", "method", "reviewer", "combined"]
}
```

Reject missing artifact boundaries, retrospective registration, duplicate variants, an absent evaluator, evaluator identity equal to the capability or producer, unsupported evidence levels, changed task or comparison digests, unknown keys, and trial path data.

- [ ] **Step 3: Run the focused tests and witness the missing trial module**

Run `node --test tests/adaptive-evidence-v2.test.mjs` and retain the expected failing output in the development log.

- [ ] **Step 4: Implement model-qualified activation v2**

Activation v2 preserves the four runtime modes `native`, `guardrail`, `method`, and `review`. `combined` exists only as a causal trial condition meaning method construction followed by post-artifact reviewer refinement.

The compiler must validate freshness before reading profile recommendations. Explicit exact-method intent may select method without a profile but never alters authority. A profile may select method only when its lifecycle state is `promoted`, its recommended mode is `method`, every identity matches, and its evidence digest remains valid.

- [ ] **Step 5: Implement shadow and trial records**

`compileShadowDecision` records what activation v2 predicted but carries no selected body bytes and requires the host to construct an uninfluenced native artifact first.

`preregisterTrial` computes task and comparison digests from their complete bodies, requires the five canonical conditions for the certification fixture, and returns an immutable trial envelope with status `preregistered` and `trialDigest` over the unsigned body.

`verifyTrialEnvelope` must reject any body or digest mutation. `createObservationProposal` accepts only a preregistered trial, one exact variant, a digest-bound artifact, evaluator observation, measured costs or explicit `null` metrics, proof level, and producer identity. It produces an inert proposal, never an admitted ledger row.

- [ ] **Step 6: Implement the historical bridge**

`importHistoricalEvidence` must preserve the exact source receipt digest, source commit, artifact hashes, observed raw and candidate outcomes, and proof limits from `artifacts/adaptive-activation/evidence.v1.json`. Its output status is always `historical-ineligible`; missing v2 preregistration, exact environment identity, and isolated variant coverage appear as explicit reason codes. It cannot call `preregisterTrial` or produce a promotable row.

- [ ] **Step 7: Run tests and commit the trial boundary**

```powershell
node --test tests/adaptive-evidence-v2.test.mjs tests/adaptive-activation.test.mjs tests/capability-layer-abi.test.mjs
git add src/adaptive-evidence-trials.mjs tests/adaptive-evidence-v2.test.mjs
git commit -m "feat: preregister adaptive activation trials"
```

---

### Task 3: Build the append-only ledger, derived profiles, and lifecycle controller

**Files:**
- Create: `src/adaptive-evidence-ledger.mjs`
- Modify: `tests/adaptive-evidence-v2.test.mjs`

**Interfaces:**
- Consumes: verified preregistration envelopes, inert observation proposals, an existing ledger, trusted policy, current identities, and explicit lifecycle authorization.
- Produces: `createEvidenceLedger(input)`, `appendEvidenceRow(input)`, `verifyEvidenceLedger(input)`, `deriveActivationProfile(input)`, `evaluateProfileFreshness(input)`, and `compileLifecycleDecision(input)`.

- [ ] **Step 1: Write failing append-only ledger tests**

The genesis ledger must bind policy and trial digest and start at sequence zero. Every admitted row must include `sequence`, `previousRowDigest`, `proposalDigest`, `trialDigest`, `profileKey`, `variant`, `artifactDigest`, `observationDigest`, `outcomeAgainstRaw`, `criticalRegression`, `cost`, `proofLevel`, `producerId`, `evaluatorId`, and `rowDigest`.

Reject duplicate proposal or artifact identities, missing sequence numbers, changed parents, cross-trial rows, profile mismatch, evaluator self-review, observation-before-artifact, variant mismatch, invalid cost values, and mutation anywhere in the chain.

- [ ] **Step 2: Write failing causal-profile tests**

Build a fixture ledger with one raw baseline and one row for each intervention. Assert separate metrics for `guardrail`, `method`, `reviewer`, and `combined`; no stack result may be copied into another variant. Record wins, losses, ties, critical regressions, overhead ratios, evidence levels, and exact row digests.

Fixture rows may derive a profile but must produce:

```js
{
  lifecycleState: "ineligible",
  recommendedMode: "native",
  promotableEvidenceRows: 0,
  failedGates: ["promotable-evidence-level"]
}
```

- [ ] **Step 3: Write failing freshness and lifecycle tests**

Change each identity field independently and require deterministic invalidation. Also change policy, task definition, comparison policy, capability manifest, or material environment digest and require a new lineage.

Promotion must require the exact action grant, an actor distinct from producer and evaluator, enough matched model-level comparisons, zero critical regressions, acceptable overhead, and a current profile. Demotion, quarantine, and invalidation must create new receipts while retaining all source rows. A critical regression prevents method promotion even when wins and overhead pass.

- [ ] **Step 4: Run the tests and retain the expected missing-ledger failure**

Run `node --test tests/adaptive-evidence-v2.test.mjs`.

- [ ] **Step 5: Implement chain admission and verification**

`appendEvidenceRow` must verify the complete existing chain before adding one row. It assigns the next sequence and parent digest itself, verifies the referenced trial and proposal, copies no artifact body, computes the row digest, and returns a new deeply frozen ledger.

`verifyEvidenceLedger` must replay from genesis, recompute every digest, enforce one trial and profile lineage, reject unknown fields, and return counts by variant and proof level.

- [ ] **Step 6: Implement profile derivation and freshness**

Derive rather than mutate profiles. Aggregate only exact-key rows. Keep nonmatching rows as excluded evidence with reason codes. Evidence below a promotable level remains visible but cannot satisfy a promotion count. Compare every intervention only against its declared raw baseline.

`evaluateProfileFreshness` compares the complete bound identity set and returns `{ current, mismatches }`. It never edits or deletes the profile.

- [ ] **Step 7: Implement governed lifecycle receipts**

`compileLifecycleDecision` returns a digest-bound receipt for `promote`, `demote`, `quarantine`, or `invalidate`. Valid but unqualified promotion requests return status `rejected` with exact failed gates. Malformed receipts, missing authority, self-promotion, identity mismatch, or forged profile digests throw.

Applied decisions include prior mode, next mode, action, actor, authorization digest, profile digest, evidence digest, reason codes, and `authorityExpanded: false`. No receipt changes the evidence ledger.

- [ ] **Step 8: Run tests and commit the evidence lifecycle**

```powershell
node --test tests/adaptive-evidence-v2.test.mjs tests/adaptive-activation.test.mjs
git add src/adaptive-evidence-ledger.mjs tests/adaptive-evidence-v2.test.mjs
git commit -m "feat: derive governed adaptive evidence profiles"
```

---

### Task 4: Emit deterministic schemas, fixtures, historical evidence, and aggregate receipt

**Files:**
- Create: `scripts/build-adaptive-evidence-v2.mjs`
- Create: `schemas/adaptive-evidence-v2/shadow-decision.schema.json`
- Create: `schemas/adaptive-evidence-v2/trial-envelope.schema.json`
- Create: `schemas/adaptive-evidence-v2/evidence-row.schema.json`
- Create: `schemas/adaptive-evidence-v2/profile.schema.json`
- Create: `schemas/adaptive-evidence-v2/lifecycle-decision.schema.json`
- Create: `artifacts/adaptive-evidence-v2/shadow-muse.v2.json`
- Create: `artifacts/adaptive-evidence-v2/fixture-trial.v2.json`
- Create: `artifacts/adaptive-evidence-v2/fixture-ledger.v2.json`
- Create: `artifacts/adaptive-evidence-v2/fixture-profile.v2.json`
- Create: `artifacts/adaptive-evidence-v2/fixture-lifecycle.v2.json`
- Create: `artifacts/adaptive-evidence-v2/historical-muse-bridge.v2.json`
- Create: `receipts/adaptive-evidence-v2.json`
- Create: `docs/adaptive-evidence-v2-report.md`
- Modify: `package.json`
- Modify: `tests/adaptive-evidence-v2.test.mjs`

**Interfaces:**
- Consumes: policy bytes, three phase-1 canary manifests, phase-1 certification, v1 adaptive evidence, the three new source modules, and exact checked trial evidence when present.
- Produces: `rebuildAdaptiveEvidenceV2({ root })`, `writeAdaptiveEvidenceV2({ root })`, deterministic checked outputs, and one aggregate receipt.

- [ ] **Step 1: Write the failing builder and byte-identity tests**

Require every checked schema and fixture path, exact canonical bytes, 3 canaries, 5 trial variants, one fixture ledger, one historical-ineligible bridge, all source digests, all output digests, zero authority expansion, zero fixture promotions, and proof limits.

Run the builder twice in a temporary copy and compare every output byte. Change a policy byte, phase-1 manifest digest, ledger row, environment identity, or historical source digest and require rejection.

- [ ] **Step 2: Run the focused test and witness the missing-builder failure**

Run `node --test tests/adaptive-evidence-v2.test.mjs`.

- [ ] **Step 3: Implement the pure aggregate rebuild**

The builder must read only the named inputs. It must use `commitGeneratedFiles` from `scripts/build-capability-layer-abi.mjs` for contained, staged, handled-failure transactional writes.

The deterministic fixture uses all five variants but proof level `fixture`; its deliberately favorable intervention scores must still yield zero promotable rows and a rejected promotion receipt. The historical Muse bridge binds the real one-shot commit and reviewed artifact hashes but remains ineligible for missing v2 preregistration and incomplete isolated-mode coverage.

- [ ] **Step 4: Build the aggregate receipt and report**

The receipt must include:

```js
{
  schemaVersion: 2,
  id: "adaptive-evidence-v2",
  status: "experimental-canary",
  inputs,
  outputs,
  computedGates: {
    phase1Certified: true,
    exactCanaryCount: true,
    exactTrialVariantCount: true,
    shadowBodyFiles: 0,
    fixturePromotions: 0,
    historicalPromotions: 0,
    authorityExpansions: 0,
    appendOnlyLedgerValid: true,
    staleProfilesEligible: 0
  },
  unresolvedGates: {
    freshModelMatrix: "pending",
    independentReview: "pending",
    universalBehavior: "not-claimed"
  },
  proofLimits: [
    "structural-and-fixture-engine-integrity",
    "historical-evidence-is-not-retroactive-preregistration",
    "no-model-quality-promotion-without-a-fresh-matrix",
    "no-global-activation",
    "no-external-authority"
  ],
  receiptDigest
}
```

The report must distinguish fixture mechanics, historical real evidence, and fresh model evidence. It must not infer quality from routing, corpus size, structural validity, or lower bytes.

- [ ] **Step 5: Write checked outputs transactionally**

Add `build:adaptive-evidence-v2` to `package.json`. `writeAdaptiveEvidenceV2` passes every generated path and canonical text to the existing transactional writer. An injected later-file failure test must prove complete rollback.

- [ ] **Step 6: Run compatibility tests and commit**

```powershell
npm run build:adaptive-evidence-v2
node --test tests/adaptive-evidence-v2.test.mjs tests/adaptive-activation.test.mjs tests/capability-layer-abi.test.mjs tests/router.test.mjs
git diff --check
git add package.json policies src scripts schemas artifacts receipts docs tests
git commit -m "feat: emit adaptive evidence v2 canaries"
```

---

### Task 5: Run one preregistered five-condition Aegis matrix

**Files:**
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/comparison-policy.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/trial-envelope.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/artifacts/raw.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/artifacts/guardrail.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/artifacts/method.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/artifacts/reviewer.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/artifacts/combined.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/observations/raw.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/observations/guardrail.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/observations/method.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/observations/reviewer.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/observations/combined.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/ledger.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/profile.json`
- Create: `evidence/adaptive-evidence-v2/aegis-matrix/lifecycle.json`
- Modify: `receipts/adaptive-evidence-v2.json`
- Modify: `docs/adaptive-evidence-v2-report.md`
- Modify: `tests/adaptive-evidence-v2.test.mjs`

**Interfaces:**
- Consumes: one frozen vulnerable JavaScript subject, a public output contract, a preregistered hidden deterministic verifier, the Aegis phase-1 bundle, and five fresh Terra high-effort subjects run sequentially.
- Produces: five exact artifacts, deterministic observations, one append-only model-evidence ledger, one derived profile, and one lifecycle disposition.

- [ ] **Step 1: Freeze the mission before any model run**

The task definition contains the complete subject code, requests a closed JSON security-review artifact, forbids filesystem and network access, and fixes `gpt-5.6-terra` at `high` effort. The environment identity binds the model name, effort, global host-policy digest, task contract, and absence of external tools.

The comparison policy fixes the raw baseline, all five variants, allowed output schema, finding taxonomy, severity map, deterministic score, critical-regression definition, tie policy, and stop condition before dispatch.

- [ ] **Step 2: Preregister and verify the trial envelope**

Use `preregisterTrial` with the exact Aegis phase-1 manifest digest, policy digest, task digest, comparison digest, JSON artifact boundary, and deterministic verifier digest. Write the envelope and verify it before starting the first subject.

- [ ] **Step 3: Run raw, guardrail, and method subjects sequentially**

Each subject receives the same task bytes and a strict instruction not to inspect the filesystem, network, installed skills, or other trial artifacts.

```text
raw: no selected Aegis body
guardrail: exact guardrails.v1.json only
method: exact method.v1.md only
```

Store each returned artifact exactly. Malformed output remains a failed artifact rather than being silently repaired by the coordinator.

- [ ] **Step 4: Run post-artifact reviewer and combined subjects sequentially**

The reviewer condition receives the raw artifact plus exact `reviewer.v1.md` only after the raw artifact exists. The combined condition receives the method artifact plus the same reviewer body only after the method artifact exists. Each produces a distinct revised artifact; neither overwrites its parent.

- [ ] **Step 5: Evaluate and append observations**

Run the preregistered deterministic verifier over all five artifacts. Record coverage, severity correctness, repair specificity, unsupported claims, schema validity, critical regressions, artifact bytes, and unavailable host token or monetary metrics as explicit `null` values.

Create proposals, append them in the preregistered order with raw admitted first, verify the full ledger, derive the exact profile, and request a lifecycle action with explicit maintainer authority. If thresholds do not pass, write a rejected promotion or a no-change disposition. Never adjust thresholds after seeing results.

- [ ] **Step 6: Rebuild receipt and run all focused tests**

```powershell
npm run build:adaptive-evidence-v2
node --test tests/adaptive-evidence-v2.test.mjs tests/adaptive-activation.test.mjs tests/capability-layer-abi.test.mjs
git diff --check
git add evidence receipts docs tests
git commit -m "test: record adaptive evidence canary matrix"
```

---

### Task 6: Document, independently review, and certify the bounded phase-2 proof

**Files:**
- Create: `runtime/adaptive-evidence-v2.md`
- Create: `docs/adaptive-evidence-v2-certification.md`
- Modify: `tests/adaptive-evidence-v2.test.mjs`

**Interfaces:**
- Consumes: checked engine artifacts, fresh Aegis matrix, full suite, exact repository diff, and one independent review.
- Produces: a runtime contract and a certification disposition that states the exact evidence level, rollback, integration state, and phase-3 entry boundary.

- [ ] **Step 1: Document the runtime sequence**

Record this exact order:

```text
verify capability bundle and trusted policy
compile complete profile identity
derive or invalidate the current profile
compile body-free shadow prediction
preserve native attempt
preregister task, variants, evaluator, and comparison policy
construct each isolated artifact under its authorized disclosure
evaluate only after each artifact exists
append immutable evidence rows
derive a new profile without mutating history
apply only an explicitly authorized lifecycle receipt
fall back to activation v1 when v2 is disabled or ineligible
```

Document privacy, required versus optional persistence, replay, reviewer independence, authority neutrality, return-to-native recovery, v1 rollback, and every proof limit.

- [ ] **Step 2: Add documentation-boundary tests**

Require all five variants, seven profile identity fields, historical ineligibility, fixture non-promotion, stale invalidation, critical-regression accounting, append-only evidence, explicit lifecycle authority, v1 rollback, no global activation, and exact proof-level language.

- [ ] **Step 3: Run the complete suite**

Run `npm test` and require zero failures and at least the 643-test inherited baseline plus new phase-2 tests.

- [ ] **Step 4: Request one independent trust and evidence review**

The reviewer inspects policy trust roots, field closure, shadow contamination, retrospective preregistration, variant isolation, evaluator independence, ledger chaining, duplicate admission, profile-key completeness, stale invalidation, fixture promotion, critical-regression handling, lifecycle authority, receipt honesty, privacy, deterministic writes, v1 compatibility, and rollback.

Every critical or important implementation finding receives a reproducing test before repair. Re-run the same reviewer on the repair range until no critical or important defect remains.

- [ ] **Step 5: Record the certification disposition**

Use `certified-adaptive-engine-canary` only if:

```text
all phase-2 engine gates pass
the fresh trial was preregistered before dispatch
all five conditions used one exact model profile and isolated disclosures
the deterministic evaluator admitted five digest-bound observations
no fixture or historical row promoted a profile
stale identities are ineligible
promotion cannot self-authorize
all historical and new tests pass
independent review has no unresolved critical or important defect
legacy activation and phase-1 bytes remain unchanged
```

Otherwise use `experimental-blocked` and identify every failed gate. State the exact fresh-model result without generalizing beyond the Aegis mission.

- [ ] **Step 6: Commit the reviewed runtime and certification**

```powershell
git add runtime/adaptive-evidence-v2.md docs/adaptive-evidence-v2-certification.md tests/adaptive-evidence-v2.test.mjs
git commit -m "docs: certify adaptive evidence v2 boundaries"
```

- [ ] **Step 7: Run the final completion gate**

Run the deterministic builder twice and compare every checked output byte, the focused compatibility set, the complete suite, syntax checks for every new module, `git diff --check`, exact phase-1 source and artifact hashes, and `git status --short --branch`.

Leave `feat/adaptive-evidence-v2` and its worktree available. Do not push, merge, install, or open phase 3 automatically.

## Requirement Coverage

| requirement | implementation evidence |
|---|---|
| GS-ARC-008 | exact seven-field profile identities in Tasks 1 and 3 |
| GS-ARC-009 | evidence-level and non-promotion rules in Tasks 1, 3, 4, and 6 |
| GS-ARC-010 | body-free shadow prediction and preserved native attempt in Task 2 |
| GS-ARC-011 | five isolated trial variants and causal rows in Tasks 2, 3, and 5 |
| GS-ARC-012 | complete identity freshness and deterministic invalidation in Task 3 |
| GS-ARC-013 | threshold, regression, authority, promotion, and demotion receipts in Task 3 |
| GS-ARC-014 | historical successes remain candidate evidence rather than trusted capability mutation in Tasks 2 and 4 |
| GS-ARC-025 | byte metrics and nullable host-supplied cost metrics in Tasks 2 and 5 |
| GS-ARC-026 | preregistered quality, regression, overhead, and native-restriction comparisons in Task 5 |
| GS-ARC-027 | digest-only default retention in Tasks 2, 3, and 6 |
| GS-ARC-028 | immutable trial, row, parent, and receipt replay in Tasks 2 and 3 |
| GS-ARC-029 | recorded lifecycle fallback and return-to-native boundary in Tasks 3 and 6 |
| GS-ARC-030 | required receipt persistence and optional reporting separation in Tasks 4 and 6 |
| GS-ARC-031 | authority-neutral records and unchanged host ceiling throughout |
| GS-ARC-033 | explicit structural, fixture, artifact, model, cross-model, field, and universal levels |
| GS-ARC-034 | every report, profile, receipt, and certification exposes proof limits |

## Completion Boundary

Phase 2 is complete only when the five-condition trial was preregistered before model dispatch, every artifact and observation is digest-bound, causal rows remain isolated by variant, profiles fail closed on every identity mismatch, fixtures and historical imports cannot promote, lifecycle actions require independent explicit authority, all inherited and new tests pass, independent review is clear, and rollback to activation v1 remains exact. This plan does not authorize phase 3, global activation, a push, a merge, Godagents runtime work, or Lunari integration.
