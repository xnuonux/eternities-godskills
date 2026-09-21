# Use report

## Loaded guidance

- Supplied `method.md` (read completely and applied to the decision rules).
- Host skill `test-driven-development` (read completely and followed for the
  implementation/test cycle).
- Host reference `writing-good-tests.md` (read before the final test additions).

No other skills, agents, dependencies, network resources, checkpoints, source
reports, corpus material, or other worker directories were accessed.

## Assumptions

- Identity values and sample IDs are non-empty opaque strings; duplicate sample
  IDs are treated as malformed declarations.
- An empty `fitIds` or `evaluationIds` array is known-empty and valid, while a
  missing declaration is unknown and blocks use.
- Resume requires the caller to declare `model` in `requiredState`, plus every
  other state component it needs; every declared component must be explicitly
  `true` in the checkpoint manifest.
- Warm-start requires a complete, verified checkpoint with model weights and a
  matching architecture. Differences in other identities are treated as the
  deliberate new run described by the request.
- A cache must declare the four mandatory dependencies. Architecture and
  environment are checked only when the cache declares them as dependencies.

## Checks

- `node --test .\guard.test.mjs`
- Result: 15 passed, 0 failed.
- The initial cache test was observed failing before `guard.mjs` existed, then
  passed after the minimal implementation; the expanded invalidation and
  ambiguity cases were run to green afterward.

## Unresolved limits

- The guard trusts the caller's boolean `verified` field and does not compute or
  inspect artifact digests or checkpoint contents.
- It does not execute a training interruption/resume comparison, measure
  reproducibility, or validate framework-specific state semantics.
- It performs no filesystem, network, artifact-loading, evaluation, or training
  work; those remain outside this bounded manifest decision.
