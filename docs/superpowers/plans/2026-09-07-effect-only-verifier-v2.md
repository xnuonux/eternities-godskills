# Effect-only verification sidecar implementation plan

> **For agentic workers:** Use `executing-plans` inline; Godagents owns independent review and host integration.

**Goal:** Verify persisted v2 results in an isolated read-only subprocess without new routing operations, inference, effects or publication.

**Architecture:** Add a separate executable using the unchanged pure `verifyEffectOnlyV2Result`. Issue a separately reviewed structural source receipt bound to the frozen routing parent and identical shared module bytes. The host pins both and distinguishes verification subprocesses from routing/native/effect counters.

**Tech Stack:** Node.js 24 ESM and built-in test runner/crypto/fs.

**Spec:** Godagents `docs/effect-only-vessel-migration-decision.md` R4/R5 and the accepted 2026-09-07 sidecar interface coordination.

## Global constraints

- Preserve all existing routing executable, consumer, parent receipt, builder and capture bytes.
- Strict mandatory unique flags: --request, --expected-source, --result. No output path, writes, retries or model/config flags.
- Request/source are regular UTF-8 JSON <=1 MiB each; result <=2 MiB. Read bounds apply during reading, not just stat.
- Empty stdout; fixed redacted errors; exit0 means exact pair consistency, including needs-decision. It is never authorization.
- Pure deterministic recomputation is validation, not a new routing operation. Do not copy the consumer algorithm into host or wrapper.
- New root: receipts/effect-only-verifier-v2.json; protocol eternities-godskills-effect-only-verifier-v2. Parent pins exact old receipt file/logical digests and shared module hashes.
- No live host adoption, deployment, v1 changes, source-root replacement or main merge.

### Task 1: Read-only executable

Create `scripts/verify-effect-only-v2.mjs` and `tests/effect-only-verifier-cli.test.mjs`.

- [x] Write subprocess tests for exact success, exact needs-decision, corrupted input/result/binding, argument closure, input/result size, redaction and unchanged file contents/directory inventory.

```js
assert.equal(run(['--request', request, '--expected-source', source, '--result', result]).status, 0);
assert.deepEqual(await snapshotFiles(), before);
```

- [x] Observe missing implementation failure, then implement only bounded reads and `verifyEffectOnlyV2Result({request,expectedSource,result})`. Catch errors without body/stack disclosure. Retest every named behavior.

### Task 2: Separate source receipt and review

Create `scripts/build-effect-only-verifier-receipt.mjs`, `tests/effect-only-verifier-receipt.test.mjs` and evidence/audit files under verifier-specific paths.

- [x] Write failing tests for exact parent pins, shared-source hash equality, closed verifier source manifest, binding of tests/vectors/captured summaries, unknown failures, source identity and reviewer disposition. Keep old root untouched.
- [x] Implement a builder returning a structural-only object, with no publication or adoption. Reuse immutable source-closure machinery and pure canonical hashing. Do not claim builder executes tests or authenticates reviewer origin.
- [x] Commit tested source, capture fresh scoped/full test summaries without private body dumps, verify exact Git object membership and obtain existing Godagents owner's independent review before issuance.
- [x] Build twice, write only the reviewed receipt, verify exact rebuild, record known full-suite failure honestly, and relay frozen coordinates. Preserve feature branch for coordinated host integration, not silent adoption.
