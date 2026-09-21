---
name: molecular-observable-integrity
description: Check molecular trajectory observables for atom identity, periodic-coordinate interpretation, equilibration and correlation-aware uncertainty before reporting results.
---

# Molecular observable integrity

Use when calculating or reviewing a structural, thermodynamic or dynamical observable from molecular simulation records. Connect the requested quantity to its coordinate representation and sampling evidence. This is analysis validation, not force-field selection or proof of physical truth.

## Define the observable

Recover the quantity being estimated, topology and trajectory identities, ensemble, units, time spacing, boundary conditions, atom/frame selections and any decision tolerance. Distinguish an equilibrium average from a time-dependent response; stationarity is not an appropriate requirement for every intentionally driven experiment.

Declare the production interval and transient-exclusion rule before selecting a favorable result. Existing equilibration schedules are context, not proof that this observable has equilibrated. Keep original inputs and a record of transformations; avoid rewriting the only trajectory copy.

## Match the representation to the quantity

- Check stable atom mapping, finite coordinates, units and frame times. Check periodic box information when the analysis requires it; a nonperiodic record does not need invented box dimensions. Missing identity or unit information is a limitation to resolve, not guesswork.
- Local periodic distances may require a minimum-image convention; whole-molecule geometry may instead require reconstructing molecules across images. Simply wrapping every atom independently is not a universal preprocessing step.
- For RMSD or related structural comparisons, state the reference, fit group, measurement group, weighting and removal of translation or rotation. A changed fit convention can change the result without any physical change.
- For displacement or diffusion, preserve continuous motion across periodic crossings. Use supplied image history or an appropriate validated reconstruction with the required sequential frames and box history. Sparse frames can leave crossings ambiguous. Changing or deforming cells require a convention suited to that trajectory; do not silently apply a fixed-cell assumption.
- Record any center-of-mass correction. Removing motion needed by the observable is not cosmetic cleanup. For diffusion, justify the lag-time fit interval and demonstrate a suitable diffusive regime rather than fitting an arbitrary straight line.

## Check effective information

Inspect the retained observable for transients, drift and sampling limitations. For an equilibrium estimate, use correlation-aware uncertainty or justified block analysis, and assess sensitivity to defensible window and block choices. More saved frames are not necessarily more independent information. Report the uncertainty convention and effective-sampling evidence, not only the frame count.

Compare independent runs when available. A single trajectory may still support a scoped estimate, but does not establish run-to-run reproducibility. If block or window estimates remain unstable, report that limitation instead of choosing the smallest error bar. Statistical precision does not remove force-field or model-form bias.

## Deliver the supported result

Return the estimate and units, selections and source interval, coordinate/fit conventions, uncertainty method and sensitivity checks. State whether it is supported for the stated record, qualified by limitations, inconclusive, or not computable from the supplied inputs. Explain the missing evidence and the smallest useful next check.

Reactive identity changes, biased-ensemble/free-energy reweighting, electronic observables and specialized nonequilibrium estimators need their own validated method. Identify that boundary without applying ordinary fixed-topology averages to a different problem. A successful check does not prove equilibrium, transferability, causality or experimental accuracy.
