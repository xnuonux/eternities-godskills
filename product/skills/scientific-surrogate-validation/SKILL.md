---
name: scientific-surrogate-validation
description: Validate a scientific predictor for a declared decision using available-at-decision features, leakage-resistant splits, matched baselines, separately fitted uncertainty calibration, and honest adaptive-pool accounting.
---

# Scientific surrogate validation

Use this method when a learned or statistical surrogate will guide scientific screening, optimization, data acquisition, or a claim about predictions beyond its training examples. Produce a validation design and an evidence-bounded result. This method does not train a model, create reference measurements, recommend deployment, or establish scientific or professional certification.

## Declare the claim and data lineage

Record the target, units and label provenance; intended decision and its timing; population to which the result should apply; fidelity level; relevant error and failure costs; and whether the claim concerns interpolation, transfer to a new group, or extrapolation. If the intended domain or decision time is unclear, return a design gap rather than choosing a convenient split after seeing scores.

Keep a row-level identity for included, excluded, failed and unlabeled cases. Record duplicate or near-duplicate groups and the basis for grouping (for example source, time, family, structure or campaign). State how missingness and failed calculations enter the claim. A checksum establishes byte identity only; it does not validate labels or show that data represent the intended population.

Before any split or score, audit **feature origin and availability time** for the declared decision. For each predictor input, record how it was obtained and whether it existed when the model would have been asked to predict. Reject target-derived, post-outcome, future-only or proxy-for-label features, even if they are present in every row and remain within a grouped holdout. If any were used, remove them, rebuild affected features and repeat the validation; do not reuse the contaminated estimate. Uncertain feature timing is an unresolved prerequisite, not evidence of generalization.

## Build an uncontaminated comparison

1. Freeze the dataset version, target definition, admissible feature recipe, group assignment, split plan, metric set and decision rule before model selection. Fit imputation, scaling, feature selection and other learned transformations inside training folds only. A feature recipe being frozen does not excuse decision-time unavailability.
2. Match the split to the intended use. Keep correlated or duplicate cases in one group. Use an outer held-out group or untouched test set for the final estimate; place descriptor, model and hyperparameter choices inside training folds. If the number or diversity of groups cannot support the planned split, report that limitation.
3. Compare the candidate with relevant simple baselines on the same cases and splits. Report case counts, per-group results, error distributions and task-relevant metrics. Preserve failed fits, missing predictions and adverse cases in the denominator, or predeclare and justify exclusions before seeing their outcomes.
4. Check residuals by group and by distance or another declared measure of training-domain coverage. Derive coverage descriptors and thresholds without looking at the final scoring set. They do not create a universal boundary between safe interpolation and unsafe extrapolation. Check physical or unit constraints only when defined for the target.
5. If uncertainty informs the decision, fit any calibration method, interval width or threshold, and choose coverage levels inside training or dedicated calibration folds. Freeze the interval policy before final scoring on the untouched outer holdout. Report interval coverage and width at the declared levels, counts and assumptions; evaluate on cases not used to fit or select calibration. If the outer holdout influenced calibration or its selection, withhold the final uncertainty claim until a genuinely untouched estimate is available. Exchangeability-based calibration does not automatically transfer to shifted or adaptively selected populations.
6. For active-learning or optimization campaigns, retain the full candidate pool at each iteration, acquisition scores, selection decisions, observed labels, failed evaluations, negative results and stopping events. Report labeled and unlabeled counts by pool stratum and record the observation and selection mechanism for labels. A convenient, retrospectively measured portion of unselected candidates is not a representative control. To claim full-pool performance, use a representative audit sample, defensible weighting or selection analysis with stated assumptions, or a design that otherwise identifies the missing outcomes; if none is available, restrict the conclusion to the observed subset. Unlabeled outcomes remain unknown, not successful or negative cases by default.

## Return a bounded result

Deliver the frozen protocol, feature-origin and decision-time audit, data and split identities, matched baseline and candidate results, group and coverage breakdowns, separately fitted uncertainty checks when applicable, pool-observation accounting, excluded and failed cases, and unresolved assumptions. Separate observed results from estimates and planned checks. A good aggregate score cannot erase a failed group, invalid holdout, selection-biased candidate pool, uncalibrated interval, or target-definition mismatch.

Stop without a generalization claim when a forbidden feature was used, the final holdout influenced choices, correlated cases cross a split, target or units conflict, post-outcome exclusions changed the denominator, unlabeled pool outcomes are treated as known, or the result lacks evidence required by its intended use. State the smallest missing evidence that could resolve the gap. Do not recommend acquisition, deployment or automated decisions from validation alone.

## Route boundaries

Use experiment-artifact-lineage to decide whether a cache, checkpoint or previous run can be reused. Use counterbalanced-agent-evaluation for agents, prompts and evaluation harnesses. Use a compute-selection method for inference hardware and runtime qualification. This method concerns the validity and limits of scientific prediction evidence.
