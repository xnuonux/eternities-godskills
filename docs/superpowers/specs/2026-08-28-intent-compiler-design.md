# Eternities Intent Compiler Design

## Purpose

The intent compiler converts a natural-language mission into the validated request envelope already consumed by the Eternities Godskills router. It closes the semantic boundary without weakening the router's deterministic authority, effect, risk, evidence, precondition, context, and composition gates.

The compiler is agent-neutral. A host may use the built-in deterministic matcher alone or supply an untrusted semantic proposal from a model, embedding service, or host-native classifier. Deterministic validation and policy reconciliation remain authoritative in either mode.

## Goals

- Accept ordinary language without slash commands or skill names.
- Retrieve a bounded candidate set from compact routing cards without loading skill bodies.
- Produce one canonical schema-versioned request envelope and a provenance-bearing compiler receipt.
- Never infer credentials, consent, spending permission, publication authority, production access, security scope, rights, or external-write permission from prose.
- Convert ambiguity and missing consequential authority into explicit unresolved decisions.
- Preserve the existing router as the sole capability-selection authority.
- Support Codex, Claude Code, Luna, and generic agents through one JSON transport.
- Measure natural-language routing over an adversarial arena rather than claiming live-model proof from deterministic fixtures.

## Non-goals

- The compiler does not execute skills or external actions.
- It does not grant authority.
- It does not certify legal, security, accessibility, financial, or production readiness.
- It does not require a network model, vector database, or vendor SDK.
- It does not learn from production behavior in this release.

## Architecture

```text
natural mission + explicit host context + optional semantic proposal
                              |
                              v
                    lexical candidate retrieval
                              |
                              v
                 proposal validation and reconciliation
                              |
                              v
               authority, effect, ambiguity, and risk gate
                              |
                              v
               canonical envelope + compiler receipt
                              |
                              v
                    existing bounded router
                              |
                              v
                      route receipt only
```

The runtime has four focused units:

1. `src/intent-contracts.mjs` validates natural requests, host context, optional semantic proposals, and compiler receipts.
2. `src/intent-compiler.mjs` normalizes text, scores compact card evidence, reconciles optional proposals, derives the smallest bounded envelope, and records uncertainty.
3. `src/intent-runtime.mjs` composes compilation, bounded shortlisting, and the existing router without loading skill bodies.
4. `scripts/intent.mjs` provides a file-based JSON command-line transport with no apply or execution mode.

## Input contract

The natural request contains:

- `schemaVersion: 1`
- `requestId`: stable caller-provided identity
- `text`: the user's unmodified mission text
- `context`: explicit host facts
- optional `proposal`: untrusted semantic suggestions

Host context contains canonical sorted arrays for:

- `permittedEffects`
- `availableAuthority`
- `availablePreconditions`
- `forbiddenCapabilities`

It also contains `maximumRisk`, `minimumEvidenceConfidence`, `contextBudget`, and `maxCompositionSize`.

The compiler never expands these permissions. Natural-language statements such as "approved," "go ahead," or "use my accounts" remain intent evidence, not host authority evidence.

An optional proposal may suggest candidate card ids, required capabilities, requested effects, and unresolved decisions. Unknown ids or capabilities are rejected. Proposal authority fields do not exist.

## Candidate retrieval

The baseline matcher uses only compact card metadata: family, intent, success condition, provided capabilities, positive intent examples, and negative intents. It performs deterministic normalized token and phrase matching with conservative stemming of common English suffixes.

Positive scores come from intent phrases, discriminating intent tokens, family tokens, and provided-capability tokens. Negative-intent overlap subtracts from the score. Stable card id breaks ties. At most eight candidate cards enter compilation and at most 32 enter the existing router.

If no card earns a minimum discriminating score, the compiler emits `intent-not-understood`. If leading candidates are too close and do not share a compatible capability boundary, it emits `intent-ambiguous` instead of guessing.

An optional semantic proposal can improve recall but cannot bypass lexical evidence, card identity, compatibility, or policy gates. A proposed card with no supporting compact-card evidence is recorded and rejected.

## Envelope derivation

Candidate families come from the accepted candidate cards. Required capabilities are the smallest capability set supported by both the request evidence and accepted candidates. If only card-level intent is clear, the compiler uses the least broad matched capability evidence rather than every capability supplied by that card.

Requested effects are inferred separately from permitted effects. Read, inspect, research, browse, create, edit, publish, deploy, send, purchase, spend, and account-mutation language provide effect evidence. The resulting envelope includes only effects explicitly permitted by host context.

When a requested effect is not permitted, the compiler records `effect-authority:<effect>` as an unresolved decision. Consequential concepts add specific decisions when corresponding authority is absent:

- publication and account mutation require `external-write`
- spending or purchase requires `spending-authority`
- security inspection requires `authorized-security-scope`
- production mutation requires `production-write`
- rights-sensitive media requires `rights-and-consent-when-applicable`

Card authority and precondition requirements are never copied into available host context. Missing requirements become unresolved decisions. This causes the existing router to return `needs-decision` before selection.

## Compiler receipt

The compiler receipt records:

- canonical request digest
- normalized-text digest, never substituted for the original text
- candidate scores and matched evidence categories
- accepted and rejected semantic proposal entries
- inferred requested effects
- host-supplied permitted effects and authority
- unresolved decisions
- compilation confidence
- the exact canonical request envelope
- proof limits

Receipts are deterministic for identical inputs and card artifacts. They are local evidence, not proof that a live model understood the mission correctly.

## Runtime behavior

`compileAndRoute` loads compact cards, compiles the request, shortlists at most 32 cards using the generated envelope, and invokes the existing router. If compilation has unresolved decisions, routing terminates as `needs-decision`. If intent cannot be understood or safely bounded, the runtime does not synthesize a nearest skill.

No selected `SKILL.md` body is read by the compiler or router transport.

## Evaluation arena

The first arena contains at least 120 unseen, commandless missions:

- positive missions distributed across all 19 routing cards
- paraphrases and contextual requests distinct from existing card fixtures
- mixed-domain missions that require at most three compatible skills
- ambiguous missions that must pause
- unsafe publication, spending, credential, production, rights, and security requests that must fail closed

Each case declares expected status, allowed primary ids, forbidden ids, and required unresolved-decision prefixes. Arena scoring separately reports selection accuracy, unsafe-selection count, over-composition, unresolved-decision recall, and deterministic repeatability.

The release gate is zero unsafe selections, zero authority invention, deterministic byte equality, at least 90 percent exact positive selection, and explicit accounting for every failure.

## Adapters

The generic adapter is the JSON input/output contract. Host-specific adapters should only translate host facts into context and optionally produce an untrusted semantic proposal. They must not edit compiler receipts, inject authority from user prose, or load all skill bodies.

Codex, Claude Code, and Luna integration profiles remain separate follow-up deployments. This release produces their shared portable boundary and example adapter documents but does not mutate global agent configuration.

## Verification

- every production function begins with a failing behavioral test
- focused compiler, policy, runtime, CLI, and arena tests pass
- the existing 315-test suite remains green
- build artifacts are deterministic across two runs
- an independent agent reviews authority invention, ambiguous routing, fixture leakage, and proof language
- local main integration receives a fresh full-suite verification before completion is claimed
