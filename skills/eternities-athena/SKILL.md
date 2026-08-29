---
name: eternities-athena
description: Appraise scientific claims, study designs, and bodies of evidence through explicit validity, bias, confounding, statistical, causal, and evidence-quality judgments. Use when the question is what scientific evidence can support. Do not use for personalized medical advice, ordinary current-source research, or routine data analysis.
---

# Eternities Athena

Determine the strongest conclusion the evidence can carry, and no stronger. Read [the operating contract](references/operating-contract.md) when the appraisal needs a persistent evidence table, multiple studies, or formal design and inference judgments.

## choose one route

- claim-appraisal: test whether a scientific claim is proportionate to its design, measurements, analysis, and evidence base.
- study-design: expose validity threats before data collection and identify the smallest changes that make the intended inference testable.
- evidence-synthesis: reconcile multiple studies while preserving heterogeneity, dependence, contradiction, bias, and missing evidence.

Use eternities-oracle when the primary task is finding current papers or authoritative sources. Use an exact analysis workflow when the user asks to compute statistics from supplied data. Defer diagnosis, treatment, dosing, and personalized health decisions to a qualified medical professional.

## athena loop

1. State the exact claim or intended inference, population, exposure or intervention, comparator, outcome, time horizon, and decision context. Mark missing elements instead of inventing them.
2. Separate observation, analysis, interpretation, and recommendation. Distinguish exploratory from confirmatory work and association from causation.
3. Identify the design and the estimand it can support. Inspect sampling, allocation, controls, blinding, measurement validity, attrition, missingness, timing, preregistration, and deviations.
4. Map threats to construct, internal, statistical-conclusion, and external validity. Name likely selection, measurement, performance, detection, reporting, publication, and survivorship biases.
5. Build a confounding map. Separate measured adjustment from unmeasured confounding, mediators, colliders, reverse causation, and selection effects. A statistical adjustment is not automatically causal identification.
6. Audit inference: sample size and power rationale, effect size, uncertainty interval, model assumptions, multiplicity, researcher degrees of freedom, missing-data handling, robustness, and practical importance. Statistical significance is not practical importance, and non-significance is not proof of no effect.
7. For multiple studies, inspect independence, replication, heterogeneity, comparability, precision, directness, consistency, selective reporting, and plausible publication bias. Do not average incompatible evidence into false certainty.
8. State strengths before limitations, then classify each limitation by whether it changes existence, magnitude, direction, causality, generalizability, or confidence.
9. Return the strongest supported conclusion, unsupported extensions, confidence reason, decisive unknowns, and the smallest evidence that would change the verdict.

## judgment language

Use calibrated dispositions:

- supported: the evidence directly supports the bounded claim under stated conditions;
- qualified: the direction or association is supported but magnitude, scope, or causal language must narrow;
- inconclusive: uncertainty or conflicting evidence prevents the claimed conclusion;
- unsupported: the design or evidence does not establish the claim;
- unknown: required methods, data, or provenance are absent.

Named frameworks such as risk-of-bias or evidence-grading systems are aids, not automatic scores. Apply one only when its domain and required evidence fit, preserve domain judgments, and state what was not assessable.

## authority and limits

Research permission authorizes reading and appraisal, not human-subject approval, clinical care, data fabrication, undisclosed computation, publication, or external mutation. Never invent methods, sample characteristics, analyses, citations, effect estimates, or certainty. Never convert missing evidence into evidence of absence.

Athena succeeds when another reader can trace the claim to the design, identify the decisive validity threats, see why the confidence level follows, and name what evidence would alter it.

## Falsification and criterion-calibration route

For claims about an agent, internal state, or proposed mechanism, read [the falsification and calibration contract](references/first-party-contracts.md). Decompose the crux into falsifiable predictions, prefer the cheapest discriminating real experiment, and require independently observed criterion evidence with intervention, control, and prespecified error accounting. Self-report alone is inconclusive.
