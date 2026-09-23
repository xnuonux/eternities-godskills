# Independent wave12 ML/audio source and product review

Date: 2026-09-23. Checkout HEAD: `7438872d9ac89762608f4b05ef213298eb4b1a50`. Scope: the fixed 14 ML and 7 audio IDs in `data/universal-product-v1/family-plan.jsonl`, the wave12 author sidecar, the six named adjacent product owners, and the general `eternities-athena` route. This review added no product, ledger, activation, warehouse, or prior-author file.

## Verdict

**Not ready for product integration. Worth a focused revision.** The proposed `scientific-surrogate-validation` is a distinct, portable scientific-prediction method: it covers use-domain claims, grouped splits, within-fold preprocessing, untouched outer evaluation, matched baselines, uncertainty, and adaptive-campaign accounting. It is more specific than Athena's general evidence appraisal and does not duplicate artifact reuse, agent comparison, compute selection, DSP, media, or speech-chunk ownership. Its prose is fresh and contains no package, provider, machine path, or copied source recipe. The candidate remains a 4,664-byte, 647-word draft; no model, scientific dataset, audio output, or agent routing was exercised.

One omitted validity check can let a fully separated holdout still report spurious performance: the method does not require every predictor feature to have been available at the time the claimed decision would be made. Two other guardrails need sharper language before integration: calibration must not be fitted or selected on the final scoring set, and a partially observed unselected pool is not automatically representative. These are contract gaps, not observed model failures.

## Source integrity and provenance

The independent read-only `probe.mjs` checked the plan's raw SHA-256, all 21 plan/intake/source/disposition identities and body hashes, current byte lengths, acquisition paths, warehouse HEADs, current Git blobs, pinned-tree blobs, both candidate digests, and the five owner-entrypoint digests in the author receipt. All matched. For the 18 `recovered-complete-capture` rows it also verified the hash-bound failed-worker event log, successful completed item outputs, exact captured text against current UTF-8 body slices, and gap-free full-body range unions. This includes split reads for `r0146` and `r0164`. For `r0100`, `r0306`, and `r0319`, the current bodies and hashes match the prior wave5 audio-review rows; I also inspected those three bodies directly. **No source in the fixed 21 is currently body-mismatched or lacks one of these two documented read-evidence routes.**

The routes have different epistemic strength. The 18 log entries establish captured full text in completed tool output, not that the failed worker consumed or judged it. The wave5 report attests its three historical full reads, but this probe did not locate an independent raw wave5 read log. The author explicitly reused these records; this review does not reassign the earlier reads to the author. Hashes prove identity, not truth, safety, provenance of upstream prose, or licensing. In particular, the two `kjuhwa/skills-hub` audio files identify VoxCPM in their frontmatter; that upstream attribution was not independently verified. Intake license labels for the substantive scientific sources are MIT metadata, the two audio files carry MIT metadata, `r0319` carries ISC metadata, and other entries include absent or different labels. None is legal clearance.

The per-source disposition is credible at this bounded level:

| IDs | Review disposition | Basis |
| --- | --- | --- |
| `r0146`, `r0164` | Pattern references for the new method | Bodies contain grouped validation, domain shift, baseline, uncertainty, and adaptive-pool mechanisms. Framework code, materials recipes, numeric cutoffs, and performance claims were excluded. |
| `r0000`, `r0237`, `r0368` | Covered by adjacent owners | Explainability/training details, judge-loop feedback, and tracker integration do not warrant another method here. |
| `r0100`, `r0306`, `r0319` | Reuse exact wave5 audio dispositions | Current hashes match the prior read rows. Text-to-audio lineage and pronunciation uncertainty are already covered by the current `portable-speech-chunk-alignment` product entrypoint. No rendered audio was tested. |
| `r0220` | Defer middleware-specific review | Its Wwise/FMOD/Unreal checklist contains host-specific claims. `audio-dsp-integrity-review` covers the generic deadline/numeric/graph lanes; no middleware code was supplied or verified. |
| `r0154`, `r0258`, `r0260`, `r0307` | Reject platform training adapters | Named models, code paths, token layouts, and resource assumptions were not executed or qualified. The `r0307` packer code merits separate code-level validation if ever used. |
| `r0014`, `r0034`, `r0090`, `r0097`, `r0197`, `r0212`, `r0216`, `r0246` | Reject or defer thin capability summaries | These bodies advertise a feature or launcher with little transferable operational/evaluation method. |

## Product routing and independent adversarial cases

I read the complete draft and the complete current product entrypoints for `experiment-artifact-lineage`, `counterbalanced-agent-evaluation`, `eternities-hephaestus`, `audio-dsp-integrity-review`, `eternities-orpheus`, and `portable-speech-chunk-alignment`; I also checked `eternities-athena` because the draft declares it as its parent. The static results below are my interpretation of the written contract, not a live agent or scientific benchmark. They are independent of `check-cases.json`.

| Adversarial request or evidence | Expected route or behavior | Static result |
| --- | --- | --- |
| Rank a new catalyst family using a high random-split score | Scientific validation; family-aware holdout before transfer claim | Covered by declared domain and grouping rules. |
| “Can we trust the simulator choosing our next experiment?” | Scientific validation with full-pool and failure accounting | Covered by positive trigger and campaign step. |
| Reuse a checkpoint and feature cache with changed training membership | Artifact-lineage decision | Correct exclusion; a combined reuse-and-validation task needs both owners. |
| Compare two judge agents, or choose an inference GPU | Agent evaluation or Hephaestus | Correct exclusions. |
| Prove an audio callback is glitch free, or repair TTS chunk seams | DSP review or speech-chunk/media route | No reason to invoke the scientific draft. |
| Same molecular family or duplicate structures on both sides of a nominal split | Refuse independent generalization claim | Explicit stop. |
| Fit a scaler or select descriptors using all rows before the split | Refit within training folds; invalidate the reported estimate | Explicit within-fold and outer-holdout rules. |
| Compare a baseline only on successful rows while the candidate failed on harder rows | Same cases and explicit failure denominator | Mostly covered; post-outcome exclusions still require a firmer predeclared rule. |
| Report excellent test accuracy using an assay-derived descriptor unavailable before screening | Reject the validation regardless of split | **Gap F1:** feature recipe is frozen, but feature availability and target-derived leakage are not checked. |
| Choose interval width on the final holdout, then report that same set's 90% coverage | Require separate calibration and final assessment | **Gap F2:** the outer-holdout rule is general; calibration fitting/threshold selection is not named. |
| Measure a convenient 10% of rejected candidates, then claim full-pool accuracy | Restrict claim to observed sampling frame unless unbiased labels or a justified selection model exist | **Gap F3:** “where labels exist” and the “only selected” stop leave partial selection bias underspecified. |
| Training-domain calibration is good, but the next campaign is shifted | Do not transfer uncertainty guarantee | Covered: exchangeability/shift warning and domain coverage limits. |
| Labels have inconsistent units or targets; aggregate score remains strong | Stop the scientific claim | Explicit stop; label provenance and fidelity are recorded. |
| Ask for certified clinical or scientific safety from this validation packet | Refuse certification and automated-decision authority | Explicit boundary. |

## Findings and required changes

**F1 — Critical: decision-time feature leakage is not blocked.** The draft freezes a feature recipe and fits learned transforms within folds (`SKILL.md:18-19`), but a feature can be calculated from the target, a later assay, or a future simulation and still obey both rules. The pinned `r0146` body explicitly flags target-derived descriptors and tracing features to information available at prediction time (`molecular-property-gnn/SKILL.md:602`). Require a per-feature origin and availability-time audit for the declared decision; reject target-derived, post-outcome, or future-only inputs and repeat the validation after removing them. This is a prerequisite for the draft's leakage-resistant claim.

**F2 — Important: calibration can contaminate the final score.** The uncertainty step (`SKILL.md:22`) says to evaluate held-out or out-of-fold predictions, and the earlier step protects descriptor/model/hyperparameter choice. It does not explicitly place interval fitting, calibration method selection, coverage-level choice, and coverage-threshold selection inside training/calibration folds. A user can fit an interval to the final holdout and report its coverage on that same set. State the calibration/evaluation partitions and freeze the interval policy before final scoring; if the outer holdout influenced it, obtain an untouched estimate or withhold the claim.

**F3 — Important: partial unselected labels can still bias a full-pool claim.** The campaign step (`SKILL.md:23`) properly retains selected, unselected, failed, and negative records and blocks a claim when *only* selected/successful cases were measured. It allows comparison “where labels exist” without requiring how unselected labels were obtained. A convenient or retrospectively chosen sample of rejected candidates can flatter the model. Record labeled/unlabeled counts by pool stratum and the observation/selection mechanism; require a representative audit sample, defensible weighting/selection analysis, or restrict the conclusion to the observed subset. Unlabeled outcomes remain unknown.

**F4 — Minor: the author validator's PASS is narrower than its wording.** `validate-wave12.mjs:31-34` compares source hashes and Git-match flags stored in the author's JSON; it does not read current bodies or Git. `:49-50` checks that authored cases have nonempty text, not their expected behavior. The script passes and honestly prints its runtime limit, but “source bindings” should be interpreted as internal consistency only. The independent probe supplies current-byte, Git, and captured-text checks. No runtime skill-routing conclusion follows from either script.

The draft's matching baseline, grouped holdout, domain-shift, units/label, false-generalization, and scientific-authority limits otherwise read well. Keep `r0146`/`r0164` as pattern references with source/license uncertainty. A revised draft should add F1–F3 and independent adversarial cases before parent considers integration. Any superiority, scientific-performance, or audible-quality claim would require a separate authorized exercise; none was run here.

## Executed checks and proof boundary

- `node artifacts/universal-product-v1/wave12-ml-audio/validate-wave12.mjs` — exit 0; `PASS: 21 exact plan leads, source bindings, draft portability, and five static contract cases.` It also printed the structural/author-case limit.
- `node artifacts/universal-product-v1/wave12-ml-audio/independent-review-sol6/probe.mjs` — exit 0; `passed: true`, 21 plan sources, 18 exact complete recovered captures, three exact wave5 rows, and zero integrity errors. The command prints the full per-ID digest and read-evidence result for reproduction.

No training, paid call, network call, source script, audio render, deployment, installation, or agent-performance comparison was made. This is an independent source-and-instruction review, not certification of scientific performance or the full corpus.
