# provider-neutral adapter sdk v1 implementation plan

## goal

Add the smallest opt-in, provider-neutral adapter SDK and capability matrix on
top of the certified conformance core at `c0c8b691`. The SDK will let a host
adapter declare its bounded translation envelope, project a digest-only mission
through the existing conformance rules, and compare several host projections
without selecting a provider, loading a skill body, invoking a tool, granting
authority, or mutating an external system.

This is a capability-side contract for universal agents. It is not a live
Codex, Claude Code, Godagents, MCP, or local-model integration and it does not
replace the certified root SDK or the existing `SKILL.md` consumer boundary.

## constraints and acceptance gates

- start from pushed Godskills `main` at `c0c8b69196d7006450f88b079f3bbc0b92ca1ac6`.
- preserve the conformance, package, protocol, observatory, activation, and
  historical receipts byte-for-byte.
- keep the module opt-in and outside the default package export surface so the
  existing Godagents root contract does not drift silently.
- define one closed adapter descriptor with a bounded host translation envelope
  and a digest. The descriptor may carry only metadata and digest-only roots.
- require descriptor capability ceilings to contain the actual host profile;
  requested effects remain intersected by the existing conformance core.
- produce explicit matrix statuses: `equivalent`, `mixed`, or `unsupported`.
  Never invent a semantic decision when projections are unsupported or differ.
- bind every matrix entry to its adapter descriptor digest and projection. A
  changed objective, package, adapter declaration, host profile, or requested
  effect must change the derived matrix identity or fail closed.
- reject raw prompts, mission text, artifact and response bodies, credentials,
  private keys, free-form notes, unknown keys, duplicate adapters, unsorted
  arrays, authority-expanding effects, functions, and secret payloads.
- the SDK is data-only. It must not call a provider, load a skill body, execute
  package source, change model routing, alter host permissions, or perform an
  external write.
- the receipt must bind the fixture, schema, runtime contract, conformance and
  package roots, focused/full verification counts, and explicit proof limits.

## files and interfaces

1. `src/godskill-adapter-sdk.mjs`
   - export SDK constants, `buildAdapterDescriptor`,
     `projectAdapterMission`, `buildCapabilityMatrix`, and
     `verifyCapabilityMatrix`.
   - validate one closed descriptor, compute its digest, enforce its capability
     ceilings, and delegate the actual host projection to the certified
     conformance core.
   - build a deterministic matrix from one adapter per host family or adapter
     identity, bind entries to descriptor digests, and return frozen data only.

2. `tests/godskill-adapter-sdk.test.mjs`
   - begin with a failing import/contract test before production code.
   - cover deterministic descriptors, descriptor ceiling checks, digest-only
     mission projection, authority intersection, explicit unsupported hosts,
     equivalent and mixed matrix results, duplicate and ordering rejection,
     raw-content rejection, tamper detection, deep immutability, and objective
     identity binding.

3. `schemas/godskill-adapter-sdk-v1.schema.json`
   - define closed draft-2020-12 schemas for descriptors, matrix entries,
     projections, and the matrix result with explicit status and null decision
     rules.

4. `runtime/godskill-adapter-sdk-v1.md`
   - document the opt-in adapter contract, matrix lifecycle, authority and
     privacy boundaries, recovery expectations, and proof limits.

5. `scripts/build-godskill-adapter-sdk-v1.mjs`
   - construct a fixed five-family provider-neutral fixture, verify it against
     the certified conformance and package roots, and emit deterministic
     reference bytes and a receipt without overwriting changed evidence.

6. `artifacts/godskill-adapter-sdk-v1/reference.json`
   - store the canonical five-adapter matrix fixture as inert data.

7. `receipts/godskill-adapter-sdk-v1.json`
   - bind the protocol and package roots, matrix fixture, schema, runtime,
     focused/full verification counts, and proof limits.

8. `docs/godskill-adapter-sdk-v1-certification.md`
   - record exact source coordinates, matrix result, reproducibility, and
     non-claims.

9. `README.md`
   - add a short status section explaining that the SDK is an opt-in,
     provider-neutral capability-side contract and is not live host adoption.

the certified `package.json` is intentionally unchanged. an initial convenience
script was removed after the historical receipt gate proved that even a
non-runtime script edit changes a certified package byte. the builder remains
directly invokable and the default package surface stays exact.

## implementation sequence

1. Confirm this worktree is clean and rooted at the pushed adapter conformance
   head; record the immutable base in the certification.
2. Add and self-review this plan.
3. Add the focused SDK contract test and run it red because the module does not
   yet exist.
4. Implement descriptor validation, canonical digesting, and frozen output.
5. Implement adapter mission projection by delegating to the existing
   conformance core and extend tests for ceiling, unsupported, and privacy
   behavior.
6. Implement equivalent/mixed/unsupported matrix construction and verification
   with strict entry binding and tamper tests.
7. Add the schema, runtime contract, deterministic builder, fixture, receipt,
   certification, and README status. keep `package.json` byte-for-byte stable.
8. Run focused tests, syntax and JSON checks, the SDK builder twice, the
   existing conformance/package/protocol gates, and a fresh full repository
   suite. Keep outputs bounded and save only required evidence.
9. Review the diff inline for authority widening, raw-content leakage, provider
   coupling, digest circularity, accidental root export changes, and historical
   artifact drift.
10. If every gate is green, commit the isolated branch, fast-forward canonical
    Godskills `main`, push it, rerun canonical verification, and send the exact
    new head and receipt to the existing Godagents task before any cross-head
    rebind.

## completion evidence

Completion requires deterministic five-family adapter descriptors and matrix,
explicit unsupported and mixed behavior, no raw or secret payload path,
repeatable fixture and receipt bytes, focused tests with zero failures, a fresh
full-suite pass, clean pushed main, and a certification that limits the claim to
local declarative adapter and matrix conformance. It does not prove live host
adoption, model quality, provider equivalence, tool isolation, or production
security.
