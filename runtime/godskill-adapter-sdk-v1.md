# provider-neutral adapter sdk v1

the adapter sdk is an opt-in capability-side contract for universal agents. it
gives a host adapter a closed descriptor, projects a digest-only mission through
the certified conformance core, and compares the resulting host projections in
a capability matrix.

## contract

an adapter descriptor names one known host family and the exact protocol it
targets. it carries only bounded metadata, a supported-effect ceiling, supported
reasoning tiers, a context ceiling, review availability, and the current host
profile. its digest binds those bytes. the descriptor cannot grant an effect or
claim a host feature that the profile does not expose.

`projectAdapterMission` accepts only a descriptor and a mission containing
identifiers and sha-256 references for the objective, package, and package
receipt. it delegates host authority intersection and unsupported-precondition
handling to `godskill-adapter-conformance.mjs`. a host with a missing package
protocol, incompatible protocol version, or non-isolated secrets produces an
explicit unsupported projection with no decision.

## capability matrix

`buildCapabilityMatrix` accepts a canonical, unique adapter list and emits one
entry per adapter. each entry contains the signed descriptor, the exact
conformance projection, and an entry digest. the matrix reports:

- `equivalent` when every projection is conformant and all normalized decisions
  are identical;
- `mixed` when at least one projection is conformant but the projections differ
  or another host is unsupported;
- `unsupported` when no projection is conformant.

only the equivalent case carries a semantic decision. mixed and unsupported
matrices carry `null`, so an adapter comparison cannot silently turn partial
support into a shared outcome.

## lifecycle and recovery

the sdk is a pure derivation boundary. a host may persist the descriptor and
matrix as inert evidence, replay them against the same roots, and reject stale
or forged bytes by digest. a recovering host must reconstruct the mission and
descriptor from trusted bytes and verify the matrix before using it as an input
to a later host-owned decision. the sdk does not persist work, deduplicate
executors, retry providers, or schedule agents.

## privacy and authority

raw prompts, mission prose, artifacts, responses, credentials, private keys, and
free-form notes are rejected. functions and non-plain runtime objects are also
rejected. the matrix records no raw mission content and has no path for secret
transport. requested effects are narrowed by the existing conformance core;
neither an adapter descriptor nor a matrix can widen authority.

the sdk does not load a skill body, import package source, call a provider,
select a model, change routing, enable a host, invoke a tool, or perform an
external write. it remains outside the default package export surface and does
not replace the certified root sdk or current `SKILL.md` consumer.

## proof limits

the v1 fixture proves deterministic local descriptor construction, bounded
mission projection, explicit unsupported handling, and matrix semantics for the
declared host families. it does not prove live Codex, Claude Code, Godagents,
MCP, or local-model adoption; model or provider quality; equivalent tool
security; network behavior; exactly-once execution; or production deployment
readiness.

rebuild the reference fixture and receipt with:

```text
node scripts/build-godskill-adapter-sdk-v1.mjs
```

the builder refuses to overwrite changed evidence. the exact roots and local
verification counts are recorded in
`receipts/godskill-adapter-sdk-v1.json`.
