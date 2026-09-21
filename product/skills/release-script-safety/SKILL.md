---
name: release-script-safety
description: Use when a release procedure must be made inspectable, dry-runnable, idempotent, interruptible, and fail-closed before authorized external effects.
---

# Release script safety

Use this entrypoint to harden a release procedure while keeping preparation, verification, and external adapters distinguishable. It supports an authorized release when the task includes that effect, but the safety review itself never assumes publication is wanted.

## Inventory the procedure

List commands, files, credentials or environment inputs, generated artifacts, version sources, tags, registries, deployment targets, locks, and implicit state. Classify each action as read, prepare, local write, or external effect. Make the intended artifact, version, source revision, and ordering contract explicit.

## Build a fail-closed path

1. Separate pure manifest and artifact preparation from adapters that publish, tag, deploy, or mutate a remote system. Make the adapter boundary visible.
2. Add preflight checks for clean or intentionally dirty state, version consistency, artifact existence, digest, target identity, required tool version, and any release note or approval input.
3. Make reruns idempotent. Use a durable operation key or a state record that can distinguish not-started, prepared, applied, partially applied, and confirmed states. Never assume a missing log means no external effect happened.
4. Implement dry-run output that enumerates the intended effects without invoking them. Stub or disable external commands in tests.
5. Define interruption recovery and rollback for each step. After a failure, leave a typed state that tells the next run what was prepared, what may have happened, and what must be reconciled before retry.
6. Run malformed-version, stale-artifact, repeated-run, interrupted-run, adapter-failure, and rollback scenarios. Verify that the first external effect is preceded by every preflight and that a failure cannot silently continue.

If the user authorizes actual publication, execute the already-reviewed adapter with the declared target and preserve its provider receipt. A prepared dry run, a local artifact, and a remote release are different outcomes.

## Finish and limits

Return the command/effect inventory, dry-run transcript, state transitions, artifact and version digests, interrupted and repeated-run results, rollback evidence, and any unverified adapter behavior. Finish when the procedure is inspectable and bounded for the intended release path. Do not read or print credentials.

## Common failure modes

- Treating a successful local build as proof that a remote publish succeeded.
- Re-running after a timeout without reconciling possible partial effects.
- Allowing a version flag to disagree with the artifact metadata.
- Hiding network or registry calls inside a helper named “prepare.”
- Testing only the happy path with real credentials.
