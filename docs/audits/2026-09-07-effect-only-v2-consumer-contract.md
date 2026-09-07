# Effect-only v2: minimal consumer contract proposal

Status: exact design draft for cross-repository review, not implemented or
negotiated. Date: 2026-09-07. No inference, pin adoption or receipt migration.

## Purpose and boundary

A legitimate structured host must be able to describe an understood local task
that needs no skill, without inventing a card or equating no skill with unknown
intent. Preserve the existing v1 route unchanged. The current semantic proposal's
nonempty candidate/capability requirements cannot meet this case; another
known-capability pilot would not resolve that demonstrated limitation.

This slice separates effect knowledge, permission and the explicit choice of an
effect-only workflow. **Known effects alone never imply that no skill is needed.**
The host's original versioned mission must explicitly select effect-only mode,
and its separately pinned producer descriptor must allow that mode. This is not
a rewrite of a failed v1 compiler result.

## Proposed closed wire shapes

Identifiers below are proposed, not currently registered.

The v2 natural request has exactly: `schemaVersion: 2`, `requestId`, `text`,
`context`, `routeMode: "effect-only"`, and `effectAssessment`.
`context` keeps the existing v1 fields and meanings, with no authority additions.
`proposal` and preference overrides are not accepted in this first v2 slice.

`effectAssessment` has exactly these six fields:

| Field | Validation and meaning |
| --- | --- |
| `protocolId` | Exact `eternities-requested-effects-v1` |
| `subjectDigest` | Lowercase SHA-256 of the canonical original host mission with only its `effectAssessment` property omitted |
| `state` | `known`, `unknown`, or `conflicting` |
| `requestedEffects` | Unique, lexically sorted existing effect enum values; `none` cannot coexist with another effect |
| `unresolvedDecisions` | Unique, sorted, nonempty reason strings when unknown/conflicting; empty when known |
| `producerDescriptorDigest` | Lowercase SHA-256 checked against trusted host policy, never trusted merely because present |

Known requires a nonempty effect set. Unknown/conflicting may retain a partial
set or an empty set; empty never means `none` or local-read-only. Known describes
complete effect knowledge within the bounded structured producer's operation,
not proof of arbitrary natural-language understanding. Permission denial does
not change known into conflicting: knowledge and authorization are separate axes.

The original host mission subject includes its version, effect-only mode,
objective, observation, source epoch, task identity, authority ceiling, requested
authority, budgets and every other accepted original field. It is not a selected
subset that can omit material state. The Godagents owner specifies the exact
canonical serializer and golden digest vectors for this host shape.

## Producer binding and acyclic digest chain

1. The trusted structured workflow adapter derives assessment from its actual
   configured operation, not prose heuristics, benchmark answers or model labels.
   Only a producer descriptor separately allowed by trusted host policy may mint
   this first-slice declaration. Free-form input beyond that bounded operation
   remains a proposal or unknown; an `origin=host` label does not promote it.
2. Let **S** hash the original mission subject without assessment. Assessment
   references S. Let **A** hash the complete canonical assessment. The completed
   mission contains the assessment but does not contain its own digest or its
   preparation manifest's digest.
3. Trusted preparation hashes the completed mission and policy/provider inputs
   into the existing manifest. The caller holds expected manifest digest **H**
   outside the potentially replaceable prepared files. Run verifies H, exact
   mission/policy/provider hashes, S, the pinned producer descriptor and the
   unchanged host authority/budget checks before forwarding any request.
4. The host adapter constructs the exact Godskills v2 projection. Its canonical
   hash **R** includes the full assessment, mode, text and context. This remains
   `compilerReceipt.requestDigest`; `textDigest` hashes unchanged request text.
   The host source envelope additionally binds A, S, protocol and producer digest
   before dispatch, and compares returned R against this expected projection.
5. On recovery, verify the same preparation/source identity and A/S/R before
   accepting persisted results. Changed declarations or unsupported protocols
   invalidate recovery; do not reconstruct or overwrite old receipts to match.

This has no hash cycle: S excludes assessment; assessment references S; the outer
mission/manifest binds assessment; R binds the projected request. Neither S nor
assessment contains R or H. Caller-held H and pinned policy establish the local
producer boundary. A self-contained hash inside attacker-controlled JSON does
not. No PKI service is needed for this first local trusted-host slice.

Godskills checks contract/digest consistency, not origin authentication in
isolation: it cannot reconstruct the full host mission from the text projection.
The legitimate host verifies S and the producer against its captured original
request before dispatch and again at receipt consumption. A standalone compiler
receipt is never sufficient to grant native execution.

## Consumer decision table

| Input condition | Result |
| --- | --- |
| Malformed shape/protocol or failed host source/producer binding | Reject before inference; never produce a usable native-admission receipt |
| Unknown or conflicting assessment | `needs-decision`, preserving partial effects and nonempty reasons; no native inference |
| Known, but requested effect exceeds immutable permitted effects or available authority | `needs-decision`; preserve the disallowed effect and name the missing permission, never intersect it away |
| Known external effects in this local-only first slice | `needs-decision` with unsupported effect-only scope, even if some external authority exists |
| Known local effects, valid binding/descriptor, explicit effect-only mode and all host gates satisfied | Receipt-backed `no-qualified-route` with reason `effect-only-no-skill-requested`; empty skill selection |

For each non-`none` declared effect require both matching permitted effect and
matching available authority; no absent-card shortcut removes this check.
The first slice supports `none`, local-read and local-write, not external native
operation. Target/output-root restrictions remain enforced by the existing host
artifact operation and policy. No routing outcome itself executes a write.

The known success path is a distinct typed request path. It does not run lexical
classification and convert `intent-not-understood` to success. Unknown effects do
not receive a default local-read set. Known-but-no-skill produces no fake family,
candidate, capability or skill package. Godagents' existing receipt-backed native
vessel path may consume it only after the new source/version checks pass.

## Receipt and route integration

Use a version-2 compiler receipt with the existing field meanings, these changes:

- `mode` is `effect-only`; candidate scores and accepted/rejected proposal IDs
  are empty; requested effects echo the assessment, including partial/empty sets.
- Add `assessmentBinding` with exactly `protocolId`, `subjectDigest`, `state`,
  `assessmentDigest` (A) and `producerDescriptorDigest`. It records binding, not a
  self-authenticating claim of host approval.
- The v2 envelope retains the existing context/outcome/decision fields and adds
  `routeMode`, `requestedEffects` and `assessmentBinding`. Candidate families and
  required capabilities are empty **only for this effect-only v2 shape**.
- Compiler confidence remains low as semantic evidence is not model-qualified;
  state=known is not repurposed as measured semantic confidence. Eligibility is
  governed by the typed contract and source boundary, not a confidence shortcut.

The v2 route receipt retains existing selection/status fields and adds the
`reasonCode` and `assessmentBinding` fields. `reasonCode` is exactly
`effect-only-no-skill-requested` for the known accepted no-skill outcome, or
`effect-only-needs-decision` for unresolved/policy-blocked input. Candidate/selected IDs and
entrypoints are empty, selection kind is none and selection confidence is null.
Its `requestDigest` continues to hash the **envelope**, not R: preserve that
existing distinction and bind both through the compiler result. Request features
include declared effects and binding so the route digest cannot omit them.
Its `decisionPolicy` is exactly `effect-only-v2`; do not pretend the v1
coverage-ranking policy made this decision.

The Godagents binder/cycle record binds the source envelope, raw v2 request and
returned compiler/route receipt digests. It independently compares effects,
assessment state/A/S/producer and request/envelope digests before native admission.
It must not accept a no-qualified-route status string alone. Recovery reuses the
verified result without new classification, activation or inference, as in the
existing native path; mutations fail rather than silently dispatching again.

## Compatibility, implementation boundary and acceptance

Implement only after shared contract review, starting from reconciled canonical
main, not by merging the held heuristic branches. Prefer separate v2 consumer
module/entrypoint and receipt builder so frozen v1 executable/source bytes remain
verifiable. Reuse unchanged canonical hashing/context validation and native
runtime machinery where valid. Do not weaken v1 nonempty-capability validation.

Host policy explicitly negotiates the supported v2 protocol/producer descriptor
and newly verified executable root. Unknown versions fail. Old hosts and v1
requests remain on their old paths, without silent translation or fallback.
Pin transition is a later coordinated release step, never part of this draft.

Required fresh tests: legitimate no-skill local artifact success; the same task
without write permission; known/unknown/conflicting independently of permissions;
external-effect refusal; forged descriptor/source identity; altered observation,
mode, assessment or recovery state; unsupported versions; unchanged v1 receipts;
one native inference on successful dispatch and none on unresolved requests or
recovery. Evaluate natural-language usability separately, with new frozen cases
and all interpretation cost visible. The exhausted blind corpus is not fresh
qualification. Users keep normal language; the structured host/workflow supplies
the contract. No mandatory new model call or constant clarification substitute.

Open shared-review point: Godagents must fix the canonical subject projection and
producer descriptor's permitted structured operation/mode. Godskills must confirm
the exact v2 envelope/route digest vectors with that projection before coding.
These are concrete coordination requirements, not permission to invent identity,
authority or a second agent framework.
