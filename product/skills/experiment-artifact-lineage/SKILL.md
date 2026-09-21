---
name: experiment-artifact-lineage
description: Decide whether model artifacts, feature caches and checkpoints can be reused or resumed by tracing input identities, fit boundaries, training state and observed reproducibility.
---

# Experiment artifact lineage

Use when a training pipeline reuses cached features, resumes work, compares model
runs, or cannot reproduce a reported result. For a simple model-selection question
without artifact reuse, use ordinary comparative analysis. This method does not
authorize GPU jobs, downloads, uploads or a new paid run.

## Specify which continuity is needed

Distinguish a cached computation, continuation of an interrupted run, new training
initialized from existing weights, and evaluation of a fixed artifact. They have
different requirements. Never silently substitute a warm-start for an exact
resume, or describe a new run as the old one because the filename is unchanged.

Choose the reproducibility claim before testing: byte-identical outputs under a
fixed environment, numerically close results within a tolerance, or comparable
statistical outcomes across repeated runs. A fixed seed alone establishes none
of these. Hardware, software versions and nondeterministic operations matter;
[PyTorch's reproducibility guidance](https://docs.pytorch.org/docs/stable/notes/randomness.html)
provides one framework-specific example, not a required dependency.

## Trace the artifact, not its label

For the requested operation, identify the relevant dependency graph:

- Immutable data snapshot and actual train/validation/test membership; include
  grouping, time or spatial boundaries where samples are correlated.
- Preprocessing and feature computation, fitted parameters, label definitions,
  code revision plus relevant uncommitted changes, and effective configuration.
- Model structure, parent weights/checkpoints, training policy, random-state
  handling, environment and hardware where they affect the promised continuity.
- Artifact content digest, completion status, producing run, and evaluation
  identity. A run name, timestamp, directory path or existing file is not enough.

For a multi-stage pipeline, check each required parent before starting its
dependent stage. An incomplete tokenizer or feature stage cannot become a valid
parent merely because an output path exists; propagate invalidation downstream.

Use an existing experiment system or a small manifest; no tracking vendor is
mandatory. Separate stable content identity from its storage location so moving
an unchanged artifact does not force unnecessary recomputation. Include relevant
dependencies, not every unrelated repository file. Unknown identities remain
unknown; an empty declaration and a missing declaration are different evidence.

Keep evaluation data out of fitting, including learned preprocessing and model
selection. Check actual membership intersections, not only distinct split names.
If a holdout informed choices, document that use and obtain a suitable untouched
evaluation set before claiming an independent result. Preserve provenance without
publishing sensitive raw examples or credentials.

## Make a deliberate reuse decision

| Operation | Minimum useful decision checks |
| --- | --- |
| Cached computation | Complete verified artifact; recorded dependencies match current data, membership and computation. Rebuild affected descendants when a dependency changes. Do not invalidate a cache for an unrelated setting. |
| Resume | Compatible data/split/code/configuration and execution assumptions; recover the model plus every state component needed by this training process and promised continuity. |
| Warm-start | Explicit new-run intent; compatible model structure and verified weights; record the parent and initialize new training state deliberately. Prior fitting must not contaminate the new evaluation. |
| Evaluate | Fixed verified artifact and preprocessing, appropriate evaluation mode, fixed metric/data definitions and no hidden fitting on the evaluation set. |

For resume, inspect optimizer, scheduler, progress counters, random generator,
sampler/data order, mixed-precision scaler and distributed state **when used**.
Mark genuinely inapplicable components rather than demanding invented state. A
weights-only checkpoint can be useful but may not support the claimed continuation;
the [checkpoint guidance](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html)
illustrates this distinction. Missing evidence means block the requested reuse
until resolved, not assume compatibility. A deliberate changed configuration is
a new branch of lineage, even if some state can be carried forward.

Inspect trusted manifests before loading artifacts. Use the framework's safe
format/load options and trusted sources; untrusted checkpoint deserialization may
execute code. Publish completed outputs atomically where supported, with incomplete
work clearly distinguished. Never overwrite the only known-good checkpoint during
an experiment. A checksum proves byte identity, not safety or authenticity.

## Test one interruption and one invalidation

On a small authorized fixture, compare uninterrupted execution with an interrupted
save/resume path using the chosen equivalence criterion. Check the resumed step,
data order and relevant state, not only the final loss. Then change a real upstream
dependency: stale outputs must be rejected or rebuilt. Also move an unchanged
artifact or alter an irrelevant setting to check against excessive invalidation.
Include missing manifests, partial writes, mismatched bytes and split overlap.

Preserve failed runs and distinguish missing measurements from zero cost. Report
actual environment, deviations, runtime/resource use when observed, metric
variation and unresolved limits. Do not infer reproducibility from a successful
manifest check; the execution comparison is separate evidence.

Example: a tokenizer cache exists, but its training membership changed. Verify
whether membership affects its fitted vocabulary, rebuild the affected stage and
invalidate dependent models. Conversely, renaming an otherwise identical verified
cache is not a new experiment. If only model weights survived, offer an explicitly
new warm-start run instead of pretending optimizer history was recovered.

Finish with the requested working reuse/resume path or an evidence-bound refusal,
plus a compact lineage record that another machine can follow without your paths.
