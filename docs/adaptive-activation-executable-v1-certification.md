# adaptive activation executable v1 certification

certified: 2026-08-31

disposition: `certified-structural-executable`

receipt status: `verified-build`

proof boundary: `deterministic-executable-integrity-only`

## certified scope

this disposition covers the provider-neutral file-in and file-out adaptive
activation process at `scripts/activation.mjs`. it validates one closed request,
verifies the complete executable trust root, compiles one decision for each of
one to three already selected capabilities in order, validates one closed
result, and writes that result atomically.

the independently reviewed implementation head is
`91cff667f1313d0bd6f1219432e27bbc31906f97` on branch
`feat/adaptive-activation-executable-v1`. the executable receipt is
`receipts/adaptive-activation-executable-v1.json`.

the generated receipt retains status `verified-build`. this document records
the independent structural review and test disposition without promoting the
receipt into a model-quality, executed-review, global-activation, or host
equivalence claim.

## frozen trust root

| artifact | exact identity |
|---|---|
| executable receipt logical digest | `c5a086bb131ff7e1a9508f02b95796ae9066627be3e8e1f8b7e57421220e9bd7` |
| executable receipt file SHA-256 | `98ebeb63db38b67608cf71b1b511b807cfe2d96e17e9b1bc54e7dbb536f8403f` |
| parent receipt logical digest | `a28a0af7e588f2abbbe1d51a15775dfbeb8d565109d0a176711bfa73b520440f` |
| parent receipt file SHA-256 | `6c6d689ecf9df14823407a917e89a5848776fb50eca3b7acc0d70056ae305f70` |
| entrypoint file SHA-256 | `e19ceef6a781d1d82a82fb17c519755526dc17fa979474b99f291d6eaa17788a` |
| compiler file SHA-256 | `9844aee1147f7129f3e37067424ccebb88ff478de1b7a9a9fb7306d5f2fdbd82` |
| policy logical digest | `bf9e6878399b4edeb4ff6bb77d234fdf646b53fd62ba6e1448b4374246d4c41d` |
| policy file SHA-256 | `b87bbfaddecb42417e57202173220bf240204d27b7de5fffc9e609eb18138939` |
| evidence logical digest | `9a14d4296158c65c3929938c5c54b5f7f4b6a5ffeb5b0a827b3f8b25814f5e07` |
| evidence file SHA-256 | `b55a5cb4f7ff039cc7f4027c165b2f151bad723d9030913076a4225342fbe8c5` |
| request schema logical digest | `d363b184aa6e75a92d56b4e3f761dcb927ab75583d2e64ffb783e1e36bf4e80c` |
| request schema file SHA-256 | `bcadd846b96809733837183e12dba6f8d094409aa7c16e5676fa63357e3c2cde` |
| result schema logical digest | `35ae10b6943d75e55eef99e2445766c338ea6b4782e7525f6dc217852b46992f` |
| result schema file SHA-256 | `0a069a5eb121e625aa4ea529cbb48783e266e4c7c7f36f93ee24749303dd4391` |
| neutral contract logical digest | `64ec14c4ffce22abc1fadb6987cf4ef05904475ab26c345a162e35ddfe7b0604` |
| neutral contract file SHA-256 | `feade348d3fd31afd5103eb296181f68000186d3193a995e4b77c25a06e57c92` |

the complete canonical local module closure contains six paths:

1. `scripts/activation.mjs`
2. `scripts/build-adaptive-activation-executable-receipt.mjs`
3. `src/adaptive-activation-protocol.mjs`
4. `src/adaptive-activation.mjs`
5. `src/io.mjs`
6. `src/static-module-closure.mjs`

the receipt additionally binds both protocol schemas, policy, evidence,
neutral contract, and the exact parent receipt. every row contains a byte
count and file digest. structured JSON artifacts also contain a canonical
logical digest.

## acceptance disposition

| condition | disposition | evidence |
|---|---|---|
| closed protocol | pass | request and result validators reject unknown fields, unsupported versions, malformed identity, cardinality, ordering, digest, classification, disclosure, and authority drift |
| complete executable identity | pass | the static scanner discovers the canonical transitive local module graph and rejects duplicate roots, unresolved or external modules, unsupported dynamic loading, escapes, and symlink aliases |
| deterministic build | pass | two consecutive production builds emitted the same logical receipt digest and byte-identical receipt file hash |
| receipt-bound execution | pass | the process rebuilds the expected receipt from current repository bytes and rejects any supplied mismatch before compilation |
| exact runtime data | pass | policy and evidence are reread and checked against both file and logical digests before use |
| ordered compilation | pass | one decision is compiled for every selected capability in request order, including explicit method intent |
| authority neutrality | pass | the full unchanged authority projection is passed to every compiler call and revalidated in the result |
| atomic result | pass | no output is created or replaced on validation failure; a complete canonical result is staged beside the destination and renamed only after every decision validates |
| ordinary compatibility | pass | no existing entrypoint, compiler, policy, evidence, or default activation behavior changed |

## verification evidence

the final pre-certification verification produced:

- receipt build one: logical digest
  `c5a086bb131ff7e1a9508f02b95796ae9066627be3e8e1f8b7e57421220e9bd7`,
  file SHA-256
  `98ebeb63db38b67608cf71b1b511b807cfe2d96e17e9b1bc54e7dbb536f8403f`
- receipt build two: exact same logical digest and file SHA-256
- focused activation gate: 25 passed, 0 failed, 0 skipped, 0 cancelled
- full `npm test`: 660 passed, 0 failed, 0 skipped, 0 cancelled
- `git diff --check`: pass
- intended changed paths from `2bf9fb929337d9a9c2f66adcb66536a63bf003c5`:
  11 before this certification document
- protected activation compiler, policy, and evidence git blobs: unchanged from
  `2bf9fb929337d9a9c2f66adcb66536a63bf003c5`

the unchanged protected blobs are:

| path | git blob |
|---|---|
| `src/adaptive-activation.mjs` | `3f263e2f68f006b42bda33805eca09add9d74727` |
| `policies/adaptive-activation.v1.json` | `1bdc9636284589f2a335d65efa8e61e815d01bbb` |
| `artifacts/adaptive-activation/evidence.v1.json` | `9b9f77b3acbddc406da1c112b3a3cb3376c4960a` |

## independent review

the independent reviewer was the Terra review agent `Herschel`,
`01a056a8-2919-7720-a773-8e0b04520f6a`.

the reviewer inspected
`2bf9fb929337d9a9c2f66adcb66536a63bf003c5..91cff667f1313d0bd6f1219432e27bbc31906f97`,
ran the 25-test focused gate, rebuilt and matched the checked receipt in
memory, checked the worktree, and found no critical or important executable
correctness or security defect. the only important release finding was the
absence of this required certification record. adding this document resolves
that release-evidence gap without changing the reviewed executable bytes.

## compatibility and rollback

this feature is additive. ordinary Godskills and unbound Codex operation do not
invoke `scripts/activation.mjs`. a host must deliberately pin the exact trust
root and launch the process with a matching request and receipt.

rollback is to remove or disable that optional host pin. the existing
Godskills catalog, router, entrypoints, activation compiler, policy, and
evidence remain available and unchanged.

## proof limits

the generated receipt and this certification prove deterministic executable
identity, closed protocol behavior, local dependency completeness, exact
policy and evidence binding, authority preservation, deterministic result
construction, and handled-failure output safety for the reviewed local build.

they do not prove:

- model quality
- that a deferred skill review later executed
- global activation or default routing changes
- arbitrary host equivalence
- isolation from a hostile actor with access to the same user filesystem
- Godagents adapter correctness
- Lunari readiness

Godagents consumption remains a separate migration. it must verify this exact
pushed release, preserve these limits, and pass its own adapter and integrated
certification gates before any runtime use.
