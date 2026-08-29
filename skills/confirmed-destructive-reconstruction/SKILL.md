---
name: confirmed-destructive-reconstruction
description: "Use when a broken local artifact can only be reconstructed through an explicitly confirmed destructive step with backup and rollback proof. Do not use on ambiguous targets."
---

# Confirmed destructive reconstruction

Stage and verify a recoverable reconstruction so destructive mutation occurs only after exact target confirmation, backup validation, and rollback rehearsal.

## use when

- Reconstruct a confirmed broken local artifact after backup verification.
- Plan a destructive local repair with exact target and rollback gates.

## do not use when

- Delete or overwrite an ambiguous path.
- Proceed without a verified backup and explicit destructive confirmation.

## inputs

- exact broken target and desired state
- verified independent backup
- explicit destructive authorization and rollback plan

## preconditions

- the destructive target is exact and user-confirmed
- a complete restorable backup exists outside the target

## workflow

1. resolve and display the exact target
2. verify backup completeness and restoration path
3. stage a non-destructive reconstruction preview
4. apply only the confirmed mutation and verify or roll back

## outputs

- reconstructed local artifact or typed refusal
- backup mutation verification and rollback receipt

## authority and effects

capability does not grant authority. the host must grant every required authority and effect separately.

required authority: artifact-read, destructive-local-write
allowed effects: read, write
forbidden effects: broad-recursive-target, external-write, unconfirmed-delete

## failure behavior

- stop when target resolution or backup verification changes
- roll back when post-reconstruction invariants fail

## exclusions

- does not infer destructive permission from a repair request
- does not operate on roots globs or unresolved variables

## termination

Stop after verified reconstruction and rollback evidence, or before mutation with a precise failed gate.
