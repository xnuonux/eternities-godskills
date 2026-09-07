# Effect-only v2 executable boundary

Status: implementation candidate, structural review and issuance pending.
No release receipt has been written. No main merge or host pin adoption.

## Purpose

Expose the reviewed pure consumer through a small local executable whose exact
source bytes can be verified by the host before it is launched in an isolated
snapshot. Preserve every v1 executable and receipt. No skill catalog, model,
provider, native dispatch or runtime service is added.

```text
node scripts/effect-only-v2.mjs --request request.json --expected-source source.json --output result.json
```

All three flags are required and unique. Unknown flags fail. Each input must be
a regular UTF-8 JSON file no larger than 1 MiB; reading is bounded independently
of the initial file size. The serialized result must be at most 2 MiB. Inputs
cannot be output targets. Input parse/validation errors do not echo body text.

Output publication uses a same-directory temporary file and exclusive atomic
hard-link creation, then removes the temporary link. Existing output is never
overwritten, no partial destination is exposed, and no fallback or retry occurs.
This requires filesystem hard-link support. The host owns output-root policy,
captures immutable request/source snapshots, verifies source before launch, and
must treat post-publication cleanup errors as uncertain completion rather than
automatically rerunning work.

## Source receipt wire

The proposed fixed release path is `receipts/effect-only-executable-v2.json`.
The builder exports `buildEffectOnlyExecutableReceipt({repositoryRoot,
sourceCommit, review})` and returns an object only. It never writes a receipt or
adopts a pin.

Fields: schemaVersion=1, protocolId=eternities-godskills-effect-only-executable-v2,
status=verified-structural-only, sourceCommit, entrypoint, sources, builder, tests,
vectors, verification, proofLimits and receiptDigest. Receipt digest hashes the
canonical whole object minus only receiptDigest.

- entrypoint and builder have path/sha256.
- sources is the sorted exact static runtime closure: the CLI, effect-intent-v2,
  intent-contracts, io, routing-contracts. Unexpected modules fail issuance.
- tests records the three effect-only consumer/CLI/source-receipt test files.
- vectors records role=input/result plus path/sha256 for both checked fixtures.
- verification.targeted/full records tests/pass/fail/skipped/cancelled/todo,
  actual command array, logPath and logSha256. Full additionally records exact
  knownFailures. The one permitted baseline exception is the independently
  reproduced installed-host wording check, not any arbitrary failed test.
- verification.review requires sourceCommit equality, reviewerTaskId and
  disposition=approved-structural-scope. The issuer must substantiate that claim.

Test summaries are captured at `artifacts/effect-only-v2/targeted.log` and
`full.log`. Format is `node-spec-summary-v1`: first line is a JSON header with
sourceCommit, actual command array, exitCode and baselineReproduced; remaining
lines are Node spec counts and failed test names. Full request bodies, global
instruction dumps, stack traces and successful test chatter are intentionally
excluded. The digest binds this reduced evidence, not an unredacted full log.

The builder validates invocation, source identity, balanced counts, nonempty
passed tests and exact failure disposition. Targeted tests require zero failures,
skips, cancellations and TODOs. Full-suite failure remains visible in the root;
structural-only is not a claim that the release gate is green.

## Issuance gates

The builder does not execute tests, verify Git history or authenticate reviewers.
Before writing any root the coordinator must check that sourceCommit contains the
exact tested CLI, consumer/dependencies, builder, tests and vectors; capture real
test runs on those bytes; obtain independent review of the new CLI/issuer rather
than reusing the narrower old consumer review; and rebuild the candidate twice.
The host independently pins the reviewed receipt bytes and must materialize an
isolated verified execution snapshot to avoid hash-then-spawn races on mutable
source paths. There is no self-authenticating origin label and no implicit v1
translation or root adoption.

## Test-first evidence so far

The first CLI process tests failed because its executable did not exist. The
exclusive-output, size-amplification and body-redaction cases failed before their
fixes; the oversized-input test was corrected to use valid bound JSON so it could
not pass merely from a parser error, then failed against the unbounded reader.
The issuer test failed before its module existed. Current targeted candidate:
88 tests pass, zero failures/skips/TODOs (66 consumer, 14 CLI, 8 source receipt).
This is not final independent review or a published trust root.
