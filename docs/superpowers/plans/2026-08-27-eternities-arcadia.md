# Eternities Arcadia Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review the complete 25-source game-design family and locally certify `eternities-arcadia` as a compact, agent-neutral game-development godskill derived only from exact candidate clusters.

**Architecture:** Complete semantic review precedes clustering. Four candidate clusters compose Arcadia's game-direction, runtime-systems, player-experience, and proof-and-release routes; generated-content, shipping, runtime-administration, and demo evidence remain separate boundaries. Existing cluster-review promotion, candidate-evidence coverage, and agent-native routing machinery are reused without weakening historical receipts.

**Tech Stack:** Node.js 24 ESM, built-in test runner, Markdown, JSON and JSONL, SHA-256, existing Eternities review, clustering, evaluation, promotion, coverage, and routing modules.

**Spec:** `docs/superpowers/specs/2026-08-27-eternities-arcadia-design.md`

## Global Constraints

- Process all 25 exact `game-design-development` source bodies; do not infer semantic review from names or headings.
- Third-party repositories remain inert evidence under `D:\03-ARSENAL\warehouse`; execute no source code or instructions.
- Copy no source prose into Arcadia. Preserve source ids, body digests, review digests, cluster digests, dispositions, and uncertainty.
- Arcadia is agent-neutral, non-recursive, commandless, and at or below 4,000 estimated entrypoint tokens.
- Arcadia declares local read and local write only. External research, installation, signing, upload, publication, store mutation, account mutation, and commercial commitment require separate authority.
- Human play evidence owns fun and final acceptance. Static or headless evidence cannot self-certify game quality.
- Temporal platform, engine, package, store, privacy, ratings, accessibility-law, and licensing claims are deferred to current authoritative evidence when consequential.
- Dark-pattern monetization, fabricated scarcity, deceptive odds, coercive friction, and unsupported commercial claims are refused.
- Historical corpus, cluster, promotion, and router checkpoints remain exact and continue validating their original state.
- No push, publication, deployment, global activation, profile mutation, Pantheon enablement, provider mutation, or external communication occurs.

---

### Task 1: Complete exact semantic review for all 25 game sources

**Files:**
- Create: `reviews/waves/game-design-development/wave-002.json`
- Create: `reviews/waves/game-design-development/wave-003.json`
- Create: `reviews/waves/game-design-development/wave-004.json`
- Create: `reviews/waves/game-design-development/wave-005.json`
- Create: `tests/game-family-review.test.mjs`
- Modify: `artifacts/corpus/review-evidence.jsonl`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `artifacts/corpus/coverage-summary.json`
- Modify: `artifacts/corpus/families/game-design-development/queue.json`
- Modify: `artifacts/corpus/families/game-design-development/packets/001.json`

**Interfaces:**
- Consumes: the 25 exact cards in `artifacts/corpus/families/game-design-development/queue.json` and bodies rooted under `D:\03-ARSENAL\warehouse`.
- Produces: 25 normalized `bounded-source-review-v1` rows accepted by `validateReviewBatch()` and `loadReviewEvidence()`.

The four new waves contain these disjoint exact source ids:

```text
wave-002 direction:
skill-8828c005b56ee300 game-brief
skill-c37d2be027c6a66b game-narrative
skill-d6d7c8cfb5a2a05a game-economy

wave-003 runtime:
skill-01d2678fab2beba5 game-ai
skill-15f48cb09bb3fc5c game-engine
skill-3925ac9a9a4a4729 game-loop
skill-4da919605360b97e game-save
skill-8426e4facce66130 game-perf
skill-c5453d97a8bfa880 game-net
skill-c8515dee272ef8a4 game-input

wave-004 experience:
skill-653cc106c45b3108 game-a11y
skill-87235b0ad6427a6c game-audio
skill-8fbc34ba16f26554 game-feel
skill-9be2bc7dc4cce133 game-anim
skill-b1c5dae2c9f8b4b6 game-artgen
skill-c672de8666610086 game-localvoice
skill-e9c2d8bc4cbefcdd game-vfx
skill-f92d59487c6e6a3b game-art

wave-005 proof and boundaries:
skill-0dc34cc7a9cf2651 game-verdict
skill-0fe22284c56b22d7 game-measure
skill-4177e7f0e23def3a game-ship
skill-d4446fd83f92f9cc demo-1-terminal-arcade
skill-db19e91e6f58e8e1 engine-skills
```

- [ ] **Step 1: Write the failing full-family review test**

Load source records, body evidence, and game review waves. Assert 25 unique game-family rows, exact equality with the queue source ids, exact body digests, `copiedSourceProse === false`, `promotionClaim === false`, unnamed intent examples, known dispositions, and all required contract arrays.

```js
assert.equal(reviews.length, 25);
assert.deepEqual(reviews.map(({ sourceId }) => sourceId).sort(), queueIds);
assert.ok(reviews.every((row) =>
  row.copiedSourceProse === false &&
  row.promotionClaim === false &&
  row.neutralIntentExamples.every((intent) => !intent.startsWith("/"))
));
```

- [ ] **Step 2: Run the red test**

Run `node --test tests/game-family-review.test.mjs`.

Expected: fail because only the two wave-001 sources are reviewed.

- [ ] **Step 3: Inspect every remaining exact body as inert text**

Read each exact `sourcePath` from the warehouse. Write an independent review containing neutral capability summary, two unnamed intents, inputs, operations, outputs, effects, failure behavior, exclusions, useful invariants, material risks, disposition, proposed cluster, confidence, and copied/promotion declarations. Do not reproduce source wording.

- [ ] **Step 4: Validate the four review batches**

Run `node --test tests/game-family-review.test.mjs tests/reviews.test.mjs`.

Expected: all review schema, exact-digest, and complete-family assertions pass.

- [ ] **Step 5: Rebuild coverage twice**

Run `npm run build:coverage` twice. Both outputs must report `cardReviewed: 41`, preserve the previous 12 clustered and 7 synthesized/evaluated/promoted rows, and emit identical review and coverage hashes.

- [ ] **Step 6: Commit**

```powershell
git add reviews/waves/game-design-development tests/game-family-review.test.mjs artifacts/corpus
git commit -m "feat: review complete game design family"
```

---

### Task 2: Certify exact game-family clusters

**Files:**
- Create: `clusters/game-design-development.v1.json`
- Create: `tests/game-cluster-wave.test.mjs`
- Create: `receipts/game-design-development-clusters-v1.json`
- Modify: `artifacts/corpus/cluster-evidence.jsonl`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `artifacts/corpus/coverage-summary.json`
- Modify: affected game family queue and packet artifacts

**Interfaces:**
- Consumes: all 25 exact normalized game reviews.
- Produces: eight deterministic cluster rows and a clustered-stage receipt.

Expected evidence relationships, subject only to exact review contradiction:

```json
{
  "candidate": {
    "game-direction-contract": [
      "skill-2662a809e231e576", "skill-8828c005b56ee300",
      "skill-bd538035e9ab0cf5", "skill-c37d2be027c6a66b",
      "skill-d6d7c8cfb5a2a05a"
    ],
    "game-runtime-systems": [
      "skill-01d2678fab2beba5", "skill-15f48cb09bb3fc5c",
      "skill-3925ac9a9a4a4729", "skill-4da919605360b97e",
      "skill-8426e4facce66130", "skill-c5453d97a8bfa880",
      "skill-c8515dee272ef8a4"
    ],
    "game-player-experience": [
      "skill-653cc106c45b3108", "skill-87235b0ad6427a6c",
      "skill-8fbc34ba16f26554", "skill-9be2bc7dc4cce133",
      "skill-e9c2d8bc4cbefcdd", "skill-f92d59487c6e6a3b"
    ],
    "game-proof-and-verdict": [
      "skill-0dc34cc7a9cf2651", "skill-0fe22284c56b22d7"
    ]
  },
  "deferred": {
    "generated-content-boundary": [
      "skill-b1c5dae2c9f8b4b6", "skill-c672de8666610086"
    ],
    "game-shipping-boundary": ["skill-4177e7f0e23def3a"],
    "runtime-administration-boundary": ["skill-db19e91e6f58e8e1"]
  },
  "rejected": {
    "narrow-demo-example": ["skill-d4446fd83f92f9cc"]
  }
}
```

- [ ] **Step 1: Write failing exact-cluster tests**

Assert 8 clusters, all 25 reviewed sources represented exactly once, 4 candidate clusters with 20 sources, 3 deferred clusters with 4 sources, 1 rejected cluster with 1 source, exact review digests, no promoted decision, and deterministic cluster digests.

- [ ] **Step 2: Run the red tests**

Run `node --test tests/game-cluster-wave.test.mjs tests/refinery-clusters.test.mjs`.

Expected: missing game cluster batch.

- [ ] **Step 3: Author and validate the cluster batch**

Use relationship values from `src/refinery-clusters.mjs`: `ordered-composition`, `specialized-alternative`, `canonical-with-variants`, or `boundary-deferred`. Give every member one valid role and explain every candidate, deferral, or rejection in independent language.

- [ ] **Step 4: Rebuild coverage twice and freeze clustered evidence**

Run `npm run build:coverage` twice. Expected live totals: 37 clustered, 7 synthesized/evaluated/promoted. Create a timestamp-free clustered receipt with exact batch, cluster-evidence, and clustered coverage hashes.

- [ ] **Step 5: Commit**

```powershell
git add clusters/game-design-development.v1.json tests/game-cluster-wave.test.mjs receipts/game-design-development-clusters-v1.json artifacts/corpus
git commit -m "feat: cluster complete game design family"
```

---

### Task 3: Define the portable Arcadia core

**Files:**
- Create: `skills/eternities-arcadia/SKILL.md`
- Create: `skills/eternities-arcadia/references/operating-contract.md`
- Create: `skills/eternities-arcadia/references/capability-contract.json`
- Create: `skills/eternities-arcadia/references/mining-receipt.md`
- Create: `tests/arcadia-godskill.test.mjs`

**Interfaces:**
- Consumes: the four exact candidate clusters and 20 exact source reviews.
- Produces: one compact four-route, agent-neutral composition contract.

- [ ] **Step 1: Write failing core tests**

Assert frontmatter name and discriminating description; 4,000-token ceiling; exact routes `game-direction`, `runtime-systems`, `player-experience`, `proof-and-release`; no self-delegation; local read/write effects only; 20 exact source ids; four exact cluster ids and digests; and absence of every deferred or rejected source id.

- [ ] **Step 2: Run the red test**

Run `node --test tests/arcadia-godskill.test.mjs`.

Expected: missing Arcadia files.

- [ ] **Step 3: Author the compact entrypoint**

Include route selection, twelve shared laws, explicit specialist handoffs, human-verdict boundary, temporal-evidence boundary, dark-pattern refusal, external-action boundary, and non-recursive termination. Link the detailed operating contract only for consequential or multi-route work.

- [ ] **Step 4: Author the operating and capability contracts**

The operating contract defines player-promise, game-design, runtime, feedback, accessibility, measurement, verdict, and release-readiness data contracts. The capability contract uses `id: "godskill-eternities-arcadia-v1"`, `name: "eternities-arcadia"`, category `game-design-development`, `explicitOnly: false`, effects `read` and `write`, exact candidate source membership, and `sourceEvidence.mode: "cluster-review-v1"`.

- [ ] **Step 5: Write the mining receipt**

Record all 8 clusters, all 25 reviewed sources, exact selected membership, deferred and rejected boundaries, no copied prose, no source code execution, verification commands, and proof limits.

- [ ] **Step 6: Run core verification and measure tokens**

```powershell
node --test tests/arcadia-godskill.test.mjs tests/schema.test.mjs tests/composition.test.mjs tests/cluster-promotion-evidence.test.mjs
node -e "const fs=require('node:fs');const s=fs.readFileSync('skills/eternities-arcadia/SKILL.md','utf8').replace(/\r\n/g,'\n');console.log(Math.ceil(Buffer.byteLength(s,'utf8')/4))"
```

Expected: all tests pass and token count is at most 4,000.

- [ ] **Step 7: Commit**

```powershell
git add skills/eternities-arcadia tests/arcadia-godskill.test.mjs
git commit -m "feat: define Eternities Arcadia godskill"
```

---

### Task 4: Prove commandless Arcadia routing

**Files:**
- Create: `skills/eternities-arcadia/references/routing-card.json`
- Create: `tests/arcadia-routing.test.mjs`

**Interfaces:**
- Consumes: the measured Arcadia entrypoint and four-route contract.
- Produces: one moderate-risk candidate routing card outside the live promoted index.

- [ ] **Step 1: Write failing routing tests**

Assert direct, paraphrased, and contextual unnamed outcomes select Arcadia without `/`, `eternities`, or `arcadia`; alias removal preserves exact receipts; the card exposes only supported game capabilities; and external write, low maximum risk, missing local-write authority, unresolved platform policy, generated-content licensing, store publication, package installation, and human-fun certification fail closed.

- [ ] **Step 2: Run the red test**

Run `node --test tests/arcadia-routing.test.mjs`.

- [ ] **Step 3: Author the exact card**

Use family `game-design-development`, effects `local-read` and `local-write`, risk `moderate`, evidence `verified`, entrypoint `skills/eternities-arcadia/SKILL.md`, exact measured `contextCost`, empty aliases, and symmetric compatibility ids only where the existing promoted cards reciprocate.

- [ ] **Step 4: Run candidate routing verification**

Run `node --test tests/arcadia-routing.test.mjs tests/router.test.mjs tests/routing-contracts.test.mjs`.

- [ ] **Step 5: Commit**

```powershell
git add skills/eternities-arcadia/references/routing-card.json tests/arcadia-routing.test.mjs
git commit -m "feat: route Eternities Arcadia from game outcomes"
```

---

### Task 5: Evaluate and promote Arcadia

**Files:**
- Create: `skills/eternities-arcadia/evals/cases.json`
- Modify: `tests/arcadia-godskill.test.mjs`
- Create: `receipts/promotions/eternities-arcadia.json`

**Interfaces:**
- Consumes: exact cluster evidence, Arcadia core, routing card, and `policies/promotion.v1.json`.
- Produces: deterministic all-critical evaluation and promotion receipt.

- [ ] **Step 1: Write failing evaluation assertions**

Require at least 36 all-critical cases: 12 direct route/submode cases, 12 paraphrases, 4 contextual missions, 3 routine exclusions, and at least 5 conflicts. Required conflicts cover settled implementation, exact visual/media production, external research, generated-content licensing, store publication, package installation, human fun verdict, unauthorized external action, and dark-pattern monetization.

- [ ] **Step 2: Run the red evaluation test**

Run `node --test tests/arcadia-godskill.test.mjs`.

- [ ] **Step 3: Author exact cases and baseline**

Use baseline `unbounded-game-builder`, token count 8,000, source coverage 1, generic routing results, and no invented effect resolution. Candidate results exactly match all cases with no unresolved effects.

- [ ] **Step 4: Generate and verify promotion**

```powershell
node scripts/evaluate-skill.mjs --skill skills/eternities-arcadia --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-arcadia.json
node scripts/verify-skill-receipt.mjs --skill skills/eternities-arcadia --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-arcadia.json
```

Expected: promoted, all critical cases pass, source coverage 20, cluster-review mode with four exact clusters, no copied prose, and valid deterministic verification.

- [ ] **Step 5: Commit**

```powershell
git add skills/eternities-arcadia/evals/cases.json tests/arcadia-godskill.test.mjs receipts/promotions/eternities-arcadia.json
git commit -m "feat: promote Eternities Arcadia godskill"
```

---

### Task 6: Certify router v3 and exact corpus advancement

**Files:**
- Create: `artifacts/checkpoints/agent-native-router-v2/`
- Modify: `receipts/agent-native-router-v2.json`
- Create: `receipts/agent-native-router-v3.json`
- Create: `tests/agent-native-router-v3.test.mjs`
- Modify: `tests/promoted-routing-cards.test.mjs`
- Modify: `artifacts/routing/*`
- Create: `syntheses/eternities-arcadia.v1.json`
- Modify: `artifacts/corpus/*`
- Create: `tests/arcadia-corpus-promotion.test.mjs`

**Interfaces:**
- Consumes: exact promoted Arcadia receipt and routing card.
- Produces: immutable eight-card router v2 checkpoint, nine-card router v3, and exact 20-source promoted corpus evidence.

- [ ] **Step 1: Freeze router v2 exact bytes**

Copy current committed routing artifacts into `artifacts/checkpoints/agent-native-router-v2`, record `checkpointRoot` in its receipt, and update only v2 historical tests to read the checkpoint.

- [ ] **Step 2: Write failing v3 and corpus tests**

Assert 27 commandless cases across nine promoted cards, alias-removal equality, 5,000-card retrieval bounded to 32, selected-entrypoint-only disclosure, authority and risk failures, unresolved decisions, exact v3 hashes, and exact Arcadia candidate evidence. Corpus totals must become 27 promoted plus the previous 7, for 27 synthesized/evaluated/promoted overall, while clustered remains 37.

- [ ] **Step 3: Write the Arcadia synthesis declaration**

Record skill, capability-contract, routing-card, evaluation, and promotion receipt paths and exact hashes; four exact candidate cluster ids/digests; 20 sorted source ids; `copiedSourceProse: false`; `externalMutation: false`; status `promoted`; and method `independent-cluster-synthesis-v1`.

- [ ] **Step 4: Rebuild router and coverage twice**

Run `npm run build:routing` twice and `npm run build:coverage` twice. Both routing builds must report 9 cards and 9 families with identical hashes. Both coverage builds must report 37 clustered and 27 synthesized/evaluated/promoted with identical hashes.

- [ ] **Step 5: Write and verify router v3 receipt**

Record exact input and artifact hashes, 27 commandless and alias-removal cases, maximum shortlist 32, maximum composition 3, authority/effect gates, and no timestamp.

- [ ] **Step 6: Run focused verification**

```powershell
node --test tests/agent-native-routing-certification.test.mjs tests/agent-native-router-v2.test.mjs tests/agent-native-router-v3.test.mjs tests/promoted-routing-cards.test.mjs tests/arcadia-routing.test.mjs tests/arcadia-corpus-promotion.test.mjs tests/corpus-refinery-certification.test.mjs
```

- [ ] **Step 7: Commit**

```powershell
git add artifacts/checkpoints/agent-native-router-v2 artifacts/routing artifacts/corpus receipts/agent-native-router-v2.json receipts/agent-native-router-v3.json tests/agent-native-router-v3.test.mjs tests/promoted-routing-cards.test.mjs syntheses/eternities-arcadia.v1.json tests/arcadia-corpus-promotion.test.mjs
git commit -m "docs: certify Arcadia routing and corpus evidence"
```

---

### Task 7: Certify and integrate release six

**Files:**
- Modify: `README.md`
- Create: `docs/eternities-arcadia-report.md`
- Create: `receipts/eternities-arcadia-release.json`
- Create: `tests/eternities-arcadia-release.test.mjs`

**Interfaces:**
- Consumes: all review, cluster, core, routing, evaluation, promotion, corpus, and checkpoint evidence.
- Produces: deterministic `certified-local-candidate` verdict and a local integration decision.

- [ ] **Step 1: Write failing release receipt tests**

Assert 25 reviews, 8 clusters, 20 selected sources, 5 boundary or rejected sources, 4 routes, all critical cases, <=4,000 tokens, valid promotion digest, v2 checkpoint validity, v3 nine-card validity, corpus totals 37/27/27/27, zero composition cycles, no self-route, no copied prose, no source execution, and no external or global mutation.

- [ ] **Step 2: Write report, receipt, and README update**

Report exact routes, measured evaluation, source evidence, deferred boundaries, router evidence, corpus advancement, token cost, proof limits, and absence of activation. The receipt contains no timestamp and uses status `certified-local-candidate` only after all deterministic gates pass.

- [ ] **Step 3: Run fresh complete verification**

```powershell
npm test
npm run build:routing
npm run build:coverage
node scripts/verify-skill-receipt.mjs --skill skills/eternities-arcadia --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-arcadia.json
git diff --check
git status --short
```

Expected: zero failed and zero skipped tests, deterministic nine-card and corpus hashes, valid promotion receipt, and only planned branch files changed.

- [ ] **Step 4: Independent review**

Use `requesting-code-review` against the complete spec-to-working-tree diff. Fix every confirmed critical or important finding through a failing regression test and the smallest correction, then rerun Step 3.

- [ ] **Step 5: Commit the release**

```powershell
git add README.md docs/eternities-arcadia-report.md receipts/eternities-arcadia-release.json tests/eternities-arcadia-release.test.mjs
git commit -m "docs: certify Eternities Arcadia local release"
```

- [ ] **Step 6: Integrate locally after green verification**

Fast-forward or merge `feat/release-six-arcadia` into local `main`, run `npm test` from merged main, then delete the merged feature branch only if the merged tree is green. Do not push or activate globally.

## Execution order

Tasks 1 through 7 are sequential because every later state depends on exact earlier evidence. Review waves in Task 1 are independently inspectable and may be authored in parallel with disjoint files, but normalization and all shared artifact rebuilds remain serialized. Cluster decisions precede source contracts; core precedes routing; routing precedes promotion; promotion precedes corpus advancement; local integration follows complete review and verification only.
