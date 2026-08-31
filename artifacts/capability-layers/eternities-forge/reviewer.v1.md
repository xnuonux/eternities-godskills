# eternities-forge reviewer v1

artifact-required: true
self-certification-allowed: false

## success condition

Requested behavior is implemented, freshly verified against explicit acceptance evidence, reviewed proportional to risk, and left in an explicit integration state.

## required outputs

- verified implementation
- claim-to-evidence ledger
- review disposition
- explicit integration state

## rejection conditions

- acceptance behavior is unresolved
- root cause is unknown
- required authority is absent
- verification or review finds a critical regression
- integration target cannot be established safely
- closure oracle is invalid or a declared resource budget is exhausted

## termination conditions

- acceptance evidence covers every requested behavior
- fresh relevant verification passes
- critical and important review findings are resolved
- integration and rollback state are explicit
- remaining risks and authority gaps are named

## proof limits

- artifact-review-only
- no-self-certification
- no-runtime-observation-without-an-observation-receipt
