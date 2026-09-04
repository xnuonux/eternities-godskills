# `.godskill` package v1 certification

status: verified build

this certificate covers the inert directory package for `eternities-aegis`
capability version 4. it does not activate the package or change global agent
routing.

## exact coordinates

- protocol: `eternities-godskill-package-v1`
- package: `artifacts/godskill-packages/eternities-aegis-v1`
- package digest: `8510b02237963364d4246bd55676ff8674ad83d4d56f68381d6c3bc252e812dd`
- manifest SHA-256: `b4462bedea0ef49a8ecda75f7cbde597dbe116fc75040468ee92118052163dc7`
- policy SHA-256: `dd78a05344a5c9bf5cef8c243b8eb927db8cf0e75aae1fecf3286b41a51e4cee`
- layer bundle digest: `06eac79d2408c457eaabb7cc766982aaba6836b75ec8c124630b94d119b9b5a9`
- content files: 15
- promotion evidence SHA-256: `7bc9072d449af41de216d4fde38baa34e334b8588a0339535b4b496fe805ab0e`

## verification matrix

| check | result |
| --- | --- |
| deterministic manifest construction | pass |
| exact package and policy trust roots | pass |
| canonical manifest and policy JSON | pass |
| exact recursive package inventory | pass |
| source byte and provenance binding | pass |
| certified capability-layer re-verification | pass |
| path escape and unsafe path rejection | pass |
| duplicate path and role rejection | pass |
| extra and missing file rejection | pass |
| byte substitution and truncation rejection | pass |
| stale package and policy digest rejection | pass |
| protocol and authority drift rejection | pass |
| attestation subject drift rejection | pass |
| symbolic-link refusal | implemented, skipped on this account because link creation was unavailable |
| package source execution | not performed by verifier |

the focused package suite reported 12 tests, 11 passes, 0 failures, and 1
environment skip. the fresh repository-wide suite reported 803 tests, 802
passes, 0 failures, and 1 environment skip. the verifier returned `valid: true`
only after all package bytes, the Aegis layer ABI, and the first-party source
paths matched.

## proof limits

this is an inert package and verification milestone. no global activation,
model routing change, external write, source execution, or authority expansion
was performed. a future provider adapter must consume this receipt as evidence,
then perform its own authority intersection and runtime observation.
