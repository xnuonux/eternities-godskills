# Requested effects: design comparison

Date: 2026-09-07. Status: recommendation only. No implementation, model calls,
receipt changes or consumer pin adoption authorized by this document.

## Decision

**First evaluate the existing semantic-proposal hook through legitimate,
source-bound host ingress for known-capability requests.** Keep unknown intent
explicit and clarify when necessary. Do not create a new Godskills protocol just
to duplicate this hook, and do not fabricate a skill to make the hook accept an
effect-only request. An independent effect-only extension is a later decision if
the pilot demonstrates that the existing coupling prevents required use cases.

## Inspected Godskills boundaries

- `src/intent-contracts.mjs:validateNaturalRequest` permits only version-1
  request ID, text, context and optional proposal. Extra root/context fields are
  rejected. Context contains permitted effects and available authority, not an
  independently declared requested-effect set.
- `validateSemanticProposal` requires nonempty known candidate IDs, nonempty
  known capabilities, requested effects and unresolved decisions. It validates
  catalog vocabulary and shape, not entailment or the proposal author's identity.
- `src/intent-compiler.mjs:compileIntent` intersects proposed IDs with meaningful
  lexical candidates. It unions proposed effects and unresolved decisions even
  when a proposed ID is rejected. The proposal cannot erase inferred effects or
  change caller-supplied authority. Request/text digests bind received content;
  they do not authenticate its origin or prove interpretation completeness.
- `src/router.mjs:routeCapabilities` returns needs-decision when unresolved
  decisions exist, before qualified selection. Unknown is not successful
  no-selection. Neither this design nor a proposal may coerce it into
  no-qualified-route to unlock native execution.
- `src/specialist-preference-contracts.mjs:splitPreferenceRequest` and
  `extendCompilerReceipt` show an explicit extension that preserves the validated
  base request and binds the extended request digest. `scripts/routing.mjs`
  verifies a pinned executable receipt before dispatch. Extensions therefore
  need deliberate compatibility and source-closure handling, not ad hoc fields.

The Godagents ingress audit, reported by the coordinating task at `b095772`,
finds that its exact-key vessel input and `godskillsInput`/`routeGodskill` forwarding
do not carry a proposal. Its source envelope also lacks a proposal digest.
That side's host authenticity and migration remain owned by the Godagents task.

## Three options, same trade-offs

| Option | Benefit and ordinary-language usability | Cost and failure mode |
| --- | --- | --- |
| A. Explicit typed requested effects at host ingress | Workflow/tool UI or the existing host agent supplies structured intent while the user keeps speaking normally. No additional inference inherently required. | A declaration can omit or misclassify effects. It needs source binding and an explicit completeness/unknown state. The current Godskills schema lacks an independent effect-only field. Never make users fill JSON or borrow a fake card. |
| B. Bounded interpretation producing the existing proposal | Reuses a real Godskills interface; the current host agent can emit a proposal in its normal workflow. No new mandatory model service. | Interpretation is fallible, and the current hook remains coupled to known capabilities and lexical admission. A new interpreter call would add cost and require separate authority. Valid schema/spans do not prove semantics. |
| C. Clarification or abstention | Preserves authority when consequential effects or task applicability cannot be established. Does not pretend unknown means read-only. | Excessive clarification harms usability. Use a specific unresolved question at the affected action boundary, not a blanket halt for all conversation or a disguised native fallback. |

## Smallest migration to evaluate

1. **Host provenance first.** Preserve original natural text. A legitimate host
   request supplies the optional validated proposal; bind it to that request's
   identity/text digest, observation/state and immutable authority context using
   the host's existing authoritative envelope mechanism. A self-asserted source
   label or digest alone is not authentication. Never patch proposals into old
   benchmark receipts after the fact.
2. **Reuse, narrowly.** For tasks with independently justified known capabilities,
   forward the source-bound proposal through the existing version-1 Godskills
   input. Keep lexical/proposal intersection, effect union, card restrictions and
   host execution checks. This can address omitted effect declarations without
   more text heuristics, but does not repair unrelated skill selection.
3. **Make uncertainty visible.** The host records whether effects were actually
   declared, proposed but unresolved, or merely legacy-inferred. No match or absent
   declaration is not proof of local-read-only. A valid known-capability proposal
   can carry an unresolved effect decision today. If no honest candidate exists,
   resolve/clarify at ingress instead of inserting a dummy card. Current proposal
   fields cannot express successful no-skill understanding independently.
4. **Gate behavior, not formatting.** In new local fixtures test changed text or
   observation after declaration, altered proposal, missing/unknown scope,
   unauthorized writes, effect-only/no-skill input, genuine chat-only work and
   ordinary-language known-capability requests. Repeat across default/specialist
   and recovery paths. No source binding may expand granted effects or authority.
   The earlier blind corpus is exhausted for tuning and qualification.

**Requested effects describe intended operations. Granted effects/authority
describe what this run is allowed to do.** They are not interchangeable. Keep the
initial migration additive: a proposal may add declared effects, not suppress
conservative checks. Resolve contradictions explicitly; proving when an inferred
effect can be removed is a separate obligation.

## Decision limits and next handoff

This is an ingress/provenance pilot design, not approval to activate it. The
strongest counterargument is that additive proposals retain lexical false
positives and cannot express uncovered tasks without a capability. Revisit an
independent versioned effect-declaration contract only if those limitations block
the pilot's explicit use cases. Do not silently broaden version-1 validation.

The Godagents owner must identify the exact trusted ingress source and envelope
binding, then both owners can settle the producer/consumer migration and tests.
Any changed executable or host closure needs newly versioned evidence and an
explicit coordinated pin transition; preserve historical receipts. Until then,
keep all candidate branches held and perform no model calls or implementation.
