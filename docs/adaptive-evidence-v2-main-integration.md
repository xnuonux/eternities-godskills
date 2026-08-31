# adaptive evidence v2 main integration

recorded: 2026-08-31

disposition: `verified-main-integration`

proof level: `single-task-single-model-engine-canary`

## integration event

The certified adaptive evidence v2 implementation was integrated into `main`
by a pure fast-forward and published to `origin/main` at
`3ece716d779b9af2198bd40c558a6879e5d2b890`.

The integrated range is:

- frozen base: `f6b828ffbea29cf28cba751d4438e5c41a8deb2d`
- certified implementation: `3ece716d779b9af2198bd40c558a6879e5d2b890`
- implementation tree: `d1bee038d618265adf33d9c48c48797d74a7cfcc`
- source branch: `feat/adaptive-evidence-v2`
- integration mode: `fast-forward-only`
- divergence before integration: zero commits on `main`, thirteen commits on
  the certified branch

This record is intentionally separate from
`docs/adaptive-evidence-v2-certification.md`. That certificate preserves the
historical pre-integration state and has SHA-256
`e8644e2f6d61e33919e230dac22fdec049d2383315f8bd70f69fabd440f3488d`.

## fresh merged-state verification

Verification was rerun from `main` after the fast-forward and before
publication:

- two adaptive evidence v2 rebuilds produced byte-identical checked outputs
- twenty checked files changed zero bytes across the second rebuild
- logical receipt digest:
  `2ed01045d7e25e1c737ef375ae472757edff1459fa5c9dd49ec77572f33f6a8d`
- receipt file SHA-256:
  `7f84e36cd9d02d4c93f2348500d16c6fe93b8b357d1d97c271de418cdd29b56a`
- full repository suite: 700 passed, 0 failed, 0 skipped, 0 cancelled
- changed-surface syntax checks: 10 passed
- `git diff --check`: passed
- working tree before publication: clean

The coordinated v1 paths remain byte-identical:

| path | git blob |
|---|---|
| `src/adaptive-activation.mjs` | `3f263e2f68f006b42bda33805eca09add9d74727` |
| `policies/adaptive-activation.v1.json` | `1bdc9636284589f2a335d65efa8e61e815d01bbb` |
| `artifacts/adaptive-activation/evidence.v1.json` | `9b9f77b3acbddc406da1c112b3a3cb3376c4960a` |

## preserved boundary

Integration changes repository availability, not the certified proof level.
The Aegis matrix remains bounded negative evidence. It does not prove
universal quality, authorize method promotion, install a global activation
default, connect Godagents, or integrate Lunari. The deterministic fixture
private key remains fixture-only and is not a production authority.

This document advances `main` after the exact implementation publication. It
does not alter the certified engine, policy, evidence, matrix, receipt, or
protected v1 bytes.
