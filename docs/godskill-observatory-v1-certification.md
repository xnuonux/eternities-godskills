# provider-neutral Godskills observatory v1 certification

status: verified-build foundation

this certificate records the phase-5 observability foundation built from
Godskills main `921c144dcd77f9e59dbdffd8204e08b27713c83e`. it is a bounded,
provider-neutral read model over the frozen protocol. it is not a host
activation, model-routing change, trust-root replacement, or automatic skill
promotion.

## exact coordinates

- observatory id: `eternities-godskill-observatory-v1`
- schema version: `1`
- protocol root receipt digest: `7675fcb3e49c450c50968dcdafd3e98f4788058bd4cf3599bbf73e9e00166da8`
- protocol chain digest: `734afa4cb56b5899c9234c0971dd5875973c1a65b5bbc403a8690129e2af2dfa`
- observatory snapshot digest: `ef89ce8bbe86987bf98e66d01e448589c6227f4e6c6327ff3a51ceb5431bc782`
- fixture digest: `06d4df7bf4359ca304ce9d4130724cfb6609c377d42c59abf303eecfd99b0604`
- receipt digest: `491dd93836e211daad56ae5494e90ba991d6b05087c23036a4a372dd4c1bccc9`
- record count: `5`

the source protocol chain contains eleven closed messages from
`MissionEnvelope` through `LifecycleDecision`. the observatory fixture adds
one replay observation, one counterfactual view, one raw-success candidate,
one failure-cluster report, one disclosure-cost entry, and one digest-only
snapshot.

## acceptance matrix

1. exact replay

   the replay function verifies the supplied protocol chain and compares its
   derived chain digest to an externally supplied expected digest. a changed
   or stale chain is rejected before any derived observation is produced.

2. counterfactual integrity

   baseline and candidate observations share exact mission, task, capability,
   model-profile, and environment identity. score and regression deltas are
   derived from bounded sides, and the view is always marked
   `promotionEligible: false`.

3. safe learning

   a raw success can become only an `untrusted-candidate` record with
   `trusted: false` and `promotionEligible: false`. no candidate extractor
   writes a skill, evidence row, profile, activation decision, or policy.

4. failure and economics views

   repeated failures are grouped by digest scope, bounded failure code, and
   variant. disclosed layer bytes are bound to the exact protocol disclosure;
   tokens, latency, and monetary cost are bounded host metrics and may be
   unavailable as explicit `null` values.

5. privacy and retention

   all records use closed objects and digest-only retention. raw prompts,
   mission text, artifact bodies, response bodies, credentials, private keys,
   and free-form notes are rejected, including unknown top-level input fields.
   snapshot verification requires the exact source-record digest and type
   pairing, fixed append-only retention, and the expected protocol root.

6. inertness and rollback

   the observatory imports only protocol verification and hashing utilities. it
   does not load package source, call a model or provider, execute a skill,
   grant authority, or perform a host or external write. disabling it leaves
   the protocol, package verifier, and activation v1 path as the rollback
   boundary.

## fresh verification

- focused observatory suite: 9 tests, 9 passed, 0 failed, 0 skipped
- full repository suite: 822 tests, 821 passed, 0 failed, 1 skipped, exit 0
- deterministic builder: passed and reproduced the receipt coordinates above
- `git diff --check`: passed
- source and generated outputs: all hashes below match the checked worktree
- historical protocol and package trust roots: unchanged by the observatory

commands run:

```powershell
node --test tests\godskill-observatory.test.mjs
npm test -- --test-reporter=spec
node scripts\build-godskill-observatory-v1.mjs
```

## source coordinates

all hashes are SHA-256:

| path | hash |
| --- | --- |
| `src/godskill-observatory.mjs` | `b3ab857945ba51712e352eecc3e4b36303fa5547dab1f18e82bc783e79747df2` |
| `scripts/build-godskill-observatory-v1.mjs` | `8d324e014bcb5392605bd6191cb255801ff9b0eed42f07618ec6ed35194c8787` |
| `schemas/godskill-observatory-v1.schema.json` | `78f84c982581f84f4862e9ce71713a8288a02119a1e82d78d50d02763506338d` |
| `runtime/godskill-observatory-v1.md` | `0340fcc5897a0969f07eb550cbee3f73620f1f225688ae68443e83c2ce7ba521` |
| `artifacts/godskill-observatory-v1/reference.json` | `06d4df7bf4359ca304ce9d4130724cfb6609c377d42c59abf303eecfd99b0604` |
| `receipts/godskill-observatory-v1.json` | `cf461f5b54fd5f2594e80677e584ba0b3e75fd230c0d11590a83ab0a04f4e7c0` |
| `tests/godskill-observatory.test.mjs` | `a252868661e8ee6f6cb1f002504d630c08443a99e1f6f7de09e0ecd3b4b57299` |

the receipt binds the protocol root, complete protocol chain, five source
records, snapshot, fixture bytes, schema bytes, runtime bytes, and exact
focused/full-suite counts. this evidence proves deterministic observatory
mechanics and replayable local correlations only. it does not prove model
quality, causation, universal superiority, field behavior, provider
equivalence, production retention compliance, or external authorization.
