---
name: confirmed-destructive-reconstruction
description: Use when a broken artifact requires an explicitly authorized destructive reconstruction and the target, independent backup, postconditions, and rollback path can be made exact.
---

# Confirmed destructive reconstruction

Use this entrypoint for a repair that may overwrite or remove part of a local artifact after the user has authorized that specific operation. The method binds the authorization to an exact target and preserves a recoverable path; it does not turn a vague repair request into permission to delete.

## Resolve the target

Display the absolute target only in the working receipt, then reduce it to a validated, bounded path and operation description. Reject roots, broad globs, unresolved variables, symlink escapes, and a target that changed after confirmation. Record the desired post-reconstruction state and the invariants that must remain true.

Create or identify an independent backup outside the target. Verify its membership, bytes or digests, metadata needed for restoration, and available restore procedure. If the backup is incomplete, stale, on the same failure boundary, or cannot be restored without guessing, stop before mutation.

## Stage before mutation

1. Build a non-destructive preview from the desired state. Show additions, removals, replacements, and any change to permissions, links, ownership, or package metadata.
2. Recheck the target, backup digest, and operation against the user's confirmation immediately before the write. Confirmation for one path or action does not expand to neighbors or later cleanup.
3. Apply the smallest mutation through a staged or transactional path where possible. Preserve the original until the new artifact passes structural checks.
4. Verify postconditions independently: expected files or records exist, forbidden remnants are absent, digests and references reconcile, and the artifact opens or validates under the requested contract.
5. If a postcondition fails, stop using the failed artifact and execute the declared rollback. Verify the restored digest and record whether rollback was complete.

Keep the preview, backup, mutation, verification, and rollback receipts distinct. A successful reconstruction is not evidence that the original diagnosis was correct beyond the checked invariants. If the repair can be achieved without destructive mutation, prefer that route while preserving the user's requested outcome.

## Finish and limits

Finish with either a verified reconstruction receipt or a typed refusal naming the failed gate. Include target identity, backup evidence, exact operation, postcondition results, rollback result, and unresolved risk. Do not claim safety for an uninspected external link, device, production system, or broad filesystem.

## Common failure modes

- Confirming a directory name while the real operation uses a recursive wildcard.
- Backing up into the target or relying on a backup that was never restored once.
- Comparing only file counts after a reconstruction.
- Reusing an old confirmation after the target or desired state changed.
- Continuing after one invariant fails because the output “looks close.”
