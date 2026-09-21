---
name: molecular-observable-integrity
description: Use when a molecular or atomistic simulation observable must be reported with defensible coordinate semantics, sampling evidence, and uncertainty.
---

# Molecular observable integrity

Use this route to decide whether an observable extracted from a molecular or atomistic simulation is supported by the supplied record. It validates the analysis contract; it does not repair a force field, choose an ensemble, or certify physical truth.

## Contract

Before calculating, declare the observable and estimand, topology and trajectory inputs, ensemble and units, time spacing, boundary conditions, atom/frame selection, equilibration cutoff, uncertainty rule, and any tolerance needed for the decision. Return the estimate with units, source-frame span, topology identity, coordinate transformations, sample/block information, sensitivity results, and a calibrated status: `supported`, `qualified`, `inconclusive`, or `not-computable`.

## Integrity gate

1. **Identity and units.** Check atom count and stable identity across frames, type or element mapping, finite coordinates, box data, time spacing, and unit conversions. Preserve input digests when available. Missing or contradictory metadata is a failure, not an invitation to guess.
2. **Observable representation.** Choose the coordinate view that matches the estimand. Use wrapped or minimum-image positions for local geometry; use sequentially unwrapped positions for displacement or diffusion; state whether rigid-body or center-of-mass motion was removed. Record the transformation and verify that every required box is present.
3. **Sampling.** Exclude the declared transient, then inspect stationarity of the observable rather than assuming a protocol duration is sufficient. Estimate correlation or use block means at increasing block scales. Recalculate the value and interval across at least two defensible windows; report effective information, not raw frame count.
4. **Independent check.** Compare independent runs when they exist. If only one trajectory is available, label the result as within-trajectory evidence and retain that limitation.
5. **Decision.** Mark `supported` only when identity, units, representation, and sampling checks pass and the estimate is stable under the declared sensitivity checks. Use `qualified` for a usable but limited result; use `inconclusive` or `not-computable` when missing metadata, unresolved boundary crossings, nonstationarity, or insufficient information prevents an honest estimate.

## Boundaries

This route does not control equilibration, infer reactive bonds from a fixed topology, perform biased-ensemble reweighting, compute electronic observables, or certify hardware or experimental behavior. It may identify those needs and hand them to a method that owns them. A pass supports only the stated observable and data record; it does not prove equilibrium, transferability, causality, or global physical accuracy.

Scientific grounding: correlated-data error treatment is described by [Flyvbjerg and Petersen](https://doi.org/10.1063/1.457480); the distinction between wrapping and sequential unwrapping is documented in the [MDAnalysis transformation guide](https://docs.mdanalysis.org/2.7.0/documentation_pages/transformations/wrap.html) and its [NoJump specification](https://mdanalysis.readthedocs.io/en/latest/documentation_pages/transformations/nojump.html).
