---
name: interatomic-model-validation
description: Evaluate whether a learned interatomic potential supports a declared materials use through reference-consistent evidence, independent test partitions, and claim-relevant property checks.
---

# Interatomic model validation

Use this route after a learned interatomic potential has been trained or adapted and before its results are used to support a materials claim. It evaluates the evidence for one declared chemistry, structure class, condition range, and intended use. It does not train a model, generate DFT labels, or certify a model for untested conditions.

## Declare the claim and operating domain

Write the property or decision the model is meant to support, the material chemistry and composition, relevant phases and structures, temperature or pressure range, and the intended use such as screening, relaxation, or dynamics. Separate a statement about agreement with a chosen reference from a statement about physical or experimental accuracy. Identify any model assumptions that could limit the claim, including supported elements, locality, long-range interactions, charge, or reactive identity.

List the model checkpoint and its digest, model family and version, training-data identity, label source, units, reference method, and the execution path that will be used. For adapted models, identify the base checkpoint and the adaptation data. Missing identity is an evidence gap; do not infer it from a model name or a training summary.

## Protect the evaluation comparison

Confirm that structures in the final evaluation set were not used for training, hyperparameter choice, checkpoint selection, or active query decisions. Select partitions that match the claimed generalization: separate trajectories or time blocks for dynamical sampling, structure families for phase or defect transfer, or compositions and conditions for chemistry or environment transfer. Random frame splits can place near-duplicate structures on both sides and overstate transfer.

Check that each reference label uses compatible units and a recorded calculation convention. For first-principles labels, preserve the code and version, functional, pseudopotential or basis identity, cutoffs, sampling, and convergence settings needed to interpret the comparison. If reference conventions differ, reconcile them with an independently justified method or keep the results in separate groups. Do not combine incompatible labels into one score.

## Match checks to the intended use

Report energy, force, and stress errors only with their reference, unit convention, evaluation population, and useful breakdowns by species, structure family, phase, or condition. A single aggregate score can conceal a failure in the regime that matters.

Choose additional comparisons from the intended claim. Examples include an equation of state or elastic response for bulk behavior, lattice dynamics for a vibrational claim, or surface and adsorption quantities for surface chemistry. Compare corresponding structures and reference definitions. State which checks were run, which were not, and what each result can support. A property check does not establish transfer to a different chemistry or structure class.

For a dynamics claim, evaluate the model under the stated conditions and preserve failures, drift, or unstable structures as evidence. Use molecular-observable-integrity for atom mapping, periodic-coordinate interpretation, equilibration context, and correlation-aware uncertainty of trajectory observables. A short stable trajectory is not proof of long-term stability or physical accuracy.

For a change in model, training data, or execution path, compare the candidate to its baseline on the same independent target set. If the intended use includes the baseline's prior domain, assess that domain separately for lost coverage. Compare predictions from the actual intended execution paths on the same inputs when deployment consistency matters; do not assume equivalence from matching model filenames.

Acceptance criteria must be selected for the declared application and reference uncertainty before examining final results. Do not import universal error limits from an example workflow. Separate reference uncertainty, sampling uncertainty, model error, and untested model-form limits.

## Report a bounded disposition

Return a traceable record with the claim, domain, model and reference identities, data partition rule, per-domain results, failed or missing checks, and the strongest supported interpretation. Use one of these dispositions:

- supported for the stated evaluation domain;
- qualified by named limits;
- inconclusive because decisive evidence is missing or unstable;
- not supported because a required check failed;
- not evaluated.

Finish when a reader can reproduce which evidence supports the claim and see where it stops. A successful evaluation is not universal transferability, physical truth, experimental agreement, or deployment certification.

## Route boundaries

Use physics-constrained-numerical-validation for general units, invariants, numerical convergence, and reference checks. Use Eternities Athena when the main task is appraising a broader scientific claim or study. Use diagnostic-statistical-model-inference for statistical model diagnostics beyond potential-specific evaluation. Use molecular-observable-integrity for trajectory-derived molecular observables.

Do not use this route to construct platform input decks, select pseudopotentials, submit jobs, run training or GPU work, or operate production deployment. Those actions need their own authorized workflow and evidence. Corrosion laboratory interpretation, electrochemistry, free-energy reweighting, and reactive or excited-state chemistry need separate domain methods.
