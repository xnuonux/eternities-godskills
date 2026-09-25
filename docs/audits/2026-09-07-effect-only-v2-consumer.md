# Effect-only v2 pure consumer

Date: 2026-09-07. Implementation candidate: `dd6c39487886af9678fd500099932686ca5cf817`.
Base: `2ccdacf8ae04aceaff417de7c27fb3885b0bb7b7`.
Branch: `feat/effect-only-v2`. Pure consumer independently reviewed; not merged or live-adopted.

## What this establishes

An explicitly selected structured local workflow can declare its actual effects
and obtain a request-bound no-skill result without a fictional capability or
lexical fallback. The pure consumer preserves those effects when permission is
denied and distinguishes unknown/conflicting effects from known-but-forbidden
effects. Nothing here selects a model, invokes inference or executes a file write.

This does **not** repair the held natural-language heuristic branches or establish
arbitrary semantic understanding. The exhausted blind study was not read or
replayed. No behavioral superiority or production qualification is claimed.

## Interfaces and trust boundary

`src/effect-intent-v2.mjs` exports:

```js
compileAndRouteEffectOnlyV2({request, expectedSource})
// => {compilerReceipt, routeReceipt}

verifyEffectOnlyV2Result({request, expectedSource, result})
// => the same result object, or throws
```

`request` has exactly schemaVersion=2, requestId, text, context,
routeMode=effect-only, and effectAssessment. The eight context fields retain v1
meanings and validation. There is no proposal or specialist preference override.

The assessment has exactly protocolId=eternities-requested-effects-v1,
subjectDigest, state, requestedEffects, unresolvedDecisions and
producerDescriptorDigest. Known requires a nonempty effect set and empty reasons;
unknown/conflicting requires nonempty reasons and preserves partial or empty
effects. Sets are sorted and unique; none cannot coexist with another effect.

`expectedSource` has exactly subjectDigest, producerDescriptorDigest and
requestDigest. The caller must supply these from independently verified ingress.
The original complete Godagents mission, minus only effectAssessment, defines S.
Godskills cannot reconstruct S from the text projection. It checks consistency
against caller-supplied S, producer and R; the host must authenticate preparation
and policy, verify the original mission, and enforce artifact target restrictions.
Copying three hashes out of untrusted JSON would defeat that host boundary.

The verifier rebuilds the pure expected pair and compares every field and value.
Extra, missing or altered fields fail, as do non-JSON state, serialization hooks,
undefined fields, nonfinite numbers, sparse arrays and custom prototypes. Object
key ordering does not affect equivalence; array order does. Returned compiler,
envelope, route and input data are independent snapshots.

## Decisions

Every non-none effect must occur unchanged in both permittedEffects and
availableAuthority. `realm:write` is not an alias for `local-write`. There is no
intersection that hides a denied requested effect.

| Condition | Status / reasons |
| --- | --- |
| Closed shape or source mismatch | Throw, no receipt |
| Unknown/conflicting | needs-decision; effect-intent-unknown/conflicting plus producer reasons |
| Missing permitted effect | needs-decision; effect-not-permitted:EFFECT |
| Missing same-named authority | needs-decision; authority-missing:EFFECT |
| External effect, even authorized | needs-decision; unsupported-effect-only-scope:EFFECT |
| Known permitted none/local effects | no-qualified-route; effect-only-no-skill-requested |

All unresolved reasons are retained, sorted and deduplicated. The blocked route
reasonCode is effect-only-needs-decision. Candidate/selected IDs and entrypoints
are empty; selectionKind is none and selectionConfidence is null. Compiler
confidence stays low because typed producer eligibility is not a measured claim
of semantic confidence. The route decisionPolicy is effect-only-v2, not v1 ranking.

## Independent input and output vectors

Input: `data/effect-only-golden-vector-v2.json`, supplied by the Godagents owner
from its independent node:crypto ordered-JSON generator. It is synthetic public
development data, not a study or user mission.

- S: `f82be214b317cd90a4b4ea060f0d5b7322fd2088878e8e9af9eb5b58a4616655`
- Producer: `bd00071f046bd5f8612a65cfe674d417b8b21c3fb25bad41634bb734b08bfc26`
- A: `2d996007d2fd5692e3760aede8b28f6a018723785bdc7148282bd75d64a2918d`
- R: `a8e6adad64894409b3b5aee6a57f37abc7333b990b05cc4f04dc487a7c20a11a`

Consumer output: `data/effect-only-result-v2.json`.

- Envelope digest: `314a64cdf75866bb1bce22c4dd11cd727d14b2e4e751a14c93e23e5c8ceb2349`
- Output file SHA-256: `1ee21038641043ac5e6f796490179021d83ff5c53216957c7113572357467f65`
- Module SHA-256: `d0364093f47b5b7f874134c5a24c51c53e5db4c1d53bd7455fe5caaa0fd90cdc`

R hashes the entire projected request and is compilerReceipt.requestDigest.
routeReceipt.requestDigest hashes the full envelope, not R. Assessment binding
contains protocol/S/state/A/producer in the compiler, envelope, route and route
features. No request or assessment contains its own digest.

## Verification record

- Initial v2 tests failed with the expected missing implementation module.
- An additional non-JSON array-prototype rejection test failed before its narrow
  validation fix and passed afterward.
- The initial implementation had 65 v2 tests passing. Together with v1 contracts
  and five relevant legacy certification/receipt suites: 95 tests passed, zero
  failures/skips/TODOs. A post-review exact full-vector test additionally pins
  the independently checked wire pair against future drift.
- First full run exposed three setup failures: tests directly open the pinned
  local node_modules/acorn file. Installing the locked dependency using
  `npm ci --ignore-scripts --no-audit --no-fund` corrected the fresh worktree;
  six targeted compatibility/shadow tests then passed. No lockfile change.
- Final wider run after the checked-vector assertion: 909 tests, 907 pass,
  1 fail, 1 existing skip, 0 TODOs. Final targeted run: 96 tests pass, zero
  failures/skips/TODOs; 66 are v2 consumer cases.
  Failure: `tests/codex-routing-policy.test.mjs` expects the literal phrase
  `raw model capability as the floor` in the user-global AGENTS.md. The exact
  same test was independently rerun on unchanged canonical main and failed.
  No global instruction or unrelated legacy test was edited to hide it.
- Existing tracked v1 source and receipt bytes are unchanged. The branch adds
  new files only; no receipt regeneration, host pin adoption or main merge.

## Independent review and interoperability

The Godagents owner (`01a04a0c-ae62-7c83-8f77-9d7b1614f390`) read the entire
consumer and effect vocabulary, reran all 65 then-current tests, and reported no
material defect in the pure consistency scope. It independently connected actual
`prepareLocalArtifactEffectRequest` output to this consumer: success yielded the
exact envelope digest above; missing local-write authority yielded needs-decision;
a forged success receipt failed verification. No provider calls were made. The
same owner independently tested its projection against R/S/producer pins.

The full output is now a checked vector, not a newly invented expected digest.
This review does not claim producer authentication in isolation, live dispatch,
recovery correctness or semantic/generalization superiority.

## Remaining release gates

The shared global-instruction wording test is a known-red integration gate, not
a passing full suite. Preserve this feature branch until that separate policy
test reconciliation is resolved; do not silently weaken the gate or mutate user
instructions. Next functional work is host binder/dispatch/recovery tests.
Any executable trust-root and host policy adoption need a separate coordinated
release. Successful pure compilation alone is never native admission. No
automatic inference, hidden permission expansion or v1-to-v2 fallback is allowed.
