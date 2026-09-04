# provider-neutral observatory v1 implementation plan

## goal

Add the first phase-5 observability boundary on top of the frozen
provider-neutral Godskills protocol. The observatory will replay exact protocol
inputs, compare bounded counterfactual observations, report repeated failure
clusters, attribute disclosure costs, and expose a digest-only read model. It
will remain inert data processing: no model call, routing change, skill-body
load, host activation, external write, or automatic promotion.

## constraints and acceptance gates

- start from the current pushed Godskills main `921c144`.
- preserve the package and protocol receipts, schemas, source bytes, and
  historical tests byte-for-byte.
- import only the existing protocol verifier and canonical hashing utilities.
- reject raw mission text, prompts, artifact bodies, credentials, and arbitrary
  free-form notes rather than silently storing or redacting them.
- key every record by exact protocol chain, mission, capability, variant, and
  layer digests where the source supplies them.
- replay must compare an externally supplied expected chain digest and reject
  stale or changed inputs before producing a derived result.
- counterfactuals must hold the mission identity constant and must not be used
  as a promotion decision.
- raw-success candidates are always untrusted, `promotionEligible: false`, and
  cannot enter the protocol or evidence trust roots automatically.
- failure clustering and cost accounting expose bounded identities and metrics,
  never raw content.
- retention is digest-only and append-only. a requested content redaction of a
  record that was never allowed to contain content is a rejected disposition,
  not an invented success.
- the receipt binds all generated source/schema/runtime/fixture bytes and exact
  focused/full-suite counts.

## files and interfaces

1. `src/godskill-observatory.mjs`
   - export immutable record validators and deterministic functions:
     `replayProtocolObservation`, `buildCounterfactualView`,
     `extractRawSuccessCandidate`, `buildFailureClusterReport`,
     `recordDisclosureCost`, `buildObservatorySnapshot`, and
     `verifyObservatorySnapshot`.

2. `tests/godskill-observatory.test.mjs`
   - begin with a failing import test before production code.
   - cover exact replay, stale-input rejection, counterfactual identity
     constraints, candidate non-promotion, deterministic failure clusters,
     bounded cost metrics, snapshot closure, raw-content rejection, and
     digest-preserving retention.

3. `schemas/godskill-observatory-v1.schema.json`
   - define closed draft-2020-12 schemas for replay, comparison, candidate,
     failure cluster, cost entry, snapshot, and retention decision records.

4. `runtime/godskill-observatory-v1.md`
   - document replay-before-derivation, record types, privacy defaults,
     retention, failure behavior, rollback, and proof limits.

5. `scripts/build-godskill-observatory-v1.mjs`
   - construct one fixed provider-neutral reference chain and bounded
     observatory records, verify them, and emit an exact receipt without
     overwriting changed evidence.

6. `receipts/godskill-observatory-v1.json`
   - bind protocol root, record digests, schema/runtime/fixture bytes, and
     focused/full-suite verification counts.

7. `docs/godskill-observatory-v1-certification.md`
   - record the acceptance matrix, exact hashes, and proof limits.

8. `README.md`
   - add a concise phase-5 observability section that states the boundary is
     inactive and cannot promote learned candidates.

## implementation sequence

1. Confirm `origin/main` is still `921c144` and the new worktree is clean.
2. Add and self-review this plan.
3. Add the focused observatory test and run it red because the module does not
   yet exist.
4. Implement closed, digest-bound record constructors and validators.
5. Implement deterministic replay and stale-input rejection.
6. Implement counterfactual, candidate, failure-cluster, and cost views with
   bounded metrics and no raw-content path.
7. Implement the digest-only snapshot and retention decision verifier.
8. Add schema, runtime contract, deterministic fixture builder, and receipt.
9. Run focused tests, syntax and JSON checks, the builder, and a fresh full
   repository suite. Review for execution, authority, privacy, stale reuse,
   and automatic-promotion gaps.
10. If every gate is green, commit, fast-forward canonical main, push, and
    send the exact new head to Godagents for its final cross-repository bind.

## completion evidence

Completion requires a deterministic observatory fixture, focused and full
tests with zero failures, exact receipt rebuild, clean pushed main, a
certification that states the observatory is read-only and inactive, and no
changes to the earlier package or protocol trust roots.
