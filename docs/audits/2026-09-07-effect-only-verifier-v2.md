# Read-only effect verification sidecar

Status: independently reviewed structural source receipt issued on a held feature
branch. Source commit `1b60a03d5784f20b5fcaabd889e5561442f86a4b`. No main merge,
live policy adoption, model call, mission launch or task-effect execution.

## Why a sidecar

The frozen routing CLI publishes a fresh result and cannot serve read-only
recovery. The existing pure `verifyEffectOnlyV2Result` checks the complete stored
pair against its original request/source binding, so the host need not duplicate
the Godskills decision algorithm. A separate entrypoint preserves every frozen
parent byte instead of adding a new mode to an already pinned executable.

```text
node scripts/verify-effect-only-v2.mjs --request request.json --expected-source source.json --result result.json
```

All flags are mandatory, unique and closed. Request/source are regular UTF-8 JSON
files bounded to 1 MiB each; the result is bounded to 2 MiB. Bounds are enforced
during reads as well as before allocation from file metadata. The wrapper makes
no directory, temporary file, output, repair or retry. Stdout stays empty; errors
use fixed messages or system error codes, never input bodies or stack traces.

Exit 0 means exact stored-pair **consistency**, not producer authentication or
authorization. A correct needs-decision pair verifies successfully but still
forbids native/task effects under host admission. The host supplies externally
verified source bindings, pins both receipts and materializes isolated verified
code before launch.

The pure verifier recomputes expected values in memory. That is validation, not a
new routing operation: no new result is published, classification requested,
provider invoked or task executed. Host accounting must distinguish
verificationSubprocesses, routingSubprocesses, nativeInferences and
effectDispatches. Completed recovery must not rerun routing or inference.

## Receipt and parent binding

New root: `receipts/effect-only-verifier-v2.json`.
Protocol: `eternities-godskills-effect-only-verifier-v2`.
Status: `verified-structural-only`.

The source manifest follows the existing structural-only shape and adds exactly
`parent: {path, sha256, receiptDigest}`. It pins the original execution receipt:

- Path: `receipts/effect-only-executable-v2.json`
- File SHA-256: `f4baee63d9d802f7a985b5570deb81bbf174dbad3d7aea3d3aba67d546851e04`
- Logical digest: `03fe45aeb133b715354174867a05781fac9b3cfa5353edf020cecdafa1a88a73`

The builder checks that parent file and logical identity, all five parent runtime
source files, the exact verifier closure, all four identical shared modules and
the unchanged parent input/result vectors. It refuses a changed parent or shared
consumer rather than silently migrating semantics. The host must bind both roots
into admission/recovery identity; pin changes invalidate recovery.

## Verification and issuance

- 25 CLI tests pass: exact success and blocked/unknown/conflicting consistency,
  closed flags, changed text/S/R/producer/result, bounded regular-file reads,
  body redaction, empty stdout and unchanged input bytes/directory inventory.
- Nine source-receipt tests pass: exact parent/closure, changed parent-bound
  source/vector refusal, balanced captured counts and unknown failure refusal.
- All five related old/new test files pass together: 123 tests.
- Fresh sidecar-only capture: 34 pass, zero failures/skips/TODOs.
- Fresh full capture: 966 tests, 964 pass, one known installed-host wording
  failure, one existing skip, zero TODOs. This is not a green release gate.
- The known failure remains `tests/codex-routing-policy.test.mjs`, already
  reproduced on unchanged canonical main. No user-global instructions or old
  test were changed to manufacture a passing outcome.
- All 12 implementation, test, dependency, parent and vector files matched
  their Git objects at the source commit before issuance.
- Reviewer task `01a04a0c-ae62-7c83-8f77-9d7b1614f390` read the complete new CLI,
  issuer and both test files, independently reran 34 tests and returned
  `approved-structural-scope` for that exact commit with no material finding.
- Two builds produced identical receipts; a third rebuild verified exact
  written values and formatted file bytes. No provisional receipt was written.

The builder binds captured invocation summaries; it does not itself run tests,
authenticate reviewers or verify Git history. Those issuance checks were done
separately. New logs live under `artifacts/effect-only-verifier-v2/`, leaving all
prior execution-root captures and receipt bytes intact.

## Frozen verifier coordinates

- Logical digest: `a4c2ef29dc626d45e57cce361185b5c43a6065dd602236fe38385cc28b025f81`
- File SHA-256: `1e027c1061fdb5bb482aae9d1a09409ba70ccb9f87bd834784fb3cf95e8f427a`
- Entrypoint: `scripts/verify-effect-only-v2.mjs`
- Entrypoint SHA-256: `bedfcf57bcff9b7d780c30c933cdef709a4a5c042973449d07fe0a4cc78857a8`

The Godagents task owns dual-root host verification, v2 admission and recovery
integration. This milestone does not establish live execution quality, semantic
generalization or a production deployment. Shared bounded-read/log parsing code
was deliberately not extracted across frozen roots; revisit duplication only
through a separately reviewed source migration if drift becomes material.
