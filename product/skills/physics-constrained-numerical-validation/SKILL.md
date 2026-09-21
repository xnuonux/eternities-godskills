---
name: physics-constrained-numerical-validation
description: Use when a numerical model must be checked against units, equations, conservation, limiting cases, convergence, stability, and independent reference evidence.
---

# Physics-constrained numerical validation

Use this entrypoint to validate a numerical model without confusing solver behavior with physical truth. It supports implementation and interpretation of a declared simulation; it does not certify hardware or a real-world system from computation alone.

## Freeze the physical and numerical statement

Record equations, units, sign conventions, coordinate system, initial and boundary conditions, constitutive assumptions, material or parameter sources, discretization, mesh or resolution, time step, solver tolerances, stopping criteria, and precision. Identify the independent analytic, experimental, or trusted reference case and its credibility.

## Check the model in layers

1. Check dimensions and conversions through inputs, intermediate state, outputs, and reported metrics. A numerically finite result with inconsistent units is a failure.
2. Test conservation, positivity, bounds, symmetry, monotonicity, and other invariants that the model should preserve. Include invalid and limiting cases such as zero input, steady state, small parameter, or known asymptote.
3. Run mesh, timestep, solver-tolerance, and iteration convergence studies. Change one numerical resolution variable at a time where possible and report whether the quantity of interest stabilizes.
4. Examine stability, residuals, conditioning, and sensitivity to initial state or solver choice. Do not tune tolerances until a plot looks plausible while omitting failed runs.
5. Compare with an independent reference and separate errors from discretization, model form, parameter uncertainty, measurement uncertainty, and implementation defects.

If the model is changed, retain the old configuration and rerun the same checks. If the task includes a physical experiment or hardware test, keep its evidence as a separate lane with its own calibration, uncertainty, and authority.

## Evidence and finish

Return a validation matrix containing each check, expected behavior, observed result, resolution or tolerance, and status. Include failed or inconclusive runs and the strongest claim the evidence supports. Finish when units, invariants, limits, convergence, stability, and proof boundaries are recorded with pass or failure.

Numerical agreement with one reference point does not prove global accuracy. Stable iteration does not prove that the equations describe the physical system.

## Common failure modes

- Comparing values with hidden unit conversions.
- Calling a residual small without relating it to the quantity of interest.
- Refining one mesh while changing time step, parameters, or boundary conditions.
- Treating a tuned simulation as an independent reference.
- Upgrading simulation evidence into hardware or physical certification.
