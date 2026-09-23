# Universal core release: scientific validation methods

This is a verified **68-method intermediate release**, not completion of the
acquired-source corpus. It adds `scientific-surrogate-validation` and its
`interatomic-model-validation` specialist to the prior 66-method portable
pack. Both are instruction-reviewed evidence methods; no model was trained,
simulation run, scientific performance qualified, or deployment authorized.

The farm-water, mapped-soil, and seasonal-estimate extension was source-reviewed
but is **not installed**. Repeated independent routing reviews found both civic
water-treatment false positives and farm-report false negatives. The exact
revised reference was preserved outside the product at
`artifacts/universal-product-v1/wave13-farm/reviewed-reference-on-hold.md`;
`docs/wave13-farm-routing-hold.md` records the decision and return gate. The
baseline agricultural skill, bundled search code, and product README were not
changed. A [separate independent package review](../artifacts/universal-product-v1/wave13-split-product-review-luna6/review.md)
accepted this split and the 68-method manifest.

## Verified release

- Main and `origin/main`: `6a548d9ffe9e3acdad5ffb9e98c4be22e0ba7b4a`.
- Release ID: `29b0c04e8a32bff16fd7d10d22b8748b8f6f53acf3f3470724c5d0203ef19218`;
  `product/release.json` SHA-256:
  `e07a65f4b8ef5c81fa899739f7b99b35b78e347251afaff1d1b8e4b36fbd8cf0`.
- The independent split-product review receipt SHA-256 is
  `5f6b2a7ddb55bd193d9f77a640884ac4ab4afc3f5daaa02da56595b6ffbacd6d`.
- Full development-tree test suite: 1,162 passed, zero failed, two skipped.
  Fresh main suite after fast-forward: 1,090 passed, zero failed, two skipped.
  The latter excludes unshipped experimental ledger tests. The conditional
  different-volume install case and a Windows link-creation case remain skips,
  not passes.
- Product validation returned `verified-content` for the exact release ID;
  clean-copy CLI, manifest, guarded installer, rollback, and discovery checks
  passed. The three protected activation files retained their certified hashes.

## Local installation and rollback

The guarded installer upgraded this host from the verified 66-method release
`f19243979f1fe5324bf7b16621cf6a8f3ed57916e3fa4544262c0b99e1a195b7`
to the 68-method release. Post-install checks matched all 169 managed skill
files against the manifest and validated the complete installed runtime. All
56 unrelated skill files matched the pre-install snapshot; the target held 221
files before and 225 after. The backup contains all 66 former skill directories
and a previous runtime that independently validates as the original release.

The backup label is `wave13-20260923-core68`. The installation receipt SHA-256
is `387161af12922cf5321f58293dd6ec36f31eea962f468d8d8d2a8984a12d09a3`;
the pre-install unrelated-file snapshot SHA-256 is
`f47ce9b728b315d0155d522c740d5524ba4fa8234964febf6eab5197bab60559`.
The receipt is retained locally for guarded rollback. Installed offline search
ranked the baseline agricultural trial method and both new scientific methods
first for their three bounded smoke queries, with `authority: none` and
`activation: none`. Native skill discovery in an already-open agent task may be
cached; disk installation alone does not prove a live task refreshed its list.

The independently reviewed local r8 corpus ledger accounts for 579 terminal
source/body pairs, but 48,816 row layers and 49,848 identity obligations remain
outstanding. It is a development accounting snapshot, not this product release
or a whole-corpus completion certificate. Additional source batches and the
held farm routing design remain open work.
