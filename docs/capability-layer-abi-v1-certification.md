# capability layer ABI v1 certification

certified: 2026-08-31

disposition: `certified-structural-canary`

proof limit: `structural-layer-integrity-only`

## certified scope

this disposition covers the additive capability-layer ABI v1 canaries for:

- `eternities-aegis`
- `eternities-forge`
- `eternities-muse`

the reviewed implementation head is
`6d1c1bbb9d2e35f345006c9f46b726eda5e7f60b` on branch
`feat/capability-layer-abi-v1`. the aggregate build receipt is
`receipts/capability-layer-abi-v1.json`, with receipt digest
`1c19271951abb00e93529656a35e8fb52dccc2f3cf0b6208bcee6821361ab788`.

the generated receipt and byte-cost report deliberately retain the status
`experimental-canary`. they are deterministic build evidence, not
self-certification. this document records the independently reviewed phase-1
disposition without rewriting that evidence.

## acceptance disposition

all 12 phase-1 acceptance conditions pass.

| # | condition | disposition | evidence |
|---:|---|---|---|
| 1 | identical inputs rebuild byte-identical bundles and one aggregate receipt | pass | the builder was run twice and all 26 checked outputs were byte-identical; the receipt digest remained `1c19271951abb00e93529656a35e8fb52dccc2f3cf0b6208bcee6821361ab788` |
| 2 | every output field maps to authored input or named first-party policy | pass | `policies/capability-layer-abi.v1.json`, source records in each manifest, and compiler field-closure tests bind generated fields to four exact inputs or declared policy |
| 3 | route cards contain no method or reviewer prose | pass | route-card closure and mutation tests reject undeclared or leaked fields |
| 4 | guardrails contain only contract-derived constraints | pass | guardrail closure tests cover success, failure, effect, termination, authority, and proof-limit fields |
| 5 | methods preserve sovereign behavior without quarry or provenance bulk | pass | compiler tests compare generated method sections to the selected entrypoint and operating-contract material while excluding provenance bulk |
| 6 | reviewers are artifact-dependent and unavailable before an artifact | pass | `review-before-artifact` reads zero reviewer bodies; `review-after-artifact` reads the digest-bound reviewer body |
| 7 | verifiers distinguish declarations from observations | pass | verifier artifacts declare checks only, `verifierClaimsExecution` is false, and runtime observations require a separate host record |
| 8 | input and output schemas are closed, versioned, and composition-ready | pass | generated schemas use fixed versioned envelopes, required typed slots, and `additionalProperties: false` |
| 9 | paths are repository-contained and all bytes are digest-bound | pass | manifests bind every source and layer byte; escape, symlink, tamper, malformed digest, and forged self-consistent manifest tests fail closed against a trusted receipt digest |
| 10 | legacy consumers and historical tests remain unchanged and passing | pass | all three canary `SKILL.md` git blobs are unchanged from `bc86dac`; the full suite passes 643 of 643 tests against a 632-test baseline |
| 11 | native, guardrail, method, and review disclosure boundaries use real read spies | pass | focused disclosure tests prove native reads zero bodies, guardrail and method read only their selected body, and reviewer prose is deferred until an artifact exists |
| 12 | the report states byte and estimated-token deltas without a quality claim | pass | `docs/capability-layer-abi-v1-report.md` reports exact bytes and `ceil(bytes / 4)` estimates and explicitly disclaims tokenizer accuracy and model-quality inference |

## verification evidence

the final pre-certification verification produced:

- `npm run build:capability-layer-abi`: pass; 3 canaries, 12 source records,
  21 layer files, and 24 bundle artifacts emitted
- `node --test tests/capability-layer-abi.test.mjs`: 11 passed, 0 failed
- focused compatibility set: 34 passed, 0 failed
- `npm test`: 643 passed, 0 failed, 0 skipped, 0 cancelled
- `git diff --check`: pass
- changed paths from `bc86dac`: 33 intended phase-1 paths, 0 outside the
  declared scope
- activation-default changes: 0

the canary entrypoint blobs are unchanged from `bc86dac` through the reviewed
implementation head:

| capability | unchanged git blob |
|---|---|
| `eternities-aegis` | `e13e6da3261f0bf007e089ab4dd5288a08181f08` |
| `eternities-forge` | `ca3a72fbf305128a48a1e8e45cc0abcf9c83e930` |
| `eternities-muse` | `3c15ebc3ad51404b530083db04e48cb790aa1ecb` |

## independent review

the independent reviewer was the `Maxwell` review agent,
`01a0563b-91ce-7fa0-aab2-36f86274fd70`.

the first review found no critical defect and identified three implementation
issues that required repair: a manifest needed an external trust root,
generated writes needed repository containment and transaction rollback, and
runtime documentation needed to distinguish activation reads from verifier
loading and to state canonicalization semantics. certification-document absence
was retained as the expected final release gate.

the repairs added trusted aggregate-receipt digest verification, preflighted
contained transaction writes with staged byte verification and handled-failure
rollback, forged-manifest and injected-write-failure regressions, a real writer
fixture, and aligned runtime documentation. the same reviewer then inspected
`16efd5475bdf591d7ebe11047656121ac239159f..6d1c1bbb9d2e35f345006c9f46b726eda5e7f60b`,
confirmed each implementation finding resolved, reran the focused tests at
11 of 11 passing, and reported no new or unresolved critical or important
defect. the implementation was assessed ready for certification.

## source and normalization semantics

source identity is byte-exact. manifests and the aggregate receipt retain each
source path, byte count, and SHA-256 digest. generated JSON and Markdown use
the compiler's canonical ordering and newline normalization. canonical output
does not replace or weaken byte-exact source provenance.

## compatibility and authority

legacy hosts continue to consume `skills/<id>/SKILL.md`; that remains the
unchanged default. the layer-aware fixture is additive and must receive an
existing digest-bound activation decision. it validates but does not create
authority, and host authority is intersected without expansion.

`readCapabilityLayers` requires the expected bundle digest from an independently
trusted aggregate receipt. a manifest cannot authenticate itself by presenting
a self-consistent digest. verifier declarations are loaded through a separate
host verification interface, and actual observations must be recorded
separately.

## write safety and rollback

the builder preflights all output paths, resolves the repository root and real
parents, rejects escapes, duplicates, symlinks, and non-file destinations,
stages and verifies every byte, backs up existing outputs, and restores prior
files in reverse order when a handled commit failure occurs.

rollback for this milestone is to disable the layer-aware fixture and remove
the additive generated canary bundles. the unchanged legacy entrypoints remain
available throughout. the transaction proves rollback for handled failures; it
does not yet provide journal-based recovery from abrupt process or machine
termination during the commit interval.

## integration state

the work remains isolated on `feat/capability-layer-abi-v1` in
`.worktrees/capability-layer-abi-v1`. it has not been pushed, merged, installed
globally, connected to the Godagents runtime, or integrated into Lunari. no
activation default or provider behavior changed.

## proof limits and next gate

this certification proves deterministic artifact identity, source and output
digest binding, schema and field closure, disclosure boundaries, additive
legacy compatibility, trusted-manifest consumption, and handled-failure write
rollback for three canaries.

it does not prove model-quality improvement, universal behavior, cross-host
equivalence, external authority, crash-journal recovery, global activation,
Godagents runtime behavior, or Lunari readiness.

phase 2 is not automatically authorized. its entry gate requires these phase-1
bundles to remain certified and every proposed trial to have a real artifact
boundary, an available reviewer or deterministic verifier, a pinned task
definition, and a preregistered comparison policy. any phase-2 implementation
requires a separately approved milestone and evidence boundary.
