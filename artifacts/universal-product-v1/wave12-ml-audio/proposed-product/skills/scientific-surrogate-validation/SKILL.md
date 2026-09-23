---
name: scientific-surrogate-validation
description: Validate a scientific prediction model against a declared use domain, leakage-resistant holdouts, matched baselines, coverage and uncertainty evidence, and the complete record of adaptive candidate selection.
---

# Scientific surrogate validation

Use this method when a learned or statistical surrogate will guide scientific screening, optimization, data acquisition, or a claim about predictions beyond the training examples. It produces a validation design and an evidence-bounded result. It does not train a model, create reference measurements, or establish scientific or professional certification.

## Set the claim before scoring

Record the target, units and label provenance; intended decision; population to which the result should apply; fidelity level; permitted error and failure costs; and whether the claim is interpolation, transfer to a new group, or extrapolation. If the intended domain is unclear, return a design gap instead of choosing a convenient split after seeing scores.

Keep a row-level identity for every included, excluded, failed, and unlabeled case. Record duplicate or near-duplicate groups and the basis for grouping (for example, source, time, family, structure, or campaign). State how missingness and failed calculations enter the claim. A checksum establishes byte identity only; it does not validate labels or prove the data are representative.

## Build an uncontaminated comparison

1. Freeze the dataset version, target definition, feature recipe, group assignment, split plan, metric set, and decision rule before model selection. Fit imputers, scaling, feature selection, and other learned transformations inside each training fold.
2. Match the split to the intended use. Keep correlated or duplicate cases in one group. Use an outer held-out group or untouched test set for the final estimate; place descriptor, model, and hyperparameter choices inside training folds. If the number or diversity of groups cannot support the planned split, report that limitation.
3. Compare the candidate with relevant simple baselines on the same rows and splits. Report sample counts, per-group results, error distributions, and task-relevant metrics. Preserve failed fits, missing predictions, and adverse cases in the denominator or explain their exclusion before interpreting results.
4. Check residuals by group and by distance or another declared measure of training-domain coverage. Label coverage thresholds as descriptive choices fitted on training data; they do not create a universal boundary between safe interpolation and unsafe extrapolation. Report physical or unit constraints only when they are defined for this target.
5. When uncertainty informs decisions, evaluate it on held-out or out-of-fold predictions. Report interval coverage and width at declared levels, sample counts, and the assumptions behind calibration. Exchangeability-based calibration does not automatically transfer to a shifted or adaptively selected population.
6. For active-learning or optimization campaigns, retain the full candidate pool at each iteration, acquisition scores, selection decisions, observed labels, failed evaluations, and stopping events. Compare outcomes across selected and unselected cases where labels exist. If only selected or successful cases were measured, state that selection bias prevents a full-pool validation claim.

## Return a bounded result

Deliver the frozen protocol, data and split identities, baseline and candidate results, group and coverage breakdowns, uncertainty checks when applicable, excluded or failed cases, and unresolved assumptions. Separate observed results from estimates and planned checks. A good aggregate score cannot erase a failed group, an invalid holdout, an uncalibrated uncertainty signal, or a target-definition mismatch.

Stop without a generalization claim when the final holdout influenced choices, correlated cases cross the split, the target or units are inconsistent, negative outcomes were silently dropped, or the result lacks the evidence required by its intended use. State the smallest missing evidence that could resolve the gap. Do not recommend acquisition, deployment, or automated decisions from validation alone.

## Route boundaries

Use experiment-artifact-lineage for whether a cache, checkpoint, or prior run can be reused or resumed. Use counterbalanced-agent-evaluation for comparisons of agents, prompts, or evaluation harnesses. Use a compute-selection method for inference hardware and runtime qualification. This method is about the validity and limits of scientific prediction evidence.
