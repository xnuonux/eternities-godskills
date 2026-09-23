# Wave12 scientific surrogate draft: focused repair r1

Status: repaired draft, awaiting independent focused rereview. No product,
installation, ledger, source disposition, or original author artifact changed.

The independent Sol review at
`../independent-review-sol6/review.md` (SHA-256
`0a6c32281718630d1c8e917608aced90713ac066fbc23ab5d836534aec5c8ac7`)
found one critical and two important omissions in the original 4,664-byte
scientific-surrogate-validation draft (SHA-256
`c1651ef52894e250c69d5035fc08100cf5b202bee1b7a8631522093490d79420`).
Its separate 21-source provenance probe passed, so this repair changes only the
candidate instructions and static cases, not source identities or dispositions.

- F1: added a pre-split, per-feature origin and decision-time availability
  audit. Target-derived, post-outcome, future-only or label-proxy inputs force
  removal and repeat validation, even under a nominally clean grouped holdout.
- F2: placed uncertainty-calibration fitting, interval/threshold selection and
  coverage-level choice inside training or dedicated calibration folds. The
  interval policy is frozen before final scoring; holdout-influenced calibration
  withholds the final uncertainty claim.
- F3: records labeled and unlabeled counts by pool stratum and the mechanism by
  which outcomes were observed. A convenient partial rejected-candidate sample
  cannot support a full-pool claim without a representative audit or defensible
  selection analysis; otherwise conclusions remain on the observed subset.

Three new author-written adversarial cases target the exact failure shapes.
`node --test tests/wave12-scientific-repair.test.mjs` was red before the new
draft existed (four ENOENT failures) and green after it was written (four pass,
zero fail). These are structural contract checks, not a live agent or scientific
benchmark. The original author's validator concerns the original draft and is
not reused as proof of this revision. A separate reviewer must inspect the
revised complete wording and challenge F1-F3 before parent integration.

New draft SHA-256:
`bb13e6221b81e3dd20d182014314bbf5021940e80c5793ad5492f85bf0e62642`.
New metadata SHA-256:
`faf38d8035da0abaf2287c50f69e6a60e21d2419e62132975e4ce604d0ba9073`.
New case file SHA-256:
`e5a96b16a57350a23355be7cf70b8e0ff13eda1ceff2189c0e2c58c09e509e49`.

No model, dataset, candidate pool, uncertainty estimate, training job, audio
render, or end-to-end agent run was performed. The source/license uncertainty
in the original author and independent reports remains unchanged. The draft
remains a proposed method, not a validated scientific result or a full-corpus
completion claim.
