# Effect-only v2 executable boundary

Status: structural source receipt issued for independently reviewed implementation
`7342a75f53d763be11fd85d856e38640561a5eca`. No main merge or host pin adoption.

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
Final wider candidate run: 931 tests, 929 pass, 1 known installed-host wording
failure, 1 existing skip, 0 TODOs. The exact reduced summaries are captured under
`artifacts/effect-only-v2/`; no raw global-instruction dump was copied.

The coordinator compared all 11 implementation, dependency, builder, test and
vector files against Git objects at the implementation commit: zero mismatches.
Canonical main and origin/main remain `2ccdacf8ae04aceaff417de7c27fb3885b0bb7b7`.
## Issuance correction and final disposition

The first issuance attempt correctly stopped before writing a receipt: the real
Node summary contains a literal `✖ failing tests:` heading, absent from the first
synthetic fixture. A regression test failed with that actual heading and repeated
failure name. Commit `7342a75f53d763be11fd85d856e38640561a5eca` ignores only that
exact heading; failure-name and count checks remain intact. Both logs were freshly
recaptured on this commit. Old logs remain under `history/f90a6cb-*.log` rather
than being relabelled as results from newer source.

Final evidence: 89 targeted tests pass; 932 full tests, 930 pass, one known
installed-host wording failure, one existing skip, zero TODOs. All 11 relevant
files again matched their Git objects at the corrected implementation commit.

Independent reviewer task `01a04a0c-ae62-7c83-8f77-9d7b1614f390` reviewed the full
new CLI and builder at f90a6cb and ran all 22 then-focused tests, then reviewed the
exact parser delta and ran all nine issuer tests at 7342a75. Its disposition for
the corrected implementation is `approved-structural-scope`, not deployment or
main-release approval. It independently inspected both captured summaries.

After those gates, two builds returned identical receipts; the written artifact
then reproduced exact canonical values and formatted file bytes on a third build.

- Receipt: `receipts/effect-only-executable-v2.json`
- Status: `verified-structural-only`
- Logical digest: `03fe45aeb133b715354174867a05781fac9b3cfa5353edf020cecdafa1a88a73`
- File SHA-256: `f4baee63d9d802f7a985b5570deb81bbf174dbad3d7aea3d3aba67d546851e04`
- Entrypoint SHA-256: `12ae69b74a412ba711a1ae630eec0fc3bb3181a4a18df1810857a4e49df1ab3b`
- Targeted log SHA-256: `dfd908f2f3dbf5f703336763e0cb7f57b36e7c6d56133c026448f1aa92819c42`
- Full log SHA-256: `9fe45b47177be480a4ed940bae8095b6d30c5db521f3bdcfcc23c4ebd8cb8066`

This receipt preserves the full-suite failure explicitly. The branch remains
held for the separate installed-host policy-test reconciliation and coordinated
host integration. No existing v1 source, receipts, pins or experimental heuristic
branches were changed. Hard-link publication is not an fsync-backed durability
guarantee: a host must reconcile uncertain post-publication outcomes and never
blindly retry after cleanup or transport failure.
