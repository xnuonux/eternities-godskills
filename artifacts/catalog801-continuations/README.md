# Searchable continuation overlay

Current continuation update: [batch B](../catalog801-continuation-20260922-b/RESULTS.md) adds eight bound receipts (seven successful, one unavailable). The live combined queue is 130 provisional, 61 abstained, 24 unavailable, one unknown, one excluded and 8,624 not dispatched; `--summary` reports these values after verification. The original integration record below describes the earlier eight-receipt snapshot, not current totals.

The normal `scripts/query-catalog-skill-intake.mjs` command now reads the explicitly enumerated, byte-bound receipt set in `manifest.json` alongside the original frozen catalog801 intake. No copy of the full queue is stored, no directory-wide receipt discovery occurs, and no provider call is made. The effective queue exists in memory only.

The eight additional provider-bound receipts contain 56 successful metadata judgments (39 provisional domains and 17 abstentions) plus eight unavailable inputs from the rejected probability distribution. They affect 67 distinct bodies because some selected metadata inputs represent multiple bodies. The local pacing refusal is explicitly excluded: it lacks an inner provider request binding and is not a classification result. It remains preserved in the original artifact directory.

The resulting 8,841-body queue has 93 provisional domains, 39 abstentions, one explicit unknown, 16 unavailable bodies, one excluded metadata input/body, and 8,691 bodies not dispatched. These counts do not describe reviewed source quality or installed skills. All query results remain untrusted source metadata with `activation: none` and `authority: none`.

## Verification contract

The loader checks the intake manifest and frozen classification summary against the overlay, verifies the needed input/source/group and original queue bytes, reconstructs the exact request plan, normalizes original receipts, and proves they still reproduce the frozen queue. Only then does it normalize the explicitly enumerated continuation receipts and build the combined view. Duplicate request IDs across either set, foreign requests, altered receipt bytes, missing inner bindings, and non-regular or escaping evidence paths are rejected rather than silently omitted.

The manifest is a repository-maintained evidence index, not a signature or protection against an adversary who can rewrite the whole repository. The implementation assumes a stable local checkout during reads; it is not an OS sandbox against concurrent hostile filesystem races. Precomputed `validated-labels.json` files are not trusted as input.

Example: `node scripts/query-catalog-skill-intake.mjs --query devtools-vue --domain engineering` now returns the saved Vue classification; the original query did not. Ordinary unfiltered search still exposes pending sources, while domain filtering requires a qualified provisional label (or an explicit unknown-domain query).

To add a later continuation, preserve its raw receipts separately, review a new explicit manifest revision with exact byte hashes, and rerun the focused checks. Never overwrite original queue/summary evidence or redispatch old paid requests to make indexing easier.

## This development batch

Parent observed the live query regression fail before implementation. Integrity fixture tests were written before the new loader; their initial positive cases failed because that module was absent, so those initial negatives were not treated as demonstrated corruption checks. After implementation, rejection assertions require actual assertion failures rather than arbitrary module-loading errors. All 31 focused checks then passed, including live query behavior, frozen-input reproduction, duplicate requests in different files and in the original receipt set, and a real Windows junction rejection.

Initial parent full suite: 1,039 tests, 1,037 passed, zero failed, two existing conditional skips. After the independent review corrections, all 35 focused checks passed and the full suite reported 1,043 tests, 1,041 passed, zero failed, two conditional skips (file-symlink creation and cross-volume destination fixture). The original intake/continuation artifacts, portable product, and three protected activation paths remain unchanged. No installed-skill update is needed for this research-query-only change.

The first MiMo implementation attempt was stopped after about 13 minutes with no edits; the parent implemented the small change directly. No uncertain job was duplicated. A separate MiMo review and the parent corrections are recorded in [review-disposition.md](review-disposition.md). No Jev API, key, model route, shared budget, or pacing policy was changed.
