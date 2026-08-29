# Coordination and delegation contracts

Use these contracts only when Forge already owns the consequential multi-stage route.

## Contended-key lease

- lease the smallest shared integration key, not the entire workspace;
- allow disjoint path claims to proceed concurrently;
- reject a second active lease for the same key;
- permit reacquisition only after expiry or explicit release;
- refresh repository or integration state immediately before integration and reject stale state.

## Delegation envelope

Before dispatch, validate a versioned envelope containing parent trace, objective, input artifacts, output schema, allowed effects, budget, boundaries, and termination condition. Unsupported versions, missing fields, or effects outside the caller's authority fail closed. A valid return receipt remains bound to the parent trace.

The executable reference is `src/lunari-first-party-contracts.mjs`. Its fixture proves contract behavior, not live concurrency, model independence, or external effects.
