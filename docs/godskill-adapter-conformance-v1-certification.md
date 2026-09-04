# provider-neutral Godskills adapter conformance v1 certification

status: verified-build foundation

this certificate records the first phase-6 adapter conformance harness built
from Godskills main `1534824c12fd2bbce410264aa7cd92f8f9559036`. it is a closed,
provider-neutral fixture for host translation. it is not a Codex, Claude Code,
Godagents, local-model, or MCP integration, model-routing change, trust-root
replacement, or production adoption.

## exact coordinates

- conformance id: `eternities-godskill-adapter-conformance-v1`
- schema version: `1`
- protocol root receipt digest: `7675fcb3e49c450c50968dcdafd3e98f4788058bd4cf3599bbf73e9e00166da8`
- package root digest: `8510b02237963364d4246bd55676ff8674ad83d4d56f68381d6c3bc252e812dd`
- package receipt file SHA-256: `7f451369c2a0f66ba1fdb76da3718208c75a1b13466e480b7d5b4beb4fe66cc1`
- fixture digest: `d7ca0f7ebeb1f001e596b3a71280ba83b68d77b3cb59ce7bb9ea1ab0812f58ac`
- normalized decision digest: `a342483e430ef126eddf5fa5a421d49c12991af10e685c92c6b11255f1f6a472`
- receipt digest: `0a39959b9ae1e706531387c3ad77c698ef0c56a7c9889a384fdfa0b1d3536af0`
- host families: `claude-code`, `codex`, `godagents`, `local-model`, `mcp`

the fixture holds one bounded mission reference, one exact package and
protocol root, five host metadata projections, and one normalized semantic
decision. host versions, model labels, context ceilings, reasoning tiers, and
review availability may differ without changing the semantic decision.

## acceptance matrix

1. equivalent host translation

   all five declared host families support the frozen package protocol and
   protocol version in the fixture. each produces the same digest-bound
   `guardrail` / `guardrails` decision after host-specific metadata is removed.

2. least authority

   granted effects are the intersection of requested effects and host
   availability. a host cannot add an effect, capability, package, disclosure
   mode, or authority. narrowing is explicit in the reason codes.

3. explicit unsupported behavior

   missing package support, an unsupported protocol version, or absent secret
   isolation produces `unsupported` with no decision and the exact reason
   code. the harness does not invent native fallback behavior.

4. closed and immutable evidence

   host, mission, projection, decision, and fixture objects are closed and
   recursively frozen. canonical host ordering, projection ordering, digest
   binding, duplicate detection, tamper detection, and unknown verifier
   options are tested.

5. privacy and inertness

   prompts, mission text, artifact and response bodies, credentials, private
   keys, and free-form notes are rejected. the harness makes no provider call,
   loads no skill body, executes no package source, changes no routing, grants
   no authority, and performs no external or host write.

6. root and byte reconciliation

   the receipt binds the protocol receipt, package receipt bytes, package
   digest, fixture bytes, schema bytes, runtime contract, normalized decision,
   host set, and focused/full verification counts. the builder refuses to
   overwrite changed generated evidence.

## fresh verification

- focused adapter conformance suite: 6 tests, 6 passed, 0 failed, 0 skipped
- full repository suite: 828 tests, 827 passed, 0 failed, 1 skipped, exit 0
- deterministic builder: passed and reproduced the receipt coordinates above
- JSON parsing and module syntax checks: passed
- `git diff --check`: passed
- package and protocol roots: read from the exact frozen repository files

commands run:

```powershell
node --test tests\godskill-adapter-conformance.test.mjs
node scripts\build-godskill-adapter-conformance-v1.mjs
node --test --test-reporter=spec
```

## source coordinates

all hashes are SHA-256:

| path | hash |
| --- | --- |
| `src/godskill-adapter-conformance.mjs` | `5065f267132e28a28679da1d144132631b2be0d6429c8e4ddc5a85f85bce5954` |
| `scripts/build-godskill-adapter-conformance-v1.mjs` | `80a34666d491ae4115dae4f49b09c93df60d0aa41bfc442bd10c19be3397f268` |
| `schemas/godskill-adapter-conformance-v1.schema.json` | `b2d9fc43a649a769c44ebd5436c9577a2a972da81e13b7004b58d63e40fa33c0` |
| `runtime/godskill-adapter-conformance-v1.md` | `60327314bacdef6402731a39c458752e395888e85dea7286a821c41a86b73655` |
| `artifacts/godskill-adapter-conformance-v1/reference.json` | `903d43ae8621acd865314a7f52dbf32a95f1bdb62943219ec10dc01dd06ea6bf` |
| `receipts/godskill-adapter-conformance-v1.json` | `9662ab43fe82a3e7fe9456212fbfe378db46451d1f2cd92c66f860ada84c84cd` |
| `tests/godskill-adapter-conformance.test.mjs` | `ea33a0ad059a55c8f3ca6778c692f5c554eca0ec51e1a581a6565d81bdcc1f8d` |

## proof limits

this certificate proves deterministic bounded metadata conformance for one
fixture. it does not prove real host transport behavior, model equivalence,
provider quality, host security, credential handling, review quality,
production adoption, universal superiority, external authorization, or
Lunari readiness. any future host adapter must be evaluated separately against
this contract and must not treat this fixture as proof of live integration.
