# Wave11 geospatial independent review

**Verdict: not ready for parent integration.** The source accounting is strong and the proposed methods are substantively distinct, but the real staged overlay cannot build against the shipped product contract. Six cross-skill Markdown links are rejected by `product/lib/product.mjs`'s same-skill link containment check. Fix those links, then the package is suitable for a focused re-review.

## Recovery boundary

This is recovery and finalization of an interrupted review, not a claim that the first reviewer attempt succeeded. The prior process ended with exit 1 and `turn.failed` after an SSE idle timeout. Its completed `command_execution` records and outputs were recovered from `C:/Users/Dom/.codex/providers/mimo/godskills-wave11-review-r2-events.jsonl` with local bounded extractors. Model assertions without command output were not treated as evidence. The two checks identified as unfinished were completed here: Windows/POSIX-normalized author-log read coverage and per-case URL conversion. The failed R2 attempts are preserved: `item_67` (incorrect overlay copy layout), `item_64` and `item_74` (malformed URL probe commands), and `item_35` (Git dubious-ownership failure before the command-local `safe.directory` retry in `item_39`).

## Findings

### Critical

1. **Cross-skill Markdown links make the staged overlay unbuildable.**
   - Files and lines: `artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/ecological-sampling-and-detection-uncertainty/SKILL.md:62`, `:64`, `:66`; `artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/landscape-connectivity-analysis/SKILL.md:66`, `:68`; `artifacts/universal-product-v1/wave11-geospatial/proposed-product/skills/terrain-watershed-analysis/SKILL.md:28`.
   - Reproduction: recovered `item_69` copied `product/*` and the four proposed skills into `C:/Users/Dom/AppData/Local/Temp/godskills-wave11-review-318a758b436e45219e2a60983b383e92`, normalized only the temporary maturity values, then ran the real `bin/godskills.mjs build`. It returned exit 1: `{"error":"Broken or nonlocal resource link: ecological-sampling-and-detection-uncertainty/SKILL.md -> ../diagnostic-statistical-model-inference/SKILL.md"}`. `validate` also returned exit 1 because no release was produced.
   - Cause: `product/lib/product.mjs:74-78` resolves Markdown links and requires `inside(dir,resolved)`, so sibling-skill links such as `../eternities-athena/SKILL.md` are nonlocal even when the target exists. The recovered link scan (`item_71`) found all six cross-skill targets outside the containing skill directory; the first five do not resolve in the standalone proposed tree, and the terrain link resolves only in the overlay but still violates containment.
   - Impact: this is a shipped-product integration defect, not a development-helper issue. A clean build cannot produce `catalog.json`, `INDEX.md`, or `release.json` from the proposed overlay.
   - Fix: represent relationships with `skill.json` `related` entries and plain skill IDs or code spans, not relative Markdown links across skill directories. If cross-skill links are desired, change the product link policy and verify it as a product contract first. Re-run a clean temp overlay build and validate after the text fix.

### Important

2. **The two wave helpers derive paths from `URL.pathname`, which is not portable.**
   - Files and lines: `artifacts/universal-product-v1/wave11-geospatial/build-source-integrity.mjs:6-7`; `artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs:4-5`.
   - Reproduction: `pathToFileURL('C:/dev/My Dir/w/script.mjs')` produced legacy `pathname.replace(/^\//,'')` value `C:/dev/My%20Dir/w/script.mjs`, while `fileURLToPath` produced `C:\dev\My Dir\w\script.mjs`. For `file:///home/My%20Dir/w/script.mjs`, the legacy transform produced relative `home/My%20Dir/w/script.mjs`; `fileURLToPath` correctly reported `File URL path must be absolute`.
   - Impact: development-helper failure on POSIX and on Windows paths containing escaped characters. It does not affect shipped Markdown skills, but it undermines portable reproduction of the review receipts.
   - Fix: use `fileURLToPath(import.meta.url)` and `dirname`/`resolve`, not `URL.pathname` stripping.

3. **Generated read-extent and integrity booleans are weaker than the validator reports.**
   - Files and lines: `artifacts/universal-product-v1/wave11-geospatial/build-source-integrity.mjs:79-87`, especially `:84`; `artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs:58-59`.
   - Evidence: `build-source-integrity.mjs:84` writes `reviewExtent: 'full-entrypoint-read'` unconditionally, and `validate-staged.mjs:58-59` accepts generated booleans and that label. Hashes, Git blobs, and packet joins establish exact bytes and identity, not human reading or comprehension.
   - Independent limit and result: a normalized bounded extractor over the author event log found successful, non-empty read commands for all 29 repository entrypoints (29 covered, 0 missing). R2 also completed full reads of the 11 retained source entrypoints. This supports the read claim, but the generated flag itself is not proof. Linked references were not read; license review is metadata-or-body-claim only.
   - Fix: store observed read evidence separately from byte-integrity fields, or stop asserting review extent in a generator and validator. Keep the source-read boundary in the report.

4. **`validate-staged.mjs` accepts escaping resources and product-relative links that the product builder rejects.**
   - Files and lines: `artifacts/universal-product-v1/wave11-geospatial/validate-staged.mjs:69-72`, `:86-96`.
   - Reproduction: recovered `item_61`/`item_72` showed the predicate `!isAbsolute(resource) && relative(base,target) !== ''` accepts `references/a.md`, `../other/a.md`, and `../../outside.md`. The staged validator's `fromProduct` fallback at `:94-95` also accepts sibling-skill Markdown links that `product.mjs:74-78` rejects.
   - Impact: development-helper false assurance. It allowed `validate-staged.mjs` to report 64 passing checks (`item_73`) before the real overlay build failed.
   - Fix: require the resolved target to remain under the skill directory for both resources and links, and make staged checks mirror the shipped product policy.

## Source and content assessment

- All 29 source bodies were independently joined in recovered `item_39`: 29 rows, `allJoined: true`, `matched: 29`, no issues. Each row matched the family plan source ID and body SHA-256, intake source ID/path/destination/Git blob, pinned `COMMIT:PATH` blob, warehouse HEAD commit, and packet fields. Input digests were `family-plan.jsonl` `4e68ad4b393440c5f602e6331ae9f824a9f17672d939a347fd00d3ef8d53c6a6`, `family-source-observations.json` `eba116ad00d4deee92fc64b540edcb3f3cb0633ddafc6ee76d6b10d242d7d60f`, `family-packet.json` `5f62f1f6656984efd54943e48496d355e5dfd71edd9a0b81cfac3b8501bd57b3`, `sources.jsonl` `85b09d2799e66ce5ad2f9abd1b1a78e903632d0c9c34ee0735d46e580c102536`, and `manifest.json` `8292cedbbbb31dca72acddd290394029db54df4e382bf29b155fea5ff020db44`.
- The 11 retained sources were read as full entrypoints in recovered commands and compared with the proposed mechanisms: coordinate/datum and surface comparability, point-cloud limitations, terrain conditioning and threshold sensitivity, occupancy/detection and repeated-visit uncertainty, camera-trap record provenance and near-duplicate handling, ecological design and pre-intervention assumptions, species-distribution calibration/extrapolation limits, and landscape connectivity scale/resolution/fragmentation distinctions. The proposed skills are independently written mechanism guides, not shallow source relabels.
- I found no additional shipped-content defect establishing authority escalation, provider/warehouse dependence, invented certainty, formula-driven over-prescription, or professional-outcome guarantees. The methods use checklists, sensitivity checks, and explicit limits. Classifications remain advisory; fixtures and temp-overlay checks are not runtime qualification.

## Checks and outcomes

| Check | Evidence | Outcome |
|---|---|---|
| 29-body identity and pin join | R2 `item_39` | 29/29 matched; no issues |
| Author-log entrypoint reads | continuation extractor over author `command_execution` outputs | 29 covered after separator normalization; 0 missing |
| Retained source reading | R2 `item_41`-`item_50`, `item_57`, `item_58` | 11 retained entrypoints read; linked references not read |
| Staged validator | R2 `item_73` | 64 passed, 0 failed, but checks are weaker than product policy |
| Temp overlay build/validate | R2 `item_69` at `C:/Users/Dom/AppData/Local/Temp/godskills-wave11-review-318a758b436e45219e2a60983b383e92` | build 1 and validate 1; cross-skill link defect above |
| Markdown link scan | R2 `item_71` | 10 links: 4 local/contained or overlay-resolving, 6 cross-skill and non-contained |
| Resource containment probes | R2 `item_61`, `item_72` | `../other/a.md` and `../../outside.md` incorrectly accepted |
| URL conversion cases | continuation `node:url` probe | legacy transform wrong for Windows spaces and POSIX absolute paths |

## Candidate SHA-256 map

These hashes were recomputed in the continuation and match the recovered R2 `item_15` map.

| File | SHA-256 |
|---|---|
| `author-report.md` | `3647096c25eea947820aea05940da185c644fc3649f41e09a50cbf43155cabc0` |
| `behavioral-review-cases.json` | `36a19704a19c6a1a666a77cabc0eadf76aba14736e2a6afa12f91b980ceb1847` |
| `build-source-integrity.mjs` | `e515de152b0a3f610384630e3324730af7a9f88854d69951c22cc1a5871850e1` |
| `source-dispositions.json` | `08efba1a7b19429f6895b0095165da62e70069fe921068ae3eca835933feb161` |
| `source-integrity.json` | `703119c06b5295b87a734ca46b5fcb38ccacaadd11606b2017621432f715efa3` |
| `validate-staged.mjs` | `ac59bca2b65b836cb4ec3af9f5054ae02bdbc805a0540d3dd87b780e3a77bb6f` |
| `proposed-product/skills/ecological-sampling-and-detection-uncertainty/skill.json` | `09b4a2920be0d1f3f71e884161023f19c857942945e76b07aa436ff55025813e` |
| `proposed-product/skills/ecological-sampling-and-detection-uncertainty/SKILL.md` | `a5c9f69d73279f534e242e50a792a7c890ba18c4c2e1e424bdb7bcd043fa84be` |
| `proposed-product/skills/ecological-sampling-and-detection-uncertainty/references/sampling-and-detection-records.md` | `5726960dd5072aa93919e1a600898bec7b16b06b3fb38cd89fd6fb0d8cddca5f` |
| `proposed-product/skills/geospatial-coordinate-integrity/skill.json` | `01826ca63121e75a698b77644cd039a71b113942fde955c933ccef643770cb64` |
| `proposed-product/skills/geospatial-coordinate-integrity/SKILL.md` | `ef14fd4bc877408a1acb6c24efb09557a4a02d65a6688fd22e3dfe893ce65ce0` |
| `proposed-product/skills/geospatial-coordinate-integrity/references/vertical-and-surface-comparability.md` | `31b73d5ff157bd1d32a729d442ad0d6d6400cb5d4c0d6c5736c4e2cde8961d62` |
| `proposed-product/skills/landscape-connectivity-analysis/skill.json` | `420e6c9d1e4336695ed36d0b90523f5cac8ef82c2cc269cb6591b167c8c0e4d6` |
| `proposed-product/skills/landscape-connectivity-analysis/SKILL.md` | `5f55e05b3e7aa7b58f92dffee30e4f0a48794fe1de3754800627bb2f8f1a417e` |
| `proposed-product/skills/landscape-connectivity-analysis/references/connectivity-operations.md` | `dcf15931b1588968bcd707b278124815acd30ef4b2c5be3785ea07137b568425` |
| `proposed-product/skills/terrain-watershed-analysis/skill.json` | `5f06794d5106433615081f351974fd3fdf07deecb6cc2974da8e93725e492020` |
| `proposed-product/skills/terrain-watershed-analysis/SKILL.md` | `adbc77c56f09ed67479d0d0fa7262873c256468ed1ccd56978bbf7fe2e6f2cdf` |
| `proposed-product/skills/terrain-watershed-analysis/references/terrain-operations.md` | `e1d10f927d52154bdbf0963e479bb567856aeffabb3817df8a9689c481e10704` |

## Limits and next action

No upstream code was executed, no network/API calls were made, no linked source references were read, and no claim is made about universal quality or agent-performance qualification. Corpus-disposition work was excluded. The concrete next action is to replace the six cross-skill Markdown links with portable relation references, tighten the two helper path/containment checks, and rerun the real temp-overlay `build`, `validate`, and positive/negative discovery cases. Re-review only those changed files and the overlay result.
