---
name: release-script-safety
description: "Use when a release script must be made idempotent, inspectable, dry-runnable, and fail-closed. Do not use to publish, tag, deploy, or access credentials."
---

# Release script safety

Engineer a local release procedure that proves inputs, ordering, rollback, and noninteractive failure behavior without performing external release effects.

## use when

- Harden a release script before any external execution.
- Add dry-run idempotency rollback and failure checks to local release automation.

## do not use when

- Publish or deploy a release.
- Use secrets or mutate remote repositories and registries.

## inputs

- release script and repository state
- artifact version and ordering contract
- rollback and dry-run expectations

## preconditions

- external commands can be stubbed or disabled
- the intended artifact and version rules are explicit

## workflow

1. inventory commands effects and implicit state
2. separate pure preparation from external adapters
3. add preflight dry-run idempotency and rollback guards
4. test interrupted repeated and malformed-state paths locally

## outputs

- fail-closed local release script
- dry-run interruption idempotency and rollback evidence

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: local-read, repository-write
allowed effects: read, write
forbidden effects: advertising-spend, arbitrary-file-read, database-installation, external-deployment, external-load-generation, financial-commitment, unconfirmed-storage-mutation

## failure behavior

- stop before the first external effect
- leave a typed recovery state after interruption

## exclusions

- does not push tags packages or deployments
- does not read credentials

## termination

Stop when dry-run, repeated-run, interruption, stale-state, and rollback fixtures pass without external mutation.
