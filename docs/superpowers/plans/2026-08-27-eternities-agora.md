# eternities agora implementation plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, evaluate, and locally certify `eternities-agora` as an agent-neutral agency and client-operations godskill derived from the three candidate agency clusters.

**Architecture:** Extend the promotion evidence pipeline with a cluster-review mode while preserving every historical ledger-backed receipt byte-for-byte. Build one compact Agora entrypoint with three dominant routes, prove its commandless routing card before promotion, evaluate it against all seven route scopes or modes, then advance only its seven exact source rows through synthesized, evaluated, and promoted corpus states.

**Tech Stack:** Node.js 24 ESM, built-in test runner, Markdown, JSON and JSONL, SHA-256, existing Eternities routing, evaluation, promotion, and corpus-refinery modules.

**Spec:** `docs/superpowers/specs/2026-08-27-eternities-agora-design.md`

## Global Constraints

- The only synthesis inputs are `agency-operational-state`, `client-deliverable-construction`, and `prospect-assessment-depth` from `artifacts/corpus/cluster-evidence.jsonl`.
- The four deferred agency clusters cannot appear in Agora doctrine, routes, dependencies, evaluation success cases, or source coverage.
- Third-party source repositories remain inert evidence under `D:\03-ARSENAL\warehouse`; no source code or instruction is executed.
- The entrypoint must remain agent-neutral and at or below 4,000 estimated tokens.
- Canonical routing uses unnamed natural-language outcomes. Legacy aliases are compatibility-only and must not influence receipts.
- Agora declares only local read and local write effects. External reads, writes, communications, commitments, publication, and account mutation require separate authority and delegation.
- The immutable corpus foundation and agent-native router v1 artifacts must retain their certified hashes.
- No push, publication, deployment, global activation, profile mutation, provider mutation, or external communication occurs.
- Promotion requires all critical evaluation cases, all policy thresholds, exact source coverage, resolved effects, deterministic receipts, and at least one measured improvement.

---

### Task 1: Cluster-review source evidence for promotion

**Files:**
- Modify: `src/schema.mjs`
- Modify: `src/provenance-evidence.mjs`
- Modify: `scripts/evaluate-skill.mjs`
- Modify: `tests/schema.test.mjs`
- Modify: `tests/provenance-evidence.test.mjs`
- Create: `tests/cluster-promotion-evidence.test.mjs`

**Interfaces:**
- Consumes: a capability contract with `sourceEvidence.mode === "cluster-review-v1"`, exact cluster rows, and exact review rows.
- Produces: `deriveClusterSourceEvidence(contract, clusterRows, reviewRows)` returning `{ sourceCoverage, sourceIds, proseCopied, sourceEvidenceMode, clusterIds }`.
- Preserves: `deriveSourceEvidence(contract, ledgerRows)` and every existing ledger-backed promotion receipt.

- [ ] **Step 1: Write failing cluster-evidence schema tests**

Extend the complete contract fixture with an optional source-evidence block and assert that sorted, exact cluster references pass while unknown modes, duplicate cluster ids, malformed SHA-256 values, and a cluster mode without references fail.

```js
const clusterEvidence = {
  mode: "cluster-review-v1",
  clusterSetId: "agency-client-services-clusters-v1",
  clusters: [
    {
      id: "agency-operational-state",
      digest: "bc995745d1abe8130b6e70e0de497f05a5d8a93600a79611fddeff30dc3c841d",
    },
    {
      id: "client-deliverable-construction",
      digest: "438c10e4d01b0da3a784137822e72efb4ebab3201acc96335b67760513946d8b",
    },
    {
      id: "prospect-assessment-depth",
      digest: "1648c19ae0c7229dc71bd0d5f2674da11e8b65e36860ab9052c8f56a3b393dd2",
    },
  ],
};
assert.doesNotThrow(() =>
  validateCapabilityContract(completeContract({ sourceEvidence: clusterEvidence })),
);
assert.throws(
  () => validateCapabilityContract(completeContract({
    sourceEvidence: { ...clusterEvidence, mode: "generated-summary" },
  })),
  /unknown source evidence mode/,
);
```

- [ ] **Step 2: Write failing exact reconciliation tests**

Create fixtures with one cluster, two members, and two matching reviews. Assert exact success, then reject a stale cluster digest, unknown source, missing review, stale review digest, deferred cluster, duplicate membership, copied-source declaration, and source-id union drift.

```js
const result = deriveClusterSourceEvidence(contract, [cluster], reviews);
assert.deepEqual(result, {
  sourceCoverage: 2,
  sourceIds: ["source-a", "source-b"],
  proseCopied: false,
  sourceEvidenceMode: "cluster-review-v1",
  clusterIds: ["cluster-a"],
});
assert.throws(
  () => deriveClusterSourceEvidence(contract, [{ ...cluster, clusterDigest: "f".repeat(64) }], reviews),
  /stale cluster digest/,
);
```

- [ ] **Step 3: Run the red tests**

Run:

```powershell
node --test tests/schema.test.mjs tests/provenance-evidence.test.mjs tests/cluster-promotion-evidence.test.mjs
```

Expected: failures for the missing optional schema and missing `deriveClusterSourceEvidence` export.

- [ ] **Step 4: Implement optional contract validation**

In `validateCapabilityContract`, leave contracts without `sourceEvidence` unchanged. For cluster-review contracts, require exactly:

```js
{
  mode: "cluster-review-v1",
  clusterSetId: "agency-client-services-clusters-v1",
  clusters: [
    {
      id: "agency-operational-state",
      digest: "bc995745d1abe8130b6e70e0de497f05a5d8a93600a79611fddeff30dc3c841d",
    },
  ],
}
```

Require non-empty strings, a non-empty cluster array, unique lexically sorted ids, and lowercase SHA-256 digests. Do not silently sort or normalize invalid input.

- [ ] **Step 5: Implement exact cluster-review evidence derivation**

Add `deriveClusterSourceEvidence` beside the existing ledger function. It must verify:

1. every declared cluster exists exactly once;
2. `clusterSetId`, `clusterDigest`, and `synthesisDecision === "candidate"` match;
3. every member review exists exactly once and its digest matches;
4. every review declares `copiedSourceProse === false` and `promotionClaim === false`;
5. the union of member source ids equals `contract.sourceIds` exactly;
6. no source occurs in more than one selected cluster.

Return the five-field object named in the interface without mutating any input.

- [ ] **Step 6: Teach promotion receipt construction to select the evidence mode**

In `buildSkillReceipt`, read `artifacts/corpus/cluster-evidence.jsonl` and `artifacts/corpus/review-evidence.jsonl` only when the contract declares cluster-review evidence. Use `deriveClusterSourceEvidence` in that branch. Continue reading and using `provenance/source-ledger.jsonl` for historical contracts.

For cluster mode only, add these exact fields under `receipt.evidence`:

```js
{
  sourceEvidenceMode: "cluster-review-v1",
  clusterIds: [
    "agency-operational-state",
    "client-deliverable-construction",
    "prospect-assessment-depth",
  ],
}
```

Do not add new fields to ledger-mode receipts so all seven existing promotion receipts remain deterministic.

- [ ] **Step 7: Run focused and historical receipt verification**

Run:

```powershell
node --test tests/schema.test.mjs tests/provenance-evidence.test.mjs tests/cluster-promotion-evidence.test.mjs
node scripts/verify-skill-receipt.mjs --skill skills/eternities-muse --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-muse.json
node scripts/verify-skill-receipt.mjs --skill skills/eternities-forge --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-forge.json
```

Expected: focused tests pass and both historical receipts remain exact.

- [ ] **Step 8: Commit**

```powershell
git add src/schema.mjs src/provenance-evidence.mjs scripts/evaluate-skill.mjs tests/schema.test.mjs tests/provenance-evidence.test.mjs tests/cluster-promotion-evidence.test.mjs
git commit -m "feat: certify cluster-backed promotion evidence"
```

---

### Task 2: Agora portable core and capability contract

**Files:**
- Create: `skills/eternities-agora/SKILL.md`
- Create: `skills/eternities-agora/references/operating-contract.md`
- Create: `skills/eternities-agora/references/capability-contract.json`
- Create: `tests/agora-godskill.test.mjs`

**Interfaces:**
- Consumes: the approved Agora spec and Task 1 cluster-review evidence contract.
- Produces: one compact agent-neutral entrypoint, one detailed operating contract, and one valid three-route composition contract.

- [ ] **Step 1: Write failing entrypoint and contract tests**

Create `tests/agora-godskill.test.mjs` with frontmatter parsing and exact assertions:

```js
assert.equal(frontmatter.name, "eternities-agora");
assert.match(frontmatter.description, /agency|client/i);
assert.match(frontmatter.description, /do not use/i);
assert.match(markdown, /references\/operating-contract\.md/);
assert.doesNotThrow(() => validateCapabilityContract(contract));
assert.doesNotThrow(() => validateCompositionContract(contract));
assert.deepEqual(contract.routes.map(({ id }) => id), [
  "prospect-assessment",
  "account-operations",
  "client-deliverables",
]);
assert.equal(contract.routes.some(({ delegates }) => delegates.includes(contract.name)), false);
```

Assert the source ids equal these seven exact reviewed members and no deferred source appears:

```js
[
  "skill-01b3dd8d8b2e3347",
  "skill-50183bf171c8cfeb",
  "skill-6f9529112807c946",
  "skill-8ea282b5eae0cd7a",
  "skill-922f3f027d2021e7",
  "skill-ea63f2d03890111b",
  "skill-eb5ed7a3910e2cc4",
]
```

- [ ] **Step 2: Run the red test**

Run:

```powershell
node --test tests/agora-godskill.test.mjs
```

Expected: file-not-found failures for the new skill.

- [ ] **Step 3: Write the compact entrypoint**

Keep `SKILL.md` below 4,000 estimated tokens and include:

- discriminating frontmatter;
- route-first selection among the three dominant routes;
- the seven route scopes or modes;
- the ten shared laws from the spec in compact form;
- exact handoff boundaries;
- explicit legal, financial, KYC, runtime-administration, and external-communication exclusions;
- one termination section prohibiting recursive or background operation.

The frontmatter description must be independently worded and must not require `Agora`, `eternities`, a slash command, or one runtime name in the user's request.

- [ ] **Step 4: Write the detailed operating contract**

Move route mechanics, evidence classes, identity reconciliation, score coverage, state-contract fields, proposal and report data contracts, handoff artifacts, failure behavior, and acceptance checklists into `references/operating-contract.md`. The entrypoint links this file only for consequential or multi-scope work.

- [ ] **Step 5: Write the capability contract**

Use `id: "godskill-eternities-agora-v1"`, `name: "eternities-agora"`, category `agency-client-services`, effects `read` and `write`, `explicitOnly: false`, the seven exact source ids, and this exact source-evidence block:

```json
{
  "mode": "cluster-review-v1",
  "clusterSetId": "agency-client-services-clusters-v1",
  "clusters": [
    {
      "id": "agency-operational-state",
      "digest": "bc995745d1abe8130b6e70e0de497f05a5d8a93600a79611fddeff30dc3c841d"
    },
    {
      "id": "client-deliverable-construction",
      "digest": "438c10e4d01b0da3a784137822e72efb4ebab3201acc96335b67760513946d8b"
    },
    {
      "id": "prospect-assessment-depth",
      "digest": "1648c19ae0c7229dc71bd0d5f2674da11e8b65e36860ab9052c8f56a3b393dd2"
    }
  ]
}
```

Declare logical bindings for research, authority review, document rendering, implementation, and verification. Route delegates may identify existing exact capabilities, but no route delegates to `eternities-agora`.

- [ ] **Step 6: Run focused tests and token measurement**

Run:

```powershell
node --test tests/agora-godskill.test.mjs tests/schema.test.mjs tests/composition.test.mjs
node -e "const fs=require('node:fs');const s=fs.readFileSync('skills/eternities-agora/SKILL.md','utf8').replace(/\r\n/g,'\n');console.log(Math.ceil(Buffer.byteLength(s,'utf8')/4))"
```

Expected: all tests pass and the printed count is at most 4,000.

- [ ] **Step 7: Commit**

```powershell
git add skills/eternities-agora tests/agora-godskill.test.mjs
git commit -m "feat: define Eternities Agora godskill"
```

---

### Task 3: Commandless candidate routing card

**Files:**
- Create: `skills/eternities-agora/references/routing-card.json`
- Create: `tests/agora-routing.test.mjs`

**Interfaces:**
- Consumes: the stable Task 2 entrypoint token count and portable routing contracts.
- Produces: one validated moderate-risk routing card that selects Agora from unnamed outcomes without entering the live promoted-card index yet.

- [ ] **Step 1: Write failing routing-card tests**

Validate the card, then assert these exact properties:

```js
assert.equal(card.id, "eternities-agora");
assert.equal(card.family, "agency-client-services");
assert.deepEqual(card.provides, [
  "account-operations",
  "client-deliverables",
  "client-service-governance",
  "evidence-traceability",
  "prospect-assessment",
]);
assert.deepEqual(card.effects, ["local-read", "local-write"]);
assert.equal(card.riskClass, "moderate");
assert.equal(card.entrypoint, "skills/eternities-agora/SKILL.md");
```

Add one direct, one paraphrased, and one contextual envelope with the same required capabilities. Assert all three select only Agora, all outcomes omit `/`, `eternities`, and `agora`, and clearing `legacyAliases` yields a deeply equal receipt.

Add refusal cases proving:

- external write is not permitted by the card;
- legal, KYC, and financial capabilities are not provided;
- `maximumRisk: "low"` rejects the card;
- missing local-write authority returns no qualified route;
- unresolved commercial policy returns `needs-decision`.

- [ ] **Step 2: Run the red test**

Run:

```powershell
node --test tests/agora-routing.test.mjs
```

Expected: file-not-found failure for `routing-card.json`.

- [ ] **Step 3: Write the compact card**

Use family `agency-client-services`, no requirements, no conflicts, verified source evidence only after Task 1 reconciliation, and these sorted compatibility ids:

```json
[
  "eternities-aegis",
  "eternities-architect",
  "eternities-forge",
  "eternities-oracle"
]
```

Set `contextCost` to the exact integer printed by the Task 2 measurement command. Set `dependencyCost` to 5. Keep `legacyAliases` empty unless an adapter later adds a separately tested compatibility layer.

- [ ] **Step 4: Run candidate routing tests**

Run:

```powershell
node --test tests/agora-routing.test.mjs tests/routing-contracts.test.mjs tests/router.test.mjs
```

Expected: all tests pass without rebuilding `artifacts/routing`.

- [ ] **Step 5: Commit**

```powershell
git add skills/eternities-agora/references/routing-card.json tests/agora-routing.test.mjs
git commit -m "feat: route Eternities Agora from ordinary outcomes"
```

---

### Task 4: Evaluation suite and deterministic promotion

**Files:**
- Create: `skills/eternities-agora/evals/cases.json`
- Create: `skills/eternities-agora/references/mining-receipt.md`
- Modify: `tests/agora-godskill.test.mjs`
- Create: `receipts/promotions/eternities-agora.json`

**Interfaces:**
- Consumes: the Task 1 evidence mode, Task 2 core, Task 3 routing card, `policies/promotion.v1.json`, and exact cluster artifacts.
- Produces: an all-critical evaluation and deterministic `promoted` receipt if every gate passes.

- [ ] **Step 1: Write the failing evaluation assertions**

Extend `tests/agora-godskill.test.mjs` with an `evaluate()` helper matching the existing Muse pattern. Assert the suite contains all seven outcomes:

```js
[
  "route:prospect-assessment:rapid-screen",
  "route:prospect-assessment:multidimensional",
  "route:account-operations:portfolio-pipeline",
  "route:account-operations:client-account",
  "route:account-operations:operational-rollup",
  "route:client-deliverables:service-proposal",
  "route:client-deliverables:client-report",
]
```

Assert it also contains `skip`, `defer:eternities-oracle`, `defer:eternities-aegis`, `defer:eternities-forge`, `defer:document-rendering`, `refuse:legal-boundary`, `refuse:financial-boundary`, `refuse:regulated-identity-boundary`, `refuse:external-authority-required`, and `refuse:runtime-administration-boundary`.

- [ ] **Step 2: Run the red evaluation test**

Run:

```powershell
node --test tests/agora-godskill.test.mjs
```

Expected: file-not-found failure for `evals/cases.json`.

- [ ] **Step 3: Author the all-critical cases**

Create 29 critical cases:

- 7 direct cases, one for each scope or mode;
- 7 paraphrases, one for each scope or mode;
- 3 contextual cases, one per dominant route, recorded under kind `paraphrase` for policy scoring;
- 3 exclusions for routine contact lookup, one status edit, and a simple copy change;
- 9 conflicts covering Oracle research, Aegis authority, Forge implementation, exact document rendering, legal work, financial planning, regulated identity screening, external communication, and runtime administration.

Use a baseline named `unbounded-agency-operator`, token count 7,200, and source coverage 1. Its results collapse most requests into one generic account route and therefore fail route separation, exclusions, and boundaries. The candidate results must match all 29 expected values exactly and declare no unresolved effects.

- [ ] **Step 4: Write the mining receipt**

Record:

- the three exact candidate cluster ids and digests;
- all seven selected source ids and review-digest lineage;
- all four deferred cluster ids and why they remain excluded;
- independently expressed mechanisms only;
- no source prose copied;
- no third-party code executed;
- the exact focused, promotion, receipt-verification, and full-suite commands;
- proof limits for live-model routing, commercial outcomes, current external evidence, and renderer correctness.

- [ ] **Step 5: Run the candidate evaluation test**

Run:

```powershell
node --test tests/agora-godskill.test.mjs tests/agora-routing.test.mjs tests/cluster-promotion-evidence.test.mjs
```

Expected: all candidate cases pass, token count is at most 4,000, and `decidePromotion()` returns `promoted` in memory.

- [ ] **Step 6: Generate and verify the exact promotion receipt**

Run:

```powershell
node scripts/evaluate-skill.mjs --skill skills/eternities-agora --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-agora.json
node scripts/verify-skill-receipt.mjs --skill skills/eternities-agora --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-agora.json
```

Expected: `decision.status` is `promoted`, all 29 critical cases pass, source coverage is 7, source evidence mode is `cluster-review-v1`, the three cluster ids reconcile, and the verification command reports `valid: true`.

- [ ] **Step 7: Commit**

```powershell
git add skills/eternities-agora/evals/cases.json skills/eternities-agora/references/mining-receipt.md tests/agora-godskill.test.mjs receipts/promotions/eternities-agora.json
git commit -m "feat: promote Eternities Agora godskill"
```

---

### Task 5: Preserve router v1 and certify the eight-card live index

**Files:**
- Create: `artifacts/checkpoints/agent-native-router-v1/`
- Modify: `receipts/agent-native-router-v1.json`
- Modify: `tests/agent-native-routing-certification.test.mjs`
- Modify: `tests/promoted-routing-cards.test.mjs`
- Create: `tests/agent-native-router-v2.test.mjs`
- Create: `receipts/agent-native-router-v2.json`
- Modify: `artifacts/routing/cards.jsonl`
- Modify: `artifacts/routing/family-map.json`
- Modify: `artifacts/routing/manifest.json`

**Interfaces:**
- Consumes: the promoted Agora receipt and routing card.
- Produces: an immutable seven-card v1 checkpoint and a live eight-card v2 index with 24 commandless route cases.

- [ ] **Step 1: Freeze router v1 before changing live artifacts**

Copy the current committed `artifacts/routing` tree byte-for-byte to
`artifacts/checkpoints/agent-native-router-v1`. Verify these exact hashes before
continuing:

```text
cards.jsonl      e0ce6d77c10143230c445854b0f04fc3f746b981b502d1eb8aab6cb46dbeb98c
family-map.json  b64e16fb7d5917bb25c8d52701c3bdf828d0a825995d2b8fc51863c3fb873307
manifest.json    3adefe27f14a3f819f5adeb60748a5a5d23cace060da62b5fe10e2539b54a09a
```

Add `checkpointRoot: "artifacts/checkpoints/agent-native-router-v1"` to the v1 receipt. Update only the v1 certification test's artifact reads so the existing seven-card receipt validates the checkpoint rather than mutable live output.

- [ ] **Step 2: Write failing promoted-card and v2 tests**

Update the exact promoted id list to include `eternities-agora`. Add its ordinary-outcome envelope to `tests/promoted-routing-cards.test.mjs`.

Create `tests/agent-native-router-v2.test.mjs` by validating all eight promoted cards with direct, paraphrased, and contextual forms. Assert:

- 24 commandless cases select exact single cards;
- removing every alias produces deeply equal receipts;
- a 5,000-card catalog shortlists at most 32;
- only the selected entrypoint path appears in a selected receipt;
- Agora cannot route with external write, low maximum risk, or missing authority;
- unresolved decisions return `needs-decision`;
- the v2 receipt reconciles live artifacts exactly.

- [ ] **Step 3: Run the red routing tests**

Run:

```powershell
node --test tests/agent-native-routing-certification.test.mjs tests/promoted-routing-cards.test.mjs tests/agent-native-router-v2.test.mjs
```

Expected: v1 passes against its checkpoint; promoted-card and v2 tests fail because live routing artifacts and the v2 receipt still contain seven cards or do not exist.

- [ ] **Step 4: Build live routing artifacts twice**

Run:

```powershell
npm run build:routing
npm run build:routing
```

Expected: both outputs report 8 cards and 8 families with identical `cardsSha256` and `familyMapSha256` values.

- [ ] **Step 5: Create the deterministic v2 receipt**

Record:

- schema version and id `agent-native-router-v2`;
- immutable Git base equal to the Task 4 promotion commit;
- all eight manifest input rows;
- exact cards, family-map, and manifest hashes;
- card count 8 and family count 8;
- 24 commandless and 24 alias-removal cases;
- maximum shortlist 32 and maximum composition 3;
- all authority, effects, selected-entrypoint, bounded-disclosure, and unresolved-decision gates;
- the proof limit `liveModelNaturalLanguageInterpretation: "adapter-evaluation-required"`;
- no timestamp.

- [ ] **Step 6: Run focused routing verification**

Run:

```powershell
node --test tests/agent-native-routing-certification.test.mjs tests/promoted-routing-cards.test.mjs tests/agent-native-router-v2.test.mjs tests/agora-routing.test.mjs tests/router.test.mjs tests/routing-index.test.mjs tests/routing-transport.test.mjs
```

Expected: all v1, v2, promoted-card, candidate, index, transport, and authority tests pass.

- [ ] **Step 7: Commit**

```powershell
git add artifacts/checkpoints/agent-native-router-v1 artifacts/routing receipts/agent-native-router-v1.json receipts/agent-native-router-v2.json tests/agent-native-routing-certification.test.mjs tests/promoted-routing-cards.test.mjs tests/agent-native-router-v2.test.mjs
git commit -m "docs: certify Agora agent-native routing"
```

---

### Task 6: Corpus synthesis, evaluation, and promotion evidence

**Files:**
- Create: `src/refinery-candidates.mjs`
- Create: `syntheses/eternities-agora.v1.json`
- Create: `tests/refinery-candidates.test.mjs`
- Modify: `src/coverage.mjs`
- Modify: `scripts/build-corpus-coverage.mjs`
- Modify: `tests/body-audit.test.mjs`
- Modify: `artifacts/corpus/coverage-ledger.jsonl`
- Modify: `artifacts/corpus/coverage-summary.json`
- Create: `artifacts/corpus/candidate-evidence.jsonl`
- Modify: affected family queue and packet artifacts under `artifacts/corpus/families/`

**Interfaces:**
- Consumes: exact cluster rows, exact review rows, the Agora synthesis declaration, and the exact Agora promotion receipt.
- Produces: `validateCandidateEvidence(record, clusterRows, reviewRows, promotionReceipt)` and honest cumulative source states through promotion.

- [ ] **Step 1: Write failing candidate-evidence tests**

Create a two-source fixture and assert that exact synthesis evidence advances only its members:

```js
const candidate = validateCandidateEvidence(record, [cluster], reviews, promotionReceipt);
const rows = buildCoverageRows(
  sources,
  bodies,
  provenance,
  reviews,
  [cluster],
  [candidate],
);
assert.equal(rows.every(({ evidence }) => evidence.synthesized), true);
assert.equal(rows.every(({ evidence }) => evidence.evaluated), true);
assert.equal(rows.every(({ evidence }) => evidence.promoted), true);
```

Reject unknown clusters, stale cluster digests, source-union drift, copied prose, a missing skill path, stale promotion receipt hash, mismatched receipt source ids, non-evaluated candidate status, and non-promoted decision status. Add a fixture proving an unpromoted exact candidate can be `synthesized` without being `evaluated` or `promoted`.

- [ ] **Step 2: Run the red candidate tests**

Run:

```powershell
node --test tests/refinery-candidates.test.mjs tests/coverage.test.mjs
```

Expected: module-not-found failure and no candidate parameter support in coverage rows.

- [ ] **Step 3: Write the Agora synthesis declaration**

Create `syntheses/eternities-agora.v1.json` with:

- candidate id and family;
- skill, capability-contract, routing-card, evaluation, and promotion-receipt relative paths;
- the three exact cluster ids and digests;
- all seven exact source ids;
- `copiedSourceProse: false`;
- `externalMutation: false`;
- independent synthesis method identifier;
- no timestamp.

- [ ] **Step 4: Implement candidate validation and loading**

`validateCandidateEvidence` must verify all referenced files are normalized repository-relative files, hashes match exact bytes, source union equals cluster membership, all review digests remain exact, and the promotion receipt reconciles the candidate id and source ids.

Normalize one deterministic row from this exact structure:

```js
const normalizedWithoutDigest = {
  schemaVersion: 1,
  candidateId: "eternities-agora",
  familyId: "agency-client-services",
  sourceIds: [
    "skill-01b3dd8d8b2e3347",
    "skill-50183bf171c8cfeb",
    "skill-6f9529112807c946",
    "skill-8ea282b5eae0cd7a",
    "skill-922f3f027d2021e7",
    "skill-ea63f2d03890111b",
    "skill-eb5ed7a3910e2cc4",
  ],
  clusterIds: [
    "agency-operational-state",
    "client-deliverable-construction",
    "prospect-assessment-depth",
  ],
  evaluated: true,
  promoted: true,
};
const normalized = {
  ...normalizedWithoutDigest,
  synthesisDigest: sha256(JSON.stringify(normalizedWithoutDigest)),
};
```

The implementation must emit that exact identity set and derived digest and must reject unresolved values.

- [ ] **Step 5: Extend cumulative coverage**

Add `candidateRows = []` as the sixth `buildCoverageRows` parameter. Map every candidate source exactly once and require reviewed plus clustered evidence before setting:

- `synthesized: true` for exact candidate membership;
- `evaluated: true` only when the exact receipt candidate has status `evaluated`;
- `promoted: true` only when the exact receipt decision is `promoted`.

Reject duplicate candidate membership, unknown source ids, stage inversion, or receipt/source drift.

Teach `build-corpus-coverage.mjs` to load `syntheses/*.json`, promotion receipts, and candidate evidence. Write deterministic `candidate-evidence.jsonl` and add `candidateEvidenceSha256` to the live summary. Omitted candidate paths in temporary tests produce an empty deterministic artifact and no invented state.

- [ ] **Step 6: Rebuild live coverage twice**

Run:

```powershell
node --test tests/refinery-candidates.test.mjs tests/coverage.test.mjs tests/body-audit.test.mjs tests/corpus-refinery-certification.test.mjs
npm run build:coverage
npm run build:coverage
```

Expected: both builds are byte-identical; exact totals become 7 synthesized, 7 evaluated, and 7 promoted while 12 remain clustered and the immutable foundation receipt still passes.

- [ ] **Step 7: Commit**

```powershell
git add src/refinery-candidates.mjs syntheses/eternities-agora.v1.json tests/refinery-candidates.test.mjs src/coverage.mjs scripts/build-corpus-coverage.mjs tests/body-audit.test.mjs artifacts/corpus
git commit -m "feat: certify Agora corpus promotion evidence"
```

---

### Task 7: Agora release certification and local handoff

**Files:**
- Modify: `README.md`
- Create: `docs/eternities-agora-report.md`
- Create: `receipts/eternities-agora-release.json`
- Create: `tests/eternities-agora-release.test.mjs`

**Interfaces:**
- Consumes: all Agora core, routing, evaluation, promotion, corpus, and immutable checkpoint evidence.
- Produces: a deterministic local release verdict and an explicit integration boundary with no activation.

- [ ] **Step 1: Write failing release-certification assertions**

Assert the release receipt reconciles:

- one added godskill and eight total promoted capabilities;
- three selected clusters, seven exact sources, and four deferred clusters;
- three routes and seven scopes or modes;
- all 29 critical cases;
- entrypoint token count at or below 4,000;
- promoted receipt status and digest;
- router v1 checkpoint validity and router v2 eight-card validity;
- corpus totals of 12 clustered and 7 synthesized, evaluated, and promoted;
- zero composition cycles and no self-route;
- no copied source prose, global activation, profile mutation, publication, push, deployment, external write, or Pantheon enablement;
- no timestamp.

- [ ] **Step 2: Run the red certification test**

Run:

```powershell
node --test tests/eternities-agora-release.test.mjs
```

Expected: file-not-found failures for the release receipt and report.

- [ ] **Step 3: Write the exact report and receipt**

Update README with exact current counts and a concise Agora section. The report must describe routes, measured evaluation, source evidence, routing evidence, corpus-state advancement, deferred boundaries, token cost, proof limits, and the absence of activation.

Set release status to `certified-local-candidate` only when all deterministic gates pass. State explicitly that live-model interpretation, commercial performance, external evidence freshness, rendered-document correctness, and production operation remain unproven.

- [ ] **Step 4: Run fresh full verification**

Run:

```powershell
npm test
npm run build:routing
npm run build:coverage
node scripts/verify-skill-receipt.mjs --skill skills/eternities-agora --policy policies/promotion.v1.json --receipt receipts/promotions/eternities-agora.json
git diff --check
git status --short
```

Expected: zero failed and zero skipped tests, deterministic eight-card routing hashes, deterministic corpus hashes, a valid Agora promotion receipt, no whitespace errors, no global link or profile mutation, and only planned branch files changed.

- [ ] **Step 5: Review the complete branch**

Use `requesting-code-review` against the complete Agora diff. Resolve every confirmed critical or important defect through a new failing test and the smallest corrective change. Re-run Step 4 after any correction.

- [ ] **Step 6: Commit the certified local release**

```powershell
git add README.md docs/eternities-agora-report.md receipts/eternities-agora-release.json tests/eternities-agora-release.test.mjs
git commit -m "docs: certify Eternities Agora local release"
```

- [ ] **Step 7: Prepare the integration decision without mutating canonical state**

Use `finishing-a-development-branch` to report the exact branch, commit range, verification evidence, missing remote, absence of activation, and available integration choices. Do not merge, push, publish, activate, or delete the worktree without explicit user direction.

## Execution order

Tasks 1 through 4 are sequential because promotion depends on exact cluster evidence, a stable core, and a pre-existing commandless routing card. Task 5 follows promotion because router v2 is the promoted-card index. Task 6 follows the exact promotion receipt because corpus stages must not be inferred. Task 7 is the only release-completion gate.

No task is safe for parallel execution against shared files in this worktree. Inline execution is the recommended mode.
