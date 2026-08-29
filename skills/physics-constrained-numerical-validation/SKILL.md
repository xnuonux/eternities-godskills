---
name: physics-constrained-numerical-validation
description: "Use when a numerical model must satisfy units, conservation laws, limiting cases, stability, and reference evidence. Do not use to equate simulation with hardware validation."
---

# Physics-constrained numerical validation

Validate numerical behavior against physical constraints and convergence evidence while keeping model, discretization, and real-world claims separate.

## use when

- Validate a numerical simulation against physical invariants and limits.
- Check units convergence stability and reference cases before interpretation.

## do not use when

- Claim hardware performance from simulation alone.
- Run a model whose units boundary conditions or solver tolerances are undefined.

## inputs

- equations units and physical assumptions
- numerical method mesh timestep and tolerances
- analytic limiting or trusted reference cases

## preconditions

- units equations boundary conditions and tolerances are explicit
- at least one independent physical or analytic reference exists

## workflow

1. check dimensional consistency and sign conventions
2. test conservation bounds and limiting cases
3. measure mesh timestep and solver convergence
4. separate discretization model and measurement uncertainty

## outputs

- physics-constrained validation report
- convergence residual invariant and limitation evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-write, local-compute
allowed effects: read, write
forbidden effects: external-write, hardware-control, physical-certification-claim

## failure behavior

- stop interpretation when conservation or convergence fails
- report model-form uncertainty instead of tuning it away

## exclusions

- does not validate physical hardware
- does not turn numerical stability into physical truth

## termination

Stop when units, invariants, limiting cases, convergence, stability, and proof limits are recorded with a pass or failure.
