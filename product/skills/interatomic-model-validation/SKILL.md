---
name: interatomic-model-validation
description: Assess whether a learned interatomic potential supports one declared materials use through reference-consistent labels, material-domain partitions, and property-level checks; route general surrogate validity and artifact lineage to their owners.
---

# Interatomic model validation

Use this specialist when an existing learned interatomic potential is offered as evidence for a particular material, structure class, condition range, or property. The output is a bounded assessment, not a new potential, a DFT calculation, a production deployment, or proof of experimental truth. If the question is about a general predictor rather than atomistic-material behavior, use scientific-surrogate-validation directly.

## Define the physical claim and evidence set

State the intended use (for example structure screening, relaxation, dynamics, vibrational or surface-property prediction), chemical species and compositions, phases and structure families, temperatures or pressures, and the specific quantity that matters. State whether the claim is agreement with a selected computational reference or with independent physical/experimental evidence; do not silently equate them.

Record the potential family, checkpoint digest, reference-label dataset, units, energy zero or normalization convention, and actual inference path. For a tuned model, name the base checkpoint, adaptation data, and retained domain. Use experiment-artifact-lineage to verify checkpoint, split, preprocessing, and cache continuity rather than trusting filenames or run labels. Unknown identity is a gap, not a negative score.

## Keep comparisons reference-consistent

Identify the reference calculation or measurement behind each label. For computational references, retain the method and settings needed to compare like with like, including functional or theory level, basis or pseudopotential, convergence status, and relevant boundary/structure conventions. Do not pool incompatible label conventions into one error metric. If an offset or conversion is justified, record how it was established without fitting it on the final evaluation set; otherwise report the groups separately.

Use scientific-surrogate-validation for decision-time feature admissibility, grouped holdouts, model selection, matched baselines, uncertainty calibration, and adaptive candidate-pool accounting. Within that protocol, choose *materials-relevant* independence groups: separated trajectories or time blocks for sampled dynamics; withheld composition, phase, defect, surface, or structure families for a corresponding transfer claim. A random split of nearby frames or relaxations does not by itself test transfer. Keep the claimed domain and excluded regimes explicit.

## Test the property the claim needs

Report energy, force, and stress differences with units, reference identity, case counts, and breakdowns by species, structure family, phase, and condition where relevant. Preserve failed predictions and unstable structures. An aggregate fit score cannot substitute for the property the user intends to infer.

Select additional checks before inspecting final results, aligned to the claim: equation-of-state or elastic behavior for bulk claims; vibrational quantities for phonon claims; appropriately defined surface or adsorption quantities for surface claims; or trajectory behavior for dynamics claims. Compare matched structures and definitions. The existence of a good energy/force score does not establish curvature-sensitive, surface, or dynamical behavior. A passing property check in one chemistry or regime does not transfer automatically to another.

For dynamics, record the conditions and duration, deviations, unstable states, and the meaning of the chosen observable. Route atom identity, periodic-coordinate interpretation, equilibration, and correlation-aware trajectory statistics to molecular-observable-integrity. Route solver convergence, numerical invariants, units, and independent reference checks to physics-constrained-numerical-validation. Do not call a short stable run long-term physical validation.

When comparing base and adapted potentials, use the same independent target evaluation and, if retained-domain performance matters, a separate unchanged retained-domain evaluation. Use the actual intended inference paths if execution consistency is part of the claim. Keep reference uncertainty, sampling uncertainty, model error, and untested model-form limitations separate. Predeclare application-specific acceptance criteria; do not import a universal threshold from an example source.

## Return a bounded assessment

Provide the claim and tested domain, model/reference/split identities, property-by-property matrix, failed and missing checks, baseline comparisons, and the strongest supported interpretation. Label the result supported *for the stated evidence domain*, qualified by named limits, inconclusive, unsupported, or not evaluated. State the next decisive check where evidence is insufficient.

Use eternities-athena for broader scientific-study appraisal. Do not use this specialist to train or fine-tune a model, generate new reference labels, construct platform-specific DFT inputs, submit GPU/HPC jobs, interpret corrosion or electrochemistry experiments, or certify deployment. Those require separate authority and methods. No static review alone establishes physical accuracy, universal transfer, or real-world safety.
