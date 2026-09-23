# Wave11 geospatial integration report r1

## Status

**Ready for parent verification.** The accepted wave11 candidate is integrated into the portable product at release ID `5a40580eaf6a2a00bb1e64d5f78e48cd1cd2d9808153d73ea801626effd201ac` with 66 methods. The actual product builds, validates, searches, and runs from a product-only temporary copy using Node built-ins.

This is a bounded wave11 product integration. **Whole-corpus work is unfinished.** No commit, merge, push, publication, real installation, provider call, Keel action, or global configuration change was performed. The parallel corpus-ledger lane was not read, reviewed, or edited.

## Low-severity helper repair

The focused re-review finding was reproduced test-first. A regression was added for a contained but noncanonical resource declaration, `references/./vertical-and-surface-comparability.md`. Before the helper change, `node --test --test-name-pattern "rejects normalized dot-segment" artifacts/universal-product-v1/wave11-geospatial/repair-tests/wave11-repair.test.mjs` exited 1 because `validate-staged.mjs` exited 0 with 180 passed checks while the shipped builder rejects that declaration shape.

The repair applies the shipped `safeRel` declaration-shape rule to resource declarations before path resolution. The existing normalized lexical containment, absolute-path rejection, exists/regular-file checks, ancestor symlink/reparse checks, realpath containment, and Markdown link checks remain in place. The targeted regression then passed, the complete repair suite passed 8/8, and the real staged validator passed 247/0 before the integration artifacts were added and 249/0 after they were added.

Changed evidence hashes:

| File | Before SHA-256 | After SHA-256 |
|---|---|---|
| `artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs` | `e517e6879d15e8bf4b44cfb59b22c1c8c9a9ce5bec4d1d506f8e2123ed1596db` | `abae59775e7c7855b82cd3ccb2e3d976fc611de3492cdb5a0a65ab5a1c770c9c` |
| `artifacts/universal-product-v1/wave11-geospatial/repair-tests/wave11-repair.test.mjs` | `76d744594272cac528d891a26abe725f8e710e6730ffbdc3b441c247a93d40ea` | `b6da5c184d20741a2d604cd6ee71ba21fbdad58418bb3fd82cc973603cb7e201` |
| `tests/universal-wave11-discovery.test.mjs` | new | `16bb6a1607d5bf45d735c101988b13bb2ac22fbf4f0672f3d789a215d4c56dfe` |

## Candidate-to-product byte mapping

The staged originals remain `maturity: draft`. All 12 staged files still match the focused re-review receipt hashes. The eight Markdown/resource files are byte-identical in the product. Each product `skill.json` differs from staged only by `maturity: draft -> instruction-reviewed`.

| Staged file suffix | Product file suffix | Staged SHA-256 | Product SHA-256 | Transformation |
|---|---|---|---|---|
| `ecological-sampling-and-detection-uncertainty/SKILL.md` | same | `396fc469613b35fc2bc67ea34c8458d8d262d0cd312867526bc60ef38dd30c1c` | same | byte-identical |
| `ecological-sampling-and-detection-uncertainty/references/sampling-and-detection-records.md` | same | `5726960dd5072aa93919e1a600898bec7b16b06b3fb38cd89fd6fb0d8cddca5f` | same | byte-identical |
| `ecological-sampling-and-detection-uncertainty/skill.json` | same | `09b4a2920be0d1f3f71e884161023f19c857942945e76b07aa436ff55025813e` | `b99dad708acef989811c6315532284ca70b1f1fa44d7c4473e7004f310d7a18c` | maturity only: `draft -> instruction-reviewed` |
| `landscape-connectivity-analysis/SKILL.md` | same | `3ac3320e31f833962123acd1174ccc6a8031e3b3a777044d66beb21740541e97` | same | byte-identical |
| `landscape-connectivity-analysis/references/connectivity-operations.md` | same | `dcf15931b1588968bcd707b278124815acd30ef4b2c5be3785ea07137b568425` | same | byte-identical |
| `landscape-connectivity-analysis/skill.json` | same | `420e6c9d1e4336695ed36d0b90523f5cac8ef82c2cc269cb6591b167c8c0e4d6` | `0038f2d442ecaea04d8fcb82fdd4bb2634b2142dd5a5c1c5ad843b7bd79a9882` | maturity only: `draft -> instruction-reviewed` |
| `terrain-watershed-analysis/SKILL.md` | same | `6ccbcc81b696b2050e8c6383b9a69eec0b2b3efbd0ed5f5b299db7981c0ebdea` | same | byte-identical |
| `terrain-watershed-analysis/references/terrain-operations.md` | same | `e1d10f927d52154bdbf0963e479bb567856aeffabb3817df8a9689c481e10704` | same | byte-identical |
| `terrain-watershed-analysis/skill.json` | same | `5f06794d5106433615081f351974fd3fdf07deecb6cc2974da8e93725e492020` | `078e2c0fea4f018546e0072c5c02f6f62305fa8768ff7e480fd3e5bc49d00cd5` | maturity only: `draft -> instruction-reviewed` |
| `geospatial-coordinate-integrity/SKILL.md` | same | `ef14fd4bc877408a1acb6c24efb09557a4a02d65a6688fd22e3dfe893ce65ce0` | same | byte-identical |
| `geospatial-coordinate-integrity/references/vertical-and-surface-comparability.md` | same | `31b73d5ff157bd1d32a729d442ad0d6d6400cb5d4c0d6c5736c4e2cde8961d62` | same | byte-identical |
| `geospatial-coordinate-integrity/skill.json` | same | `01826ca63121e75a698b77644cd039a71b113942fde955c933ccef643770cb64` | `ff7a9264006771ae6d4cb3e1d0a25a94bd7aea39dd5433ccf70c0c4b2371b318` | maturity only: `draft -> instruction-reviewed` |

The maturity promotion is supported by the source-bound initial instruction review in `independent-review.md` plus the accepted focused repair delta review in `focused-rereview-r1.md`. This is instruction maturity only, not runtime qualification, safety certification, empirical performance evidence, or license clearance.

## Portable product snapshot

The generated snapshot changed for one justified reason: three accepted methods were added and the accepted geospatial owner extension replaced its previous two-file form with the reviewed entrypoint, metadata, and bundled reference. The product count moved from 63 to 66; no expected count was edited without this binding.

| Generated file | Before SHA-256 | After SHA-256 |
|---|---|---|
| `product/catalog.json` | `452e9145554c070fd40c61a6cfa19217f10069302ddaa73076b214850fcf028a` | `6a02a2bd9161f60322c16de41110eace48dcc7d1660a97e83b5af8c9a1f367ef` |
| `product/INDEX.md` | `1ec543ea6f3e88b8927cefdb6efbd1f1dc68b7250086d25637a8aaffda800532` | `284ba67e5cdcbc05287223b80af769453e817ec9528476ed4a20620ed9d108e1` |
| `product/release.json` | `fb35467a38d9901396f30c5e0467afad6a9c4b17fcafad1182e45e1a225a663a` | `34fed492cd18bd39ef4ecc4afa7fbb15db80baf86222e8484a97f30e29efd06a` |

Baseline `HEAD` was `fa1617889bcf50741b157c34d582011427495ccd`, release ID `756fcb45d4573d4297845ac906fd8f264ebf06349d446cbae40fd344ffdbb00d`, 63 skills. The actual release ID is `5a40580eaf6a2a00bb1e64d5f78e48cd1cd2d9808153d73ea801626effd201ac`, 66 skills.

## Verification

| Command or check | Outcome |
|---|---|
| `node --test --test-name-pattern "rejects normalized dot-segment" artifacts/universal-product-v1/wave11-geospatial/repair-tests/wave11-repair.test.mjs` before repair | Exit 1. Red reproduction: staged helper accepted the declaration with 180 passed checks. |
| Same targeted command after repair | Exit 0, 1 passed, 0 failed. |
| `node --test artifacts/universal-product-v1/wave11-geospatial/repair-tests/wave11-repair.test.mjs` | Exit 0, 8 passed, 0 failed. Windows Git emitted fixture LF/CRLF warnings only. |
| `node artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs` | Exit 0 both runs: 247 passed before integration artifacts, then 249 passed after `integration-report-r1.md` and `integration-receipt-r1.json` were added; 0 failed in both runs. |
| `node product/bin/godskills.mjs build` | Exit 0. Release `5a40580e...`, 66 skills. |
| `node product/bin/godskills.mjs validate` | Exit 0, `verified-content`, same release ID and count. |
| `node --test tests/universal-wave11-discovery.test.mjs` | Exit 0, 4 passed, 0 failed. Count, maturity, bundled resources, relation edges, and positive/negative routes verified. |
| Targeted product contract and discovery suites | Exit 0, 73 passed, 0 failed, 1 platform-specific skip (`different-volume commit destinations`). Included `universal-product`, wave5-wave11 discovery, and discovery-cases suites. |
| Clean-machine product-only probe | Exit 0. A new temp root contained only the product tree; `PATH`, user config, Codex home, and warehouse access were omitted. Build and validate both returned release `5a40580e...`, 66 skills. Each of three positive searches ranked the intended method first; each exact anti-trigger search excluded the target. All results remained `authority: none`, `activation: none`. The resolved temp root passed containment checks and was removed. |

Installer and rollback were not duplicated in the clean-machine probe because `tests/universal-product.test.mjs` already covers those paths in disposable temporary directories. The passing `installer preserves unrelated skills, backs up replacements, and rolls back exact bytes` test is the rollback evidence: it preserved an unrelated skill, retained the replaced bytes in backup, rolled back, and restored the exact prior target set. Publication and real installation remain parent work.

Non-evidentiary harness failures are preserved: the first route-suite run raced manifest generation and read the prebuild 63-entry catalog; a PowerShell byte-map probe had a parser error; and a combined PowerShell clean-room wrapper was rejected by command policy before execution because it mixed environment changes with computed recursive cleanup. The route suite was rerun sequentially, the byte-map probe was corrected, and the clean-room work was rerun as one Node-built-in probe with containment-checked cleanup. No product bytes changed during those harness corrections.

## Protected paths

The three frozen activation paths were not edited and match `HEAD` byte-for-byte:

| Protected path | SHA-256 |
|---|---|
| `src/adaptive-activation.mjs` | `9844aee1147f7129f3e37067424ccebb88ff478de1b7a9a9fb7306d5f2fdbd82` |
| `policies/adaptive-activation.v1.json` | `b87bbfaddecb42417e57202173220bf240204d27b7de5fffc9e609eb18138939` |
| `artifacts/adaptive-activation/evidence.v1.json` | `b55a5cb4f7ff039cc7f4027c165b2f151bad723d9030913076a4225342fbe8c5` |

## Evidence boundary

This integration performed zero fresh source-body reads and zero linked-reference reads. It copied only reviewed candidate files, changed only product maturity metadata, regenerated product manifests, and checked exact bytes and behavior. Source identity evidence remains metadata and hash accounting: `source-integrity-v2.json` records 29/29 raw SHA-256, Git blob, pinned commit, and packet-field matches, while `source-dispositions.json` records the declared source-read labels. Hash identity does not establish comprehension or a fresh read.

The instruction-review basis is the earlier full initial review, which recorded reads of the retained source entrypoints, plus the focused delta review that reread the repaired product instructions and accepted them. No external URL was fetched during integration. No claim is made about model comprehension beyond those reviews, semantic equivalence, runtime or agent performance, safety certification, license clearance, universal superiority, or all-web completeness.

## Remaining limits and next action

- Whole-corpus disposition and synthesis remain unfinished; the parallel ledger lane is separate and still out of scope here.
- License hints and uncertainty remain in provenance; redistribution obligations were not cleared.
- Windows junction/reparse behavior was exercised; POSIX symlink behavior was not separately executed.
- The product-focused suite had one platform-specific skip on this machine.
- Tests prove packaging, integrity, routing, installation, and rollback contracts, not agent expertise or empirical ecological/geospatial outcomes.
- No publication or real local installation was performed.

Next concrete action: parent verification of the 66-skill release, the candidate-to-product byte map, and these receipts. If accepted, the parent owns commit/merge/push, publication, and the real local installation with its rollback record.
