# Adaptive amplification protocol v1

Capability selection and capability activation are separate decisions.

The commandless router answers which capability covers the mission under the host's authority, effect, risk, evidence, precondition, composition, and context ceilings. The adaptive activation compiler then answers how much of that selected capability should enter the agent's context, and when.

## Modes

- `native`: disclose no selected capability body. The model uses its native reasoning under ordinary user and host constraints.
- `guardrail`: disclose only compact hard constraints derived from a verified contract. Do not disclose method prose or prescribe a solution path.
- `method`: disclose the selected entrypoint and bounded contract before the attempt. This requires explicit user intent or matched task-class evidence that clears every method gate.
- `review`: disclose nothing before the first completed attempt. A host with a real second phase may then load the exact selected capability to critique the artifact before a bounded revision.

`review` is a scheduled phase, not proof that review occurred. A host without a second phase must fall back to consequential `guardrail` or low-consequence `native` rather than silently front-loading the method.

## Raw floor

Raw capability is the measured floor. Structural validity, routing accuracy, source count, popularity, and deterministic fixtures do not establish a quality advantage over the native model. Full method activation requires either an explicit request for that method or at least three matched task-class evaluations, two wins, a two-thirds win rate, no critical regression, and bounded measured overhead.

The thresholds qualify an intervention for further use. They do not establish universal superiority.

## Portable call

```js
import { compileActivationDecision } from "../src/adaptive-activation.mjs";

const decision = compileActivationDecision({
  selectedId: "eternities-muse",
  task: {
    taskClass: "creative-generation",
    consequenceClass: "consequential",
    authorityProjection: {
      availableAuthority: ["local-read", "local-write"],
      permittedEffects: ["local-read", "local-write"],
    },
  },
  explicitMethodRequest: false,
  reviewAvailable: true,
  policy,
  evidence,
});
```

Every decision contains the mode, reason codes, disclosure timing, method-gate result, exact policy and evidence digests, unchanged authority projection, and a decision digest.

The default compiler accepts only the policy and reviewed evidence registry
pinned in its v1 trust root. A caller cannot turn an arbitrary object into
method evidence by setting `reviewed: true`, changing a threshold, or supplying
a self-consistent profile. The exported numeric evaluator can test future gate
math, but its result is not an activation authorization. Adding a new trusted
registry requires an explicit source and receipt revision.

## Current Muse disposition

The reviewed visual evidence contains four matched product preferences. Raw Terra won three and the experimental Muse candidate won one. Muse is therefore not method-eligible for creative generation. Its evidence-qualified mode is `review` when a real review phase exists, otherwise consequential `guardrail` or low-consequence `native`.

This disposition does not remove Muse. It places its demonstrated strengths in art direction, variation, acceptance criteria, and critique after the native model has preserved its own spatial and technical solution search.
