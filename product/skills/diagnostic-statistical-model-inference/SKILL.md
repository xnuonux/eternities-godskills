---
name: diagnostic-statistical-model-inference
description: Use when a statistical model needs explicit estimands, assumption diagnostics, sensitivity analysis, uncertainty accounting, and a bounded interpretation.
---

# Diagnostic statistical model inference

Use this entrypoint before interpreting coefficients, predictions, or model comparisons when the result depends on sampling, missingness, functional form, or other assumptions. It supports a defensible claim class; it does not manufacture causal identification or regulated advice.

## Define what is being estimated

Record data provenance, inclusion rules, unit of analysis, outcome, predictors, time order, estimand, target population, and decision context. Distinguish a descriptive quantity, a predictive target, and a causal effect. State the identification design needed for a causal statement; if it is absent, keep the result descriptive or predictive.

List assumptions that can be checked, assumptions that require domain judgment, and unknowns. Explain missing-data handling, censoring, selection, measurement error, dependence, and any leakage between training and evaluation. Preserve the analysis dataset and transformation revision so a later rerun is comparable.

## Diagnose and stress the result

1. Check input ranges, missingness, outliers, duplicated units, and temporal or group leakage before interpreting fit.
2. Inspect residual structure, calibration, discrimination where relevant, heteroskedasticity, dependence, leverage, influence, and collinearity. Use diagnostics appropriate to the model rather than a universal checklist.
3. Fit plausible alternative specifications that reflect the stated uncertainty: transformations, interactions, regularization, missingness strategies, or influential-observation handling. Do not select an alternative only because it confirms a preferred story.
4. Report uncertainty with the method and target it represents. Include sampling error, bootstrap or posterior variation where appropriate, and sensitivity to analyst choices. Correct for multiplicity when many hypotheses are screened.
5. Compare conclusions, not just scores. Mark a claim stable, materially changed, or not assessed across specifications. A sign reversal or important threshold crossing is evidence of instability.

## Report the supportable claim

Produce an assumption and uncertainty ledger, diagnostic figures or tables, specification comparison, sensitivity results, and a plain-language claim bounded by the evidence. State what the analysis does not establish. Domain, clinical, legal, and financial decisions require their appropriate expert and governance review even when the model is numerically well fit.

Finish when the estimand, data limitations, diagnostics, sensitivity, uncertainty, and strongest supportable claim class are explicit. A model fit statistic is neither causal proof nor a substitute for a design.

## Common failure modes

- Calling an association a treatment effect because the coefficient is precise.
- Tuning away residual structure without recording the changed specification.
- Reporting a single p-value while ignoring influence or missingness.
- Treating a prediction benchmark as evidence of transport to a new population.
- Hiding an unstable conclusion behind a rounded average across models.
