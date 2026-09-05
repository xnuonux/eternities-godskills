# provider-neutral adapter discovery v1

the discovery resolver is an opt-in read-only boundary above the certified
adapter sdk. it receives a verified capability matrix and a closed host
metadata profile, then looks for one matrix entry whose complete host profile is
identical. a host family label by itself is never sufficient.

## exact selection

`discoverAdapter` verifies the matrix first and hashes the supplied host
profile. if exactly one entry has the same profile and its conformance
projection is `conformant`, the result is `selected` and carries the matrix,
host-profile, adapter, entry, projection, and normalized-decision identities.
the result carries no host profile prose or mission content.

if the profile has drifted, no matching entry exists, or the exact entry is
unsupported, the result is `unsupported` with one explicit reason and null
adapter identity. a changed host version, model family, context budget,
reasoning tier, review state, effect set, protocol support, or secret-isolation
state therefore cannot silently reuse an older adapter proof.

`verifyAdapterDiscovery` repeats matrix verification and exact selection from
the supplied matrix and host profile, then compares the complete result. a
forged result, stale digest, mismatched profile, or changed matrix fails closed.

## authority, privacy, and recovery

discovery grants no effects and is not a routing or activation decision. it does
not choose a model, disclose a skill body, invoke an adapter, call a provider,
load package source, execute code, schedule work, or perform an external write.
requested effects remain governed by the matrix projection and the host-owned
authority boundary.

prompts, mission text, artifacts, responses, credentials, private keys, and
free-form notes are rejected. functions and non-plain runtime values are also
rejected. a recovering host must reconstruct the matrix and host profile from
trusted bytes and rerun verification rather than trusting a serialized
selection alone.

## proof limits

the v1 fixture proves local exact-match discovery over one certified Codex
fixture host and the provider-neutral SDK matrix. it does not prove live Codex,
Claude Code, Godagents, MCP, or local-model adoption; model or provider
quality; routing correctness; tool or host security; network behavior; or
production readiness. selection remains a declarative identity result, not an
instruction to launch a host.

rebuild the reference result and receipt with:

```text
node scripts/build-godskill-adapter-discovery-v1.mjs
```

the builder refuses to overwrite changed evidence. exact roots and local proof
limits are recorded in `receipts/godskill-adapter-discovery-v1.json`.
