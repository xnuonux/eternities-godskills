# Adaptive Evaluator Packages v1 Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a versioned evaluator-package trust boundary, an Aegis deterministic evaluator v2, and an ineligible shadow replay that corrects the known punctuation defect without rewriting historical evidence.

**Architecture:** A generic package builder binds one pinned evaluator entrypoint, its complete local module closure, closed schemas, policy, and declared resources into a relocation-independent receipt. The Aegis v2 evaluator uses narrowly normalized identity matching plus exact source, sink, location, flow, repair, baseline, and parent checks. A separate builder replays the five immutable Aegis artifacts into reporting-only v2 results and emits no evidence-ledger row, profile, lifecycle action, or Godagents activation.

**Tech Stack:** Node.js 24 ESM, built-in `node:test`, built-in crypto and filesystem APIs, JSON Schema artifacts, existing canonical digest and static module closure utilities.

**Spec:** `docs/superpowers/specs/2026-08-31-adaptive-evaluator-packages-design.md`

## Global Constraints

- Preserve `scripts/evaluate-aegis-matrix.mjs` and every file under `evidence/adaptive-evidence-v2/aegis-matrix/` byte-for-byte.
- Preserve `src/adaptive-activation.mjs`, `policies/adaptive-activation.v1.json`, and `artifacts/adaptive-activation/evidence.v1.json` at their certified git blobs.
- Do not modify adaptive evidence v2 policy, schemas, ledger semantics, profile semantics, or lifecycle authority.
- Do not dynamically execute a path selected from a package receipt.
- Do not expose oracle cases, aliases, or scoring fixtures to subject prompts.
- Shadow replay is `retrospective-shadow-ineligible`, emits no ledger row or profile, and cannot satisfy promotion.
- Use no runtime dependency outside Node.js built-ins and existing repository-local modules.
- Every checked multi-file write uses `commitGeneratedFiles` from `scripts/build-capability-layer-abi.mjs` and restores earlier destinations on failure.
- All new JSON objects are closed, canonically ordered for digests, and reject unknown keys.
- The evaluator package may reduce uncertainty but may never grant authority.

---

### Task 1: Close the Evaluator Package Protocol

**Files:**
- Create: `policies/adaptive-evaluator-packages.v1.json`
- Create: `src/adaptive-evaluator-package.mjs`
- Create: `tests/adaptive-evaluator-package.test.mjs`
- Generate: `schemas/adaptive-evaluator-package-v1.schema.json`
- Generate: `schemas/adaptive-evaluator-request-v1.schema.json`
- Generate: `schemas/adaptive-evaluator-result-v1.schema.json`

**Interfaces:**
- Consumes: `canonicalDigest(value)` from `src/adaptive-evidence-contracts.mjs`.
- Produces: `validateAdaptiveEvaluatorPackagePolicy({ policy, expectedPolicyDigest })`, `validateEvaluatorPackageReceipt(receipt)`, `validateEvaluatorRequest(request)`, `validateEvaluatorResult(result)`, and `buildAdaptiveEvaluatorSchemas()`.
- The package policy id is `adaptive-evaluator-packages-policy-v1`; protocol id is `eternities-godskills-evaluator-package-v1`.

- [ ] **Step 1: Write failing closed-policy and schema tests**

Add tests that import the missing module and assert:

```js
const policy = JSON.parse(await readFile(new URL(
  "../policies/adaptive-evaluator-packages.v1.json", import.meta.url,
)));
const digest = canonicalDigest(policy);
assert.deepEqual(validateAdaptiveEvaluatorPackagePolicy({
  policy,
  expectedPolicyDigest: digest,
}), policy);
assert.throws(() => validateAdaptiveEvaluatorPackagePolicy({
  policy: { ...policy, dynamicLoadingAllowed: true },
  expectedPolicyDigest: digest,
}), /digest|dynamic loading/i);
assert.throws(() => validateEvaluatorRequest({
  ...validRequest(), extra: true,
}), /keys.*closed|unknown/i);
assert.throws(() => validateEvaluatorResult({
  ...validResult(), authorityExpanded: true,
}), /authority/i);
```

The policy fixture must contain exactly:

```json
{
  "schemaVersion": 1,
  "id": "adaptive-evaluator-packages-policy-v1",
  "protocolId": "eternities-godskills-evaluator-package-v1",
  "evaluatorKinds": ["deterministic-verifier", "reviewer"],
  "taskClasses": ["continuity", "creative-generation", "debugging-recovery", "general", "implementation", "research", "security-review", "verification"],
  "artifactMediaTypes": ["application/json", "text/markdown", "text/plain"],
  "maximumArtifactBytes": 262144,
  "maximumDeclaredResources": 16,
  "dynamicLoadingAllowed": false,
  "receiptPathExecutionAllowed": false,
  "authorityExpanded": false
}
```

- [ ] **Step 2: Run the focused test and witness the missing module failure**

Run: `node --test tests/adaptive-evaluator-package.test.mjs`

Expected: FAIL because `src/adaptive-evaluator-package.mjs` and the policy do not exist.

- [ ] **Step 3: Implement closed validators and schema builders**

Implement strict helpers in `src/adaptive-evaluator-package.mjs`. The public request shape is:

```js
{
  schemaVersion: 1,
  packageReceiptDigest,
  taskDefinitionDigest,
  taskSourceText,
  taskSourceDigest,
  variant,
  artifactText,
  artifactDigest,
  baseline: null | {
    artifactText, artifactDigest, resultText, resultDigest
  },
  parent: null | {
    artifactText, artifactDigest, resultText, resultDigest
  },
  evaluatedAt
}
```

The public result shape is:

```js
{
  schemaVersion: 1,
  packageId,
  packageReceiptDigest,
  evaluatorId,
  evaluatorKind,
  taskClass,
  variant,
  taskDefinitionDigest,
  taskSourceDigest,
  oracleDigest,
  normalizationDigest,
  artifactDigest,
  artifactBytes,
  schemaValid,
  score,
  maximumScore,
  detectedCases,
  unsupportedFindings,
  caseResults: [{
    id,
    matchedArtifactId: null | string,
    critical,
    score,
    maximumScore,
    checks: [{ id, passed, reasonCode }]
  }],
  comparison,
  parent,
  criticalRegression,
  reasonCodes,
  authorityExpanded: false,
  evaluatedAt,
  resultDigest
}
```

`validateEvaluatorResult` removes `resultDigest`, recomputes it with
`canonicalDigest`, requires `authorityExpanded === false`, and checks that
comparison counts sum to `matched`. The schema builder returns these exact
three names:

```js
{
  "adaptive-evaluator-package-v1.schema.json": packageSchema,
  "adaptive-evaluator-request-v1.schema.json": requestSchema,
  "adaptive-evaluator-result-v1.schema.json": resultSchema
}
```

Every object schema uses `additionalProperties: false` and a complete
`required` array.

- [ ] **Step 4: Run the protocol tests**

Run: `node --test tests/adaptive-evaluator-package.test.mjs`

Expected: PASS with policy digest checking, unknown-key rejection, closed
schemas, invalid enum rejection, contradictory comparison rejection, digest
tamper rejection, and authority-expansion rejection covered.

- [ ] **Step 5: Commit the protocol**

```powershell
git add policies/adaptive-evaluator-packages.v1.json src/adaptive-evaluator-package.mjs tests/adaptive-evaluator-package.test.mjs
git commit -m "feat: close adaptive evaluator package protocol"
```

### Task 2: Build Relocation-Independent Package Receipts

**Files:**
- Create: `scripts/build-adaptive-evaluator-package-receipt.mjs`
- Create: `tests/adaptive-evaluator-package-receipt.test.mjs`
- Test: `tests/adaptive-activation-executable-receipt.test.mjs`

**Interfaces:**
- Consumes: `discoverLocalModuleClosure({ repositoryRoot, roots, io })` and Task 1 policy/schema functions.
- Produces: `buildAdaptiveEvaluatorPackageReceipt({ repositoryRoot, descriptor, io })` and `writeAdaptiveEvaluatorPackageReceipt({ repositoryRoot, descriptor, outputPath })`.
- Descriptor fields are exactly `id`, `evaluatorId`, `evaluatorKind`, `taskClass`, `artifactMediaType`, `entrypointPath`, `policyPath`, `packageSchemaPath`, `requestSchemaPath`, `resultSchemaPath`, and `resources`.

- [ ] **Step 1: Write failing receipt and closure tests**

Create temporary repository fixtures and assert:

```js
const receipt = await buildAdaptiveEvaluatorPackageReceipt({
  repositoryRoot: fixture.root,
  descriptor: fixture.descriptor,
});
assert.equal(receipt.protocolId, "eternities-godskills-evaluator-package-v1");
assert.equal(receipt.status, "verified-build");
assert.deepEqual(receipt.dependencyClosure.localModules, [
  "src/entrypoint.mjs",
  "src/helper.mjs",
]);
assert.equal(receipt.authorityExpanded, false);
assert.equal(canonicalDigest(stripDigest(receipt)), receipt.receiptDigest);
```

Add negative fixtures for `../escape`, an absolute path, a symlink, a dynamic
import, CommonJS `require`, a bare package import, duplicate resource paths,
missing resources, substituted bytes, and more than sixteen resources.

- [ ] **Step 2: Run the receipt test and witness the missing builder failure**

Run: `node --test tests/adaptive-evaluator-package-receipt.test.mjs`

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Implement the receipt builder**

Build artifacts in canonical path order. Module rows use roles `entrypoint` or
`dependency`; declared rows use `policy`, `package-schema`, `request-schema`,
`result-schema`, or the descriptor resource role. Every row contains `role`,
`path`, `sha256`, and `bytes`; JSON resources also contain `logicalDigest`.

The three schema rows come from canonical bytes returned directly by
`buildAdaptiveEvaluatorSchemas()`, keyed by the descriptor's three schema
paths. This lets the aggregate writer calculate the package receipt and all
checked schema destinations before one atomic multi-file write. Reject a
descriptor whose schema paths do not name all three exact generated schemas.

The unsigned receipt is:

```js
{
  schemaVersion: 1,
  id: descriptor.id,
  status: "verified-build",
  protocolId: policy.protocolId,
  evaluatorId: descriptor.evaluatorId,
  evaluatorKind: descriptor.evaluatorKind,
  taskClass: descriptor.taskClass,
  artifactMediaType: descriptor.artifactMediaType,
  authorityExpanded: false,
  dependencyClosure: {
    roots: [descriptor.entrypointPath],
    localModules: modules.map(({ path }) => path),
    complete: true
  },
  artifacts,
  proofLimits: [
    "deterministic-package-identity-only",
    "no-model-quality-proof",
    "no-receipt-selected-code-execution",
    "no-authority-expansion",
    "no-global-activation"
  ]
}
```

Append `receiptDigest: canonicalDigest(unsigned)`. The writer uses an exclusive
temporary file and atomic rename for its one destination. It never imports the
descriptor entrypoint.

- [ ] **Step 4: Run package receipt and closure tests**

Run: `node --test tests/adaptive-activation-executable-receipt.test.mjs tests/adaptive-evaluator-package-receipt.test.mjs`

Expected: PASS with byte-identical receipts across two temporary roots and all
escape, alias, dependency, and drift attacks rejected.

- [ ] **Step 5: Commit package receipt construction**

```powershell
git add scripts/build-adaptive-evaluator-package-receipt.mjs tests/adaptive-evaluator-package-receipt.test.mjs
git commit -m "feat: attest adaptive evaluator packages"
```

### Task 3: Implement the Aegis Deterministic Evaluator v2

**Files:**
- Create: `artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json`
- Create: `src/aegis-evaluator-v2.mjs`
- Create: `tests/aegis-evaluator-v2.test.mjs`

**Interfaces:**
- Consumes: Task 1 request/result validators and the exact oracle object.
- Produces: `AEGIS_EVALUATOR_V2_ID`, `normalizeEvaluatorText(value)`, and `evaluateAegisArtifactV2({ request, packageReceipt, oracle })`.
- Evaluator id is `aegis-deterministic-verifier-v2`; package id is `adaptive-evaluator-aegis-v2`.

- [ ] **Step 1: Freeze the oracle and write failing equivalence tests**

The oracle contains the exact keys `schemaVersion`, `id`,
`taskDefinitionPath`, `taskDefinitionSha256`, `taskSourceSha256`,
`normalization`, `scoring`, and `cases`. It contains three cases in stable id
order: `command-injection`, `path-traversal`, and `sql-injection`. Each case
declares expected severity, critical flag, identity aliases, allowed line
ranges, source anchors, sink anchors, flow terms, and repair groups.

Write tests proving these finding titles map to the same case:

```js
"OS command injection through diagnostics host"
"os-command-injection-through-diagnostics-host"
"CWE-78 in diagnostics host execution"
```

Then assert ids or keywords alone do not pass grounding:

```js
const stuffed = finding({
  id: "command-injection",
  title: "command injection CWE-78",
  location: "everywhere",
  evidence: "command injection exec shell req.body.host",
  repair: "validate",
  severity: "critical",
});
const result = evaluate([stuffed]);
assert.equal(
  result.caseResults[0].checks.find(({ id }) => id === "flow-grounded").passed,
  false,
);
assert.equal(result.criticalRegression, true);
```

Add cases for negated flow, invented lines, missing sink, missing source,
generic repair, wrong severity, unsupported critical finding, duplicate JSON
keys, duplicate ids, and reordered findings.

- [ ] **Step 2: Run the evaluator test and witness the missing evaluator failure**

Run: `node --test tests/aegis-evaluator-v2.test.mjs`

Expected: FAIL because the evaluator and oracle do not exist.

- [ ] **Step 3: Implement narrow normalization and grounded assignment**

`normalizeEvaluatorText` must be exactly:

```js
export function normalizeEvaluatorText(value) {
  return value.normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
```

Parse the artifact with the same closed v1 finding contract, including the
duplicate-key defense. Verify the oracle's source anchors and sink anchors
occur in the bound task source before scoring any artifact. A finding can map
to a case only when its normalized id/title/evidence contains an identity
alias. Score severity, location, source, sink, directional mechanism, and all
repair groups separately. Find the highest-scoring one-to-one assignment and
break ties by canonical finding digest, never input order.

For raw, `comparison` is:

```js
{
  baselineArtifactDigest: null,
  baselineResultDigest: null,
  outcomeAgainstRaw: "baseline",
  counts: { matched: 0, wins: 0, losses: 0, ties: 0 }
}
```

For other variants, verify the exact baseline artifact and result digest, then
compare each oracle case. For `reviewer` and `combined`, verify the exact parent
and reject removal or point degradation of a parent-grounded case.

Set `criticalRegression` when the artifact is malformed, any required critical
case is incomplete, any unsupported critical finding exists, or a review
degrades its parent. Return `validateEvaluatorResult(result)`.

- [ ] **Step 4: Run the Aegis v2 adversarial suite**

Run: `node --test tests/aegis-evaluator-v2.test.mjs`

Expected: PASS. Hyphen and spacing forms are equivalent; all lexical-only,
negation, fabricated-location, unsupported-critical, parent-removal, and
digest-substitution controls fail closed.

- [ ] **Step 5: Commit the Aegis v2 evaluator**

```powershell
git add artifacts/adaptive-evaluators/aegis-v2/oracle.v1.json src/aegis-evaluator-v2.mjs tests/aegis-evaluator-v2.test.mjs
git commit -m "feat: add grounded Aegis evaluator v2"
```

### Task 4: Build the Ineligible Historical Shadow Replay

**Files:**
- Create: `scripts/build-aegis-evaluator-v2-shadow-replay.mjs`
- Create: `tests/aegis-evaluator-v2-shadow.test.mjs`
- Generate: `schemas/adaptive-evaluator-package-v1.schema.json`
- Generate: `schemas/adaptive-evaluator-request-v1.schema.json`
- Generate: `schemas/adaptive-evaluator-result-v1.schema.json`
- Generate: `receipts/adaptive-evaluator-aegis-v2.json`
- Generate: `artifacts/adaptive-evaluators/aegis-v2/shadow-replay.v1.json`
- Generate: `docs/adaptive-evaluator-aegis-v2-shadow-report.md`
- Generate: `receipts/adaptive-evaluator-packages-v1.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Tasks 1-3, `commitGeneratedFiles`, the archived Aegis task, five artifacts, five v1 observations, and `receipts/adaptive-evidence-v2.json`.
- Produces: `rebuildAegisEvaluatorV2Shadow({ root })` and `writeAegisEvaluatorV2Shadow({ root, renameFile })`.
- Adds npm script `build:adaptive-evaluator-packages` with value `node scripts/build-aegis-evaluator-v2-shadow-replay.mjs`.

- [ ] **Step 1: Write failing replay and non-promotion tests**

Assert that rebuilding returns exactly:

```js
{
  schemas,
  packageReceipt,
  shadowReplay,
  report,
  aggregateReceipt
}
```

The shadow replay must have:

```js
{
  schemaVersion: 1,
  id: "aegis-v2-archived-matrix-shadow-replay",
  status: "retrospective-shadow-ineligible",
  ledgerAdmissionAllowed: false,
  profilePromotionAllowed: false,
  lifecycleActionAllowed: false,
  godagentsActivationAllowed: false,
  sourceTrialDigest,
  packageReceiptDigest,
  taskDefinition,
  oracle,
  variants: [/* five bound v1 and v2 result rows */],
  replayDigest
}
```

For every variant assert `detectedCases === 3` and
`criticalRegression === false`. Assert all five v1 artifact and evaluation
digests remain present. Attempt to pass a shadow row to
`createObservationProposal` and require rejection because no preregistered v2
trial or model observation exists.

Add transactional failure coverage by injecting a failing later rename and
asserting every preexisting checked output is restored byte-for-byte.

- [ ] **Step 2: Run the replay test and witness the missing builder failure**

Run: `node --test tests/aegis-evaluator-v2-shadow.test.mjs`

Expected: FAIL because the replay builder and generated outputs do not exist.

- [ ] **Step 3: Implement deterministic replay and receipts**

Load the archived task and split the inert source after its first blank line.
Verify the task, source, artifact, observation, parent, and evaluator v1 bytes
before invoking v2. Evaluate in this order:

```js
const order = ["raw", "guardrail", "method", "reviewer", "combined"];
```

Use raw as every non-raw baseline, raw as reviewer parent, and method as
combined parent. Build the report from the v1 and v2 result records, not from
hard-coded scores.

The aggregate receipt binds:

- adaptive evidence v2 parent receipt digest and file SHA-256;
- evaluator policy and all three generated schemas;
- complete evaluator package receipt;
- exact oracle, task, five artifacts, and five v1 observations;
- shadow replay and report;
- every new source and builder file;
- proof limits including `retrospective-only`, `no-ledger-admission`,
  `no-profile-promotion`, `no-model-quality-proof`, and
  `no-godagents-activation`.

Write all seven generated destinations in one `commitGeneratedFiles`
transaction. Compute all outputs before the first write.

- [ ] **Step 4: Build twice and run focused replay tests**

Run:

```powershell
npm run build:adaptive-evaluator-packages
node --test tests/adaptive-evaluator-package.test.mjs tests/adaptive-evaluator-package-receipt.test.mjs tests/aegis-evaluator-v2.test.mjs tests/aegis-evaluator-v2-shadow.test.mjs
```

Hash the seven generated destinations, rebuild, and require zero changed
hashes. Expected: all focused tests pass and both logical receipt digests remain
identical.

- [ ] **Step 5: Commit the replay and checked artifacts**

```powershell
git add package.json scripts/build-aegis-evaluator-v2-shadow-replay.mjs tests/aegis-evaluator-v2-shadow.test.mjs schemas/adaptive-evaluator-package-v1.schema.json schemas/adaptive-evaluator-request-v1.schema.json schemas/adaptive-evaluator-result-v1.schema.json receipts/adaptive-evaluator-aegis-v2.json artifacts/adaptive-evaluators/aegis-v2/shadow-replay.v1.json docs/adaptive-evaluator-aegis-v2-shadow-report.md receipts/adaptive-evaluator-packages-v1.json
git commit -m "feat: preserve Aegis v2 shadow replay"
```

### Task 5: Prove Compatibility and Document the Runtime Boundary

**Files:**
- Create: `tests/adaptive-evaluator-compatibility.test.mjs`
- Create: `runtime/adaptive-evaluator-packages-v1.md`
- Modify: `scripts/build-aegis-evaluator-v2-shadow-replay.mjs`
- Regenerate: `receipts/adaptive-evaluator-packages-v1.json`

**Interfaces:**
- Consumes: the complete milestone and all frozen v1/v2 parent artifacts.
- Produces: a bounded runtime contract and a complete pre-review compatibility gate.

- [ ] **Step 1: Write failing compatibility assertions**

Record exact hashes from the pre-phase commit for:

```js
[
  "scripts/evaluate-aegis-matrix.mjs",
  "evidence/adaptive-evidence-v2/aegis-matrix/task-definition.json",
  "evidence/adaptive-evidence-v2/aegis-matrix/comparison-policy.json",
  "evidence/adaptive-evidence-v2/aegis-matrix/ledger.json",
  "evidence/adaptive-evidence-v2/aegis-matrix/profile.json",
  "receipts/adaptive-evidence-v2.json",
  "src/adaptive-activation.mjs",
  "policies/adaptive-activation.v1.json",
  "artifacts/adaptive-activation/evidence.v1.json"
]
```

Also enumerate all five archived artifact paths and all five archived
observation paths. Assert each SHA-256 remains exact and that every existing
`skills/*/SKILL.md` digest and capability-layer manifest digest equals the
pre-phase snapshot.

- [ ] **Step 2: Run compatibility tests before docs**

Run: `node --test tests/adaptive-evaluator-compatibility.test.mjs`

Expected: PASS for frozen bytes and FAIL for the missing runtime document.

- [ ] **Step 3: Write the runtime record**

The runtime document states the package rebuild sequence, pinned-entrypoint
rule, request/result contract, source-oracle grounding, fail-closed behavior,
shadow ineligibility, and future preregistration sequence. It explicitly states
that `matchedComparisons` in adaptive evidence v2 counts task-local oracle
cases, not independent trials.

Teach the aggregate builder to bind the runtime document, then regenerate its
certification binds the final receipt instead.

- [ ] **Step 4: Run focused, full, and deterministic verification**

Run:

```powershell
npm run build:adaptive-evaluator-packages
node --test tests/adaptive-evaluator-package.test.mjs tests/adaptive-evaluator-package-receipt.test.mjs tests/aegis-evaluator-v2.test.mjs tests/aegis-evaluator-v2-shadow.test.mjs tests/adaptive-evaluator-compatibility.test.mjs
npm test
node --check src/adaptive-evaluator-package.mjs
node --check src/aegis-evaluator-v2.mjs
node --check scripts/build-adaptive-evaluator-package-receipt.mjs
node --check scripts/build-aegis-evaluator-v2-shadow-replay.mjs
git diff --check
```

Then hash all generated files, rebuild once more, and require zero byte changes.
Expected: all focused tests and the complete inherited-plus-new suite pass,
syntax checks pass, frozen hashes remain exact, and the worktree contains only
planned files.

- [ ] **Step 5: Commit the runtime proof**

```powershell
git add tests/adaptive-evaluator-compatibility.test.mjs runtime/adaptive-evaluator-packages-v1.md scripts/build-aegis-evaluator-v2-shadow-replay.mjs receipts/adaptive-evaluator-packages-v1.json
git commit -m "docs: define adaptive evaluator runtime boundary"
```

### Task 6: Independent Review, Repair, and Integration

**Files:**
- Modify only files implicated by a reproduced critical or important finding.
- Create: `docs/adaptive-evaluator-packages-v1-certification.md`
- Modify: `tests/adaptive-evaluator-compatibility.test.mjs`
- Regenerate: `receipts/adaptive-evaluator-packages-v1.json` only if a bound implementation byte changes.

**Interfaces:**
- Consumes: the completed feature branch and exact base commit.
- Produces: one reviewed, certified, reproducible branch ready for fast-forward integration.

- [ ] **Step 1: Request one adversarial review**

Give one independent reviewer the exact base-to-head range and ask it to inspect
package path containment, closure completeness, receipt-selected execution,
oracle leakage, source drift, normalization abuse, negation, keyword stuffing,
assignment reuse, critical-case handling, baseline and parent substitution,
shadow promotion, transactional writes, frozen-byte compatibility, and receipt
honesty.

- [ ] **Step 2: Reproduce every critical or important finding**

For each accepted finding, add the smallest failing test to the directly
implicated focused suite and run it alone. If the reviewer cannot provide a
reproducer and code inspection disproves the claim, record the rejection in
the certification rather than changing code.

- [ ] **Step 3: Repair test-first and rerun the reviewer**

Implement the smallest coherent repair, run the focused suite, then return the
exact repair range to the same reviewer. Continue until no unresolved critical
or important defect remains.

After review clears, write the certification with exact package and aggregate
receipt digests, shadow replay digest, deterministic rebuild hashes, focused
and full test counts, independent review identity, frozen-parent hashes, and
these proof limits:

```text
package integrity and Aegis v2 deterministic behavior only
retrospective replay is not preregistration
no model quality or recurring-advantage proof
no cross-trial portfolio or pooled profile
no lifecycle action, global activation, Godagents adapter, or Lunari integration
```

Extend the compatibility test to require the disposition
`certified-retrospective-evaluator-canary`, the exact final receipt digests,
the independent reviewer id, the full-suite count, and every proof-limit line.
Run that test after writing the document and before the final release gate.

- [ ] **Step 4: Execute the final release gate**

Fetch `origin`, require the feature base to remain an ancestor of current
`origin/main`, replay both deterministic builds, run the focused suite, full
suite, syntax checks, `git diff --check`, frozen-byte audit, receipt audit, and
clean-status check. Rebase is prohibited after model artifacts or reviewed
receipt bytes are frozen; merge current main into the feature branch if
reconciliation is required and rerun all evidence.

- [ ] **Step 5: Fast-forward, verify merged main, and publish**

Commit the final certification before integration:

```powershell
git add docs/adaptive-evaluator-packages-v1-certification.md
git commit -m "docs: certify adaptive evaluator packages v1"
```

From the canonical checkout:

```powershell
git merge --ff-only feat/adaptive-evaluator-packages-v1
npm test
npm run build:adaptive-evaluator-packages
git push origin main
```

After `origin/main` equals local `main` and the merged tree is clean, remove
only this task's clean worktree and delete only its contained local feature
branch. Preserve unrelated review worktrees and branches.

## Requirement Coverage

| design requirement | implementation task |
|---|---|
| versioned, closed evaluator package ABI | Tasks 1-2 |
| complete local dependency closure | Task 2 |
| no receipt-selected dynamic execution | Tasks 1-2, 6 |
| punctuation-tolerant but source-grounded Aegis evaluator | Task 3 |
| negation, stuffing, fabricated evidence, and critical fail-closed controls | Task 3 |
| exact raw baseline and review parent bindings | Task 3 |
| immutable, ineligible five-artifact shadow replay | Task 4 |
| no ledger, profile, lifecycle, Godagents, or global activation effect | Tasks 4-5 |
| deterministic transactional generated outputs | Task 4 |
| exact parent compatibility and skill/capability-layer preservation | Task 5 |
| bounded certification and independent adversarial review | Tasks 5-6 |

## Completion Boundary

This plan is complete only when the evaluator package and aggregate receipts
rebuild exactly, the Aegis v2 adversarial suite passes, all five archived
artifacts replay with three grounded cases and no v2 critical regression, the
shadow remains structurally unable to promote, every frozen parent byte remains
exact, the complete repository suite passes, independent review is clear, and
the certified branch is fast-forwarded and pushed to `main`.

Completion does not authorize fresh model dispatch, a cross-trial portfolio,
profile promotion, Godagents adapter v2, global installation, or Lunari
integration. Those are subsequent separately evidenced milestones under the
standing continuous goal.
