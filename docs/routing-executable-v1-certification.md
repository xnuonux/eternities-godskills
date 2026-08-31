# routing executable v1 certification

certified: 2026-08-31

disposition: `certified-structural-executable`

receipt status: `verified-build`

proof boundary: `deterministic-local-routing-executable-integrity-only`

## certified scope

this disposition covers the provider-neutral file-in and file-out Godskills
routing process at `scripts/routing.mjs`. the process supports exactly the
`default` and `specialist` modes, verifies one complete executable trust root
before reading the request, fixes the canonical routing-card source, invokes
the existing certified intent pipeline, and writes one canonical result
atomically.

the reviewed source commit is
`62b43e55c8bb77a4c42d838c5783bca99f4ca1c2` on branch
`feat/routing-executable-v1`. its immutable base is
`3a63c07322808b6958593bd765c0fb32023a2da5`.

the generated receipt remains `verified-build`. this document records the
inline structural review and repository test disposition without promoting the
receipt into a model-quality, host-isolation, provider, or global-activation
claim.

## frozen trust root

| artifact | exact identity |
|---|---|
| executable receipt logical digest | `30ca5eb79e8935d8701f2fb466a22dd0007fc370f587c191fe03d065a930ff28` |
| executable receipt file SHA-256 | `27cd2bc10ab225f62916f684bd5a621a3ffeaec43ef93c36d8b5b53188193c7d` |
| entrypoint file SHA-256 | `d739bfde833fb08e4675c4de5fe4ec8b46cfec29b3155a72bdf03550d45c60ce` |
| receipt builder file SHA-256 | `5d99e5fa9a97aaf4fc7241eca0d057954f6bb286d35feea09a8c0894898174a4` |
| routing cards file SHA-256 | `4f50424440d64c14b98f85e9b50603c05d14c2ede9fa37c2c8d48c8cd0b09733` |
| routing family map file SHA-256 | `1245d8cf4d28885c55b7602e545e892f7155b5eca8c6b9969e2dff71d913c2e0` |
| routing manifest file SHA-256 | `726371ba42663d489e3fd12bd88972cff51ef57d9fa49ee6647fad7a2acc2fc2` |

the complete static local-module closure contains 17 unique paths:

1. `scripts/build-routing-executable-receipt.mjs`
2. `scripts/intent-preference.mjs`
3. `scripts/intent.mjs`
4. `scripts/routing.mjs`
5. `src/intent-compiler.mjs`
6. `src/intent-contracts.mjs`
7. `src/intent-runtime.mjs`
8. `src/io.mjs`
9. `src/quarry-atlas.mjs`
10. `src/router.mjs`
11. `src/routing-contracts.mjs`
12. `src/routing-index.mjs`
13. `src/specialist-preference-contracts.mjs`
14. `src/specialist-preference-router.mjs`
15. `src/specialist-preference-routing-index.mjs`
16. `src/specialist-preference-runtime.mjs`
17. `src/static-module-closure.mjs`

the receipt additionally binds the exact cards, family map, routing manifest,
and five parent receipts. each parent requires exact bytes, identity, status,
and a canonical logical digest. the two parents that carry their own receipt
digest are also validated under their original digest algorithms. this
preserves the portable-manifest historical insertion-order digest rather than
silently rewriting it as the newer canonical-object algorithm.

## acceptance disposition

| condition | disposition | evidence |
|---|---|---|
| closed protocol | pass | only mode, request, output, and receipt are accepted; unknown, duplicate, missing, relative, lexical-alias, newline-bearing, and colliding arguments fail closed |
| complete executable identity | pass | the static scanner discovers 17 unique local modules and rejects unresolved, external, dynamic, escaping, duplicate, and symlink-aliased dependencies |
| deterministic build | pass | two consecutive production builds emitted the same logical receipt digest and byte-identical receipt file hash |
| exact parents and data | pass | five parent receipts and three routing artifacts require their frozen file hashes, logical identity, and expected status |
| receipt-bound execution | pass | the entrypoint rebuilds the trust root and requires byte-canonical receipt equality before parsing the request |
| real default path | pass | the new entrypoint invokes the existing default compiler and router and produces a deterministic validated result |
| real specialist path | pass | the new entrypoint invokes the existing preference-aware compiler and router and preserves its certified preference protocol |
| mutation refusal | pass | changed module, routing artifact, parent, or candidate receipt bytes terminate before request execution |
| atomic result | pass | the inherited checked file transports stage and rename canonical output only after compilation succeeds |
| authority neutrality | pass | the 17-module closure contains no process spawn, network, provider, credential, environment, model, Realm, continuity, identity, evolution, Inspiration, or Soul authority |
| historical compatibility | pass | `package.json` and every pre-existing checked receipt remain byte-compatible; no existing routing or activation entrypoint changed |

## verification evidence

the final release gate produced:

- focused routing, compiler, preference, closure, and activation gate: 37
  passed, 0 failed, 0 skipped, 0 cancelled;
- checked-receipt routing gate: 5 passed, 0 failed, 0 skipped, 0
  cancelled;
- compatibility recovery gate: 6 passed, 0 failed, 0 skipped, 0
  cancelled;
- full `npm test`: 768 passed, 0 failed, 0 skipped, 0 cancelled;
- two direct receipt builds: logical digest
  `30ca5eb79e8935d8701f2fb466a22dd0007fc370f587c191fe03d065a930ff28`
  and file SHA-256
  `27cd2bc10ab225f62916f684bd5a621a3ffeaec43ef93c36d8b5b53188193c7d`
  both times;
- `git diff --check`: pass.

the first full-suite attempt ran without the lockfile dependency installed in
the isolated worktree. 764 tests passed and three evaluator tests stopped on a
missing `node_modules/acorn/dist/acorn.mjs`. `npm ci --ignore-scripts`
installed the one declared dependency with zero audit findings. the two
affected test files then passed 6 of 6. the fresh product suite passed 767 of
767, and the final suite including this certification check passed 768 of 768.
this was an environment repair, not a product-code exception.

that first attempt also caught an attempted convenience change to
`package.json`, whose bytes are intentionally bound by an older aggregate
receipt. the package change was removed, the historical bytes were preserved,
and the README now names the direct builder command. the final 768-test gate
therefore proves compatibility with the existing aggregate receipt rather than
regenerating unrelated historical evidence.

## inline adversarial review

the user required all work to remain inline with no subagents or task
coordination. the review therefore inspected the full feature diff and the
17-path closure in this task. it searched for child-process, network,
environment, dynamic-loading, and code-execution authority; traced every file
read and atomic write; exercised stale-root-before-request ordering; and ran
the complete historical repository gate.

no critical or important defect remains in the reviewed structural boundary.
this is not an independent-review claim. independent review may be added later
as a new evidence layer without changing the frozen source or receipt.

## compatibility and rollback

the feature is additive. ordinary Godskills routing and adaptive activation do
not invoke `scripts/routing.mjs`. a host must deliberately pin the exact receipt
and launch this entrypoint.

rollback is to omit or remove that optional host pin. the existing Godskills
catalog, compiler, router, specialist-preference path, activation compiler,
policies, evidence, skills, and historical receipts remain unchanged.

## proof limits

the receipt and this certification prove deterministic executable identity,
complete static local-module closure, exact routing-data and parent binding,
closed argument behavior, default and specialist dispatch, deterministic
result construction, and handled-failure output safety for the reviewed local
build.

they do not prove:

- model or routing quality on unseen missions;
- provider, model, credential, or network access;
- a scrubbed host process environment;
- host timeout, input ceiling, output ceiling, or process cleanup;
- durable host dispatch reconciliation or cross-process deduplication;
- isolation from a hostile actor with access to the same user filesystem;
- global activation or default Codex behavior;
- Godagents adapter correctness;
- Lunari, Realm, continuity, Inspiration, or Soul integration.

Godagents consumption is a separate dependent release. it must pin this exact
trust root, add its own scrubbed and bounded local transport, persist a durable
result before admission, and pass a separate integrated certification gate.
