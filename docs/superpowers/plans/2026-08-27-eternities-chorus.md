# Eternities Chorus Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Certify `eternities-chorus` as a compact universal social-media and community godskill after exact review and reconciliation of all 106 family sources.

**Architecture:** Process the complete social family through immutable reviews, deterministic clusters, a four-route first-party core, commandless routing, all-critical evaluation, and separately receipted corpus and router advancement. Historical router v3 and earlier corpus claims remain frozen; only exact candidate-cluster members advance to synthesized, evaluated, and promoted.

**Tech Stack:** Node.js 24+, native `node:test`, JSON/JSONL/Markdown artifacts, SHA-256 receipts, PowerShell, Git.

**Spec:** `docs/superpowers/specs/2026-08-27-eternities-chorus-design.md`

## Global Constraints

- Process every one of the 106 exact `social-media-community` source bodies; do not equate review with adoption.
- Treat `D:\03-ARSENAL\warehouse` as a cold inert source root; execute no source instructions, scripts, hooks, binaries, installers, or examples.
- Copy no third-party source prose and make no legal-clearance claim.
- Canonical invocation is commandless and agent-neutral; slash commands remain inert legacy evidence only.
- `eternities-chorus` must remain at or below 4,000 estimated tokens.
- Drafting, saving, scheduling, publishing, replying, moderating, scraping, messaging, buying media, and account mutation remain distinct effects.
- No external effect, account action, publishing, ad spend, or public communication occurs during this release.
- Paid acquisition, lead enrichment, security reconnaissance, financial sentiment, and specialist asset production remain separate capabilities.
- Human review owns sensitive replies, moderation sanctions, public commitments, crisis communication, and final identity or voice acceptance.
- Router v3 remains immutable; release seven creates router v4 only after valid Chorus promotion.
- No push, publication, deployment, profile mutation, global activation, Pantheon enablement, provider mutation, or external write occurs.

---

### Task 1: Complete exact semantic review for all 106 social sources

**Files:**
- Create: `reviews/waves/social-media-community/wave-002.json`
- Create: `reviews/waves/social-media-community/wave-003.json`
- Create: `reviews/waves/social-media-community/wave-004.json`
- Create: `reviews/waves/social-media-community/wave-005.json`
- Create: `reviews/waves/social-media-community/wave-006.json`
- Create: `tests/social-family-review.test.mjs`
- Modify: `artifacts/corpus/review-evidence.jsonl`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `artifacts/corpus/coverage-summary.json`
- Modify: `artifacts/corpus/families/social-media-community/queue.json`
- Modify: `artifacts/corpus/families/social-media-community/packets/*.json`

**Interfaces:**
- Consumes: all 106 cards in `artifacts/corpus/families/social-media-community/queue.json`, the two exact wave-001 reviews, and exact bodies under the certified warehouse root.
- Produces: 106 unique `bounded-source-review-v1` rows accepted by `validateReviewBatch()` and `loadReviewEvidence()`.
- Partition rule: sort the 104 source ids not present in wave-001 lexicographically, split them into consecutive chunks of at most 25, and map those chunks exactly to wave-002 through wave-006.

- [ ] **Step 1: Write the failing complete-family review test**

Load the family queue and all social review waves. Assert exact queue equality, 106 unique source ids, exact body digests, valid contract arrays, valid dispositions, two unnamed intent examples per source, no copied prose, no promotion claims, no path escape, and no source represented in more than one wave.

```js
const queueIds = queue.cards.map(({ sourceId }) => sourceId).sort();
const reviews = waves.flatMap(({ reviews }) => reviews);
assert.equal(reviews.length, 106);
assert.deepEqual(reviews.map(({ sourceId }) => sourceId).sort(), queueIds);
assert.equal(new Set(reviews.map(({ sourceId }) => sourceId)).size, 106);
assert.ok(reviews.every((row) =>
  row.copiedSourceProse === false &&
  row.promotionClaim === false &&
  row.neutralIntentExamples.length >= 2 &&
  row.neutralIntentExamples.every((intent) => !intent.trim().startsWith("/"))
));
```

- [ ] **Step 2: Run the red review tests**

Run `node --test tests/social-family-review.test.mjs tests/reviews.test.mjs`.

Expected: fail because only two of the 106 family sources have semantic reviews.

- [ ] **Step 3: Freeze deterministic wave membership**

In the test, derive the five expected chunks from queue order and assert each wave contains its exact chunk. This prevents convenient omission or later silent reshuffling while keeping the plan independent of mutable prose descriptions.

- [ ] **Step 4: Inspect every remaining body as inert text and author independent reviews**

For each exact card, resolve `sourcePath` under the warehouse root, confirm the actual SHA-256 equals `bodySha256`, read the body without executing it, and author neutral capability summary, two commandless intents, inputs, operations, outputs, effects, failure behavior, exclusions, useful invariants, material risks, disposition, proposed cluster, confidence, and copied/promotion declarations.

Classify paid acquisition, account mutation, specialist asset generation, scraping, unrelated infrastructure, security reconnaissance, financial sentiment, and lead enrichment by their actual body behavior rather than their queue family. Preserve them as deferred or rejected when they do not supply a distinct Chorus contract.

- [ ] **Step 5: Validate review batches and rebuild coverage twice**

Run:

```powershell
node --test tests/social-family-review.test.mjs tests/reviews.test.mjs
npm run build:coverage
npm run build:coverage
```

Expected: `cardReviewed: 145`; `clustered: 37`; `synthesized: 27`; `evaluated: 27`; `promoted: 27`; identical review and coverage hashes across both builds.

- [ ] **Step 6: Commit exact social reviews**

```powershell
git add reviews/waves/social-media-community tests/social-family-review.test.mjs artifacts/corpus
git commit -m "feat: review complete social and community family"
```

---

### Task 2: Reconcile all social sources into deterministic behavioral clusters

**Files:**
- Create: `clusters/social-media-community.v1.json`
- Create: `tests/social-cluster-wave.test.mjs`
- Create: `receipts/social-media-community-clusters-v1.json`
- Modify: `artifacts/corpus/cluster-evidence.jsonl`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `artifacts/corpus/coverage-summary.json`
- Modify: affected social family queue and packet artifacts

**Interfaces:**
- Consumes: all 106 exact normalized social reviews.
- Produces: one deterministic cluster batch whose members cover all 106 source ids exactly once and whose candidate clusters map to at most the four approved Chorus routes.

- [ ] **Step 1: Write failing complete-cluster tests**

Assert exact membership equality with the 106 reviews, one occurrence per source, exact review digests, valid relationships and member roles, one explicit decision per cluster, no promoted decision, no cluster with mixed candidate and deferred membership, and stable digests after key-order normalization.

```js
assert.deepEqual(
  clusters.flatMap(({ members }) => members.map(({ sourceId }) => sourceId)).sort(),
  reviews.map(({ sourceId }) => sourceId).sort()
);
assert.ok(clusters.every((cluster) =>
  ["candidate", "deferred", "rejected"].includes(cluster.decision)
));
```

- [ ] **Step 2: Run the red cluster tests**

Run `node --test tests/social-cluster-wave.test.mjs tests/refinery-clusters.test.mjs`.

Expected: fail because no complete social cluster batch exists.

- [ ] **Step 3: Author evidence-derived clusters**

Compare exact reviews by input, operation, output, effect, failure behavior, and observable proof. Reconcile exact duplicates and language variants with `canonical-with-variants`; mutually useful ordered stages with `ordered-composition`; non-composable alternatives with `specialized-alternative`; and specialist or authority boundaries with `boundary-deferred`.

Candidate cluster route values are limited to `identity-and-channel-strategy`, `editorial-production`, `community-operations`, and `measurement-and-stewardship`. A candidate cluster must contribute a distinct behavior not already provided by another candidate cluster. Every rejected or deferred cluster records why it cannot enter Chorus.

- [ ] **Step 4: Rebuild coverage twice and freeze cluster evidence**

Run `npm run build:coverage` twice. Expected: `clustered: 143`, because the prior 37 exact clustered rows plus all 106 social rows now have cluster evidence. Synthesized, evaluated, and promoted remain 27. Both builds must emit identical hashes.

Write `receipts/social-media-community-clusters-v1.json` without a timestamp. Record the exact batch digest, cluster-evidence digest, coverage digest, decision counts, candidate source count, deferred source count, rejected source count, and the invariant that those three counts sum to 106.

- [ ] **Step 5: Commit complete social clustering**

```powershell
git add clusters/social-media-community.v1.json tests/social-cluster-wave.test.mjs receipts/social-media-community-clusters-v1.json artifacts/corpus
git commit -m "feat: cluster complete social and community family"
```

---

### Task 3: Define the portable Chorus core from candidate clusters only

**Files:**
- Create: `skills/eternities-chorus/SKILL.md`
- Create: `skills/eternities-chorus/references/operating-contract.md`
- Create: `skills/eternities-chorus/references/capability-contract.json`
- Create: `skills/eternities-chorus/references/mining-receipt.md`
- Create: `tests/chorus-godskill.test.mjs`

**Interfaces:**
- Consumes: exact candidate clusters from `clusters/social-media-community.v1.json` and their exact source review digests.
- Produces: one compact, non-recursive, four-route agent-neutral composition contract containing only candidate members.

- [ ] **Step 1: Write failing core tests**

Assert the frontmatter name and discriminating description; 4,000-token ceiling; exact approved routes; twelve shared laws; no self-delegation; only local read and local write core effects; exact equality between contract sources and candidate-cluster members; exact cluster ids and digests; and absence of every deferred or rejected source id.

- [ ] **Step 2: Run the red core test**

Run `node --test tests/chorus-godskill.test.mjs`.

Expected: fail because the Chorus core does not exist.

- [ ] **Step 3: Author the compact entrypoint**

Include route selection, shared laws, explicit artifact handoffs, factuality and identity boundaries, participant-dignity and accessibility laws, current-platform-evidence boundary, external-effect ledger, human-sensitive decision boundary, and non-recursive termination. Link the detailed operating contract only for consequential or multi-route missions.

- [ ] **Step 4: Author operating and capability contracts**

The operating contract defines identity and voice, audience hypothesis, channel role, editorial brief, claim provenance, content package, community charter, moderation and escalation, effect ledger, metric dictionary, experiment, finding, and learning-cycle data contracts.

The capability contract uses `id: "godskill-eternities-chorus-v1"`, `name: "eternities-chorus"`, category `social-media-community`, `explicitOnly: false`, effects `read` and `write`, exact candidate source membership, and `sourceEvidence.mode: "cluster-review-v1"`.

- [ ] **Step 5: Write the mining receipt**

Record every cluster and all 106 reviewed sources, exact selected membership, every deferred and rejected boundary, no copied prose, no source-code execution, verification commands, and proof limits.

- [ ] **Step 6: Verify the core and measure tokens**

```powershell
node --test tests/chorus-godskill.test.mjs tests/schema.test.mjs tests/composition.test.mjs tests/cluster-promotion-evidence.test.mjs
node -e "const fs=require('node:fs');const s=fs.readFileSync('skills/eternities-chorus/SKILL.md','utf8').replace(/\r\n/g,'\n');console.log(Math.ceil(Buffer.byteLength(s,'utf8')/4))"
```

Expected: all tests pass and the entrypoint is at most 4,000 estimated tokens.

- [ ] **Step 7: Commit the Chorus core**

```powershell
git add skills/eternities-chorus tests/chorus-godskill.test.mjs
git commit -m "feat: define Eternities Chorus godskill"
```

---

### Task 4: Prove commandless Chorus routing without enabling it globally

**Files:**
- Create: `skills/eternities-chorus/references/routing-card.json`
- Create: `tests/chorus-routing.test.mjs`

**Interfaces:**
- Consumes: the measured Chorus entrypoint and exact promoted-behavior hypothesis.
- Produces: one moderate-risk candidate routing card outside the live promoted index.

- [ ] **Step 1: Write failing routing tests**

Assert direct, paraphrased, and contextual unnamed outcomes select Chorus without `/`, `eternities`, `chorus`, or source skill names. Alias removal must preserve exact receipts. The card exposes only supported social and community capabilities. It fails closed for unresolved external writes, insufficient authority, paid ads, specialist visual or video production, current platform-policy claims without evidence, scraping, impersonation, fabricated testimony, sensitive moderation, crisis publication, and account mutation.

- [ ] **Step 2: Run the red routing test**

Run `node --test tests/chorus-routing.test.mjs`.

- [ ] **Step 3: Author the exact routing card**

Use family `social-media-community`, effects `local-read` and `local-write`, risk `moderate`, evidence `verified`, entrypoint `skills/eternities-chorus/SKILL.md`, exact measured `contextCost`, empty aliases, and compatibility ids only where the existing promoted cards reciprocate or the router treats the handoff as non-composable.

- [ ] **Step 4: Verify candidate routing and commit**

```powershell
node --test tests/chorus-routing.test.mjs tests/router.test.mjs tests/routing-contracts.test.mjs
git add skills/eternities-chorus/references/routing-card.json tests/chorus-routing.test.mjs
git commit -m "feat: route Eternities Chorus from social outcomes"
```

---

### Task 5: Evaluate and promote Chorus

**Files:**
- Create: `skills/eternities-chorus/evals/cases.json`
- Modify: `tests/chorus-godskill.test.mjs`
- Create: `receipts/promotions/eternities-chorus.json`

**Interfaces:**
- Consumes: exact candidate clusters, Chorus core, routing card, and `policies/promotion.v1.json`.
- Produces: one deterministic all-critical evaluation and promotion receipt.

- [ ] **Step 1: Write failing evaluation assertions**

Require at least 40 all-critical cases: direct route and submode cases, paraphrases, contextual missions, routine exclusions, authority conflicts, and specialist handoffs. Required conflicts include generic copy editing, product marketing strategy, paid acquisition, visual and video generation, current platform research, scraping, scheduling or publishing, account mutation, fabricated identity or testimonial, living-person imitation, sensitive moderation, crisis communication, private-message outreach, unauthorized external action, and engagement optimization that violates dignity or truth.

- [ ] **Step 2: Run the red evaluation test**

Run `node --test tests/chorus-godskill.test.mjs`.

- [ ] **Step 3: Author exact cases and baseline**

Use baseline `unbounded-social-growth-agent`, token count 8,000, source coverage 1, generic routing results, and unresolved effect handling. Candidate results exactly match all cases, identify the smallest sufficient route, and leave no effect unresolved.

- [ ] **Step 4: Generate and verify promotion**

```powershell
node scripts/evaluate-skill.mjs --skill skills/eternities-chorus --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-chorus.json
node scripts/verify-skill-receipt.mjs --skill skills/eternities-chorus --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-chorus.json
```

Expected: promoted, all critical cases pass, source coverage equals exact candidate-cluster membership, cluster-review mode cites exact cluster ids, no copied prose, and deterministic receipt verification succeeds.

- [ ] **Step 5: Commit evaluation and promotion**

```powershell
git add skills/eternities-chorus/evals/cases.json tests/chorus-godskill.test.mjs receipts/promotions/eternities-chorus.json
git commit -m "feat: promote Eternities Chorus godskill"
```

---

### Task 6: Freeze router v3 and certify router v4 plus exact corpus advancement

**Files:**
- Create: `artifacts/checkpoints/agent-native-router-v3/`
- Modify: `receipts/agent-native-router-v3.json`
- Create: `receipts/agent-native-router-v4.json`
- Create: `tests/agent-native-router-v4.test.mjs`
- Modify: `tests/promoted-routing-cards.test.mjs`
- Modify: `artifacts/routing/*`
- Create: `syntheses/eternities-chorus.v1.json`
- Modify: `artifacts/corpus/*`
- Create: `tests/chorus-corpus-promotion.test.mjs`

**Interfaces:**
- Consumes: exact promoted Chorus receipt, exact candidate-cluster membership, and routing card.
- Produces: immutable nine-card router v3 checkpoint, deterministic ten-card router v4, and exact candidate-source corpus advancement.

- [ ] **Step 1: Freeze router v3 exact bytes**

Copy the currently committed v3 routing artifacts into `artifacts/checkpoints/agent-native-router-v3`, record `checkpointRoot` and complete artifact hashes in its receipt, and update only v3 historical tests to read the checkpoint.

- [ ] **Step 2: Write failing v4 and corpus tests**

Assert 30 commandless cases across ten promoted cards, alias-removal equality, 5,000-card retrieval bounded to 32, selected-entrypoint-only disclosure, authority and risk failures, unresolved decisions, exact v4 hashes, and exact Chorus cluster and source evidence.

Corpus expectations are computed as:

```js
const selected = candidateClusters.flatMap(({ members }) => members).length;
assert.equal(summary.evidenceCounts.cardReviewed, 145);
assert.equal(summary.evidenceCounts.clustered, 143);
assert.equal(summary.evidenceCounts.synthesized, 27 + selected);
assert.equal(summary.evidenceCounts.evaluated, 27 + selected);
assert.equal(summary.evidenceCounts.promoted, 27 + selected);
```

- [ ] **Step 3: Write the exact Chorus synthesis declaration**

Record skill, capability-contract, routing-card, evaluation, and promotion receipt paths and hashes; exact candidate cluster ids and digests; sorted selected source ids; `copiedSourceProse: false`; `externalMutation: false`; status `promoted`; and method `independent-cluster-synthesis-v1`.

- [ ] **Step 4: Rebuild router and coverage twice**

Run `npm run build:routing` twice and `npm run build:coverage` twice. Both router builds must report 10 cards and 10 families with identical hashes. Both coverage builds must report exact 145 reviewed, 143 clustered, and `27 + selected` synthesized, evaluated, and promoted with identical hashes.

- [ ] **Step 5: Write and verify the router v4 receipt**

Record exact input and artifact hashes, 30 commandless and alias-removal cases, maximum shortlist 32, maximum composition 3, authority and effect gates, full checkpoint evidence, and no timestamp.

- [ ] **Step 6: Run focused verification and commit**

```powershell
node --test tests/agent-native-routing-certification.test.mjs tests/agent-native-router-v3.test.mjs tests/agent-native-router-v4.test.mjs tests/promoted-routing-cards.test.mjs tests/chorus-routing.test.mjs tests/chorus-corpus-promotion.test.mjs tests/corpus-refinery-certification.test.mjs
git add artifacts/checkpoints/agent-native-router-v3 artifacts/routing artifacts/corpus receipts/agent-native-router-v3.json receipts/agent-native-router-v4.json tests/agent-native-router-v4.test.mjs tests/promoted-routing-cards.test.mjs syntheses/eternities-chorus.v1.json tests/chorus-corpus-promotion.test.mjs
git commit -m "docs: certify Chorus routing and corpus evidence"
```

---

### Task 7: Certify, review, and locally integrate release seven

**Files:**
- Modify: `README.md`
- Create: `docs/eternities-chorus-report.md`
- Create: `receipts/eternities-chorus-release.json`
- Create: `tests/eternities-chorus-release.test.mjs`

**Interfaces:**
- Consumes: all review, cluster, core, routing, evaluation, promotion, corpus, and checkpoint evidence.
- Produces: deterministic `certified-local-candidate` verdict and a local integration decision.

- [ ] **Step 1: Write failing release-receipt tests**

Assert 106 reviews, exact cluster coverage, exact selected/deferred/rejected counts summing to 106, exact route set, all critical cases, at most 4,000 estimated tokens, valid promotion digest, v3 checkpoint validity, v4 ten-card validity, exact corpus totals, zero composition cycles, no self-route, no copied prose, no source execution, and no external or global mutation.

- [ ] **Step 2: Write the report, receipt, and README update**

Report exact routes, measured evaluation, source and cluster evidence, deferred and rejected boundaries, router evidence, corpus advancement, token cost, proof limits, and absence of activation. The receipt contains no timestamp and uses `certified-local-candidate` only after every deterministic gate passes.

- [ ] **Step 3: Run fresh complete verification**

```powershell
npm test
npm run build:routing
npm run build:coverage
node scripts/verify-skill-receipt.mjs --skill skills/eternities-chorus --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-chorus.json
git diff --check
git status --short
```

Expected: zero failed and zero skipped tests, deterministic ten-card and corpus hashes, valid promotion receipt, and only planned feature-branch files changed.

- [ ] **Step 4: Run independent review**

Use `requesting-code-review` against the complete spec-to-working-tree diff. Fix every confirmed critical or important finding through a failing regression test and the smallest correction, then rerun Step 3.

- [ ] **Step 5: Commit and locally integrate**

```powershell
git add README.md docs/eternities-chorus-report.md receipts/eternities-chorus-release.json tests/eternities-chorus-release.test.mjs
git commit -m "docs: certify Eternities Chorus local release"
```

Fast-forward or merge `feat/release-seven-chorus` into local `main`, run `npm test` from merged main, and delete the merged feature branch only if the merged tree is green. Do not push or activate globally.

## Execution order

Tasks 1 through 7 are sequential because each later state depends on exact earlier evidence. Review bodies within Task 1 are independently inspectable, but all shared review files and corpus rebuilds remain serialized. Cluster decisions precede source contracts; the core precedes routing; routing precedes promotion; promotion precedes corpus advancement; local integration follows complete independent review and fresh verification.
