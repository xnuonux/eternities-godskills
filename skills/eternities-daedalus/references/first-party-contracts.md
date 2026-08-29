# Goal-proof ledger contract

Represent each material completion claim as a row with claim id, state, bound probe, evidence reference, coverage boundary, and open-edge status.

- `complete` requires a passing probe and exact evidence reference;
- failed or absent proof leaves the claim open;
- a bounded or capped scan declares its coverage limit;
- a passing probe establishes only its declared boundary;
- unresolved edges survive handoff rather than being rounded into completion.

The executable reference is `src/lunari-first-party-contracts.mjs`.
