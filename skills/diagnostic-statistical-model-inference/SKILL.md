---
name: diagnostic-statistical-model-inference
description: "Use when a statistical model needs assumption diagnostics, sensitivity analysis, and bounded interpretation. Do not use to turn association into causation or provide regulated advice."
---

# Diagnostic statistical model inference

Evaluate model fit and inferential limits through explicit estimand, assumptions, diagnostics, uncertainty, and sensitivity evidence.

## use when

- Diagnose a statistical model before interpreting coefficients or predictions.
- Test inferential sensitivity to assumptions specification and influential observations.

## do not use when

- Claim a causal effect without an identification design.
- Issue medical financial or legal conclusions from a model.

## inputs

- data provenance model and estimand
- sampling and missingness assumptions
- diagnostic and sensitivity criteria

## preconditions

- the dataset provenance and intended estimand are known
- diagnostic assumptions are falsifiable where possible

## workflow

1. state estimand design and assumptions
2. inspect residual calibration influence and collinearity
3. compare plausible specifications and uncertainty
4. separate descriptive predictive and causal claims

## outputs

- diagnostic and sensitivity report
- bounded inference with assumption and uncertainty ledger

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, dataset-bound-read
allowed effects: read, write
forbidden effects: causal-overclaim, external-write, regulated-decision

## failure behavior

- stop causal interpretation when identification assumptions are absent
- report instability when plausible specifications reverse the conclusion

## exclusions

- does not prove causality from fit
- does not replace domain or regulated expert review

## termination

Stop when diagnostics, sensitivity, uncertainty, and the strongest supportable claim class are explicit.
