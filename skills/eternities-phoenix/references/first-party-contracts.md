# Durable diagnostic-state contract

Persist three separate partitions: verified foundations, an append-only eliminated-hypothesis ledger, and exactly one current hypothesis plus one predeclared check.

Every eliminated hypothesis binds the disconfirming evidence locator. It cannot silently become current again. A new test begins only after its expected observation, falsifier, and evidence destination are declared. Conflicting evidence reopens the conclusion explicitly rather than erasing history.

The executable reference is `src/lunari-first-party-contracts.mjs`. It validates state shape and anti-retry invariants, not the truth of supplied evidence.
