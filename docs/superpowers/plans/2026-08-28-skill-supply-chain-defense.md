# Skill Supply-Chain Defense Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dependency-free, read-only trust gate that statically scans untrusted skills, requires source-bound semantic review, and extends Aegis without activating target code.

**Architecture:** A focused scanner module produces deterministic structural and behavioral evidence from regular files under one canonical root. A separate semantic reconciler turns static evidence plus a source-bound human or agent review into an Aegis verdict, while a ledger builder applies the static gate to the exact Wave 2 source records. Existing acquisition receipts remain immutable.

**Tech Stack:** Node.js 24 ESM, built-in filesystem and crypto APIs, JSON and JSONL receipts, Node test runner

**Spec:** `docs/superpowers/specs/2026-08-28-skill-supply-chain-defense-design.md`

## Global Constraints

- Target skills are inert data. Never import, execute, install, or invoke their code.
- The scanner performs local reads only and never follows symbolic links.
- Every file, byte, and evidence count is bounded and deterministically ordered.
- Static clearance means only `clear-for-semantic-review`, never installation approval.
- Semantic review must bind the exact scan digest and body digest before promotion evidence can advance.
- No third-party prose or implementation is copied.
- No host profile or adapter is activated.

---

### Task 1: Deterministic inert scanner

**Files:**
- Create: `src/skill-supply-chain-defense.mjs`
- Create: `tests/skill-supply-chain-defense.test.mjs`

**Interfaces:**
- Consumes: `scanSkill(root: string, options?: ScanOptions): Promise<SkillScan>`
- Produces: `SkillScan` with `schemaVersion`, `root`, `manifest`, `findings`, `surfaces`, `disposition`, `requiredReview`, `summary`, and `scanDigest`

- [x] **Step 1: Write failing structural and behavior tests**

Create fixtures in temporary directories. Assert that `scanSkill()`:

```js
const result = await scanSkill(root, { maxFiles: 64, maxTotalBytes: 262144, maxFileBytes: 65536 });
assert.equal(result.disposition, "reject-before-indexing");
assert.deepEqual(result.findings.map(({ ruleId }) => ruleId), ["EXE-OBFUSCATED-PAYLOAD"]);
assert.match(result.scanDigest, /^[a-f0-9]{64}$/);
```

Cover symlink rejection, lexical escape, file/count/byte limits, decoded dynamic execution, download-and-execute, credential exfiltration, persistence, destructive behavior, prompt-boundary attacks, sensitive but documented shell use, and stable ordering.

- [x] **Step 2: Run the focused test and observe failure**

Run: `node --test tests/skill-supply-chain-defense.test.mjs`

Expected: FAIL because `src/skill-supply-chain-defense.mjs` does not exist.

- [x] **Step 3: Implement bounded traversal and evidence rules**

Export:

```js
export async function scanSkill(root, options = {}) { /* deterministic inert scan */ }
export function classifySkillEvidence({ manifest, findings, declared }) { /* disposition */ }
export function stableSkillScanDigest(scanWithoutDigest) { /* canonical SHA-256 */ }
```

Use defaults `maxFiles: 256`, `maxTotalBytes: 4_194_304`, and `maxFileBytes: 524_288`. Read regular files only. Reject every symlink and special file. Redact secret-like matched values and retain at most three line-bounded evidence snippets per rule and file.

- [x] **Step 4: Run focused tests**

Run: `node --test tests/skill-supply-chain-defense.test.mjs`

Expected: all scanner tests PASS.

- [x] **Step 5: Commit the scanner core**

```powershell
git add src/skill-supply-chain-defense.mjs tests/skill-supply-chain-defense.test.mjs
git commit -m "feat: add inert skill supply-chain scanner"
```

---

### Task 2: Source-bound semantic reconciliation and Aegis route

**Files:**
- Modify: `src/skill-supply-chain-defense.mjs`
- Modify: `skills/eternities-aegis/SKILL.md`
- Modify: `skills/eternities-aegis/references/operating-contract.md`
- Modify: `skills/eternities-aegis/references/capability-contract.json`
- Modify: `skills/eternities-aegis/evals/cases.json`
- Create: `tests/skill-supply-chain-review.test.mjs`

**Interfaces:**
- Consumes: `reconcileSkillReview(scan: SkillScan, review: SemanticSkillReview): SkillTrustDecision`
- Produces: `SkillTrustDecision` with `verdict: "APPROVE" | "CAUTION" | "REJECT"`, exact evidence digests, unresolved boundaries, and `promotionEligible`

- [x] **Step 1: Write failing semantic-binding tests**

Assert exact digest binding and fail-closed behavior:

```js
const decision = reconcileSkillReview(scan, {
  schemaVersion: 1,
  scanDigest: scan.scanDigest,
  bodyDigests: scan.manifest.map(({ path, sha256 }) => ({ path, sha256 })),
  purposeFit: "matches",
  permissionFit: "bounded",
  externalTransmission: "none",
  execution: "documented-local",
  persistence: "none",
  promptBehavior: "bounded",
  triggerScope: "bounded",
  dependencies: "reviewed",
  userControl: "explicit",
  unresolved: [],
});
assert.equal(decision.verdict, "CAUTION");
assert.equal(decision.promotionEligible, true);
```

Reject stale scan digests, stale body digests, missing review fields, unresolved critical behavior, static rejection, and semantic purpose mismatch.

- [x] **Step 2: Run tests and observe failure**

Run: `node --test tests/skill-supply-chain-review.test.mjs`

Expected: FAIL because `reconcileSkillReview` is not exported.

- [x] **Step 3: Implement reconciliation and extend Aegis**

Add the `skill-supply-chain` route with capabilities `canonical-scan`, `purpose-fit`, `permission-fit`, `sensitive-surfaces`, `semantic-review`, `verdict`, and `promotion-gate`. Preserve every existing Aegis route and refusal. A static clear result without semantic review remains ineligible.

- [x] **Step 4: Run semantic and Aegis tests**

Run: `node --test tests/skill-supply-chain-review.test.mjs tests/engineering-godskills.test.mjs`

Expected: all tests PASS and existing Aegis routes remain unchanged.

- [x] **Step 5: Commit semantic reconciliation**

```powershell
git add src/skill-supply-chain-defense.mjs tests/skill-supply-chain-review.test.mjs skills/eternities-aegis
git commit -m "feat: add Aegis skill trust reconciliation"
```

---

### Task 3: Wave 2 static security ledger

**Files:**
- Create: `scripts/build-skill-security-ledger.mjs`
- Create: `tests/skill-security-ledger.test.mjs`
- Create: `artifacts/github-wave-2/skill-security-ledger.jsonl`
- Create: `receipts/github-wave-2-skill-security.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `artifacts/github-wave-2/source-records.jsonl` and exact D-drive `sourceAbsolutePath` values
- Produces: one deterministic ledger row per exact source id plus a receipt binding source-record bytes, ledger bytes, counts, dispositions, and rule totals

- [x] **Step 1: Write failing fixture-ledger tests**

Test a three-record fixture containing one clear skill, one documented sensitive skill, and one critical malicious skill. Assert exact source coverage, deterministic lexical order, digest binding, and these dispositions:

```js
assert.deepEqual(summary.dispositions, {
  "clear-for-semantic-review": 1,
  "manual-review-required": 1,
  "reject-before-indexing": 1,
});
```

- [x] **Step 2: Run the ledger test and observe failure**

Run: `node --test tests/skill-security-ledger.test.mjs`

Expected: FAIL because the builder does not exist.

- [x] **Step 3: Implement the builder and package command**

Export `buildSkillSecurityLedger(options)` and add:

```json
"build:skill-security-ledger": "node scripts/build-skill-security-ledger.mjs"
```

The CLI writes atomically, refuses duplicate source ids, verifies each body digest before scanning, and never changes the D repositories or acquisition receipt.

- [x] **Step 4: Run fixture tests and build the actual Wave 2 ledger**

Run:

```powershell
node --test tests/skill-security-ledger.test.mjs
npm run build:skill-security-ledger
```

Expected: tests PASS; the receipt accounts for all 7,776 Wave 2 source records and reports every rejected or manual-review source explicitly.

- [x] **Step 5: Rebuild and verify byte stability**

Hash the ledger and receipt inputs, rerun the builder, and assert the ledger digest is unchanged. The receipt may carry a generated timestamp only if it is excluded from deterministic artifact identity.

- [x] **Step 6: Commit the Wave 2 ledger**

```powershell
git add scripts/build-skill-security-ledger.mjs tests/skill-security-ledger.test.mjs artifacts/github-wave-2/skill-security-ledger.jsonl receipts/github-wave-2-skill-security.json package.json
git commit -m "feat: gate Wave 2 skills with static security evidence"
```

---

### Task 4: Independent evaluation, promotion evidence, and release gate

**Files:**
- Create: `data/skill-supply-chain-defense-contract.json`
- Create: `data/reviews/github-wave-2-skill-defense.json`
- Create: `skills/eternities-aegis/evals/skill-supply-chain-cases.json`
- Create: `receipts/promotions/eternities-aegis-v3.json`
- Create: `syntheses/eternities-aegis.v3.json`
- Create: `docs/skill-supply-chain-defense-report.md`
- Create: `tests/skill-supply-chain-promotion.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: the neutral contract, exact NVIDIA source digest and license evidence, scanner tests, Wave 2 ledger receipt, Aegis artifacts, and promotion policy
- Produces: an independently written Aegis v3 candidate and an honest promotion or non-promotion receipt

- [ ] **Step 1: Freeze the neutral contract and provenance review**

Record the selected source id, exact SHA-256, Apache-2.0 signal, `independent-implementation` disposition, mechanisms studied, excluded implementation details, and `copiedSourceProse: false`.

- [ ] **Step 2: Write failing promotion and regression tests**

Require direct, paraphrase, exclusion, conflict, malicious, documented-sensitive, stale-review, and missing-review cases. Preserve all Aegis v2 critical cases. Assert the receipt cannot say `promoted` unless every critical case passes, the token budget passes, no authority expands, and the Wave 2 security receipt reconciles.

- [ ] **Step 3: Run the promotion test and observe failure**

Run: `node --test tests/skill-supply-chain-promotion.test.mjs`

Expected: FAIL because v3 evidence does not exist.

- [ ] **Step 4: Build the smallest Aegis v3 artifacts and decision receipt**

Use `scripts/evaluate-skill.mjs` and `policies/promotion.v1.json`. If any gate fails, record `experimental`, `unverified`, or `blocked`; do not round up to `promoted`.

- [ ] **Step 5: Run focused and full verification**

Run:

```powershell
node --test tests/skill-supply-chain-defense.test.mjs tests/skill-supply-chain-review.test.mjs tests/skill-security-ledger.test.mjs tests/skill-supply-chain-promotion.test.mjs
npm run evaluate:intent
npm test
npm run verify:quarry-wave
git diff --check
```

Expected: all new critical cases pass, the existing 140-case intent arena has no regression, the full suite has zero failures, the exact D quarry audit passes, and patch hygiene is clean.

- [ ] **Step 6: Document proof and limits**

Report exact fixture counts, Wave 2 dispositions, false-positive controls, test counts, source provenance, and the limit that clean static evidence does not prove safety.

- [ ] **Step 7: Commit the evaluated release**

```powershell
git add data skills/eternities-aegis/evals/skill-supply-chain-cases.json receipts/promotions/eternities-aegis-v3.json syntheses/eternities-aegis.v3.json docs/skill-supply-chain-defense-report.md tests/skill-supply-chain-promotion.test.mjs README.md
git commit -m "feat: certify Aegis skill supply-chain defense"
```
