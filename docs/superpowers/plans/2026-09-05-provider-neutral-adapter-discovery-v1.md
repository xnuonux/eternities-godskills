# provider-neutral adapter discovery v1 implementation plan

## goal

Add a deterministic, opt-in resolver over the certified adapter SDK matrix.
Given a verified matrix and a digest-free host metadata profile, the resolver
will select an exact already-certified adapter entry or fail closed. It will
not infer compatibility from a host family label, choose a model, grant an
effect, activate a skill, call a provider, or mutate an external system.

This closes the safe discovery boundary needed by universal agents while
keeping live host adoption separate. A changed host version, model profile,
context ceiling, review state, protocol support, effect set, or secret-isolation
state requires a newly certified descriptor and matrix rather than silent reuse.

## constraints and acceptance gates

- start from pushed Godskills `main` at
  `de63a7f76aca2fad9942960363978c98dc1ac89f`.
- preserve all existing source, package, protocol, observatory, adapter,
  activation, and historical receipt bytes byte-for-byte.
- accept only a verified SDK matrix and a closed digest-free host metadata
  profile. reject prompts, mission text, artifacts, responses, credentials,
  private keys, free-form notes, unknown keys, functions, and non-plain data.
- require exact canonical host-profile equality with one matrix entry. host
  family alone is never enough to select an adapter.
- verify the matrix before discovery and bind the result to its matrix digest,
  descriptor digest, entry digest, projection digest, and host family.
- select only a conformant matrix projection. an exact match to an unsupported
  entry produces an explicit `unsupported` result with no adapter identity.
- selection is informational and inert. it cannot grant effects, load a skill,
  change routing, select a model, invoke a host, call a provider, or perform an
  external write.
- the receipt binds the discovery fixture, SDK and matrix roots, schema,
  runtime contract, focused/full verification counts, and proof limits.

## files and interfaces

1. `src/godskill-adapter-discovery.mjs`
   - export `GODSKILL_ADAPTER_DISCOVERY_ID`, `discoverAdapter`, and
     `verifyAdapterDiscovery`.
   - validate a closed host profile, verify the supplied capability matrix,
     perform exact profile matching, and return frozen data only.

2. `tests/godskill-adapter-discovery.test.mjs`
   - begin with a failing import/contract test before production code.
   - cover exact selection, matrix-root binding, profile drift refusal,
     unsupported-entry refusal, raw-content and executable-value rejection,
     tamper detection, canonical output, and deep immutability.

3. `schemas/godskill-adapter-discovery-v1.schema.json`
   - define the closed selected and unsupported result shape with explicit null
     identity fields and digest formats.

4. `runtime/godskill-adapter-discovery-v1.md`
   - document exact-match discovery, fail-closed drift behavior, privacy,
     authority, recovery, and proof limits.

5. `scripts/build-godskill-adapter-discovery-v1.mjs`
   - load the certified adapter SDK fixture, discover the exact Codex fixture
     host, verify the result, and emit deterministic reference and receipt
     bytes without overwriting changed evidence.

6. `artifacts/godskill-adapter-discovery-v1/reference.json`
   - store the canonical selected discovery result as inert data.

7. `receipts/godskill-adapter-discovery-v1.json`
   - bind the SDK and matrix roots, discovery result, schema, runtime, and
     focused/full verification counts.

8. `docs/godskill-adapter-discovery-v1-certification.md`
   - record exact hashes, acceptance results, and proof limits.

9. `README.md`
   - add a concise discovery status section without implying live host
     adoption or automatic routing.

## implementation sequence

1. Confirm the isolated worktree is clean and rooted at the pushed SDK head.
2. Add and self-review this plan.
3. Add the focused discovery test and run it red because the module does not
   yet exist.
4. Implement closed host-profile validation and exact matrix verification.
5. Implement selected and unsupported outcomes with digest-bound identity and
   immutable results; extend drift and tamper tests.
6. Add schema, runtime contract, deterministic builder, fixture, receipt,
   certification, and README status. keep the certified package manifest and
   all historical artifacts unchanged.
7. Run focused tests, syntax and JSON checks, the builder twice, the existing
   SDK and conformance gates, and a fresh full repository suite.
8. Review the diff for host-family-only selection, authority widening, raw or
   secret leakage, digest circularity, accidental default activation, and
   historical artifact drift.
9. If every gate is green, commit, fast-forward canonical Godskills `main`,
   push it, rerun pushed-head verification, and notify the existing Godagents
   task before its next cross-head rebind.

## completion evidence

Completion requires exact certified-host selection, explicit unsupported drift,
matrix and result digest binding, no raw or secret payload path, repeatable
fixture and receipt bytes, focused tests with zero failures, a fresh full-suite
pass, clean pushed main, and a certification limited to local declarative
discovery. It does not prove live host adoption, model quality, provider
equivalence, routing correctness, tool security, or production readiness.
