# provider-neutral Godskills observatory v1

the observatory is a read-only, digest-only evidence view over the frozen
provider-neutral protocol. it is transport- and model-neutral. it does not
load a skill body, choose a provider, call a model, grant authority, execute
source, or perform a host or external write.

## exact sequence

```text
verify the trusted protocol receipt root
verify the complete or partial protocol message prefix
compare its chain digest to the externally expected digest
derive one body-free replay observation
compare bounded counterfactual observations with one shared identity
extract raw-success candidates as untrusted proposals only
cluster repeated bounded failure identities
attribute disclosed layer bytes and optional host metrics
assemble a digest-only observatory snapshot
verify source record digests and the fixed retention policy
```

replay is the first gate. changed or stale protocol inputs are rejected before
any derived observation is returned. a partial prefix remains incomplete
evidence and cannot be represented as a completed lifecycle decision.

## record boundaries

- `ReplayObservation` records the protocol root, chain identity, message
  digests, derived decision digest, effect sets, and completeness.
- `CounterfactualView` compares two variants under one exact mission, task,
  capability, model-profile, and environment identity. it records bounded
  scores, regressions, bytes, and deltas, but it is not a promotion decision.
- `RawSuccessCandidate` records a raw success as an untrusted candidate with
  `promotionEligible: false` and `trusted: false`.
- `FailureClusterReport` groups repeated failure codes by scope and variant,
  preserving observation digests and critical counts.
- `DisclosureCostEntry` binds layer, mode, content digest, disclosed bytes,
  tokens, latency, and optional monetary metrics to one protocol disclosure.
- `ObservatorySnapshot` indexes source record digests under one protocol root
  and exposes a fixed digest-only retention policy.

all envelopes and nested objects are closed. raw prompts, mission text,
artifact bodies, response bodies, credentials, private keys, and free-form
notes are rejected. absence of a raw body is not silently converted into a
redaction success.

## retention and recovery

the v1 policy is append-only and digest-only. raw mission and artifact content
are not stored, and learned candidates cannot auto-promote into a trusted
skill, evidence row, profile, or activation mode. snapshot verification
requires the exact source record set and protocol receipt root, so stale or
forged read models fail closed. the core protocol, package verifier, and
activation v1 path remain the rollback boundary if the observatory is disabled.

optional observability failure must not fabricate success or change a protocol
decision. hosts may ignore the derived snapshot and continue through the
previous certified path. required receipt persistence belongs to the host
adapter and must fail closed when it is promised but unavailable.

## proof limits

this boundary proves deterministic replay, digest and lineage checks, bounded
counterfactual arithmetic, non-promotable candidate extraction, deterministic
failure grouping, disclosure-cost attribution, and digest-only snapshot
integrity for the tested records. it does not prove model quality, causation,
universal superiority, field behavior, external authorization, provider
equivalence, privacy against a host that controls the inputs, or production
retention compliance.
