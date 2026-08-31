# adaptive amplification protocol v1 design

## status

approved for implementation by Dom on 2026-08-30. this is an additive experimental protocol. it does not rewrite the certified Godskills System v3 artifacts or promote Muse v4.

## outcome

Make a strong raw agent the measured capability floor. Skill selection answers which capability is relevant. Activation separately decides whether that capability should shape the first attempt, contribute only hard constraints, review a completed attempt, or remain absent.

The protocol must preserve the strongest native model behavior while applying specialized method only where matched evidence supports it. A skill may increase competence, never authority, and selection alone never proves that front-loaded method is beneficial.

## evidence that forces the change

The reviewed `eternities-oneshots` archive binds four matched visual preferences:

- raw Terra won white fire;
- raw Terra won gravitational portal;
- raw Terra won captive storm;
- the Muse v4 candidate won bioluminescent ecosystem.

Muse therefore won one of four observed product preferences. The three-mission held-out adoption gate was one of three, below its required two wins. Regressions included reduced spatial inspection, over-regularized secondary motion, and weaker immediate product pull. The skill remains useful for art direction and ecosystem richness, but the evidence rejects unconditional pre-inference injection.

The earlier five-task crossed suite is supporting development evidence. It showed strong recovery and implementation gains, a research tie, a continuity loss, and added output cost. It supports capability-specific activation, not a universal multiplier claim.

## separate selection from activation

The existing commandless router remains responsible for selecting zero to three relevant capabilities under authority, effect, risk, evidence, precondition, and context ceilings.

After selection, an activation compiler receives:

- the selected capability identities and exact entrypoint digests;
- a host-declared task class and consequence class;
- whether a distinct post-artifact review phase exists;
- whether the user explicitly requested the full method;
- an exact, reviewed evidence profile for each selected capability;
- the activation policy digest.

It emits one mode per selected capability:

| mode | first attempt receives | later phase |
| --- | --- | --- |
| `native` | no skill body or contract prose | none |
| `guardrail` | compact hard constraints, effects, and rejection conditions only | optional ordinary verification |
| `method` | exact selected entrypoint and bounded contract | ordinary verification |
| `review` | no skill body or contract prose | exact selected capability reviews the completed first attempt before revision |

The receipt must distinguish selected capabilities from disclosed capabilities. `review` is not permitted unless the host exposes a real second phase. If review is unavailable, mixed or negative evidence falls back to `guardrail` for consequential work and `native` for low-consequence work.

## evidence thresholds

Full `method` activation is permitted when any one condition holds:

1. the user explicitly requests that exact skill or method; or
2. the evidence profile contains at least three matched evaluations in the same task class, at least two wins, a win rate of at least two thirds, zero critical regressions, and measured context or wall-time overhead within policy.

`review` is preferred when a capability has demonstrated some unique benefit but loses or ties the raw baseline overall, or when generative solution diversity is materially valuable. `guardrail` is preferred when hard safety, authority, destructive-action, verification, or acceptance constraints matter but full-method evidence is insufficient. `native` is preferred for low-consequence work with no measured method advantage.

No profile may infer superiority from structural tests, deterministic routing accuracy, source count, popularity, or one unblinded success.

## first evidence profile

Muse v4 is the first exact profile:

- task class: `creative-generation`;
- matched product-preference evaluations: four;
- candidate wins: one;
- raw wins: three;
- critical regressions: zero hard-gate failures, with three product-quality losses;
- method eligible: false;
- default mode when review exists: `review`;
- fallback mode without review: `guardrail` for consequential work and `native` otherwise.

The profile binds the exact private-repository commit and SHA-256 digests of both verdict files and the archive manifest. It contains reviewed summaries, not raw transcripts.

## godagents integration

Godagents will gain an optional adaptive adapter path without altering the v1 certified default. The adapter must decide activation before reading selected entrypoint bytes.

- `method` may read the entrypoint and contract.
- `guardrail` may read the contract but must omit entrypoint prose and emit a bounded constraint slice.
- `native` must read neither selected artifact.
- `review` must read neither selected artifact during first-attempt binding and must expose a digest-bound deferred review descriptor.

The first-attempt cortex package records activation modes and disclosure bytes. Recovery reuses the exact activation-policy, evidence, stack, and package digests. A future runtime review loop may consume the deferred descriptor, but no implementation may claim a review occurred merely because it was scheduled.

## codex host behavior

Global Codex routing will adopt the same distinction in compact form:

- raw reasoning is the default floor;
- full skill bodies are loaded before work only for an explicit request, a hard process requirement, or a verified recurring advantage;
- creative first attempts use raw construction plus compact non-negotiable constraints, followed by skill-guided review when a real review pass is available;
- routine work and unclear matches load no skill;
- every superiority claim requires matched artifact evidence.

This rule applies to all skills, not only Muse, and does not disable deterministic matching or authority controls.

## acceptance requirements

1. Selection and activation are represented as separate deterministic decisions.
2. Muse v4 resolves to `review` for creative generation when review exists and never enters first-attempt context.
3. The same evidence resolves to consequential `guardrail` or low-consequence `native` when review is unavailable.
4. Synthetic replicated positive evidence can earn `method`; insufficient, stale, malformed, or contradictory evidence cannot.
5. Explicit skill requests can select `method` but cannot expand authority or effects.
6. Every decision binds policy and evidence digests and reports reason codes and disclosure intent.
7. Godagents can compile a native, guardrail, method, and deferred-review package without reading unauthorized bodies.
8. Existing certified v1 adapter and Godskills System v3 tests remain unchanged and passing.
9. A fresh Codex routing probe demonstrates that an ordinary creative task does not automatically preload a full Godskill.
10. Documentation states that adaptive routing is evidence-qualified, not universally superior.

## non-goals

- claiming that four visual trials establish statistical significance;
- weakening deterministic authority, effect, security, or destructive-action boundaries;
- rewriting the 22 promoted Godskills;
- changing historical receipts;
- globally activating Muse v4;
- pretending a scheduled review was executed;
- making raw mode exempt from tests, verification, or user requirements.
