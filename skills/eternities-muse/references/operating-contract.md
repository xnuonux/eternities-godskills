# Muse operating contract

Use this reference only when a mission crosses several visual or media layers, carries consequential identity decisions, or needs a formal acceptance system. The entrypoint remains the routing authority.

## evidence classes

| class | meaning | required treatment |
|---|---|---|
| observed | directly visible in a capture or artifact | point to the source and capture state |
| extracted | explicit in code, variables, metadata, or structured design data | preserve the exact value and origin |
| inferred | a plausible rule that explains repeated evidence | give confidence and competing explanations |
| proposed | a new art-direction decision | label it as a choice and state the consequence |

Never let a proposed token masquerade as an extracted one. When sources disagree, retain the disagreement until authority, recency, or repeated behavior resolves it.

## artifact contracts

### visual evidence map

Produce:

- source inventory and capture conditions;
- identity, atmosphere, and one distinctive visual carrier;
- semantic color, type, spacing, shape, depth, and motion tokens;
- component families and signature components;
- layout, image behavior, breakpoints, touch targets, focus, and contrast;
- reconstruction risks, confidence by section, open questions, and source-specific rules.

Prefer explicit variables and measured values. If a value cannot be recovered, state the range or unknown instead of manufacturing precision.

### interface direction contract

State one sentence that acts as the generative visual law. Every later choice must either derive from it or be named as an exception. The contract includes audience, task hierarchy, palette roles, typography roles, density, component grammar, signature moment, responsive transformation, interaction states, accessibility, loading, and an implementation acceptance matrix.

Offer multiple directions only when a material decision remains unresolved. Directions must differ in composition and behavior, not merely color. Select one before code or asset search begins.

### narrative and motion contract

Map each chapter or scene to:

1. narrative job;
2. entering state;
3. action and visible cause;
4. carrier into the next beat;
5. exit state;
6. spoken, textual, musical, or ambient timing;
7. reduced-motion equivalent;
8. device and GPU tier.

The dominant motion direction forms a current. Direction changes require a visible cause or chapter boundary. Cut or transition while motion still carries intent rather than after every element settles. Avoid idle oscillation. Use staged reveals, purposeful camera travel, sequenced interface behavior, or authored action when a scene must remain alive.

Choose the lowest compute tier that carries the story:

- tier 0: static composition;
- tier 1: semantic HTML and compositor-safe CSS motion;
- tier 2: timeline or scroll choreography;
- tier 3: asset-backed real-time 3D;
- tier 4: procedural shaders or immersive runtime.

Each step upward requires a named perceptual or narrative need, a lower-tier fallback, and an explicit frame, memory, loading, and battery budget.

### visual acceptance contract

Freeze a manifest before capture:

- build or commit, browser and device tier;
- viewport, pixel ratio, font state, content, locale, and theme;
- camera, seed, parameters, time, and motion preference;
- expected network and asset state.

Then collect only relevant evidence:

- final and stripped-down baselines;
- layer, pass, field, focus, or state diagnostics;
- near, intended, and far camera or viewport states;
- representative content, parameter, and seed extremes;
- motion and temporal samples rather than stills alone;
- keyboard, focus, contrast, semantics, reduced motion, responsive and fallback states;
- frame time, GPU time where measurable, memory, render targets, asset weight, and loading behavior.

Write visual invariants and rejection thresholds before reviewing evidence. A single hero frame, CPU timing used as a GPU proxy, an unrepeatable random seed, or a post-effect-only success cannot certify the system.

## delegation

| condition | delegate | handoff must contain |
|---|---|---|
| direction settled, local components or effects needed | `eternities-frontend-arsenal` | visual law, target stack, constraints, acceptance matrix |
| distinctive interface implementation needed | `frontend-design` | direction contract, component grammar, responsive and accessibility rules |
| final raster asset requested | `imagegen` | approved prompt, composition, palette, dimensions, exclusions |
| locked production narration requested | `narrator` | approved text, voice, timing windows, pronunciation and retry criteria |
| subtitle burning requested | `subtitles` | final media, authored text if available, timing and render policy |
| concrete visual implementation fails | `systematic-debugging` | reproduction, expected invariant, failing evidence, last known good state |

Do not delegate the unresolved judgment itself. Do not ask a downstream implementation skill to invent the visual law that should constrain it.

## termination and proof

The route is complete only when its output names sources, uncertainty, constraints, handoff, and a condition that could reject the result. If proof cannot be run, label the exact unverified surface. Do not convert subjective approval into an empirical claim and do not invoke Muse recursively.
