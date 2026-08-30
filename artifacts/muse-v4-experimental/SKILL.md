---
name: eternities-muse-v4-experimental
description: Inactive evaluation candidate for designing and validating interactive real-time phenomena without sacrificing explicit spatial agency, natural motion, or legible internal light structure.
---

# Muse v4 experimental slice

This candidate is evidence-gated. It does not replace the active Muse skill and must not be routed implicitly.

Use it for an interactive visual phenomenon where composition, motion, light, spatial inspection, and runtime behavior must cohere. Preserve the user's desired experience while leaving the renderer free to choose its own techniques.

## Resolve the experience contract

Before building, write a compact contract containing:

- the focal phenomenon and the feeling it should produce
- every explicit user affordance, such as orbit, zoom, pause, or quality selection
- the dimensional readings that must survive front, side, near, and far views
- the visual facts that distinguish success from a merely attractive approximation
- the performance, resize, accessibility, and reduced-quality obligations

Treat explicit affordances as acceptance requirements. Do not silently replace full spatial control with a narrower drag, tilt, or fixed-camera substitute. If an affordance is infeasible, report the constraint instead of concealing the loss.

## Direct with boundaries, not recipes

Specify observable qualities and rejection conditions, then preserve implementation freedom. Do not mandate a named shader trick, particle topology, camera rig, or compositing stack unless the task itself requires it. A strong result may use a method the director did not anticipate.

For a luminous phenomenon, require readable internal structure before post-processing. Bloom may amplify light, but it must not be the only source of apparent form. Check that exposure and clipping do not erase the core, boundaries, or depth cues.

For dimensional work, verify the subject from front, side, near, and far views. The stage or base must retain volume and attachment under orbit rather than resolving as a decorative card from one privileged angle.

## Govern natural motion

When motion should feel natural, organic, turbulent, or stochastic, require all of these:

- variation at more than one spatial and temporal scale
- phase offsets so emitters and layers do not pulse together
- inspection at multiple time samples, not one favorable frame
- rejection of obvious spirals, lattices, evenly spaced bands, synchronized pulses, and other accidental choreography unless deliberately requested

Randomness alone is insufficient. Seek bounded irregularity: coherent local behavior without globally visible repetition. Judge the silhouette, interior, edges, detached matter, and environmental response separately.

## Build and verify

Preserve the smallest viable implementation path, but verify the artifact as an experience:

1. confirm every requested affordance works and remains discoverable
2. inspect all required viewpoints and zoom ranges
3. sample motion across several moments for periodic or organized artifacts
4. disable or reduce bloom to confirm internal luminance structure survives
5. resize the viewport and exercise pause, reduced motion, and lower-quality behavior
6. measure runtime stability and avoid unbounded allocations or duplicate loops

Record concrete failures using these codes when applicable:

- `spatial-affordance-regression`
- `natural-motion-regularization`
- `solution-space-collapse`
- `method-cost-overrun`

The candidate may advise and validate, but it inherits the host's authority exactly. It cannot grant network, filesystem, deployment, purchase, publication, or other external permissions.
