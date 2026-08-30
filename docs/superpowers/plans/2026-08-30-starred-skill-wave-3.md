# Starred Skill Wave 3 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Account for all 9,100 newly acquired skill bodies, merge their safe cold evidence into the certified atlas, and promote only the mission-stack, agentic-ci, and model-compute capabilities that pass first-party evaluations.

**Architecture:** Build a canonical wave-3 snapshot from the already acquired D-drive repositories, combine it with immutable wave-2 evidence through exact digests, and retain every third-party body as inert provenance. Add one cross-system mission-stack receipt, one bounded Aegis route, and one provider-neutral Hephaestus Godskill, then rebuild commandless routing and terminal certification.

**Tech Stack:** Node.js 24 ESM, JSON and JSONL evidence, SHA-256 receipts, `node:test`, existing Godskills router and refinery contracts.

**Spec:** `docs/superpowers/specs/2026-08-30-starred-skill-wave-3-design.md`

## Global Constraints

- Process exactly twenty-one acquired repository identities from `D:\03-ARSENAL\warehouse\from-stars`.
- Begin from the verified intake count of 9,100 raw `SKILL.md` paths and fail on unexplained drift.
- Execute no third-party repository code, installer, hook, package, binary, MCP server, or skill instruction.
- Copy no third-party prose into promoted Godskills.
- Preserve exact source ids, remotes, heads, file and body digests, license signals, security findings, and uncertainty.
- Preserve all wave-2 v1 artifacts byte-for-byte.
- Keep cold source bodies out of runtime prompts and mission-stack receipts.
- Do not grant authority through discovery, routing, composition, or model selection.
- Perform no download, purchase, deployment, publication, external mutation, credential use, or global activation.

---

### Task 1: Exact Wave 3 Snapshot

**Files:**
- Create: `data/github-skill-quarry-wave-3.json`
- Create: `src/quarry-snapshot.mjs`
- Create: `scripts/build-quarry-wave-3.mjs`
- Generate: `artifacts/github-wave-3/source-records.jsonl`
- Generate: `artifacts/github-wave-3/repository-file-manifests.jsonl`
- Generate: `artifacts/github-wave-3/duplicate-groups.json`
- Generate: `receipts/github-skill-quarry-wave-3.json`
- Test: `tests/quarry-wave-3-snapshot.test.mjs`

**Interfaces:**
- Consumes: `buildQuarrySnapshot({ manifest, repositoryRoot })` where `manifest.entries` names exact `fullName`, `head`, `license`, and `disposition` values.
- Produces: `{ rows, sourceRecords, repositoryFileRows, duplicateGroups, summary }` with stable lexical ordering and exact SHA-256 evidence.

- [ ] **Step 1: write failing snapshot fixtures**

```js
test("snapshot binds exact remote head and every skill body", async () => {
  const result = await buildQuarrySnapshot({ manifest: fixtureManifest, repositoryRoot: fixtureRoot });
  assert.equal(result.summary.repositories, 2);
  assert.equal(result.summary.skillBodies, 3);
  assert.equal(result.summary.verifiedRepositories, 2);
});

test("snapshot fails on dirty checkout head drift and unreadable files", async () => {
  await assert.rejects(() => buildQuarrySnapshot({ manifest: dirtyManifest, repositoryRoot: fixtureRoot }), /dirty repository/);
  await assert.rejects(() => buildQuarrySnapshot({ manifest: staleManifest, repositoryRoot: fixtureRoot }), /head mismatch/);
});
```

- [ ] **Step 2: run the focused test and observe the missing-module failure**

Run: `node --test tests/quarry-wave-3-snapshot.test.mjs`

Expected: FAIL because `src/quarry-snapshot.mjs` does not exist.

- [ ] **Step 3: implement the snapshot model**

```js
export async function buildQuarrySnapshot({ manifest, repositoryRoot }) {
  validateManifest(manifest);
  const rows = [];
  for (const entry of manifest.entries) {
    rows.push(await inspectExactRepository({ entry, repositoryRoot }));
  }
  return reconcileSnapshot(rows);
}
```

Require path containment, canonical remote identity, exact head, clean status, no submodule initialization, non-Git file manifests, stable source ids, and explicit read failures.

- [ ] **Step 4: run focused tests**

Run: `node --test tests/quarry-wave-3-snapshot.test.mjs`

Expected: PASS.

- [ ] **Step 5: build the real snapshot twice**

Run: `node scripts/build-quarry-wave-3.mjs`

Expected: twenty-one verified repositories, exactly 9,100 skill source records, zero unresolved repositories.

Run the same command again and require byte-identical artifacts except a prohibited generated timestamp. The committed receipt must therefore contain no volatile timestamp.

- [ ] **Step 6: commit**

```powershell
git add data/github-skill-quarry-wave-3.json src/quarry-snapshot.mjs scripts/build-quarry-wave-3.mjs tests/quarry-wave-3-snapshot.test.mjs artifacts/github-wave-3 receipts/github-skill-quarry-wave-3.json
git commit -m "data: certify starred skill wave three"
```

### Task 2: Security and Structural Evidence

**Files:**
- Modify: `scripts/extract-quarry-body-structures.mjs`
- Create: `scripts/build-quarry-wave-3-evidence.mjs`
- Generate: `artifacts/github-wave-3/skill-security-ledger.jsonl`
- Generate: `artifacts/github-wave-3/body-structures.jsonl`
- Generate: `receipts/github-wave-3-skill-security.json`
- Generate: `receipts/github-wave-3-structural-evidence.json`
- Test: `tests/quarry-wave-3-evidence.test.mjs`

**Interfaces:**
- Consumes: exact wave-3 source records.
- Produces: one security row per source id and one bounded structure row per canonical body digest.

- [ ] **Step 1: write failing evidence tests**

```js
test("wave three evidence covers every source and keeps blocked content explicit", async () => {
  const result = await buildWaveThreeEvidence({ root: fixtureRoot, write: false });
  assert.equal(result.security.totalSources, result.sources.length);
  assert.equal(result.structures.canonicalBodyCount, new Set(result.sources.map(row => row.bodySha256)).size);
  assert.equal(result.security.targetCodeExecuted, false);
});
```

- [ ] **Step 2: run the focused test and observe failure**

Run: `node --test tests/quarry-wave-3-evidence.test.mjs`

Expected: FAIL because the wave-3 orchestrator is absent.

- [ ] **Step 3: generalize structural extraction arguments and build the orchestrator**

```js
export async function buildWaveThreeEvidence({ root = path.resolve("."), write = true } = {}) {
  const security = await buildSkillSecurityLedger({
    recordsPath: path.join(root, "artifacts/github-wave-3/source-records.jsonl"),
    ledgerPath: path.join(root, "artifacts/github-wave-3/skill-security-ledger.jsonl"),
    receiptPath: path.join(root, "receipts/github-wave-3-skill-security.json"),
  });
  const structures = await extractQuarryBodyStructures({
    recordsPath: path.join(root, "artifacts/github-wave-3/source-records.jsonl"),
    outputPath: path.join(root, "artifacts/github-wave-3/body-structures.jsonl"),
    write,
  });
  return certifyWaveThreeEvidence({ root, security, structures, write });
}
```

Treat Defender or filesystem refusals as structural scan failures with `reject-before-indexing`. Never retry by disabling Windows Security or bypassing the block.

- [ ] **Step 4: run focused tests and build real evidence**

Run: `node --test tests/quarry-wave-3-evidence.test.mjs`

Run: `node scripts/build-quarry-wave-3-evidence.mjs`

Expected: exact complete source coverage, deterministic digests, no target code execution, and explicit scan-error totals.

- [ ] **Step 5: commit**

```powershell
git add scripts/extract-quarry-body-structures.mjs scripts/build-quarry-wave-3-evidence.mjs tests/quarry-wave-3-evidence.test.mjs artifacts/github-wave-3 receipts/github-wave-3-skill-security.json receipts/github-wave-3-structural-evidence.json
git commit -m "data: inspect starred skill wave three"
```

### Task 3: Combined Cold Atlas V2

**Files:**
- Create: `src/quarry-corpus-union.mjs`
- Create: `scripts/build-quarry-infusion-v2.mjs`
- Modify: `src/quarry-atlas.mjs`
- Modify: `scripts/query-quarry-atlas.mjs`
- Generate: `artifacts/quarry-infusion-v2/*.json*`
- Generate: `receipts/quarry-total-infusion-v2.json`
- Test: `tests/quarry-corpus-union.test.mjs`
- Test: `tests/quarry-atlas-v2.test.mjs`

**Interfaces:**
- Consumes: immutable wave-2 and wave-3 source, security, and structure artifacts.
- Produces: `unionQuarryEvidence({ waves })` and a v2 atlas whose canonical body identity spans all waves.

- [ ] **Step 1: write failing cross-wave tests**

```js
test("cross-wave duplicates share one canonical body and retain every alias", () => {
  const result = unionQuarryEvidence({ waves: [waveTwo, waveThree] });
  assert.equal(result.sources.length, 4);
  assert.equal(result.canonicalBodies.length, 3);
  assert.deepEqual(result.aliasesByDigest[sharedDigest], ["wave2:a", "wave3:b"]);
});

test("union rejects duplicate source ids stale security and missing structures", () => {
  assert.throws(() => unionQuarryEvidence({ waves: [waveTwo, duplicateIdWave] }), /duplicate source id/);
});
```

- [ ] **Step 2: run tests and observe missing-module failure**

Run: `node --test tests/quarry-corpus-union.test.mjs tests/quarry-atlas-v2.test.mjs`

- [ ] **Step 3: implement exact union and v2 infusion**

```js
export function unionQuarryEvidence({ waves }) {
  const sources = uniqueSources(waves.flatMap(wave => wave.sources));
  const securityRows = reconcileSecurity(sources, waves.flatMap(wave => wave.securityRows));
  const bodyStructures = reconcileStructures(sources, waves.flatMap(wave => wave.bodyStructures));
  return { sources, securityRows, bodyStructures, aliasesByDigest: aliases(sources) };
}
```

Generate a v2 receipt binding both wave receipts and every v2 artifact. Preserve v1 paths and bytes.

- [ ] **Step 4: make v2 the verified default atlas**

Update `loadVerifiedAtlas()` so the default points to `receipts/quarry-total-infusion-v2.json`, while an explicit v1 receipt remains loadable for historical verification.

- [ ] **Step 5: build twice and run focused tests**

Run: `node scripts/build-quarry-infusion-v2.mjs`

Run: `node --test tests/quarry-corpus-union.test.mjs tests/quarry-atlas-v2.test.mjs tests/quarry-atlas.test.mjs tests/quarry-total-infusion-certification.test.mjs`

Expected: zero unresolved sources, exact cross-wave duplicate folding, bounded five-card retrieval, v1 regression green.

- [ ] **Step 6: commit**

```powershell
git add src/quarry-corpus-union.mjs scripts/build-quarry-infusion-v2.mjs src/quarry-atlas.mjs scripts/query-quarry-atlas.mjs tests/quarry-corpus-union.test.mjs tests/quarry-atlas-v2.test.mjs artifacts/quarry-infusion-v2 receipts/quarry-total-infusion-v2.json
git commit -m "feat: unify the cold skill atlas"
```

### Task 4: Mission Skill Stack Receipt

**Files:**
- Create: `src/mission-skill-stack.mjs`
- Create: `runtime/mission-skill-stack.schema.json`
- Create: `runtime/mission-skill-stack.md`
- Test: `tests/mission-skill-stack.test.mjs`

**Interfaces:**
- Consumes: `compileMissionSkillStack({ missionId, projectFingerprint, requestEnvelope, routeReceipt, cards, entrypointDigests })`.
- Produces: a canonical JSON-safe stack receipt and `diffMissionSkillStacks(previous, current)`.

- [ ] **Step 1: write failing receipt tests**

```js
test("mission stack binds only selected exact contracts and preserves authority", () => {
  const receipt = compileMissionSkillStack(fixtures());
  assert.deepEqual(receipt.selectedIds, ["eternities-aegis"]);
  assert.equal(receipt.permittedEffects.includes("external-write"), false);
  assert.match(receipt.stackDigest, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(receipt).includes("sourceBody"), false);
});

test("mission stack rejects a forged route and stale entrypoint digest", () => {
  assert.throws(() => compileMissionSkillStack(forgedFixtures()), /route receipt mismatch/);
});
```

- [ ] **Step 2: run the test and observe missing-module failure**

Run: `node --test tests/mission-skill-stack.test.mjs`

- [ ] **Step 3: implement canonical compilation and diff**

```js
export function compileMissionSkillStack(input) {
  const route = validateRouteReceipt(input.routeReceipt);
  const selected = reconcileSelectedCards(route, input.cards, input.entrypointDigests);
  return sealCanonicalStack({ ...boundedMissionFields(input), selected });
}

export function diffMissionSkillStacks(previous, current) {
  return canonicalDiff(previous, current, ["selectedIds", "uncoveredCapabilities", "authority", "effects", "risk", "contextCost"]);
}
```

- [ ] **Step 4: run focused tests**

Run: `node --test tests/mission-skill-stack.test.mjs tests/router.test.mjs tests/routing-contracts.test.mjs`

Expected: PASS with deterministic receipt bytes and tamper rejection.

- [ ] **Step 5: commit**

```powershell
git add src/mission-skill-stack.mjs runtime/mission-skill-stack.schema.json runtime/mission-skill-stack.md tests/mission-skill-stack.test.mjs
git commit -m "feat: compile mission skill stacks"
```

### Task 5: Aegis Agentic CI Route

**Files:**
- Modify: `skills/eternities-aegis/SKILL.md`
- Modify: `skills/eternities-aegis/references/operating-contract.md`
- Create: `skills/eternities-aegis/references/agentic-ci-audit.md`
- Modify: `skills/eternities-aegis/evals/cases.json`
- Create: `artifacts/aegis/agentic-ci-synthesis.v1.json`
- Create: `scripts/build-aegis-agentic-ci-receipt.mjs`
- Generate: `receipts/promotions/eternities-aegis-v4.json`
- Test: `tests/eternities-aegis-agentic-ci.test.mjs`

**Interfaces:**
- Consumes: authorized local or remote workflow evidence and exact source scope.
- Produces: source-to-sink findings, amplifying configurations, rejected hypotheses, mitigations, residual risk, and explicit action disposition.

- [ ] **Step 1: write failing positive and negative fixtures**

Cover direct event interpolation, environment indirection, runtime GitHub fetch, privileged PR checkout, AI-output evaluation, dangerous sandbox plus injection, wildcard allowlist without injection, clean pinned workflow, one-level local reusable workflow, and unresolved remote reference.

- [ ] **Step 2: run the focused test and observe missing-route failure**

Run: `node --test tests/eternities-aegis-agentic-ci.test.mjs`

- [ ] **Step 3: independently implement the route contract**

The route must require a complete trace:

```text
attacker-controlled source
  -> parse or runtime transport
  -> intermediate environment, output, file, log, or fetch
  -> ai prompt or execution sink
  -> available authority and consequence
```

Configuration weaknesses without a proven source-to-sink path remain amplifiers, not fabricated injection findings.

- [ ] **Step 4: evaluate and build the v4 receipt**

Run: `node scripts/build-aegis-agentic-ci-receipt.mjs`

Expected: every critical direct, paraphrase, exclusion, conflict, and authority case passes; prior Aegis receipts remain immutable.

- [ ] **Step 5: run focused regression**

Run: `node --test tests/eternities-aegis-agentic-ci.test.mjs tests/godskills.test.mjs tests/skill-supply-chain-defense.test.mjs`

- [ ] **Step 6: commit**

```powershell
git add skills/eternities-aegis artifacts/aegis/agentic-ci-synthesis.v1.json scripts/build-aegis-agentic-ci-receipt.mjs receipts/promotions/eternities-aegis-v4.json tests/eternities-aegis-agentic-ci.test.mjs
git commit -m "feat: audit agentic ci attack paths"
```

### Task 6: Eternities Hephaestus Godskill

**Files:**
- Create: `skills/eternities-hephaestus/SKILL.md`
- Create: `skills/eternities-hephaestus/references/operating-contract.md`
- Create: `skills/eternities-hephaestus/references/capability-contract.json`
- Create: `skills/eternities-hephaestus/references/routing-card.json`
- Create: `skills/eternities-hephaestus/evals/cases.json`
- Create: `artifacts/hephaestus/synthesis.v1.json`
- Create: `scripts/build-hephaestus-receipt.mjs`
- Generate: `receipts/promotions/eternities-hephaestus.json`
- Test: `tests/eternities-hephaestus-godskill.test.mjs`

**Interfaces:**
- Consumes: task requirements, hardware and runtime constraints, comparable benchmark evidence, current official source evidence, licensing and data constraints, and permitted effects.
- Produces: qualified options, rejected options, uncertainty, measurement plan, and one recommendation or `no-qualified-option`.

- [ ] **Step 1: write the neutral contract and failing evaluation**

```json
{
  "schemaVersion": 1,
  "name": "eternities-hephaestus",
  "outcome": "select a model runtime and compute configuration from comparable evidence and explicit constraints",
  "effects": ["none", "local-read", "external-read"],
  "forbiddenEffects": ["local-write", "external-write", "purchase", "deploy", "download-model"]
}
```

Fixtures must cover local GPU fit with overhead, CPU-only fallback, edge power limits, hosted privacy refusal, multimodal compatibility, incomparable benchmarks, stale provider claims, quantization quality uncertainty, license conflict, no-qualified-option, and forbidden deployment or purchase.

- [ ] **Step 2: run the focused test and observe missing-artifact failure**

Run: `node --test tests/eternities-hephaestus-godskill.test.mjs`

- [ ] **Step 3: write the compact first-party Godskill**

The entrypoint must route through: constraint envelope, evidence comparability, capacity model, runtime compatibility, operational budget, governance boundary, measurement plan, and decision receipt. approximate formulas must be labeled estimates and cannot replace measured runtime evidence.

- [ ] **Step 4: evaluate against Oracle and Daedalus baselines**

Run: `node scripts/build-hephaestus-receipt.mjs`

Expected: all critical cases pass, no critical regression, no unresolved effects, entrypoint remains within the promotion token budget, and at least one measured improvement exists over each applicable baseline. otherwise retain the capability as experimental and do not add its routing card.

- [ ] **Step 5: run focused tests**

Run: `node --test tests/eternities-hephaestus-godskill.test.mjs tests/promotion-gate.test.mjs tests/agent-native-routing.test.mjs`

- [ ] **Step 6: commit**

```powershell
git add skills/eternities-hephaestus artifacts/hephaestus scripts/build-hephaestus-receipt.mjs receipts/promotions/eternities-hephaestus.json tests/eternities-hephaestus-godskill.test.mjs
git commit -m "feat: govern model and compute selection"
```

### Task 7: Router V8 and Terminal Certification

**Files:**
- Create: `scripts/build-router-v8-receipt.mjs`
- Create: `scripts/build-godskills-system-v3-certification.mjs`
- Modify: `package.json`
- Modify: `README.md`
- Generate: `artifacts/checkpoints/agent-native-router-v8/*`
- Generate: `artifacts/routing/*`
- Generate: `receipts/agent-native-router-v8.json`
- Generate: `receipts/godskills-system-certification-v3.json`
- Test: `tests/agent-native-router-v8.test.mjs`
- Test: `tests/godskills-system-v3-certification.test.mjs`

**Interfaces:**
- Consumes: all prior immutable certificates, wave-3 and combined-atlas receipts, mission-stack contract, Aegis v4, and Hephaestus promotion if earned.
- Produces: current routing artifacts and one terminal v3 certificate.

- [ ] **Step 1: write failing terminal tests**

Require exact current card count, commandless Hephaestus selection when promoted, Aegis agentic-ci selection, Omnibus fallback for cold version-specific specialists, mission-stack digest reconciliation, combined corpus terminal coverage, and stale artifact rejection.

- [ ] **Step 2: run tests and observe missing builders**

Run: `node --test tests/agent-native-router-v8.test.mjs tests/godskills-system-v3-certification.test.mjs`

- [ ] **Step 3: build v8 routing and v3 certification**

If Hephaestus remains experimental, v8 must preserve twenty-one promoted cards and route model-selection specialist lookup through Omnibus or Oracle. certification must record the failed promotion gate rather than fabricate a twenty-second card.

- [ ] **Step 4: run focused and full verification**

Run: `node --test tests/agent-native-router-v8.test.mjs tests/godskills-system-v3-certification.test.mjs tests/mission-skill-stack.test.mjs tests/eternities-aegis-agentic-ci.test.mjs tests/eternities-hephaestus-godskill.test.mjs`

Run: `npm test`

Expected: zero failures, exact receipts, no changed v1 history, no activation or external effects.

- [ ] **Step 5: update README and commit**

Document wave-3 corpus accounting, mission-stack transport, Aegis agentic-ci auditing, Hephaestus only if promoted, exact proof limits, and cold-by-default behavior.

```powershell
git add package.json README.md scripts/build-router-v8-receipt.mjs scripts/build-godskills-system-v3-certification.mjs tests/agent-native-router-v8.test.mjs tests/godskills-system-v3-certification.test.mjs artifacts/checkpoints/agent-native-router-v8 artifacts/routing receipts/agent-native-router-v8.json receipts/godskills-system-certification-v3.json
git commit -m "certify starred skill wave three"
```

### Task 8: Independent Review and Integration

**Files:**
- Review: every changed source, generated artifact, receipt, and documentation file.

**Interfaces:**
- Consumes: a clean feature branch with complete verification.
- Produces: reviewed integration or an exact blocker list.

- [ ] **Step 1: inspect branch scope and generated-file volume**

Run: `git diff --stat main...HEAD`

Run: `git diff --check main...HEAD`

- [ ] **Step 2: perform independent adversarial review**

Review path containment, source completeness, blocked-file handling, cross-wave deduplication, license uncertainty, source-body isolation, authority preservation, Aegis taint traces, Hephaestus evidence comparability, mission-stack tamper resistance, and proof language.

- [ ] **Step 3: fix confirmed findings and rerun full verification**

Run: `npm test`

Expected: all tests pass with zero failures after the final diff.

- [ ] **Step 4: merge only from a clean reviewed branch**

Preserve `recovery/wave2-review-tail-20260830`. do not delete or rewrite the detached wave-2 review history. remove only the wave-3 worktree and feature branch after verified integration.
