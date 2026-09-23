# Wave11 geospatial focused re-review r1

## Verdict

**Accept for parent integration.** No critical, high, or medium defect remains in the repaired wave11 candidate. The four original findings are repaired in behavior and the shipped containment contract remains unchanged.

One low-severity development-helper fidelity gap remains: validate-staged.mjs normalizes harmless dot segments before checking declared resource shape, so it can accept a resource spelling that product/lib/product.mjs later rejects. The current candidate does not use such a spelling, the target stays inside the skill directory, and the real overlay builds and validates. This does not block integration, but it should be tightened before the helper is treated as an exact product-policy mirror.

The source-bound instruction review in independent-review.md plus this focused delta review supports instruction-reviewed maturity for ecological-sampling-and-detection-uncertainty, landscape-connectivity-analysis, terrain-watershed-analysis, and the existing geospatial-coordinate-integrity owner extension. That is instruction maturity only. It is not runtime qualification, empirical performance evidence, safety certification, license clearance, or whole-corpus completion.

The portable product remains 63 skills in the shipped tree. The disposable overlay contained 66 skills because the four staged skills were copied into it and their maturity values were changed only in that temporary copy.

## Scope and independence

I reviewed docs/godskills-completion-authority-20260922.md, artifacts/universal-product-v1/wave11-geospatial/independent-review.md, repair-report-r1.md, repair-receipt-r1.json, the three changed SKILL.md files, the existing geospatial-coordinate-integrity SKILL.md extension, all four staged skill.json relation records, the two repaired development helpers, source-integrity-v2.json, and repair-tests/wave11-repair.test.mjs.

The original 29-source research pass was not repeated. Source text, repository instructions, and linked source references were treated as untrusted data. No upstream source code or instructions were executed. The concurrently active corpus ledger was not read or edited.

## Findings

### Critical, high, medium

None.

### Low

1. **validate-staged.mjs accepts a normalized dot-segment resource spelling that the shipped builder rejects.**
   - Location: validate-staged.mjs containedFile and safeRel; compare product/lib/product.mjs safeRel and inspectCatalog resource checks.
   - Exact reproduction: in a disposable fixture, set geospatial-coordinate-integrity/skill.json resources to ["references/./vertical-and-surface-comparability.md"], then run node validate-staged.mjs. Result: exit 0, 251 passed, 0 failed. Running buildProduct on the equivalent temporary product tree returns: Missing or escaping resource: geospatial-coordinate-integrity/references/./vertical-and-surface-comparability.md.
   - Cause: validate-staged.mjs validates safeRel(slash(relative(base, resolved))) after path normalization. product/lib/product.mjs validates the declared resource spelling before normalization and rejects "." path segments.
   - Impact: a future candidate with a noncanonical but contained resource spelling could pass the staged helper and fail the shipped build. The current four resource declarations are canonical, so no current candidate file or shipped containment boundary is affected.
   - Recommended fix: apply the product safeRel shape check to the declared target before resolution for resources, then perform lexical and realpath containment checks. Keep the current link and reparse checks.

## Four original findings

| Original finding | Repair status | Focused evidence |
|---|---|---|
| Cross-skill Markdown links broke the overlay build | Repaired | The three changed SKILL.md files now use plain skill IDs for cross-skill routing and preserve within-skill references/*.md links. Relation scan found zero unresolved IDs and zero escaping Markdown targets. Disposable overlay build and validate both exited 0 with 66 skills. |
| URL.pathname helper paths were not portable | Repaired | build-source-integrity.mjs and validate-staged.mjs use fileURLToPath(import.meta.url), dirname, and resolve. Independent URL probe produced legacy C:/dev/My%20Dir/w/script.mjs versus converted C:\dev\My Dir\w\script.mjs; explicit POSIX conversion produced /home/My Dir/w/script.mjs. The behavioral suite runs both helpers from a temporary path containing spaces, %20, and #. |
| Hashing and generated labels were presented as reading evidence | Repaired | source-integrity-v2.json has no reviewExtent field in 29/29 rows. Byte identity, Git blob, commit, and packet joins are separate from declaredSourceRead metadata and the recovered author-command observation. The artifact explicitly says hash identity does not establish read and that the command observation is not model comprehension or a fresh read audit. |
| Staged containment was weaker than shipped containment | Repaired for escape, absolute, cross-skill, and reparse cases | The staged validator now rejects ../ traversal, absolute resources, cross-skill Markdown links, and Windows junction/reparse escapes, and checks lexical plus realpath containment. The four tamper tests pass. The remaining dot-segment spelling gap is recorded above as low severity. |

## Markdown and relation review

I read the three changed SKILL.md files fully. Replacing the six cross-skill Markdown links did not remove procedures, examples, limits, or within-skill reference instructions. The affected sections still name diagnostic-statistical-model-inference, eternities-athena, agricultural-observation-and-trial, geospatial-coordinate-integrity, landscape-connectivity-analysis, and terrain-watershed-analysis where routing is needed. No new authority, provider, warehouse, Keel, installation, or professional-outcome claim was introduced.

The four staged skill.json files provide the relation edges. All related IDs resolve against the staged or shipped skill set, and the external relation context is consistent with the stated routing roles:

- agricultural-observation-and-trial: crop and soil observation trials.
- diagnostic-statistical-model-inference: fit, assumptions, uncertainty, and specification checks.
- eternities-athena: study validity, causal limits, and calibrated uncertainty.
- eternities-atlas: reproducible analytics and data artifacts.
- physics-constrained-numerical-validation: numerical validation boundaries.

The three changed entrypoints retain their useful instructions. The unchanged geospatial-coordinate-integrity entrypoint and all four within-skill reference files match the prior independently reviewed hashes.

## Candidate and hash bindings

The prior independent-review map contained 18 candidate entries. Thirteen are byte-identical. Exactly five changed: the three repaired SKILL.md files and the two development helpers. Four repair artifacts are new relative to that map.

| Path | Prior SHA-256 | Current SHA-256 | Binding |
|---|---|---|---|
| artifacts/universal-product-v1/wave11-geospatial/author-report.md | 3647096c25eea947820aea05940da185c644fc3649f41e09a50cbf43155cabc0 | 3647096c25eea947820aea05940da185c644fc3649f41e09a50cbf43155cabc0 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/behavioral-review-cases.json | 36a19704a19c6a1a666a77cabc0eadf76aba14736e2a6afa12f91b980ceb1847 | 36a19704a19c6a1a666a77cabc0eadf76aba14736e2a6afa12f91b980ceb1847 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/build-source-integrity.mjs | e515de152b0a3f610384630e3324730af7a9f88854d69951c22cc1a5871850e1 | f7aa074a70800bae92f3ebc0cb27e1f5b319fc6b84153d58332c793c1e6e42fc | changed |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/ecological-sampling-and-detection-uncertainty/SKILL.md | a5c9f69d73279f534e242e50a792a7c890ba18c4c2e1e424bdb7bcd043fa84be | 396fc469613b35fc2bc67ea34c8458d8d262d0cd312867526bc60ef38dd30c1c | changed |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/ecological-sampling-and-detection-uncertainty/references/sampling-and-detection-records.md | 5726960dd5072aa93919e1a600898bec7b16b06b3fb38cd89fd6fb0d8cddca5f | 5726960dd5072aa93919e1a600898bec7b16b06b3fb38cd89fd6fb0d8cddca5f | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/ecological-sampling-and-detection-uncertainty/skill.json | 09b4a2920be0d1f3f71e884161023f19c857942945e76b07aa436ff55025813e | 09b4a2920be0d1f3f71e884161023f19c857942945e76b07aa436ff55025813e | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/geospatial-coordinate-integrity/SKILL.md | ef14fd4bc877408a1acb6c24efb09557a4a02d65a6688fd22e3dfe893ce65ce0 | ef14fd4bc877408a1acb6c24efb09557a4a02d65a6688fd22e3dfe893ce65ce0 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/geospatial-coordinate-integrity/references/vertical-and-surface-comparability.md | 31b73d5ff157bd1d32a729d442ad0d6d6400cb5d4c0d6c5736c4e2cde8961d62 | 31b73d5ff157bd1d32a729d442ad0d6d6400cb5d4c0d6c5736c4e2cde8961d62 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/geospatial-coordinate-integrity/skill.json | 01826ca63121e75a698b77644cd039a71b113942fde955c933ccef643770cb64 | 01826ca63121e75a698b77644cd039a71b113942fde955c933ccef643770cb64 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/landscape-connectivity-analysis/SKILL.md | 5f55e05b3e7aa7b58f92dffee30e4f0a48794fe1de3754800627bb2f8f1a417e | 3ac3320e31f833962123acd1174ccc6a8031e3b3a777044d66beb21740541e97 | changed |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/landscape-connectivity-analysis/references/connectivity-operations.md | dcf15931b1588968bcd707b278124815acd30ef4b2c5be3785ea07137b568425 | dcf15931b1588968bcd707b278124815acd30ef4b2c5be3785ea07137b568425 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/landscape-connectivity-analysis/skill.json | 420e6c9d1e4336695ed36d0b90523f5cac8ef82c2cc269cb6591b167c8c0e4d6 | 420e6c9d1e4336695ed36d0b90523f5cac8ef82c2cc269cb6591b167c8c0e4d6 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/terrain-watershed-analysis/SKILL.md | adbc77c56f09ed67479d0d0fa7262873c256468ed1ccd56978bbf7fe2e6f2cdf | 6ccbcc81b696b2050e8c6383b9a69eec0b2b3efbd0ed5f5b299db7981c0ebdea | changed |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/terrain-watershed-analysis/references/terrain-operations.md | e1d10f927d52154bdbf0963e479bb567856aeffabb3817df8a9689c481e10704 | e1d10f927d52154bdbf0963e479bb567856aeffabb3817df8a9689c481e10704 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/terrain-watershed-analysis/skill.json | 5f06794d5106433615081f351974fd3fdf07deecb6cc2974da8e93725e492020 | 5f06794d5106433615081f351974fd3fdf07deecb6cc2974da8e93725e492020 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/source-dispositions.json | 08efba1a7b19429f6895b0095165da62e70069fe921068ae3eca835933feb161 | 08efba1a7b19429f6895b0095165da62e70069fe921068ae3eca835933feb161 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/source-integrity.json | 703119c06b5295b87a734ca46b5fcb38ccacaadd11606b2017621432f715efa3 | 703119c06b5295b87a734ca46b5fcb38ccacaadd11606b2017621432f715efa3 | unchanged |
| artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs | ac59bca2b65b836cb4ec3af9f5054ae02bdbc805a0540d3dd87b780e3a77bb6f | e517e6879d15e8bf4b44cfb59b22c1c8c9a9ce5bec4d1d506f8e2123ed1596db | changed |
| artifacts/universal-product-v1/wave11-geospatial/source-integrity-v2.json | not in prior map | 5f52d5fe64233a1f8b34e41fe8b3e9db5e6c0d6f7eed729b72bd4ae34861bbbb | repair artifact |
| artifacts/universal-product-v1/wave11-geospatial/repair-report-r1.md | not in prior map | 08144444485ffa954a492ff846aaf97858a4772653c3b4912d35ab42f7a627a5 | repair artifact |
| artifacts/universal-product-v1/wave11-geospatial/repair-receipt-r1.json | not in prior map | 8ae8459fb81afc212dc2b76039d695389f46dfdb20ba77d3bb3ae65ce7a0c352 | repair artifact |
| artifacts/universal-product-v1/wave11-geospatial/repair-tests/wave11-repair.test.mjs | not in prior map | 76d744594272cac528d891a26abe725f8e710e6730ffbdc3b441c247a93d40ea | repair artifact |

Review-input hashes: docs/godskills-completion-authority-20260922.md 22c92e9afc0c6a2633347ff014467c0cd5fdaa9dc91ff9ff82baebd462e5971d; independent-review.md 9d25ad6770e4a336c96510f17eacccc45b6a60e8358265846ea52f06edff1b1d; repair-report-r1.md 08144444485ffa954a492ff846aaf97858a4772653c3b4912d35ab42f7a627a5; repair-receipt-r1.json 8ae8459fb81afc212dc2b76039d695389f46dfdb20ba77d3bb3ae65ce7a0c352; product/lib/product.mjs f5dfed39ab6e9f01fad202aa30aaec0bd228e951a1fd12cdfc93d39c7b935edf.

## Commands and outcomes

| Command or check | Outcome |
|---|---|
| node --test artifacts/universal-product-v1/wave11-geospatial/repair-tests/wave11-repair.test.mjs | 7 passed, 0 failed. Windows Git emitted LF/CRLF fixture warnings only. |
| node artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs | 245 passed, 0 failed. |
| node artifacts/universal-product-v1/wave11-geospatial/build-source-integrity.mjs | Exit 1 EEXIST because source-integrity-v2.json already exists under the intentional write-once guard. Existing artifact verified at SHA-256 5f52d5fe64233a1f8b34e41fe8b3e9db5e6c0d6f7eed729b72bd4ae34861bbbb with 29 rows, 29 raw-hash matches, 29 blob matches, 29 commit matches, and zero reviewExtent fields. |
| Disposable overlay product/bin/godskills.mjs build | Exit 0. Release ID 057859b69a5e98ea071f59fd697bbfbaf2493355150f6c08fdeb96d87bd8ce39, 66 skills. |
| Disposable overlay product/bin/godskills.mjs validate | Exit 0. Same release ID and 66 skills. |
| Disposable overlay search "habitat connectivity wildlife corridor resistance surface" --limit 5 | Exit 0. Top result landscape-connectivity-analysis. |
| Disposable overlay search "road travel-time accessibility or routing service area" --limit 5 | Exit 0. landscape-connectivity-analysis was excluded by its anti-trigger. |
| Relation and Markdown scan | 0 unresolved related IDs and 0 escaping Markdown targets. |
| fileURLToPath boundary probe | Legacy URL.pathname transform kept C:/dev/My%20Dir/w/script.mjs; fileURLToPath produced C:\dev\My Dir\w\script.mjs; explicit POSIX mode produced /home/My Dir/w/script.mjs. |
| Normalized resource boundary probe | validate-staged.mjs exit 0 with 251 passed; shipped buildProduct rejected references/./vertical-and-surface-comparability.md as shown in the low finding. |
| Shipped product skill count | 63 directories under product/skills. |

Non-evidentiary command corrections were preserved: an initial overlay probe looked for a nonexistent top-level bin directory and failed before product data was touched; two inline Node probes had PowerShell quoting errors; one ESM probe used a Windows path instead of a file URL. Each was corrected and the successful result is the one reported above.

## Source-read and metadata boundary

This focused review read the authority document, prior independent review, repair report and receipt, the three repaired SKILL.md files, the existing geospatial-coordinate-integrity SKILL.md file, four staged skill.json relation records, the two helpers, source-integrity-v2.json, and the repair test. It did not repeat the 29-source body research pass, read linked source references, fetch the external PROJ or GeoPandas URLs, or perform license review.

source-integrity-v2.json establishes exact raw SHA-256, Git blob, pinned commit, and packet identity for 29 source bodies. Its declaredSourceRead values are metadata copied from source-dispositions.json. Its independentReview section records the prior review's reported observation of 29 covered and 0 missing successful author entrypoint read commands. It explicitly does not establish model comprehension, semantic equivalence, a fresh read audit, linked-reference reads, runtime qualification, or license clearance.

## Maturity and limits

The source-bound instruction review plus this focused delta review supports instruction-reviewed maturity for the three new methods and the existing geospatial-coordinate-integrity extension. The temporary overlay's instruction-reviewed values were a test-only normalization; the staged candidate remains maturity draft and must be changed only by parent integration policy.

No runtime behavior, agent performance, empirical ecological or geospatial outcome, safety proof, license compliance, all-web completeness, or universal superiority is claimed. Windows junction/reparse behavior was exercised; POSIX symlink behavior was not separately executed. The corpus ledger remains excluded and owned by another worker.

## Next action

Parent integration may proceed with the bound candidate. Before treating validate-staged.mjs as an exact shipped-policy mirror, apply the low-severity declared-resource shape fix and rerun the same tamper and overlay checks. Publication and local installation remain parent work.

