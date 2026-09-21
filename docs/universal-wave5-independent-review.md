# Wave 5 independent read-only review

Date: 2026-09-21  
Workspace: `C:\dev\eternities-godskills\.worktrees\universal-product-v1`  
Base/current `HEAD`: `6edda5c524428ed8dbfc97ad2770f5e0e4d01e6b`

## Disposition

**Ready to merge: yes for this bounded instruction-reviewed release.** Finding
counts: **0 critical, 0 important, 1 minor**. The minor finding is in
development-only source-observation tooling, does not affect the current wave5
rows, and **does not block this release**. Parent should fix it before relying on
the helper as a general source-identity receipt.

## M1 — hash-only source binding in observation helper (minor, non-blocking)

Exact evidence: `scripts/inspect-family-source-bodies.mjs:16` builds
`sourceByHash` keyed only by `bodySha256`; `:19` selects the first matching
record and ignores the plan item’s `sourceId`. The current intake has 54 duplicate
body hashes, so a future plan naming another same-byte source can receive the
wrong path, repository identity, or license hint depending on source-record
order. Separately, `:33` still assigns `status: "bytes-verified"` when
`commitMatches` is false, and `:39` counts that status as verified.

Reproduction/impact boundary already checked: the current 410-row plan has zero
plan/source-ID mismatches, zero commit mismatches, and all seven wave5 rows match
their exact intake source IDs, hashes, bytes, and commits. The fix is to resolve
by exact `sourceId` and require both body-hash and pinned-commit agreement for a
verified status. This is a real helper defect, but it is not a current wave5
product or provenance failure.

## Verified release evidence

- `node product/bin/godskills.mjs validate` passed: release
  `ec7598344b33ad65fa7aceb51e878ef055f2d10abede51d9244cbf9fff952398`, 62 skills.
- Requested focused tests passed **31/31**:
  `tests/family-source-observations.test.mjs`,
  `tests/universal-wave5-discovery.test.mjs`,
  `tests/universal-discovery-cases.test.mjs`.
- Seven raw source hashes matched intake: `r0031`, `r0071`, `r0100`, `r0113`,
  `r0306`, `r0319`, `r0389`; actual bytes and repository `HEAD`s also matched.
  Intake locators are `data/quarry-intake-2026-09-21-exa/sources.jsonl:118,125,1933,2281,2429,2538-2539`.
- Molecular final wording correctly handles observable-specific periodic
  representations, diffusion continuity, fitting, correlated uncertainty, and
  reactive/bias/nonequilibrium boundaries
  (`product/skills/molecular-observable-integrity/SKILL.md:16-34`).
- Audio final wording preserves source/render lineage, Unicode-safe boundaries,
  renderer-budget uncertainty, context versus emitted audio, cancellation, and
  the no-audio-quality-claim boundary
  (`product/skills/portable-speech-chunk-alignment/SKILL.md:10-36`).
- Education’s saved exercise is honestly recorded as 10 pass, 1 fail, 1 partial;
  the final reference was clarified afterward and not reexercised
  (`artifacts/universal-product-v1/wave5/education-exercise/result.json:9-35`,
  `artifacts/universal-product-v1/wave5/education-review.md:51-55`). This is a
  limitation, not an all-pass claim or a release-blocking product defect.
- Product metadata preserves owner relations and bundled reference integrity;
  provenance records distinguish pattern reference, license hint, and legal
  clearance (`product/catalog.json:1284-1297,1688-1698,1818-1828`; the three
  reviewed `skill.json` files). No product file contains a Dom/local absolute
  path or provider dependency; source-report warehouse paths are evidence
  locators outside the product manifest.
- The six protected paths compare byte-identically to
  `f3966698d791c4c3082570c07660ce1a64e239a4`; no protected-path diff was found.

## Boundaries

No subagent, external provider, simulation, TTS render/listening check, classroom
outcome measurement, or full repository suite was run. The source observation
artifact is deterministic byte/commit evidence with `modelBodyReview: false`;
the education exercise has no baseline and does not establish incremental gain.
Nothing here claims universal quality, domain expertise, audio quality, simulation
validity, classroom effectiveness, corpus completion, or superiority.

## Parent disposition after review

M1 reproduced in a temporary Git repository: the original helper accepted a
missing source identity and a changed pinned commit, and selected the wrong
same-byte alias. The helper now resolves exact source ID plus body hash, refuses
ambiguous records, and leaves commit mismatches unresolved. Expanded regression
checks failed before the fix and pass afterward. Replaying all410 current sources
with the corrected helper reproduced the existing observation artifact exactly.
No shipped product byte changed. This fix was parent-verified, not a second
independent-review pass.
