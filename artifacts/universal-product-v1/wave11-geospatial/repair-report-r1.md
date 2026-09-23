# Wave11 geospatial repair report r1

**Status:** ready for focused re-review. Proposed skills remain `maturity: draft` in the staged candidate. The shipped product contract was not changed.

## Repairs

1. **Cross-skill Markdown links replaced with portable relation IDs.** The six sibling links in `ecological-sampling-and-detection-uncertainty/SKILL.md`, `landscape-connectivity-analysis/SKILL.md`, and `terrain-watershed-analysis/SKILL.md` are now plain backticked skill IDs. Within-skill `references/*.md` links were preserved. The existing `skill.json.related` edges already contained the required IDs and were verified unchanged and complete: `agricultural-observation-and-trial`, `diagnostic-statistical-model-inference`, `eternities-athena`, `geospatial-coordinate-integrity`, `landscape-connectivity-analysis`, and `terrain-watershed-analysis` as applicable. `product/lib/product.mjs` remains unchanged and still rejects sibling traversal.

2. **Development helper paths are portable.** `build-source-integrity.mjs` and `validate-staged.mjs` now use `fileURLToPath(import.meta.url)` with `dirname` and `resolve`. The behavioral suite executes both helpers from a temporary path containing spaces, `%20`, and `#`.

3. **Integrity identity and read evidence are separate.** `build-source-integrity.mjs` now emits the new `source-integrity-v2.json`; the frozen `source-integrity.json` is preserved byte-for-byte. Hash identity fields establish raw SHA-256, Git blob, commit, and packet joins only. Declared `sourceRead` values come from `source-dispositions.json` metadata. The independent-review evidence is bound as a separate observation of recovered author command output: 29 covered entrypoints, 0 missing, after Windows/POSIX separator normalization. It is explicitly not model comprehension and not a fresh read audit. The v2 rows contain no `reviewExtent` field.

4. **Staged validation mirrors shipped containment.** `validate-staged.mjs` now rejects absolute and escaping resources, same-skill containment violations, cross-skill Markdown links, and symlink/reparse escapes. It checks lexical and `realpath` containment and excludes rejected reparse entries from later file reads. The `fromProduct` sibling fallback was removed.

## Checks and outcomes

| Check | Command or evidence | Outcome |
|---|---|---|
| Initial behavioral red run | `node --test repair-tests/wave11-repair.test.mjs` before repair | 7/7 failed; URL-derived helper paths, unconditional `reviewExtent`, cross-skill links, and weak resource checks reproduced the review findings. A test-root calculation error also surfaced and was repaired in the test harness. |
| Focused pre-repair run after harness fix | same command after link edits but before helper/validator/generator repairs | 2 passed, 5 failed: generator output shape/read separation and tampered staged checks still failed. |
| Behavioral green run | `node --test repair-tests/wave11-repair.test.mjs` after repairs | 7/7 passed. Includes reviewed temporary overlay build, space/escaped-character helper paths, separated read evidence, and four tampered validator fixtures: `../`, absolute, cross-skill, and junction/reparse escape. |
| Staged validator | `node validate-staged.mjs` | Finished tree: 245 passed, 0 failed. The pre-report run was 243 passed; the two added repair JSON artifacts account for the difference. |
| Corrected integrity generator | `node build-source-integrity.mjs` | Exit 0. `source-integrity-v2.json` SHA-256 `5f52d5fe64233a1f8b34e41fe8b3e9db5e6c0d6f7eed729b72bd4ae34861bbbb`; 29/29 raw hash, blob, and commit matches; declared reads 27 `full-entrypoint` and 2 `full-entrypoint-reverified`; review command observation 29 covered, 0 missing. |
| Temporary complete overlay | copied `product/*` plus four candidate skills; changed only temporary maturity values to `instruction-reviewed`; ran `node bin/godskills.mjs build` and `validate` | Build exit 0 and validate exit 0; release ID `057859b69a5e98ea071f59fd697bbfbaf2493355150f6c08fdeb96d87bd8ce39`; 66 skills. Passing package/build checks do not grant instruction review. |
| Positive discovery | `node bin/godskills.mjs search "habitat connectivity wildlife corridor resistance surface" --limit 5` | Exit 0; top result `landscape-connectivity-analysis`. |
| Negative discovery | `node bin/godskills.mjs search "road travel-time accessibility or routing service area" --limit 5` | Exit 0; `landscape-connectivity-analysis` was excluded by its anti-trigger. |

## Source-read and evidence boundary

- The independent review's `author-entrypoint-read-coverage` check records 29 covered and 0 missing successful, non-empty author entrypoint read commands in recovered `command_execution` output. This supports command-output coverage only. It does not establish model comprehension, semantic equivalence, or a new read audit.
- `source-dispositions.json` supplies the declared per-source read labels: 27 `full-entrypoint`, 2 `full-entrypoint-reverified`, and `sourceReadSummary` remains unchanged. Those labels are source-accounting metadata, not proof of reading by this generator.
- The v2 integrity rows establish exact byte identity and pinned Git identity for 29 source bodies. They do not convert hashes into read claims. Linked references were not read. License review remains metadata or body-claim only.
- No upstream source code or instructions were executed or followed. No network/API calls were made. No provider key, warehouse installation, Keel, Godagents, publication, installation, or global configuration was used.

## Changed hashes

| Path | SHA-256 |
|---|---|
| `proposed-product/skills/ecological-sampling-and-detection-uncertainty/SKILL.md` | `396fc469613b35fc2bc67ea34c8458d8d262d0cd312867526bc60ef38dd30c1c` |
| `proposed-product/skills/landscape-connectivity-analysis/SKILL.md` | `3ac3320e31f833962123acd1174ccc6a8031e3b3a777044d66beb21740541e97` |
| `proposed-product/skills/terrain-watershed-analysis/SKILL.md` | `6ccbcc81b696b2050e8c6383b9a69eec0b2b3efbd0ed5f5b299db7981c0ebdea` |
| `build-source-integrity.mjs` | `f7aa074a70800bae92f3ebc0cb27e1f5b319fc6b84153d58332c793c1e6e42fc` |
| `validate-staged.mjs` | `e517e6879d15e8bf4b44cfb59b22c1c8c9a9ce5bec4d1d506f8e2123ed1596db` |
| `source-integrity-v2.json` | `5f52d5fe64233a1f8b34e41fe8b3e9db5e6c0d6f7eed729b72bd4ae34861bbbb` |
| `repair-tests/wave11-repair.test.mjs` | `76d744594272cac528d891a26abe725f8e710e6730ffbdc3b441c247a93d40ea` |

The four `skill.json` files and all four within-skill reference files were already correct and unchanged. The receipt intentionally omits a self-hash for `repair-receipt-r1.json` because embedding it would be self-referential; every other changed or preserved file is hashed here or in the receipt.

## Preserved files

The protected and historical files remain unchanged: `source-integrity.json` `703119c06b5295b87a734ca46b5fcb38ccacaadd11606b2017621432f715efa3`, `source-dispositions.json` `08efba1a7b19429f6895b0095165da62e70069fe921068ae3eca835933feb161`, `author-report.md` `3647096c25eea947820aea05940da185c644fc3649f41e09a50cbf43155cabc0`, `independent-review.md` `9d25ad6770e4a336c96510f17eacccc45b6a60e8358265846ea52f06edff1b1d`, and `review-receipt.json` `bd07b4bdcea4a614df412a627694f77d00d64bd4e36a02369205e2ececddfabc`. `product/lib/product.mjs` remains `f5dfed39ab6e9f01fad202aa30aaec0bd228e951a1fd12cdfc93d39c7b935edf`.

## Limits and next action

The junction/reparse test was exercised on Windows; POSIX symlink behavior was not separately executed in this run. The helper path test covers Windows paths with spaces and escaped characters and the corrected `fileURLToPath` behavior, but does not claim a full cross-platform matrix. The corpus ledger was excluded and remains owned by another worker. No instruction review, runtime qualification, all-web completeness claim, or installation claim is made.

Next action: focused re-review of the three repaired `SKILL.md` files, the two helpers, `source-integrity-v2.json`, `validate-staged.mjs`, and the overlay results. Parent integration should proceed only after that review; actual product publication and local installation remain parent work.
