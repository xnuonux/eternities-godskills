# Effect-only v2 consumer implementation plan

> **For agentic workers:** Use `executing-plans` for inline task-by-task execution. Independent Godagents review follows the local gates.

**Goal:** Consume an explicitly selected structured effect-only request without inventing a skill, losing requested effects, or bypassing authority.

**Architecture:** Add one pure module beside unchanged v1 code. The host authenticates the producer and original mission; this module verifies independently supplied S/producer/R bindings, generates deterministic receipts, and validates returned pairs by exact recomputation.

**Tech Stack:** Node.js 24 ESM, built-in test runner and crypto, existing v1 context validator.

**Spec:** `../audits/2026-09-07-effect-only-v2-consumer-contract.md` in the preserved `fix/explicit-local-artifact-effects` branch at `57b443dd42e6835afa79e34d5d19223586c92b55`; accepted Godagents coordination fixes S to the entire mission minus only effectAssessment and supplies separately trusted expectedSource with S/producer/R. This plan records the implementation delta without importing held runtime changes.

## Global constraints

- Start from canonical `2ccdacf8ae04aceaff417de7c27fb3885b0bb7b7` in a separate worktree.
- No v1 source, receipts, entrypoints, main, host pins, global instructions, models or providers change.
- Input request has exactly schemaVersion=2, requestId, text, context, routeMode=effect-only, effectAssessment. Context retains the eight v1 fields and meanings.
- Assessment has exactly protocolId=eternities-requested-effects-v1, subjectDigest, state, requestedEffects, unresolvedDecisions, producerDescriptorDigest.
- Known requires nonempty sorted unique effects and no unresolved reasons. Unknown/conflicting require reasons and preserve empty/partial effects. `none` cannot coexist with another effect.
- Same-named non-none effect must occur in both permittedEffects and availableAuthority. No realm:write alias. External effects remain unsupported even when permitted.
- Known allowed local effects yield no-qualified-route/effect-only-no-skill-requested; other well-formed inputs yield needs-decision/effect-only-needs-decision. Never run lexical classification.
- Expected source is passed separately, not copied from untrusted request. Hash equality checks consistency, not origin authentication.
- R hashes full request; route requestDigest hashes full envelope, not R. Receipt bindings include S/producer/A/state/protocol. No cyclic hashes.

### Task 1: Pure consumer and contract tests

**Files:** Create `src/effect-intent-v2.mjs`, `tests/effect-intent-v2.test.mjs`, `data/effect-only-golden-vector-v2.json`.

**Interfaces:** `compileAndRouteEffectOnlyV2({request, expectedSource}) -> {compilerReceipt, routeReceipt}`; `verifyEffectOnlyV2Result({request, expectedSource, result}) -> result` or throws. No I/O, inference, policy mutation, or native execution.

- [ ] Add the independent synthetic Godagents golden fixture with literal S/producer/A/R pins. Write tests before implementation for the decision table, closed fields, exact source binding, partial intent, no aliasing, v1 separation and forged receipts. Minimal acceptance:

```js
const result = compileAndRouteEffectOnlyV2(vector);
assert.equal(result.routeReceipt.status, 'no-qualified-route');
assert.deepEqual(result.compilerReceipt.requestedEffects, ['local-read', 'local-write']);
assert.deepEqual(result.compilerReceipt.envelope.requiredCapabilities, []);
assert.equal(result.compilerReceipt.requestDigest, vector.digests.requestDigest);
```

- [ ] Run `node --test tests/effect-intent-v2.test.mjs`; confirm the missing implementation failure before adding production code.
- [ ] Implement exact JSON validation and v1-shaped validation projection only for existing request/context semantics. Generate bindings and sorted policy reasons, then build v2 compiler/envelope/route receipts. Recompute complete expected result to reject extra fields or altered persisted receipts.

```js
const expected = compileAndRouteEffectOnlyV2({request, expectedSource});
// Validate JSON values before comparing canonical forms, so omitted undefined
// fields, prototypes or coercions cannot masquerade as the exact wire result.
if (canonical(result) !== canonical(expected)) throw new Error('effect-only result mismatch');
```

- [ ] Run targeted v2 and unchanged v1 contract tests. Review boundary cases and add red-first tests for any confirmed omission.

### Task 2: Interoperability and independent review

**Files:** Create `docs/audits/2026-09-07-effect-only-v2-consumer.md`; update plan checkboxes and golden vector with independently confirmed envelope digest only.

- [ ] Send pure API, exact compiler/envelope/route outputs and commit to the existing Godagents owner for independent vector comparison and review. Do not spawn or dispatch inference.
- [ ] Verify legacy receipt tests and unchanged tracked v1 bytes. Run full suite only at final bounded integration gate; report the existing global-instruction wording failure separately if still present, never edit around it.
- [ ] Commit/push only the isolated consumer branch after review fixes and record the disposition. Host wiring, new executable trust-root certification and pin adoption remain separate coordinated milestones. Do not claim end-to-end production integration or arbitrary prose understanding.
