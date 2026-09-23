# Universal core release: geospatial and ecological methods

This is an intermediate product release, not completion of the acquired corpus.
The portable pack contains **66 instruction-reviewed methods in 21 primary
domains**, up from 63. It remains usable by any agent through Markdown, with
optional offline discovery and a backed-up installer.

## Delivered delta

- `terrain-watershed-analysis`: DEM preparation, terrain derivatives, drainage
  assumptions, catchment delineation and sensitivity checks.
- `landscape-connectivity-analysis`: ecological resistance surfaces, corridor
  models and checks against confusing modelled connectivity with observed use.
- `ecological-sampling-and-detection-uncertainty`: sampling effort, repeat visits,
  imperfect detection and limits on species-absence claims.
- `geospatial-coordinate-integrity`: an existing method extended with vertical
  reference and surface-comparability checks.

The original authored instructions and references were independently reviewed;
the repaired candidate received a separate focused review accepting integration.
See the immutable [focused review](../artifacts/universal-product-v1/wave11-geospatial/focused-rereview-r1.md)
and [integration receipt](../artifacts/universal-product-v1/wave11-geospatial/integration-receipt-r1.json).
Parent verification reproduced all 12 reviewed product-file bindings. Only the
four metadata maturity fields differ from their reviewed drafts, as documented.

## Release identity and verification

- Baseline main: `fa1617889bcf50741b157c34d582011427495ccd`, reconciled with origin.
- Reviewed candidate: `5a40580eaf6a2a00bb1e64d5f78e48cd1cd2d9808153d73ea801626effd201ac`.
- Final pack: `f19243979f1fe5324bf7b16621cf6a8f3ed57916e3fa4544262c0b99e1a195b7`.
  The final identity differs only because the corpus-scope document now describes
  this release and explicitly retains the unfinished-refinement boundary.
- Full working-tree suite: 1,125 tests; 1,123 passed, zero failed, two skipped.
  This tree includes the separate, unshipped corpus-accounting repair tests.
- Skips: one symbolic-link creation case unavailable on this Windows account,
  and the conditional different-volume installation case. These are not passes.
- Clean-copy operation, discovery, exact manifests, installer/rollback and
  preservation of unrelated skills are covered by the package tests.
- The three frozen activation files and historical evidence were unchanged.

The development-only accounting repair is deliberately excluded from this
release. It has 42 passing focused tests and corrected reproductions of the last
review's defects, but has not received a new independent review. Historical
whole-corpus ledgers remain preserved, not retroactively certified.

## Boundaries

The 29-entrypoint source packet preserves distinctions between byte identity,
observed read commands, declared dispositions and authored-method review. It does
not establish model comprehension, linked-reference review, licence clearance,
field accuracy or universal skill superiority. No GIS engine, ecological field
experiment or matched agent-performance comparison was performed for this wave.
No paid provider calls were made during final inline verification.

The finite source-refinement backlog, including the interrupted ML/audio slice,
is still open. The installed skill count is not a completion percentage for it.
