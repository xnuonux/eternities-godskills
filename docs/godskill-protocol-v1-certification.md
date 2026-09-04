# provider-neutral Godskills protocol v1 certification

status: verified build candidate

this certificate records the deterministic data-only protocol boundary built
from canonical Godskills main `b010e8c8622ac8516510e6c9dc69bfab790ab335`.
the protocol is a transport and evidence contract for any compatible agent
host. it is not a host activation, model-routing change, package executor, or
authority grant.

## certified identity

- protocol id: `eternities-godskill-protocol-v1`
- schema version: `1`
- reference fixture: `godskill-protocol-v1-reference-chain`
- message count: `11`
- chain digest: `734afa4cb56b5899c9234c0971dd5875973c1a65b5bbc403a8690129e2af2dfa`
- receipt digest: `7675fcb3e49c450c50968dcdafd3e98f4788058bd4cf3599bbf73e9e00166da8`
- receipt file SHA-256: `3e89322e23515eaeb17344474deda6e0f7b786d6f056db5033d6bfef3cea65d5`

the reference chain is:

```text
MissionEnvelope
  -> CapabilityQuery
  -> SelectionDecision
  -> ActivationDecision
  -> AuthorityIntersection
  -> DisclosureEnvelope
  -> ArtifactObservation
  -> ReviewObservation
  -> AcceptanceVerdict
  -> EvidenceProposal
  -> LifecycleDecision
```

every message has a closed envelope, one owner, one mission identity, explicit
status, canonical parent identities, and a SHA-256 digest over its unsigned
canonical body. the verifier accepts a contiguous partial prefix as incomplete
evidence only.

## acceptance matrix

1. identity and closure

   all eleven message types have closed bodies and a fixed owner. unknown body
   keys, unknown message types, unsupported statuses, malformed ids, and digest
   drift fail closed.

2. bounded content

   mission, artifact, and evidence content is represented by bounded digests
   and metadata. raw mission content is rejected by the validator and is not
   present in the reference fixture.

3. authority and effects

   requested effects come from a finite provider-neutral vocabulary. an
   authority intersection may narrow effects only, must set
   `authorityExpanded` to `false`, and cannot authorize external mutation.

4. lineage and cross-message binding

   verification requires one topologically ordered path, exact parent types,
   one mission identity, package and activation agreement, disclosure binding,
   artifact and review binding, verdict agreement, evidence binding, and
   lifecycle eligibility. reorder, duplicate, wrong-parent, cross-mission,
   effect-widening, disclosure-drift, contradictory-review, and ineligible-
   promotion fixtures are rejected.

5. inertness

   the protocol verifier returns frozen data summaries only. it does not load
   package source, execute a skill, invoke a model or provider, change host
   routing, grant authority, or perform a host or external write.

## fresh verification

- focused protocol suite: 10 tests, 10 passed, 0 failed, 0 skipped
- full repository suite: 813 tests, 812 passed, 0 failed, 1 skipped, exit 0
- deterministic receipt builder: passed with the exact chain and receipt
  digests above
- package and capability-layer historical receipts: preserved byte-for-byte
  by the worktree diff

commands run:

```powershell
node --test tests\godskill-protocol.test.mjs
npm test -- --test-reporter=spec
node scripts\build-godskill-protocol-v1.mjs
```

## source coordinates

all hashes are SHA-256:

| path | hash |
| --- | --- |
| `src/godskill-protocol.mjs` | `12cf2b5b746dd470c093da9e497dbb41ad045637ac2fe1ea12fa7ee68c65c95b` |
| `scripts/build-godskill-protocol-v1.mjs` | `9460da660fa861b45e56f8f73ba8f530c9fd2d5582f0cd77dc936f9e7a3021d7` |
| `schemas/godskill-protocol-v1.schema.json` | `d52ea9637e86a15cecdec93d69780e74e31bf4aca949903fcec2feb5d03e429c` |
| `runtime/godskill-protocol-v1.md` | `d21f845b2558b2190cba893d02e68fbec374b30b748467ca708bd751af8daad8` |
| `tests/godskill-protocol.test.mjs` | `41110915a9fb16e964032ca74f42b0761cf2562b1278b2cc3209d30d3e7a124b` |
| `receipts/godskill-protocol-v1.json` | `3e89322e23515eaeb17344474deda6e0f7b786d6f056db5033d6bfef3cea65d5` |

the receipt binds the schema, runtime contract, canonical chain fixture, all
message digests, focused tests, and full-suite totals. no claim is made here
about model quality, real-world outcomes, external authorization, package
safety beyond the separate package verifier, or production compatibility.
