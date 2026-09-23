---
name: ecological-sampling-and-detection-uncertainty
description: Design and audit ecological observations so effort, event rules, repeated visits, imperfect detection and reporting-support uncertainty remain visible before abundance, occupancy or change claims.
---

# Ecological sampling and detection uncertainty

Use when ecological observations, repeated surveys, camera or sensor detections,
non-detections, sampling effort or change estimates must support a statement
about occupancy, abundance, trend or impact. The contract is to distinguish the
ecological state from the observation process and to report uncertainty at the
support being claimed. It does not guarantee absence or abundance, prescribe a
universal sample size or event threshold, fit every specialist model, issue
carbon credits, or replace qualified ecological and regulatory review.

## Define state, sampling and observation separately

State the target quantity and its population, area, taxon and time horizon.
Define the sampling unit, visit or occasion, closure period where relevant, and
the reporting support: point, plot, station, field, landscape or project mean.
Keep the intended state quantity separate from what was actually detected.

Create an observation ledger with stable site and occasion identifiers,
protocol version, observer or sensor, effort, timing, weather or conditions,
coordinates and uncertainty, and three distinct outcomes: detected, surveyed
without detection, and not surveyed or unusable. Do not encode missing visits as
zero. Preserve raw records and reasons for every exclusion or recoding.

## Make event and effort choices reproducible

When raw images, audio or repeated records become events, predeclare the event
key, independence interval, grouping and tie-breaking rules. Report sensitivity
to plausible event definitions. Normalize comparisons by actual operating
effort, including downtime, failed storage, tampering and partial coverage, not
only planned dates.

Relative detection indices may compare like with like when effort and detection
conditions are controlled, but they conflate state, detectability and activity.
Do not rename them occupancy, density or abundance. A zero is evidence about the
survey process; absence or non-use requires design and detection evidence.

The observation templates are in
[sampling and detection records](references/sampling-and-detection-records.md).

## Plan inference and uncertainty at the claim support

Choose a design that can separate state and observation where that distinction
matters: repeated visits, repeat sensors, replicated sites, controls, or an
explicit model for detection. Record closure, exclusivity, independence,
availability and detectability assumptions before analysis.

For change claims, bind baseline and follow-up protocols and units, revisit
locations where feasible, and report whether the expected change is detectable
relative to sampling and model error. Preserve temporal error correlation when
combining repeated estimates. Point-level accuracy does not establish accuracy
of an aggregated plot, field or project mean.

Report parameter uncertainty, design uncertainty, missingness and sensitivity
to material event, effort and model choices. Where two substantively different
models are plausible, compare their spread instead of presenting only a
within-model interval. Use `diagnostic-statistical-model-inference` for fit and
specification checks and `eternities-athena` for causal or study-validity limits.
For a crop intervention trial, use `agricultural-observation-and-trial` first and
add these detection checks conditionally.

## Deliver and finish

Return the sampling contract, raw-to-event ledger, effort table, detection or
observation matrix, exclusions, analysis assumptions, uncertainty at the claimed
support, sensitivity results and strongest supported statement. Finish when a
reader can distinguish observed detections, surveyed non-detections, missing
surveys, model estimates and unsupported extensions.

Example: several camera stations have no detections. Report operating effort,
event rules and detection histories, estimate detection separately where the
design supports it, and withhold a reserve-wide absence claim if coverage or
detection remains weak.
